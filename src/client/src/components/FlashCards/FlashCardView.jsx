// client/src/components/Pages/FlashCardView.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import axios from "axios";

/* ===== API ===== */
const API_ROOT  = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_FLASH = `${API_ROOT}/api/flashcards`;
const API_RETR  = `${API_ROOT}/retrive`;

/* ===== TTS Config ===== */
const API_BASE_ROOT = import.meta.env.VITE_API_BASE || ""; // اتركها "" لو نفس دومين الفرونت
const TTS_URL       = API_BASE_ROOT ? `${API_BASE_ROOT}/tts` : "/tts";

/* ===== أصوات متاحة ===== */
const VOICES = [
  { id: "Hala", label: "الصوت الأول" },
  { id: "Zayd", label: "الصوت الثاني" },
];

/* ===== هوك TTS (تشغيل/إيقاف + كاش محلّي) ===== */
function useTTS(initialVoice = "Hala") {
  const audioRef = useRef(null);
  const cacheRef = useRef(new Map());
  const [voice, setVoice] = useState(initialVoice);
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

  return { voice, setVoice, isPlaying, speak, stop };
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
  position:absolute; inset:0; padding:20px;
  display:flex; flex-direction:column; gap:14px;
  transition: transform .25s ease, opacity .25s ease;
  border-radius:16px; border:2px solid transparent;
}
.center{ transform:translateX(0); opacity:1; }
.left{   transform:translateX(-100%); opacity:0; }
.right{  transform:translateX(100%);  opacity:0; }

