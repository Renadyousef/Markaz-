// server/src/routes/flashcardsRetriveRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/flashcardRetriveController");

// قائمة أحدث المجموعات
router.get("/decks", ctrl.listDecks);

// ميتا ديك
router.get("/decks/:deckId", ctrl.getDeckMeta);

// الديك كامل (مع كل البطاقات)
router.get("/decks/:deckId/full", ctrl.getDeckFull);

// تقسيم بطاقات (اختياري)
router.get("/decks/:deckId/cards", ctrl.getDeckCardsPage);

module.exports = router;
