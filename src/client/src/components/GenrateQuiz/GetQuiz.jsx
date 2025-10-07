// GetQuiz.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import TTSControls from "./TTSControls";
import FontSettings from "./FontSettings";

const A11Y_KEY = "quiz_a11y_settings";
const DEFAULT_A11Y = { baseSize: 18, lineHeight: 1.6, letterSpacing: 0.0 };

export default function GetQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pdfId } = location.state || {}; // PDF ID from Upload page

  const [level, setLevel] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  // Font popup + a11y state
  const [showFontPopup, setShowFontPopup] = useState(true);
  const [a11y, setA11y] = useState(() => {
    try {
      const raw = localStorage.getItem(A11Y_KEY);
      return raw ? { ...DEFAULT_A11Y, ...JSON.parse(raw) } : DEFAULT_A11Y;
    } catch {
      return DEFAULT_A11Y;
    }
  });

  // Load quiz from backend
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfId, level]);

  // Keep showAnswer/reset in sync when moving between questions
  useEffect(() => {
    // whenever question index changes, clear selection and hide answer
    setSelected(null);
    setShowAnswer(false);
  }, [currentIndex]);

  // Helper to load options robustly
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

  // Navigate to next question or finish
  const nextQuestion = () => {
    if (!quiz) return;
    const currentQText =
      quiz[currentIndex].question || quiz[currentIndex].statement || "";
    const answerObj = { question: currentQText, selected };

    if (showAnswer && selected === null) {
      // user asked to show answer without selecting
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

  // Score calculation + save
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
    saveResult(finalScore);
  };

  const saveResult = async (finalScore) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/Quizess/result",
        { pdfId, level, score: finalScore },
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
    setShowFontPopup(true); // optionally show font popup again
  };

  const exitQuiz = () => {
    navigate("/quizzes");
  };

  // When user saves font settings, FontSettings calls onSave(draft).
  // Accept the draft if provided, otherwise reload from localStorage (safe).
  function handleFontSave(draft) {
    try {
      if (draft && typeof draft === "object") {
        setA11y({ ...DEFAULT_A11Y, ...draft });
      } else {
        const raw = localStorage.getItem(A11Y_KEY);
        if (raw) setA11y({ ...DEFAULT_A11Y, ...JSON.parse(raw) });
      }
    } catch {
      setA11y(DEFAULT_A11Y);
    } finally {
      setShowFontPopup(false);
    }
  }

  // --- Render flow ---------------------------------------------------------

  // Show font modal before level selection
  if (showFontPopup) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: 20,
        }}
      >
        <div style={{ maxHeight: "90vh", overflowY: "auto", width: "min(520px, 96%)" }}>
          <FontSettings onSave={handleFontSave} />
          {/* optional: quick skip button in case user doesn't want to save */}
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button
              onClick={() => {
                // keep current a11y (already loaded) and close popup
                setShowFontPopup(false);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#6b7280",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              تخطي
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Level selection (apply a11y to header)
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
          <h2
            style={{
              fontWeight: 800,
              marginBottom: 20,
              fontSize: `${a11y.baseSize}px`,
              lineHeight: a11y.lineHeight,
            }}
          >
            اختر مستوى الاختبار
          </h2>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
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
                  fontSize: `${Math.max(14, a11y.baseSize - 2)}px`,
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

  // Final score screen (use a11y for text)
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
          <h2 style={{ fontWeight: 800, marginBottom: 20, fontSize: `${a11y.baseSize}px`, lineHeight: a11y.lineHeight }}>
            لقد أكملت الاختبار!
          </h2>
          <p style={{ fontSize: `${a11y.baseSize}px`, fontWeight: 600, marginBottom: 20 }}>
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
                fontSize: `${Math.max(14, a11y.baseSize - 2)}px`,
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
                fontSize: `${Math.max(14, a11y.baseSize - 2)}px`,
              }}
            >
              إنهاء
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Current question
  const question = quiz[currentIndex];
  const isMCQ = question?.type === "MCQ";
  const isTF = question?.type === "TF";
  const isLastQuestion = currentIndex === quiz.length - 1;
  const options = isMCQ ? getOptions(question) : [];

  // styles derived from a11y
  const questionStyle = {
    fontSize: `${a11y.baseSize}px`,
    lineHeight: a11y.lineHeight,
    letterSpacing: `${a11y.letterSpacing}px`,
    fontWeight: 600,
    marginBottom: 10,
  };

  const optionFontSize = Math.max(14, a11y.baseSize - 1);

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
            <div style={{ height: 8, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
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

        {/* Question + TTS */}
        <div style={{ marginBottom: 12 }}>
          <p style={questionStyle}>
            {question?.question || question?.statement}
          </p>

          <TTSControls key={currentIndex} text={question?.question || question?.statement || ""} />
        </div>

        {/* Options */}
        <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
          {(isMCQ ? options : ["صح", "خطأ"]).map((opt, idx) => {
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
                  fontSize: `${optionFontSize}px`,
                  lineHeight: a11y.lineHeight,
                  letterSpacing: `${a11y.letterSpacing}px`,
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Controls */}
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
