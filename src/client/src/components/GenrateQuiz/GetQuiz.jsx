import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function GetQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pdfId } = location.state || {}; // PDF ID from Upload page

  const [level, setLevel] = useState(""); // user-selected level
  const [quiz, setQuiz] = useState(null); // questions from backend
  const [currentIndex, setCurrentIndex] = useState(0); // current question index
  const [selected, setSelected] = useState(null); // selected option
  const [answers, setAnswers] = useState([]); // store user answers
  const [score, setScore] = useState(null); // final score
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch quiz from backend
  const fetchQuiz = async () => {
    if (!pdfId || !level) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/Quizess/GetQuiz",
        { pdfId, level },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      if (res.data?.ok) {
        setQuiz(res.data.quiz.questions); // backend returns quiz.questions
        setCurrentIndex(0);
        setAnswers([]);
        setScore(null);
      } else {
        setError(res.data?.msg || "خطأ في إنشاء الاختبار");
      }
    } catch (e) {
      setError(e.message || "خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [pdfId, level]);

  // Move to next question or finish
  const nextQuestion = () => {
    setAnswers((prev) => [
      ...prev,
      { question: quiz[currentIndex].question || quiz[currentIndex].statement, selected },
    ]);
    setSelected(null);

    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      calculateScore();
    }
  };

  // Calculate score
  const calculateScore = () => {
    let correct = 0;
    answers.push({ question: quiz[currentIndex].question || quiz[currentIndex].statement, selected }); // add last answer

    answers.forEach((ans, idx) => {
      const correctAnswer = quiz[idx].answer;
      if (ans.selected === correctAnswer) correct++;
    });

    const finalScore = Math.round((correct / quiz.length) * 100);
    setScore(finalScore);
    saveResult(finalScore);
  };

  // Save result to backend
  const saveResult = async (finalScore) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/Quizess/SaveResult",
        {
          pdfId,
          level,
          score: finalScore,
          answers,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
    } catch (err) {
      console.error("Error saving result:", err);
    }
  };

  // Reset quiz
  const retakeQuiz = () => {
    setLevel("");
    setQuiz(null);
    setAnswers([]);
    setScore(null);
    setCurrentIndex(0);
    setSelected(null);
  };

  // Exit quiz
  const exitQuiz = () => {
    navigate("/dashboard"); // or wherever
  };

  // Show level selection
  if (!quiz) {
    return (
      <div style={{ display: "grid", placeItems: "center", padding: 24 }}>
        <div
          style={{
            width: "min(400px, 96%)",
            background: "#fff",
            borderRadius: 14,
            padding: 24,
            boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
            border: "1px solid #eef2f7",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontWeight: 800, marginBottom: 20 }}>اختر مستوى الاختبار</h2>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
            {["سهل", "متوسط", "صعب"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: level === lvl ? "2px solid #f59e0b" : "1px solid #d1d5db",
                  background: level === lvl ? "#fff7ed" : "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "0.2s",
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
          {loading && <p>جاري تحميل الاختبار...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </div>
    );
  }

  // Show final score
  if (score !== null) {
    return (
      <div style={{ display: "grid", placeItems: "center", padding: 24 }}>
        <div
          style={{
            width: "min(400px, 96%)",
            background: "#fff",
            borderRadius: 14,
            padding: 24,
            boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
            border: "1px solid #eef2f7",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontWeight: 800, marginBottom: 20 }}>لقد أكملت الاختبار!</h2>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
            نتيجتك: {score}%
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={retakeQuiz}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: "1px solid #f59e0b",
                background: "#fff7ed",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              إعادة الاختبار
            </button>
            <button
              onClick={exitQuiz}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              إنهاء
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render current question
  const question = quiz[currentIndex];
  const isMCQ = question.type === "MCQ";
  const isTF = question.type === "TF";
  const isLastQuestion = currentIndex === quiz.length - 1;

  return (
    <div style={{ display: "grid", placeItems: "center", padding: 24 }}>
      <div
        style={{
          width: "min(800px, 96%)",
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
          border: "1px solid #eef2f7",
        }}
      >
        <h2 style={{ fontWeight: 800, marginBottom: 20 }}>نموذج الاختبار</h2>

        {/* Question */}
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
          {question.question || question.statement}
        </p>

        {/* Options */}
        <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
          {isMCQ &&
            question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setSelected(opt)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: selected === opt ? "2px solid #f59e0b" : "1px solid #d1d5db",
                  background: selected === opt ? "#fff7ed" : "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "0.2s",
                }}
              >
                {opt}
              </button>
            ))}

          {isTF &&
            ["صح", "خطأ"].map((opt) => (
              <button
                key={opt}
                onClick={() => setSelected(opt === "صح")}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: selected === (opt === "صح") ? "2px solid #f59e0b" : "1px solid #d1d5db",
                  background: selected === (opt === "صح") ? "#fff7ed" : "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "0.2s",
                }}
              >
                {opt}
              </button>
            ))}
        </div>

        {/* Progress & Next */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              flex: 1,
              height: 8,
              borderRadius: 999,
              background: "#f1f5f9",
              overflow: "hidden",
              marginRight: 12,
            }}
          >
            <div
              style={{
                width: `${((currentIndex + 1) / quiz.length) * 100}%`,
                height: "100%",
                background: "#f59e0b",
                transition: "0.3s",
              }}
            />
          </div>
          <button
            onClick={nextQuestion}
            disabled={selected === null}
            style={{
              padding: "8px 16px",
              borderRadius: 12,
              border: "1px solid #f59e0b",
              background: "#fff7ed",
              fontWeight: 600,
              cursor: selected === null ? "not-allowed" : "pointer",
              transition: "0.2s",
            }}
          >
            {isLastQuestion ? "إنهاء" : "التالي"}
          </button>
        </div>
      </div>
    </div>
  );
}
