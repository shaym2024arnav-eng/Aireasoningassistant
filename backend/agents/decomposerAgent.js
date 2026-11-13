const { asStringArray } = require("../utils/normalize");

const SYSTEM = `You are the Decomposer agent in a multi-agent reasoning system.
Break the user's problem into 2-6 smaller sub-problems that, once answered, fully answer the original problem.
Sub-problems must be specific to THIS problem (not generic advice), ordered logically, and each one sentence.
If reference knowledge is provided, use it, but do not copy it.
Reply with JSON only: {"subProblems": ["...", "..."]}`;

const decomposerAgent = async ({ problem, route, knowledge }, llm) => {
    const user = [
        `Problem: ${problem}`,
        `Category: ${route}`,
        knowledge ? `Reference knowledge:\n${knowledge}` : null
    ].filter(Boolean).join("\n\n");

    const { data, usage } = await llm({ system: SYSTEM, user });

    const subProblems = asStringArray(data.subProblems, { max: 6 });

    if (subProblems.length === 0) {
        throw new Error("Decomposer returned no sub-problems");
    }

    return { output: subProblems, usage };
};

module.exports = decomposerAgent;