const routerAgent = (problem) => {
    const text = problem.toLowerCase().trim();

    const factualKeywords = [
        "what is",
        "who is",
        "who was",
        "when was",
        "where is",
        "explain",
        "define",
        "history of",
        "how does",
        "why does"
    ];

    const planningKeywords = [
        "how can i",
        "how should i",
        "prepare",
        "roadmap",
        "plan",
        "schedule",
        "improve",
        "learn",
        "study"
    ];

    const projectKeywords = [
        "build",
        "create",
        "develop",
        "project",
        "application",
        "website",
        "app"
    ];

    if (
        factualKeywords.some(
            (keyword) => text.startsWith(keyword)
        )
    ) {
        return "factual";
    }

    if (
        projectKeywords.some(
            (keyword) => text.includes(keyword)
        )
    ) {
        return "project";
    }

    if (
        planningKeywords.some(
            (keyword) => text.includes(keyword)
        )
    ) {
        return "planning";
    }

    return "general";
};

module.exports = routerAgent;