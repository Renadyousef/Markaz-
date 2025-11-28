// client/src/components/Pages/PlanDetailsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

/* ===== ألوان موحدة ===== */
const PRIMARY_COLOR = "#ff8c42";
const PRIMARY_LIGHT = "#ffdbbf";

/* ===== أيقونات SVG مختصرة ===== */
const IconCalendar = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
      stroke="#64748B"
      strokeWidth="1.5"
    />
    <path d="M3 9h18" stroke="#64748B" strokeWidth="1.5" />
    <path
      d="M8 3v4M16 3v4"
      stroke="#64748B"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const IconTrash = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M4 6H20M9 6V4H15V6M6 6L7 20H17L18 6"
      stroke="#C11A1A"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
  const json = contentType.includes("application/json")
    ? raw
      ? JSON.parse(raw)
      : null
    : null;
  if (!res.ok) {
    const err = new Error(json?.msg || json?.error || `HTTP ${res.status}`);
    err.__diag = {
      type: "HTTP_ERROR",
      status: res.status,
      startedAt,
      finishedAt: new Date().toISOString(),
      response: { json, raw },
    };
    throw err;
  }
  return json ?? {};
}

/* ===== ترتيب: أولوية ثم موعد ===== */
const PRIORITY_RANK = { عالية: 0, متوسطة: 1, منخفضة: 2 };
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

/* ===== فحص تجاوز الديدلاين ===== */
function isOverdue(iso) {
  if (!iso) return false;
  const endOfDay = new Date(`${iso}T23:59:59`);
  return Date.now() > endOfDay.getTime();
}

const DONE_PAGE_SIZE = 10;

