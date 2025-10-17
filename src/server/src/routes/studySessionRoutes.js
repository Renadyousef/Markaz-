const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { createSession, getMySessions } = require("../controllers/studySessionController");

// POST /sessions
router.post("/", verifyToken, createSession);

// GET /sessions/me
router.get("/me", verifyToken, getMySessions);

module.exports = router;
