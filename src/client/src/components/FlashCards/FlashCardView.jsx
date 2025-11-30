// client/src/components/FlashCards/FlashCardView.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import axios from "axios";

/* ===== API ===== */
const API_ROOT  = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_FLASH = `${API_ROOT}/api/flashcards`;
const API_RETR  = `${API_ROOT}/retrive`;

/* ===== TTS Config ===== */
const API_BASE_ROOT = import.meta.env.VITE_API_BASE || ""; // اتركها "" لو نفس دومين الفرونت
const TTS_URL       = API_BASE_ROOT ? `${API_BASE_ROOT}/tts` : "/tts";

/* ===== هوك TTS (تشغيل/إيقاف + كاش محلّي) ===== */
function useTTS(initialVoice = "Hala") {
  const audioRef = useRef(null);
  const cacheRef = useRef(new Map());
  const [voice] = useState(initialVoice); // نثبت صوت Hala فقط
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      stop();
      for (const url of cacheRef.current.values()) URL.revokeObjectURL(url);
      cacheRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function keyFor(text, v) { return `${v}::${text}`; }

  async function ensureAudioUrl(text, v) {
    const key = keyFor(text, v);
    if (cacheRef.current.has(key)) return cacheRef.current.get(key);

    const res = await axios.post(
      TTS_URL,
      { text, voiceId: v },
      { responseType: "arraybuffer" }
    );
    const blob = new Blob([res.data], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    cacheRef.current.set(key, url);
    return url;
  }

  async function speak(text) {
    if (!text || !text.trim()) return;
    if (isPlaying) stop();

    const url = await ensureAudioUrl(text, voice);

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
      audioRef.current.addEventListener("pause", () => setIsPlaying(false));
    }
    audioRef.current.src = url;
    await audioRef.current.play();
    setIsPlaying(true);
  }

  function stop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }

  return { isPlaying, speak, stop };
}

