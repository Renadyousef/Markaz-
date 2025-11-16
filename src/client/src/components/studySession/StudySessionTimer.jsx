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

  const [mode, setMode] = useState("study");
  const [timeLeft, setTimeLeft] = useState(studyTime * 60);
  const [isRunning, setIsRunning] = useState(true);
  const timerRef = useRef(null);
  const wakeLockRef = useRef(null);
  const closedRef = useRef(false);
  const navigate = useNavigate(); // ✅

  const totalTime = mode === "study" ? studyTime * 60 : breakTime * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const updateSessionStatus = useCallback(async (status = "completed") => {
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
  }, [sessionId]);

  const handleSessionEnd = useCallback(async () => {
    if (closedRef.current) return;
    closedRef.current = true;
    await updateSessionStatus("completed");
    localStorage.removeItem("currentSession");
    navigate("/sessions"); // ✅ back to sessions list
  }, [navigate, updateSessionStatus]);

  useEffect(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    if ("wakeLock" in navigator) {
      navigator.wakeLock.request("screen")
        .then(lock => { wakeLockRef.current = lock; })
        .catch(() => {});
    }
    document.body.classList.add("focus-mode");

    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (wakeLockRef.current) wakeLockRef.current.release();
      document.body.classList.remove("focus-mode");
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      if (mode === "study" && breakTime > 0) {
        setMode("break");
        setTimeLeft(breakTime * 60);
      } else {
        handleSessionEnd();
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [isRunning, timeLeft, mode, breakTime, handleSessionEnd]);

  const formatTime = s => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className="timer-screen">
      <div className="timer-header">
        <h2 className="timer-title">{sessionTitle}</h2>
        <p className="timer-mode">{mode === "study" ? "دراسة" : "استراحة"}</p>
      </div>

      <div className="timer-ring">
        <svg viewBox="0 0 300 300">
          <circle className="ring-bg" cx="150" cy="150" r="140" />
          <circle
            className="ring-fg"
            cx="150"
            cy="150"
            r="140"
            strokeDasharray={2 * Math.PI * 140}
            strokeDashoffset={(2 * Math.PI * 140) * (1 - progress / 100)}
          />
        </svg>
        <div className="ring-time">{formatTime(timeLeft)}</div>
      </div>

      <div className="timer-actions">
        <button
          className="btn danger"
          onClick={handleSessionEnd}
        >
          إنهاء
        </button>
        <button className="btn ghost" onClick={() => setIsRunning(r => !r)}>
          {isRunning ? "إيقاف" : "استئناف"}
        </button>
      </div>
    </div>
  );
}
