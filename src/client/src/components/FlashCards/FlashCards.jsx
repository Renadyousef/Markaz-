import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const LIMIT = 10; // آخر 10

const local = `
.fcSimple{ display:grid; gap:16px; }
.actionsRow{ display:flex; justify-content:flex-start; gap:10px; margin-bottom:6px; }
.createBtn{
  display:inline-flex; align-items:center; gap:8px;
  border:1px solid #f59e0b; background:#f59e0b; color:#fff;
  padding:10px 14px; border-radius:12px; font-weight:900; cursor:pointer; transition:.15s;
  box-shadow: var(--shadow);
}
.createBtn:hover{ background:#d97706; border-color:#d97706; }

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
.alert{
  margin-top:10px; padding:10px 12px; border-radius:10px; font-weight:800;
  border:1px solid #fcd5d5; background:#fff5f5; color:#b00020;
}
`;

export default function FlashCards() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [decks, setDecks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          // no token → redirect to login
          navigate("/login");
          return;
        }

        const { data } = await axios.get(`${API}/retrive/decks?limit=${LIMIT}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!ignore) {
          if (data?.ok) {
            setDecks(data.items || []);
          } else {
            setErr(data?.error || "فشل الجلب");
          }
        }
      } catch (e) {
        if (!ignore) {
          // if unauthorized, push to login
          if (e?.response?.status === 401) {
            navigate("/login");
          } else {
            setErr(e?.response?.data?.error || e.message);
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [navigate]);

  return (
    <div className="hp">
      <style>{local}</style>

      <section className="heroBox heroRow2">
        <div className="heroText heroText2">
          <h1>البطاقات التعليمية</h1>
        </div>
      </section>

      <section className="panel fcSimple">
        <div className="actionsRow">
          <Link to="/upload" className="createBtn">
            + إنشاء بطاقات جديدة
          </Link>
        </div>

        <div className="lastRow">
          <h3 className="panel__title">
            آخر {LIMIT.toLocaleString("ar-EG")} مجموعات
          </h3>

          {loading && <div className="alert">... جارٍ الجلب</div>}
          {err && <div className="alert">خطأ: {err}</div>}

          <div className="lastList">
            {decks.map((d) => (
              <article key={d.id} className="deckItem">
                <div className="deckMeta">
                  <h4 className="deckTitle">{d.name || d.id}</h4>
                  <p className="deckSub">{d.count || 0} بطاقة</p>
                </div>
                <Link
                  className="deckCTA"
                  to={`/cards/view/${encodeURIComponent(d.id)}`}
                >
                  فتح
                </Link>
              </article>
            ))}

            {!loading && !err && decks.length === 0 && (
              <div className="alert">لا توجد مجموعات بعد.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
