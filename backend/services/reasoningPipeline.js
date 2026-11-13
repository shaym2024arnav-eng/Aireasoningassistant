const routerAgent = require("../agents/routerAgent");
const decomposerAgent = require("../agents/decomposerAgent");
const plannerAgent = require("../agents/plannerAgent");
const solverAgent = require("../agents/solverAgent");
const verifierAgent = require("../agents/verifierAgent");
const explainerAgent = require("../agents/explainerAgent");
const getWikipediaKnowledge = require("./wikipediaService");

const DEFAULT_MAX_REVISIONS = 2;
const MAX_KNOWLEDGE_CHARS = 3000;

/**
 * Runs one problem through Router -> (Wikipedia) -> Decomposer -> Planner
 * -> Solver <-> Verifier loop -> Explainer.
 *
 * If the Verifier rejects the Solver's answer, the Solver tries again with
 * the Verifier's issues as feedback, up to maxRevisions times.
 *
 * Dependencies are injected so tests and the eval script can run the
 * whole pipeline against a fake LLM and fake retrieval.
 */
async function runReasoningPipeline(
    problem,
    {
        llm,
        retrieve = getWikipediaKnowledge,
        maxRevisions = DEFAULT_MAX_REVISIONS,
        now = () => Date.now()
    }
) {
    if (typeof llm !== "function") {
        throw new Error("runReasoningPipeline requires an llm client");
    }

    const trace = [];
    const totals = { promptTokens: 0, completionTokens: 0 };

    // Runs one agent, recording its timing and token usage in the trace.
    const step = async (agent, name, input) => {
        const started = now();
        const { output, usage } = await agent(input, llm);

        if (usage) {
            totals.promptTokens += usage.prompt_tokens || 0;
            totals.completionTokens += usage.completion_tokens || 0;
        }

        trace.push({ agent: name, ms: now() - started });
        return output;
    };

    // 1. Router
    const routing = await step(routerAgent, "router", { problem });

    // 2. Knowledge retrieval (only when the router thinks it helps)
    let source = { title: null, content: null };

    if (routing.needsKnowledge) {
        const started = now();
        source = (await retrieve(routing.searchQuery)) || source;
        trace.push({ agent: "retrieval", ms: now() - started });
    }

    const knowledge = source.content ? source.content.slice(0, MAX_KNOWLEDGE_CHARS) : "";

    // 3. Decomposer and 4. Planner
    const subProblems = await step(decomposerAgent, "decomposer", {
        problem,
        route: routing.route,
        knowledge
    });

    const plan = await step(plannerAgent, "planner", {
        problem,
        route: routing.route,
        subProblems
    });

    // 5-6. Solver <-> Verifier loop
    const attempts = [];
    let solution;
    let verification;
    let feedback = [];

    for (let attempt = 0; attempt <= maxRevisions; attempt++) {
        solution = await step(solverAgent, "solver", {
            problem,
            plan,
            knowledge,
            feedback,
            previousAnswer: solution?.answer
        });

        verification = await step(verifierAgent, "verifier", {
            problem,
            plan,
            solution,
            knowledge
        });

        attempts.push({
            answer: solution.answer,
            passed: verification.passed,
            issues: verification.issues
        });

        if (verification.passed) break;

        feedback = verification.issues.length
            ? verification.issues
            : ["The answer could not be verified as correct. Re-check every step."];
    }

    // 7. Explainer
    const explanation = await step(explainerAgent, "explainer", {
        problem,
        solution,
        verification
    });

    return {
        routeType: routing.route,
        breakdown: subProblems,
        plan,
        solution: solution.working
            ? `${solution.working}\n\nAnswer: ${solution.answer}`
            : solution.answer,
        answer: solution.answer,
        verification: {
            passed: verification.passed,
            issues: verification.issues,
            confidence: verification.confidence,
            revisions: attempts.length - 1
        },
        attempts,
        finalAnswer: explanation,
        sourceTitle: source.title || null,
        sourceContent: source.content || null,
        trace,
        usage: totals
    };
}

module.exports = { runReasoningPipeline, DEFAULT_MAX_REVISIONS };