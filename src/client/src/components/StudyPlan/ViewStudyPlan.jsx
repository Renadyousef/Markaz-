import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

/* ===== أيقونات SVG مختصرة ===== */
const IconCalendar = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="#64748B" strokeWidth="1.5"/>
    <path d="M3 9h18" stroke="#64748B" strokeWidth="1.5"/>
    <path d="M8 3v4M16 3v4" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconTrash = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 6H20M9 6V4H15V6M6 6L7 20H17L18 6" stroke="#C11A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ===== دالة جلب مع تشخيص ===== */
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
      request: { url, options },
      error: { message: networkErr?.message },
    };
    throw err;
  }
  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();
  const json = contentType.includes("application/json") ? (raw ? JSON.parse(raw) : null) : null;
  if (!res.ok) {
    const err = new Error(json?.msg || json?.error || `HTTP ${res.status}`);
    err.__diag = { type: "HTTP_ERROR", status: res.status, startedAt, finishedAt: new Date().toISOString(), response: { json, raw } };
    throw err;
  }
  return json ?? {};
}

/* ===== ترتيب: أولوية ثم موعد ===== */
const PRIORITY_RANK = { "عالية": 0, "متوسطة": 1, "منخفضة": 2 };
function compareByPriorityThenDeadline(a, b) {
  const ra = PRIORITY_RANK[a.priority] ?? 99;
  const rb = PRIORITY_RANK[b.priority] ?? 99;
  if (ra !== rb) return ra - rb;
  const da = new Date(a.deadline || "9999-12-31");
  const db = new Date(b.deadline || "9999-12-31");
  return da - db;
}

/* ===== أداة مساعدة: تاريخ اليوم بصيغة YYYY-MM-DD ===== */
function todayStrLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ===== NEW: فحص تجاوز الديدلاين ===== */
function isOverdue(iso) {
  if (!iso) return false;
  const endOfDay = new Date(`${iso}T23:59:59`);
  return Date.now() > endOfDay.getTime();
}

