const { pdf } = require("../config/firebase-config"); // Firestore reference
const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ChatBot = async (req, res) => {
  try {
    const { pdfId, message } = req.body;

    if (!pdfId) return res.status(400).json({ ok: false, error: "Missing pdfId" });
    if (!message) return res.status(400).json({ ok: false, error: "Missing message" });

    // Fetch PDF content
    const docSnap = await pdf.doc(pdfId).get();
    if (!docSnap.exists) return res.status(404).json({ ok: false, error: "PDF not found" });

    const pdfText = docSnap.data().text;

    // Send prompt to OpenAI (Arabic chatbot)
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "أنت مساعد ذكي باللغة العربية، تجيب بشكل ودود وبسيط." },
        { role: "user", content: `المحتوى التالي من PDF:\n${pdfText}\n\nسؤال المستخدم: ${message}` }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = response.choices?.[0]?.message?.content || "! لم أستطع معالجة الرسالة.";

    res.status(200).json({ ok: true, reply });

  } catch (err) {
    console.error("ChatBot Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = { ChatBot };
