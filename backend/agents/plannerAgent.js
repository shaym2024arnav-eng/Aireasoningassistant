const { asStringArray } = require("../utils/normalize");

const SYSTEM = `You are the Planner agent in a multi-agent reasoning system.
Given a problem and its sub-problems, write an ordered plan of concrete steps the Solver will follow.
Each step names what to do and which sub-problem it addresses. Keep it to 2-8 steps.
Reply with JSON only: {"steps": ["...", "..."]}`;

const plannerAgent = async ({ problem, route, subProblems }, llm) => {
    const user = [
        `Problem: ${problem}`,
        `Category: ${route}`,
        `Sub-problems:\n${subProblems.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
    ].join("\n\n");

    const { data, usage } = await llm({ system: SYSTEM, user });

    const steps = asStringArray(data.steps, { max: 8 });

    if (steps.length === 0) {
        throw new Error("Planner returned no steps");
    }

    return { output: steps, usage };
};

module.exports = plannerAgent;