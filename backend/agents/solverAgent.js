const solverAgent = (
    problem,
    plan,
    knowledge
) => {
    const knowledgeText =
        knowledge &&
        knowledge !==
            "No external Wikipedia knowledge was found for this question."
            ? knowledge
            : "";

    return `
To address the question "${problem}", the following information is relevant:

${knowledgeText}

A structured approach is:

${plan
    .map(
        (step, index) =>
            `${index + 1}. ${step}`
    )
    .join("\n")}

Using the available knowledge and the plan above,
the problem can be analyzed systematically and explained clearly.
    `.trim();
};

module.exports = solverAgent;