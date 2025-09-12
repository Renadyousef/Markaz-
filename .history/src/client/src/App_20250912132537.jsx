// App.js (الإصدار الموحّد مثل الأولى مع منطق تسجيل الدخول)
import { useEffect, useMemo, useState } from "react";
import "./ui.css";

// القشرة
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

// الصفحات
import HomePage from "./components/homePage/HomePage";
import SignIn from "./components/auth/SignIn";
// (اختياري) لو عندك صفحات ثانية أضيفيها هنا
// import SignUp from "./components/auth/SignUp";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [open, setOpen] = useState(false);         // فتح/إغلاق السايدبار
  const [active, setActive] = useState("home");    // الصفحة النشطة

  // RTL عام
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  // محتوى الصفحة حسب "active"
  const pageEl = useMemo(() => {
    switch (active) {
      case "home":
        return <HomePage token={token} />; // نفس مسار نسختك الثانية
      // case "tasks": return <TasksPage />;
      // case "plan":  return <PlanPage />;
      default:
        return <Placeholder title="قريبًا" desc="هذه الصفحة قيد التطوير." />;
    }
  }, [active, token]);

  // لو ما فيه توكن => نعرض شاشة الدخول فقط
  if (!token) {
    return (
      <SignIn
        setToken={(t) => {
          // خزّني التوكن وثبتي الحالة
          localStorage.setItem("token", t);
          setToken(t);
        }}
      />
    );
  }

  // فيه توكن => أعرض القشرة الكاملة مع السايدبار
  return (
    <div className="shell">
      <Header
        onMenuClick={() => setOpen(true)}
        // (اختياري) زر تسجيل خروج لو حبيتي:
        // onSignOut={() => { localStorage.removeItem("token"); setToken(null); }}
      />

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

/* بطاقة عنصر افتراضي (لو اخترتي صفحة غير موجودة لسه) */
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
