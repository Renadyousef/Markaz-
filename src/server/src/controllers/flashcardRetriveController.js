// server/src/controllers/flashcardRetriveController.js
const admin = require("firebase-admin"); // مُهَيّأ مسبقًا في مكان آخر
const db = admin.firestore();

/* helpers */
function deckDocToJson(doc) {
  const d = doc.data() || {};
  return {
    id: doc.id,
    name: d.name || "",
    nameLower: d.nameLower || "",
    language: d.language || "ar",
    pdfId: d.pdfId || null,
    count: d.count || 0,
    knownCount: d.knownCount || 0,
    unknownCount: d.unknownCount || 0,
    // Expose saved classification so client can color cards
    knownIds: Array.isArray(d.knownIds) ? d.knownIds : [],
    unknownIds: Array.isArray(d.unknownIds) ? d.unknownIds : [],
    createdAt: d.createdAt ? d.createdAt.toMillis?.() || d.createdAt : null,
  };
}
function cardDocToJson(doc) {
  const c = doc.data() || {};
  return {
    id: doc.id,
    question: c.question || "",
    answer: c.answer || "",
    hint: c.hint ?? null,
    tags: Array.isArray(c.tags) ? c.tags : [],
    order: c.order ?? 0,
  };
}

/* GET /retrive/decks?limit=3  — أحدث المجموعات */
exports.listDecks = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || 10)));
    const snap = await db
      .collection("flash_cards")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const items = snap.docs.map(deckDocToJson);
    return res.json({ ok: true, items, count: items.length });
  } catch (e) {
    console.error("listDecks err:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
};

/* GET /retrive/decks/:deckId  — ميتا فقط (بدون بطاقات) */
exports.getDeckMeta = async (req, res) => {
  try {
    const { deckId } = req.params;
    const ref = db.collection("flash_cards").doc(deckId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: "Deck not found" });
    return res.json({ ok: true, deck: deckDocToJson(snap) });
  } catch (e) {
    console.error("getDeckMeta err:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
};

/* GET /retrive/decks/:deckId/full  — الديك + كل البطاقات */
exports.getDeckFull = async (req, res) => {
  try {
    const { deckId } = req.params;
    const ref = db.collection("flash_cards").doc(deckId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: "Deck not found" });

    const cardsSnap = await ref.collection("cards").orderBy("order", "asc").get();
    const cards = cardsSnap.docs.map(cardDocToJson);

    return res.json({ ok: true, deck: deckDocToJson(snap), cards, count: cards.length });
  } catch (e) {
    console.error("getDeckFull err:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
};

/* GET /retrive/decks/:deckId/cards?limit=20&cursor=10  — صفحة بطاقات */
exports.getDeckCardsPage = async (req, res) => {
  try {
    const { deckId } = req.params;
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const cursor = req.query.cursor != null ? Number(req.query.cursor) : null;

    const ref = db.collection("flash_cards").doc(deckId);
    const deckSnap = await ref.get();
    if (!deckSnap.exists) return res.status(404).json({ ok: false, error: "Deck not found" });

    let q = ref.collection("cards").orderBy("order", "asc").limit(limit);
    if (!Number.isNaN(cursor) && cursor != null) q = q.startAfter(cursor);

    const snap = await q.get();
    const cards = snap.docs.map(cardDocToJson);
    const nextCursor = snap.size ? cards[cards.length - 1].order : null;

    return res.json({ ok: true, deck: deckDocToJson(deckSnap), cards, nextCursor });
  } catch (e) {
    console.error("getDeckCardsPage err:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
};