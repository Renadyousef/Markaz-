// GetQuiz.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import TTSControls from "./TTSControls";
import FontSettings from "./FontSettings";
import "./GetQuiz.css";
import { FiX } from "react-icons/fi"; // X icon for exit
import { FiCheck } from "react-icons/fi"; // Check icon for confirm

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
const [showExitConfirm, setShowExitConfirm] = useState(false);

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
      //batch for level
      //  Arabic → English mapping
    const levelMap = {
      "سهل": "easy",
      "متوسط": "medium",
      "صعب": "hard",
      "easy": "easy",
      "medium": "medium",
      "hard": "hard"
    };

    const englishLevel = levelMap[level] || "medium";

      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/Quizess/GetQuiz", //why is level always meduim?
        { pdfId,englishLevel },
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
  const PRIMARY_COLOR = "#ff8c42";

  const levelOptions = [
    {
      id: "easy",
      label: "سهل",
      desc: "أسئلة مباشرة للمراجعة السريعة",
    },
    {
      id: "medium",
      label: "متوسط",
      desc: "مستوى متوازن لاختبار فهمك",
    },
    {
      id: "hard",
      label: "صعب",
      desc: "تحدٍّ عالٍ لقياس إتقانك",
    },
  ];

  const getIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="6"
        fill="none"
        stroke={PRIMARY_COLOR}
        strokeWidth="1.5"
      />
      <path
        d="M9 12.5l2 2.2 4-4.4"
        fill="none"
        stroke={PRIMARY_COLOR}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          width: "min(460px, 100%)",
          background: "#ffffff",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
          border: "1px solid #e5e7eb",
          textAlign: "center",
        }}
      >
        {/* العنوان + الديسكربشن */}
        <div style={{ marginBottom: 20 }}>
          <h2
            style={{
              fontWeight: 800,
              marginBottom: 8,
              fontSize: `${a11y.baseSize + 2}px`,
              lineHeight: a11y.lineHeight,
              color: "#111827",
            }}
          >
            اختر مستوى الاختبار
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: `${a11y.baseSize - 2}px`,
              color: "#6b7280",
            }}
          >
            اختر المستوى الأنسب لك لبدء الاختبار.
          </p>
        </div>

        {/* الأزرار */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {levelOptions.map((opt) => {
            const isActive = level === opt.label;
            return (
              <button
                key={opt.id}
                onClick={() => setLevel(opt.label)}
                className="quiz-level-btn"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: isActive
                    ? `2px solid ${PRIMARY_COLOR}`
                    : "1px solid #e5e7eb",
                  background: isActive ? "rgba(255,140,66,0.06)" : "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 12,
                  transition: "all 0.18s ease",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "999px",
                    border: `1px solid ${PRIMARY_COLOR}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isActive
                      ? "rgba(255,140,66,0.09)"
                      : "#fff",
                  }}
                >
                  {getIcon()}
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: `${a11y.baseSize - 1}px`,
                      color: "#111827",
                    }}
                  >
                    {opt.label}
                  </div>
                  <div
                    style={{
                      fontSize: `${a11y.baseSize - 3}px`,
                      color: "#6b7280",
                    }}
                  >
                    {opt.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* حالة التحميل / الخطأ – نفس لوجيكك */}
        <div style={{ marginTop: 18, minHeight: 24 }}>
          {loading && (
            <p
              style={{
                margin: 0,
                fontSize: `${a11y.baseSize - 3}px`,
                color: PRIMARY_COLOR,
              }}
            >
              جاري تحميل الاختبار...
            </p>
          )}
          {error && !loading && (
            <p
              style={{
                margin: 0,
                fontSize: `${a11y.baseSize - 3}px`,
                color: "#ef4444",
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

  // Final score screen (use a11y for text)
  // Final score screen (modern card similar to level selection)
  if (score !== null) {
    const PRIMARY_COLOR = "#ff8c42";
    const passed = score > 50; // أكثر من ٥٠٪

    const title = "لقد أكملت الاختبار!";
    const subtitle = passed
      ? "نتيجتك جيدة، حافظ على مستواك واستمر في المراجعة لتحسينها أكثر."
      : "يمكنك إعادة المحاولة لتحسين نتيجتك والاستفادة أكثر من المحتوى.";

    return (
      <div
        style={{
          minHeight: "60vh",
          display: "grid",
          placeItems: "center",
          padding: "32px 16px",
        }}
      >
        <div
          style={{
            width: "min(460px, 100%)",
            background: "#ffffff",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
            border: "1px solid #e5e7eb",
            textAlign: "center",
          }}
        >
          {/* أيقونة دائرية في الأعلى (بدون إيموجيز) */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "999px",
              margin: "0 auto 18px",
              border: `2px solid ${PRIMARY_COLOR}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,140,66,0.06)",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ display: "block" }}
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="6"
                fill="none"
                stroke={PRIMARY_COLOR}
                strokeWidth="1.8"
              />
              <path
                d="M9 12.5l2 2.2 4-4.4"
                fill="none"
                stroke={PRIMARY_COLOR}
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* العنوان والوصف حسب النتيجة */}
          <h2
            style={{
              fontWeight: 800,
              marginBottom: 8,
              fontSize: `${a11y.baseSize + 2}px`,
              lineHeight: a11y.lineHeight,
              color: "#111827",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              margin: 0,
              marginBottom: 16,
              fontSize: `${a11y.baseSize - 2}px`,
              color: "#6b7280",
            }}
          >
            {subtitle}
          </p>

          {/* شارة النتيجة */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(255,140,66,0.06)",
              border: `1px solid ${PRIMARY_COLOR}`,
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: `${a11y.baseSize - 2}px`,
                color: "#111827",
              }}
            >
              نتيجتك
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: `${a11y.baseSize}px`,
                color: PRIMARY_COLOR,
              }}
            >
              %{score}
            </span>
          </div>

          {/* الأزرار */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
              marginTop: 4,
            }}
          >
            <button
              onClick={retakeQuiz}
              style={{
                padding: "10px 18px",
                borderRadius: 14,
                border: `1px solid ${PRIMARY_COLOR}`,
                background: "#fff7ed",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: `${Math.max(14, a11y.baseSize - 1)}px`,
                minWidth: 130,
              }}
           title="سيتم مسح تقدمك الحالي، ويمكنك اختيار المستوى مرة أخرى"
           >
         إعادة المحاولة
            </button>
            <button
              onClick={exitQuiz}
              style={{
                padding: "10px 18px",
                borderRadius: 14,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: `${Math.max(14, a11y.baseSize - 1)}px`,
                minWidth: 110,
              }}
            >
              إنهاء
            </button>
          </div>
        </div>
      </div>
    );
  }


