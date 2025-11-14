// client/src/components/Pages/AllStudyPlans.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function safeStr(v) {
  try { return typeof v === "string" ? v : JSON.stringify(v, null, 2); }
  catch { return String(v); }
}

async function fetchWithDiag(url, options = {}) {
  const startedAt = new Date().toISOString();
  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    const err = new Error("Network error");
    err.__diag = { type: "NETWORK", startedAt, finishedAt: new Date().toISOString(), request: { url, options }, error: e?.message };
    throw err;
  }
  const ct = res.headers.get("content-type") || "";
  const raw = await res.text();
  let json = null;
  if (ct.includes("application/json")) { try { json = JSON.parse(raw); } catch {} }
  if (!res.ok) {
    const err = new Error(json?.msg || json?.error || `HTTP ${res.status} ${res.statusText}`);
    err.__diag = {
      type: "HTTP",
      status: res.status,
      statusText: res.statusText,
      startedAt, finishedAt: new Date().toISOString(),
      request: { url, options },
      response: { headers: Object.fromEntries(res.headers.entries()), contentType: ct, json, raw }
    };
    throw err;
  }
  return { json: json ?? { raw }, diag: { type: "OK", status: res.status } };
}

export default function AllStudyPlans() {
  const navigate = useNavigate();

  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [q, setQ]               = useState("");
  const [status, setStatus]     = useState("الكل");
  const [sortBy, setSortBy]     = useState("newest");
  const [page, setPage]         = useState(1);
  const pageSize                = 6;

  // تتبّع عمليات الحذف لتعطيل زر X أثناء التنفيذ
  const [deletingIds, setDeletingIds] = useState(new Set());

  const styles = `
    .card-orange { background: linear-gradient(135deg, #ffedd5, #fed7aa); border: 1px solid #ffd8a8; }
    .border-orange { border-color: #ffe7c2 !important; }
    .text-muted-700 { color: #6b7280; }
    .btn-orange { background-color: #fb923c; border-color: #fb923c; color: #fff; }
    .btn-orange:hover { background-color: #f97316; border-color: #f97316; color: #fff; }
    .btn-outline-orange { border-color: #ffe7c2; color: #0b0b0c; background-color: #fff; }
    .btn-outline-orange:hover { background-color: #fff7ed; border-color: #fb923c; color: #fb923c; }

    .badge-orange-soft { background-color: #fff3e0; color: #7a3f00; border: 1px solid #ffe0b2; }
    .card-clean { background:#fff; border:1px solid #ffe7c2; border-radius:16px; box-shadow: 0 6px 18px rgba(234,88,12,0.10); position: relative; }
    .plan-card:hover { box-shadow: 0 10px 28px rgba(234,88,12,0.16); transform: translateY(-2px); transition: .18s ease; }

    .modern-select, .modern-input {
      border: 1px solid #ffe7c2 !important; border-radius: 12px; background: #fff; height: 44px;
      padding: 10px 12px; font-size: 0.95rem; line-height: 1.25rem; box-shadow: 0 1px 0 rgba(0,0,0,.02);
    }
    .modern-select:focus, .modern-input:focus { border-color:#fb923c !important; box-shadow:0 0 0 0.2rem rgba(249,115,22,.18); }

    .status-badge{ display:inline-block; border-radius:999px; padding:.35rem .65rem; font-weight:600; font-size:.85rem; border:1px solid; }
    .status-active{ color:#166534; background:#EAF6EE; border-color:#CDEAD7; }
    .status-done{   color:#374151; background:#F3F4F6; border-color:#E5E7EB; }

    .skel { position: relative; overflow: hidden; background: #f3f4f6; border-radius: 12px; height: 160px; }
    .skel::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent);
      animation: shimmer 1.2s infinite; }
    @keyframes shimmer { 100% { transform: translateX(100%); } }

    /* زر X أعلى البطاقة */
    .btn-delete-x {
      position: absolute; top: 8px; inset-inline-end: 8px;
      width: 32px; height: 32px; border-radius: 8px;
      border: 1px solid #fee2e2; background: #fff; color: #b91c1c;
      font-weight: 700; line-height: 1; display: inline-flex; align-items: center; justify-content: center;
      z-index: 2;
    }
    .btn-delete-x:hover { background:#fef2f2; border-color:#fecaca; color:#991b1b; }
    .btn-delete-x:disabled { opacity:.55; cursor:not-allowed; }

    /* محتوى البطاقة مع إزاحة علويّة لتجنّب تغطية زر X */
    .card-inner {
      padding: 1rem 1rem 1rem 1rem;
    }
    .card-inner.has-delete {
      padding-top: 2.75rem; /* نزّل المحتوى (ومن ضمنه التاريخ) تحت الزر */
    }

    pre.small-pre { max-height: 280px; overflow: auto; background: #fff7ed; border:1px solid #ffd8a8; border-radius:10px; padding:10px; font-size:12px; }
  `;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setErr({ title: "لا يوجد توكن", message: "يرجى تسجيل الدخول أولاً." });
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const { json } = await fetchWithDiag("http://localhost:5000/study-plans/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(Array.isArray(json?.plans) ? json.plans : []);
      } catch (e) {
        console.error("fetch plans failed:", e.__diag || e);
        setErr({ title: "فشل في الجلب", message: e.message, diag: e.__diag || null });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // حذف خطة مع تأكيد
  const handleDeletePlan = async (plan) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErr({ title: "لا يوجد توكن", message: "يرجى تسجيل الدخول أولاً." });
      return;
    }

    const ok = window.confirm(`هل تريد حذف الخطة «${plan.title}»؟\nسيتم حذفها نهائيًا.`);
    if (!ok) return;

    // تعطيل زر الحذف أثناء التنفيذ
    setDeletingIds((prev) => new Set(prev).add(plan.id));

    try {
      await fetchWithDiag(`http://localhost:5000/study-plans/${plan.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      // حذف تفاؤلي من الواجهة
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    } catch (e) {
      console.error("delete plan failed:", e.__diag || e);
      setErr({ title: "فشل في الحذف", message: e.message, diag: e.__diag || null });
    } finally {
      setDeletingIds((prev) => {
        const n = new Set(prev);
        n.delete(plan.id);
        return n;
      });
    }
  };

  const filtered = useMemo(() => {
    let arr = [...plans];
    if (q.trim()) {
      const s = q.trim();
      arr = arr.filter((p) => p.title.includes(s));
    }
    if (status !== "الكل") {
      arr = arr.filter((p) => p.status === status);
    }
    switch (sortBy) {
      case "newest":     arr.sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt))); break;
      case "oldest":     arr.sort((a,b) => String(a.createdAt).localeCompare(String(b.createdAt))); break;
      case "tasks_desc": arr.sort((a,b) => (Number(b.tasksCount||0) - Number(a.tasksCount||0))); break;
      case "tasks_asc":  arr.sort((a,b) => (Number(a.tasksCount||0) - Number(b.tasksCount||0))); break;
      default: break;
    }
    return arr;
  }, [plans, q, status, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe   = Math.min(page, totalPages);
  const pageData   = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const prettyDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
    } catch { return iso; }
  };

  const noResultsBecauseNoPlans = !loading && plans.length === 0;
  const noResultsAfterFiltering = !loading && plans.length > 0 && filtered.length === 0;

  return (
    <div dir="rtl" lang="ar" className="min-vh-100 d-flex flex-column">
      <style>{styles}</style>

      <div className="container py-4 py-md-5">
        <div className="card card-orange shadow-sm border-0 rounded-4 mb-4">
          <div className="card-body p-4 p-md-5">
            <div className="row gy-3 align-items-center">
              <div className="col-12 col-md">
                <h1 className="h3 fw-bold mb-1">الخطط الدراسية</h1>
                <div className="text-muted-700 small">رؤية جميع الخطط مع البحث .</div>
              </div>
              <div className="col-12 col-md-auto d-grid d-sm-flex gap-2">
                <button type="button" className="btn btn-outline-orange fw-bold px-3" onClick={() => navigate("/plans")}>
                  رجوع
                </button>
              </div>
            </div>
          </div>
        </div>

        {err && (
          <div className="alert alert-danger">
            <div className="d-flex align-items-center justify-content-between">
              <strong>{err.title}:</strong>
              <button type="button" className="btn btn-sm btn-light" onClick={() => setShowDetails((v) => !v)}>
                {showDetails ? "إخفاء التفاصيل" : "عرض التفاصيل"}
              </button>
            </div>
            <div className="mt-2">{err.message}</div>
            {showDetails && <pre className="small-pre mt-2">{safeStr(err.diag)}</pre>}
          </div>
        )}

        <div className="card-clean p-3 p-md-4 mb-4">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">بحث بعنوان الخطة</label>
              <input
                className="form-control modern-input"
                placeholder="اكتب جزءًا من العنوان…"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label fw-semibold">الحالة</label>
              <select
                className="form-select modern-select"
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              >
                <option>الكل</option>
                <option>نشطة</option>
                <option>منتهية</option>
              </select>
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label fw-semibold">الترتيب</label>
              <select
                className="form-select modern-select"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              >
                <option value="newest">الأحدث أولاً</option>
                <option value="oldest">الأقدم أولاً</option>
                <option value="tasks_desc">عدد المهام (تنازلي)</option>
                <option value="tasks_asc">عدد المهام (تصاعدي)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="row g-3 g-md-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="col-12 col-md-6 col-lg-4"><div className="skel" /></div>
            ))
          ) : pageData.length === 0 ? (
            <div className="col-12">
              <div className="card-clean p-4 text-center">
                {noResultsBecauseNoPlans ? (
                  <div className="fw-semibold mb-1">لا توجد خطط دراسية</div>
                ) : noResultsAfterFiltering ? (
                  <div className="fw-semibold mb-1">لا توجد نتائج.</div>
                ) : (
                  <div className="fw-semibold mb-1">لا توجد نتائج.</div>
                )}
              </div>
            </div>
          ) : (
            pageData.map((p) => {
              const isDeleting = deletingIds.has(p.id);
              return (
                <div key={p.id} className="col-12 col-md-6 col-lg-4">
                  <div className="card-clean plan-card h-100">
                    {/* زر الحذف X أعلى البطاقة */}
                    <button
                      type="button"
                      className="btn-delete-x"
                      title="حذف الخطة"
                      disabled={isDeleting}
                      onClick={() => handleDeletePlan(p)}
                      aria-label={`حذف الخطة ${p.title}`}
                    >
                      {isDeleting ? "…" : "×"}
                    </button>

                    {/* ✅ نزّلنا المحتوى تحت الزر بإضافة has-delete */}
                    <div className="card-inner has-delete">
                      <div className="d-flex align-items-center justify-content-between">
                        <span className={`status-badge ${p.status === "نشطة" ? "status-active" : "status-done"}`}>{p.status}</span>
                        <span className="text-muted small">أُنشئت: {prettyDate(p.createdAt)}</span>
                      </div>

                      <div className="fw-semibold mt-3">{p.title}</div>
                      <div className="text-muted small mt-1">عدد المهام: {p.tasksCount}</div>

                      <div className="d-grid mt-3">
                        <Link to={`/plans/view?planId=${p.id}`} className="btn btn-orange fw-bold px-3">
                          عرض الخطة
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted small">إجمالي: {filtered.length} خطط دراسية — صفحة {pageSafe} من {totalPages}</div>
          <div className="btn-group">
            <button className="btn btn-outline-orange" disabled={pageSafe <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              السابق
            </button>
            <button className="btn btn-orange" disabled={pageSafe >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              التالي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
