const { QuizResult, pdf } = require("../../config/firebase-config");

// GET /quiz-results
const get_quiz_results = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all QuizResult docs for this user
    const quizSnap = await QuizResult.where("user_id", "==", userId).get();
    if (quizSnap.empty) return res.status(200).json({ quizzes: [] });

    // Fetch all pdf docs for this user
    const pdfSnap = await pdf.where("userId", "==", userId).get();
    const pdfMap = {};
    pdfSnap.forEach((doc) => {
      const data = doc.data();
      pdfMap[data.originalName] = data.originalName; // or store more if needed
    });

    // Map results
    const results = quizSnap.docs.map((doc) => {
      const data = doc.data();
      const originalName = pdfMap[data.pdfName] || data.pdfName;
      return {
        pdfName: data.pdfName,
        originalName,
        score: data.score,
        createdAt: data.createdAt,
      };
    });

    return res.status(200).json({ quizzes: results });
  } catch (err) {
    console.error("Error fetching quiz results:", err);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

module.exports = { get_quiz_results };
