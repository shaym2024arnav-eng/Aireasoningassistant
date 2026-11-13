const { asString } = require("../utils/normalize");

const ROUTES = ["factual", "analytical", "planning", "project", "general"];

const SYSTEM = `You are the Router agent in a multi-agent reasoning system.
Classify the user's problem into exactly one category:
- "factual": asks about facts, definitions, history, how something works.
- "analytical": maths, logic, puzzles, comparisons, or anything needing step-by-step calculation or deduction.
- "planning": asks for a roadmap, schedule, study or preparation plan.
- "project": asks how to build, design or develop software or a product.
- "general": anything else.
Also decide whether looking up an encyclopedia article would help answer it.
Reply with JSON only: {"route": "<category>", "needsKnowledge": true|false, "searchQuery": "<short encyclopedia search query or empty string>"}`;

const routerAgent = async ({ problem }, llm) => {
    const { data, usage } = await llm({ system: SYSTEM, user: problem, temperature: 0 });

    const route = ROUTES.includes(data.route) ? data.route : "general";

    return {
        output: {
            route,
            needsKnowledge: data.needsKnowledge === true,
            searchQuery: asString(data.searchQuery) || problem
        },
        usage
    };
};

routerAgent.ROUTES = ROUTES;

module.exports = routerAgent;