// src/App.jsx
import { useEffect, useState } from "react";
import "./App.css";

/* الصفحات */
import LandingPage from "./components/landingPage/LandingPage";
import AuthPage from "./components/auth/AuthPage";
import SignIn from "./components/auth/SignIn"; 
import HomePage from "./components/homePage/HomePage";
import ProfilePage from "./components/profile/Profile.jsx";



/* الواجهة */
import Header from "./components/Header_Footer/Header";
import Sidebar from "./components/Header_Footer/Sidebar";
import Footer from "./components/Header_Footer/Footer";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  // يبدأ دايمًا من landing
  const [page, setPage] = useState("landing");
  const [authTab, setAuthTab] = useState("signin");

  const goTo = (p, tab = "signin") => {
    if (p === "auth") {
      setPage("auth");
      setAuthTab(tab);
    } else {
      setPage(p);
    }
  };

  const handleLogin = (newToken) => {
    if (newToken) localStorage.setItem("token", newToken);
    setToken(newToken);
    setPage("home"); // بعد تسجيل الدخول يفتح الهوم
  };

  const [open, setOpen] = useState(false);

  // ===== بعد تسجيل الدخول =====
  if (token && page !== "landing" && page !== "auth") {
    return (
      <div className="app-shell">
        {/* الهيدر */}
        <Header onMenuClick={() => setOpen((v) => !v)} />

        <div className="app-body">
          {/* السايدبار */}
          <Sidebar
            open={open}
            onClose={() => setOpen(false)}
            active={page}                 // ✅ يحدد العنصر المفعّل
            onProfile={() => setPage("profile")}
            onSelect={(key) => setPage(key)}
          />

          {/* المحتوى */}
          <main className="content-area">
            {page === "home" && <HomePage token={token} />}
            {page === "profile" && <ProfilePage />}
          </main>
        </div>

        {/* الفوتر */}
        <Footer />
      </div>
    );
  }

  // ===== قبل تسجيل الدخول =====
  return (
    <>
      {page === "landing" && <LandingPage goTo={goTo} />}
      {page === "auth" && (
        <AuthPage
          initialTab={authTab}
          setToken={handleLogin}
          goTo={goTo}
        />
      )}
    </>
  );
}
