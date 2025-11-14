// server/src/routes/progressRoutes.js
const express = require("express");
const router = express.Router();
const { getProgress, getProgressHistory } = require("../controllers/progressController");
const { verifyToken } = require("../middleware/authMiddleware"); // ✅ fixed import

// Get today's progress
router.get("/me", verifyToken, getProgress);

// Get weekly progress history
router.get("/history", verifyToken, getProgressHistory);

module.exports = router;
