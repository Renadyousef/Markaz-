// src/App.jsx
import { useEffect, useState, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";

/* الصفحات الرئيسية / الميزات */
import LandingPage from "./components/landingPage/LandingPage";
import AuthPage from "./components/auth/AuthPage";
import HomePage from "./components/homePage/HomePage";
import ProfilePage from "./components/profile/Profile.jsx";
import ResetPassword from "./components/resetPassword/resetPassword.jsx";
import ForgotPassword from "./components/resetPassword/ForgotPassword.jsx";
import StudySessionSetup from "./components/studySession/StudySessionSetup.jsx";
import StudySessionTimer from "./components/studySession/StudySessionTimer.jsx";
import ChatBot from "./components/ChatBot.jsx";
import ViewQuizzes from "./components/ViewQuizzesPage.jsx";

/* صفحات الفوتر */
import About from "./components/Header_Footer/About.jsx";
import Contact from "./components/Header_Footer/Contact.jsx";
import Privacy from "./components/Header_Footer/Privacy.jsx";

/* صفحات تشغيل الميزات */
import StudyPlansPage from "./components/Pages/StudyPlansPage.jsx";
import QuizPage from "./components/Pages/QuizPage.jsx";
import FlashcardsPage from "./components/Pages/FlashcardsPage.jsx";
import ChatAI from "./components/Pages/ChatAI.jsx";
import SessionsPage from "./components/Pages/SessionsPage.jsx";
import QuizWithTTS from "./components/Pages/QuizWithTTS.jsx";
import FlashCardView from "./components/FlashCards/FlashCardView.jsx";
import DeckView from "./components/FlashCards/DeckView";
import FlashCards from "./components/FlashCards/FlashCards.jsx";
import AllStudyPlans from "./components/StudyPlan/AllStudyPlans.jsx";
import CreateStudyPlan from "./components/StudyPlan/CreateStudyPlan.jsx";
import ViewStudyPlan from "./components/StudyPlan/ViewStudyPlan.jsx";
import ProgressPage from "./components/trackProgress/ProgressPage.jsx";

/* الواجهة العامة */
import Header from "./components/Header_Footer/Header";
import Sidebar from "./components/Header_Footer/Sidebar";
import Footer from "./components/Header_Footer/Footer";

const TOKEN_KEY = "token";
const PAGE_KEY = "app:page";
const AUTH_TAB_KEY = "app:authTab";

export default function App() {
  /* ===== إعداد RTL ===== */
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  /* ===== حالة التوكن ===== */
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || null);

  /* ===== الصفحة المنطقية (قبل الدخول فقط) ===== */
  const [page, setPageState] = useState(() => {
    const hasToken = !!localStorage.getItem(TOKEN_KEY);
    if (!hasToken) return "landing";
    return localStorage.getItem(PAGE_KEY) || "home";
  });

  const [authTab, setAuthTab] = useState(
    localStorage.getItem(AUTH_TAB_KEY) || "signin"
  );

  /* ===== السايدبار ===== */
  const [open, setOpen] = useState(false);

  const setPage = useCallback((next) => {
    setPageState(next);
    localStorage.setItem(PAGE_KEY, next);
  }, []);

  /* لما يتغير التوكن نضبط وضع البداية */
  useEffect(() => {
    if (token) {
      if (page === "landing" || page === "auth") {
        setPage("home");
      }
    } else {
      if (page !== "landing") {
        setPage("landing");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* تنقل قبل الدخول (landing/auth/forgot/reset) */
  const goTo = (p, tab = "signin") => {
    if (p === "auth") {
      setAuthTab(tab);
      localStorage.setItem(AUTH_TAB_KEY, tab);
      setPage("auth");
    } else {
      setPage(p);
    }
  };

  /* عند تسجيل الدخول */
  const handleLogin = (newToken) => {
    if (newToken) localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setPage("home");
  };

  /* تسجيل الخروج */
  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(PAGE_KEY, "landing");
    setToken(null);
    setPage("landing");
  };

  /* ===================================================================
     ======================= بعد تسجيل الدخول ===========================
     =================================================================== */
  if (token && page !== "landing" && page !== "auth") {
    return (
      <div className="app-shell">
        {/* الهيدر */}
        <Header
          onMenuClick={() => setOpen((v) => !v)}
          onLogout={handleLogout}
        />

        <div className="app-body">
          {/* السايدبار */}
          <Sidebar
            open={open}
            onClose={() => setOpen(false)}
            onProfile={() => setPage("profile")} // ما يؤثر على العرض الآن، بس نخليه لو تحتاجينه منطقياً
            onLogout={handleLogout}
          />

          {/* المحتوى: الآن كل الصفحات تشتغل عن طريق Routes فقط */}
          <main className="content-area">
            <Routes>
              {/* الصفحة الرئيسية */}
              <Route path="/" element={<HomePage token={token} />} />
              <Route path="/home/*" element={<HomePage token={token} />} />

              {/* الملف الشخصي */}
              <Route path="/profile" element={<ProfilePage />} />

              {/* الخطط الدراسية */}
              <Route path="/plans" element={<StudyPlansPage />} />
              <Route path="/plans/create" element={<CreateStudyPlan />} />
              <Route path="/plans/all" element={<AllStudyPlans />} />
              <Route path="/plans/view" element={<ViewStudyPlan />} />

              {/* الاختبارات / النتائج */}
              <Route path="/quizzes" element={<ViewQuizzes />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/quiz-tts" element={<QuizWithTTS />} />

              {/* البطاقات التعليمية */}
              <Route path="/cards" element={<FlashcardsPage />} />
              <Route path="/flashcards" element={<FlashCardView />} />
              <Route path="/cards/deck/:deckId" element={<DeckView />} />
              {/* <Route path="/cards-raw" element={<FlashCards />} /> لو احتجتيه لاحقاً */}

              {/* جلسات المذاكرة */}
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/session-setup" element={<StudySessionSetup />} />
              <Route path="/session-timer" element={<StudySessionTimer />} />

              {/* التقدم */}
              <Route path="/progress" element={<ProgressPage />} />

              {/* الدردشة بالذكاء الاصطناعي */}
              <Route path="/chat" element={<ChatBot />} />
              <Route path="/chat-ai" element={<ChatAI />} />

              {/* صفحات الفوتر أثناء تسجيل الدخول */}
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/contact" element={<Contact />} />

              {/* مسار افتراضي: أي مسار غير معروف يرجع للهوم */}
              <Route path="*" element={<HomePage token={token} />} />
            </Routes>
          </main>
        </div>

        {/* الفوتر */}
        <Footer />
      </div>
    );
  }

  /* ===================================================================
     ======================= قبل تسجيل الدخول ===========================
     =================================================================== */
  return (
    <>
      {page === "landing" && <LandingPage goTo={goTo} />}

      {page === "auth" && (
        <AuthPage initialTab={authTab} setToken={handleLogin} goTo={goTo} />
      )}

      {page === "forgot" && <ForgotPassword goTo={goTo} />}

      {page === "reset" && <ResetPassword goTo={goTo} />}

      {/* Routes لصفحات الفوتر قبل الدخول */}
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      <Footer />
    </>
  );
}
