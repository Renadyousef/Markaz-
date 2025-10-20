const admin = require("firebase-admin");
const db = admin.firestore();

function resolveUser(req) {
  const u = req.user || {};
  return {
    uid: u.id || u._id || u.uid || u.userId || null,
    email: u.email || null,
    role: u.role || null,
  };
}

function deckDocToJson(doc) {
  const d = doc.data() || {};
  return {
    id: doc.id,
    name: d.name || "",
    language: d.language || "ar",
    pdfId: d.pdfId || null,
    count: d.count || 0,
    knownCount: d.knownCount || 0,
    unknownCount: d.unknownCount || 0,
    createdAt: d.createdAt ? d.createdAt.toMillis?.() || d.createdAt : null,
    ownerId: d.ownerId || null,
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

function ensureOwnerOr403(deck, uid, res) {
  if (!deck.ownerId || deck.ownerId !== uid) {
    res.status(403).json({ ok: false, error: "Forbidden" });
    return true;
  }
  return false;
}

/* ---------- 1. List only my decks ---------- */
exports.listDecks = async (req, res) => {
  const { uid } = resolveUser(req);
  if (!uid) return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || 10)));
    const snap = await db
      .collection("flash_cards")
      .where("ownerId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const items = snap.docs.map(d => {
      const j = deckDocToJson(d);
      delete j.ownerId;
      return j;
    });
    return res.json({ ok: true, items, count: items.length });
  } catch (e) {
    console.error("listDecks err:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
};

/* ---------- 2. Get one deck metadata ---------- */
exports.getDeckMeta = async (req, res) => {
  const { uid } = resolveUser(req);
  if (!uid) return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    const { deckId } = req.params;
    const snap = await db.collection("flash_cards").doc(deckId).get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: "Deck not found" });

    const deck = deckDocToJson(snap);
    if (ensureOwnerOr403(deck, uid, res)) return;
    delete deck.ownerId;
    return res.json({ ok: true, deck });
  } catch (e) {
    console.error("getDeckMeta err:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
};

/* ---------- 3. Get full deck with all cards ---------- */
exports.getDeckFull = async (req, res) => {
  const { uid } = resolveUser(req);
  if (!uid) return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    const { deckId } = req.params;
    const ref = db.collection("flash_cards").doc(deckId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: "Deck not found" });

    const deck = deckDocToJson(snap);
    if (ensureOwnerOr403(deck, uid, res)) return;

    const cardsSnap = await ref.collection("cards").orderBy("order", "asc").get();
    const cards = cardsSnap.docs.map(cardDocToJson);

    delete deck.ownerId;
    return res.json({ ok: true, deck, cards, count: cards.length });
  } catch (e) {
    console.error("getDeckFull err:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
};
