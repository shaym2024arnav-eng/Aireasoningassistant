/**
 * Helpers that turn loosely-shaped LLM JSON into the exact shapes the
 * pipeline expects. Models occasionally return a string where a list was
 * asked for, or numbers as strings, so agents never trust the raw reply.
 */

const asString = (value, fallback = "") => {
    if (typeof value === "string") return value.trim();
    if (value === null || value === undefined) return fallback;
    return String(value).trim();
};

const asStringArray = (value, { max = 8 } = {}) => {
    let items = value;

    if (typeof items === "string") {
        items = items.split("\n");
    }

    if (!Array.isArray(items)) return [];

    return items
        .map((item) => {
            if (item && typeof item === "object") {
                return asString(item.step || item.text || item.title || JSON.stringify(item));
            }
            return asString(item);
        })
        .map((item) => item.replace(/^\s*(\d+[.)]|[-*•])\s*/, ""))
        .filter(Boolean)
        .slice(0, max);
};

const asConfidence = (value) => {
    const n = typeof value === "string" ? parseFloat(value) : value;
    if (typeof n !== "number" || Number.isNaN(n)) return 0;
    // Accept both 0-1 and 0-100 scales.
    const scaled = n > 1 ? n / 100 : n;
    return Math.min(1, Math.max(0, scaled));
};

module.exports = { asString, asStringArray, asConfidence };