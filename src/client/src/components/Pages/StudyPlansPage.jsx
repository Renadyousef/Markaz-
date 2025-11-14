// client/src/components/Pages/StudyPlansPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

/* ===== Helpers ===== */
function prettyDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}
function safeStr(v) {
  try { return typeof v === "string" ? v : JSON.stringify(v, null, 2); }
  catch { return String(v); }
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
      request: { url, method: options?.method || "GET", headers: options?.headers || {}, body: options?.body || null },
      error: { message: networkErr?.message, stack: networkErr?.stack },
    };
    throw err;
  }
  const contentType = res.headers.get("content-type") || "";
  let rawText = "";
  let json = null;
  try { rawText = await res.text(); } catch { rawText = ""; }
  if (contentType.includes("application/json")) { try { json = rawText ? JSON.parse(rawText) : null; } catch {} }
  if (!res.ok) {
    const err = new Error(json?.msg || json?.error || `HTTP ${res.status} ${res.statusText}`);
    err.__diag = {
      type: "HTTP_ERROR",
      status: res.status,
      statusText: res.statusText,
      startedAt,
      finishedAt: new Date().toISOString(),
      request: { url, method: options?.method || "GET", headers: options?.headers || {}, body: options?.body || null },
      response: { headers: Object.fromEntries(res.headers.entries()), contentType, json, raw: rawText },
    };
    throw err;
  }
  return {
    json: json ?? (rawText ? { raw: rawText } : {}),
    diag: { type: "OK", status: res.status, startedAt, finishedAt: new Date().toISOString(), request: { url, method: options?.method || "GET" } },
  };
}

/* ===== ترتيب حسب الأولوية ثم الموعد (وقائي في الواجهة) ===== */
const PRIORITY_RANK = {
  High: 0, "عالية": 0,
  Medium: 1, "متوسطة": 1,
  Low: 2, "منخفضة": 2,
};
function toDate(val) {
  if (!val) return null;
  if (val?.toMillis) return new Date(val.toMillis());
  if (typeof val === "number") return new Date(val);
  if (typeof val === "string") {
    return /^\d{4}-\d{2}-\d{2}$/.test(val) ? new Date(val + "T00:00:00Z") : new Date(val);
  }
  return null;
}

