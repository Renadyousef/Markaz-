// server/src/routes/flashcardsRoutes.js
const express = require("express");
const FC = require("../controllers/FlashcardsController");
const {verifyToken} = require("../middleware/authMiddleware");

const router = express.Router();


// POST /api/flashcards/from-text
router.post("/from-text", FC.generateFromText);

// POST /api/flashcards/from-pdf/:pdfId
router.post("/from-pdf/:pdfId", FC.generateFromPdfId);

// POST /api/flashcards/save-deck
router.post("/save-deck", FC.saveDeck);

//  Update progress for saved decks
router.post("/deck/:deckId/update-progress", verifyToken, FC.updateDeckProgress);

// GET /api/flashcards/deck/:deckId
router.get("/deck/:deckId", FC.getDeckCards);

// (اختياري) لو عندك صفحة "آخر مجموعاتي" وتحبي تحميها، أضفي التوكن في هذه فقط
// router.get("/my-decks", verifyToken, FC.listMyDecks);

module.exports = router;
