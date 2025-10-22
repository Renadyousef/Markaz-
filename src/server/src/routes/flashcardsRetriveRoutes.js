// server/src/routes/flashcardsRetriveRoutes.js
const express = require("express");
const router = express.Router();

// Make sure the path matches your controller filename
// (flashcardRetriveController.js OR flashcardsRetriveController.js)
const ctrl = require("../controllers/flashcardRetriveController");

// ✅ List only my decks
router.get("/decks", ctrl.listDecks);

// ✅ Get deck metadata
router.get("/decks/:deckId", ctrl.getDeckMeta);

// ✅ Get full deck (with all cards)
router.get("/decks/:deckId/full", ctrl.getDeckFull);

// ❌ You don’t have getDeckCardsPage in your controller
// Either remove this route or implement the function.
// For now I’ll comment it out:
// router.get("/decks/:deckId/cards", ctrl.getDeckCardsPage);

module.exports = router;
