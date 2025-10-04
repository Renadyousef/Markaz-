import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

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

/* مواقع الانزلاق */
.center{ transform:translateX(0); opacity:1; }
.left{   transform:translateX(-100%); opacity:0; }
.right{  transform:translateX(100%);  opacity:0; }

/* أزرار التنقل */
.navBtns{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
.navBtn{
  border:1px solid var(--fx-card-ring); background:#fff; padding:10px 14px; border-radius:12px; font-weight:800; cursor:pointer; transition:.15s;
}
.navBtn:hover{ background:var(--fx-cta-hover); border-color:#cbd5e1; }

/* مؤشرات */
.dots{ display:flex; gap:6px; justify-content:center; align-items:center; }
.dot{
  width:8px; height:8px; border-radius:999px; background:#e5e7eb; transition:.15s;
}
.dot.isActive{ background:#f59e0b; }
`;

export default function FlashCardView(){
  const { deckId } = useParams();

  // Mock: بطاقات — لاحقًا نجيبها من Firestore حسب deckId
  const cards = useMemo(()=>[
    { id:"1", q:"What is Big-O of binary search?", a:"O(log n).", tags:["DSA"] },
    { id:"2", q:"HTTP vs HTTPS?", a:"HTTPS = HTTP + TLS for encryption/auth/integrity.", tags:["Web","Security"] },
    { id:"3", q:"React key purpose?", a:"Help React identify elements for efficient reconciliation.", tags:["React"] },
  ],[]);

  const [i, setI] = useState(0);
  const active = cards[i];

  const go = (dir) => {
    setI(prev => {
      if (dir === "next") return Math.min(cards.length-1, prev+1);
      if (dir === "prev") return Math.max(0, prev-1);
      return prev;
    });
  };

  // أسهم الكيبورد
  useEffect(()=>{
    const onKey = (e)=>{
      if (e.key === "ArrowRight") go("next");
      if (e.key === "ArrowLeft")  go("prev");
    };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  },[]);

  return (
    <div className="hp">
      <style>{local}</style>

      <section className="panel fcView">
        <div className="fcTop">
          <h3 className="title">عرض البطاقات {deckId ? `• ${deckId}` : ""}</h3>
          <Link to="/cards" className="back">رجوع</Link>
        </div>

        {/* Viewer */}
        <div className="viewer">
          {cards.map((c, idx)=>{
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

        <div className="navBtns">
          <button className="navBtn" onClick={()=>go("prev")} disabled={i===0}>السابق</button>
          <div className="dots">
            {cards.map((_, idx)=><span key={idx} className={`dot ${idx===i? "isActive":""}`}/>)}
          </div>
          <button className="navBtn" onClick={()=>go("next")} disabled={i===cards.length-1}>التالي</button>
        </div>

        <p className="help">التمرير: استخدمي أسهم الكيبورد ← →  اليمين "لعرفت"  واليسار "لم اعرف" .</p>
      </section>
    </div>
  );
}
