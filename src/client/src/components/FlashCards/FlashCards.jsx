import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const LIMIT = 10; // آخر 10
const PRIMARY_COLOR = "#ff8c42";
const PRIMARY_LIGHT = "#ffeadf";
const BORDER_COLOR = "#e5e7eb";
const TEXT_COLOR = "#1f2937";

const local = `
.flashcardsRoot,
.flashcardsRoot *{
  font-family:"Cairo","Helvetica Neue",sans-serif;
}
.flashcardsRoot{
  min-height:calc(110vh - 180px);
  display:flex;
  flex-direction:column;
  padding-bottom:120px;
}

.progress-wrap{
  flex:1 0 auto;
  display:flex;
  flex-direction:column;
  gap:24px;
  padding:32px 18px 60px;
  max-width:1200px;
  margin:0 auto;
}

.fc-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:24px;
  padding-bottom:18px;
  border-bottom:2px solid ${BORDER_COLOR};
}

@media (max-width:768px){
  .fc-top{
    flex-direction:column;
    align-items:flex-start;
  }
}

.title-block{
  display:flex;
  flex-direction:column;
  gap:6px;
  text-align:right;
}

.title{
  font-size:2.2rem;
  font-weight:800;
  color:${TEXT_COLOR};
  margin:0;
}

.page-subtitle{
  font-size:1rem;
  color:#6b7280;
  margin:0;
  font-weight:500;
}

.modern-action-btn{
  padding:12px 24px;
  border-radius:12px;
  border:1px solid ${PRIMARY_LIGHT};
  background:#fff;
  font-weight:700;
  color:${PRIMARY_COLOR};
  display:inline-flex;
  align-items:center;
  gap:10px;
  text-decoration:none;
  transition:all .2s ease;
  box-shadow:0 4px 10px rgba(15,23,42,0.06);
}
.modern-action-btn:hover{
  background:${PRIMARY_LIGHT};
}
.modern-primary-btn{
  background:${PRIMARY_COLOR};
  color:#fff;
  border-color:${PRIMARY_COLOR};
}
.modern-primary-btn:hover{
  color:#fff;
  background:#e57e3f;
}
.btn-icon{
  width:32px;
  height:32px;
  border-radius:10px;
  background:#fff;
  color:${PRIMARY_COLOR};
  font-weight:900;
  display:inline-flex;
  align-items:center;
  justify-content:center;
}
.modern-primary-btn .btn-icon{
  color:${PRIMARY_COLOR};
}

.section-title-wrap{
  display:flex;
  align-items:center;
  justify-content:space-between;
  flex-wrap:wrap;
  gap:12px;
  margin-top:12px;
}
.section-title{
  font-size:1.5rem;
  font-weight:800;
  color:${TEXT_COLOR};
  border-right:5px solid ${PRIMARY_COLOR};
  padding-right:12px;
  margin:0;
}
.section-caption{
  color:#6b7280;
  font-weight:600;
}

.deck-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
  gap:18px;
}

.deck-card{
  background:#fff;
  border:1px solid ${BORDER_COLOR};
  border-radius:14px;
  padding:22px;
  box-shadow:0 18px 32px rgba(15,23,42,0.08);
  display:flex;
  flex-direction:column;
  gap:14px;
  transition:transform .2s ease, box-shadow .2s ease,border-color .2s ease;
}
.deck-card:hover{
  transform:translateY(-4px);
  border-color:${PRIMARY_COLOR};
  box-shadow:0 24px 40px rgba(255,140,66,0.18);
}
.deck-card-header{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
}
.deck-card-title{
  margin:0;
  font-size:1.25rem;
  font-weight:800;
  color:${TEXT_COLOR};
}
.deck-card-footer{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-top:auto;
  gap:12px;
}
.deck-card-cta{
  border:1px solid ${PRIMARY_COLOR};
  background:${PRIMARY_COLOR};
  color:#fff;
  padding:9px 18px;
  border-radius:999px;
  font-weight:700;
  text-decoration:none;
  transition:all .2s ease;
}
.deck-card-cta:hover{
  background:#e57e3f;
  border-color:#e57e3f;
}

.deck-stats{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  align-items:center;
}
.deck-stat{
  display:inline-flex;
  align-items:center;
  gap:6px;
  border-radius:999px;
  padding:6px 12px;
  font-weight:700;
  font-size:.9rem;
}
.deck-stat--correct{
  background:#ecfdf5;
  color:#047857;
  border:1px solid #bbf7d0;
}
.deck-stat--incorrect{
  background:#fef2f2;
  color:#b91c1c;
  border:1px solid #fecaca;
}
.deck-stat-icon{
  font-size:0.9rem;
  line-height:1;
}

.status-chip{
  display:inline-flex;
  align-items:center;
  gap:8px;
  background:#fdf2e9;
  border:1px solid ${PRIMARY_LIGHT};
  padding:10px 14px;
  border-radius:50px;
  color:#a04907;
  font-weight:600;
  width:max-content;
}
.status-dot{
  width:10px;
  height:10px;
  border-radius:999px;
  background:${PRIMARY_COLOR};
}

.modern-alert-error{
  padding:15px;
  border-radius:10px;
  background-color:#fef2f2;
  color:#b91c1c;
  border:1px solid #fecaca;
  font-weight:600;
}

.skel{
  height:170px;
  border-radius:14px;
  background:linear-gradient(90deg,#f3f4f6 25%,#edeff3 37%,#f3f4f6 63%);
  background-size:400% 100%;
  animation:shimmer 1.2s infinite;
}
@keyframes shimmer{
  100%{
    background-position:-100% 0;
  }
}

.empty-state-card{
  background:#fff7ed;
  border:1px dashed ${PRIMARY_LIGHT};
  border-radius:12px;
  padding:32px;
  text-align:center;
  font-weight:600;
  color:#7a3410;
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

  const showSkeletons = loading && decks.length === 0;
  const showEmpty = !loading && !err && decks.length === 0;

  return (
    <div dir="rtl" lang="ar" className="flashcardsRoot">
      <style>{local}</style>

      <section className="progress-wrap">
        <div className="fc-top">
          <div className="title-block">
            <h1 className="title">البطاقات التعليمية</h1>
            <p className="page-subtitle">
              استعرض أحدث مجموعات البطاقات لتبدأ جلسة مراجعة سريعة في أي وقت.
            </p>
          </div>
          <Link to="/upload" className="modern-action-btn modern-primary-btn">
            <span className="btn-icon">+</span>
            <span>إنشاء بطاقات جديدة</span>
          </Link>
        </div>

        {loading && (
          <div className="status-chip">
            <span className="status-dot" />
            جارٍ تحديث المجموعات…
          </div>
        )}

        {err && <div className="modern-alert-error">خطأ: {err}</div>}

        <div className="section-title-wrap">
          <h2 className="section-title">
            آخر {LIMIT.toLocaleString("ar-EG")} مجموعات
          </h2>
        </div>

        <div className="deck-grid">
          {showSkeletons &&
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="skel" />
            ))}

          {!showSkeletons &&
            decks.map((d) => {
              const knownCount = Number(d.knownCount || 0);
              const unknownCount = Number(d.unknownCount || 0);
              return (
                <article key={d.id} className="deck-card">
                  <div className="deck-card-header">
                    <div>
                      <h4 className="deck-card-title">{d.name || d.id}</h4>
                    </div>
                  </div>
                  <div className="deck-card-footer">
                    <div className="deck-stats">
                      <span className="deck-stat deck-stat--correct">
                        <span className="deck-stat-icon">✓</span>
                        {knownCount.toLocaleString("ar-EG")}
                      </span>
                      <span className="deck-stat deck-stat--incorrect">
                        <span className="deck-stat-icon">✕</span>
                        {unknownCount.toLocaleString("ar-EG")}
                      </span>
                    </div>
                    <Link
                      className="deck-card-cta"
                      to={`/cards/view/${encodeURIComponent(d.id)}`}
                    >
                      فتح المجموعة
                    </Link>
                  </div>
                </article>
              );
            })}
        </div>

        {showEmpty && (
          <div className="empty-state-card">
            لا توجد مجموعات بعد. ابدأ بإنشاء مجموعتك الأولى لتظهر هنا.
          </div>
        )}
      </section>
    </div>
  );
}