/* ===== Styles ===== */
const local = `
.fcView{ display:grid; gap:14px; }
.fcTop{ display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.fcTop .title{ margin:0; font-weight:900; color:var(--text); font-size:20px; }
.fcTop .back{ border:1px solid var(--fx-card-ring); background:#fff; border-radius:10px; padding:8px 12px; font-weight:800; }

.viewer{
  position:relative; height:420px; overflow:hidden;
  border:1px solid var(--fx-card-ring); border-radius:16px; background:#fff; box-shadow:var(--shadow);
  display:grid; place-items:center;
}
.slide{
  position:absolute;
  inset:0;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  transition: transform .25s ease, opacity .25s ease;
  border-radius:16px;
  border:2px solid transparent;
  box-sizing:border-box;
  padding:0;
}

.center{ transform:translateX(0); opacity:1; }
.left{   transform:translateX(-100%); opacity:0; }
.right{  transform:translateX(100%);  opacity:0; }

.slide.known{ border-color:#86efac; box-shadow:0 0 0 4px rgba(134,239,172,.25) inset; }
.slide.unknown{ border-color:#fca5a5; box-shadow:0 0 0 4px rgba(252,165,165,.25) inset; }

.block {
  border: 2px solid #fff;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-weight: 700;
  font-size: 18px;
  line-height: 1.9;
  color: #334155;
  background-clip: padding-box;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
}

.block h4{
  margin:0 0 8px;
  font-size:18px;
  font-weight:900;
  color:#0f172a;
}

.block p{
  margin:0;
  color:#334155;
  font-size:17px;
}

.block.def{
  background:linear-gradient(145deg,#fff4e1,#ffe8bf);
  border-color:#ffffff;
}

.block.term{
  background:linear-gradient(145deg,#f3faff,#e6f3ff);
  border-color:#ffffff;
}

.navBtns{ display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.navBtn{
  border:1px solid var(--fx-card-ring); background:#fff; padding:10px 14px; border-radius:12px; font-weight:800; cursor:pointer; transition:.15s;
}
.navBtn:hover{ background:var(--fx-cta-hover); border-color:#cbd5e1; }

.dots{ display:flex; gap:6px; justify-content:center; align-items:center; }
.dot{ width:10px; height:10px; border-radius:999px; background:#e5e7eb; transition:.15s; }
.dot.isActive{ background:#f59e0b; }
.dot.known{ background:#22c55e; }
.dot.unknown{ background:#ef4444; }

.badges{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.badge{
  font-size:13px; font-weight:900; padding:4px 10px; border-radius:999px;
  border:1px solid #111827; background:#fff; color:#111827;
  text-shadow: 0 0 0.8px rgba(0,0,0,.55);
}

.helperBox{ border:1px dashed #e5e7eb; border-radius:12px; padding:12px; background:#fff; }
.helperBox .row{ display:flex; gap:10px; margin-top:10px; align-items:center; flex-wrap:wrap; }

.alert{ margin-top:10px; padding:10px 12px; border-radius:10px; font-weight:800; border:1px solid #e5e7eb; background:#fff; }
.alert.ok{ border-color:#c7f0d2; background:#f0fff4; }
.alert.err{ border-color:#fcd5d5; background:#fff5f5; color:#b00020; }

/* ===== Flip Card Styles ===== */
.flipWrap{
  width:100%; height:100%;
  display:grid; place-items:center;
  perspective: 1200px;
}
.flipCard {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform .5s ease;
  transform-style: preserve-3d;
  cursor: pointer;
  box-sizing: border-box;
}
.flipCard.isFlipped{ transform: rotateY(180deg); }

.face{
  position:absolute; inset:0;
  display:flex; flex-direction:column; gap:14px;
  backface-visibility: hidden;
  border-radius:14px;
}
.face.back{ transform: rotateY(180deg); }
.clickHint{
  position:absolute; bottom:10px; left:50%; transform:translateX(-50%);
  font-size:12px; opacity:.7; background:#fff; border:1px dashed #e5e7eb;
  padding:6px 10px; border-radius:999px; user-select:none;
}

/* ===== New Practice Layout (Version B) ===== */
.practice-shell {
  min-height: 100vh;
  background: transparent;
  padding: clamp(24px, 6vh, 60px) 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "Cairo", "Helvetica Neue", sans-serif;
}
.practice-panel {
  width: min(600px, 90%);
  background: #fff;
  border-radius: 32px;
  padding: 20px 32px 30px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.practice-header {
  display: flex;
  justify-content: center;
  align-items: center;
}
.practice-title {
  font-size: 28px;
  font-weight: 800;
  color: #111;
  margin: 0;
}
.practice-stage {
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  padding: 12px 0;
}
.card-stack {
 width: min(500px, 70vw);
  height: clamp(300px, 60vh, 420px);
  position: relative;
  margin: 0 auto;
  perspective: 1400px;
}
.stack-card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(320px, 80%, 520px);
  height: 100%;
  border-radius: 24px;
  background: #ff914d;
  box-shadow: 0 25px 40px rgba(255, 145, 77, 0.5);
  transform: translate(-50%, -50%);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.stack-card.stack-card--middle {
  transform: translate(-50%, calc(-50% + 12px));
  opacity: 0.5;
  pointer-events: none;
}
.stack-card.stack-card--back {
  transform: translate(-50%, calc(-50% + 24px));
  opacity: 0.25;
  pointer-events: none;
}
.stack-card.front {
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  opacity: 1;
}
.stack-card.front.card-enter {
  animation: stackCardEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.stack-card.front.complete {
  cursor: default;
  background: #fff;
  color: #111;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
  box-shadow: 0 25px 40px rgba(0,0,0,0.15);
}
.stack-card.front .flipWrap {
  width: 100%;
  height: 100%;
}
.stack-card.front .flipCard {
  width: 100%;
  height: 100%;
  border-radius: 24px;
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}
.stack-card.front .flipCard.isFlipped {
  transform: rotateY(180deg);
}
.stack-card.front .face {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  padding: 32px;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
  background: #ff914d;
}
.stack-card.front .face.back-face {
  transform: rotateY(180deg);
}
.stack-card.front .face h2 {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 800;
}
.stack-card.front .face p {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
}
.stack-card.front.slide-left {
  animation: stackCardExitLeft 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.stack-card.front.slide-right {
  animation: stackCardExitRight 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.sound-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: none;
  background: rgba(255,255,255,0.9);
  color: #ff914d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(0,0,0,0.15);
}

.practice-card h2 {
  font-size: 28px;
  text-align: center;
  margin: 0;
  font-weight: 800;
}
.practice-card p {
  margin: 12px 0 0;
  font-size: 16px;
  opacity: 0.85;
}

.practice-progress {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}
.progress-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}
.progress-dot.active {
  transform: scale(1.2);
  border-color: #111;
}
.progress-dot.good { background: #22c55e; }
.progress-dot.bad { background: #ef4444; }

.practice-actions {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  margin: 10px auto 0;
  width: min(360px, 90%);
  direction: ltr;
}

body.flashcards-bg {
  background:
    radial-gradient(1000px 420px at 10% -5%, #fff7ed 0%, transparent 60%),
    radial-gradient(1200px 520px at 90% -8%, #ffedd5 10%, transparent 58%),
    radial-gradient(900px 360px at 50% 100%, rgba(15,23,42,.06) 0%, transparent 60%),
    #f9fafb !important;
  background-repeat: no-repeat;
  background-attachment: fixed;
}
.cube-btn {
  width:  75px;
  height: 70px;
  border-radius: 18px;
  border: 3px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  cursor: pointer;
  background: #fff;
  transition: transform 0.2s ease;
}
.cube-btn:hover:not(:disabled) {
  transform: translateY(-4px);
}
.cube-btn.red { color: #ef4444; }
.cube-btn.green { color: #16a34a; }
.cube-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.practice-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: grid;
  place-items: center;
  z-index: 90;
}
.practice-modal__body {
  background: #fff;
  padding: 28px;
  border-radius: 28px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
}
.practice-modal__actions {
  margin-top: 22px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.practice-modal__actions button {
  border-radius: 999px;
  padding: 10px 20px;
  font-weight: 700;
  cursor: pointer;
}
.practice-modal__actions .ghost {
  border: 1px solid #d1d5db;
  background: transparent;
}
.practice-modal__actions .solid {
  border: none;
  background: #ff914d;
  color: #fff;
}

@keyframes stackCardEnter {
  0% {
    transform: translate(-50%, calc(-50% + 18px)) scale(0.92);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}
@keyframes stackCardExitLeft {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% - 140px), -50%) scale(0.92);
    opacity: 0;
  }
}
@keyframes stackCardExitRight {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + 140px), -50%) scale(0.92);
    opacity: 0;
  }
}
`;

