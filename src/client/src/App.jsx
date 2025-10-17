// src/App.jsx
import { useEffect, useState, useCallback } from "react";
import { Routes, Route } from "react-router-dom"; // ⬅️ إضافة الراوتر للصفحات العامة
import "./App.css";
import ViewQuizzes from "./components/ViewQuizzesPage.jsx";

/* الصفحات */
import LandingPage from "./components/landingPage/LandingPage";
import AuthPage from "./components/auth/AuthPage";
import HomePage from "./components/homePage/HomePage";
import ProfilePage from "./components/profile/Profile.jsx";
import ResetPassword from "./components/resetPassword/resetPassword.jsx";
import ForgotPassword from "./components/resetPassword/ForgotPassword.jsx";
import StudySessionSetup from "./components/studySession/StudySessionSetup.jsx";
import StudySessionTimer from "./components/studySession/StudySessionTimer.jsx";

/* صفحات الفوتر */
import About from "./components/Header_Footer/About.jsx";
import Contact from "./components/Header_Footer/Contact.jsx";
import Privacy from "./components/Header_Footer/Privacy.jsx";

/* ✅ صفحات تشغيل الميزات (إضافة فقط) */
import StudyPlansPage   from "./components/Pages/StudyPlansPage.jsx";
import QuizPage         from "./components/Pages/QuizPage.jsx";
import FlashcardsPage   from "./components/Pages/FlashcardsPage.jsx";
import ChatAI           from "./components/Pages/ChatAI.jsx";
import SessionsPage from "./components/Pages/SessionsPage.jsx";
import QuizWithTTS from "./components/Pages/QuizWithTTS.jsx";
import FlashCardView from "./components/FlashCards/FlashCardView.jsx";
import DeckView from "./components/FlashCards/DeckView";

/* الواجهة */
import Header from "./components/Header_Footer/Header";
import Sidebar from "./components/Header_Footer/Sidebar";
import Footer from "./components/Header_Footer/Footer";

const TOKEN_KEY = "token";
const PAGE_KEY  = "app:page";
const AUTH_TAB_KEY = "app:authTab";

export default function App() {
  // RTL #
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
  onProfile={() => setPage("profile")}
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

        {/* ✅ Routes لصفحات الفوتر — تعمل مع <Link> في Footer */}
        <Routes>
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contact" element={<Contact />} />
         <Route path="/sessions" element={<SessionsPage />} />
        </Routes>

        {/* ✅ Routes تشغيلية لإتاحة “ابدأ الآن” وتحديد السايدبار (إضافة فقط) */}
        <Routes>
          <Route path="/home/*" element={<HomePage token={token} />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/plans"   element={<StudyPlansPage />} />
          <Route path="/quizzes" element={<ViewQuizzes/>} />
          <Route path="/cards"   element={<FlashcardsPage />} />
          <Route path="/chat"    element={<QuizWithTTS />} />
          <Route path="/flashcards" element={<FlashCardView />} />
          <Route path="/cards/deck/:deckId" element={<DeckView />} />
           <Route path="/session-setup" element={<StudySessionSetup />} />
             <Route path="/session-timer" element={<StudySessionTimer />} />


        </Routes>

        {/* الفوتر (بدون onNav) */}
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
             {page === "forgot" && <ForgotPassword goTo={goTo} />}
             {page === "reset" && <ResetPassword goTo={goTo} />}

      {/* ✅ Routes لصفحات الفوتر قبل الدخول */}
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      {/* الفوتر (بدون onNav) */}
      <Footer />
    </>
  );
}
