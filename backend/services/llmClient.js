const axios = require("axios");

/**
 * One LLM client for the whole app. Pick the provider in .env:
 *
 *   LLM_PROVIDER=groq     (default, free)   GROQ_API_KEY,      GROQ_MODEL
 *   LLM_PROVIDER=openai   (paid)            OPENAI_API_KEY,    OPENAI_MODEL
 *   LLM_PROVIDER=claude   (paid)            ANTHROPIC_API_KEY, CLAUDE_MODEL
 *
 * Every client is an async function ({ system, user, temperature, maxTokens })
 * that resolves to { data, usage }, where data is the parsed JSON reply and
 * usage is { prompt_tokens, completion_tokens }. The agents only depend on
 * that signature, so tests can pass in a fake client.
 */

const PROVIDERS = {
    groq: {
        url: "https://api.groq.com/openai/v1/chat/completions",
        keyEnv: "GROQ_API_KEY",
        modelEnv: "GROQ_MODEL",
        defaultModel: "openai/gpt-oss-120b"
    },
    openai: {
        url: "https://api.openai.com/v1/chat/completions",
        keyEnv: "OPENAI_API_KEY",
        modelEnv: "OPENAI_MODEL",
        defaultModel: "gpt-4o-mini"
    },
    claude: {
        url: "https://api.anthropic.com/v1/messages",
        keyEnv: "ANTHROPIC_API_KEY",
        modelEnv: "CLAUDE_MODEL",
        defaultModel: "claude-haiku-5-5"
    }
};

const DEFAULT_MODEL = PROVIDERS.groq.defaultModel;

class LLMError extends Error {
    constructor(message, cause) {
        super(message);
        this.name = "LLMError";
        this.cause = cause;
    }
}

/**
 * Pull the first JSON object out of a model reply. Models sometimes wrap
 * JSON in ```json fences or add a sentence before it.
 */
function extractJson(text) {
    if (typeof text !== "string") {
        throw new LLMError("LLM returned no text");
    }

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : text;

    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");

    if (start === -1 || end <= start) {
        throw new LLMError("LLM reply did not contain a JSON object");
    }

    try {
        return JSON.parse(candidate.slice(start, end + 1));
    } catch (err) {
        throw new LLMError("LLM reply was not valid JSON", err);
    }
}

/**
 * Shared retry/error handling. `send` makes one HTTP call and returns
 * { text, usage }. Retries once on network/5xx/bad JSON; never on 400/401/403.
 */
function withRetries({ apiKey, keyName, maxAttempts, send }) {
    return async function callLLM(request) {
        if (!apiKey) {
            throw new LLMError(`${keyName} is not set`);
        }

        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const { text, usage } = await send(request);
                return { data: extractJson(text), usage };
            } catch (err) {
                lastError = err;
                const status = err.response?.status;
                if (status === 400 || status === 401 || status === 403) break;
            }
        }

        if (lastError instanceof LLMError) throw lastError;

        const status = lastError?.response?.status;
        const detail = lastError?.response?.data?.error?.message || lastError?.message;

        throw new LLMError(
            `LLM request failed${status ? ` (${status})` : ""}: ${detail}`,
            lastError
        );
    };
}

// Groq and OpenAI share the same chat-completions API.
function createOpenAICompatibleClient({ url, apiKey, keyName, model, timeoutMs, maxAttempts, http }) {
    return withRetries({
        apiKey,
        keyName,
        maxAttempts,
        send: async ({ system, user, temperature = 0.2, maxTokens = 1024 }) => {
            const response = await http.post(
                url,
                {
                    model,
                    temperature,
                    max_tokens: maxTokens,
                    response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: system },
                        { role: "user", content: user }
                    ]
                },
                {
                    timeout: timeoutMs,
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            return {
                text: response.data?.choices?.[0]?.message?.content,
                usage: response.data?.usage || null
            };
        }
    });
}

// Anthropic's Messages API: system prompt is a top-level field, and the
// reply is a list of content blocks.
function createClaudeClient({ apiKey, model, timeoutMs, maxAttempts, http }) {
    return withRetries({
        apiKey,
        keyName: PROVIDERS.claude.keyEnv,
        maxAttempts,
        send: async ({ system, user, temperature = 0.2, maxTokens = 1024 }) => {
            const response = await http.post(
                PROVIDERS.claude.url,
                {
                    model,
                    max_tokens: maxTokens,
                    temperature,
                    system,
                    messages: [{ role: "user", content: user }]
                },
                {
                    timeout: timeoutMs,
                    headers: {
                        "x-api-key": apiKey,
                        "anthropic-version": "2023-06-01",
                        "Content-Type": "application/json"
                    }
                }
            );

            const text = (response.data?.content || [])
                .filter((block) => block.type === "text")
                .map((block) => block.text)
                .join("");

            const usage = response.data?.usage
                ? {
                    prompt_tokens: response.data.usage.input_tokens || 0,
                    completion_tokens: response.data.usage.output_tokens || 0
                }
                : null;

            return { text, usage };
        }
    });
}

/**
 * Builds the client for the chosen provider. Options override env vars
 * (used by tests).
 */
function createLLMClient({
    provider = process.env.LLM_PROVIDER || "groq",
    apiKey,
    model,
    timeoutMs = 30000,
    maxAttempts = 2,
    http = axios
} = {}) {
    const name = String(provider).toLowerCase().trim();
    const config = PROVIDERS[name];

    if (!config) {
        throw new LLMError(
            `Unknown LLM_PROVIDER "${provider}". Use one of: ${Object.keys(PROVIDERS).join(", ")}`
        );
    }

    const key = apiKey ?? process.env[config.keyEnv];
    const chosenModel = model || process.env[config.modelEnv] || config.defaultModel;
    const common = { apiKey: key, model: chosenModel, timeoutMs, maxAttempts, http };

    if (name === "claude") {
        return createClaudeClient(common);
    }

    return createOpenAICompatibleClient({ ...common, url: config.url, keyName: config.keyEnv });
}

// Kept for backwards compatibility with earlier code and tests.
const createGroqClient = (options = {}) => createLLMClient({ ...options, provider: "groq" });

module.exports = {
    createLLMClient,
    createGroqClient,
    extractJson,
    LLMError,
    PROVIDERS,
    DEFAULT_MODEL
};