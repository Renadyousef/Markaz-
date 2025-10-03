import { Link } from "react-router-dom";
import { useMemo } from "react";

/* ستايل خفيف خاص بالصفحة */
const local = `
.fcSimple{ display:grid; gap:16px; }
.oneCard{
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  border:1px solid var(--fx-card-ring); background:#fff; border-radius:16px; padding:16px;
  box-shadow: var(--shadow);
}
.oneCard__info{ display:grid; gap:6px; }
.oneCard__title{ margin:0; font-weight:900; color:var(--text); font-size:18px; }
.oneCard__desc{ margin:0; color:#64748b; font-size:14px; }
.oneCard__cta{
  border:1px solid var(--fx-card-ring); background:#fff; color:var(--text);
  padding:10px 14px; border-radius:12px; font-weight:800; cursor:pointer; transition:.15s;
}
.oneCard__cta:hover{ background:var(--fx-cta-hover); border-color:#cbd5e1; }

.lastRow{ display:grid; gap:10px; }
.lastList{ display:grid; gap:10px; }
.deckItem{
  display:flex; align-items:center; justify-content:space-between; gap:10px;
  border:1px solid var(--fx-card-ring); background:#fff; border-radius:12px; padding:12px;
}
.deckMeta{ display:flex; flex-direction:column; gap:4px; }
.deckTitle{ font-weight:900; color:var(--text); margin:0; }
.deckSub{ color:#6b7280; font-size:12.5px; margin:0; }
.deckCTA{
  border:1px solid var(--fx-card-ring); background:#fff; padding:8px 12px; border-radius:10px; font-weight:800;
}
`;

export default function FlashCards(){
  // Mock: آخر ٣ مجموعات (هنا لاحقًا يصير ريتريف من فيرفيس)
  const last3 = useMemo(()=>[
    { id:"algos-101",  name:"النواه والذره", count:18 },
    { id:"net-basics", name:"أساسيات الشبكات", count:12 },
    { id:"react-core", name:" البرمائيات ",   count:22 },
  ],[]);

  return (
    <div className="hp">
      <style>{local}</style>

      <section className="heroBox heroRow2">
        <div className="heroText heroText2">
          <h1>البطاقات التعليمية</h1>
          <p>ادخلي مباشرة على الكارد، ثم شوفي كل بطاقاتك أو المفضّلة. تحت بنعرض آخر ٣ مجموعات اشتغلتي عليها.</p>
        </div>
      </section>

      <section className="panel fcSimple">
        {/* كرت واحد فقط: دخول إلى المتصفح العام للبطاقات */}
        <article className="oneCard">
          <div className="oneCard__info">
            <h3 className="oneCard__title">البطاقات التعليمية</h3>
            <p className="oneCard__desc">ادارة ومراجعة كل بطاقاتك (الكل / المفضلة).</p>
          </div>
          <Link to="/cards/browse" className="oneCard__cta">دخول</Link>
        </article>

        {/* آخر ٣ مجموعات */}
        <div className="lastRow">
          <h3 className="panel__title">آخر ٣ مجموعات</h3>
          <div className="lastList">
            {last3.map(d=>(
              <article key={d.id} className="deckItem">
                <div className="deckMeta">
                  <h4 className="deckTitle">{d.name}</h4>
                  <p className="deckSub">{d.count} بطاقة</p>
                </div>
                <Link to={`/cards/view/${encodeURIComponent(d.id)}`} className="deckCTA">فتح</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
