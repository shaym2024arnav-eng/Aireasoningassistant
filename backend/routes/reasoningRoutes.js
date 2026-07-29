const express = require("express");

const router = express.Router();

const {
    createReasoning,
    getReasoningHistory,
    getReasoningStats,
    deleteReasoning
} = require("../controllers/reasoningController");

const protect = require("../middleware/authMiddleware");


// ========================================
// CREATE REASONING
// POST /api/reasoning/create
// ========================================

router.post(
    "/create",
    protect,
    createReasoning
);


// ========================================
// GET REASONING HISTORY
// GET /api/reasoning/history
// ========================================

router.get(
    "/history",
    protect,
    getReasoningHistory
);


// ========================================
// GET DASHBOARD STATISTICS
// GET /api/reasoning/stats
// ========================================

router.get(
    "/stats",
    protect,
    getReasoningStats
);

router.delete(
    "/:id",
    protect,
    deleteReasoning
);


module.exports = router;