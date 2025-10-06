const { QuizResult, pdf } = require("../../config/firebase-config");

// GET /quiz-results
const get_quiz_results = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("📥 Fetching quiz results for:", userId);

    // 1️⃣ Fetch quiz results for this user
    const quizSnap = await QuizResult.where("user_id", "==", userId).get();
    console.log("📊 Quiz results found:", quizSnap.size);

    if (quizSnap.empty) return res.status(200).json({ quizzes: [] });

    const quizDocs = quizSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2️⃣ Collect all unique pdfIds
    const pdfIds = [...new Set(quizDocs.map(q => q.pdfId).filter(Boolean))];

    // 3️⃣ Fetch PDF docs and map their names
    const pdfMap = {};
    if (pdfIds.length > 0) {
      const pdfPromises = pdfIds.map(id => pdf.doc(id).get());
      const pdfDocs = await Promise.all(pdfPromises);

      pdfDocs.forEach(doc => {
        if (doc.exists) {
          const data = doc.data();
          pdfMap[doc.id] = data.originalName || data.name || "Unnamed PDF";
        }
      });
    }

    // 4️⃣ Combine quiz results with their PDF names
    const results = quizDocs.map(q => ({
      pdfId: q.pdfId,
      originalName: pdfMap[q.pdfId] || "Unknown PDF",
      score: q.score,
      level: q.level,
      createdAt: q.createdAt,
    }));

    console.log("✅ Final mapped results:", results);
    return res.status(200).json({ quizzes: results });
  } catch (err) {
    console.error("❌ Error fetching quiz results:", err);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

module.exports = { get_quiz_results };
