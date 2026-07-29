const explainerAgent = (
    problem,
    breakdown,
    plan,
    solution,
    verification,
    knowledge
) => {
    const knowledgeSection =
        knowledge &&
        knowledge !==
            "No external Wikipedia knowledge was found for this question."
            ? `
Relevant knowledge:

${knowledge}
`
            : "";

    return `
Question:
${problem}

${knowledgeSection}

Key Points:

${breakdown
    .map(
        (item, index) =>
            `${index + 1}. ${item}`
    )
    .join("\n")}

Reasoning Plan:

${plan
    .map(
        (item, index) =>
            `${index + 1}. ${item}`
    )
    .join("\n")}

Explanation:

${solution}

Verification:

${verification}

Final Summary:

The answer above is based on the retrieved knowledge and a structured reasoning process.
    `.trim();
};

module.exports = explainerAgent;