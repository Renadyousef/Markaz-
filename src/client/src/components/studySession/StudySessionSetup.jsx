// src/components/studySession/StudySessionSetup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Session.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SESSIONS_API = `${API_BASE}/sessions`;

export default function StudySessionSetup() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [studyM, setStudyM] = useState(25);
  const [breakM, setBreakM] = useState(5);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate(); // ✅

  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => s - 1);

  const start = async () => {
    if (saving) return;
    if (studyM <= 0) return alert("وقت الدراسة يجب أن يكون أكبر من صفر.");

    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");
    if (!token) {
      return alert("يجب تسجيل الدخول لبدء جلسة دراسية.");
    }

    const session = {
      sessionTitle: title.trim() || "جلسة جديدة",
      studyTime: Number(studyM),
      breakTime: Number(breakM),
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

  const studyFill = ((studyM - 5) / (120 - 5)) * 100;
  const breakFill = (breakM / 30) * 100;

  return (
    <div className="setup-screen">
      <section className="wizard-card wide">
        <div className="wizard-progress">
          <div className="bar" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {step === 1 && (
          <>
            <h2 className="wizard-title">اسم الجلسة</h2>
            <input
              className="line-input big"
              placeholder="مثال: مراجعة SWE"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="wizard-nav center">
              <button className="btn btn--primary" onClick={next}>
                التالي
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="wizard-title">مدة الدراسة</h2>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={studyM}
              onChange={(e) => setStudyM(Number(e.target.value))}
              className="range green"
              style={{
                background: `linear-gradient(to right, #ff914d 0% ${studyFill}%, #e5e7eb ${studyFill}% 100%)`,
              }}
            />
            <div className="slider-value">{studyM} دقيقة</div>
            <div className="quick-preset">
              {[25, 45, 60].map((v) => (
                <button key={v} onClick={() => setStudyM(v)}>
                  {v}
                </button>
              ))}
            </div>
            <div className="wizard-nav">
              <button className="btn ghost" onClick={prev}>
                رجوع
              </button>
              <button className="btn btn--primary" onClick={next}>
                التالي
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="wizard-title">مدة الاستراحة</h2>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={breakM}
              onChange={(e) => setBreakM(Number(e.target.value))}
              className="range green"
              style={{
                background: `linear-gradient(to right, #ff914d 0% ${breakFill}%, #e5e7eb ${breakFill}% 100%)`,
              }}
            />
            <div className="slider-value">{breakM} دقيقة</div>
            <div className="quick-preset">
              {[0, 5, 10].map((v) => (
                <button key={v} onClick={() => setBreakM(v)}>
                  {v}
                </button>
              ))}
            </div>
            <div className="wizard-nav">
              <button className="btn ghost" onClick={prev}>
                رجوع
              </button>
              <button className="btn btn--primary" onClick={start} disabled={saving}>
                {saving ? "يتم التحميل..." : "ابدأ الجلسة"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
