const decomposerAgent = (problem, knowledge) => {
    const normalized = problem.toLowerCase();

    const knowledgePreview = knowledge
        ? knowledge.split(". ").slice(0, 3)
        : [];

    if (
        normalized.includes("interview") ||
        normalized.includes("job") ||
        normalized.includes("placement")
    ) {
        return [
            "Identify the target role and required skills",
            "Assess the current skill level",
            "Create a structured preparation roadmap",
            "Practice technical and behavioral questions",
            "Track progress and improve weak areas"
        ];
    }

    if (
        normalized.includes("project") ||
        normalized.includes("build") ||
        normalized.includes("application")
    ) {
        return [
            "Define the main project objective",
            "Identify the required features and technologies",
            "Design the frontend, backend, and database structure",
            "Develop and test the core functionality",
            "Deploy and improve the application"
        ];
    }

    if (knowledgePreview.length > 0) {
        return knowledgePreview.map(
            (item) => item.trim()
        );
    }

    return [
        "Understand the main question",
        "Identify important concepts",
        "Break the topic into smaller parts",
        "Analyze each part using available information",
        "Create a clear final explanation"
    ];
};

module.exports = decomposerAgent;