// client/src/components/Pages/AllStudyPlans.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const PRIMARY_COLOR = "#ff8c42";
const PRIMARY_LIGHT = "#ffdbbf";

function safeStr(v) {
  try {
    return typeof v === "string" ? v : JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

async function fetchWithDiag(url, options = {}) {
  const startedAt = new Date().toISOString();
  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    const err = new Error("Network error");
    err.__diag = {
      type: "NETWORK",
      startedAt,
      finishedAt: new Date().toISOString(),
      request: { url, options },
      error: e?.message,
    };
    throw err;
  }
  const ct = res.headers.get("content-type") || "";
  const raw = await res.text();
  let json = null;
  if (ct.includes("application/json")) {
    try {
      json = JSON.parse(raw);
    } catch {}
  }
  if (!res.ok) {
    const err = new Error(
      json?.msg || json?.error || `HTTP ${res.status} ${res.statusText}`
    );
    err.__diag = {
      type: "HTTP",
      status: res.status,
      statusText: res.statusText,
      startedAt,
      finishedAt: new Date().toISOString(),
      request: { url, options },
      response: {
        headers: Object.fromEntries(res.headers.entries()),
        contentType: ct,
        json,
        raw,
      },
    };
    throw err;
  }
  return { json: json ?? { raw }, diag: { type: "OK", status: res.status } };
}

/* ===== Progress Ring ===== */
const ProgressRing = ({
  percentage = 0,
  size = 60,
  strokeWidth = 6,
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

export default function AllStudyPlans() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("الكل");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // تتبّع عمليات الحذف لتعطيل زر X أثناء التنفيذ
  const [deletingIds, setDeletingIds] = useState(new Set());

  // مودال الحذف
  const [modal, setModal] = useState({
    open: false,
    title: "",
    body: "",
    primaryLabel: "",
    secondaryLabel: "",
  });
  const [planToDelete, setPlanToDelete] = useState(null);

  const styles = `
    .plansRoot,
    .plansRoot * {
      font-family: "Cairo", "Helvetica Neue", sans-serif;
    }

    .progress-wrap {
      display: flex;
      flex-direction: column;
      gap: 30px;
      padding: 30px 16px 50px;
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

    .btn-orange {
      background-color: ${PRIMARY_COLOR};
      border-color: ${PRIMARY_COLOR};
      color: #fff;
      border-radius: 999px;
      font-weight: 700;
    }
    .btn-orange:hover {
      background-color: #e57e3f;
      border-color: #e57e3f;
      color: #fff;
      transform: translateY(-1px);
      box-shadow: 0 10px 20px rgba(255,145,77,0.25);
    }

    .btn-outline-orange {
      border-radius: 999px;
      border-color: ${PRIMARY_LIGHT};
      color: #0b0b0c;
      background-color: #fff;
      font-weight: 600;
    }
    .btn-outline-orange:hover {
      background-color: #fff7ed;
      border-color: ${PRIMARY_COLOR};
      color: ${PRIMARY_COLOR};
    }

    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 5px;
      margin-bottom: 10px;
    }
    .section-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1f2937;
      border-right: 5px solid ${PRIMARY_COLOR};
      padding-right: 10px;
      line-height: 1.3;
    }

    /* كروت الفلتر */
    .filters-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 10px 20px rgba(15,23,42,0.04);
      padding: 16px 18px;
    }

    .modern-select,
    .modern-input {
      border: 1px solid #e5e7eb !important;
      border-radius: 12px;
      background: #fff;
      height: 44px;
      padding: 10px 12px;
      font-size: 0.95rem;
      line-height: 1.25rem;
      box-shadow: 0 1px 0 rgba(0,0,0,.02);
    }
    .modern-select:focus,
    .modern-input:focus {
      border-color: ${PRIMARY_COLOR} !important;
      box-shadow: 0 0 0 0.18rem rgba(255,145,77,0.18);
    }

    /* كروت الخطط – نفس إحساس plan-card في StudyPlansPage */
    .plan-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
      position: relative;
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

    .card-inner {
      padding: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .card-inner.has-delete {
      padding-top: 1.6rem;
    }

    .plan-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 15px;
      margin-bottom: 10px;
    }

    .plan-title,
    .plan-card-title {
      font-weight: 800;
      font-size: 1.25rem;
      color: #1f2937;
      line-height: 1.4;
      flex-grow: 1;
    }

    .plan-meta,
    .plan-card-meta {
      font-size: 0.95rem;
      color: #6b7280;
      margin-top: 5px;
    }

    .plan-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }

    .plan-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 0.5rem;
    }

    .status-badge {
      display:inline-block;
      border-radius:999px;
      padding:.32rem .7rem;
      font-weight:600;
      font-size:.8rem;
      border:1px solid;
    }
    .status-active{
      color:#166534;
      background:#eaf6ee;
      border-color:#cdead7;
    }
    .status-done{
      color:#374151;
      background:#f3f4f6;
      border-color:#e5e7eb;
    }

    .skel {
      position: relative;
      overflow: hidden;
      background: #e5e7eb;
      border-radius: 12px;
      height: 180px;
    }
    .skel::after {
      content: "";
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
      animation: shimmer 1.15s infinite;
    }
    @keyframes shimmer {
      100% { transform: translateX(100%); }
    }

    /* زر X أعلى البطاقة */
    .btn-delete-x {
      position: absolute;
      top: 8px;
      inset-inline-end: 8px;
      width: 30px;
      height: 30px;
      border-radius: 10px;
      border: 1px solid #fee2e2;
      background: #ffffff;
      color: #b91c1c;
      font-weight: 700;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      font-size: 18px;
    }
    .btn-delete-x:hover {
      background:#fef2f2;
      border-color:#fecaca;
      color:#991b1b;
    }
    .btn-delete-x:disabled {
      opacity:.55;
      cursor:not-allowed;
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
      color: #7a3f00;
      font-weight: 600;
    }

    .modern-alert-error {
      padding: 15px;
      border-radius: 10px;
      background-color: #fef2f2;
      color: #ef4444;
      border: 1px solid #fecaca;
      margin: 10px 0 5px;
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
      margin-top: 8px;
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

    .pagination-bar {
      margin-top: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .pagination-info {
      font-size: 0.9rem;
      color: #6b7280;
      font-weight: 500;
    }

    /* ===== مودال تأكيد الحذف ===== */
    .custom-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
    }

    .custom-modal-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 24px 28px 20px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 24px 60px rgba(15,23,42,0.22);
      text-align: center;
    }

    .modal-title-text {
      font-size: 1.15rem;
      font-weight: 800;
      margin-bottom: 8px;
      color: #111827;
    }

    .modal-body-text {
      font-size: 0.95rem;
      color: #6b7280;
      margin-bottom: 18px;
    }

    .modal-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    .modal-btn-primary {
      border: none;
      border-radius: 999px;
      padding: 8px 22px;
      font-size: 0.95rem;
      font-weight: 700;
      background-color: ${PRIMARY_COLOR};
      color: #fff;
    }

    .modal-btn-primary:hover {
      background-color: #e57e3f;
    }

    .modal-btn-outline {
      border-radius: 999px;
      padding: 8px 22px;
      font-size: 0.95rem;
      font-weight: 600;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      color: #111827;
    }

    .modal-btn-outline:hover {
      border-color: ${PRIMARY_COLOR};
      color: ${PRIMARY_COLOR};
    }
  `;

  // دوال المودال
  const openDeleteModal = (plan) => {
    setPlanToDelete(plan);
    setModal({
      open: true,
      title: "حذف الخطة الدراسية؟",
      body: `هل تريد حذف الخطة «${plan.title}»؟ سيتم حذفها نهائيًا.`,
      primaryLabel: "نعم، حذف الخطة",
      secondaryLabel: "إلغاء",
    });
  };

  const closeModal = () => {
    setModal((m) => ({ ...m, open: false }));
    setPlanToDelete(null);
  };

  const handleModalPrimary = () => {
    if (planToDelete) {
      confirmDeletePlan(planToDelete);
    }
  };

  const handleModalSecondary = () => {
    closeModal();
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setErr({
        title: "لا يوجد توكن",
        message: "يرجى تسجيل الدخول أولاً.",
      });
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const { json } = await fetchWithDiag(
          "http://localhost:5000/study-plans/all",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPlans(Array.isArray(json?.plans) ? json.plans : []);
      } catch (e) {
        console.error("fetch plans failed:", e.__diag || e);
        setErr({
          title: "فشل في الجلب",
          message: e.message,
          diag: e.__diag || null,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // الحذف الفعلي (نفس منطقك القديم لكن بدون window.confirm)
  const confirmDeletePlan = async (plan) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErr({
        title: "لا يوجد توكن",
        message: "يرجى تسجيل الدخول أولاً.",
      });
      closeModal();
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(plan.id));

    try {
      await fetchWithDiag(`http://localhost:5000/study-plans/${plan.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    } catch (e) {
      console.error("delete plan failed:", e.__diag || e);
      setErr({
        title: "فشل في الحذف",
        message: e.message,
        diag: e.__diag || null,
      });
    } finally {
      setDeletingIds((prev) => {
        const n = new Set(prev);
        n.delete(plan.id);
        return n;
      });
      closeModal();
    }
  };

  // هذه الدالة الآن فقط تفتح المودال بدل window.confirm
  const handleDeletePlan = (plan) => {
    openDeleteModal(plan);
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
      case "newest":
        arr.sort((a, b) =>
          String(b.createdAt).localeCompare(String(a.createdAt))
        );
        break;
      case "oldest":
        arr.sort((a, b) =>
          String(a.createdAt).localeCompare(String(b.createdAt))
        );
        break;
      case "tasks_desc":
        arr.sort(
          (a, b) => Number(b.tasksCount || 0) - Number(a.tasksCount || 0)
        );
        break;
      case "tasks_asc":
        arr.sort(
          (a, b) => Number(a.tasksCount || 0) - Number(b.tasksCount || 0)
        );
        break;
      default:
        break;
    }
    return arr;
  }, [plans, q, status, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageData = filtered.slice(
    (pageSafe - 1) * pageSize,
    pageSafe * pageSize
  );

  const prettyDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const day = d.getDate().toLocaleString("ar-EG");
      const year = d.getFullYear().toLocaleString("ar-EG");
      const monthIndex = d.getMonth(); // 0-11
      const months = [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
      ];
      const month = months[monthIndex] || "";
      return `${day} ${month} ${year}`;
    } catch {
      return iso;
    }
  };

  const noResultsBecauseNoPlans = !loading && plans.length === 0;
  const noResultsAfterFiltering =
    !loading && plans.length > 0 && filtered.length === 0;

  return (
    <div dir="rtl" lang="ar" className="plansRoot">
      <style>{styles}</style>

      {/* مودال تأكيد الحذف */}
      {modal.open && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-card" dir="rtl">
            {modal.title && (
              <h5 className="modal-title-text">{modal.title}</h5>
            )}
            {modal.body && (
              <p className="modal-body-text">{modal.body}</p>
            )}
            <div className="modal-actions">
              {modal.secondaryLabel && (
                <button
                  type="button"
                  className="modal-btn-outline"
                  onClick={handleModalSecondary}
                >
                  {modal.secondaryLabel}
                </button>
              )}
              <button
                type="button"
                className="modal-btn-primary"
                onClick={handleModalPrimary}
              >
                {modal.primaryLabel || "حسناً"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="progress-wrap">
        {/* الهيدر */}
        <div className="fc-top">
          <div className="title-block">
            <h1 className="title">جميع الخطط الدراسية</h1>
            <div className="page-subtitle">
              يمكن استعراض جميع الخطط الدراسية مع إمكانية البحث والترتيب حسب الحالة وعدد المهام.
            </div>
          </div>
          <button
            type="button"
            className="modern-action-btn"
            onClick={() => navigate("/plans")}
          >
            رجوع
          </button>
        </div>

        {/* الأخطاء */}
        {err && (
          <div className="modern-alert-error">
            <div className="d-flex align-items-center justify-content-between gap-2">
              <div>
                <strong>{err.title}:</strong> {err.message}
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
              <pre className="small-pre">{safeStr(err.diag)}</pre>
            )}
          </div>
        )}

        {/* الفلترة والبحث */}
        <div className="filters-card">
          <div className="section-title-wrap">
            <h2 className="section-title">البحث  عن الخطط الدراسية </h2>
          </div>
          <div className="row g-3 align-items-end mt-1">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">
                بحث بعنوان الخطة
              </label>
              <input
                className="form-control modern-input"
                placeholder="اكتب جزءًا من العنوان…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label fw-semibold">الحالة</label>
              <select
                className="form-select modern-select"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option>الكل</option>
                <option>غير مكتملة</option>
                <option>مكتملة</option>
              </select>
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label fw-semibold">الترتيب</label>
              <select
                className="form-select modern-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
              >
                <option value="newest">الأحدث أولاً</option>
                <option value="oldest">الأقدم أولاً</option>
                <option value="tasks_desc">عدد المهام (تنازلي)</option>
                <option value="tasks_asc">عدد المهام (تصاعدي)</option>
              </select>
            </div>
          </div>
        </div>

        {/* قائمة الخطط */}
        <div className="section-title-wrap" style={{ marginTop: "20px" }}>
          <h2 className="section-title">كل الخطط المحفوظة</h2>
        </div>

        <div className="row g-3 g-md-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="col-12 col-md-6 col-lg-4">
                <div className="skel" />
              </div>
            ))
          ) : pageData.length === 0 ? (
            <div className="col-12">
              <div className="empty-state-card">
                {noResultsBecauseNoPlans ? (
                  <>
                    <div>لا توجد خطط دراسية حتى الآن.</div>
                    <div style={{ fontSize: "0.9rem", marginTop: 6 }}>
                      يمكن الانتقال إلى صفحة الخطط لإنشاء أول خطة دراسية.
                    </div>
                  </>
                ) : noResultsAfterFiltering ? (
                  <>
                    <div>لا توجد نتائج مطابقة لبحثك.</div>
                    <div style={{ fontSize: "0.9rem", marginTop: 6 }}>
                      جرّب تعديل كلمات البحث أو الفلاتر.
                    </div>
                  </>
                ) : (
                  <div>لا توجد نتائج.</div>
                )}
              </div>
            </div>
          ) : (
            pageData.map((p) => {
              const isDeleting = deletingIds.has(p.id);

              // حساب نسبة الإنجاز داخلياً فقط للـ Ring
              let percentage = 0;
              const total = Number(p.tasksCount || 0);
              const completedRaw = Number(
                p.completedTasks ?? p.completed_count ?? 0
              );

              if (typeof p.completionPercentage === "number") {
                percentage = p.completionPercentage;
              } else if (total > 0 && completedRaw >= 0) {
                percentage = Math.min(
                  100,
                  Math.max(0, (completedRaw / total) * 100)
                );
              }

              return (
                <div key={p.id} className="col-12 col-md-6 col-lg-4">
                  <div className="plan-card">
                    {/* زر الحذف X */}
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

                    <div className="card-inner has-delete">
                      <div className="plan-header-top">
                        <span
                          className={
                            "status-badge " +
                            (p.status === "غير مكتملة"
                              ? "status-active"
                              : "status-done")
                          }
                        >
                          {p.status}
                        </span>
                        <span className="plan-card-meta">
                          أُنشئت في: {prettyDate(p.createdAt)}
                        </span>
                      </div>

                      <div className="plan-header-row">
                        <div className="flex-grow-1">
                          <div className="plan-card-title">{p.title}</div>
                          <div className="plan-card-meta">
                            عدد المهام في الخطة:{" "}
                            <strong>{p.tasksCount ?? 0}</strong>
                          </div>
                        </div>
                        <ProgressRing
                          percentage={percentage}
                          size={70}
                          strokeWidth={8}
                          color={PRIMARY_COLOR}
                        />
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
                </div>
              );
            })
          )}
        </div>

        {/* الصفحات */}
        <div className="pagination-bar">
          <div className="pagination-info">
            إجمالي: {filtered.length} خطة دراسية — صفحة {pageSafe} من{" "}
            {totalPages}
          </div>

          {totalPages > 1 && (
            <div className="btn-group">
              {pageSafe > 1 && (
                <button
                  className="btn btn-outline-orange"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  السابق
                </button>
              )}

              {pageSafe < totalPages && (
                <button
                  className="btn btn-orange"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  التالي
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
