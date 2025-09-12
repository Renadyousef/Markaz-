// src/App.jsx
import { useEffect, useState } from "react";
import "./App.css";

/* الصفحات */
import LandingPage from "./components/landingPage/LandingPage";
import AuthPage from "./components/auth/AuthPage";
import SignIn from "./components/auth/SignIn"; // احتياطي إن احتجتيه بمفرده
import HomePage from "./components/homePage/HomePage";

/* هيكل الواجهة */
import Header from "./components/Header_Footer/Header";
import Sidebar from "./components/Header_Footer/Sidebar";
import Footer from "./components/Header_Footer/Footer";

export default function App() {
  // ===== حالة التوكن =====
  const [token, setToken] = useState(
    localStorage.getItem("token") || null
  );

  // ===== تنسيق RTL عام =====
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  // ===== تنقّل قبل تسجيل الدخول =====
  // القيم الممكنة: "landing" | "auth"
  const [page, setPage] = useState("landing");
  // تبويب صفحة المصادقة: "signin" | "signup"
  const [authTab, setAuthTab] = useState("signin");

  // دالة تنقّل عامة قبل تسجيل الدخول
  const goTo = (p, tab = "signin") => {
    if (p === "auth") {
      setPage("auth");
      setAuthTab(tab);
    } else {
      setPage(p);
    }
  };

  // عند نجاح الدخول: خزني التوكن وادخلي للـHome (الـShell بيظهر تلقائي)
  const handleLogin = (newToken) => {
    try {
      if (newToken) localStorage.setItem("token", newToken);
    } catch (_) {
      // في حال المتصفح يمنع التخزين المحلي
    }
    setToken(newToken);
  };

  // ===== هيكل الواجهة بعد تسجيل الدخول =====
  const [open, setOpen] = useState(false); // فتح/إغلاق السايدبار

  if (token) {
    return (
      <div className="app-shell">
        {/* الهيدر */}
        <Header onMenuClick={() => setOpen((v) => !v)} />

        <div className="app-body">
          {/* السايدبار */}
          <Sidebar open={open} onClose={() => setOpen(false)} />

          {/* الصفحة الرئيسية داخل المحتوى */}
          <main className="content-area">
            <HomePage token={token} />
          </main>
        </div>

        {/* الفوتر */}
        <Footer />
      </div>
    );
  }

  // ===== واجهات قبل تسجيل الدخول =====
  return (
    <>
      {page === "landing" && <LandingPage goTo={goTo} />}
      {page === "auth" && (
        <AuthPage
          initialTab={authTab}
          setToken={handleLogin}
          goTo={goTo} // مفيد للرجوع للـLanding إذا احتجتي زر "رجوع"
        />
      )}
    </>
  );
}
