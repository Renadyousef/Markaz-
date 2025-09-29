const { Quizzes, pdf } = require("../../config/firebase-config");
const axios = require("axios");

const generateQuiz = async (req, res) => {
  try {
    const { pdfId, level } = req.body; // <-- PDF ID comes from frontend
    const studentId = req.user?.id; // <-- user ID comes from token decoded in middleware

    if (!studentId) return res.status(400).json({ ok: false, error: "studentId required" });
    if (!pdfId) return res.status(400).json({ ok: false, error: "pdfId required" });
    if (!level) return res.status(400).json({ ok: false, error: "level required" });

    // Fetch the PDF text from Firebase or wherever you store it
    const pdfDoc = await pdf.doc(pdfId).get();
    if (!pdfDoc.exists) return res.status(404).json({ ok: false, error: "PDF not found" });

    const text = pdfDoc.data().text; // assuming your PDF text is stored under `text`

    // Call external model server to generate quiz
    const quizRes = await axios.post("http://127.0.0.1:8000/generate_quiz", { text, level });
    const quizData = quizRes.data;

    // Save quiz to Firebase
    const docRef = await Quizzes.add({
      questions: quizData.questions,
      student_Id: studentId,
      pdfId: pdfId,
      level,
      createdAt: new Date(),
    });

    // Return quiz to frontend
    res.json({ ok: true, quiz: quizData, id: docRef.id });//returning full quiz
  } catch (err) {
    console.error("Error generating quiz:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = { generateQuiz };