/* ===== CSS موحد + تنسيق الصفحة ===== */
const styles = `
  :root {
    --brand: ${PRIMARY_COLOR};
    --brand-light: ${PRIMARY_LIGHT};
    --slate-900: #0b0b0c;
    --border-orange: #ffe7c2;
  }

  .planDetailsRoot,
  .planDetailsRoot * {
    font-family: "Cairo", "Helvetica Neue", sans-serif;
  }

  .progress-wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 30px 20px 60px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* ===== هيدر الصفحة ===== */
  .fc-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f3f4f6;
  }

  @media (max-width: 768px) {
    .fc-top {
      flex-direction: column;
      align-items: flex-start;
    }
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
    font-size: 0.95rem;
    font-weight: 500;
    color: #6b7280;
  }

  .modern-action-btn {
    padding: 8px 20px;
    border-radius: 10px;
    background: #ffffff;
    border: 1px solid ${PRIMARY_LIGHT};
    font-size: 0.95rem;
    font-weight: 600;
    color: ${PRIMARY_COLOR};
    text-decoration: none;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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

  /* ===== أزرار التعديل + العنوان في صف واحد ===== */
  .tasks-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 18px;
    margin-bottom: 6px;
    gap: 12px;
  }

  @media (max-width: 768px) {
    .tasks-header-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
  }

  .tasks-section-title {
    font-size: 1.2rem;
    font-weight: 800;
    color: #1f2937;
    border-right: 5px solid ${PRIMARY_COLOR};
    padding-right: 10px;
    margin: 0;
    line-height: 1.3;
  }

  .section-title-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 22px;
    margin-bottom: 6px;
  }

  .section-block {
    margin-top: .2rem;
  }

  /* ===== أزرار الأدوات ===== */
  .btn-orange {
    background-color: ${PRIMARY_COLOR};
    border-color: ${PRIMARY_COLOR};
    color: #fff;
    border-radius: 999px;
    padding-inline: 1.25rem;
    padding-block: .55rem;
    font-size: .95rem;
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
    border: 1px solid var(--border-orange);
    color: var(--slate-900);
    background-color: #fff;
    padding-inline: 1.2rem;
    padding-block: .55rem;
    font-size: .95rem;
    font-weight: 600;
  }
  .btn-outline-orange:hover {
    background-color: #fff7ed;
    border-color: ${PRIMARY_COLOR};
    color: ${PRIMARY_COLOR};
  }

  .btn-outline-orange.btn-sm,
  .btn-orange.btn-sm {
    padding-block: .3rem;
    padding-inline: .9rem;
    font-size: .8rem;
  }

  .pager-btn {
    border: none;
    background: none;
    color: ${PRIMARY_COLOR};
    font-weight: 600;
    font-size: 0.88rem;
    padding: 4px 10px;
  }
  .pager-btn:hover {
    text-decoration: underline;
  }

  /* ===== الكروت / الصفوف للمهام ===== */
  .task-card {
    border-radius: 16px;
    border: 1px solid var(--border-orange);
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
    position: relative; /* عشان نحط "انتهى الموعد" بالنص */
    display: flex;
    align-items: center;
    gap: .75rem;
    padding: .85rem 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  .task-row:last-child {
    border-bottom: none;
  }

  .task-title {
    font-weight: 600;
    font-size: 1rem;
    color: #111827;
  }

  .field-inline {
    min-width: 170px;
  }

  .priority-badge {
    display: inline-block;
    border-radius: 999px;
    padding: .25rem .7rem;
    font-weight: 700;
    font-size: .8rem;
    border: 1.5px solid transparent;
    background: #fff;
  }
  .p-high {
    color: #B91C1C;
    border-color: #FCA5A5;
    background: #FEF2F2;
  }
  .p-mid {
    color: #854D0E;
    border-color: #FACC15;
    background: #FEFCE8;
  }
  .p-low {
    color: #166534;
    border-color: #BBF7D0;
    background: #F0FDF4;
  }

  .date-display {
    border: 1px solid var(--border-orange);
    border-radius: 10px;
    background: #fff;
    height: 40px;
    padding: 8px 12px;
    font-size: .95rem;
    text-align: start;
  }
  .date-display:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 .18rem rgba(249,115,22,.18);
  }
  .real-date-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
  }

  .form-check-input {
    accent-color: ${PRIMARY_COLOR};
  }

  .badge-overdue {
    color: #C11A1A;
    font-weight: 600;
    font-size: .75rem;
  }

  /* بالنص داخل الكارد (وضع العرض) */
  .badge-overdue-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    background: #fff7f7;
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid #fecaca;
  }

  /* نسخة داخلية لوضع التعديل */
  .badge-overdue-inline {
    align-self: flex-start;
    margin-top: 4px;
  }

  .add-task-card {
    background: #fff;
    border: 1px dashed var(--border-orange);
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 4px;
  }

  .done-pagination {
    border-top: 1px solid #e5e7eb;
  }

  /* ===== مودال مخصص (زي جلسة الدراسة) ===== */
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

export default function PlanDetailsPage() {
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

  const [isEditing, setIsEditing] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    priority: "",
    deadline: "",
  });
  const addDateRef = useRef(null);

  const [draftTasks, setDraftTasks] = useState([]);
  const [donePage, setDonePage] = useState(0);

  /* مودال مخصص */
  const [modal, setModal] = useState({
    open: false,
    title: "",
    body: "",
    primaryLabel: "",
    secondaryLabel: "",
    onPrimary: null,
    onSecondary: null,
  });

  const openModal = (config) => {
    setModal({
      open: true,
      title: config.title || "",
      body: config.body || "",
      primaryLabel: config.primaryLabel || "حسناً",
      secondaryLabel: config.secondaryLabel || "",
      onPrimary: config.onPrimary || null,
      onSecondary: config.onSecondary || null,
    });
  };

  const closeModal = () => {
    setModal((m) => ({ ...m, open: false }));
  };

  const handlePrimary = () => {
    if (modal.onPrimary) modal.onPrimary();
    closeModal();
  };

  const handleSecondary = () => {
    if (modal.onSecondary) modal.onSecondary();
    closeModal();
  };

  const openAddPicker = () => {
    const el = addDateRef.current;
    if (!el) return;
    if (el.showPicker) el.showPicker();
    else el.click();
  };

  const prettyDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const activeTasks = useMemo(
    () =>
      tasks.filter((t) => !t.completed).slice().sort(compareByPriorityThenDeadline),
    [tasks]
  );
  const doneTasks = useMemo(
    () =>
      tasks.filter((t) => t.completed).slice().sort(compareByPriorityThenDeadline),
    [tasks]
  );

  const paginatedDoneTasks = useMemo(() => {
    const start = donePage * DONE_PAGE_SIZE;
    return doneTasks.slice(start, start + DONE_PAGE_SIZE);
  }, [doneTasks, donePage]);

  useEffect(() => {
    if (donePage > 0 && donePage * DONE_PAGE_SIZE >= doneTasks.length) {
      setDonePage(0);
    }
  }, [doneTasks.length, donePage]);

  const bumpCount = (delta) =>
    setPlanStats((s) => ({
      ...s,
      tasksCount: Math.max(0, (s.tasksCount || 0) + delta),
    }));

  const totalTasks = planStats.tasksCount ?? tasks.length;
  const doneCount = doneTasks.length;
  const completionPercent =
    totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

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

    (async () => {
      try {
        setLoadingPlan(true);
        const data = await fetchWithDiagnostics(
          `http://localhost:5000/study-plans/${planId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
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

    (async () => {
      try {
        setLoadingTasks(true);
        const data = await fetchWithDiagnostics(
          `http://localhost:5000/study-plans/${planId}/tasks`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (aborted) return;
        const list = Array.isArray(data?.tasks) ? data.tasks : [];
        setTasks(
          list.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority || "متوسطة",
            deadline: t.deadline || "",
            completed: !!t.completed,
          }))
        );
      } catch (e) {
        if (aborted) return;
        setErr(e?.message || "فشل جلب مهام الخطة");
      } finally {
        if (!aborted) setLoadingTasks(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [planId]);

  const toggleComplete = async (id) => {
    const current = tasks.find((t) => t.id === id);
    const newVal = !current?.completed;
    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, completed: newVal } : t))
    );
    try {
      const token = localStorage.getItem("token");
      await fetchWithDiagnostics(
        `http://localhost:5000/study-plans/${planId}/tasks/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ completed: newVal }),
        }
      );
    } catch (e) {
      setTasks((ts) =>
        ts.map((t) =>
          t.id === id ? { ...t, completed: current?.completed } : t
        )
      );
    }
  };

  const editDraftField = (id, patch) => {
    setDraftTasks((ds) => ds.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const saveEdits = async () => {
    const today = todayStrLocal();
    for (const d of draftTasks) {
      if (d.deadline && d.deadline < today) {
        openModal({
          title: "تاريخ غير صالح",
          body: "لا يمكن حفظ مهمة بتاريخ أقدم من اليوم. عدّلي التاريخ ثم أعيدي المحاولة.",
          primaryLabel: "حسناً",
        });
        return;
      }
    }

    const diffs = [];
    for (const d of draftTasks) {
      const o = tasks.find((t) => t.id === d.id);
      if (!o) continue;
      const patch = {};
      if (d.title !== o.title) patch.title = d.title;
      if (d.priority !== o.priority) patch.priority = d.priority;
      if (d.deadline !== o.deadline) patch.deadline = d.deadline;
      if (Object.keys(patch).length) diffs.push({ id: d.id, patch });
    }

    if (diffs.length) {
      setTasks((ts) =>
        ts.map((t) => {
          const found = diffs.find((x) => x.id === t.id);
          return found ? { ...t, ...found.patch } : t;
        })
      );
    }

    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        diffs.map((d) =>
          fetchWithDiagnostics(
            `http://localhost:5000/study-plans/${planId}/tasks/${d.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(d.patch),
            }
          )
        )
      );
    } catch (e) {
      try {
        const token = localStorage.getItem("token");
        const data = await fetchWithDiagnostics(
          `http://localhost:5000/study-plans/${planId}/tasks`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const list = Array.isArray(data?.tasks) ? data.tasks : [];
        setTasks(
          list.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority || "متوسطة",
            deadline: t.deadline || "",
            completed: !!t.completed,
          }))
        );
      } catch {}
    } finally {
      setIsEditing(false);
      setDraftTasks([]);
    }
  };

  const removeTask = async (id) => {
    const ok = window.confirm("هل أنت متأكد من حذف هذه المهمة؟");
    if (!ok) return;

    const prev = tasks;
    setTasks((ts) => ts.filter((t) => t.id !== id));
    bumpCount(-1);
    try {
      const token = localStorage.getItem("token");
      await fetchWithDiagnostics(
        `http://localhost:5000/study-plans/${planId}/tasks/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (e) {
      setTasks(prev);
      bumpCount(+1);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim() || !newTask.priority || !newTask.deadline) {
      openModal({
        title: "حقول غير مكتملة",
        body: "أكمل جميع الحقول: العنوان، الأولوية، والتاريخ قبل حفظ المهمة.",
        primaryLabel: "حسناً",
      });
      return;
    }
    const today = todayStrLocal();
    if (newTask.deadline < today) {
      openModal({
        title: "تاريخ غير صالح",
        body: "لا يمكن اختيار تاريخ أقدم من اليوم. حدّث التاريخ ثم حاول مرة أخرى.",
        primaryLabel: "حسناً",
      });
      return;
    }

    const optimisticId =
      Math.max(0, ...tasks.map((t) => Number(t.id) || 0)) + 1;
    const optimistic = {
      id: optimisticId,
      title: newTask.title.trim(),
      priority: newTask.priority,
      deadline: newTask.deadline,
      completed: false,
    };
    setTasks((ts) => [...ts, optimistic]);
    bumpCount(+1);
    setNewTask({ title: "", priority: "", deadline: "" });
    setShowAddRow(false);

    try {
      const token = localStorage.getItem("token");
      const created = await fetchWithDiagnostics(
        `http://localhost:5000/study-plans/${planId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: optimistic.title,
            priority: optimistic.priority,
            deadline: optimistic.deadline,
            completed: false,
          }),
        }
      );

      if (created?.id) {
        setTasks((ts) =>
          ts.map((t) => (t.id === optimisticId ? { ...t, id: created.id } : t))
        );
      }
    } catch (e) {
      setTasks((ts) => ts.filter((t) => t.id !== optimisticId));
      bumpCount(-1);
    }
  };

  const startEditing = () => {
    if (activeTasks.length === 0) {
      openModal({
        title: "لا توجد مهام",
        body: "أضِف مهمة أولًا حتى تتمكن من تعديلها.",
        primaryLabel: "حسناً",
      });
      return;
    }
    setDraftTasks(tasks.map((t) => ({ ...t })));
    setIsEditing(true);
  };
  const cancelEditing = () => {
    setDraftTasks([]);
    setIsEditing(false);
  };

  const inAddMode = showAddRow;
  const inEditMode = isEditing;

  return (
    <div dir="rtl" lang="ar" className="planDetailsRoot">
      <style>{styles}</style>

      {/* مودال مخصص */}
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
                  onClick={handleSecondary}
                >
                  {modal.secondaryLabel}
                </button>
              )}
              <button
                type="button"
                className="modal-btn-primary"
                onClick={handlePrimary}
              >
                {modal.primaryLabel || "حسناً"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="progress-wrap">
        <div className="fc-top">
          <div className="title-block">
            <h3 className="title">
              الخطة الدراسية :
              <span style={{ marginRight: "6px" }}>
                {loadingPlan ? "جارٍ التحميل…" : planTitle}
              </span>
            </h3>

            <div className="page-subtitle">
              نسبة الإنجاز في هذه الخطة: {completionPercent}%
            </div>
          </div>

          <Link to="/plans/all" className="modern-action-btn">
            رجوع للخطط
          </Link>
        </div>

        <div className="tasks-header-row">
          <h2 className="tasks-section-title">المهام الحالية في الخطة</h2>
          <div className="d-flex flex-wrap gap-2">
            {inAddMode ? (
              <button
                type="button"
                className="btn-outline-orange"
                onClick={() =>
                  openModal({
                    title: "إلغاء إضافة المهمة؟",
                    body: "سيتم حذف البيانات التي أدخلتها في هذه المهمة.",
                    primaryLabel: "نعم، إلغاء",
                    secondaryLabel: "لا، ابقَ",
                    onPrimary: () => {
                      setNewTask({ title: "", priority: "", deadline: "" });
                      setShowAddRow(false);
                    },
                  })
                }
              >
                إلغاء الإضافة
              </button>
            ) : inEditMode ? (
              <>
                <button
                  type="button"
                  className="btn-outline-orange"
                  onClick={cancelEditing}
                >
                  إلغاء التعديل
                </button>
                <button
                  type="button"
                  className="btn-orange"
                  onClick={saveEdits}
                >
                  حفظ التغييرات
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-outline-orange"
                  onClick={startEditing}
                >
                  تعديل المهام
                </button>
                <button
                  type="button"
                  className="btn-orange"
                  onClick={() => setShowAddRow(true)}
                >
                  إضافة مهمة جديدة
                </button>
              </>
            )}
          </div>
        </div>

        {showAddRow && (
          <div className="add-task-card">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-lg-6">
                <label className="form-label fw-semibold">عنوان المهمة</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((v) => ({ ...v, title: e.target.value }))
                  }
                  placeholder="اكتب عنوان المهمة"
                />
              </div>
              <div className="col-6 col-lg-2">
                <label className="form-label fw-semibold">الأولوية</label>
                <select
                  className="form-select"
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask((v) => ({ ...v, priority: e.target.value }))
                  }
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
                  <button
                    type="button"
                    className="date-display w-100 text-start"
                    onClick={openAddPicker}
                  >
                    {newTask.deadline
                      ? prettyDate(newTask.deadline)
                      : "اضغط لاختيار تاريخ"}
                  </button>
                  <input
                    ref={addDateRef}
                    type="date"
                    className="real-date-input"
                    value={newTask.deadline}
                    onChange={(e) =>
                      setNewTask((v) => ({ ...v, deadline: e.target.value }))
                    }
                    aria-label="اختر تاريخ"
                  />
                </div>
              </div>
              <div className="col-12 col-lg-1 d-grid">
                <button className="btn-orange" onClick={addTask}>
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* المهام الحالية */}
        <div className="section-block">
          <div className="card task-card mb-0">
            <div className="card-body p-0">
              {loadingTasks ? (
                <div className="p-3 text-muted">جارٍ تحميل المهام…</div>
              ) : activeTasks.length === 0 ? (
                <div className="p-3 text-muted text-center">
                  لا توجد مهام حالية في هذه الخطة.
                </div>
              ) : inEditMode ? (
                draftTasks
                  .filter((t) => !t.completed)
                  .slice()
                  .sort(compareByPriorityThenDeadline)
                  .map((t) => (
                    <div key={t.id} className="task-row">
                      <div className="flex-grow-1 d-flex align-items-center gap-2">
                        <input
                          type="checkbox"
                          className="form-check-input ms-1"
                          checked={false}
                          disabled
                          aria-label="إنهاء المهمة"
                        />
                        <input
                          type="text"
                          className="form-control"
                          value={t.title}
                          onChange={(e) =>
                            editDraftField(t.id, { title: e.target.value })
                          }
                        />
                      </div>

                      <div className="field-inline d-flex flex-column align-items-start gap-1">
                        <div className="d-flex align-items-center gap-2">
                          <IconCalendar />
                          <input
                            type="date"
                            className="form-control"
                            value={t.deadline}
                            onChange={(e) =>
                              editDraftField(t.id, {
                                deadline: e.target.value,
                              })
                            }
                          />
                        </div>

                        {t.deadline && isOverdue(t.deadline) && (
                          <span className="badge-overdue badge-overdue-inline">
                            انتهى الموعد
                          </span>
                        )}

                        <select
                          className="form-select"
                          value={t.priority}
                          onChange={(e) =>
                            editDraftField(t.id, { priority: e.target.value })
                          }
                          style={{ maxWidth: "160px" }}
                        >
                          <option value="عالية">عالية</option>
                          <option value="متوسطة">متوسطة</option>
                          <option value="منخفضة">منخفضة</option>
                        </select>

                        <button
                          type="button"
                          className="btn btn-link text-danger p-0 mt-1"
                          onClick={() => removeTask(t.id)}
                          title="حذف المهمة"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                activeTasks.map((t) => {
                  const priorityClass =
                    t.priority === "عالية"
                      ? "p-high"
                      : t.priority === "متوسطة"
                      ? "p-mid"
                      : "p-low";

                  return (
                    <div key={t.id} className="task-row">
                      {/* تنبيه بالنص إذا انتهى الموعد */}
                      {t.deadline && isOverdue(t.deadline) && (
                        <span className="badge-overdue badge-overdue-center">
                          انتهى الموعد
                        </span>
                      )}

                      <div className="flex-grow-1 d-flex align-items-center gap-2">
                        <input
                          type="checkbox"
                          className="form-check-input ms-1"
                          checked={false}
                          onChange={() => toggleComplete(t.id)}
                          aria-label="إنهاء المهمة"
                        />
                        <div className="task-title">{t.title}</div>
                      </div>

                      <div className="field-inline d-flex flex-column align-items-start gap-1">
                        <div className="d-flex align-items-center gap-2">
                          <IconCalendar />
                          <span className="small">
                            {t.deadline ? prettyDate(t.deadline) : "—"}
                          </span>
                        </div>

                        <span className={`priority-badge ${priorityClass}`}>
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* المهام المنجزة */}
        <div className="section-title-wrap">
          <h2 className="tasks-section-title">المهام المنجزة في الخطة</h2>
        </div>
        <div className="section-block">
          <div className="card task-card mb-0">
            <div className="card-body p-0">
              {loadingTasks ? (
                <div className="p-3 text-muted">جارٍ التحميل…</div>
              ) : doneTasks.length === 0 ? (
                <div className="p-3 text-muted text-center">
                  لم تُنهِ أي مهمة بعد في هذه الخطة.
                </div>
              ) : (
                <>
                  {paginatedDoneTasks.map((t) => {
                    const priorityClass =
                      t.priority === "عالية"
                        ? "p-high"
                        : t.priority === "متوسطة"
                        ? "p-mid"
                        : "p-low";

                    return (
                      <div
                        key={t.id}
                        className="task-row"
                        style={{ opacity: 0.85 }}
                      >
                        <div className="flex-grow-1 d-flex align-items-center gap-2">
                          <input
                            type="checkbox"
                            className="form-check-input ms-1"
                            checked={true}
                            onChange={() => toggleComplete(t.id)}
                            aria-label="إرجاع المهمة"
                          />
                          <div className="task-title text-decoration-line-through">
                            {t.title}
                          </div>
                        </div>

                        <div className="field-inline d-flex flex-column align-items-start gap-1">
                          <div className="d-flex align-items-center gap-2">
                            <IconCalendar />
                            <span className="small">
                              {t.deadline ? prettyDate(t.deadline) : "—"}
                            </span>
                          </div>

                          {/* لا نظهر "انتهى الموعد" في المهام المنجزة */}

                          <span
                            className={`priority-badge ${priorityClass}`}
                          >
                            {t.priority}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {doneTasks.length > DONE_PAGE_SIZE && (
                    <div className="done-pagination d-flex justify-content-center gap-2 py-2">
                      {donePage > 0 && (
                        <button
                          type="button"
                          className="pager-btn"
                          onClick={() =>
                            setDonePage((p) => Math.max(0, p - 1))
                          }
                        >
                          السابق
                        </button>
                      )}
                      {(donePage + 1) * DONE_PAGE_SIZE < doneTasks.length && (
                        <button
                          type="button"
                          className="pager-btn"
                          onClick={() => setDonePage((p) => p + 1)}
                        >
                          التالي
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {err && <div className="alert alert-danger mt-3">{err}</div>}
      </section>
    </div>
  );
}
