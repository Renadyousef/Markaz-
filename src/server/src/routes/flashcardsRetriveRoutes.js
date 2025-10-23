// server/src/routes/flashcardsRetriveRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/flashcardRetriveController");
const {verifyToken} = require("../middleware/authMiddleware");
// قائمة أحدث المجموعات
router.get("/decks", verifyToken, ctrl.listDecks);

// ميتا ديك
router.get("/decks/:deckId", verifyToken, ctrl.getDeckMeta);

// الديك كامل (مع كل البطاقات)
router.get("/decks/:deckId/full", verifyToken, ctrl.getDeckFull);

// تقسيم بطاقات (اختياري)
router.get("/decks/:deckId/cards", verifyToken, ctrl.getDeckCardsPage);

module.exports = router;