/* Color by status */
.slide.known{ border-color:#86efac; box-shadow:0 0 0 4px rgba(134,239,172,.25) inset; }
.slide.unknown{ border-color:#fca5a5; box-shadow:0 0 0 4px rgba(252,165,165,.25) inset; }

.block{ border:1px solid #e5e7eb; border-radius:12px; padding:12px 14px; background:#fff; }
.block h4{ margin:0 0 8px; font-size:16px; font-weight:900; color:#0f172a; }
.block p{ margin:0; font-size:16px; line-height:1.9; color:#334155; }
.block.def{ background:#fff8f0; border-color:#ffe4c7; }
.block.term{ background:#f8fafc; border-color:#e2e8f0; }

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

/* ===== شريط الصوت ===== */
.voiceBar{ display:flex; gap:10px; align-items:center; justify-content:flex-end; flex-wrap:wrap; }
.select{ border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px; background:#fff; font-weight:700; }
.ttsBtn{ border:1px solid var(--fx-card-ring); background:#fff; padding:10px 14px; border-radius:12px; font-weight:900; cursor:pointer; }
.ttsBtn.playing{ background:#fee2e2; border-color:#fecaca; }
`;

export default function FlashCardView() {
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

  // meta للعرض في الهيدر عند عرض الدِك
  const [meta, setMeta] = useState(null); // {name,count,knownCount,unknownCount}

  // التصنيف (يُستخدم في وضع التوليد فقط)
  const [deckName, setDeckName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saveOk, setSaveOk] = useState(null);
  const [known, setKnown] = useState(new Set());
  const [unknown, setUnknown] = useState(new Set());

  // سحب
  const startXRef = useRef(null);
  const dxRef = useRef(0);
  const activeSlideRef = useRef(null);
  const SWIPE_THRESHOLD = 60;

  // ====== TTS ======
  const { voice, setVoice, isPlaying, speak, stop } = useTTS("Hala");

  // ====== تحميل من PDF (وضع التوليد) ======
  async function loadFromPdf() {
    if (!pdfId) { setErr("لا يوجد pdfId"); return; }
    setLoading(true); setErr(""); setSaveMsg(""); setSaveOk(null); if(!deckIdParam) setDeckId(null);

    try {
      const res = await axios.post(`${API_FLASH}/from-pdf/${pdfId}?limit=10`);
      if (res.data?.ok) {
        const mapped = (res.data.cards || []).map((c, idx) => ({
          id: c.id ?? `c_${idx}`,
          q: c.question, a: c.answer, hint: c.hint ?? null,
          tags: Array.isArray(c.tags) ? c.tags : [],
        }));
        setCards(mapped);
        setI(0);
        setKnown(new Set());
        setUnknown(new Set());
        setMeta(null);

        // ✅ اقرأ أول بطاقة تلقائيًا بعد التوليد
        const first = mapped[0];
        if (first) {
          const text = `${first.a}\n\n${first.q}`;
          setTimeout(() => speak(text), 80);
        }
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
      const { data } = await axios.get(`${API_RETR}/decks/${id}/full`);
      if(!data?.ok) throw new Error(data?.error || "فشل الجلب");
      const deck = data.deck || {};
      const list = (data.cards || [])
        .sort((a,b)=>(a.order??0)-(b.order??0))
        .map((c,idx)=>({
          id: c.id || `c_${idx}`,
          q: c.question, a: c.answer, hint: c.hint ?? null,
          tags: Array.isArray(c.tags)? c.tags:[],
        }));
      setCards(list);
      setI(0);
      setDeckId(id);
      setMeta({
        name: deck.name || "مجموعة",
        count: deck.count || list.length,
        knownCount: deck.knownCount ?? (deck.knownIds?.length||0),
        unknownCount: deck.unknownCount ?? (deck.unknownIds?.length||0),
      });
      // لإظهار الشارات/الألوان
      setKnown(new Set(deck.knownIds || []));
      setUnknown(new Set(deck.unknownIds || []));
      // (لا نشغّل الصوت تلقائيًا في عرض الدك حتى ما يزعج المستخدم)
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

  // ====== سحب ======
  function applyDragTransform(px) {
    if (!activeSlideRef.current) return;
    activeSlideRef.current.style.transform = `translateX(${px}px)`;
    activeSlideRef.current.style.opacity = String(Math.max(0.3, 1 - Math.abs(px) / 300));
  }
  function resetTransform() {
    if (!activeSlideRef.current) return;
    activeSlideRef.current.style.transform = "";
    activeSlideRef.current.style.opacity = "";
  }
  function onTouchStart(e) {
    startXRef.current = e.touches?.[0]?.clientX ?? e.clientX;
    dxRef.current = 0;
    const el = document.querySelector(".viewer .slide.center");
    activeSlideRef.current = el;
  }
  function onTouchMove(e) {
    if (startXRef.current == null) return;
    const x = e.touches?.[0]?.clientX ?? e.clientX;
    dxRef.current = x - startXRef.current;
    applyDragTransform(dxRef.current);
  }
  function onTouchEnd() {
    if (Math.abs(dxRef.current) > SWIPE_THRESHOLD) {
      const dir = dxRef.current > 0 ? "right" : "left";
      applyDragTransform(dir === "right" ? 500 : -500);
      setTimeout(() => {
        resetTransform();
        if (mode === "generate") {
          mark(dir);        // في التوليد: يمين/يسار = عرفتها/ماعرفتها
        } else {
          // في العرض: فقط تنقّل بدون تصنيف
          setI(prev => {
            const next = prev + (dir === "right" ? 1 :  -1);
            return Math.min(Math.max(next,0), Math.max(cards.length-1,0));
          });
        }
      }, 120);
    } else {
      resetTransform();
    }
    startXRef.current = null; dxRef.current = 0; activeSlideRef.current = null;
  }

  // تصنيف (للتوليد فقط) + قراءة البطاقة التالية
  function mark(direction) {
    if (mode !== "generate") return;
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

    setI(prev => {
      const next = Math.min(cards.length - 1, prev + 1);
      // أوقفي أي تشغيل قبل البدء
      if (isPlaying) stop();
      const nxtCard = cards[next];
      if (nxtCard) {
        const txt = `${nxtCard.a}\n\n${nxtCard.q}`;
        setTimeout(() => speak(txt), 40);
      }
      return next;
    });
  }

  // كيبورد: أسهم للتنقّل/التصنيف + مسافة لتشغيل/إيقاف الصوت
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") {
        if (mode === "generate") mark("right");
        else setI(prev=>Math.min(prev+1, Math.max(cards.length-1,0)));
      }
      if (e.key === "ArrowLeft") {
        if (mode === "generate") mark("left");
        else setI(prev=>Math.max(prev-1, 0));
      }
      if (e.key === " ") {
        e.preventDefault();
        const cur = cards[i];
        if (!cur) return;
        const text = `${cur.a}\n\n${cur.q}`;
        if (isPlaying) stop(); else speak(text);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, cards, known, unknown, mode, isPlaying]);

  const doneAll = cards.length > 0 && (known.size + unknown.size) === cards.length;

  // حفظ (يعمل فقط في وضع التوليد)
  async function handleSave() {
    if (mode !== "generate") return;
    if (!doneAll || saving) return;
    setSaving(true);
    setSaveMsg(""); setSaveOk(null);
    try {
      const payload = {
        pdfId,
        language: "ar",
        deckName: deckName && deckName.trim() ? deckName.trim() : "مجموعة بدون اسم",
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
        setSaveMsg(data.message || `تم الحفظ بنجاح: "${data.name}" (ID: ${data.deckId}) • عدد: ${data.count}`);
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
    setCards([]); setKnown(new Set()); setUnknown(new Set()); setI(0);
    if (mode === "generate") setDeckId(null);
    setSaveOk(null);
    setSaveMsg("تم تجاهل هذه المجموعة.");
    if (isPlaying) stop();
  }

  // نص البطاقة الحالية (الترتيب: التعريف ثم المصطلح)
  const current = cards[i];
  const currentText = current ? `${current.a}\n\n${current.q}` : "";

  return (
    <div className="hp">
      <style>{local}</style>

      <section className="panel fcView">
        <div className="fcTop">
          <h3 className="title">
            {mode === "viewDeck"
              ? `عرض المجموعة • ${meta?.name || deckId}`
              : `عرض البطاقات ${pdfId ? `• ${pdfId}` : ""} ${deckId ? `• تم الحفظ: ${deckId}` : ""}`
            }
          </h3>
          <div className="badges">
            <span className="badge ok">عرفتها: {known.size}</span>
            <span className="badge no">ما عرفتها: {unknown.size}</span>
            <Link to="/cards" className="back">رجوع</Link>
          </div>
        </div>

        {/* شريط الصوت */}
        {!loading && !err && cards.length > 0 && (
          <div className="voiceBar">
            <label style={{fontWeight:900}}>الصوت:</label>
            <select
              className="select"
              value={voice}
              onChange={(e)=>{ if (isPlaying) stop(); setVoice(e.target.value); }}
            >
              {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <button
              className={`ttsBtn ${isPlaying ? "playing" : ""}`}
              onClick={()=>{
                if (!currentText) return;
                if (isPlaying) stop();
                else speak(currentText);
              }}
            >
              {isPlaying ? "إيقاف" : "استمع"}
            </button>
          </div>
        )}

        {loading && <div className="viewer">... جاري التحميل</div>}

        {!loading && err && (
          <div className="helperBox">
            <div className="alert err">خطأ: {err}</div>
            <div className="row">
              {mode === "viewDeck" && <button className="navBtn" onClick={()=>loadDeckById(deckId)}>إعادة المحاولة</button>}
              {mode === "generate" && (
                <button
                  className="navBtn"
                  onClick={()=>{ if (isPlaying) stop(); loadFromPdf(); }}
                >
                  إعادة التوليد
                </button>
              )}
              <Link to="/" className="navBtn">رجوع للرئيسية</Link>
            </div>
          </div>
        )}

        {!loading && !err && cards.length > 0 && (
          <div
            className="viewer"
            onMouseDown={onTouchStart}
            onMouseMove={(e) => startXRef.current != null && onTouchMove(e)}
            onMouseUp={onTouchEnd}
            onMouseLeave={() => startXRef.current != null && onTouchEnd()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {cards.map((c, idx) => {
              const pos = idx === i ? "center" : idx < i ? "left" : "right";
              return (
                <article key={c.id} className={`slide ${pos} ${known.has(c.id) ? 'known' : (unknown.has(c.id) ? 'unknown' : '')}`}>
                  <section className="block def">
                    <h4>التعريف</h4>
                    <p>{c.a}</p>
                  </section>
                  <section className="block term">
                    <h4>المصطلح</h4>
                    <p>{c.q}</p>
                  </section>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !err && cards.length > 0 && (
          <>
            <div className="navBtns">
              {mode === "generate" ? (
                <>
                  <button className="navBtn" onClick={()=>mark("left")} disabled={i>=cards.length}>ما فهمتها (←)</button>
                  <div className="dots">
                    {cards.map((c2, idx)=>{
                      const cls = known.has(c2.id) ? 'known' : (unknown.has(c2.id) ? 'unknown' : '');
                      return <span key={idx} className={`dot ${cls} ${idx===i? "isActive":""}`} />
                    })}
                  </div>
                  <button className="navBtn" onClick={()=>mark("right")} disabled={i>=cards.length}>عرفتها (→)</button>
                  <button
                    className="navBtn"
                    onClick={()=>{ if (isPlaying) stop(); loadFromPdf(); }}
                    disabled={loading || saving}
                  >
                    إعادة التوليد
                  </button>
                </>
              ) : (
                <>
                  <button className="navBtn" onClick={()=>{ if (isPlaying) stop(); setI(v=>Math.max(v-1,0)); }}>السابق</button>
                  <div className="dots">
                    {cards.map((c2, idx)=>{
                      const cls = known.has(c2.id) ? 'known' : (unknown.has(c2.id) ? 'unknown' : '');
                      return <span key={idx} className={`dot ${cls} ${idx===i? "isActive":""}`} />
                    })}
                  </div>
                  <button className="navBtn" onClick={()=>{ if (isPlaying) stop(); setI(v=>Math.min(v+1, cards.length-1)); }}>التالي</button>
                </>
              )}
            </div>

            {mode === "generate" && (
              <div className="helperBox" style={{marginTop:12}}>
                <label style={{display:"block", fontWeight:800}}>
                  اسم المجموعة:
                  <input
                    type="text"
                    placeholder="مثال: مصطلحات الفصل الثاني"
                    value={deckName}
                    onChange={(e)=>setDeckName(e.target.value)}
                    style={{ width:"100%", marginTop:6, padding:"10px", border:"1px solid #e5e7eb", borderRadius:10 }}
                  />
                </label>

                <div className="row">
                  <button className="navBtn" onClick={handleIgnore} disabled={saving}>تجاهل</button>
                  <button className="navBtn" onClick={handleSave} disabled={saving || !doneAll}>
                    {saving ? "جارٍ الحفظ..." : (doneAll ? "حفظ" : "أكملي تصنيف كل البطاقات")}
                  </button>
                </div>

                {saveMsg && (
                  <div className={`alert ${saveOk === true ? "ok" : saveOk === false ? "err" : ""}`}>
                    {saveMsg}
                  </div>
                )}

                {!doneAll && <div className="alert">اسحبي كل البطاقات أولاً: يمين = عرفتها، يسار = ما فهمتها.</div>}
              </div>
            )}
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
      </section>
    </div>
  );
}
