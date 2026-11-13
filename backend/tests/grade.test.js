const { grade, extractNumbers } = require("../eval/grade");

describe("eval grader", () => {
    test("extractNumbers handles commas and decimals", () => {
        expect(extractNumbers("Total is 20,100 and 4.8 km/h")).toEqual([20100, 4.8]);
    });

    test("numeric match anywhere in the answer", () => {
        expect(grade({ expected: 5 }, "The ball costs 5 rupees.")).toBe(true);
        expect(grade({ expected: 5 }, "The ball costs 10 rupees.")).toBe(false);
    });

    test("decimal match", () => {
        expect(grade({ expected: 7.5 }, "The angle is 7.5 degrees")).toBe(true);
    });

    test("reject list: wrong pick fails even if both numbers appear", () => {
        const item = { expected: 9.9, reject: [9.11] };
        expect(grade(item, "9.9 is larger than 9.11")).toBe(true);
        expect(grade(item, "9.11 is larger than 9.9")).toBe(false);
    });

    test("text answers with accept and reject words", () => {
        const item = { accept: ["yes"], rejectWords: ["no"] };
        expect(grade(item, "Yes, all bloops are lazzies.")).toBe(true);
        expect(grade(item, "No.")).toBe(false);
        expect(grade({ accept: ["wednesday"] }, "It will be Wednesday.")).toBe(true);
    });

    test("empty answer is wrong", () => {
        expect(grade({ expected: 1 }, undefined)).toBe(false);
    });
});

describe("eval rate-limit retry", () => {
    const { withRateLimitRetry } = require("../eval/runEval");

    test("waits and retries on 429, then returns the result", async () => {
        const llm = jest.fn()
            .mockRejectedValueOnce(new Error("LLM request failed (429): Rate limit reached"))
            .mockResolvedValueOnce({ data: { ok: true } });
        const log = jest.fn();

        const wrapped = withRateLimitRetry(llm, { waitMs: 1, log });

        await expect(wrapped({})).resolves.toEqual({ data: { ok: true } });
        expect(llm).toHaveBeenCalledTimes(2);
        expect(log).toHaveBeenCalledTimes(1);
    });

    test("does not retry other errors", async () => {
        const llm = jest.fn().mockRejectedValue(new Error("LLM request failed (401): Invalid API Key"));
        const wrapped = withRateLimitRetry(llm, { waitMs: 1, log: jest.fn() });

        await expect(wrapped({})).rejects.toThrow("401");
        expect(llm).toHaveBeenCalledTimes(1);
    });

    test("gives up after maxWaits", async () => {
        const llm = jest.fn().mockRejectedValue(new Error("(429) rate limit"));
        const wrapped = withRateLimitRetry(llm, { waitMs: 1, maxWaits: 2, log: jest.fn() });

        await expect(wrapped({})).rejects.toThrow("429");
        expect(llm).toHaveBeenCalledTimes(3);
    });
});