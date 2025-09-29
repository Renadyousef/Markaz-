const { Quizzes } = require("../../config/firebase-config");
const axios = require("axios");

const genrateQuiz = async (req, res) => {
  try {
    const { text, level, studentId } = req.body;//we could be passing token tho usage of middle ware
    if (!studentId) return res.status(400).json({ ok: false, error: "studentId required" });

    // Call external model server
    const quiz = await axios.post("http://127.0.0.1:8000", { text, level });
    const quizData = quiz.data;

    // Save quiz to DB
    const docRef = await Quizzes.add({
      questions: quizData.questions,
      student_Id:studentId,
      createdAt: new Date(),
    });

    // Return quiz to frontend
    res.json({ ok: true, quiz: quizData, id: docRef.id });
  } catch (err) {
    console.error("Error generating quiz:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = { genrateQuiz };
