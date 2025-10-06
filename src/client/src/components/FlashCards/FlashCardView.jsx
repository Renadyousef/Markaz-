import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/flashcards";

const local = `
.fcView{ display:grid; gap:14px; }
.fcTop{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
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
}

.center{ transform:translateX(0); opacity:1; }
.left{   transform:translateX(-100%); opacity:0; }
.right{  transform:translateX(100%);  opacity:0; }

.block{
  border:1px solid #e5e7eb; border-radius:12px; padding:12px 14px; background:#fff; 
}
.block h4{
  margin:0 0 8px; font-size:16px; font-weight:900; color:#0f172a;
}
.block p{
  margin:0; font-size:16px; line-height:1.9; color:#334155; 
}

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

.badge{
  font-size:13px;               /* اختياري: تكبير بسيط */
  font-weight:900;
  padding:4px 10px;
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#fff;

  color:#111827;                /* نص داكن */
  text-shadow: 0 0 0.8px rgba(0,0,0,.55); /* تحديد خفيف يرفع الوضوح */
}
.badge.ok{
  border-color:#c7f0d2;
  background:#f0fff4;
  color:#111827;                /* تأكيد اللون */
}
.badge.no{
  border-color:#fcd5d5;
  background:#fff5f5;
  color:#111827;                /* تأكيد اللون */
}

.helperBox{ border:1px dashed #e5e7eb; border-radius:12px; padding:12px; background:#fff; }
.helperBox .row{ display:flex; gap:10px; margin-top:10px; align-items:center; flex-wrap:wrap; }

.alert{
  margin-top:10px; padding:10px 12px; border-radius:10px; font-weight:800;
  border:1px solid #e5e7eb; background:#fff;
}
.alert.ok{ border-color:#c7f0d2; background:#f0fff4; }
.alert.err{ border-color:#fcd5d5; background:#fff5f5; color:#b00020; }
`;

export default function FlashCardView() {
  // from Upload page: navigate("/flashcards", { state: { pdfId } })
  const { state } = useLocation();
  const pdfId = state?.pdfId;

  const [cards, setCards] = useState([]);
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [deckId, setDeckId] = useState(null);

  // deck name + save messages
  const [deckName, setDeckName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saveOk, setSaveOk] = useState(null); // true/false/null

  // progress tracking
  const [known, setKnown] = useState(new Set());
  const [unknown, setUnknown] = useState(new Set());

  // swipe
  const startXRef = useRef(null);
  const dxRef = useRef(0);
  const activeSlideRef = useRef(null);
  const SWIPE_THRESHOLD = 60;

  // load cards
  async function loadFromPdf() {
    if (!pdfId) { setErr("لا يوجد pdfId"); return; }
    setLoading(true); setErr(""); setSaveMsg(""); setSaveOk(null); setDeckId(null);

    try {
      const res = await axios.post(`${API_BASE}/from-pdf/${pdfId}?limit=10`);
      if (res.data?.ok) {
        const mapped = (res.data.cards || []).map((c, idx) => ({
          id: c.id ?? `c_${idx}`,
          q: c.question,
          a: c.answer,
          hint: c.hint ?? null,
          tags: Array.isArray(c.tags) ? c.tags : [],
        }));
        setCards(mapped);
        setI(0);
        setKnown(new Set());
        setUnknown(new Set());
      } else {
        setErr(res.data?.error || "حدث خطأ غير معروف");
      }
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFromPdf(); /* auto on mount */ }, [pdfId]);

  // swipe helpers
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

  // right = known, left = unknown
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

    setI(prev => Math.min(cards.length - 1, prev + 1));
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
      setTimeout(() => { resetTransform(); mark(dir); }, 120);
    } else {
      resetTransform();
    }
    startXRef.current = null;
    dxRef.current = 0;
    activeSlideRef.current = null;
  }

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") mark("right");
      if (e.key === "ArrowLeft") mark("left");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, cards, known, unknown]);

  const doneAll = cards.length > 0 && (known.size + unknown.size) === cards.length;

  async function handleSave() {
    if (!doneAll || saving) return;
    setSaving(true);
    setSaveMsg("");
    setSaveOk(null);
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
      const res = await axios.post(`${API_BASE}/save-deck`, payload);
      if (res.data?.ok) {
        setDeckId(res.data.deckId);
        setSaveOk(true);
        setSaveMsg(res.data.message || `تم الحفظ بنجاح: "${res.data.name}" (ID: ${res.data.deckId}) • عدد: ${res.data.count}`);
      } else {
        setSaveOk(false);
        setSaveMsg(`فشل الحفظ: ${res.data?.error || "Unknown error"}`);
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
    setDeckId(null); setSaveOk(null);
    setSaveMsg("تم تجاهل هذه المجموعة.");
  }

  return (
    <div className="hp">
      <style>{local}</style>

      <section className="panel fcView">
        <div className="fcTop">
          <h3 className="title">
            عرض البطاقات {pdfId ? `• ${pdfId}` : ""} {deckId ? `• تم الحفظ: ${deckId}` : ""}
          </h3>
          <div className="badges">
            <span className="badge ok">عرفتها: {known.size}</span>
            <span className="badge no">ما عرفتها: {unknown.size}</span>
            <Link to="/cards" className="back">رجوع</Link>
          </div>
        </div>

        {loading && <div className="viewer">... جاري التوليد</div>}
        {!loading && err && (
          <div className="helperBox">
            <div className="alert err">خطأ: {err}</div>
            <div className="row">
              <button className="navBtn" onClick={loadFromPdf}>إعادة المحاولة</button>
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
                <article key={c.id} className={`slide ${pos}`}>
                  {/* التعريف أولاً */}
                  <section className="block def">
                    <h4>التعريف</h4>
                    <p>{c.a}</p>
                  </section>

                  {/* المصطلح تحت */}
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
              <button className="navBtn" onClick={()=>mark("left")} disabled={i>=cards.length}>ما فهمتها (←)</button>
              <div className="dots">
                {cards.map((_, idx)=><span key={idx} className={`dot ${idx===i? "isActive":""}`} />)}
              </div>
              <button className="navBtn" onClick={()=>mark("right")} disabled={i>=cards.length}>عرفتها (→)</button>
              <button className="navBtn" onClick={loadFromPdf} disabled={loading || saving}>إعادة التوليد</button>
            </div>

            {/* حفظ */}
            <div className="helperBox" style={{marginTop:12}}>
              <label style={{display:"block", fontWeight:800}}>
                اسم المجموعة:
                <input
                  type="text"
                  placeholder="مثال: مصطلحات الفصل الثاني"
                  value={deckName}
                  onChange={(e)=>setDeckName(e.target.value)}
                  style={{
                    width:"100%", marginTop:6, padding:"10px",
                    border:"1px solid #e5e7eb", borderRadius:10
                  }}
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
          </>
        )}

        {!loading && !err && cards.length === 0 && (
          <div className="helperBox">
            لا توجد بطاقات للعرض. عودي لصفحة الرفع ثم اضغطي "توليد البطاقات".
          </div>
        )}
      </section>
    </div>
  );
}
