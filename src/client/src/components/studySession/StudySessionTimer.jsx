// src/components/studySession/StudySessionTimer.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Session.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SESSIONS_API = `${API_BASE}/sessions`;

export default function StudySessionTimer() {
  const saved = JSON.parse(localStorage.getItem("currentSession") || "{}");
  const {
    sessionTitle = "جلسة جديدة",
    studyTime = 25,
    breakTime = 5,
    sessionId = null,
  } = saved;

  const navigate = useNavigate();

  const studySeconds = Math.max(1, Math.round(Number(studyTime) * 60));
  const breakSeconds = Math.max(0, Math.round(Number(breakTime) * 60));

  const [mode, setMode] = useState("study");
  const [timeLeft, setTimeLeft] = useState(studySeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [modalType, setModalType] = useState(null); // 'finished' | 'quit'
  const [showBreakBanner, setShowBreakBanner] = useState(false);
  const closedRef = useRef(false);
  const fullscreenRef = useRef(false);

  const totalSeconds = mode === "study"
    ? studySeconds
    : Math.max(breakSeconds, 1);
  const progress = Math.min(
    1,
    Math.max(0, 1 - timeLeft / totalSeconds)
  );
  const isBreakMode = mode === "break";

  const updateSessionStatus = useCallback(
    async (status = "completed") => {
      if (!sessionId) return;
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");
      if (!token) return;

      try {
        await fetch(`${SESSIONS_API}/${sessionId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.replace(/^Bearer\s+/i, "")}`,
          },
          body: JSON.stringify({ status }),
        });
      } catch (err) {
        console.error("FAILED TO UPDATE SESSION STATUS =>", err);
      }
    },
    [sessionId]
  );

  const handleSessionEnd = useCallback(async () => {
    if (closedRef.current) return;
    closedRef.current = true;
    localStorage.removeItem("currentSession");
    navigate("/sessions");
  }, [navigate]);

  useEffect(() => {
    document.body.classList.add("focus-mode");
    return () => {
      document.body.classList.remove("focus-mode");
    };
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    const request =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen;

    function tryFullscreen() {
      if (!request || document.fullscreenElement) return;
      try {
        const maybePromise = request.call(el);
        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise
            .then(() => {
              fullscreenRef.current = true;
              document.removeEventListener("pointerdown", handleUserGesture);
            })
            .catch(() => {});
        } else {
          fullscreenRef.current = true;
          document.removeEventListener("pointerdown", handleUserGesture);
        }
      } catch {
        fullscreenRef.current = false;
      }
    }

    function handleUserGesture() {
      tryFullscreen();
    }

    tryFullscreen();
    document.addEventListener("pointerdown", handleUserGesture, { once: true });

    return () => {
      document.removeEventListener("pointerdown", handleUserGesture);
      const exit =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;
      if (fullscreenRef.current && exit) {
        try {
          exit.call(document);
        } catch (err) {
          console.error(err);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft <= 0) return;
    const id = setTimeout(() => {
      setTimeLeft((t) => Math.max(t - 1, 0));
    }, 1000);
    return () => clearTimeout(id);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft !== 0) return;

    if (mode === "study") {
      // Mark session as completed once study time is finished
      updateSessionStatus("completed");
    }

    if (mode === "study" && breakSeconds > 0) {
      setMode("break");
      setTimeLeft(Math.max(breakSeconds, 1));
      setIsRunning(true);
      setShowBreakBanner(true);
    } else if (!modalType) {
      setIsRunning(false);
      setModalType("finished");
    }
  }, [timeLeft, mode, breakSeconds, modalType, updateSessionStatus]);

  useEffect(() => {
    if (!showBreakBanner) return;
    const id = setTimeout(() => setShowBreakBanner(false), 2500);
    return () => clearTimeout(id);
  }, [showBreakBanner]);

  const formatTime = (s) => {
    const hours = String(Math.floor(s / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const seconds = String(s % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleBottomPress = () => {
    setIsRunning((running) => !running);
  };

  const requestQuit = () => {
    setIsRunning(false);
    setModalType("quit");
  };

  const handleAnotherRound = () => {
    setModalType(null);
    setMode("study");
    setTimeLeft(studySeconds);
    setIsRunning(true);
  };

  const closeModal = () => {
    if (modalType === "quit" && timeLeft > 0) {
      setIsRunning(true);
    }
    setModalType(null);
  };

  const renderModal = () => {
    if (!modalType) return null;
    if (modalType === "finished") {
      return (
        <div className="timer-modal">
          <div className="timer-modal__content">
            <h3>انتهت الجلسة</h3>
            <p>هل تريد بدء جولة جديدة أم إنهاء الجلسة؟</p>
            <div className="timer-modal__actions">
              <button className="ghost" onClick={handleSessionEnd}>
                إنهاء
              </button>
              <button className="solid" onClick={handleAnotherRound}>
                جولة أخرى
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="timer-modal">
        <div className="timer-modal__content">
          <h3>إنهاء الجلسة؟</h3>
          <p>هل أنت متأكد من إنهاء هذه الجلسة؟</p>
          <div className="timer-modal__actions">
            <button className="ghost" onClick={closeModal}>
              لا، ابق
            </button>
            <button className="solid" onClick={handleSessionEnd}>
              نعم، أنهِ
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`session-timer-page ${isBreakMode ? "break" : "study"}`}
      dir="rtl"
      lang="ar"
    >
      <div className="timer-surface">
        <p className="timer-page-title">{sessionTitle}</p>

        <div className="timer-circle-wrap">
          <svg className="timer-circle" viewBox="0 0 200 200">
            <circle className="timer-circle__bg" cx="100" cy="100" r="90" />
            <circle
              className="timer-circle__progress"
              cx="100"
              cy="100"
              r="90"
              strokeDasharray={2 * Math.PI * 90}
              strokeDashoffset={
                (2 * Math.PI * 90) * (1 - progress)
              }
            />
          </svg>
          <div className="timer-circle__time">{formatTime(timeLeft)}</div>
        </div>

        <p className="timer-mode-label">
          {isBreakMode ? "وقت الاستراحة" : "وقت الدراسة"}
        </p>
        <div className="timer-icon-wrap">
          {isBreakMode ? (
            <svg viewBox="0 0 48 48">
              <rect
                x="12"
                y="18"
                width="18"
                height="14"
                rx="3"
                ry="3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              />
              <path
                d="M30 20h4a4 4 0 0 1 0 8h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M18 14c0 2 1 3 1 4m4-4c0 2 1 3 1 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 48 48">
              <path
                d="M10 12h14a4 4 0 0 1 4 4v22H14a4 4 0 0 0-4 4V12Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <path
                d="M24 12h8a4 4 0 0 1 4 4v22h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <path
                d="M16 18h8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        <div className="timer-controls">
          <div className="control-stack">
            <button
              className={`control-btn main ${isBreakMode ? "break" : "study"} ${
                !isRunning ? "paused" : ""
              }`}
              onClick={handleBottomPress}
            >
              {isRunning ? (
                <svg viewBox="0 0 24 24">
                  <rect x="7" y="5" width="3" height="14" rx="1.5" />
                  <rect x="14" y="5" width="3" height="14" rx="1.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <polygon points="8,5 19,12 8,19" />
                </svg>
              )}
            </button>
            <p className="control-label">
              {isRunning ? "إيقاف" : "استئناف"}
            </p>
          </div>

          <div className="control-stack">
            <button className="control-btn finish" onClick={requestQuit}>
              <svg viewBox="0 0 24 24">
                <rect x="7" y="7" width="10" height="10" rx="2" />
              </svg>
            </button>
            <p className="control-label">إنهاء</p>
          </div>
        </div>
      </div>
      {isBreakMode && showBreakBanner && (
        <div className="break-start-overlay">
          <div className="break-start-card">
            <h3>انتهى وقت الدراسة</h3>
            <p>حان الآن وقت الاستراحة، خذ لحظات للاسترخاء.</p>
          </div>
        </div>
      )}
      {renderModal()}
    </div>
  );
}
