const { asString } = require("../utils/normalize");

const SYSTEM = `You are the Explainer agent in a multi-agent reasoning system.
Turn the solved problem into a clear explanation for a student: start with the answer, then explain why in plain language, step by step.
If the Verifier still had unresolved issues, say clearly what is uncertain.
Use short paragraphs or a numbered list. No more than 250 words.
Reply with JSON only: {"explanation": "<the explanation>"}`;

const explainerAgent = async ({ problem, solution, verification }, llm) => {
    const user = [
        `Problem: ${problem}`,
        `Working:\n${solution.working}`,
        `Answer: ${solution.answer}`,
        `Verifier passed: ${verification.passed}`,
        verification.issues.length
            ? `Unresolved issues:\n${verification.issues.map((i) => `- ${i}`).join("\n")}`
            : null
    ].filter(Boolean).join("\n\n");

    const { data, usage } = await llm({ system: SYSTEM, user, temperature: 0.3 });

    const explanation = asString(data.explanation) || solution.answer;

    return { output: explanation, usage };
};

module.exports = explainerAgent;