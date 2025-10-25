// server/src/controllers/flashcardRetriveController.js
const admin = require("firebase-admin"); // مُهَيّأ مسبقًا في مكان آخر
const db = admin.firestore();

/* ========== config ========== */
/** Field used in flash_cards collection to store deck owner */
const DECK_OWNER_FIELD = "ownerId";

/* ========== helpers ========== */
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

// at top, add a helper consistent with your other controllers
function resolveUser(req) {
  const u = req.user || {};

  // ✅ Accept all possible token key names
  const uid =
    u.id ||
    u._id ||
    u.uid ||
    u.userId ||
    u.sub ||
    u.user?.id ||
    u.user?._id ||
    u.user?.uid ||
    req.userId ||
    null;

  return { uid };
}

function requireUserId(req, res) {
  const { uid } = resolveUser(req);
  if (!uid) {
    console.log("⚠️ Missing user id in token:", req.user);
    res.status(401).json({ ok: false, error: "Unauthorized: missing user id" });
    return null;
  }
  return uid;
}

/** Ownership check */
function isOwnedByUser(deckSnap, userId) {
  const d = deckSnap.data() || {};
  const owner =
    d?.[DECK_OWNER_FIELD] ??
    d?.userId ??
    d?.ownerId ??
    d?.user_id ??
    null;
  return owner === userId;
}

/* ========== controllers ========== */

/* GET /retrive/decks?limit=3 — أحدث المجموعات (scoped to user) */
exports.listDecks = async (req, res) => {
  try {

    const userId = requireUserId(req, res);
    if (!userId) return;

    const limit = Math.max(1, Math.min(50, Number(req.query.limit || 10)));

    // 🔴 IMPORTANT: This query needs a composite Firestore index
    // Fields: ownerId (ASC) + createdAt (DESC)
    const snap = await db
      .collection("flash_cards")
      .where(DECK_OWNER_FIELD, "==", userId)
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

/* GET /retrive/decks/:deckId — ميتا فقط */
exports.getDeckMeta = async (req, res) => {
        console.log("🧩 req.user payload:", req.user); // 👈 add this line

  try {
    
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { deckId } = req.params;
    const ref = db.collection("flash_cards").doc(deckId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: "Deck not found" });

    if (!isOwnedByUser(snap, userId)) {
      return res.status(404).json({ ok: false, error: "Deck not found" });
    }

    return res.json({ ok: true, deck: deckDocToJson(snap) });
  } catch (e) {
    console.error("getDeckMeta err:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
};

/* GET /retrive/decks/:deckId/full — الديك + كل البطاقات */
exports.getDeckFull = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { deckId } = req.params;
    const ref = db.collection("flash_cards").doc(deckId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: "Deck not found" });

    if (!isOwnedByUser(snap, userId)) {
      return res.status(404).json({ ok: false, error: "Deck not found" });
    }

    const cardsSnap = await ref.collection("cards").orderBy("order", "asc").get();
    const cards = cardsSnap.docs.map(cardDocToJson);

    return res.json({ ok: true, deck: deckDocToJson(snap), cards, count: cards.length });
  } catch (e) {
    console.error("getDeckFull err:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
};

/* GET /retrive/decks/:deckId/cards?limit=20&cursor=10 — صفحة بطاقات */
exports.getDeckCardsPage = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { deckId } = req.params;
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const cursor = req.query.cursor != null ? Number(req.query.cursor) : null;

    const ref = db.collection("flash_cards").doc(deckId);
    const deckSnap = await ref.get();
    if (!deckSnap.exists) return res.status(404).json({ ok: false, error: "Deck not found" });

    if (!isOwnedByUser(deckSnap, userId)) {
      return res.status(404).json({ ok: false, error: "Deck not found" });
    }

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
