const { asStringArray, asConfidence } = require("../utils/normalize");

const SYSTEM = `You are the Verifier agent in a multi-agent reasoning system. You are strict and independent.
Check the Solver's working and answer for:
1. Correctness: re-do any calculation or deduction yourself; check facts against the reference knowledge if given.
2. Completeness: does the answer address every part of the problem?
3. Consistency: does the final answer match the working?
Only list real problems. Do not reject an answer for style.
Reply with JSON only: {"passed": true|false, "issues": ["..."], "confidence": <number 0-1 that the answer is correct>}`;

const verifierAgent = async ({ problem, plan, solution, knowledge }, llm) => {
    const user = [
        `Problem: ${problem}`,
        `Plan:\n${plan.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
        knowledge ? `Reference knowledge:\n${knowledge}` : null,
        `Solver working:\n${solution.working || "(none)"}`,
        `Solver answer:\n${solution.answer}`
    ].filter(Boolean).join("\n\n");

    const { data, usage } = await llm({ system: SYSTEM, user, temperature: 0 });

    const issues = asStringArray(data.issues);
    // A verdict of "passed" with listed issues is contradictory; trust the issues.
    const passed = data.passed === true && issues.length === 0;

    return {
        output: {
            passed,
            issues,
            confidence: asConfidence(data.confidence)
        },
        usage
    };
};

module.exports = verifierAgent;