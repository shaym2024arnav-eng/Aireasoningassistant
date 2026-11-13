const mongoose = require("mongoose");

const reasoningSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        problem: { type: String, required: true, trim: true },

        // Router agent's classification
        routeType: { type: String, default: "general" },

        // Decomposer agent: sub-problems
        breakdown: { type: [String], default: [] },

        // Planner agent: ordered steps
        plan: { type: [String], default: [] },

        // Solver agent: working + final answer, and the short answer alone
        solution: { type: String, default: "" },
        answer: { type: String, default: "" },

        // Verifier agent: human-readable summary (kept as a string so older
        // history entries still render) plus the structured verdict.
        verification: { type: String, default: "" },
        verificationPassed: { type: Boolean, default: null },
        verificationIssues: { type: [String], default: [] },
        confidence: { type: Number, default: null },
        revisions: { type: Number, default: 0 },

        // Explainer agent
        finalAnswer: { type: String, default: "" },

        // Wikipedia source used as context
        sourceTitle: { type: String, default: null },
        sourceContent: { type: String, default: null },

        // Per-agent timings and token usage, for the dashboard and debugging
        trace: {
            type: [{ _id: false, agent: String, ms: Number }],
            default: []
        },
        totalMs: { type: Number, default: null },
        tokens: { type: Number, default: null }
    },
    { timestamps: true }
);

reasoningSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Reasoning", reasoningSchema);