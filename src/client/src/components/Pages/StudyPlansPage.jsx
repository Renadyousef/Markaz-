// client/src/components/Pages/StudyPlansPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarClock,
  ListChecks,
  Folders,
  AlertTriangle,
} from "lucide-react";

/* ===== ثوابت الأسلوب والألوان (مماثلة لـ ProgressPage) ===== */
const PRIMARY_COLOR = "#ff8c42"; // برتقالي أكثر حيوية
const PRIMARY_LIGHT = "#ffdbbf"; // درجة فاتحة ناعمة

/* ===== Helpers ===== */
function prettyDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    // تاريخ ميلادي عربي مثل: ٢٧ نوفمبر ٢٠٢٥
    return d.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
function safeStr(v) {
  try {
    return typeof v === "string" ? v : JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}
async function fetchWithDiagnostics(url, options = {}) {
  const startedAt = new Date().toISOString();
  let res;
  try {
    res = await fetch(url, options);
  } catch (networkErr) {
    const err = new Error("Network error (failed to fetch)");
    err.__diag = {
      type: "NETWORK_ERROR",
      startedAt,
      finishedAt: new Date().toISOString(),
      request: { url, method: options?.method || "GET" },
      error: { message: networkErr?.message, stack: networkErr?.stack },
    };
    throw err;
  }
  const contentType = res.headers.get("content-type") || "";
  let rawText = "";
  let json = null;
  try {
    rawText = await res.text();
  } catch {
    rawText = "";
  }
  if (contentType.includes("application/json")) {
    try {
      json = rawText ? JSON.parse(rawText) : null;
    } catch {}
  }
  if (!res.ok) {
    const err = new Error(
      json?.msg || json?.error || `HTTP ${res.status} ${res.statusText}`
    );
    err.__diag = {
      type: "HTTP_ERROR",
      status: res.status,
      statusText: res.statusText,
      startedAt,
      finishedAt: new Date().toISOString(),
      request: { url, method: options?.method || "GET" },
      response: { contentType, json },
    };
    throw err;
  }
  return { json: json ?? (rawText ? { raw: rawText } : {}), diag: { type: "OK" } };
}

/* ===== ترتيب حسب الأولوية ثم الموعد ===== */
const PRIORITY_RANK = {
  High: 0,
  "عالية": 0,
  Medium: 1,
  "متوسطة": 1,
  Low: 2,
  "منخفضة": 2,
};
const PRIORITY_STYLE = {
  High: { class: "p-high", name: "عالية" },
  "عالية": { class: "p-high", name: "عالية" },
  Medium: { class: "p-mid", name: "متوسطة" },
  "متوسطة": { class: "p-mid", name: "متوسطة" },
  Low: { class: "p-low", name: "منخفضة" },
  "منخفضة": { class: "p-low", name: "منخفضة" },
};

function toDate(val) {
  if (!val) return null;
  if (val?.toMillis) return new Date(val.toMillis());
  if (typeof val === "number") return new Date(val);
  if (typeof val === "string") {
    return /^\d{4}-\d{2}-\d{2}$/.test(val)
      ? new Date(val + "T00:00:00Z")
      : new Date(val);
  }
  return null;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function normalizeToISODateOnly(v) {
  if (!v) return "";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = toDate(v);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function isToday(v) {
  return normalizeToISODateOnly(v) === todayISO();
}

/* ===== Progress Ring ===== */
const ProgressRing = ({
  percentage = 0,
  size = 60,
  strokeWidth = 5,
  color = PRIMARY_COLOR,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="progress-ring-wrap"
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <svg
        height={size}
        width={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          className="progress-ring-background"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="progress-ring-foreground"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
        />
      </svg>
      <span className="progress-ring-text" style={{ fontSize: size * 0.35 }}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

export default function StudyPlansPage() {
  const navigate = useNavigate();

  const [nearestTasks, setNearestTasks] = useState([]);
  const [topThreePlans, setTopThreePlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null); // {title, message, diag}
  const [showDetails, setShowDetails] = useState(false);

  // ترتيب وقائي (الأولوية ثم الموعد)
  const sortedTodayTasks = useMemo(() => {
    if (!Array.isArray(nearestTasks)) return [];
  const todayTasks = nearestTasks.filter(
  (t) => isToday(t.deadlineISO || t.deadline) && !t.completed
);
    const copy = [...todayTasks];
    copy.sort((a, b) => {
      const ra = PRIORITY_RANK[a.priority] ?? 999;
      const rb = PRIORITY_RANK[b.priority] ?? 999;
      if (ra !== rb) return ra - rb;
      const da = toDate(a.deadline)?.getTime() ?? 0;
      const db = toDate(b.deadline)?.getTime() ?? 0;
      if (da !== db) return da - db;
      return String(a.title || "").localeCompare(String(b.title || ""), "ar");
    });
    return copy;
  }, [nearestTasks]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setError({
        title: "لم يتم العثور على توكن",
        message: "يرجى تسجيل الدخول أولًا.",
        diag: {
          hint: "تأكد أن عملية تسجيل الدخول تحفظ التوكن في localStorage باسم token",
        },
      });
      return;
    }

    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { json } = await fetchWithDiagnostics(
          "http://localhost:5000/study-plans/overview",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (aborted) return;

        setNearestTasks(
          Array.isArray(json.nearestTasks) ? json.nearestTasks : []
        );

        const plansStats = json.plansStats || {};
        const topRaw = Array.isArray(json.topThreePlans)
          ? json.topThreePlans
          : [];

        const plansWithPercentage = topRaw.map((p) => {
          const stat = plansStats[p.id] || {};
          const totalFromStats = Number(stat.total ?? 0);
          const total =
            totalFromStats > 0
              ? totalFromStats
              : Number(p.tasksCount || 0);
          const completed = Number(stat.completed ?? 0);
          const percent =
            total > 0
              ? Math.min(100, Math.max(0, (completed / total) * 100))
              : 0;

          return {
            ...p,
            completionPercentage: percent,
          };
        });

        setTopThreePlans(plansWithPercentage);
      } catch (e) {
        if (aborted) return;
        console.error("Fetch overview failed:", e?.__diag || e);
        setError({
          title: "فشل في الجلب",
          message: e?.message || "Unknown error",
          diag: e?.__diag || null,
        });
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

  return () => {
      aborted = true;
    };
  }, []);

  return (
    <div dir="rtl" className="studyPlansRoot modern-dashboard">
      <style>{`
        .modern-dashboard, .modern-dashboard * {
          font-family: "Cairo", "Helvetica Neue", sans-serif;
        }

        .progress-wrap {
          display: flex;
          flex-direction: column;
          gap: 30px; 
          padding: 30px 20px 60px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .fc-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .fc-top { flex-direction: column; align-items: flex-start; }
        }

        .title-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: right;
        }

        .fc-top .title {
          font-size: 2.2rem;
          font-weight: 800;
          color: #1f2937;
          line-height: 1.2;
        }

        .page-subtitle {
          font-size: 1rem;
          font-weight: 500;
          color: #6b7280;
        }

        .modern-action-btn {
          padding: 10px 22px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid ${PRIMARY_LIGHT};
          font-size: 1rem;
          font-weight: 600;
          color: ${PRIMARY_COLOR};
          text-decoration: none;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all .2s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .modern-action-btn:hover {
          background: ${PRIMARY_LIGHT};
          color: ${PRIMARY_COLOR};
          border-color: ${PRIMARY_COLOR};
          box-shadow: 0 8px 18px rgba(255, 140, 66, 0.2);
          transform: translateY(-1px);
        }
        .modern-primary-btn {
          background: ${PRIMARY_COLOR};
          color: #ffffff;
          border-color: ${PRIMARY_COLOR};
        }
        .modern-primary-btn:hover {
          background: #e57e3f;
          border-color: #e57e3f;
          color: #ffffff;
          box-shadow: 0 8px 18px rgba(255, 140, 66, 0.4);
        }

        .section-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1f2937;
          line-height: 1.3;
        }

        .section-icon {
          color: ${PRIMARY_COLOR};
          flex-shrink: 0;
        }

        .tasks-list {
          margin-top: 5px;
        }

        /* ===== كارد موحّد للمهام مثل PlanDetailsPage ===== */
        .task-card {
          border-radius: 16px;
          border: 1px solid #ffe7c2;
          background: #ffffff;
          box-shadow: 0 10px 22px rgba(15,23,42,0.04);
          transition: box-shadow .18s ease, border-color .18s ease, transform .18s ease;
        }
        .task-card:hover,
        .task-card:focus-within {
          border-color: #fdba74;
          box-shadow: 0 18px 32px rgba(15,23,42,0.08);
          transform: translateY(-1px);
        }

        .task-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: .9rem 1.1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .task-row:last-child {
          border-bottom: none;
        }

        .task-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .task-title {
          font-weight: 700;
          font-size: 1rem;
          color: #1f2937;
        }

        .task-sub {
          font-size: .85rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .task-side {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          min-width: 170px;
        }

        .task-date {
          font-size: .85rem;
          color: #4b5563;
        }

        .priority-badge {
          display: inline-block;
          border-radius: 999px;
          padding: .25rem .65rem;
          font-weight: 700;
          font-size: .8rem;
          line-height: 1;
          border: 1px solid transparent;
        }
        .p-high {
          color: #B91C1C; background: #FEF2F2; border-color: #FCA5A5;
        }
        .p-mid {
          color: #92400E; background: #FFFBEB; border-color: #FCD34D;
        }
        .p-low {
          color: #065F46; background: #ECFDF5; border-color: #A7F3D0;
        }
        
        .done-pill {
          display: inline-block;
          background: #d1fae5;
          color: #065f46;
          border-radius: 999px;
          padding: 2px 8px;
          font-weight: 600;
          font-size: .75rem;
        }

        .plan-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .plan-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
          border-color: ${PRIMARY_COLOR};
        }

        .plan-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 10px;
        }
        
        .plan-card-title {
          font-weight: 800;
          font-size: 1.25rem;
          color: #1f2937;
          line-height: 1.4;
          flex-grow: 1;
        }
        .plan-card-meta {
          font-size: 0.95rem;
          color: #6b7280;
          margin-top: 5px;
        }

        .progress-ring-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .progress-ring-text {
          position: absolute;
          font-weight: 700;
          color: #1f2937;
        }

        .empty-state-card {
          background: #fff7ed;
          border: 1px dashed ${PRIMARY_LIGHT};
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin-top: 10px;
        }
        
        .skel {
          position: relative; overflow: hidden; background: #e5e7eb; border-radius: 8px;
        }
        .skel::after {
          content: ""; position: absolute; inset: 0; transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
          animation: shimmer 1.1s infinite;
        }
        @keyframes shimmer { 100% { transform: translateX(100%); } }

        .modern-alert-error {
          padding: 15px;
          border-radius: 10px;
          background-color: #fef2f2;
          color: #ef4444;
          border: 1px solid #fecaca;
          margin: 20px 0;
          text-align: right;
          font-weight: 600;
        }
        .small-pre {
          max-height: 250px;
          overflow: auto;
          background: #fffafa;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px;
          font-size: 12px;
          color: #991b1b;
          direction: ltr;
          text-align: left;
        }
        .alert-action-btn {
          background: #fecaca;
          color: #991b1b;
          border: none;
          padding: 5px 10px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.85rem;
          transition: background .2s;
        }
        .alert-action-btn:hover {
          background: #fdc3c3;
        }
      `}</style>

      <section className="progress-wrap">
        {/* Header */}
        <div className="fc-top">
          <div className="title-block">
            <h1 className="title">لوحة الخطط الدراسية</h1>
            <div className="page-subtitle">
              نظرة سريعة على مهامك اليومية وأحدث الخطط التي أنشأتها.
            </div>
          </div>
          <div className="d-flex gap-2">
            <Link to="/plans/all" className="modern-action-btn">
              <Folders size={20} strokeWidth={2.5} /> رؤية جميع الخطط
            </Link>
            <Link to="/plans/create" className="modern-action-btn modern-primary-btn">
              + إنشاء خطة
            </Link>
          </div>
        </div>

        {/* الأخطاء */}
        {error && (
          <div className="modern-alert-error">
            <div className="d-flex align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={20} />
                <strong>{error.title}:</strong> {error.message}
              </div>
              <button
                type="button"
                className="alert-action-btn"
                onClick={() => setShowDetails((v) => !v)}
              >
                {showDetails ? "إخفاء" : "عرض التفاصيل"}
              </button>
            </div>
            {showDetails && (
              <div className="mt-3">
                <div className="mt-2" style={{ color: "#991b1b", fontWeight: "800" }}>
                  التشخيص:
                </div>
                <pre className="small-pre">{safeStr(error.diag)}</pre>
              </div>
            )}
          </div>
        )}

        {/* مهام اليوم */}
        <div className="tasks-section">
          <div className="section-title-wrap">
            <CalendarClock size={24} className="section-icon" />
            <h2 className="section-title">مهام موعدها اليوم</h2>
          </div>
          <div className="tasks-list">
            {loading ? (
              <div className="task-card skel" style={{ height: 160 }} />
            ) : sortedTodayTasks.length === 0 ? (
              <div className="empty-state-card">
                <p
                  style={{
                    color: "#7a3f00",
                    fontWeight: "600",
                    marginBottom: "8px",
                  }}
                >
                  لا توجد مهام مستحقة اليوم. رائع!
                </p>
                <small style={{ color: "#9d7547" }}>
                  استمتع بيومك أو ابدأ بالتخطيط للمستقبل.
                </small>
              </div>
            ) : (
              <div className="card task-card mb-0">
                <div className="card-body p-0">
                  {sortedTodayTasks.map((t) => {
                    const priorityInfo =
                      PRIORITY_STYLE[t.priority] || PRIORITY_STYLE.Medium;
                    return (
                      <div key={t.id} className="task-row">
                        <div className="task-main">
                          <div className="task-title">{t.title}</div>
                          <div className="task-sub">
                            <ListChecks
                              size={14}
                              style={{ position: "relative", top: "1px" }}
                            />
                            <span>الخطة: {t.planTitle || "غير محدد"}</span>
                          </div>
                        </div>

                        <div className="task-side">
                          <span className="task-date">
                            {prettyDate(t.deadlineISO || t.deadline)}
                          </span>
                          <span
                            className={`priority-badge ${priorityInfo.class}`}
                          >
                            {priorityInfo.name}
                          </span>
                          {t.completed === true && (
                            <span className="done-pill">تم الإنجاز</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* أحدث الخطط */}
        <div className="plans-section" style={{ marginTop: "40px" }}>
          <div className="section-title-wrap">
            <Folders size={24} className="section-icon" />
            <h2 className="section-title">أحدث الخطط</h2>
          </div>
          <div className="row g-4">
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="col-12 col-md-4">
                  <div className="plan-card skel" style={{ height: 180 }}></div>
                </div>
              ))
            ) : topThreePlans.length === 0 ? (
              <div className="col-12">
                <div className="empty-state-card" style={{ padding: "40px" }}>
                  <p
                    style={{
                      color: "#7a3f00",
                      fontWeight: "600",
                      marginBottom: "15px",
                    }}
                  >
                    لا توجد خطط دراسية محفوظة.
                  </p>
                  <Link
                    to="/plans/create"
                    className="modern-action-btn modern-primary-btn"
                  >
                    + إنشاء أول خطة دراسية
                  </Link>
                </div>
              </div>
            ) : (
              topThreePlans.map((p) => (
                <div key={p.id} className="col-12 col-md-4">
                  <div className="plan-card">
                    <div className="flex-grow-1">
                      <div className="plan-card-meta mb-2">
                        أُنشئت في: {prettyDate(p.createdAt)}
                      </div>

                      <div className="plan-card-header">
                        <h3 className="plan-card-title">{p.title}</h3>
                        <ProgressRing
                          percentage={p.completionPercentage || 0}
                          size={70}
                          strokeWidth={8}
                          color={PRIMARY_COLOR}
                        />
                      </div>

                      <div className="plan-card-meta">
                        عدد المهام في الخطة:{" "}
                        <strong>{Number(p.tasksCount || 0)}</strong>
                      </div>
                    </div>
                    <div className="d-flex mt-4">
                      <Link
                        to={`/plans/view?planId=${p.id}`}
                        className="modern-action-btn modern-primary-btn w-100 justify-content-center"
                        style={{ padding: "8px" }}
                      >
                        عرض التفاصيل
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