/* ✅ helper: هل التاريخ يوافق اليوم؟ (بمقارنة YYYY-MM-DD) */
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
    const copy = [...nearestTasks];
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
        diag: { hint: "تأكد أن عملية تسجيل الدخول تحفظ التوكن في localStorage باسم token" },
      });
      return;
    }

    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { json } = await fetchWithDiagnostics("http://localhost:5000/study-plans/overview", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (aborted) return;
        setNearestTasks(Array.isArray(json.nearestTasks) ? json.nearestTasks : []);
        setTopThreePlans(Array.isArray(json.topThreePlans) ? json.topThreePlans : []);
      } catch (e) {
        if (aborted) return;
        console.error("Fetch overview failed:", e?.__diag || e);
        setError({ title: "فشل في الجلب", message: e?.message || "Unknown error", diag: e?.__diag || null });
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => { aborted = true; };
  }, []);

  return (
    <div dir="rtl" className="min-vh-100">
      <style>{`
        .page-title{ font-weight:800; line-height:1.25; font-size:clamp(1.35rem,1.2rem + 1vw,1.9rem); letter-spacing:.15px; }
        .section-title h2{ font-weight:800; line-height:1.3; font-size:clamp(1rem,.8rem + .6vw,1.25rem); margin:0; }

        .card-orange { background: linear-gradient(135deg, #ffedd5, #fed7aa); border: 1px solid #ffd8a8; }
        .border-orange { border-color: #ffe7c2 !important; }
        .text-muted-700 { color: #6b7280; }
        .btn-orange { background-color: #fb923c; border-color: #fb923c; color: #fff; }
        .btn-orange:hover { background-color: #f97316; border-color: #f97316; color: #fff; }
        .btn-outline-orange { border-color: #ffe7c2; color: #0b0b0c; background-color: #fff; }
        .btn-outline-orange:hover { background-color: #fff7ed; border-color: #fb923c; color: #fb923c; }

        .badge-orange-soft { background-color: #fff3e0; color: #7a3f00; border: 1px solid #ffe0b2; }
        .task-item { border: 1px solid #ffe7c2; border-radius: 14px; padding: 0.85rem 1rem; background: #fff; }
        .task-item + .task-item { margin-top: 0.65rem; }
        .section-title { display:flex; align-items:center; gap:.5rem; margin-bottom:.6rem; }

        .skel { position: relative; overflow: hidden; background: #f3f4f6; border-radius: 12px; }
        .skel::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent);
          animation: shimmer 1.2s infinite; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }

        pre.small-pre { max-height: 280px; overflow: auto; background: #fff7ed; border:1px solid #ffd8a8; border-radius:10px; padding:10px; font-size:12px; }
        .small-muted { font-size: .92rem; color:#6b7280; }

       .done-pill {
  display: inline-block;
  background: #e8f5e9;
  color: #166534;
  border: 1px solid #cde9d6;
  border-radius: 999px;
  padding: 2px 6px; /* ✅ أصغر ليصير على قد الكلمة */
  font-weight: 600;
  line-height: 1;
  width: fit-content; /* ✅ يجعل الخلفية فقط على قد النص */
}

      `}</style>

      <div className="container py-4 py-md-5">
        {/* رأس الصفحة */}
        <div className="card card-orange shadow-sm border-0 rounded-4 mb-4">
          <div className="card-body p-4 p-md-5">
            <div className="row gy-3 align-items-center">
              <div className="col-12 col-md">
                <h1 className="page-title mb-1">الخطط الدراسية</h1>
                <div className="text-muted-700 small">استعراض الخطط الحالية أو إنشاء خطة جديدة بسرعة.</div>
              </div>
              <div className="col-12 col-md-auto d-grid d-sm-flex gap-2">
                <Link to="/plans/all" className="btn btn-outline-orange fw-bold px-3">رؤية جميع الخطط</Link>
                <Link to="/plans/create" className="btn btn-orange fw-bold px-3">+ إنشاء خطة دراسية</Link>
              </div>
            </div>
          </div>
        </div>

        {/* صندوق الأخطاء */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <div className="d-flex align-items-center justify-content-between">
              <strong>{error.title}:</strong>
              <button type="button" className="btn btn-sm btn-light" onClick={() => setShowDetails((v) => !v)}>
                {showDetails ? "إخفاء التفاصيل" : "عرض التفاصيل"}
              </button>
            </div>
            <div className="mt-2">{error.message}</div>
            {showDetails && (
              <div className="mt-3">
                <div className="mb-2"><strong>التشخيص:</strong></div>
                <pre className="small-pre">{safeStr(error.diag)}</pre>
              </div>
            )}
          </div>
        )}

        {/* ✅ مهام موعدها اليوم — مرتّبة حسب الأولوية ثم الموعد */}
        <div className="section-title"><h2>مهام موعدها اليوم</h2></div>
        <div className="mb-4">
          {loading ? (
            <>
              <div className="task-item skel" style={{ height: 64 }} />
              <div className="task-item skel mt-2" style={{ height: 64 }} />
              <div className="task-item skel mt-2" style={{ height: 64 }} />
            </>
          ) : sortedTodayTasks.length === 0 ? (
            <div className="task-item">
              <div className="fw-semibold">لا توجد مهام موعدها اليوم</div>
              <div className="small-muted mt-1">أضف مهامًا جديدة أو عدّل المواعيد من صفحة الخطة.</div>
            </div>
          ) : (
            sortedTodayTasks.map((t) => (
              <div key={t.id} className="task-item">
                <div className="fw-semibold">{t.title}</div>

                {/* نجعل التاريخ وحالة الإنجاز في عمود واحد لتكون "منجزة" تحت التاريخ */}
                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mt-2 small">
                  <div className="d-flex flex-column">
                    <span className="text-muted">التاريخ: {prettyDate(t.deadlineISO || t.deadline)}</span>
                    {/* ✅ منجزة: فقط إذا اليوم && completed === true */}
                    {isToday(t.deadlineISO || t.deadline) && t.completed === true && (
                      <span className="done-pill mt-1">منجزة</span>
                    )}
                  </div>

                  <span className="text-muted">الخطة: {t.planTitle || "—"}</span>
                  <span className="badge rounded-pill badge-orange-soft px-2 py-1">أولوية: {t.priority || "متوسطة"}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* أحدث الخطط */}
        <div className="section-title"><h2>أحدث الخطط الدراسية</h2></div>
        <div className="row g-3 g-md-4">
          {loading ? (
            [0,1,2].map((i) => (
              <div key={i} className="col-12 col-md-4">
                <div className="card rounded-4 border-0 shadow-sm p-3">
                  <div className="skel" style={{ height: 18, width: "60%" }}></div>
                  <div className="skel mt-3" style={{ height: 18, width: "90%" }}></div>
                  <div className="skel mt-3" style={{ height: 18, width: "40%" }}></div>
                  <div className="skel mt-3" style={{ height: 34, width: "50%" }}></div>
                </div>
              </div>
            ))
          ) : topThreePlans.length === 0 ? (
            <div className="col-12">
              <div className="card border-orange rounded-4 shadow-sm">
                <div className="card-body d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
                  <div>
                    <div className="fw-semibold">لا توجد خطط دراسية بعد</div>
                    <div className="small-muted mt-1">ابدأ بتنظيم دراستك من خلال إنشاء خطة دراسية</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            topThreePlans.map((p) => (
              <div key={p.id} className="col-12 col-md-4">
                <div className="card border-orange rounded-4 h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted small">أُنشئت: {prettyDate(p.createdAt)}</span>
                    </div>
                    <div className="fw-semibold mt-2">{p.title}</div>
                    <div className="text-muted small mt-1">عدد المهام: {Number(p.tasksCount || 0)}</div>
                    <div className="d-grid d-sm-flex gap-2 mt-3">
                      <Link to={`/plans/view?planId=${p.id}`} className="btn btn-orange fw-bold px-3">عرض الخطة</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
