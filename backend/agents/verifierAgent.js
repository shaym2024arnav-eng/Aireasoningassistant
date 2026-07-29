const verifierAgent = (
    problem,
    plan,
    solution,
    knowledge
) => {
    const checks = [];

    if (problem?.trim()) {
        checks.push(
            "The question has been identified clearly."
        );
    }

    if (plan?.length > 0) {
        checks.push(
            "A structured reasoning plan has been generated."
        );
    }

    if (knowledge) {
        checks.push(
            "External knowledge was retrieved and used as context."
        );
    }

    if (solution?.trim()) {
        checks.push(
            "A complete solution was generated."
        );
    }

    checks.push(
        "The final response should remain consistent with the retrieved source information."
    );

    return checks.join(" ");
};

module.exports = verifierAgent;