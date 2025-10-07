// FontSettings.jsx
import React, { useState } from "react";

const A11Y_KEY = "quiz_a11y_settings";
const DEFAULT_A11Y = { baseSize: 18, lineHeight: 1.6, letterSpacing: 0.0 };

export default function FontSettings({ onSave }) {
  const [draft, setDraft] = useState(() => {
    try {
      return { ...DEFAULT_A11Y, ...JSON.parse(localStorage.getItem(A11Y_KEY) || "{}") };
    } catch {
      return DEFAULT_A11Y;
    }
  });

  function saveSettings() {
    localStorage.setItem(A11Y_KEY, JSON.stringify(draft));
    if (onSave) onSave(draft);
  }

  const setClamped = (key, val, min, max, step = 1) => {
    const num = Number(val);
    const safe = isNaN(num)
      ? min
      : Math.max(min, Math.min(max, Math.round(num / step) * step));
    setDraft((s) => ({ ...s, [key]: safe }));
  };

  const previewText =
    "معاينة: ما العوامل التي تسهم في تحسين القراءة؟ راعي حجم الخط وتباعد السطور.";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
        maxWidth: 500,
        margin: "20px auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h2 style={{ fontWeight: 900, marginBottom: 16, fontSize: 20, color: "#111827" }}>
        اختياري: خصّص حجم الخط وتباعده لراحة أفضل عند القراءة
      </h2>

      {/* Input Group */}
      {[
        {
          label: "حجم الخط (px)",
          key: "baseSize",
          min: 14,
          max: 22,
          step: 1,
        },
        {
          label: "تباعد السطور",
          key: "lineHeight",
          min: 1.4,
          max: 2.0,
          step: 0.1,
        },
        {
          label: "تباعد الحروف",
          key: "letterSpacing",
          min: 0,
          max: 0.5,
          step: 0.05,
        },
      ].map(({ label, key, min, max, step }) => (
        <div key={key} style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: 6, color: "#374151" }}>
            {label}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={draft[key]}
              onChange={(e) =>
                setDraft((s) => ({ ...s, [key]: key === "letterSpacing" ? Number(e.target.value) : Number(e.target.value) }))
              }
              style={{
                flex: 1,
                accentColor: "#f59e0b",
                height: 6,
                borderRadius: 4,
                cursor: "pointer",
              }}
            />
            <input
              type={key === "letterSpacing" ? "number" : "number"}
              min={min}
              max={max}
              step={step}
              value={draft[key]}
              onChange={(e) => setClamped(key, e.target.value, min, max, step)}
              style={{
                width: 60,
                padding: "4px 6px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                textAlign: "center",
              }}
            />
          </div>
        </div>
      ))}

      {/* Preview Box */}
      <div
        style={{
          marginTop: 10,
          padding: 16,
          border: "1px dashed #d1d5db",
          borderRadius: 12,
          background: "#f9fafb",
          fontSize: draft.baseSize,
          lineHeight: draft.lineHeight,
          letterSpacing: `${draft.letterSpacing}px`,
          fontWeight: 600,
          color: "#111827",
        }}
      >
        {previewText}
      </div>

      {/* Save Button */}
      <button
        onClick={saveSettings}
        style={{
          marginTop: 20,
          width: "100%",
          padding: "12px 0",
          background: "#f59e0b",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          cursor: "pointer",
          fontWeight: 800,
          fontSize: 16,
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#d97706")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#f59e0b")}
      >
        حفظ الإعدادات
      </button>
    </div>
  );
}
