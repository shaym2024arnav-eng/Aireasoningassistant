/**
 * A fake LLM client for tests. It looks at the system prompt to work out
 * which agent is calling and returns that agent's scripted reply.
 * Pass an array for an agent to return a different reply on each call.
 */
const AGENT_MARKERS = {
    router: "Router agent",
    decomposer: "Decomposer agent",
    planner: "Planner agent",
    solver: "Solver agent",
    verifier: "Verifier agent",
    explainer: "Explainer agent"
};

const DEFAULT_REPLIES = {
    router: { route: "analytical", needsKnowledge: false, searchQuery: "" },
    decomposer: { subProblems: ["Find the speed", "Convert units"] },
    planner: { steps: ["Divide distance by time", "Convert km/h to m/s"] },
    solver: { working: "120 km / 2 h = 60 km/h", answer: "60 km/h" },
    verifier: { passed: true, issues: [], confidence: 0.95 },
    explainer: { explanation: "The train travels at 60 km/h because 120 / 2 = 60." }
};

function createFakeLLM(overrides = {}) {
    const replies = { ...DEFAULT_REPLIES, ...overrides };
    const counts = {};
    const calls = [];

    const llm = async ({ system, user }) => {
        const agent = Object.keys(AGENT_MARKERS).find((name) =>
            system.includes(AGENT_MARKERS[name])
        );

        if (!agent) throw new Error("Unknown agent prompt");

        calls.push({ agent, user });
        counts[agent] = (counts[agent] || 0) + 1;

        let reply = replies[agent];
        if (Array.isArray(reply)) {
            reply = reply[Math.min(counts[agent] - 1, reply.length - 1)];
        }
        if (reply instanceof Error) throw reply;

        return { data: reply, usage: { prompt_tokens: 10, completion_tokens: 5 } };
    };

    llm.calls = calls;
    llm.countFor = (agent) => counts[agent] || 0;
    return llm;
}

module.exports = { createFakeLLM, DEFAULT_REPLIES };