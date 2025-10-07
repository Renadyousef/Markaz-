// TTSControls.jsx
import React, { useState, useRef, useEffect } from "react";

export default function TTSControls({ text, defaultVoice = "Zayd" }) {
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const TTS_URL = API_BASE ? `${API_BASE}/tts` : "/tts";

  const VOICES = [
    { id: "Hala", label: "الصوت الأول" },
    { id: "Zayd", label: "الصوت الثاني" },
  ];

  const [voiceId, setVoiceId] = useState(defaultVoice);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cache, setCache] = useState({});
  const audioRef = useRef(new Audio());

  useEffect(() => {
    const el = audioRef.current;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setIsPaused(false); };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      try { el.pause(); } catch {}
      if (el.src?.startsWith("blob:")) URL.revokeObjectURL(el.src);
      el.removeAttribute("src");
    };
  }, []);

  async function fetchAudio() {
    if (cache[text + voiceId]) return cache[text + voiceId];
    setLoading(true);
    try {
      const res = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId, format: "mp3", text }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const ab = await res.arrayBuffer();
      const blob = new Blob([ab], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      setCache((prev) => ({ ...prev, [text + voiceId]: url }));
      return url;
    } catch (e) {
      setError("تعذر توليد الصوت");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handlePlayPause() {
    const el = audioRef.current;
    if (isPlaying) {
      el.pause();
      setIsPaused(true);
      return;
    }
    const url = await fetchAudio();
    if (!url) return;
    el.src = url;
    try {
      await el.play();
      setIsPlaying(true);
      setIsPaused(false);
    } catch {
      setError("خطأ في تشغيل الصوت");
    }
  }

  return (
    <div className="tts-controls" style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <select
        className="nice-select"
        value={voiceId}
        onChange={(e) => setVoiceId(e.target.value)}
      >
        {VOICES.map((v) => (
          <option key={v.id} value={v.id}>{v.label}</option>
        ))}
      </select>
      <button
        style={{
          padding: "8px 16px",
          background: "#f59e0b",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: 800,
        }}
        onClick={handlePlayPause}
        disabled={loading}
      >
        {loading ? "جاري التحميل..." : isPlaying ? "إيقاف" : "تشغيل"}
      </button>
      {error && <span style={{ color: "red", fontWeight: 600 }}>{error}</span>}
      <audio ref={audioRef} />
    </div>
  );
}
