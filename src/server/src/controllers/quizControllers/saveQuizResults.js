const { QuizResult } = require("../../config/firebase-config");

// Save result in QuizResult
const save_quiz_result = async (req, res) => {
  try {
    const { pdfId, level, score } = req.body;

    if (!pdfId || !level || score === undefined) {
      return res.status(400).json({ ok: false, msg: "Missing required fields" });
    }

  
    await QuizResult.add({
      pdfId,
      level,
      score,
      createdAt: new Date(),
    });

    return res.status(200).json({ ok: true, msg: "Result saved successfully" });
  } catch (error) {
    console.error("Error saving result:", error);
    return res.status(500).json({ ok: false, msg: "Server error" });
  }
};

module.exports = { save_quiz_result };
