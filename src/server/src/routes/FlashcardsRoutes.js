// server/src/routes/flashcardsRoutes.js  ← خلي الاسم كله small لراحة البال
const express = require("express");
const { generateFromText } = require("../controllers/FlashcardsController.js");

const router = express.Router();

// POST /api/flashcards/from-text
router.post("/from-text", generateFromText);

module.exports = router;            // ← مهم جداً: نُصدّر الـ router نفسه
