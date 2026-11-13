const { asString } = require("../utils/normalize");

const SYSTEM = `You are the Solver agent in a multi-agent reasoning system.
Follow the plan step by step and solve the problem. Show your working for each step.
Use the reference knowledge when provided and do not invent facts that contradict it.
If a Verifier rejected a previous attempt, fix every issue it listed.
Finish with a short, direct final answer.
Reply with JSON only: {"working": "<step-by-step working>", "answer": "<final answer in 1-3 sentences>"}`;

const solverAgent = async ({ problem, plan, knowledge, feedback, previousAnswer }, llm) => {
    const parts = [
        `Problem: ${problem}`,
        `Plan:\n${plan.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
    ];

    if (knowledge) {
        parts.push(`Reference knowledge:\n${knowledge}`);
    }

    if (feedback?.length) {
        parts.push(
            `Your previous answer was: ${previousAnswer}\n` +
            `The Verifier rejected it for these reasons:\n${feedback.map((f) => `- ${f}`).join("\n")}`
        );
    }

    const { data, usage } = await llm({ system: SYSTEM, user: parts.join("\n\n"), maxTokens: 2048 });

    const answer = asString(data.answer);

    if (!answer) {
        throw new Error("Solver returned an empty answer");
    }

    return {
        output: { working: asString(data.working), answer },
        usage
    };
};

module.exports = solverAgent;