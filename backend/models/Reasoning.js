const mongoose = require("mongoose");

const reasoningSchema = new mongoose.Schema(
    {
        // User who created this reasoning session
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // User's original question or problem
        problem: {
            type: String,
            required: true,
            trim: true
        },

        routeType: {
    type: String,
    default: "general"
},

        // Output from Decomposer Agent
        breakdown: {
            type: [String],
            default: []
        },

        // Output from Planner Agent
        plan: {
            type: [String],
            default: []
        },

        // Output from Solver Agent
        solution: {
            type: String,
            default: ""
        },

        // Output from Verifier Agent
        verification: {
            type: String,
            default: ""
        },

        // Output from Explainer Agent
        finalAnswer: {
            type: String,
            default: ""
        },

        // Wikipedia article title used as knowledge source
        sourceTitle: {
            type: String,
            default: null
        },

        // Wikipedia information retrieved for the question
        sourceContent: {
            type: String,
            default: null
        }
    },
    {
        // Automatically creates createdAt and updatedAt
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Reasoning",
    reasoningSchema
);