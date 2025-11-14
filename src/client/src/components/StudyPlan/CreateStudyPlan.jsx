// client/src/components/Pages/CreateStudyPlan.jsx
import React, { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function CreateStudyPlan() {
  const [planTitle, setPlanTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  // الأولوية بلا قيمة افتراضية — لازم يختار المستخدم
  const [taskPriority, setTaskPriority] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");

  const [tasks, setTasks] = useState([]);
  const [saving, setSaving] = useState(false);
  const dateInputRef = useRef(null);
  const navigate = useNavigate();

  const PRIORITY_RANK = { "عالية": 0, "متوسطة": 1, "منخفضة": 2 };
  const compareByPriorityThenDeadline = (a, b) => {
    const ra = PRIORITY_RANK[a.priority] ?? 99;
    const rb = PRIORITY_RANK[b.priority] ?? 99;
    if (ra !== rb) return ra - rb;
    const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
    const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
    return da - db; 
  };
  const sortedTasks = useMemo(() => tasks.slice().sort(compareByPriorityThenDeadline), [tasks]);

  
  const todayStrLocal = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const addTask = () => {

    if (!taskTitle.trim()) {
      alert("أدخل عنوان المهمة أولاً");
      return;
    }
    if (!taskPriority) {
      alert("اختر مستوى الأولوية");
      return;
    }
    if (!taskDeadline) {
      alert("اختر الموعد النهائي");
      return;
    }
    // منع التاريخ القديم
    const today = todayStrLocal();
    if (taskDeadline < today) {
      alert("غيّر التاريخ، التاريخ قديم.");
      return;
    }

    const newTask = {
      id: tasks.length + 1,
      title: taskTitle.trim(),
      priority: taskPriority,
      deadline: taskDeadline,
    };
    setTasks((prev) => [...prev, newTask]); // نخلي الترتيب للعرض فقط
    setIsEditingTitle(false);
    setTaskTitle("");
    setTaskPriority("");   // نرجّعها فارغة بعد الإضافة
    setTaskDeadline("");
  };

  const removeTask = (id) => {
    const ok = window.confirm("هل أنت متأكد من حذف هذه المهمة؟");
    if (!ok) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const prettyDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return "";
    }
  };

  const openNativePicker = () => {
    if (!dateInputRef.current) return;
    if (dateInputRef.current.showPicker) dateInputRef.current.showPicker();
    else dateInputRef.current.click();
  };

  const savePlan = async () => {
    if (!planTitle.trim()) {
      alert("أدخل عنوان الخطة أولاً");
      return;
    }
    if (tasks.length === 0) {
      alert("أضف مهمة واحدة على الأقل");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("يرجى تسجيل الدخول أولاً");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("http://localhost:5000/study-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: planTitle.trim(),
          // الإرسال كما هو؛ السيرفر لا يحتاج الترتيب
          tasks: tasks.map((t) => ({ title: t.title, priority: t.priority, deadline: t.deadline })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "حدث خطأ أثناء الحفظ");

      alert("✅ تم حفظ الخطة بنجاح!");
      navigate("/plans");
    } catch (err) {
      console.error("❌ خطأ أثناء حفظ الخطة:", err);
      alert("فشل في حفظ الخطة");
    } finally {
      setSaving(false);
    }
  };

  const TrashIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6H20M9 6V4H15V6M6 6L7 20H17L18 6" stroke="#C11A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const isTitleLocked = tasks.length > 0 && !isEditingTitle;

  return (
    <div dir="rtl" lang="ar" className="min-vh-100 d-flex flex-column">
      <style>{`
        :root{
          --brand:#fb923c; --brand-hover:#f97316;
          --border-orange:#ffe7c2; --ink:#0b0b0c;
        }
        .card-orange { background: linear-gradient(135deg, #ffedd5, #fed7aa); border: 1px solid #ffd8a8; }
        .border-orange { border-color: var(--border-orange) !important; }
        .text-muted-700 { color: #6b7280; }

        .btn-orange{ background-color: var(--brand); border-color: var(--brand); color:#fff; }
        .btn-orange:hover{ background-color: var(--brand-hover); border-color: var(--brand-hover); color:#fff; }
        .btn-outline-orange{ border-color: var(--border-orange); color: var(--ink); background-color:#fff; }
        .btn-outline-orange:hover{ background-color:#fff7ed; border-color: var(--brand); color: var(--brand); }

        .card-clean { background:#fff; border:1px solid var(--border-orange); border-radius:16px; box-shadow: 0 6px 18px rgba(234,88,12,0.10); }

        .modern-select{
          appearance:none; background:#fff; border:1px solid var(--border-orange);
          border-radius:10px; height:44px; padding:10px 12px; font-size:.95rem; cursor:pointer;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23fb923c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:left 12px center;
        }
        .modern-select:focus{ border-color:var(--brand); box-shadow:0 0 0 .2rem rgba(249,115,22,.18); }

        .date-display{
          width:100%; border:1px solid var(--border-orange); border-radius:10px; background:#fff;
          padding:10px 12px; text-align:start; font-size:.95rem;
        }
        .date-display:focus{ outline:none; border-color:var(--brand); box-shadow:0 0 0 .2rem rgba(249,115,22,.18); }
        .date-hidden{ position:absolute; inset:0; opacity:0; pointer-events:none; }

        .priority-badge{
          display:inline-block; border-radius:999px; padding:.3rem .65rem; font-weight:600; font-size:.85rem;
          background:#fff; border:1px solid transparent;
        }
        .p-high{ color:#B42318; border-color:#FAD1D0; background:#FFF1F0; }
        .p-mid { color:#7C4A03; border-color:#FFE4B5; background:#FFF7E6; }
        .p-low { color:#075985; border-color:#CFEFFF; background:#F0FBFF; }

        .task-row{ display:flex; align-items:center; gap:.75rem; padding:.75rem 0; border-bottom:1px solid var(--border-orange); }
        .task-row:last-child{ border-bottom:none; }
      `}</style>

      {/* === الهيدر === */}
      <div className="container py-4 py-md-5">
        <div className="card card-orange shadow-sm border-0 rounded-4 mb-4">
          <div className="card-body p-4 p-md-5">
            <div className="row gy-3 align-items-center">
              <div className="col-12 col-md">
                <h1 className="h3 fw-bold mb-1">إنشاء خطة دراسية</h1>
                <div className="text-muted-700 small">أنشئ خطة منظمة لإدارة مهامك الدراسية بسهولة.</div>
              </div>
              <div className="col-12 col-md-auto d-grid d-sm-flex gap-2">
                <button type="button" className="btn btn-outline-orange fw-bold px-3" onClick={() => navigate("/plans")}>← رجوع</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === المحتوى === */}
      <main className="flex-grow-1 py-3">
        <div className="container-lg">
          {/* عنوان الخطة */}
          <div className="card-clean p-4 mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold mb-0 text-dark">عنوان الخطة</h5>
              {tasks.length > 0 && (
                isEditingTitle ? (
                  <button type="button" className="btn btn-orange btn-sm fw-semibold" onClick={() => setIsEditingTitle(false)}>حفظ</button>
                ) : (
                  <button type="button" className="btn btn-outline-orange btn-sm fw-semibold" onClick={() => setIsEditingTitle(true)}>تعديل الاسم</button>
                )
              )}
            </div>

            <input
              type="text"
              className="form-control border-orange py-2"
              placeholder="مثال: خطة دراسة نهاية الفصل"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              disabled={tasks.length > 0 && !isEditingTitle}
              style={{ cursor: tasks.length > 0 && !isEditingTitle ? "not-allowed" : "text" }}
            />
            {!planTitle.trim() && <div className="form-text text-muted-700 mt-2">اكتب عنوان الخطة أولًا.</div>}
          </div>

          {/* إضافة مهمة */}
          <div className="card-clean p-4 mb-4">
            <h5 className="fw-bold mb-3 text-dark">إضافة مهمة</h5>

            <label className="form-label fw-semibold">عنوان المهمة</label>
            <input
              type="text"
              className="form-control border-orange mb-3"
              placeholder="مثال: مراجعة الفصل الثالث"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />

            <label className="form-label fw-semibold">مستوى الأولوية</label>
            <div className="mb-3" style={{ width: "clamp(220px, 40%, 320px)" }}>
              <select className="form-select modern-select" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                <option value="">اختر مستوى الأولوية</option>
                <option value="عالية">عالية</option>
                <option value="متوسطة">متوسطة</option>
                <option value="منخفضة">منخفضة</option>
              </select>
            </div>

            <label className="form-label fw-semibold">الموعد النهائي</label>
            <div className="position-relative mb-3" style={{ width: "clamp(220px, 50%, 360px)" }}>
              <button type="button" className="date-display" onClick={openNativePicker} title="اضغط لإضافة تاريخ">
                {taskDeadline ? prettyDate(taskDeadline) : "اضغط لإضافة تاريخ"}
              </button>
              <input
                ref={dateInputRef}
                type="date"
                className="date-hidden"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                aria-label="اختر تاريخ"
              />
            </div>

            {/* زر الإضافة: مفعّل بمجرد كتابة عنوان الخطة */}
            <button
              className="btn btn-orange w-100 fw-bold"
              onClick={addTask}
              disabled={!planTitle.trim()}
              title={!planTitle.trim() ? "اكتب عنوان الخطة أولاً" : undefined}
            >
              + إضافة المهمة
            </button>
          </div>

          {/* قائمة المهام (مرتَّبة تلقائيًا) */}
          <div className="card-clean p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 text-dark">المهام ({tasks.length})</h5>
              <small className="text-muted">سيتم ترتيبها تلقائيًا</small>
            </div>

            {sortedTasks.length === 0 ? (
              <p className="text-muted mb-0">لم تتم إضافة مهام بعد.</p>
            ) : (
              sortedTasks.map((task) => (
                <div key={task.id} className="task-row">
                  <div className="flex-grow-1">
                    <strong>{task.title}</strong>
                  </div>

                  <div style={{ minWidth: 120, textAlign: "center" }}>
                    <span className={`priority-badge ${
                      task.priority === "عالية" ? "p-high" :
                      task.priority === "متوسطة" ? "p-mid" : "p-low"
                    }`}>
                      {task.priority || "—"}
                    </span>
                  </div>

                  <div className="text-muted small" style={{ minWidth: 160, textAlign: "start" }}>
                    {task.deadline ? prettyDate(task.deadline) : "—"}
                  </div>

                  <button className="btn btn-sm btn-link text-danger" onClick={() => removeTask(task.id)} title="حذف">
                    <TrashIcon />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* زر الحفظ */}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-outline-orange px-4 fw-bold" onClick={() => navigate("/plans")}>إلغاء</button>
            <button className="btn btn-orange px-4 fw-bold" onClick={savePlan} disabled={saving}>
              {saving ? "جارٍ الحفظ..." : "حفظ الخطة"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
