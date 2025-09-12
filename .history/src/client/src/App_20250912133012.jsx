// src/App.jsx
import { useEffect, useMemo, useState } from "react";

// ✅ ui.css داخل components/Header_Footer
import "./components/Header_Footer/ui.css";

// (اختياري) ستايل عام للتطبيق
import "./App.css";

// ✅ هذه الملفات داخل نفس المجلد Header_Footer
import Header from "./components/Header_Footer/Header";
import Sidebar from "./components/Header_Footer/Sidebar";
import Footer from "./components/Header_Footer/Footer";

// ✅ الصفحة الرئيسية داخل homePage
import HomePage from "./components/homePage/HomePage";

// صفحة الدخول
import SignIn from "./components/auth/SignIn";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");

  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  const pageEl = useMemo(() => {
    switch (active) {
      case "home":
        return <HomePage token={token} />;
      default:
        return <Placeholder title="قريبًا" desc="هذه الصفحة قيد التطوير." />;
    }
  }, [active, token]);

  // لو ما فيه توكن → صفحة الدخول فقط
  if (!token) {
    return (
      <SignIn
        setToken={(t) => {
          localStorage.setItem("token", t);
          setToken(t);
        }}
      />
    );
  }

  // فيه توكن → القشرة الكاملة مع السايدبار
  return (
    <div className="shell">
      <Header onMenuClick={() => setOpen(true)} />
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
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#0f172a" }}>
          {title}
        </h1>
        <p style={{ marginTop: 10, color: "#64748b" }}>{desc}</p>
      </div>
    </div>
  );
}