//exit


  // Current question
  const question = quiz[currentIndex];
  const isMCQ = question?.type === "MCQ";
  const isTF = question?.type === "TF";
  const isLastQuestion = currentIndex === quiz.length - 1;
  const options = isMCQ ? getOptions(question) : [];

  // نص السؤال
  const questionText = question?.question || question?.statement || "";

  // أسماء ترتيبية عربية
  const ordinals = [
    "الأول",
    "الثاني",
    "الثالث",
    "الرابع",
    "الخامس",
    "السادس",
    "السابع",
    "الثامن",
    "التاسع",
    "العاشر",
  ];

  // نص الخيارات للقراءة الصوتية:
  // "الخيارات هي: الخيار الأول: ... . الخيار الثاني: ... . ..."
  const optionsForTTS = (isMCQ ? options : ["صح", "خطأ"])
    .map((opt, idx) => {
      const label = ordinals[idx] || `${idx + 1}`;
      return `الخيار ${label}: ${opt}`;
    })
    .join(" . ");

  // النص النهائي اللي يروح لـ TTS: سؤال + "الخيارات هي" + الخيارات
  const ttsText = optionsForTTS
    ? `${questionText}. الخيارات هي: ${optionsForTTS}`
    : questionText;

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
      {showExitConfirm && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
    }}
  >
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "16px",
        width: "min(300px,90%)",
        textAlign: "center",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }}
    >
      <p style={{ marginBottom: 20, fontWeight: 600 }}>
        هل تريد الخروج من الاختبار؟
      </p>

      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button
          onClick={exitQuiz}
          style={{
            padding: "10px 18px",
            borderRadius: 12,
            background: "#ff8c42",
            border: "none",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
            minWidth: 90,
          }}
        >
          نعم
        </button>

        <button
          onClick={() => setShowExitConfirm(false)}
          style={{
            padding: "10px 18px",
            borderRadius: 12,
            background: "#e5e7eb",
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            minWidth: 90,
          }}
        >
          لا
        </button>
      </div>
    </div>
  </div>
)}


      <div
        style={{
          width: "min(800px, 96%)",
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
          border: "1px solid #eef2f7",
          position: "relative"
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
            {questionText}
          </p>

          {/* الآن الصوت يقرأ: السؤال ثم "الخيارات هي: ..." ثم الخيار الأول/الثاني/الثالث */}
          <TTSControls key={currentIndex} text={ttsText} />
        </div>

       {/* Options */}
<div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
  {(isMCQ ? options : ["صح", "خطأ"]).map((opt, idx) => {
    const isTF = !isMCQ;
    // Convert string to boolean for TF comparison
    const optValue = isTF ? (opt === "صح") : opt;

    // Determine border color
    let borderColor = selected === optValue ? "#f59e0b" : "#d1d5db";
    if (showAnswer) {
      const correctAnswer = quiz[currentIndex]?.answer;
      if (optValue === correctAnswer) borderColor = "green";
      else if (selected === optValue && selected !== correctAnswer) borderColor = "red";
    }

    return (
      <button
        key={idx}
        onClick={() => !showAnswer && setSelected(optValue)}
        style={{
          padding: "10px 16px",
          borderRadius: 12,
          border: `2px solid ${borderColor}`,
          background: selected === optValue ? "#fff7ed" : "#fff",
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
            {/* New Exit mid test Button */}
  <button
    onClick={() => setShowExitConfirm(true)}
    style={{
      position: "absolute", // ✅ absolute inside relative parent
      top: 2,
      left: 1,
 padding: "8px 16px",
              borderRadius: 12,
              border: "1px solid #f59e0b",
              background: "#fff7ed",
              fontWeight: 600,
              cursor: "pointer",
              transition: "0.2s",
               gap: 6,
      zIndex: 10,
    }}
    title="إنهاء الاختبار" // ← tooltip text
  >
     <FiX size={18} />
  </button>
        </div>
      </div>
    </div>
  );
}
