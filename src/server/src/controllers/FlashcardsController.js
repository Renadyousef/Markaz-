// server/src/controllers/FlashcardsController.js
const OpenAI = require("openai");
const { z } = require("zod");
const { v4: uuidv4 } = require("uuid");

// Ensure Firebase Admin is initialized once (same style as upload)
require("../config/firebase-config");
const admin = require("firebase-admin");
const db = admin.firestore();

// OpenAI client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL  = process.env.FLASHCARDS_MODEL || "gpt-4o-mini";

/* ========== Schemas ========== */
const FromTextSchema = z.object({
  text: z.string().min(10),
  language: z.string().optional().default("ar"),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

const SaveDeckSchema = z.object({
  pdfId: z.string().min(3),
  language: z.string().default("ar"),
  deckName: z.string().trim().min(1).max(80).optional().default("مجموعة بدون اسم"),
  known: z.array(z.string()).optional().default([]),
  unknown: z.array(z.string()).optional().default([]),
  cards: z.array(z.object({
    id: z.string().optional(),
    question: z.string().min(1),
    answer: z.string().min(1),
    hint: z.string().nullish().default(null),
    tags: z.array(z.string()).optional().default([]),
  })).min(1),
});

/* ========== Helpers ========== */
async function getPdfText(pdfId) {
  const snap = await db.collection("pdf").doc(pdfId).get();
  if (!snap.exists) return "";
  const data = snap.data() || {};
  return data.text || "";
}

function normalizeModelCards(cards) {
  return (Array.isArray(cards) ? cards : [])
    .map((c, idx) => ({
      id: c.id || `fc_${idx}_${uuidv4().slice(0,6)}`,
      question: String(c.question || "").trim(),
      answer: String(c.answer || "").trim(),
      hint: c.hint ?? null,
      tags: Array.isArray(c.tags) ? c.tags : [],
    }))
    .filter(c => c.question && c.answer);
}

/* ========== Controllers ========== */

// 1) Generate from free text (no save)
exports.generateFromText = async (req, res) => {
  const parsed = FromTextSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok:false, error: parsed.error.format() });
  }
  const { text, language, limit } = parsed.data;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return STRICT JSON only. Generate concise *definition* flashcards in Arabic." },
        {
          role: "user",
          content: `
Create up to ${limit} Arabic flashcards (definition style).
Return STRICT JSON:
{
  "sourceDocId":"unknown",
  "language":"${language}",
  "cards":[
    {"id":"fc_1","question":"اسم المصطلح","answer":"تعريف مختصر وواضح","hint":null,"tags":["تعريف"]}
  ]
}
Text:
"""${String(text).slice(0, 50000)}"""
`.trim(),
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    let json;
    try { json = typeof raw === "object" ? raw : JSON.parse(raw); }
    catch { return res.status(502).json({ ok:false, error:"Model returned non-JSON", raw }); }

    const cards = normalizeModelCards(json.cards);
    if (cards.length === 0) return res.status(502).json({ ok:false, error:"No cards in model response", raw: json });

    return res.status(200).json({
      ok: true,
      sourceDocId: json.sourceDocId || "unknown",
      language: json.language || language,
      count: cards.length,
      cards,
    });
  } catch (err) {
    console.error("generateFromText err:", err);
    return res.status(500).json({ ok:false, error: err?.message || "Server error" });
  }
};

// 2) Generate from pdfId (no save)
exports.generateFromPdfId = async (req, res) => {
  try {
    const pdfId = req.params.pdfId || req.body.pdfId;
    const limit = Math.max(1, Math.min(10, Number(req.query.limit || req.body.limit || 10)));
    const language = "ar";

    if (!pdfId) return res.status(400).json({ ok:false, error:"pdfId is required" });

    const text = await getPdfText(pdfId);
    if (!text || text.length < 10) {
      return res.status(404).json({ ok:false, error:"No extracted text for this pdfId" });
    }

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return STRICT JSON only. Generate concise *definition* flashcards in Arabic." },
        {
          role: "user",
          content: `
Create up to ${limit} Arabic flashcards (definition style).
Return STRICT JSON:
{
  "sourceDocId":"${pdfId}",
  "language":"${language}",
  "cards":[
    {"id":"fc_1","question":"اسم المصطلح","answer":"تعريف مختصر وواضح","hint":null,"tags":["تعريف"]}
  ]
}
Text:
"""${String(text).slice(0, 50000)}"""
`.trim(),
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    let json;
    try { json = typeof raw === "object" ? raw : JSON.parse(raw); }
    catch { return res.status(502).json({ ok:false, error:"Model returned non-JSON", raw }); }

    const cards = normalizeModelCards(json.cards);
    if (cards.length === 0) return res.status(502).json({ ok:false, error:"No cards in model response", raw: json });

    return res.status(200).json({
      ok: true,
      pdfId,
      language,
      count: cards.length,
      cards,
      saved: false,
    });
  } catch (err) {
    console.error("generateFromPdfId err:", err);
    return res.status(500).json({ ok:false, error: err?.message || "Server error" });
  }
};

// 3) Save approved deck
exports.saveDeck = async (req, res) => {
  const parsed = SaveDeckSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok:false, error: parsed.error.format() });
  }
  const { pdfId, language, cards, known, unknown, deckName } = parsed.data;

  try {
    const deckId = uuidv4().slice(0, 12);
    const deckRef = db.collection("flash_cards").doc(deckId);

    await deckRef.set({
      name: deckName,
      nameLower: (deckName || "").toLowerCase(),
      pdfId,
      language,
      count: cards.length,
      knownCount: known.length,
      unknownCount: unknown.length,
      knownIds: known,
      unknownIds: unknown,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const batch = db.batch();
    const sub = deckRef.collection("cards");
    cards.forEach((c, idx) => {
      const id = c.id || `c_${idx}_${uuidv4().slice(0,6)}`;
      batch.set(sub.doc(id), {
        question: c.question,
        answer: c.answer,
        hint: c.hint ?? null,
        tags: Array.isArray(c.tags) ? c.tags : [],
        order: idx,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    return res.status(200).json({
      ok:true,
      deckId,
      name: deckName,
      count: cards.length,
      message: `تم الحفظ بنجاح: "${deckName}" (ID: ${deckId})`,
    });
  } catch (e) {
    console.error("saveDeck err:", e);
    return res.status(500).json({ ok:false, error: e?.message || "Server error" });
  }
};

// 4) Read a saved deck
exports.getDeckCards = async (req, res) => {
  try {
    const { deckId } = req.params;
    const deckRef = db.collection("flash_cards").doc(deckId);
    const deckSnap = await deckRef.get();
    if (!deckSnap.exists) return res.status(404).json({ ok:false, error:"Deck not found" });

    const qs = await deckRef.collection("cards").orderBy("order", "asc").get();
    const cards = qs.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ ok:true, deck:{ id: deckId, ...deckSnap.data() }, cards });
  } catch (e) {
    return res.status(500).json({ ok:false, error: e.message });
  }
};
