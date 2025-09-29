import { useState } from "react";

export default function GetQuiz() {
  const [selected, setSelected] = useState(null);

  const question = {
    statement: "ما هو عاصمة المملكة العربية السعودية؟",
    options: ["الرياض", "جدة", "مكة", "الدمام"],
  };

  return (
    <div style={{ display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{
        width: "min(800px, 96%)",
        background: "#fff",
        borderRadius: 14,
        padding: 24,
        boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
        border: "1px solid #eef2f7",
      }}>
        <h2 style={{ fontWeight: 800, marginBottom: 20 }}>نموذج الاختبار</h2>

        {/* Question */}
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
          {question.statement}
        </p>

        {/* Options */}
        <div style={{ display: "grid", gap: 12 }}>
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(idx)}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: selected === idx ? "2px solid #f59e0b" : "1px solid #d1d5db",
                background: selected === idx ? "#fff7ed" : "#fff",
                cursor: "pointer",
                fontWeight: 600,
                transition: "0.2s",
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{
          height: 8,
          width: "100%",
          borderRadius: 999,
          background: "#f1f5f9",
          overflow: "hidden",
          marginTop: 24
        }}>
          <div style={{ width: "20%", height: "100%", background: "#f59e0b" }} />
        </div>
      </div>
    </div>
  );
}
