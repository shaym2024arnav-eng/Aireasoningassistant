const routerAgent = require("../agents/routerAgent");
const decomposerAgent = require("../agents/decomposerAgent");
const plannerAgent = require("../agents/plannerAgent");
const solverAgent = require("../agents/solverAgent");
const verifierAgent = require("../agents/verifierAgent");
const explainerAgent = require("../agents/explainerAgent");
const { asStringArray, asConfidence } = require("../utils/normalize");

// An LLM stub that always returns the given JSON.
const replying = (data) => jest.fn().mockResolvedValue({ data, usage: null });

describe("normalize helpers", () => {
    test("asStringArray strips numbering and bullets", () => {
        expect(asStringArray(["1. First", "2) Second", "- Third", "  "])).toEqual([
            "First",
            "Second",
            "Third"
        ]);
    });

    test("asStringArray splits a newline string", () => {
        expect(asStringArray("a\nb")).toEqual(["a", "b"]);
    });

    test("asStringArray caps length", () => {
        expect(asStringArray(["a", "b", "c"], { max: 2 })).toEqual(["a", "b"]);
    });

    test("asConfidence handles 0-100 scale, strings and junk", () => {
        expect(asConfidence(0.8)).toBe(0.8);
        expect(asConfidence(85)).toBe(0.85);
        expect(asConfidence("0.5")).toBe(0.5);
        expect(asConfidence("high")).toBe(0);
        expect(asConfidence(-1)).toBe(0);
    });
});

describe("routerAgent", () => {
    test("returns a known route", async () => {
        const llm = replying({ route: "factual", needsKnowledge: true, searchQuery: "Photosynthesis" });
        const { output } = await routerAgent({ problem: "What is photosynthesis?" }, llm);
        expect(output).toEqual({ route: "factual", needsKnowledge: true, searchQuery: "Photosynthesis" });
    });

    test("falls back to general for an unknown route and uses the problem as query", async () => {
        const llm = replying({ route: "poetry", needsKnowledge: "yes" });
        const { output } = await routerAgent({ problem: "Hi" }, llm);
        expect(output).toEqual({ route: "general", needsKnowledge: false, searchQuery: "Hi" });
    });
});

describe("decomposerAgent", () => {
    test("includes knowledge in the prompt when given", async () => {
        const llm = replying({ subProblems: ["a", "b"] });
        await decomposerAgent({ problem: "p", route: "factual", knowledge: "KNOW" }, llm);
        expect(llm.mock.calls[0][0].user).toContain("KNOW");
    });

    test("throws when the model returns no sub-problems", async () => {
        await expect(
            decomposerAgent({ problem: "p", route: "general" }, replying({ subProblems: [] }))
        ).rejects.toThrow("no sub-problems");
    });
});

describe("plannerAgent", () => {
    test("returns cleaned steps", async () => {
        const { output } = await plannerAgent(
            { problem: "p", route: "general", subProblems: ["x"] },
            replying({ steps: ["1. Do x", "2. Do y"] })
        );
        expect(output).toEqual(["Do x", "Do y"]);
    });

    test("throws when there are no steps", async () => {
        await expect(
            plannerAgent({ problem: "p", route: "general", subProblems: ["x"] }, replying({}))
        ).rejects.toThrow("no steps");
    });
});

describe("solverAgent", () => {
    test("passes verifier feedback into the prompt on a retry", async () => {
        const llm = replying({ working: "w", answer: "42" });
        await solverAgent(
            { problem: "p", plan: ["s"], feedback: ["Wrong unit"], previousAnswer: "41" },
            llm
        );
        const { user } = llm.mock.calls[0][0];
        expect(user).toContain("Wrong unit");
        expect(user).toContain("41");
    });

    test("throws on an empty answer", async () => {
        await expect(
            solverAgent({ problem: "p", plan: ["s"] }, replying({ working: "w", answer: "" }))
        ).rejects.toThrow("empty answer");
    });
});

describe("verifierAgent", () => {
    const input = { problem: "p", plan: ["s"], solution: { working: "w", answer: "a" } };

    test("passes a clean verdict through", async () => {
        const { output } = await verifierAgent(
            input,
            replying({ passed: true, issues: [], confidence: 0.9 })
        );
        expect(output).toEqual({ passed: true, issues: [], confidence: 0.9 });
    });

    test("treats passed-with-issues as a failure", async () => {
        const { output } = await verifierAgent(
            input,
            replying({ passed: true, issues: ["Step 2 is wrong"], confidence: 0.6 })
        );
        expect(output.passed).toBe(false);
    });

    test("treats a non-boolean verdict as a failure", async () => {
        const { output } = await verifierAgent(input, replying({ passed: "true" }));
        expect(output.passed).toBe(false);
    });
});

describe("explainerAgent", () => {
    test("falls back to the solver answer if the explanation is empty", async () => {
        const { output } = await explainerAgent(
            {
                problem: "p",
                solution: { working: "w", answer: "The answer" },
                verification: { passed: true, issues: [] }
            },
            replying({})
        );
        expect(output).toBe("The answer");
    });

    test("tells the model about unresolved issues", async () => {
        const llm = replying({ explanation: "e" });
        await explainerAgent(
            {
                problem: "p",
                solution: { working: "w", answer: "a" },
                verification: { passed: false, issues: ["Unclear date"] }
            },
            llm
        );
        expect(llm.mock.calls[0][0].user).toContain("Unclear date");
    });
});