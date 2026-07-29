const plannerAgent = (
    problem,
    breakdown,
    knowledge
) => {
    const normalized = problem.toLowerCase();

    if (
        normalized.includes("interview") ||
        normalized.includes("job") ||
        normalized.includes("placement")
    ) {
        return [
            "Identify the target role and important topics",
            "Strengthen core technical fundamentals",
            "Practice coding and problem solving",
            "Revise projects and prepare explanations",
            "Take mock interviews and improve weak areas"
        ];
    }

    if (
        normalized.includes("project") ||
        normalized.includes("build") ||
        normalized.includes("application")
    ) {
        return [
            "Define requirements and expected output",
            "Choose the technology stack",
            "Design the system architecture",
            "Develop the application step by step",
            "Test, debug, and deploy"
        ];
    }

    return breakdown.map(
        (step, index) =>
            `Step ${index + 1}: Analyze ${step}`
    );
};

module.exports = plannerAgent;