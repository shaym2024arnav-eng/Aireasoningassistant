const { runReasoningPipeline } = require("../services/reasoningPipeline");
const { createFakeLLM } = require("./fakeLLM");

const noRetrieve = jest.fn();

describe("runReasoningPipeline", () => {
    beforeEach(() => noRetrieve.mockReset());

    test("runs every agent once when the verifier passes first time", async () => {
        const llm = createFakeLLM();
        const result = await runReasoningPipeline("A train goes 120 km in 2 h. Speed?", {
            llm,
            retrieve: noRetrieve
        });

        expect(llm.calls.map((c) => c.agent)).toEqual([
            "router",
            "decomposer",
            "planner",
            "solver",
            "verifier",
            "explainer"
        ]);
        expect(result.answer).toBe("60 km/h");
        expect(result.verification).toEqual({
            passed: true,
            issues: [],
            confidence: 0.95,
            revisions: 0
        });
        expect(result.usage).toEqual({ promptTokens: 60, completionTokens: 30 });
        expect(noRetrieve).not.toHaveBeenCalled();
    });

    test("retries the solver with verifier feedback until it passes", async () => {
        const llm = createFakeLLM({
            solver: [
                { working: "120 * 2", answer: "240 km/h" },
                { working: "120 / 2", answer: "60 km/h" }
            ],
            verifier: [
                { passed: false, issues: ["Multiplied instead of dividing"], confidence: 0.1 },
                { passed: true, issues: [], confidence: 0.9 }
            ]
        });

        const result = await runReasoningPipeline("Speed?", { llm, retrieve: noRetrieve });

        expect(llm.countFor("solver")).toBe(2);
        expect(result.answer).toBe("60 km/h");
        expect(result.verification.revisions).toBe(1);
        expect(result.attempts).toEqual([
            { answer: "240 km/h", passed: false, issues: ["Multiplied instead of dividing"] },
            { answer: "60 km/h", passed: true, issues: [] }
        ]);

        const retryPrompt = llm.calls.filter((c) => c.agent === "solver")[1].user;
        expect(retryPrompt).toContain("Multiplied instead of dividing");
        expect(retryPrompt).toContain("240 km/h");
    });

    test("stops after maxRevisions and reports the answer as unverified", async () => {
        const llm = createFakeLLM({
            verifier: { passed: false, issues: ["Still wrong"], confidence: 0.2 }
        });

        const result = await runReasoningPipeline("Hard one", {
            llm,
            retrieve: noRetrieve,
            maxRevisions: 2
        });

        expect(llm.countFor("solver")).toBe(3);
        expect(result.verification.passed).toBe(false);
        expect(result.verification.revisions).toBe(2);
        expect(result.verification.issues).toEqual(["Still wrong"]);
    });

    test("gives generic feedback when the verifier fails without issues", async () => {
        const llm = createFakeLLM({
            verifier: [
                { passed: false, issues: [], confidence: 0.3 },
                { passed: true, issues: [], confidence: 0.8 }
            ]
        });

        await runReasoningPipeline("Q", { llm, retrieve: noRetrieve });

        const retryPrompt = llm.calls.filter((c) => c.agent === "solver")[1].user;
        expect(retryPrompt).toContain("Re-check every step");
    });

    test("retrieves knowledge when the router asks for it and passes it to agents", async () => {
        const llm = createFakeLLM({
            router: { route: "factual", needsKnowledge: true, searchQuery: "Eiffel Tower" }
        });
        const retrieve = jest.fn().mockResolvedValue({
            title: "Eiffel Tower",
            content: "The Eiffel Tower was completed in 1889."
        });

        const result = await runReasoningPipeline("When was the Eiffel Tower built?", {
            llm,
            retrieve
        });

        expect(retrieve).toHaveBeenCalledWith("Eiffel Tower");
        expect(result.sourceTitle).toBe("Eiffel Tower");
        expect(result.routeType).toBe("factual");

        for (const agent of ["decomposer", "solver", "verifier"]) {
            const call = llm.calls.find((c) => c.agent === agent);
            expect(call.user).toContain("completed in 1889");
        }
        expect(result.trace.map((t) => t.agent)).toContain("retrieval");
    });

    test("continues without knowledge if retrieval finds nothing", async () => {
        const llm = createFakeLLM({
            router: { route: "factual", needsKnowledge: true, searchQuery: "zzzz" }
        });
        const retrieve = jest.fn().mockResolvedValue({ title: null, content: null });

        const result = await runReasoningPipeline("What is zzzz?", { llm, retrieve });

        expect(result.sourceTitle).toBeNull();
        expect(llm.calls.find((c) => c.agent === "solver").user).not.toContain("Reference knowledge");
    });

    test("propagates an LLM failure", async () => {
        const llm = createFakeLLM({ planner: new Error("Groq down") });
        await expect(runReasoningPipeline("Q", { llm, retrieve: noRetrieve })).rejects.toThrow(
            "Groq down"
        );
    });

    test("requires an llm client", async () => {
        await expect(runReasoningPipeline("Q", {})).rejects.toThrow("requires an llm client");
    });
});