/* ====================== Component ====================== */
export default function FlashCardView() {
  const navigate = useNavigate();

  // من صفحة الرفع (للتوليد)
  const { state } = useLocation();
  const pdfId = state?.pdfId || null;

  // من الراوتر (لعرض الدِك)
  const { deckId: deckIdParam } = useParams();
  const mode = deckIdParam ? "viewDeck" : (pdfId ? "generate" : "empty");

  const [cards, setCards] = useState([]);
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [deckId, setDeckId] = useState(deckIdParam || null);

  // التصنيف (يُستخدم في وضع التوليد فقط)
  const [deckName, setDeckName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saveOk, setSaveOk] = useState(null);
  const [known, setKnown] = useState(new Set());
  const [unknown, setUnknown] = useState(new Set());
  const [progress, setProgress] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [animDir, setAnimDir] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  // ====== TTS ======
  const { isPlaying, speak, stop } = useTTS("Hala");

  // ====== تحميل من PDF (وضع التوليد) ======
  async function loadFromPdf() {
    if (!pdfId) { setErr("لا يوجد pdfId"); return; }
    setLoading(true); setErr(""); setSaveMsg(""); setSaveOk(null); if(!deckIdParam) setDeckId(null);

    try {
      const res = await axios.post(`${API_FLASH}/from-pdf/${pdfId}?limit=10`);
      if (res.data?.ok) {
        const mapped = (res.data.cards || []).slice(0, 10).map((c, idx) => ({
          id: c.id ?? `c_${idx}`,
          q: c.question, a: c.answer, hint: c.hint ?? null,
          tags: Array.isArray(c.tags) ? c.tags : [],
        }));
        setCards(mapped);
        setI(0);
        setKnown(new Set());
        setUnknown(new Set());
        setProgress([]);
        setFlipped(false);
        setSummaryOpen(false);
        setNamePromptOpen(false);
        setNameDraft("");
        setAnimDir(null);

      } else {
        setErr(res.data?.error || "حدث خطأ غير معروف");
      }
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  // ====== تحميل دِك محفوظ (وضع العرض) ======
  async function loadDeckById(id){
    setLoading(true); setErr(""); setSaveMsg(""); setSaveOk(null);
    try{
      const token = localStorage.getItem("token");
      if (!token) {
        setErr("يجب تسجيل الدخول أولاً");
        return;
      }

      const { data } = await axios.get(`${API_RETR}/decks/${id}/full`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if(!data?.ok) throw new Error(data?.error || "فشل الجلب");
      const list = (data.cards || [])
        .sort((a,b)=>(a.order??0)-(b.order??0))
        .slice(0, 10)
        .map((c,idx)=>({
          id: c.id || `c_${idx}`,
          q: c.question, a: c.answer, hint: c.hint ?? null,
          tags: Array.isArray(c.tags)? c.tags:[],
        }));
      setCards(list);
      setI(0);
      setDeckId(id);
      setKnown(new Set());
      setUnknown(new Set());
      setProgress([]);
      setFlipped(false);
      setSummaryOpen(false);
      setNamePromptOpen(false);
      setNameDraft("");
      setAnimDir(null);
    }catch(e){
      setErr(e?.response?.data?.error || e.message);
    }finally{
      setLoading(false);
    }
  }

  // تشغيل اللوادر المناسب عند الدخول
  useEffect(()=>{
    if (mode === "viewDeck") loadDeckById(deckIdParam);
    if (mode === "generate")  loadFromPdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckIdParam, pdfId]);

  // تصنيف (للتوليد فقط) + قراءة البطاقة التالية
  function mark(direction) {
    const cur = cards[i];
    if (!cur) return;

    if (direction === "right") {
      const k = new Set(known); k.add(cur.id);
      const u = new Set(unknown); u.delete(cur.id);
      setKnown(k); setUnknown(u);
    } else if (direction === "left") {
      const u = new Set(unknown); u.add(cur.id);
      const k = new Set(known); k.delete(cur.id);
      setUnknown(u); setKnown(k);
    }

    setProgress(prev => {
      const next = [...prev];
      next[i] = direction;
      return next;
    });

    setI(prev => {
      const next = Math.min(cards.length - 1, prev + 1);
      if (isPlaying) stop();
      return next;
    });
  }

  // كيبورد: أسهم للتنقّل/التصنيف
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") mark("right");
      if (e.key === "ArrowLeft") mark("left");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, cards, known, unknown, isPlaying]);

  const answeredCount = progress.filter(Boolean).length;
  const doneAll = cards.length > 0 && answeredCount === cards.length;

  useEffect(() => {
  if (loading) return;
  if (err) return;
  if (!doneAll) return;

  if (mode === "generate") {
    setSummaryOpen(true);
    return;
  }

  if (mode === "viewDeck" && deckId) {
    const knownIds = Array.from(known);
    const unknownIds = Array.from(unknown);
    const token = localStorage.getItem("token");

    axios.post(
      `${API_FLASH}/deck/${deckId}/update-progress`,
      { knownIds, unknownIds },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(() => console.log("Progress updated"))
    .catch(err => console.error("Failed to update progress:", err));

    setSummaryOpen(true);
  }
}, [doneAll, loading, err, mode, deckId, known, unknown]);


  // حفظ (يعمل فقط في وضع التوليد)
  async function handleSave(nameOverride) {
    if (mode !== "generate") return;
    if (!doneAll || saving) return;
    setSaving(true);
    setSaveMsg(""); setSaveOk(null);
    try {
      const finalName = nameOverride && nameOverride.trim()
        ? nameOverride.trim()
        : (deckName && deckName.trim() ? deckName.trim() : "مجموعة بدون اسم");
      setDeckName(finalName);
      const payload = {
        pdfId,
        language: "ar",
        deckName: finalName,
        known: Array.from(known),
        unknown: Array.from(unknown),
        cards: cards.map(c => ({
          id: c.id, question: c.q, answer: c.a, hint: c.hint ?? null, tags: c.tags || []
        })),
      };
      const { data } = await axios.post(`${API_FLASH}/save-deck`, payload);
      if (data?.ok) {
        setDeckId(data.deckId);
        setSaveOk(true);
        setSaveMsg(`تم الحفظ بنجاح: "${data.name}"`);
        navigate("/cards");
      } else {
        setSaveOk(false);
        setSaveMsg(`فشل الحفظ: ${data?.error || "Unknown error"}`);
      }
    } catch (e) {
      setSaveOk(false);
      setSaveMsg(`فشل الحفظ: ${e?.response?.data?.error || e.message}`);
    } finally {
      setSaving(false);
    }
  }

  function handleIgnore() {
    if (isPlaying) stop();
    setSummaryOpen(false);
    setNamePromptOpen(false);
    navigate("/cards");
  }

  const sessionComplete = doneAll;

  useEffect(() => {
    document.body.classList.add("flashcards-bg");
    return () => document.body.classList.remove("flashcards-bg");
  }, []);

  const current = sessionComplete ? null : cards[i];
  const totalCorrect = progress.filter((v) => v === "right").length;
  const totalWrong = progress.filter((v) => v === "left").length;

  function handlePracticeAnswer(direction) {
    if (!current || sessionComplete) return;
    setAnimDir(direction);
    setTimeout(() => {
      mark(direction);
      setFlipped(false);
      setAnimDir(null);
    }, 260);
  }

  function toggleFrontCard() {
    if (!current || sessionComplete) return;
    setFlipped((prev) => !prev);
  }

  return (
    <div className="practice-shell">
      <style>{local}</style>
      <section className="practice-panel">
        <div className="practice-header">
          <h3 className="practice-title">جلسة البطاقات</h3>
        </div>

        {loading && <div className="helperBox">... جاري التحميل</div>}

        {!loading && err && (
          <div className="helperBox">
            <div className="alert err">خطأ: {err}</div>
            <div className="row">
              {mode === "viewDeck" ? (
                <button className="navBtn" onClick={()=>loadDeckById(deckId)} disabled={loading}>
                  إعادة المحاولة
                </button>
              ) : (
                <button className="navBtn" onClick={()=>loadFromPdf()} disabled={loading}>
                  إعادة التوليد
                </button>
              )}
              <Link to="/" className="navBtn">الرئيسية</Link>
            </div>
          </div>
        )}

        {!loading && !err && cards.length > 0 && (
          <>
            <div className="practice-stage">
              <div className="card-stack">
                <div className="stack-card stack-card--back" />
                <div className="stack-card stack-card--middle" />
                <div
                  key={sessionComplete ? "complete" : current?.id || "empty"}
                  className={`stack-card front ${sessionComplete ? "complete" : ""} ${
                    animDir ? `slide-${animDir}` : "card-enter"
                  }`}
                  onClick={!sessionComplete ? toggleFrontCard : undefined}
                  role={!sessionComplete ? "button" : undefined}
                  tabIndex={!sessionComplete ? 0 : -1}
                  onKeyDown={(e) => {
                    if (sessionComplete) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleFrontCard();
                    }
                  }}
                >
                  {sessionComplete ? null : (
                    <div className="flipWrap">
                      <div className={`flipCard ${flipped ? "isFlipped" : ""}`}>
                        <div className="face front-face">
                          <button
                            className="sound-btn"
                            title="Tap to hear the question"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!current) return;
                              const textToRead = `${current?.q || ""}`.trim();
                              if (!textToRead) return;
                              if (isPlaying) stop();
                              else speak(textToRead);
                            }}
                            disabled={!current}
                          >
                            <svg
                              width="26"
                              height="26"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 15V9h3l4-3v12l-4-3H5Z"
                                stroke="#FF914D"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M15.5 8c1.5 1.5 1.5 4.5 0 6"
                                stroke="#FF914D"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                              />
                              <path
                                d="M18 5c3 3.2 3 10.8 0 14"
                                stroke="#FF914D"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                          <h2>{current?.q || ""}</h2>
                          {current?.hint && (
                            <p style={{opacity:0.85, marginTop:10}}>{current.hint}</p>
                          )}
                        </div>
                        <div className="face back-face">
                          <button
                            className="sound-btn"
                            title="Tap to hear the answer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!current) return;
                              const textToRead = `${current?.a || ""}`.trim();
                              if (!textToRead) return;
                              if (isPlaying) stop();
                              else speak(textToRead);
                            }}
                            disabled={!current}
                          >
                            <svg
                              width="26"
                              height="26"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 15V9h3l4-3v12l-4-3H5Z"
                                stroke="#FF914D"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M15.5 8c1.5 1.5 1.5 4.5 0 6"
                                stroke="#FF914D"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                              />
                              <path
                                d="M18 5c3 3.2 3 10.8 0 14"
                                stroke="#FF914D"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                          <h2>الإجابة</h2>
                          {current?.a && <p style={{fontSize:"18px", marginTop:12}}>{current.a}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="practice-progress" title="Your progress">
              {cards.map((card, idx) => {
                const state = progress[idx];
                const cls = state === "right" ? "good" : state === "left" ? "bad" : "";
                return (
                  <span
                    key={card.id}
                    className={`progress-dot ${cls} ${
                      !sessionComplete && idx === i ? "active" : ""
                    }`}
                  />
                );
              })}
            </div>

            <div className="practice-actions">
              <button
                className="cube-btn red"
                title="I don’t know this"
                onClick={() => handlePracticeAnswer("left")}
                disabled={!current || doneAll}
              >
                ←
              </button>
              <button
                className="cube-btn green"
                title="I know this"
                onClick={() => handlePracticeAnswer("right")}
                disabled={!current || doneAll}
              >
                →
              </button>
            </div>
          </>
        )}

        {!loading && !err && cards.length === 0 && (
          <div className="helperBox">
            {mode === "viewDeck"
              ? "لا توجد بطاقات في هذه المجموعة."
              : "لا توجد بطاقات للعرض. عودي لصفحة الرفع ثم اضغطي \"توليد البطاقات\"."
            }
          </div>
        )}

        {saveMsg && (
          <div className={`alert ${saveOk === true ? "ok" : saveOk === false ? "err" : ""}`}>
            {saveMsg}
          </div>
        )}
      </section>

      {summaryOpen && (
        <div className="practice-modal">
          <div className="practice-modal__body">
            <h3>انتهت الجلسة!</h3>
            <p style={{color:"#16a34a", fontWeight:700}}>عرفتها: {totalCorrect}</p>
            <p style={{color:"#dc2626", fontWeight:700}}>ما عرفتها: {totalWrong}</p>
            <div className="practice-modal__actions">
              {mode === "generate" ? (
                <>
                  <button className="ghost" onClick={handleIgnore} title="Discard this round">
                    تجاهل
                  </button>
                  <button
                    className="solid"
                    onClick={() => {
                      setSummaryOpen(false);
                      setNameDraft(deckName);
                      setNamePromptOpen(true);
                    }}
                    title="Save this set"
                  >
                    حفظ البطاقات
                  </button>
                </>
              ) : (
                <button className="solid" onClick={() => navigate("/cards")} title="الانتقال لقائمة البطاقات">
                  تم
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {namePromptOpen && (
        <div className="practice-modal">
          <div className="practice-modal__body">
            <h3>احفظي المجموعة</h3>
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="اسم المجموعة"
              style={{width:"100%", padding:"12px", borderRadius:"12px", border:"1px solid #e5e7eb"}}
            />
            <div className="practice-modal__actions">
              <button className="ghost" onClick={() => setNamePromptOpen(false)}>
                إلغاء
              </button>
              <button
                className="solid"
                onClick={() => {
                  setNamePromptOpen(false);
                  handleSave(nameDraft);
                }}
                disabled={saving}
              >
                {saving ? "يتم الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
