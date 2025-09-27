
import { useEffect, useRef, useState } from "react";
import "./ui.css";

export default function Header({ onMenuClick, sticky }) {
  const [profileOpen, setProfileOpen] = useState(false);//navigation done with state
  const profileRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {//navigation done ?
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

  return (
    <div className={`headerWrap ${sticky ? "isSticky" : ""}`}>
      <div className="headerBar" dir="ltr">
        {/* اليسار: اللوجو */}
        <div className="brand" dir="rtl">
          <div className="logoBox">
            <img src="/logo1.png" alt="شعار مركز" />
          </div>
        </div>

        {/* اليمين: الإشعارات + البروفايل + زر القائمة (بدون بحث) */}
        <div className="headerActions">
       
          {/* زر القائمة */}
          <button className="menuBtn" onClick={onMenuClick} aria-label="فتح القائمة">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
