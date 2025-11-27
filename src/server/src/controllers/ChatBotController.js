const { pdf } = require("../config/firebase-config"); // Firestore reference
const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ChatBot = async (req, res) => {
  try {
    const { pdfId, message } = req.body;

    if (!message) return res.status(400).json({ ok: false, error: "Missing message" });

    let combinedReply = "";

    // --- NEW APPROACH: FULL PDF HANDLING ---
    if (pdfId) {
      const docSnap = await pdf.doc(pdfId).get();
      if (docSnap.exists) {
        const pdfText = docSnap.data().text;

        // --- Split PDF into chunks to avoid exceeding token limit ---
        const MAX_CHARS = 8000;
        const paragraphs = pdfText.split("\n\n");
        let chunks = [];
        let currentChunk = "";

        for (const p of paragraphs) {
          if ((currentChunk + p).length > MAX_CHARS) {
            chunks.push(currentChunk);
            currentChunk = p + "\n\n";
          } else {
            currentChunk += p + "\n\n";
          }
        }
        if (currentChunk) chunks.push(currentChunk);

        // --- Send all chunks in parallel and collect responses ---
        const responses = await Promise.all(
          chunks.map((chunk) =>
            client.chat.completions.create({
              model: "gpt-4",
              messages: [
                {
                  role: "system",
                  content:
                    "أنت مساعد مذاكره ذكي باللغة العربية، تجيب بشكل ودود وبسيط. إذا كانت محتويات PDF كبيرة، قم بالرد على كل جزء بشكل واضح."
                },
                { role: "user", content: `المحتوى التالي من PDF:\n${chunk}\n\nسؤال المستخدم: ${message}` }
              ],
              temperature: 0.5,
              max_tokens: 800,
            })
          )
        );

        combinedReply = responses
          .map((r) => r.choices?.[0]?.message?.content)
          .filter(Boolean)
          .join("\n\n");
      }
    }

    // --- If no PDF or normal message, just send the user message to GPT ---
    if (!pdfId || combinedReply === "") {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "أنت مساعد ذكي باللغة العربية، تجيب بشكل ودود وبسيط."
          },
          { role: "user", content: message }
        ],
        temperature: 0.5,
        max_tokens: 800,
      });

      combinedReply = response.choices?.[0]?.message?.content || "! لم أستطع معالجة الرسالة.";
    }

    res.status(200).json({ ok: true, reply: combinedReply });
  } catch (err) {
    console.error("ChatBot Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = { ChatBot };
