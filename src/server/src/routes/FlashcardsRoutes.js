// server/src/routes/flashcardsRoutes.js
const express = require("express");
const FC = require("../controllers/FlashcardsController");

const router = express.Router();

// POST /api/flashcards/from-text
router.post("/from-text", FC.generateFromText);

// POST /api/flashcards/from-pdf/:pdfId
router.post("/from-pdf/:pdfId", FC.generateFromPdfId);

// POST /api/flashcards/save-deck
router.post("/save-deck", FC.saveDeck);

// GET /api/flashcards/deck/:deckId
router.get("/deck/:deckId", FC.getDeckCards);

module.exports = router;
