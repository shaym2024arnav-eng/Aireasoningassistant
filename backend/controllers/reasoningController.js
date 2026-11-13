const mongoose = require("mongoose");
const Reasoning = require("../models/Reasoning");
const { runReasoningPipeline } = require("../services/reasoningPipeline");
const { createLLMClient } = require("../services/llmClient");

const MAX_PROBLEM_LENGTH = 2000;

// Built lazily so the API key is read after dotenv has loaded,
// and so tests can replace it with setLLMClient().
let llmClient = null;
const getLLM = () => {
    if (!llmClient) llmClient = createLLMClient();
    return llmClient;
};
exports.setLLMClient = (client) => {
    llmClient = client;
};

const summarizeVerification = ({ passed, issues, confidence, revisions }) => {
    const pct = Math.round(confidence * 100);
    const revisionNote = revisions
        ? ` after ${revisions} revision${revisions > 1 ? "s" : ""}`
        : "";

    if (passed) {
        return `Verified${revisionNote} (confidence ${pct}%).`;
    }

    return `Not fully verified${revisionNote} (confidence ${pct}%). Open issues: ${issues.join("; ")}`;
};

// POST /api/reasoning/create
exports.createReasoning = async (req, res) => {
    const problem = typeof req.body?.problem === "string" ? req.body.problem.trim() : "";

    if (!problem) {
        return res.status(400).json({ message: "Problem is required" });
    }

    if (problem.length > MAX_PROBLEM_LENGTH) {
        return res.status(400).json({
            message: `Problem must be ${MAX_PROBLEM_LENGTH} characters or fewer`
        });
    }

    const started = Date.now();
    let result;

    try {
        result = await runReasoningPipeline(problem, { llm: getLLM() });
    } catch (error) {
        console.error("Reasoning pipeline error:", error.message);
        return res.status(502).json({
            message: "The reasoning model is unavailable right now. Please try again."
        });
    }

    try {
        const reasoning = await Reasoning.create({
            user: req.user.id,
            problem,
            routeType: result.routeType,
            breakdown: result.breakdown,
            plan: result.plan,
            solution: result.solution,
            answer: result.answer,
            verification: summarizeVerification(result.verification),
            verificationPassed: result.verification.passed,
            verificationIssues: result.verification.issues,
            confidence: result.verification.confidence,
            revisions: result.verification.revisions,
            finalAnswer: result.finalAnswer,
            sourceTitle: result.sourceTitle,
            sourceContent: result.sourceContent,
            trace: result.trace,
            totalMs: Date.now() - started,
            tokens: result.usage.promptTokens + result.usage.completionTokens
        });

        return res.status(201).json({
            message: "Reasoning generated successfully",
            reasoning
        });
    } catch (error) {
        console.error("Save reasoning error:", error.message);
        return res.status(500).json({ message: "Failed to save reasoning" });
    }
};

// GET /api/reasoning/history
exports.getReasoningHistory = async (req, res) => {
    try {
        const history = await Reasoning.find({ user: req.user.id })
            .select("-sourceContent")
            .sort({ createdAt: -1 })
            .limit(100);

        return res.status(200).json({ history });
    } catch (error) {
        console.error("Get history error:", error.message);
        return res.status(500).json({ message: "Failed to fetch reasoning history" });
    }
};

// GET /api/reasoning/stats
exports.getReasoningStats = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const [totalSessions, recentSessions, aggregate] = await Promise.all([
            Reasoning.countDocuments({ user: req.user.id }),
            Reasoning.find({ user: req.user.id })
                .select("problem routeType verificationPassed createdAt")
                .sort({ createdAt: -1 })
                .limit(5),
            Reasoning.aggregate([
                { $match: { user: userId, verificationPassed: { $ne: null } } },
                {
                    $group: {
                        _id: null,
                        verified: { $sum: { $cond: ["$verificationPassed", 1, 0] } },
                        checked: { $sum: 1 },
                        revised: { $sum: { $cond: [{ $gt: ["$revisions", 0] }, 1, 0] } },
                        avgMs: { $avg: "$totalMs" }
                    }
                }
            ])
        ]);

        const agg = aggregate[0];

        return res.status(200).json({
            totalSessions,
            recentSessions,
            latestProblem: recentSessions[0]?.problem || "No reasoning sessions yet",
            verificationRate: agg ? agg.verified / agg.checked : null,
            revisedSessions: agg ? agg.revised : 0,
            averageResponseMs: agg?.avgMs ? Math.round(agg.avgMs) : null
        });
    } catch (error) {
        console.error("Get stats error:", error.message);
        return res.status(500).json({ message: "Failed to load dashboard statistics" });
    }
};

// DELETE /api/reasoning/:id
exports.deleteReasoning = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid reasoning id" });
    }

    try {
        const deleted = await Reasoning.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!deleted) {
            return res.status(404).json({ message: "Reasoning session not found" });
        }

        return res.status(200).json({ message: "Reasoning session deleted successfully" });
    } catch (error) {
        console.error("Delete reasoning error:", error.message);
        return res.status(500).json({ message: "Failed to delete reasoning session" });
    }
};