// client/src/components/Pages/CreateStudyPlan.jsx
import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks, Trash2, AlertTriangle } from "lucide-react";

const PRIMARY_COLOR = "#ff8c42";
const PRIMARY_LIGHT = "#ffdbbf";

function prettyDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    // مثال: ٢٧ نوفمبر ٢٠٢٥ (ميلادي)
    return d.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// تاريخ اليوم بصيغة YYYY-MM-DD للمقارنة
function todayStrLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CreateStudyPlan() {
  const navigate = useNavigate();

  const [planTitle, setPlanTitle] = useState("");
  const [tasks, setTasks] = useState([]);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskPriority, setTaskPriority] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null); // {title, message}

  const dateInputRef = useRef(null);

  // مودال موحّد
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

  const styles = `
    .createPlanRoot, .createPlanRoot * {
      font-family: "Cairo", "Helvetica Neue", sans-serif;
    }

    .progress-wrap {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 30px 20px 50px;
      max-width: 1100px;
      margin: 0 auto;
    }

    /* ===== الهيدر ===== */
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

    /* ===== الكروت / السكشن ===== */
    .form-section {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      padding: 18px 20px 20px;
      box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
    }

    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }

    .section-icon {
      color: ${PRIMARY_COLOR};
      flex-shrink: 0;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #1f2937;
      border-right: 4px solid ${PRIMARY_COLOR};
      padding-right: 8px;
      line-height: 1.3;
    }

    .section-title-no-line {
      border-right: none;
      padding-right: 0;
    }

    .hint-text {
      font-size: 0.85rem;
      color: #6b7280;
      margin-top: 6px;
    }

    /* ===== الدروب داون الأبيض ===== */
    .modern-select {
      border: 1px solid #e5e7eb !important;
      border-radius: 10px !important;
      background-color: #ffffff !important;
      color: #111 !important;
      height: 44px;
      padding: 10px 12px;
      font-size: 0.95rem;
      line-height: 1.25rem;
      box-shadow: 0 1px 0 rgba(0,0,0,.02);
      appearance: none !important;
      -webkit-appearance: none !important;
      -moz-appearance: none !important;
    }

    .modern-select:focus {
      border-color: ${PRIMARY_COLOR} !important;
      background-color: #ffffff !important;
      box-shadow: 0 0 0 0.15rem rgba(255, 140, 66, 0.25) !important;
    }

    .modern-select option {
      background-color: #ffffff !important;
      color: #111 !important;
      padding: 10px;
      font-size: 0.95rem;
    }

    select.form-select,
    select.modern-select {
      background-color: #ffffff !important;
      border-radius: 10px !important;
      border: 1px solid #e5e7eb !important;
      appearance: none !重要;
      -webkit-appearance: none !important;
      -moz-appearance: none !important;
    }

    select.modern-select::-ms-expand {
      display: none;
    }

    /* حقل مستوى الأولوية بسهم مخصص */
    .priority-select-wrap {
      position: relative;
      width: 100%;
    }

    .priority-select {
      padding-right: 44px !important;
      background-image: none !important;
      background-position: right center !important;
      background-repeat: no-repeat !important;
    }

    .priority-arrow {
      position: absolute;
      top: 50%;
      right: 16px;
      transform: translateY(-50%);
      font-size: 1.1rem;
      color: #6b7280;
      pointer-events: none;
    }

    .priority-select:focus + .priority-arrow {
      color: ${PRIMARY_COLOR};
    }

    .date-display {
      width: 100%;
      text-align: right;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      padding: 10px 12px;
      font-size: 0.95rem;
      color: #4b5563;
      cursor: pointer;
    }
    .date-display:hover {
      border-color: ${PRIMARY_COLOR};
      background: #fff7ed;
    }
    .date-hidden {
      position: absolute;
      inset: 0;
      opacity: 0;
      pointer-events: none;
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .task-item {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px 14px;
      box-shadow: 0 6px 12px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .task-title {
      font-size: 0.98rem;
      font-weight: 700;
      color: #111827;
    }

    .task-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 0.85rem;
      color: #6b7280;
    }

    .task-meta-item {
      font-weight: 500;
    }

    .priority-badge {
      display: inline-block;
      border-radius: 999px;
      padding: .2rem .7rem;
      font-weight: 700;
      font-size: .75rem;
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

    .empty-state-card {
      background: #fff7ed;
      border: 1px dashed ${PRIMARY_LIGHT};
      border-radius: 10px;
      padding: 18px;
      text-align: center;
      color: #7a3f00;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .bottom-actions {
      margin-top: 8px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn-link-danger {
      background: none;
      border: none;
      color: #dc2626;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .modern-alert-error {
      padding: 12px 14px;
      border-radius: 10px;
      background-color: #fef2f2;
      color: #ef4444;
      border: 1px solid #fecaca;
      margin-top: 10px;
      text-align: right;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    /* ===== مودال ===== */
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

  // ترتيب المهام
  const sortedTasks = useMemo(() => {
    const priorityRank = {
      "عالية": 3,
      "متوسطة": 2,
      "منخفضة": 1,
    };

    const arr = [...tasks];

    arr.sort((a, b) => {
      const pa = priorityRank[a.priority] || 0;
      const pb = priorityRank[b.priority] || 0;

      if (pa !== pb) {
        return pb - pa;
      }

      const da = a.deadline || "";
      const db = b.deadline || "";

      if (da && !db) return -1;
      if (!da && db) return 1;

      if (da !== db) {
        return String(da).localeCompare(String(db));
      }

      const oa = a.createdAt || 0;
      const ob = b.createdAt || 0;
      return oa - ob;
    });

    return arr;
  }, [tasks]);

  const hasChanges =
    planTitle.trim() ||
    tasks.length > 0 ||
    taskTitle.trim() ||
    taskDeadline ||
    taskPriority;

  const todayLocalStr = todayStrLocal();

  const openNativePicker = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker?.();
      dateInputRef.current.focus();
    }
  };

  const addTask = () => {
    // 1) لا توجد أي بيانات للمهمة
    if (!taskTitle.trim() && !taskDeadline && !taskPriority) {
      openModal({
        title: "لا توجد بيانات للمهمة",
        body: "يلزم تعبئة بيانات المهمة قبل إضافتها للخطة.",
        primaryLabel: "حسناً",
      });
      return;
    }

    // 2) في بيانات للمهمة لكن عنوان الخطة فاضي
    if (!planTitle.trim()) {
      openModal({
        title: "لا توجد بيانات للخطة",
        body: "يلزم إدخال عنوان للخطة قبل إضافة المهام إليها.",
        primaryLabel: "حسناً",
      });
      return;
    }

    // 3) حقول المهمة نفسها غير مكتملة
    if (!taskTitle.trim() || !taskDeadline || !taskPriority) {
      openModal({
        title: "حقول غير مكتملة",
        body: "يلزم إكمال الحقول: العنوان، الموعد النهائي، ومستوى الأولوية قبل إضافة المهمة.",
        primaryLabel: "حسناً",
      });
      return;
    }

    // 4) التاريخ أقدم من اليوم
    if (taskDeadline < todayLocalStr) {
      openModal({
        title: "تاريخ غير صالح",
        body: "لا يمكن اختيار تاريخ أقدم من تاريخ اليوم. تغيير التاريخ ضروري قبل المتابعة.",
        primaryLabel: "حسناً",
      });
      return;
    }

    const now = Date.now();

    const newTask = {
      id: now.toString(),
      createdAt: now,
      title: taskTitle.trim(),
      deadline: taskDeadline || "",
      priority: taskPriority || "",
    };

    setTasks((prev) => [...prev, newTask]);
    setTaskTitle("");
    setTaskDeadline("");
    setTaskPriority("");
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleBack = () => {
    if (!hasChanges) {
      navigate("/plans");
      return;
    }
    openModal({
      title: "الخروج بدون إنشاء الخطة؟",
      body: "في حال الرجوع الآن لن يتم حفظ البيانات الحالية.",
      primaryLabel: "الخروج للخطط",
      secondaryLabel: "البقاء في الصفحة",
      onPrimary: () => navigate("/plans"),
    });
  };

  const handleCancel = () => {
    if (!hasChanges) {
      navigate("/plans");
      return;
    }
    openModal({
      title: "إلغاء إنشاء الخطة؟",
      body: "في حال تأكيد الإلغاء سيتم تجاهل جميع البيانات المدخلة في هذه الصفحة.",
      primaryLabel: "نعم، إلغاء",
      secondaryLabel: "متابعة بدون إلغاء",
      onPrimary: () => navigate("/plans"),
    });
  };

  const savePlan = async () => {
    if (!planTitle.trim() || tasks.length === 0) {
      let msg = "";
      if (!planTitle.trim() && tasks.length === 0) {
        msg =
          "يلزم إدخال عنوان للخطة وإضافة مهمة واحدة على الأقل قبل إنشاء الخطة.";
      } else if (!planTitle.trim()) {
        msg = "يلزم إدخال عنوان للخطة قبل إنشاءها.";
      } else {
        msg = "يلزم إضافة مهمة واحدة على الأقل قبل إنشاء الخطة.";
      }

      openModal({
        title: "بيانات غير مكتملة",
        body: msg,
        primaryLabel: "حسناً",
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");
      const body = {
        title: planTitle.trim(),
        tasks: tasks.map((t) => ({
          title: t.title,
          deadline: t.deadline || null,
          priority: t.priority || null,
        })),
      };

      const res = await fetch("http://localhost:5000/study-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.msg || j?.error || "فشل في إنشاء الخطة.");
      }

      navigate("/plans");
    } catch (e) {
      setError({
        title: "خطأ في الحفظ",
        message: e.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const TrashIcon = (props) => <Trash2 size={18} {...props} />;

  return (
    <div dir="rtl" className="createPlanRoot">
      <style>{styles}</style>

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
        {/* الهيدر */}
        <div className="fc-top">
          <div className="title-block">
            <h3 className="title">إنشاء خطة دراسية جديدة</h3>
            <div className="page-subtitle">
              صفحة لإنشاء خطة دراسية مع مهام مرتّبة تسهّل المتابعة.
            </div>
          </div>
          <button
            type="button"
            className="modern-action-btn"
            onClick={handleBack}
          >
            رجوع
          </button>
        </div>

        {/* خطأ عام من السيرفر فقط */}
        {error && (
          <div className="modern-alert-error">
            <div>
              <AlertTriangle size={18} style={{ marginLeft: 6 }} />
              <span>
                {error.title}: {error.message}
              </span>
            </div>
            <button
              type="button"
              className="btn-link-danger"
              onClick={() => setError(null)}
            >
              إغلاق
            </button>
          </div>
        )}

        {/* 1) بيانات الخطة */}
        <div className="form-section">
          <div className="section-title-wrap">
            <h2 className="section-title">بيانات الخطة</h2>
          </div>

          <label className="form-label fw-semibold">عنوان الخطة</label>
          <input
            type="text"
            className="form-control"
            placeholder="مثال: خطة مذاكرة اختبار منتصف الترم"
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
          />
          {!planTitle.trim() && (
            <div className="hint-text">
              يفضّل أن يكون عنوان الخطة واضح عشان يسهل تمييزها لاحقاً.
            </div>
          )}
        </div>

        {/* 2) إضافة مهمة للخطة */}
        <div className="form-section">
          <div className="section-title-wrap" style={{ marginBottom: 12 }}>
            <h2 className="section-title">إضافة مهمة للخطة</h2>
          </div>

          <label className="form-label fw-semibold">عنوان المهمة</label>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="مثال: مراجعة الفصل الثالث"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">الموعد النهائي</label>
              <div className="position-relative">
                <button
                  type="button"
                  className="date-display"
                  onClick={openNativePicker}
                  title="اختيار تاريخ"
                >
                  {taskDeadline
                    ? prettyDate(taskDeadline)
                    : "اضغط لاختيار تاريخ"}
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  className="date-hidden"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  aria-label="اختر تاريخ"
                  min={todayLocalStr}
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">مستوى الأولوية</label>
              <div className="priority-select-wrap">
                <select
                  className="form-select modern-select priority-select"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                >
                  <option value="">اختر مستوى الأولوية</option>
                  <option value="عالية">عالية</option>
                  <option value="متوسطة">متوسطة</option>
                  <option value="منخفضة">منخفضة</option>
                </select>
                <span className="priority-arrow">⌄</span>
              </div>
            </div>
          </div>

          <button
            className="modern-action-btn modern-primary-btn w-100 mt-4"
            onClick={addTask}
            style={{ justifyContent: "center" }}
          >
            + إضافة المهمة إلى الخطة
          </button>
        </div>

        {/* 3) مهام الخطة */}
        <div className="form-section">
          <div className="section-title-wrap">
            <ListChecks size={22} className="section-icon" />
            <h2 className="section-title section-title-no-line">
              مهام الخطة ({tasks.length})
            </h2>
          </div>

          {sortedTasks.length === 0 ? (
            <div className="empty-state-card">
              لم يتم إضافة مهام حتى الآن.
            </div>
          ) : (
            <div className="tasks-list">
              {sortedTasks.map((task) => {
                const priorityClass =
                  task.priority === "عالية"
                    ? "p-high"
                    : task.priority === "متوسطة"
                    ? "p-mid"
                    : "p-low";

                return (
                  <div key={task.id} className="task-item">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div className="flex-grow-1">
                        <div className="task-title">{task.title}</div>
                        <div className="task-meta mt-1">
                          <span className="task-meta-item">
                            الموعد:{" "}
                            {task.deadline ? prettyDate(task.deadline) : "—"}
                          </span>
                          <span className={`priority-badge ${priorityClass}`}>
                            {task.priority || "—"}
                          </span>
                        </div>
                      </div>

                      <button
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => removeTask(task.id)}
                        title="حذف المهمة من الخطة"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* الأزرار أسفل الصفحة */}
        <div className="bottom-actions">
          <button
            type="button"
            className="modern-action-btn"
            onClick={handleCancel}
          >
            إلغاء
          </button>
          <button
            type="button"
            className="modern-action-btn modern-primary-btn"
            onClick={savePlan}
            disabled={saving}
          >
            {saving ? "جارٍ إنشاء الخطة..." : "إنشاء الخطة"}
          </button>
        </div>
      </section>
    </div>
  );
}
