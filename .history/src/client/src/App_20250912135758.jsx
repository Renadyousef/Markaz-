import "./App.css";
import { useEffect, useMemo, useState } from "react";

// الصفحات
import LandingPage from "./components/landingPage/LandingPage";
import SignUp from "./components/auth/SignUp";
import SignIn from "./components/auth/SignIn";
import HomePage from "./components/homePage/HomePage";

// مكونات الإطار
import Header from "./components/Header_Footer/Header";
import Sidebar from "./components/Header_Footer/Sidebar";
import Footer from "./components/Header_Footer/Footer";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [active, setActive] = useState("home"); // الصفحة الحالية

  // ✅ RTL للتطبيق كله
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  // ✅ تحديد الصفحة المعروضة حسب active
  const pageEl = useMemo(() => {
    switch (active) {
      case "home":
      default:
        return <HomePage token={token} />;
    }
  }, [active, token]);

  return token ? (
    <>
      {/* هيدر */}
      <Header />

      {/* واجهة التطبيق مع السايدبار */}
      <div className="appShell">
        <Sidebar active={active} onSelect={setActive} />
        <main className="appContent">{pageEl}</main>
      </div>

      {/* فوتر */}
      <Footer />
    </>
  ) : (
    <SignIn setToken={setToken} />
  );
}
