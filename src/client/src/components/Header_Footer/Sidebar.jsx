import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Sidebar({
  open,
  onClose,
  active,
  onSelect,
  onProfile,
  onLogout,
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  function getAuthHeaders() {
    let t =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      "";
    t = t.replace(/^Bearer\s+/i, "");
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          (import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000") +
            "/sidebar/me",
          { headers: getAuthHeaders() }
        );
        setFirstName((data?.firstName || "").toString());
        setLastName((data?.lastName || "").toString());
      } catch (err) {
        console.error(
          "تعذّر جلب بيانات السايدبار:",
          err?.response?.data || err.message
        );
      }
    })();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    onLogout?.();
    window.location.href = "/";
  };

  // امنع تمرير الخلفية عند الفتح + إغلاق بـ ESC
  useEffect(() => {
    if (open) document.body.classList.add("body--noscroll");
    else document.body.classList.remove("body--noscroll");

    const onEsc = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.classList.remove("body--noscroll");
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  const items = [
    { key: "home", label: "الشاشة الرئيسية", icon: DashboardIcon },
    { key: "tasks", label: "المهام", icon: TaskIcon },
    { key: "plans", label: "الخطط الدراسية", icon: PlanIcon },
    { key: "quizzes", label: "الاختبارات", icon: QuizIcon },
    { key: "cards", label: "البطاقات التعليمية", icon: CardsIcon },
    { key: "sessions", label: "جلسات المذاكرة", icon: ClockIcon },
    { key: "progress", label: "التقدم", icon: ChartIcon },
    { key: "chat", label: "دردشة الذكاء الاصطناعي", icon: ChatIcon },
  ];

  const fullName =
    `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim() || "مستخدم";

  return (
    <>
      {open && <div className="overlay overlayShow" onClick={onClose} />}

      <aside
        className={`sidebar ${open ? "sidebarOpen" : ""}`}
        aria-hidden={!open}
        role="dialog"
        aria-label="القائمة الجانبية"
      >
        {/* رأس السايدبار */}
        <div className="sideHead">
          <div className="sideTitle">
            <div className="titleLogo">
              <img src="/logo1.png" alt="Logo" draggable="false" />
            </div>
          </div>
          <button className="iconBtn closeBtn" onClick={onClose} aria-label="إغلاق">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
              stroke="#0f172a" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        </div>

        {/* القائمة */}
        <nav className="list" aria-label="القائمة">
          {items.map(({ key, label, icon: Icon }) => (
            <a
              key={key}
              href="#"
              className={`item ${active === key ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                onSelect?.(key);
                onClose?.();
              }}
            >
              <span className="icon"><Icon /></span>
              <span className="label">{label}</span>
            </a>
          ))}
        </nav>

        {/* أسفل الشريط */}
        <div className="profileFooter">
          <div
            className="profileInfo"
            onClick={() => {
              onProfile?.();
              onClose?.();
            }}
          >
            {/* صورة البروفايل */}
            <img
              src="/profile.png"   /* ← غيّري المسار لصورتك */
              alt="Profile Avatar"
              className="avatarImg"
            />
            <div className="names">
              <div className="name" title={fullName}>{fullName}</div>
              <div className="sub">ملفي الشخصي</div>
            </div>
          </div>

          {/* يدفع زر الخروج لأقصى اليسار (أقصى يمين في RTL) */}
          <div className="flexSpacer" />

          {/* زر خروج أيقونة فقط */}
          <button
            className="iconBtn logoutBtn"
            aria-label="تسجيل الخروج"
            onClick={() => setConfirmOpen(true)}
            title="تسجيل الخروج"
          >
            <svg
              viewBox="0 0 24 24" width="22" height="22" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* تأكيد الخروج */}
      {confirmOpen && (
        <div className="confirmOverlay">
          <div className="confirmBox">
            <div className="confirmMessage">هل أنت متأكد أنك تريد تسجيل الخروج؟</div>
            <div className="confirmActions">
              <button className="btnCancel" onClick={() => setConfirmOpen(false)}>
                إلغاء
              </button>
              <button className="btnConfirm" onClick={handleLogout}>
                نعم، تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ===== Icons ===== */
function DashboardIcon(){return(<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"/></g></svg>);}
function TaskIcon(){return(<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h6M7 12h10M7 16h8"/></g></svg>);}
function PlanIcon(){return(<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h6"/><path d="M6 3v3M18 3v3"/></g></svg>);}
function QuizIcon(){return(<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 7h6M9 11h6"/><path d="M7 5h10l2 14H5L7 5z"/></g></svg>);}
function CardsIcon(){return(<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="7" width="13" height="10" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h9v11"/></g></svg>);}
function ClockIcon(){return(<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></g></svg>);}
function ChartIcon(){return(<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 19V5M4 19h16M8 15v-4M12 19v-8M16 13V7"/></g></svg>);}
function ChatIcon(){return(<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></g></svg>);}
