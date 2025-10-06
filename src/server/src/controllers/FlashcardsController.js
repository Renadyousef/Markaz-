// server/src/controllers/FlashcardsController.js
const OpenAI = require("openai");
const { z } = require("zod");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.FLASHCARDS_MODEL || "gpt-4o-mini";

const ReqSchema = z.object({
  text: z.string().min(10),
  language: z.string().optional().default("en"),
  limit: z.number().int().min(1).max(50).optional().default(20),
});

exports.generateFromText = async (req, res) => {
  const parsed = ReqSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.format() });
  }
  const { text, language, limit } = parsed.data;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return STRICT JSON only. Generate concise study flashcards." },
        {
          role: "user",
          content: `
Create at most ${limit} flashcards in language "${language}".
Return STRICT JSON with shape:
{
  "sourceDocId":"unknown",
  "language":"${language}",
  "cards":[
    {"id":"fc_1","question":"...","answer":"...","hint":null,"tags":["..."]}
  ]
}
Text:
"""${text.slice(0, 50000)}"""
`.trim(),
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    let json;
    try {
      json = typeof raw === "object" ? raw : JSON.parse(raw);
    } catch {
      return res.status(502).json({ ok: false, error: "Model returned non-JSON", raw });
    }

    if (!Array.isArray(json.cards) || json.cards.length === 0) {
      return res.status(502).json({ ok: false, error: "No cards in model response", raw: json });
    }

    res.status(200).json({
      ok: true,
      sourceDocId: json.sourceDocId || "unknown",
      language: json.language || language,
      count: json.cards.length,
      cards: json.cards,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("generateFromText err:", err);
    res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
};
