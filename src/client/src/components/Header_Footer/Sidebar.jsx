import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function Sidebar({
  open,
  onClose,
  active,
  onSelect,
  onProfile,
  onSettings,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef(null);

  const UserOutline = (props) => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M4 20a8 8 0 0 1 16 0"/>
      <circle cx="12" cy="8" r="3"/>
    </svg>
  );

  // إغلاق قائمة الخيارات عند الضغط برا
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // الهيدر للتوكن
  function getAuthHeaders() {
    let t = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
    t = t.replace(/^Bearer\s+/i, "");
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  // جلب الاسم
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          (import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000") + "/sidebar/me",
          { headers: getAuthHeaders() }
        );
        setFirstName((data?.firstName || "").toString());
        setLastName((data?.lastName || "").toString());
      } catch (err) {
        console.error("تعذّر جلب بيانات السايدبار:", err?.response?.data || err.message);
      }
    })();
  }, []);

  // تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    onLogout?.();
    window.location.href = "/";
  };

  const items = [
    { key: "home",    label: "الشاشة الرئيسية",       icon: DashboardIcon },
    { key: "tasks",   label: "المهام",                icon: TaskIcon },
    { key: "plans",   label: "الخطط الدراسية",         icon: PlanIcon },
    { key: "quizzes", label: "الاختبارات",            icon: QuizIcon },
    { key: "cards",   label: "البطاقات التعليمية",      icon: CardsIcon },
    { key: "sessions",label: "جلسات المذاكرة",         icon: ClockIcon },
    { key: "progress",label: "التقدم",                 icon: ChartIcon },
    { key: "chat",    label: "دردشة الذكاء الاصطناعي",  icon: ChatIcon },
  ];

  const fullName = `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim() || "مستخدم";

  return (
    <>
      {/* ✅ الـ overlay يشتغل بس عند الفتح */}
      {open && <div className="overlay overlayShow" onClick={onClose} />}

      <aside className={`sidebar ${open ? "sidebarOpen" : ""}`} aria-hidden={!open}>
        {/* رأس الشريط */}
        <div className="sideHead">
          <div className="sideTitle">
            <div className="titleLogo">
              <img src="/logo.png" alt="Logo" draggable="false" />
            </div>
          </div>
          <button className="iconBtn closeBtn" onClick={onClose} aria-label="إغلاق">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
                 stroke="#0f172a" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        </div>

        {/* عناصر التنقل */}
        <nav className="list" aria-label="القائمة">
          {items.map(({ key, label, icon: Icon }) => (
            <a
              key={key}
              href="#"
              className={`item ${active === key ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); onSelect?.(key); onClose?.(); }}
            >
              <span className="icon"><Icon /></span>
              <span className="label">{label}</span>
            </a>
          ))}
        </nav>

        {/* أسفل الشريط */}
        <div className="profileFooter" ref={menuRef}>
          <div className="profileInfo">
            <UserOutline className="avatarIcon" />
            <div className="names">
              <div className="name" title={fullName}>{fullName}</div>
              <div className="sub">ملفي الشخصي</div>
            </div>
          </div>

          <div className="menuWrap">
            <button
              className="iconBtn dotsBtn"
              aria-label="خيارات"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <KebabIcon />
            </button>

            {menuOpen && (
              <div className="menuDropdown" role="menu" aria-label="خيارات الحساب">
                <button className="menuItem" onClick={() => { setMenuOpen(false); onProfile?.(); }}>
                  <span className="miLabel">الملف الشخصي</span>
                </button>

                <button className="menuItem" onClick={() => { setMenuOpen(false); onSettings?.(); }}>
                  <span className="miLabel">الإعدادات</span>
                </button>

                <div className="menuSep" />

                <button className="menuItem danger" onClick={() => { setMenuOpen(false); setConfirmOpen(true); }}>
                  <span className="miLabel">تسجيل الخروج</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ✅ مودال التأكيد */}
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

          <style>{`
            .confirmOverlay {
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,.4);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
            }
            .confirmBox {
              background: #fff;
              padding: 24px 20px;
              border-radius: 14px;
              box-shadow: 0 8px 25px rgba(0,0,0,.15);
              width: 90%;
              max-width: 360px;
              text-align: center;
              font-family: "Tajawal", sans-serif;
            }
            .confirmMessage {
              font-size: 18px;
              margin-bottom: 18px;
              color: #111827;
              font-weight: 600;
            }
            .confirmActions {
              display: flex;
              justify-content: space-between;
              gap: 10px;
            }
            .btnCancel {
              flex:1;
              padding:10px;
              background:#f3f4f6;
              border:1px solid #d1d5db;
              border-radius:8px;
            }
            .btnConfirm {
              flex:1;
              padding:10px;
              background:#ef4444;
              color:white;
              border:none;
              border-radius:8px;
              font-weight:bold;
            }
          `}</style>
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
function KebabIcon(){return(<svg viewBox="0 0 24 24"><g fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></g></svg>);}
