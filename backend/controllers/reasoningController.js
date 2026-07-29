const Reasoning = require("../models/Reasoning");

const decomposerAgent = require("../agents/decomposerAgent");
const plannerAgent = require("../agents/plannerAgent");
const solverAgent = require("../agents/solverAgent");
const verifierAgent = require("../agents/verifierAgent");
const explainerAgent = require("../agents/explainerAgent");
const routerAgent = require("../agents/routerAgent");

const getWikipediaKnowledge =
    require("../services/wikipediaService");


// ========================================
// CREATE NEW REASONING
// ========================================

exports.createReasoning = async (req, res) => {
    try {
        const { problem } = req.body;

        if (!problem || !problem.trim()) {
            return res.status(400).json({
                message: "Problem is required"
            });
        }

        const cleanProblem = problem.trim();

        // ----------------------------------------
        // 1. ROUTER AGENT
        // ----------------------------------------

        const routeType = routerAgent(cleanProblem);

        console.log(
            "Question Type:",
            routeType
        );


        // ----------------------------------------
        // 2. FETCH WIKIPEDIA KNOWLEDGE
        //    ONLY FOR FACTUAL QUESTIONS
        // ----------------------------------------

        let wikipediaData = {
            title: null,
            content: null
        };

        if (routeType === "factual") {

            wikipediaData =
                await getWikipediaKnowledge(
                    cleanProblem
                );

        }


        const knowledge =
            wikipediaData?.content || "";


        // ----------------------------------------
        // 3. DECOMPOSER AGENT
        // ----------------------------------------

        const breakdown =
            decomposerAgent(
                cleanProblem,
                knowledge,
                routeType
            );


        // ----------------------------------------
        // 4. PLANNER AGENT
        // ----------------------------------------

        const plan =
            plannerAgent(
                cleanProblem,
                breakdown,
                knowledge,
                routeType
            );


        // ----------------------------------------
        // 5. SOLVER AGENT
        // ----------------------------------------

        const solution =
            solverAgent(
                cleanProblem,
                plan,
                knowledge,
                routeType
            );


        // ----------------------------------------
        // 6. VERIFIER AGENT
        // ----------------------------------------

        const verification =
            verifierAgent(
                cleanProblem,
                plan,
                solution,
                knowledge,
                routeType
            );


        // ----------------------------------------
        // 7. EXPLAINER AGENT
        // ----------------------------------------

        const finalAnswer =
            explainerAgent(
                cleanProblem,
                breakdown,
                plan,
                solution,
                verification,
                knowledge,
                routeType
            );


        // ----------------------------------------
        // 8. SAVE REASONING IN MONGODB
        // ----------------------------------------

        const reasoning =
            await Reasoning.create({

                user: req.user.id,

                problem: cleanProblem,

                routeType,

                breakdown,

                plan,

                solution,

                verification,

                finalAnswer,

                sourceTitle:
                    wikipediaData?.title ||
                    null,

                sourceContent:
                    wikipediaData?.content ||
                    null
            });


        // ----------------------------------------
        // 9. SEND RESPONSE
        // ----------------------------------------

        return res.status(201).json({

            message:
                "Reasoning generated successfully",

            reasoning
        });

    } catch (error) {

        console.error(
            "Create Reasoning Error:",
            error
        );

        return res.status(500).json({

            message:
                error.message ||
                "Failed to generate reasoning"
        });
    }
};


// ========================================
// GET REASONING HISTORY
// ========================================

exports.getReasoningHistory =
    async (req, res) => {

        try {

            const history =
                await Reasoning.find({

                    user: req.user.id

                })
                .sort({

                    createdAt: -1

                });


            return res.status(200).json({

                history
            });

        } catch (error) {

            console.error(
                "Get History Error:",
                error
            );

            return res.status(500).json({

                message:
                    error.message ||
                    "Failed to fetch reasoning history"
            });
        }
    };


// ========================================
// GET DASHBOARD STATISTICS
// ========================================

exports.getReasoningStats =
    async (req, res) => {

        try {

            const totalSessions =
                await Reasoning
                    .countDocuments({

                        user: req.user.id

                    });


            const recentSessions =
                await Reasoning.find({

                    user: req.user.id

                })
                .sort({

                    createdAt: -1

                })
                .limit(5);


            const latestProblem =
                recentSessions.length > 0

                    ? recentSessions[0]
                        .problem

                    : "No reasoning sessions yet";


            return res.status(200).json({

                totalSessions,

                recentSessions,

                latestProblem
            });

        } catch (error) {

            console.error(
                "Get Statistics Error:",
                error
            );

            return res.status(500).json({

                message:
                    error.message ||
                    "Failed to load dashboard statistics"
            });
        }
    };


// ========================================
// DELETE REASONING
// ========================================

exports.deleteReasoning =
    async (req, res) => {

        try {

            const reasoning =
                await Reasoning.findOne({

                    _id: req.params.id,

                    user: req.user.id

                });


            if (!reasoning) {

                return res.status(404).json({

                    message:
                        "Reasoning session not found"
                });
            }


            await reasoning.deleteOne();


            return res.status(200).json({

                message:
                    "Reasoning session deleted successfully"
            });

        } catch (error) {

            console.error(
                "Delete Reasoning Error:",
                error
            );

            return res.status(500).json({

                message:
                    error.message ||
                    "Failed to delete reasoning session"
            });
        }
    };