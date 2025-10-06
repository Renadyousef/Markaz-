require('dotenv').config();
const OpenAI = require('openai');

(async () => {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is missing in server/.env");

    const client = new OpenAI({ apiKey: key });
    const models = await client.models.list();

    console.log("✅ Connected. First model:", models.data?.[0]?.id);
  } catch (err) {
    console.error("❌ OpenAI test failed:", err.status || "", err.message);
  }
})();