/* ===== الصفحة ===== */
export default function PlanDetailsPage() {
  // يدعم Param أو Query (?planId=xxx)
  const { planId: planIdFromParams } = useParams();
  const [searchParams] = useSearchParams();
  const planIdFromQuery = searchParams.get("planId");
  const planId = planIdFromParams || planIdFromQuery;

  const [planTitle, setPlanTitle] = useState("...");
  const [planStats, setPlanStats] = useState({ tasksCount: 0 });
  const [tasks, setTasks] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [err, setErr] = useState(null);

  const [isEditing, setIsEditing]   = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newTask, setNewTask]       = useState({ title: "", priority: "", deadline: "" });
  const addDateRef = useRef(null);

  // مسودات التعديل
  const [draftTasks, setDraftTasks] = useState([]);

  const openAddPicker = () => { const el = addDateRef.current; if (!el) return; if (el.showPicker) el.showPicker(); else el.click(); };

  const prettyDate = (iso) => { try { return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }); } catch { return ""; } };

  /* === الترتيب الجديد: أولوية ثم موعد === */
  const activeTasks = useMemo(
    () => tasks.filter(t => !t.completed).slice().sort(compareByPriorityThenDeadline),
    [tasks]
  );
  const doneTasks   = useMemo(
    () => tasks.filter(t =>  t.completed).slice().sort(compareByPriorityThenDeadline),
    [tasks]
  );

  const bumpCount = (delta) =>
    setPlanStats(s => ({ ...s, tasksCount: Math.max(0, (s.tasksCount || 0) + delta) }));

  /* ===== الجلب الأولي لعنوان الخطة + مهامها ===== */
  useEffect(() => {
    if (!planId) {
      setErr("لا يوجد planId. افتح الصفحة عبر زر 'عرض الخطة'.");
      setLoadingPlan(false);
      setLoadingTasks(false);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setErr("يرجى تسجيل الدخول أولاً.");
      setLoadingPlan(false);
      setLoadingTasks(false);
      return;
    }

    let aborted = false;

    // 1) جلب بيانات الخطة (العنوان + العداد)
    (async () => {
      try {
        setLoadingPlan(true);
        const data = await fetchWithDiagnostics(`http://localhost:5000/study-plans/${planId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (aborted) return;
        setPlanTitle(data?.title || "الخطة");
        setPlanStats({ tasksCount: data?.tasksCount ?? 0 });
      } catch (e) {
        if (aborted) return;
        setErr(e?.message || "فشل جلب بيانات الخطة");
      } finally {
        if (!aborted) setLoadingPlan(false);
      }
    })();

    // 2) جلب مهام الخطة
    (async () => {
      try {
        setLoadingTasks(true);
        const data = await fetchWithDiagnostics(`http://localhost:5000/study-plans/${planId}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (aborted) return;
        const list = Array.isArray(data?.tasks) ? data.tasks : [];
        setTasks(list.map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority || "متوسطة",
          deadline: t.deadline || "",
          completed: !!t.completed
        })));
      } catch (e) {
        if (aborted) return;
        setErr(e?.message || "فشل جلب مهام الخطة");
      } finally {
        if (!aborted) setLoadingTasks(false);
      }
    })();

    return () => { aborted = true; };
  }, [planId]);

  /* ===== CRUD حقيقي على الباك-إند ===== */

  // تشيك/إلغاء تشيك
  const toggleComplete  = async (id) => {
    const current = tasks.find(t => t.id === id);
    const newVal = !current?.completed;
    // Optimistic
    setTasks(ts => ts.map(t => t.id === id ? { ...t, completed: newVal } : t));
    try {
      const token = localStorage.getItem("token");
      await fetchWithDiagnostics(`http://localhost:5000/study-plans/${planId}/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed: newVal })
      });
    } catch (e) {
      // رجوع عند الفشل
      setTasks(ts => ts.map(t => t.id === id ? { ...t, completed: current?.completed } : t));
    }
  };

  // تعديل المسودات محليًا
  const editDraftField = (id, patch) => {
    setDraftTasks(ds => ds.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  // حفظ المسودات ⟶ تطبيق جميع الفروقات وإرسالها للخادم
  const saveEdits = async () => {
    // منع حفظ تاريخ قديم أثناء التعديل
    const today = todayStrLocal();
    for (const d of draftTasks) {
      if (d.deadline && d.deadline < today) {
        window.alert("غيّر التاريخ، التاريخ قديم.");
        return;
      }
    }

    const diffs = [];
    for (const d of draftTasks) {
      const o = tasks.find(t => t.id === d.id);
      if (!o) continue;
      const patch = {};
      if (d.title !== o.title) patch.title = d.title;
      if (d.priority !== o.priority) patch.priority = d.priority;
      if (d.deadline !== o.deadline) patch.deadline = d.deadline;
      if (Object.keys(patch).length) diffs.push({ id: d.id, patch });
    }

    if (diffs.length) {
      setTasks(ts => ts.map(t => {
        const found = diffs.find(x => x.id === t.id);
        return found ? { ...t, ...found.patch } : t;
      }));
    }

    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        diffs.map(d =>
          fetchWithDiagnostics(`http://localhost:5000/study-plans/${planId}/tasks/${d.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(d.patch),
          })
        )
      );
    } catch (e) {
      try {
        const token = localStorage.getItem("token");
        const data = await fetchWithDiagnostics(`http://localhost:5000/study-plans/${planId}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = Array.isArray(data?.tasks) ? data.tasks : [];
        setTasks(list.map(t => ({
          id: t.id, title: t.title, priority: t.priority || "متوسطة",
          deadline: t.deadline || "", completed: !!t.completed
        })));
      } catch {}
    } finally {
      setIsEditing(false);
      setDraftTasks([]);
    }
  };

  // حذف — مع تأكيد قبل التنفيذ
  const removeTask = async (id) => {
    const ok = window.confirm("هل أنت متأكد من حذف هذه المهمة؟");
    if (!ok) return;

    const prev = tasks;
    // Optimistic
    setTasks(ts => ts.filter(t => t.id !== id));
    bumpCount(-1);
    try {
      const token = localStorage.getItem("token");
      await fetchWithDiagnostics(`http://localhost:5000/study-plans/${planId}/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      // رجّع لو فشل
      setTasks(prev);
      bumpCount(+1);
    }
  };

  // إضافة — يتأكد من جميع الحقول + يمنع التاريخ القديم
  const addTask = async () => {
    if (!newTask.title.trim() || !newTask.priority || !newTask.deadline) {
      window.alert("أكمل جميع الحقول: العنوان، الأولوية، والتاريخ.");
      return;
    }
    const today = todayStrLocal();
    if (newTask.deadline < today) {
      window.alert("غيّر التاريخ، التاريخ قديم.");
      return;
    }

    // Optimistic add (id مؤقت)
    const optimisticId = Math.max(0, ...tasks.map(t => Number(t.id) || 0)) + 1;
    const optimistic = {
      id: optimisticId,
      title: newTask.title.trim(),
      priority: newTask.priority,
      deadline: newTask.deadline,
      completed: false
    };
    setTasks(ts => [...ts, optimistic]);
    bumpCount(+1);
    setNewTask({ title: "", priority: "", deadline: "" });
    setShowAddRow(false);

    try {
      const token = localStorage.getItem("token");
      const created = await fetchWithDiagnostics(`http://localhost:5000/study-plans/${planId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: optimistic.title,
          priority: optimistic.priority,
          deadline: optimistic.deadline,
          completed: false
        })
      });

      if (created?.id) {
        setTasks(ts => ts.map(t => t.id === optimisticId ? { ...t, id: created.id } : t));
      }
    } catch (e) {
      setTasks(ts => ts.filter(t => t.id !== optimisticId));
      bumpCount(-1);
    }
  };

  // بدء/إلغاء التعديل
  const startEditing = () => {
    if (activeTasks.length === 0) {
      window.alert("لا توجد مهام. أضِف مهمة أولًا لِيمكن التعديل.");
      return;
    }
    setDraftTasks(tasks.map(t => ({ ...t })));
    setIsEditing(true);
  };
  const cancelEditing = () => {
    setDraftTasks([]);
    setIsEditing(false);
  };

  return (
    <div dir="rtl" lang="ar" className="min-vh-100 d-flex flex-column">
      <style>{`
        :root{
          --brand:#fb923c; --brand-hover:#f97316;
          --slate-900:#0b0b0c; --border-orange:#ffe7c2;
        }
        .btn-orange{ background-color: var(--brand); border-color: var(--brand); color:#fff; }
        .btn-orange:hover{ background-color: var(--brand-hover); border-color: var(--brand-hover); color:#fff; }
        .btn-outline-orange{ border:1px solid var(--border-orange); color: var(--slate-900); background: #fff; }
        .btn-outline-orange:hover{ background-color:#fff7ed; border-color: var(--brand); color: var(--brand); }
        .card-orange { background: linear-gradient(135deg, #ffedd5, #fed7aa); border: 1px solid #ffd8a8; }
        .text-muted-700 { color: #6b7280; }
        .task-card{ border:1px solid var(--border-orange); border-radius:14px; background:#fff; }
        .task-row{ display:flex; align-items:center; gap:.75rem; padding:.85rem 1rem; border-bottom:1px solid var(--border-orange); }
        .task-row:last-child{ border-bottom:none; }
        .task-title{ font-weight:600; }
        .field-inline{ min-width:180px; }
        .priority-badge{ display:inline-block; border-radius:999px; padding:.3rem .65rem; font-weight:600; font-size:.85rem; background:#fff; border:1px solid transparent; }
        .p-high{ color:#B42318; border-color:#FAD1D0; background:#FFF1F0; }
        .p-mid { color:#7C4A03; border-color:#FFE4B5; background:#FFF7E6; }
        .p-low { color:#075985; border-color:#CFEFFF; background:#F0FBFF; }
        .modern-select{ appearance:none; background:#fff; border:1px solid var(--border-orange); border-radius:10px; height:40px; padding:8px 12px; font-size:.95rem; cursor:pointer; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23fb923c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:left 12px center; }
        .modern-select:focus{ border-color:var(--brand); box-shadow:0 0 0 .2rem rgba(249,115,22,.18); }
        .date-display{ border:1px solid var(--border-orange); border-radius:10px; background:#fff; height:40px; padding:8px 12px; font-size:.95rem; text-align:start; }
        .date-display:focus{ outline:none; border-color: var(--brand); box-shadow:0 0 0 .2rem rgba(249,115,22,.18); }
        .real-date-input{ position:absolute; inset:0; opacity:0; pointer-events:none; }
        .form-check-input{ accent-color: var(--brand); }
      `}</style>

      {/* هيدر */}
      <div className="container py-4 py-md-5">
        <div className="card card-orange shadow-sm border-0 rounded-4 mb-4">
          <div className="card-body p-4 p-md-5">
            <div className="row gy-3 align-items-center">
              <div className="col-12 col-md">
                <h1 className="h3 fw-bold mb-1">{loadingPlan ? "جارٍ التحميل…" : planTitle}</h1>
                <div className="text-muted-700 small">
                  مجموع المهام: {planStats.tasksCount}
                </div>
              </div>
              <div className="col-12 col-md-auto d-grid">

                <Link to="/plans/all" className="btn btn-outline-orange fw-bold px-3">
                  رجوع
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="container pb-5">
        {/* أدوات أعلى القائمة */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h2 className="h6 fw-bold mb-0">المهام الحالية</h2>
          <div className="d-flex gap-2">
            {!isEditing ? (
              <button type="button" className="btn btn-orange fw-bold px-3" onClick={startEditing}>
                تعديل
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-outline-orange fw-bold px-3" onClick={cancelEditing}>
                  إلغاء التعديل
                </button>
                <button type="button" className="btn btn-orange fw-bold px-3" onClick={saveEdits}>
                  حفظ التغييرات
                </button>
              </>
            )}
            <button type="button" className="btn btn-orange fw-bold px-3" onClick={() => setShowAddRow(s => !s)}>
              {showAddRow ? "إلغاء الإضافة" : "إضافة مهمة"}
            </button>
          </div>
        </div>

        {/* صف الإضافة */}
        {showAddRow && (
          <div className="mb-3 p-3" style={{ background:"#fff", border:"1px dashed var(--border-orange)", borderRadius:"14px" }}>
            <div className="row g-3 align-items-end">
              <div className="col-12 col-lg-6">
                <label className="form-label fw-semibold">عنوان المهمة</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTask.title}
                  onChange={(e) => setNewTask(v => ({ ...v, title: e.target.value }))}
                  placeholder="اكتب عنوان المهمة"
                />
              </div>
              <div className="col-6 col-lg-2">
                <label className="form-label fw-semibold">الأولوية</label>
                <select
                  className="form-select modern-select"
                  value={newTask.priority}
                  onChange={(e) => setNewTask(v => ({ ...v, priority: e.target.value }))}
                >
                  <option value="">اختر مستوى الأولوية</option>
                  <option value="عالية">عالية</option>
                  <option value="متوسطة">متوسطة</option>
                  <option value="منخفضة">منخفضة</option>
                </select>
              </div>
              <div className="col-6 col-lg-3">
                <label className="form-label fw-semibold">الموعد النهائي</label>
                <div className="position-relative">
                  <button type="button" className="date-display w-100 text-start" onClick={() => { const el = addDateRef.current; if (el?.showPicker) el.showPicker(); else el?.click(); }}>
                    {newTask.deadline ? prettyDate(newTask.deadline) : "اضغط لإضافة تاريخ"}
                  </button>
                  <input
                    ref={addDateRef}
                    type="date"
                    className="real-date-input"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask(v => ({ ...v, deadline: e.target.value }))}
                    aria-label="اختر تاريخ"
                  />
                </div>
              </div>
              <div className="col-12 col-lg-1 d-grid">
                <button className="btn btn-orange fw-bold" onClick={addTask}>حفظ</button>
              </div>
            </div>
          </div>
        )}

        {/* قائمة المهام الحالية */}
        <div className="card task-card shadow-sm mb-4">
          <div className="card-body p-0">
            {loadingTasks ? (
              <div className="p-3 text-muted">جارٍ تحميل المهام…</div>
            ) : (activeTasks.length === 0) ? (
              <div className="p-3 text-muted text-center">لا توجد مهام حالية.</div>
            ) : (isEditing ? (
              /* ===== وضع التعديل: هنا يظهر زر الحذف ===== */
              draftTasks
                .filter(t => !t.completed)
                .slice()
                .sort(compareByPriorityThenDeadline)
                .map((t) => (
                  <div key={t.id} className="task-row">
                    <input
                      type="checkbox"
                      className="form-check-input ms-1"
                      checked={false}
                      disabled
                      aria-label="إنهاء المهمة"
                    />
                    <div className="flex-grow-1">
                      <input
                        type="text"
                        className="form-control"
                        value={t.title}
                        onChange={(e) => editDraftField(t.id, { title: e.target.value })}
                      />
                    </div>
                    <div className="field-inline">
                      <select
                        className="form-select modern-select"
                        value={t.priority}
                        onChange={(e) => editDraftField(t.id, { priority: e.target.value })}
                      >
                        <option value="عالية">عالية</option>
                        <option value="متوسطة">متوسطة</option>
                        <option value="منخفضة">منخفضة</option>
                      </select>
                    </div>
                    <div className="field-inline d-flex align-items-center gap-2">
                      <IconCalendar />
                      <input
                        type="date"
                        className="form-control"
                        value={t.deadline}
                        onChange={(e) => editDraftField(t.id, { deadline: e.target.value })}
                      />
                    </div>

                    {/* زر الحذف داخل وضع التعديل فقط */}
                    <button
                      type="button"
                      className="btn btn-link text-danger p-0 ms-2"
                      onClick={() => removeTask(t.id)}
                      title="حذف المهمة"
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))
            ) : (
              /* ===== الوضع العادي: بدون زر الحذف ===== */
              activeTasks.map((t) => (
                <div key={t.id} className="task-row">
                  <input
                    type="checkbox"
                    className="form-check-input ms-1"
                    checked={false}
                    onChange={() => toggleComplete(t.id)}
                    aria-label="إنهاء المهمة"
                  />
                  <div className="flex-grow-1">
                    <div className="task-title">{t.title}</div>
                  </div>
                  <div className="field-inline">
                    <span className={`priority-badge ${t.priority === "عالية" ? "p-high" : t.priority === "متوسطة" ? "p-mid" : "p-low"}`}>
                      {t.priority}
                    </span>
                  </div>
                  <div className="field-inline d-flex align-items-center gap-2">
                    <IconCalendar />
                    <div className="d-flex flex-column">
                      <span className="small">{prettyDate(t.deadline)}</span>
                      {t.deadline && isOverdue(t.deadline) && (
                        <span className="small mt-1" style={{ color:"#C11A1A", fontWeight:600 }}>
                          انتهى الموعد
                        </span>
                      )}
                    </div>
                  </div>
                  {/* ملاحظة: حُذف زر الحذف من الوضع العادي بناءً على طلبك */}
                </div>
              ))
            ))}
          </div>
        </div>

        {/* المنجزة */}
        <div className="d-flex align-items-center gap-2 mb-2">
          <h2 className="h6 fw-bold mb-0">المهام المنجزة</h2>
        </div>
        <div className="card task-card shadow-sm">
          <div className="card-body p-0">
            {loadingTasks ? (
              <div className="p-3 text-muted">جارٍ التحميل…</div>
            ) : doneTasks.length === 0 ? (
              <div className="p-3 text-muted text-center">لم تُنهِ أي مهمة بعد.</div>
            ) : doneTasks.map((t) => (
              <div key={t.id} className="task-row" style={{ opacity:.75 }}>
                <input
                  type="checkbox"
                  className="form-check-input ms-1"
                  checked={true}
                  onChange={() => toggleComplete(t.id)}
                  aria-label="إرجاع المهمة"
                />
                <div className="flex-grow-1">
                  <div className="task-title text-decoration-line-through">{t.title}</div>
                </div>
                <div className="field-inline">
                  <span className={`priority-badge ${t.priority === "عالية" ? "p-high" : t.priority === "متوسطة" ? "p-mid" : "p-low"}`}>
                    {t.priority}
                  </span>
                </div>
                <div className="field-inline d-flex align-items-center gap-2">
                  <IconCalendar />
                  <div className="d-flex flex-column">
                    <span className="small">{prettyDate(t.deadline)}</span>
                    {t.deadline && isOverdue(t.deadline) && (
                      <span className="small mt-1" style={{ color:"#C11A1A", fontWeight:600 }}>
                        انتهى الموعد
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {err && <div className="alert alert-danger mt-3">{err}</div>}
      </div>
    </div>
  );
}
