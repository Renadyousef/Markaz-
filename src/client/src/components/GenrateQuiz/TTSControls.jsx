import React, { useState, useRef, useEffect } from "react";

export default function TTSControls({ text }) {
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const TTS_URL = API_BASE ? `${API_BASE}/tts` : "/tts";

  // صوت واحد فقط: Hala (البنت)
  const voiceId = "Hala";

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cache, setCache] = useState({});
  const audioRef = useRef(new Audio());


  const cleanText = (text || "")
    .replace(/_{3,}/g, " فراغ ")  // أي 3 أو أكثر من "_"
    .replace(/_/g, " فراغ ")      // أي "_" منفرد أو اثنين
    .replace(/\s{2,}/g, " ")      // إزالة المسافات المكررة
    .trim();


  useEffect(() => {
    const el = audioRef.current;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);

      try {
        el.pause();
      } catch {}

      if (el.src?.startsWith("blob:")) URL.revokeObjectURL(el.src);
      el.removeAttribute("src");
    };
  }, []);

  /* =====================================================
     🔊 جلب الصوت + الكاش
     ===================================================== */
  async function fetchAudio() {
    if (!cleanText) return null;

    const cacheKey = cleanText + voiceId;
    if (cache[cacheKey]) return cache[cacheKey];

    setLoading(true);
    try {
      const res = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId,
          format: "mp3",
          text: cleanText,
        }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const ab = await res.arrayBuffer();
      const blob = new Blob([ab], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      setCache((prev) => ({ ...prev, [cacheKey]: url }));
      return url;
    } catch (e) {
      setError("تعذر توليد الصوت");
      return null;
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     ▶️ تشغيل / إيقاف الصوت
     ===================================================== */
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

  /* =====================================================
     🎛️ الواجهة
     ===================================================== */
  return (
    <div
      className="tts-controls"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {/* ▶️ زر التشغيل / الإيقاف – صوت البنت فقط */}
      <button
       title="قراءة السؤال صوتيًا"
        style={{
          padding: "8px 16px",
          background: "#f59e0b",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: 800,
          boxShadow: "0 2px 6px rgba(245, 158, 11, 0.3)",
          transition: "background 0.2s ease",
          fontFamily: '"Cairo","Helvetica Neue",sans-serif',
        }}
        onMouseOver={(e) => (e.target.style.background = "#d97706")}
        onMouseOut={(e) => (e.target.style.background = "#f59e0b")}
        onClick={handlePlayPause}
        disabled={loading || !cleanText}
      >
        {loading ? "جاري التحميل..." : isPlaying ? "إيقاف" : "تشغيل الصوت"}
      </button>

      {error && (
        <span style={{ color: "red", fontWeight: 600, fontFamily: '"Cairo","Helvetica Neue",sans-serif' }}>
          {error}
        </span>
      )}

      <audio ref={audioRef} />
    </div>
  );
}
