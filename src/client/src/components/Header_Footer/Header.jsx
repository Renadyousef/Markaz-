import { useEffect, useRef, useState } from "react";

export default function Header({ onMenuClick, sticky }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // إغلاق المنسدلة عند الضغط برة أو زر Esc
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

  return (
    <div className={`headerWrap ${sticky ? "isSticky" : ""}`}>
      <div className="headerBar" dir="ltr">
        {/* يسار: اللوقو */}
        <div className="brand" dir="rtl">
          <div className="logoBox">
            <img src="/logo.png" alt="شعار مركز" />
          </div>
        </div>

        {/* يمين: البحث + الإشعارات + البروفايل + القائمة */}
        <div className="headerActions">
          {/* البحث (جنب الأيقونات) */}
         <div className="searchBox">
  <input type="text" placeholder="ابحث هنا..." />
  <svg
    className="searchIcon"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    focusable="false"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
</div>


          {/* جرس الإشعارات */}
          <button className="iconBtn" aria-label="الإشعارات">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 6-3 8h18c0-2-3-1-3-8" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          {/* بروفايل */}
          <div className="profileWrapper" ref={profileRef}>
            <button
              className={`iconBtn ${profileOpen ? "active" : ""}`}
              aria-label="الحساب"
              onClick={() => setProfileOpen((v) => !v)}
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              </svg>
            </button>

            {profileOpen && (
              <div className="profileMenu" dir="rtl">
                <div className="profileInfo">
                  <strong>رغد عبدالله</strong>
                  <span>rabdullah12a@gmail.com</span>
                </div>

                <button className="profileItem">
                  <span className="ico">
                    <svg viewBox="0 0 24 24" width="20" height="20"
                         stroke="currentColor" fill="none" strokeWidth="2">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                    </svg>
                  </span>
                  الملف الشخصي
                </button>

                <button className="profileItem">
                  <span className="ico">
                    <svg viewBox="0 0 24 24" width="20" height="20"
                         stroke="currentColor" fill="none" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06
                               a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21
                               a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51
                               1.65 1.65 0 0 0-1.82.33l-.06.06
                               a2 2 0 1 1-2.83-2.83l.06-.06
                               a1.65 1.65 0 0 0 .33-1.82
                               1.65 1.65 0 0 0-1.51-1H3
                               a2 2 0 1 1 0-4h.09
                               a1.65 1.65 0 0 0 1.51-1
                               1.65 1.65 0 0 0-.33-1.82l-.06-.06
                               a2 2 0 1 1 2.83-2.83l.06.06
                               a1.65 1.65 0 0 0 1.82.33H9
                               a1.65 1.65 0 0 0 1-1.51V3
                               a2 2 0 1 1 4 0v.09
                               a1.65 1.65 0 0 0 1 1.51
                               1.65 1.65 0 0 0 1.82-.33l.06-.06
                               a2 2 0 1 1 2.83 2.83l-.06.06
                               a1.65 1.65 0 0 0-.33 1.82V9
                               c0 .69.41 1.3 1.01 1.58.36.16.61.52.61.92s-.25.76-.61.92
                               c-.6.28-1.01.89-1.01 1.58v.01z"/>
                    </svg>
                  </span>
                  الإعدادات
                </button>

                <button className="profileItem logout">
                  <span className="ico">
                    <svg viewBox="0 0 24 24" width="20" height="20"
                         stroke="currentColor" fill="none" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </span>
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>

        
          <button className="menuBtn" onClick={onMenuClick} aria-label="فتح القائمة">
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
