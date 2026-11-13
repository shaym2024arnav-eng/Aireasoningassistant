/**
 * Compares the multi-agent pipeline against a single direct LLM call on
 * problems with known answers.
 *
 * Usage (from backend/):
 *   npm run eval                     # all 30 problems
 *   npm run eval -- --limit 10       # first 10 problems only
 *   npm run eval -- --delay 4000     # wait 4s between problems
 *
 * Writes eval/results.json and prints a summary.
 */
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { createLLMClient } = require("../services/llmClient");
const { runReasoningPipeline } = require("../services/reasoningPipeline");
const { grade } = require("./grade");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i === -1 ? fallback : Number(args[i + 1]);
};

const LIMIT = flag("limit", Infinity);
const DELAY_MS = flag("delay", 2000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Free-tier rate limits return HTTP 429. Instead of counting those as
 * wrong answers, wait and try again (up to 5 times, 15s apart).
 */
function withRateLimitRetry(llm, { waitMs = Number(process.env.EVAL_RATE_LIMIT_WAIT_MS || 15000), maxWaits = 5, log = console.log } = {}) {
    return async (request) => {
        for (let attempt = 0; ; attempt++) {
            try {
                return await llm(request);
            } catch (err) {
                const isRateLimit = /\(429\)|rate limit/i.test(err.message);
                if (!isRateLimit || attempt >= maxWaits) throw err;
                log(`   rate limited, waiting ${waitMs / 1000}s...`);
                await sleep(waitMs);
            }
        }
    };
}

const BASELINE_SYSTEM =
    'Answer the question. Reply with JSON only: {"answer": "<final answer in 1-3 sentences>"}';

async function main() {
    const problems = JSON.parse(
        fs.readFileSync(path.join(__dirname, "problems.json"), "utf8")
    ).slice(0, LIMIT);

    const llm = withRateLimitRetry(createLLMClient());
    const noRetrieval = async () => ({ title: null, content: null });
    const rows = [];

    console.log(`Running ${problems.length} problems...\n`);

    for (const item of problems) {
        const row = { id: item.id, problem: item.problem };

        // 1. Baseline: one direct LLM call
        try {
            const started = Date.now();
            const { data } = await llm({ system: BASELINE_SYSTEM, user: item.problem, temperature: 0 });
            row.baseline = { answer: data.answer, correct: grade(item, data.answer), ms: Date.now() - started };
        } catch (err) {
            row.baseline = { error: err.message, correct: false };
        }

        // 2. Full multi-agent pipeline
        try {
            const started = Date.now();
            const result = await runReasoningPipeline(item.problem, { llm, retrieve: noRetrieval });
            const firstAttempt = result.attempts[0].answer;

            row.pipeline = {
                answer: result.answer,
                correct: grade(item, result.answer),
                firstAttemptCorrect: grade(item, firstAttempt),
                verified: result.verification.passed,
                revisions: result.verification.revisions,
                ms: Date.now() - started
            };
        } catch (err) {
            row.pipeline = { error: err.message, correct: false };
        }

        rows.push(row);

        const mark = (r) => (r.error ? "ERR" : r.correct ? "ok " : "X  ");
        console.log(
            `#${String(item.id).padStart(2)}  baseline ${mark(row.baseline)}  pipeline ${mark(row.pipeline)}` +
            (row.pipeline.revisions ? `  (${row.pipeline.revisions} revision)` : "")
        );

        await sleep(DELAY_MS);
    }

    const n = rows.length;
    const count = (fn) => rows.filter(fn).length;
    const pct = (k) => `${((k / n) * 100).toFixed(1)}%`;
    const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

    const summary = {
        problems: n,
        baselineAccuracy: pct(count((r) => r.baseline.correct)),
        pipelineFirstAttemptAccuracy: pct(count((r) => r.pipeline.firstAttemptCorrect)),
        pipelineFinalAccuracy: pct(count((r) => r.pipeline.correct)),
        fixedByVerifierLoop: count((r) => r.pipeline.correct && r.pipeline.firstAttemptCorrect === false),
        brokenByVerifierLoop: count((r) => !r.pipeline.correct && r.pipeline.firstAttemptCorrect === true),
        verifierCaughtWrongAnswers: `${count((r) => r.pipeline.firstAttemptCorrect === false && r.pipeline.revisions > 0)} of ${count((r) => r.pipeline.firstAttemptCorrect === false)}`,
        verifierFalseRejections: count((r) => r.pipeline.firstAttemptCorrect === true && r.pipeline.revisions > 0),
        averageBaselineMs: avg(rows.map((r) => r.baseline.ms).filter(Boolean)),
        averagePipelineMs: avg(rows.map((r) => r.pipeline.ms).filter(Boolean)),
        errors: count((r) => r.baseline.error || r.pipeline.error),
        provider: process.env.LLM_PROVIDER || "groq",
        ranAt: new Date().toISOString()
    };

    fs.writeFileSync(
        path.join(__dirname, "results.json"),
        JSON.stringify({ summary, rows }, null, 2)
    );

    console.log("\nSummary");
    console.table(summary);
    console.log("Full results written to eval/results.json");
}

if (require.main === module) {
    main().catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
}

module.exports = { withRateLimitRetry };