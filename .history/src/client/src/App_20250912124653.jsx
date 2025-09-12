import { useEffect, useMemo, useState } from "react";
import "./App.css";

/* ستايل الهيدر/السايدبار/الفوتر */
import "./components/Header_Footer/ui.css";

/* مكونات الواجهة */
import Header from "./components/Header_Footer/Header";
import Sidebar from "./components/Header_Footer/Sidebar";
import Footer from "./components/Header_Footer/Footer";

/* الصفحات */
import HomePage from "./components/homePage/HomePage";
import LandingPage from "./components/landingPage/LandingPage";
import SignUp from "./components/auth/SignUp";
import SignIn from "./components/auth/SignIn";

/* ———————————————————————————————— */
/*                App.jsx              */
/* ———————————————————————————————— */
export default function App() {
  // حالة المصادقة
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // واجهة auth: signin | signup | landing
  const [authView, setAuthView] = useState("signin");

  // حالة الـ Shell (بعد تسجيل الدخول)
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");

  // RTL عام
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  // راقب تغيّر التوكن إذا تغيّر من تبويب/كود آخر
  useEffect(() => {
    const onStorage = () => {
      const t = localStorage.getItem("token");
      setToken(t || null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ✅ تأكيد الخروج
  const handleLogout = () => {
    const ok = window.confirm("هل أنت متأكد أنك تريد تسجيل الخروج؟");
    if (!ok) return;
    // امسح بيانات الجلسة
    localStorage.removeItem("token");
    setToken(null);
    setActive("home");
    setAuthView("signin");
  };

  // صفحة المحتوى داخل الـ Shell
  const pageEl = useMemo(() => {
    switch (active) {
      case "home":
        return <HomePage token={token} />;
      default:
        return <Placeholder title="قريبًا" desc="هذه الصفحة قيد التطوير." />;
    }
  }, [active, token]);

  /* ========= حالتان: مع توكن / بدون توكن ========= */
  if (!token) {
    // شاشات ما قبل الدخول
    return (
      <AuthScreens
        view={authView}
        onSwitch={setAuthView}
        onSignedIn={(t) => {
          if (t) localStorage.setItem("token", t);
          setToken(t || localStorage.getItem("token") || null);
        }}
      />
    );
  }

  // بعد الدخول: أعرض الـ Shell الكامل
  return (
    <div className="shell">
      <Header onMenuClick={() => setOpen(true)} onLogout={handleLogout} />

      <Sidebar
        open={open}
        active={active}
        onClose={() => setOpen(false)}
        onSelect={(key) => {
          setActive(key);
          setOpen(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <main className="content-area">{pageEl}</main>
      <Footer />
    </div>
  );
}

/* ———————————————————————————————— */
/*        شاشات ما قبل الدخول          */
/* ———————————————————————————————— */
function AuthScreens({ view, onSwitch, onSignedIn }) {
  if (view === "landing") {
    return (
      <div>
        <LandingPage />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button className="btn" onClick={() => onSwitch("signin")}>
            تسجيل الدخول
          </button>
          <button className="btn" onClick={() => onSwitch("signup")} style={{ marginInlineStart: 8 }}>
            إنشاء حساب
          </button>
        </div>
      </div>
    );
  }

  if (view === "signup") {
    return (
      <SignUp
        onSuccess={(t) => onSignedIn(t)}
        onHaveAccount={() => onSwitch("signin")}
      />
    );
  }

  // الافتراضي: SignIn
  return (
    <SignIn
      setToken={(t) => onSignedIn(t)}
      onCreateAccount={() => onSwitch("signup")}
      onBack={() => onSwitch("landing")}
    />
  );
}

/* ———————————————————————————————— */
/*        Placeholder داخلي بسيط        */
/* ———————————————————————————————— */
function Placeholder({ title, desc }) {
  return (
    <div className="mx-auto" style={{ maxWidth: 960, padding: "40px 16px" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          padding: 24,
          boxShadow: "0 16px 40px rgba(15,23,42,.08)",
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            margin: 0,
            color: "#0f172a",
          }}
        >
          {title}
        </h1>
        <p style={{ marginTop: 10, color: "#64748b" }}>{desc}</p>
      </div>
    </div>
  );
}
