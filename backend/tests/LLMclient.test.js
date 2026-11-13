const { createGroqClient, createLLMClient, extractJson, LLMError } = require("../services/llmClient");

describe("extractJson", () => {
    test("parses plain JSON", () => {
        expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    });

    test("parses JSON wrapped in a markdown fence", () => {
        expect(extractJson('Here you go:\n```json\n{"a": [1, 2]}\n```')).toEqual({ a: [1, 2] });
    });

    test("parses JSON with text before and after", () => {
        expect(extractJson('Sure! {"ok": true} Hope that helps.')).toEqual({ ok: true });
    });

    test("throws LLMError when there is no JSON", () => {
        expect(() => extractJson("no json here")).toThrow(LLMError);
    });

    test("throws LLMError on malformed JSON", () => {
        expect(() => extractJson('{"a": }')).toThrow(LLMError);
    });
});

describe("createGroqClient", () => {
    const okResponse = (content) => ({
        data: {
            choices: [{ message: { content } }],
            usage: { prompt_tokens: 3, completion_tokens: 2 }
        }
    });

    test("fails fast without an API key", async () => {
        const llm = createGroqClient({ apiKey: "", http: { post: jest.fn() } });
        await expect(llm({ system: "s", user: "u" })).rejects.toThrow("GROQ_API_KEY");
    });

    test("sends JSON mode request and returns parsed data", async () => {
        const http = { post: jest.fn().mockResolvedValue(okResponse('{"x": 1}')) };
        const llm = createGroqClient({ apiKey: "k", model: "m", http });

        const result = await llm({ system: "sys", user: "hi" });

        expect(result).toEqual({ data: { x: 1 }, usage: { prompt_tokens: 3, completion_tokens: 2 } });

        const [, body, config] = http.post.mock.calls[0];
        expect(body.model).toBe("m");
        expect(body.response_format).toEqual({ type: "json_object" });
        expect(body.messages).toEqual([
            { role: "system", content: "sys" },
            { role: "user", content: "hi" }
        ]);
        expect(config.headers.Authorization).toBe("Bearer k");
    });

    test("retries once on a server error, then succeeds", async () => {
        const serverError = Object.assign(new Error("boom"), { response: { status: 503 } });
        const http = {
            post: jest.fn()
                .mockRejectedValueOnce(serverError)
                .mockResolvedValueOnce(okResponse('{"y": 2}'))
        };
        const llm = createGroqClient({ apiKey: "k", http });

        await expect(llm({ system: "s", user: "u" })).resolves.toMatchObject({ data: { y: 2 } });
        expect(http.post).toHaveBeenCalledTimes(2);
    });

    test("does not retry on 401", async () => {
        const authError = Object.assign(new Error("nope"), {
            response: { status: 401, data: { error: { message: "Invalid API Key" } } }
        });
        const http = { post: jest.fn().mockRejectedValue(authError) };
        const llm = createGroqClient({ apiKey: "bad", http });

        await expect(llm({ system: "s", user: "u" })).rejects.toThrow("(401): Invalid API Key");
        expect(http.post).toHaveBeenCalledTimes(1);
    });
});

describe("createLLMClient provider switch", () => {
    test("defaults to Groq", async () => {
        const http = { post: jest.fn().mockResolvedValue({ data: { choices: [{ message: { content: "{}" } }] } }) };
        await createLLMClient({ provider: undefined, apiKey: "k", http })({ system: "s", user: "u" });
        expect(http.post.mock.calls[0][0]).toContain("api.groq.com");
        expect(http.post.mock.calls[0][1].model).toBe("openai/gpt-oss-120b");
    });

    test("uses OpenAI's endpoint and model override", async () => {
        const http = { post: jest.fn().mockResolvedValue({ data: { choices: [{ message: { content: '{"a":1}' } }] } }) };
        const llm = createLLMClient({ provider: "OpenAI", apiKey: "k", model: "gpt-x", http });
        await expect(llm({ system: "s", user: "u" })).resolves.toMatchObject({ data: { a: 1 } });
        expect(http.post.mock.calls[0][0]).toBe("https://api.openai.com/v1/chat/completions");
        expect(http.post.mock.calls[0][1].model).toBe("gpt-x");
    });

    test("Claude: system at top level, x-api-key header, usage mapped", async () => {
        const http = {
            post: jest.fn().mockResolvedValue({
                data: {
                    content: [{ type: "text", text: 'Here: {"answer": "60 km/h"}' }],
                    usage: { input_tokens: 12, output_tokens: 4 }
                }
            })
        };
        const llm = createLLMClient({ provider: "claude", apiKey: "ak", model: "claude-test", http });

        const result = await llm({ system: "sys", user: "hi", maxTokens: 50 });

        expect(result).toEqual({
            data: { answer: "60 km/h" },
            usage: { prompt_tokens: 12, completion_tokens: 4 }
        });
        const [url, body, config] = http.post.mock.calls[0];
        expect(url).toBe("https://api.anthropic.com/v1/messages");
        expect(body).toMatchObject({ model: "claude-test", system: "sys", max_tokens: 50 });
        expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
        expect(config.headers["x-api-key"]).toBe("ak");
        expect(config.headers["anthropic-version"]).toBeDefined();
    });

    test("names the missing key for the chosen provider", async () => {
        const llm = createLLMClient({ provider: "claude", apiKey: "", http: { post: jest.fn() } });
        await expect(llm({ system: "s", user: "u" })).rejects.toThrow("ANTHROPIC_API_KEY is not set");
    });

    test("rejects an unknown provider", () => {
        expect(() => createLLMClient({ provider: "gemini" })).toThrow('Unknown LLM_PROVIDER "gemini"');
    });
});