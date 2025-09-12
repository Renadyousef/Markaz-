// src/App.jsx
import { useEffect, useState } from "react";
import "./App.css";

// المكونات
import Header from "./components/Header_Footer/Header";
import Sidebar from "./components/Header_Footer/Sidebar";
import Footer from "./components/Header_Footer/Footer";
import HomePage from "./components/homePage/HomePage";
import SignIn from "./components/auth/SignIn";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  return token ? (
    <div className="app-shell">
      {/* الهيدر */}
      <Header onMenuClick={() => setOpen(!open)} />

      <div className="app-body">
        {/* السايدبار */}
        <Sidebar open={open} onClose={() => setOpen(false)} />

        {/* الصفحة الرئيسية */}
        <main className="content-area">
          <HomePage token={token} />
        </main>
      </div>

      {/* الفوتر */}
      <Footer />
    </div>
  ) : (
    <SignIn setToken={setToken} />
  );
}
