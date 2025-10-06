import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

// API base (backend Express)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ستايل الحركة يمين/يسار */
const local = `
.fcView{ display:grid; gap:14px; }
.fcTop{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
.fcTop .title{ margin:0; font-weight:900; color:var(--text); font-size:18px; }
.fcTop .back{ border:1px solid var(--fx-card-ring); background:#fff; border-radius:10px; padding:8px 12px; font-weight:800; }

.viewer{
  position:relative; height:360px; overflow:hidden;
  border:1px solid var(--fx-card-ring); border-radius:16px; background:#fff; box-shadow:var(--shadow);
  display:grid; place-items:center;
}
.slide{
  position:absolute; inset:0; display:grid; grid-template-rows:auto 1fr auto; padding:18px;
  transition: transform .35s ease, opacity .35s ease;
}
.slide h4{ margin:0 0 8px; font-size:16px; font-weight:900; color:var(--text); }
.slide p{ margin:0; color:#475569; line-height:1.7; font-size:14px; overflow:auto; }

.center{ transform:translateX(0); opacity:1; }
.left{   transform:translateX(-100%); opacity:0; }
.right{  transform:translateX(100%);  opacity:0; }

.navBtns{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
.navBtn{
  border:1px solid var(--fx-card-ring); background:#fff; padding:10px 14px; border-radius:12px; font-weight:800; cursor:pointer; transition:.15s;
}
.navBtn:hover{ background:var(--fx-cta-hover); border-color:#cbd5e1; }

.dots{ display:flex; gap:6px; justify-content:center; align-items:center; }
.dot{ width:8px; height:8px; border-radius:999px; background:#e5e7eb; transition:.15s; }
.dot.isActive{ background:#f59e0b; }

.helperBox{ border:1px dashed #e5e7eb; border-radius:12px; padding:12px; background:#fff; }
.helperBox textarea{ width:100%; min-height:140px; padding:10px; border:1px solid #e5e7eb; border-radius:10px; }
.helperBox .row{ display:flex; gap:10px; margin-top:10px; align-items:center; }
`;

async function getExtractedText(deckId) {
  const t = sessionStorage.getItem(`deckText:${deckId}`);
  return t || "";
}

export default function FlashCardView() {
  const { deckId } = useParams();

  const [cards, setCards] = useState([]); // [{id,q,a,tags,hint}]
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [language, setLanguage] = useState("en");
  const [manualText, setManualText] = useState("");

  const go = (dir) => {
    setI((prev) => {
      if (dir === "next") return Math.min(cards.length - 1, prev + 1);
      if (dir === "prev") return Math.max(0, prev - 1);
      return prev;
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go("next");
      if (e.key === "ArrowLeft") go("prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards.length]);

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!deckId) return;
      setLoading(true);
      setErr("");
      try {
        const text = await getExtractedText(deckId);
        if (!text) { setLoading(false); return; }

        const res = await axios.post(`${API_BASE}/flashcards/from-text`, {
          text, language, limit: 20,
        });

        if (ignore) return;
        if (res.data?.ok) {
          const mapped = res.data.cards.map(c => ({
            id: c.id, q: c.question, a: c.answer,
            tags: c.tags || [], hint: c.hint ?? null
          }));
          setCards(mapped);
          setI(0);
        } else {
          setErr(res.data?.error || "Unknown error");
        }
      } catch (e) {
        setErr(e?.response?.data?.error || e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => { ignore = true; };
  }, [deckId, language]);

  async function manualGenerate() {
    if (!manualText.trim()) return;
    setLoading(true); setErr("");
    try {
      const res = await axios.post(`${API_BASE}/flashcards/from-text`, {
        text: manualText, language, limit: 20,
      });
      if (res.data?.ok) {
        const mapped = res.data.cards.map(c => ({
          id: c.id, q: c.question, a: c.answer,
          tags: c.tags || [], hint: c.hint ?? null
        }));
        setCards(mapped);
        setI(0);
      } else {
        setErr(res.data?.error || "Unknown error");
      }
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hp">
      <style>{local}</style>

      <section className="panel fcView">
        <div className="fcTop">
          <h3 className="title">عرض البطاقات {deckId ? `• ${deckId}` : ""}</h3>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <label style={{fontWeight:800}}>
              Lang:
              <select value={language} onChange={e=>setLanguage(e.target.value)} style={{marginInlineStart:8}}>
                <option value="en">EN</option>
                <option value="ar">AR</option>
              </select>
            </label>
            <Link to="/cards" className="back">رجوع</Link>
          </div>
        </div>

        {loading && <div className="viewer">Generating…</div>}
        {!loading && err && <div className="viewer" style={{color:"#b00020"}}>Error: {err}</div>}

        {!loading && !err && cards.length === 0 && (
          <div className="helperBox">
            <div style={{fontWeight:800, marginBottom:6}}>لا يوجد نص محفوظ لهذا الـ Deck</div>
            <div style={{opacity:.8, marginBottom:6}}>الصقي نصًا هنا لتوليد بطاقات بسرعة</div>
            <textarea
              placeholder="Paste extracted text here..."
              value={manualText}
              onChange={e=>setManualText(e.target.value)}
            />
            <div className="row">
              <button className="navBtn" onClick={manualGenerate} disabled={loading || !manualText.trim()}>
                توليد البطاقات الآن
              </button>
            </div>
          </div>
        )}

        {!loading && !err && cards.length > 0 && (
          <div className="viewer">
            {cards.map((c, idx) => {
              const pos = idx === i ? "center" : idx < i ? "left" : "right";
              return (
                <article key={c.id} className={`slide ${pos}`}>
                  <h4>Question</h4>
                  <p style={{marginBottom:10}}>{c.q}</p>
                  <h4>Answer</h4>
                  <p>{c.a}</p>
                </article>
              );
            })}
          </div>
        )}

        <div className="navBtns">
          <button className="navBtn" onClick={()=>go("prev")} disabled={i===0}>السابق</button>
          <div className="dots">
            {cards.map((_, idx)=><span key={idx} className={`dot ${idx===i? "isActive":""}`} />)}
          </div>
          <button className="navBtn" onClick={()=>go("next")} disabled={i===cards.length-1}>التالي</button>
        </div>

        <p className="help">استخدمي أسهم الكيبورد ← → للتنقل.</p>
      </section>
    </div>
  );
}
