// Header.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";   // ✅ إضافة
import "./ui.css";

export default function Header({ onMenuClick, sticky }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();               // ✅ إنشاء النافيقيت

  useEffect(() => {
    const onDocClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setProfileOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const goHome = () => {
    navigate("/home"); // ✅ يودّي لمسار الهوم: <Route path="/home/*" ... />
  };

  return (
    <div className={`headerWrap ${sticky ? "isSticky" : ""}`}>
      <div className="headerBar" dir="ltr">
        {/* اليسار: اللوجو */}
        <div className="brand" dir="rtl">
          <button
            type="button"
            className="logoBox"
            onClick={goHome}
            aria-label="الذهاب للصفحة الرئيسية"
            style={{ cursor: "pointer", border: "none", background: "transparent", padding: 0 }}
          >
            <img src="/logo1.png" alt="شعار مركز" />
          </button>
        </div>

        {/* اليمين: زر القائمة */}
        <div className="headerActions">
          <button
            className="menuBtn"
            onClick={onMenuClick}
            aria-label="فتح القائمة"
          >
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
