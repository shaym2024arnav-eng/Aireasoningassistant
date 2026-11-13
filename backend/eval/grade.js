/**
 * Grades a short free-text answer against an expected value.
 *
 * Numeric items: correct if the answer contains the expected number and no
 * listed "reject" number. Text items: correct if it contains an accepted
 * word and no rejected word.
 */
const extractNumbers = (text) =>
    (String(text).replace(/(\d),(?=\d{3}\b)/g, "$1").match(/-?\d+(?:\.\d+)?/g) || []).map(Number);

const hasWord = (text, word) => new RegExp(`\\b${word}\\b`, "i").test(text);

function grade(item, answer) {
    const text = String(answer || "");

    if (typeof item.expected === "number") {
        const nums = extractNumbers(text);
        const close = (a, b) => Math.abs(a - b) < 1e-6;

        if (item.reject?.some((r) => nums.some((n) => close(n, r)))) {
            // e.g. "9.9 is larger than 9.11" mentions both; only reject if 9.11 is
            // named as the answer, i.e. 9.9 does not appear first.
            return nums.length > 0 && close(nums[0], item.expected);
        }

        return nums.some((n) => close(n, item.expected));
    }

    const accepted = (item.accept || []).some((w) => hasWord(text, w));
    const rejected = (item.rejectWords || []).some((w) => hasWord(text, w));
    return accepted && !rejected;
}

module.exports = { grade, extractNumbers };