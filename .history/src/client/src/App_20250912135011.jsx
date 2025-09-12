import "./App.css";
import { useMemo, useState, useEffect } from "react";

import HomePage from "./components/homePage/HomePage";
import SignIn from "./components/auth/SignIn";               // ✅ مفقود

// ✅ مكوّنات الإطار
import Header from "./components/Header_Footer/Header";
import Sidebar from "./components/Header_Footer/Sidebar";
import Footer from "./components/Header_Footer/Footer";

// (اختياري) تفعيل RTL للتطبيق كله
function useRTL() {
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);
}

export default function App() {
  useRTL();

  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const [active, setActive] = useState("home");  // الصفحة الحالية

  const pageEl = useMemo(() => {
    switch (active) {
      case "home":
      default:
        return <HomePage token={token} />;
    }
  }, [active, token]);

  return token ? (
    <>
      {/* هيدر ثابت */}
      <Header onToggleSidebar={() => setOpen((v) => !v)} />  {/* ✅ اسم prop الصحيح */}

      {/* صفحة مع سايدبار + محتوى */}
      <div className="appShell">
        <Sidebar
          open={open}
          onClose={() => setOpen(false)}                     {/* ✅ لزر الإغلاق/الضغط خارجًا */}
          active={active}
          onSelect={setActive}
        />
        <main className="appContent">{pageEl}</main>
      </div>

      {/* فوتر */}
      <Footer />
    </>
  ) : (
    <SignIn setToken={setToken} />
  );
}
