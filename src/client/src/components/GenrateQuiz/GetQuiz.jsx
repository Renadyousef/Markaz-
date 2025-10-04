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
  const [selected, setSelected] = useState(null); // selected option (string)
  const [answers, setAnswers] = useState([]); // store user answers
  const [score, setScore] = useState(null); // final score
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAnswer, setShowAnswer] = useState(false); // new state for showing correct answer

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
        setQuiz(res.data.quiz.questions);
        setCurrentIndex(0);
        setAnswers([]);
        setScore(null);
        setSelected(null);
        setShowAnswer(false);
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

  // Normalize/split options robustly
  const getOptions = (q) => {
    if (!q) return [];
    if (q.type !== "MCQ") return [];

    const raw = q.options || [];
    const splitRegex = /[,\u060C;\/\\|•\n\r]+/;

    const flattened = [];
    if (Array.isArray(raw)) {
      raw.forEach((item) => {
        if (typeof item === "string") {
          const parts = item
            .split(splitRegex)
            .map((p) => p.trim())
            .filter(Boolean);
          if (parts.length > 0) flattened.push(...parts);
          else {
            const t = item.trim();
            if (t) flattened.push(t);
          }
        } else if (item !== null && item !== undefined) {
          flattened.push(String(item));
        }
      });
    } else if (typeof raw === "string") {
      flattened.push(
        ...raw
          .split(splitRegex)
          .map((p) => p.trim())
          .filter(Boolean)
      );
    }

    return Array.from(new Set(flattened));
  };

  // Move to next question or finish
  const nextQuestion = () => {
    if (!quiz) return;
    const currentQText = quiz[currentIndex].question || quiz[currentIndex].statement || "";
    const answerObj = { question: currentQText, selected };

    if (showAnswer && selected === null) {
      // lock null if user never selected but clicked show answer
      answerObj.selected = null;
    }

    if (currentIndex < quiz.length - 1) {
      setAnswers((prev) => [...prev, answerObj]);
      setSelected(null);
      setCurrentIndex((i) => i + 1);
      setShowAnswer(false);
    } else {
      const finalAnswers = [...answers, answerObj];
      setAnswers(finalAnswers);
      calculateScore(finalAnswers);
    }
  };

  // Calculate score
  const calculateScore = (finalAnswersParam) => {
    if (!quiz) return;
    const finalAnswers = finalAnswersParam || answers;
    let correct = 0;

    finalAnswers.forEach((ans, idx) => {
      const correctAnswer = quiz[idx]?.answer;
      if (String(ans?.selected) === String(correctAnswer)) correct++;
    });

    const finalScore = Math.round((correct / quiz.length) * 100);
    setScore(finalScore);
    saveResult(finalScore, finalAnswers);
  };

  // Save result
  const saveResult = async (finalScore, answersToSave) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/Quizess/result",
        {
          pdfId,
          level,
          score: finalScore
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
    } catch (err) {
      console.error("Error saving result:", err);
    }
  };

  const retakeQuiz = () => {
    setLevel("");
    setQuiz(null);
    setAnswers([]);
    setScore(null);
    setCurrentIndex(0);
    setSelected(null);
    setShowAnswer(false);
  };

  const exitQuiz = () => {
    navigate("/dashboard");
  };

  // Level selection screen
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

  // Final score screen
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

  // Current question rendering
  const question = quiz[currentIndex];
  const isMCQ = question?.type === "MCQ";
  const isTF = question?.type === "TF";
  const isLastQuestion = currentIndex === quiz.length - 1;
  const options = isMCQ ? getOptions(question) : [];

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
        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "#f1f5f9",
                overflow: "hidden",
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
          </div>
          <div style={{ minWidth: 70, textAlign: "right", fontWeight: 600 }}>
            {currentIndex + 1}/{quiz.length}
          </div>
        </div>

        {/* Question */}
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
          {question?.question || question?.statement}
        </p>

        {/* Options */}
        <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
          {isMCQ &&
            options.map((opt, idx) => {
              let borderColor = selected === opt ? "#f59e0b" : "#d1d5db";
              if (showAnswer) {
                const correctAnswer = quiz[currentIndex]?.answer;
                if (opt === correctAnswer) borderColor = "green";
                else if (opt === selected && selected !== correctAnswer) borderColor = "red";
              }
              return (
                <button
                  key={idx}
                  onClick={() => !showAnswer && setSelected(opt)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    border: `2px solid ${borderColor}`,
                    background: selected === opt ? "#fff7ed" : "#fff",
                    cursor: showAnswer ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    transition: "0.2s",
                    textAlign: "center",
                  }}
                >
                  {opt}
                </button>
              );
            })}

          {isTF &&
            ["صح", "خطأ"].map((opt) => {
              let borderColor = selected === opt ? "#f59e0b" : "#d1d5db";
              if (showAnswer) {
                const correctAnswer = quiz[currentIndex]?.answer;
                if (opt === correctAnswer) borderColor = "green";
                else if (opt === selected && selected !== correctAnswer) borderColor = "red";
              }
              return (
                <button
                  key={opt}
                  onClick={() => !showAnswer && setSelected(opt)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    border: `2px solid ${borderColor}`,
                    background: selected === opt ? "#fff7ed" : "#fff",
                    cursor: showAnswer ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    transition: "0.2s",
                  }}
                >
                  {opt}
                </button>
              );
            })}
        </div>

        {/* Buttons: Show Answer + Next */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => setShowAnswer(true)}
            disabled={showAnswer}
            style={{
              padding: "6px 12px",
              borderRadius: 12,
              border: "1px solid #f59e0b",
              background: "#fff7ed",
              fontWeight: 600,
              cursor: showAnswer ? "not-allowed" : "pointer",
              fontSize: 14,
            }}
          >
            عرض الإجابة الصحيحة
          </button>

          <button
            onClick={nextQuestion}
            disabled={selected === null && !showAnswer}
            style={{
              padding: "8px 16px",
              borderRadius: 12,
              border: "1px solid #f59e0b",
              background: "#fff7ed",
              fontWeight: 600,
              cursor: selected === null && !showAnswer ? "not-allowed" : "pointer",
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
