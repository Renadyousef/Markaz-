// src/components/studySession/StudySessionSetup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Session.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SESSIONS_API = `${API_BASE}/sessions`;
const PRESETS = [
  { minutes: 5, valueLabel: "5", unitLabel: "دقائق" },
  { minutes: 10, valueLabel: "10", unitLabel: "دقائق" },
  { minutes: 15, valueLabel: "15", unitLabel: "دقائق" },
  { minutes: 30, valueLabel: "30", unitLabel: "دقيقة" },
  { minutes: 60, valueLabel: "1", unitLabel: "ساعة" },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const toSeconds = (duration) =>
  duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
const toMinutes = (duration) =>
  Number((toSeconds(duration) / 60).toFixed(2));
const buildDurationFromMinutes = (mins) => ({
  hours: Math.floor(mins / 60),
  minutes: mins % 60,
  seconds: 0,
});

export default function StudySessionSetup() {
  const [title, setTitle] = useState("");
  const [selectedTimer, setSelectedTimer] = useState("study");
  const [studyDuration, setStudyDuration] = useState({
    hours: 0,
    minutes: 25,
    seconds: 0,
  });
  const [breakDuration, setBreakDuration] = useState({
    hours: 0,
    minutes: 5,
    seconds: 0,
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate(); // ✅

  const updateDuration = (timer, unit, delta) => {
    const setter = timer === "study" ? setStudyDuration : setBreakDuration;
    setSelectedTimer(timer);
    setter((prev) => {
      const limit = unit === "hours" ? 23 : 59;
      return {
        ...prev,
        [unit]: clamp(prev[unit] + delta, 0, limit),
      };
    });
  };

  const applyPreset = (minutes) => {
    const duration = buildDurationFromMinutes(minutes);
    if (selectedTimer === "study") {
      setStudyDuration(duration);
    } else {
      setBreakDuration(duration);
    }
  };

  const handleManualInput = (timer, unit, value) => {
    const setter = timer === "study" ? setStudyDuration : setBreakDuration;
    const clean = value.replace(/\D/g, "");
    const limit = unit === "hours" ? 23 : 59;
    setSelectedTimer(timer);
    setter((prev) => ({
      ...prev,
      [unit]: clean === "" ? 0 : clamp(parseInt(clean, 10), 0, limit),
    }));
  };

  const start = async () => {
    if (saving) return;
    if (toSeconds(studyDuration) <= 0) {
      return alert("وقت الدراسة يجب أن يكون أكبر من صفر.");
    }

    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");
    if (!token) {
      return alert("يجب تسجيل الدخول لبدء جلسة دراسية.");
    }

    const session = {
      sessionTitle: title.trim() || "جلسة دراسة",
      studyTime: toMinutes(studyDuration),
      breakTime: toMinutes(breakDuration),
      status: "in-progress",
    };

    try {
      setSaving(true);
      const res = await fetch(SESSIONS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.replace(/^Bearer\s+/i, "")}`,
        },
        body: JSON.stringify({
          sessionTitle: session.sessionTitle,
          totalStudyTime: session.studyTime,
          totalBreakTime: session.breakTime,
          status: session.status,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.msg || payload?.error || "تعذر إنشاء الجلسة");
      }
      localStorage.setItem(
        "currentSession",
        JSON.stringify({
          ...session,
          sessionId: payload.id || payload.sessionId || null,
        })
      );
      navigate("/session-timer"); // ✅ go to timer route
    } catch (err) {
      console.error("FAILED TO START SESSION =>", err);
      alert(err.message || "حدث خطأ أثناء بدء الجلسة.");
    } finally {
      setSaving(false);
    }
  };

  const renderTimerBlock = (type, label, duration) => {
    const isSelected = selectedTimer === type;
    const formatted = {
      hours: String(duration.hours).padStart(2, "0"),
      minutes: String(duration.minutes).padStart(2, "0"),
      seconds: String(duration.seconds).padStart(2, "0"),
    };

    const unitLabels = ["ساعات", "دقائق", "ثوانٍ"];
    const units = ["hours", "minutes", "seconds"];

    return (
      <div
        className={`timer-block${isSelected ? " selected" : ""}`}
        onClick={() => setSelectedTimer(type)}
        key={type}
      >
        <p className="timer-label">{label}</p>
        <div className="timer-grid">
          {units.map((unit, idx) => (
            <div className="timer-unit" key={unit}>
              <button
                type="button"
                className="timer-arrow"
                onClick={(e) => {
                  e.stopPropagation();
                  updateDuration(type, unit, 1);
                }}
              >
                ▲
              </button>
              <input
                type="text"
                inputMode="numeric"
                className="timer-input"
                value={formatted[unit]}
                onFocus={(e) => {
                  e.stopPropagation();
                  setSelectedTimer(type);
                  e.target.select();
                }}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleManualInput(type, unit, e.target.value)}
              />
              <span className="timer-unit-label">{unitLabels[idx]}</span>
              <button
                type="button"
                className="timer-arrow"
                onClick={(e) => {
                  e.stopPropagation();
                  updateDuration(type, unit, -1);
                }}
              >
                ▼
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="session-setup-screen" dir="rtl" lang="ar">
      <section className="session-hero">
        <div className="session-title-block">
          <h1 className="session-title">إعداد جلسة الدراسة</h1>
          <p className="session-subtitle">
            صمّم جلستك بالطريقة التي تناسبك لتحافظ على طاقتك وتركيزك لتصل لأفضل أداء.
          </p>
        </div>
      </section>
      <section className="session-panel">
        <input
          className="session-name-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: جلسة مراجعة"
        />

        <div className="timers-stack">
          {renderTimerBlock("study", "وقت الدراسة", studyDuration)}
          {renderTimerBlock("break", "وقت الاستراحة", breakDuration)}
        </div>

        <div className="preset-section">
          <p className="preset-title">أوقات شائعة</p>
          <div className="preset-row">
            <button className="start-button" onClick={start} disabled={saving}>
              {saving ? "..." : "ابدأ"}
            </button>

            <div className="preset-grid">
              {PRESETS.map((preset) => (
                <button
                  key={`${preset.minutes}-${preset.unitLabel}`}
                  type="button"
                  className="preset-btn"
                  onClick={() => applyPreset(preset.minutes)}
                >
                  <span>{preset.valueLabel}</span>
                  <small>{preset.unitLabel}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
