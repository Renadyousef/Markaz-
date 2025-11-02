const { pdf } = require("../config/firebase-config"); // Firestore reference
const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ChatBot = async (req, res) => {
  try {
    const { pdfId, message } = req.body;

    if (!message) return res.status(400).json({ ok: false, error: "Missing message" });

    let promptContent = `سؤال المستخدم: ${message}`;

    // If pdfId exists, try to fetch PDF content
    if (pdfId) {
      const docSnap = await pdf.doc(pdfId).get();
      if (docSnap.exists) {
        const pdfText = docSnap.data().text;
        promptContent = `المحتوى التالي من PDF:\n${pdfText}\n\nسؤال المستخدم: ${message}`;
      }
      // if PDF doesn't exist, we just continue with user's message
    }

    // Send prompt to OpenAI (Arabic chatbot)
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "أنت مساعد ذكي باللغة العربية، تجيب بشكل ودود وبسيط." },
        { role: "user", content: promptContent }
      ],
      temperature: 0.5,
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
