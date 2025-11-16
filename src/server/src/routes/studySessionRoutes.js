const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  createSession,
  getMySessions,
  updateSessionStatus,
} = require("../controllers/studySessionController");

// POST /sessions
router.post("/", verifyToken, createSession);

// GET /sessions/me
router.get("/me", verifyToken, getMySessions);

// PATCH /sessions/:id/status
router.patch("/:id/status", verifyToken, updateSessionStatus);

module.exports = router;
