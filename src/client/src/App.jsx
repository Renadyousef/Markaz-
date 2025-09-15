// src/App.jsx
import { useEffect, useState, useCallback } from "react";
import "./App.css";

/* الصفحات */
import LandingPage from "./components/landingPage/LandingPage";
import AuthPage from "./components/auth/AuthPage";
import HomePage from "./components/homePage/HomePage";
import ProfilePage from "./components/profile/Profile.jsx";

/* الواجهة */
import Header from "./components/Header_Footer/Header";
import Sidebar from "./components/Header_Footer/Sidebar";
import Footer from "./components/Header_Footer/Footer";

const TOKEN_KEY = "token";
const PAGE_KEY  = "app:page";
const AUTH_TAB_KEY = "app:authTab";

export default function App() {
  // RTL عام
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  // التوكن
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || null);

  // الصفحة الحالية — منطق البداية:
  // - إذا ما فيه توكن: دايمًا "landing"
  // - إذا فيه توكن: افتح آخر صفحة محفوظة أو "home"
  const [page, setPageState] = useState(() => {
    const hasToken = !!localStorage.getItem(TOKEN_KEY);
    if (!hasToken) return "landing";
    return localStorage.getItem(PAGE_KEY) || "home";
  });

  // تبويب صفحة الأوث (لما تروحين auth)
  const [authTab, setAuthTab] = useState(
    localStorage.getItem(AUTH_TAB_KEY) || "signin"
  );

  // سايدبار
  const [open, setOpen] = useState(false);

  // دالة موحّدة لتغيير الصفحة + تخزينها
  const setPage = useCallback((next) => {
    setPageState(next);
    localStorage.setItem(PAGE_KEY, next);
  }, []);

  // تأكيد وضع البداية عند تغيّر التوكن (مثلاً سجّلتي/سجلتي خروج)
  useEffect(() => {
    if (token) {
      // مسجّلة دخول: لو كنا على landing/auth رجّعينا للهوم
      if (page === "landing" || page === "auth") {
        setPage("home");
      }
    } else {
      // مو مسجّلة دخول: ارجعي للاندنج دائماً
      if (page !== "landing") {
        setPage("landing");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // تنقّل مريح بين الصفحات قبل/بعد الدخول
  const goTo = (p, tab = "signin") => {
    if (p === "auth") {
      setAuthTab(tab);
      localStorage.setItem(AUTH_TAB_KEY, tab);
      setPage("auth");
    } else {
      setPage(p);
    }
  };

  // عند تسجيل الدخول
  const handleLogin = (newToken) => {
    if (newToken) localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setPage("home"); // افتح الهوم
  };

  // مثال: لو بتسوين زر تسجيل خروج في أي مكان
  // خليه يستدعي هذه:
  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    // نفضّل تصفير الصفحة للاندنج (عشان عند الريفرش ما ترجعين صفحات داخلية)
    localStorage.setItem(PAGE_KEY, "landing");
    setToken(null);
    setPage("landing");
  };

  // ===== بعد تسجيل الدخول =====
  if (token && page !== "landing" && page !== "auth") {
    return (
      <div className="app-shell">
        {/* الهيدر */}
        <Header onMenuClick={() => setOpen((v) => !v)} onLogout={handleLogout} />

        <div className="app-body">
          {/* السايدبار */}
          <Sidebar
            open={open}
            onClose={() => setOpen(false)}
            active={page}
            onProfile={() => setPage("profile")}
            onSelect={(key) => setPage(key)} // من السايدبار: home/tasks/... الخ
            onLogout={handleLogout}
          />

          {/* المحتوى */}
          <main className="content-area">
            {page === "home" && <HomePage token={token} />}
            {page === "profile" && <ProfilePage />}
            {/* صفحات لاحقاً:
              {page === "tasks" && <TasksPage />}
              {page === "plans" && <PlansPage />}
              {page === "quizzes" && <QuizzesPage />}
              {page === "cards" && <FlashcardsPage />}
              {page === "sessions" && <SessionsPage />}
              {page === "progress" && <ProgressPage />}
              {page === "chat" && <ChatPage />}
            */}
          </main>
        </div>

        {/* الفوتر */}
        <Footer />
      </div>
    );
  }

  // ===== قبل تسجيل الدخول =====
  // دائماً نبدأ بالـ Landing، ولو احتجتي شاشة auth نروح لها
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
