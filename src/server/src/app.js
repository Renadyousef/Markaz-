// server/src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Middlewares
const { verifyToken } = require("./middleware/authMiddleware");

// Routers
const authRoutes = require("./routes/authRoutes");
const homeRoutes = require("./routes/homeRoutes");
const sidebarRoutes = require("./routes/sidebarRoutes");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes"); 
const uploadRoutes = require("./routes/uploadRoutes");
const QuizRoutes=require("./routes/quizRoutes")
const FlashcardsRoutes = require("./routes/FlashcardsRoutes");
const flashcardsRetriveRoutes = require("./routes/flashcardsRetriveRoutes");
const passwordReset = require("./routes/ResetRoutes"); 
const studySessionRoutes = require("./routes/studySessionRoutes");
const ChatBot=require('./routes/ChatBotRoute')
const studyPlanRoutes = require("./routes/studyPlanRoutes");       
const studyPlanFetchRoutes = require("./routes/studyPlanFetchRoutes"); 
const studyPlanListRoutes = require("./routes/studyPlanListRoutes");
const studyPlanTasksRoutes = require("./routes/studyPlanTasksRoutes");
const progressRoutes = require("./routes/progressRoutes");

const OpenAI = require("openai");
const app = express();

// app.get("/api/diag/openai", async (req, res) => {
//   try {
//     const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//     const out = await client.models.list();
//     res.json({ ok: true, firstModel: out.data?.[0]?.id || null });
//   } catch (err) {
//     res.status(err?.status || 500).json({
//       ok: false,
//       status: err?.status || null,
//       error: err?.message || String(err),
//       // لو 429: فوترة/حدود
//     });
//   }
// });
// ========== Middlewares عامة ==========
app.use(cors());            // يسمح بالطلبات بين React و Express
app.use(express.json());    // يحلل JSON القادم من الـ request


// ========== الراوترات ==========
app.use("/auth", authRoutes);       // POST /auth/signin
app.use("/home", homeRoutes);       // GET /home/me (يتطلب توكن)
app.use("/sidebar", sidebarRoutes); // GET /sidebar/me (يتطلب توكن)
app.use("/user", userRoutes);       // تجريب session أو جلب بيانات المستخدم
app.use("/profile", profileRoutes);
app.use("/home", uploadRoutes);
app.use("/Quizess",QuizRoutes)
app.use("/api/flashcards", FlashcardsRoutes);  
app.use("/retrive", flashcardsRetriveRoutes); 
app.use("/ResetRoutes", passwordReset );
app.use("/sessions", studySessionRoutes);
//ChatBot
app.use("/chat",ChatBot);
app.use("/study-plans", require("./routes/studyPlanRoutes"));
app.use("/study-plans", studyPlanRoutes); // ← انتبهي: هذا يبقى كما هو
app.use("/", studyPlanFetchRoutes);       // ← overview
app.use("/study-plans", studyPlanListRoutes); 
app.use("/study-plans", studyPlanTasksRoutes); 
app.use("/api/progress", progressRoutes);
// ====== Polly ثابت ======
const VOICE_META = {
  Hala:  { label: "Hala (Arabic Gulf, Neural, Female)", engine: "neural" },
  Zayd:  { label: "Zayd (Arabic Gulf, Neural, Male)",   engine: "neural" },
  Zeina: { label: "Zeina (Standard Arabic, Female)",    engine: "standard" },
};

// GET /voices — يشتغل دائمًا
app.get("/voices", (req, res) => {
  res.json({
    region: process.env.AWS_REGION,
    items: Object.entries(VOICE_META).map(([id, v]) => ({ id, ...v })),
  });
});

// نعلن متغير polly هنا عشان نستخدمه لاحقًا
let polly, SynthesizeSpeechCommand, DescribeVoicesCommand;

// GET /voices/aws (يتطلب AWS)
app.get("/voices/aws", async (req, res) => {
  if (!polly) return res.status(500).json({ error: "Polly not initialized" });
  try {
    const out = await polly.send(new DescribeVoicesCommand({ LanguageCode: "ar-AE" }));
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: "DescribeVoices failed", details: String(e) });
  }
});

// POST /tts (يتطلب AWS)
app.post("/tts", async (req, res) => {
  if (!polly) return res.status(500).json({ error: "Polly not initialized" });
  try {
    const { text = "", voiceId = "Hala", format = "mp3", ssml = false } = req.body;
    if (!text.trim()) return res.status(400).json({ error: "text is required" });

    const VOICE = VOICE_META[voiceId];
    if (!VOICE) return res.status(400).json({ error: "Unsupported voiceId" });

    const cmd = new SynthesizeSpeechCommand({
      VoiceId: voiceId,
      OutputFormat: format,
      Text: text,
      TextType: ssml ? "ssml" : "text",
      Engine: VOICE.engine === "neural" ? "neural" : "standard",
    });

    const data = await polly.send(cmd);
    res.setHeader("Content-Type", data.ContentType || "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    data.AudioStream.pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "TTS failed", details: String(e) });
  }
});

// ====== تحميل AWS SDK بشكل ديناميكي ======
(async () => {
  try {
    const pollyModule = await import("@aws-sdk/client-polly");
    const { PollyClient } = pollyModule;
    SynthesizeSpeechCommand = pollyModule.SynthesizeSpeechCommand;
    DescribeVoicesCommand = pollyModule.DescribeVoicesCommand;

    polly = new PollyClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log("✅ Amazon Polly initialized");
  } catch (err) {
    console.error("❌ Failed to load @aws-sdk/client-polly:", err);
  }
})();

// ===== 404 =====

// ========== 404 ==========
app.use((req, res) => {
  res.status(404).json({
    msg: "المسار غير موجود",
    method: req.method,
    url: req.originalUrl,
  });
});

// ========== Error Handler ==========
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ msg: "خطأ في الخادم", error: err.message });
});


// هنا التركيب الصحيح:
 
module.exports = app;
