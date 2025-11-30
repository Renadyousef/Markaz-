// FontSettings.jsx
import React, { useState } from "react";

const A11Y_KEY = "quiz_a11y_settings";
const DEFAULT_A11Y = { baseSize: 18, lineHeight: 1.6 };

const PRIMARY_COLOR = "#ff8c42";
const PRIMARY_LIGHT = "#ffdbbf";

export default function FontSettings({ onSave }) {
  const [draft, setDraft] = useState(() => {
    try {
      return {
        ...DEFAULT_A11Y,
        ...JSON.parse(localStorage.getItem(A11Y_KEY) || "{}"),
      };
    } catch {
      return DEFAULT_A11Y;
    }
  });

  function saveSettings() {
    localStorage.setItem(A11Y_KEY, JSON.stringify(draft));
    if (onSave) onSave(draft);
  }

  const sliders = [
    {
      label: "حجم الخط (px)",
      key: "baseSize",
      min: 14,
      max: 26,
      step: 1,
    },
    {
      label: "تباعد السطور",
      key: "lineHeight",
      min: 1.2,
      max: 2.2,
      step: 0.1,
    },
  ];

  const previewText =
    "معاينة: ما العوامل التي تُحسّن القراءة؟ راعي حجم الخط وتباعد السطور.";

  return (
    <>
      <style>{`
        .fontSettingsRoot,
        .fontSettingsRoot * {
          font-family: "Cairo", "Helvetica Neue", sans-serif;
        }

        .fontSettingsRoot {
          display: flex;
          justify-content: center;
          padding: 40px 16px;
        }

        .fsCard {
          width: 100%;
          max-width: 520px;
          background: #ffffff;
          border-radius: 22px;
          padding: 28px 26px 32px;
          box-shadow: 0 20px 45px rgba(17, 24, 39, 0.16);
          border: 1px solid rgba(148, 163, 184, 0.18);
          animation: fs-pop .35s ease-out;
        }

        .fsTitle {
          font-weight: 900;
          font-size: 20px;
          color: #111827;
          text-align: right;
          margin: 0 0 6px;
        }

        .fsSub {
          margin: 0 0 22px;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          text-align: right;
        }

        .fsGroup {
          margin-bottom: 22px;
        }

        .fsLabel {
          display: block;
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 10px;
          color: #374151;
          text-align: right;
        }

        .fsRow {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .fsRange {
          flex: 1;
          height: 6px;
          border-radius: 999px;
          accent-color: ${PRIMARY_COLOR};
          cursor: pointer;
        }

.fsNum {
  width: 66px;
  padding: 6px 8px;
  border-radius: 10px;
  border: none !important;      /* بدون بوردر نهائياً */
  outline: none !important;     /* بدون إطار عند الضغط */
  background: #f7f7f7;           /* لون خفيف نظيف */
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  color: #111827;
}


        .fsPreview {
          margin-top: 10px;
          padding: 16px;
          border-radius: 14px;
          border: 1px dashed #e5e7eb;
          background: #f9fafb;
          color: #111827;
          font-weight: 600;
          text-align: right;
          transition: 0.25s ease;
        }

        .fsBtn {
          margin-top: 26px;
          width: 100%;
          padding: 13px 0;
          background: ${PRIMARY_COLOR};
          color: #fff;
          border: none;
          border-radius: 14px;
          font-weight: 800;
          font-size: 16px;
          cursor: pointer;
          transition: .2s ease;
        }

        .fsBtn:hover {
          background: #e57e3f;
          box-shadow: 0 12px 26px rgba(255, 140, 66, 0.28);
          transform: translateY(-1px);
        }

        @keyframes fs-pop {
          from {
            opacity: 0;
            transform: translateY(12px) scale(.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 480px) {
          .fsCard {
            padding: 22px 18px 26px;
          }
        }
      `}</style>

      <div className="fontSettingsRoot" dir="rtl">
        <div className="fsCard">
          <h2 className="fsTitle">خصّص إعدادات القراءة</h2>
          <p className="fsSub">
            يمكنك التحكم في حجم الخط وتباعد السطور للحصول على قراءة أكثر راحة.
          </p>

          {sliders.map(({ label, key, min, max, step }) => (
            <div key={key} className="fsGroup">
              <label className="fsLabel">{label}</label>
              <div className="fsRow">
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={draft[key]}
                  className="fsRange"
                  onChange={(e) =>
                    setDraft((s) => ({
                      ...s,
                      [key]: Number(e.target.value),
                    }))
                  }
                />
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={draft[key]}
                  className="fsNum"
                  onChange={(e) =>
                    setDraft((s) => ({
                      ...s,
                      [key]: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
          ))}

          <div
            className="fsPreview"
            style={{
              fontSize: draft.baseSize,
              lineHeight: draft.lineHeight,
            }}
          >
            {previewText}
          </div>

          <button className="fsBtn" onClick={saveSettings}>
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </>
  );
}
