// src/App.jsx
import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";

/* الصفحات الرئيسية / الميزات */
import LandingPage from "./components/landingPage/LandingPage";
import LandingHeader from "./components/landingPage/LandingHeader";
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
const PAGE_KEY = "app:page";       // باقي معرف، حتى لو ما نستخدمه بعد التحويل للراوتر
const AUTH_TAB_KEY = "app:authTab";

export default function App() {
  /* ===== إعداد RTL ===== */
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  /* ===== حالة التوكن ===== */
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || null);

  /* تبويب صفحة الأوث (تسجيل الدخول / إنشاء حساب) */
  const [authTab, setAuthTab] = useState(
    localStorage.getItem(AUTH_TAB_KEY) || "signin"
  );

  /* ===== السايدبار ===== */
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  /* ===== دالة تنقّل عامة قبل تسجيل الدخول (landing/auth/forgot/reset) ===== */
  const goTo = (p, tab = "signin") => {
    if (p === "auth") {
      // نحدد التاب الافتراضي داخل صفحة الأوث
      setAuthTab(tab);
      localStorage.setItem(AUTH_TAB_KEY, tab);
      navigate("/auth");
    } else if (p === "landing") {
      navigate("/");
    } else if (p === "forgot") {
      navigate("/forgot");
    } else if (p === "reset") {
      navigate("/reset");
    } else {
      // أي قيمة أخرى نمررها مباشرة للمسار
      navigate(p);
    }
  };

  /* عند تسجيل الدخول */
  const handleLogin = (newToken) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
    }
    // بعد تسجيل الدخول نرجع للهوم (نفس المسار الرئيسي)
    navigate("/", { replace: true });
  };

  /* تسجيل الخروج */
  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(PAGE_KEY, "landing");
    setToken(null);
    // نرجع للاندنق
    navigate("/", { replace: true });
  };

  /* ===================================================================
     ======================= بعد تسجيل الدخول ===========================
     =================================================================== */
  if (token) {
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
            onProfile={() => navigate("/profile")}
            onLogout={handleLogout}
          />

          {/* المحتوى: الآن كل الصفحات تشتغل عن طريق Routes فقط */}
          <main className="content-area">
            <Routes>
              {/* الصفحة الرئيسية (الهوم) - فيها Routes داخلية خاصة فيها مثل upload وغيرها */}
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
              {/* لو احتجتيه لاحقاً */}
              <Route path="/cards-raw" element={<FlashCards />} />

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
      <Routes>
        {/* صفحة اللاندنق */}
        <Route path="/" element={<LandingPage goTo={goTo} />} />

        {/* صفحة الأوث (تسجيل الدخول / إنشاء حساب) */}
        <Route
          path="/auth"
          element={
            <AuthPage
              initialTab={authTab}
              setToken={handleLogin}
              goTo={goTo}
            />
          }
        />

        {/* نسيت كلمة المرور */}
        <Route path="/forgot" element={<ForgotPassword goTo={goTo} />} />

        {/* إعادة تعيين كلمة المرور */}
        <Route path="/reset" element={<ResetPassword goTo={goTo} />} />

        {/* صفحات الفوتر قبل الدخول + هيدر اللاندنق */}
        <Route
          path="/about"
          element={
            <>
              <LandingHeader />
              <About />
            </>
          }
        />
        <Route
          path="/privacy"
          element={
            <>
              <LandingHeader />
              <Privacy />
            </>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              <LandingHeader />
              <Contact />
            </>
          }
        />

        {/* أي مسار غريب قبل الدخول → يرجع للّاندنق */}
        <Route path="*" element={<LandingPage goTo={goTo} />} />
      </Routes>

      {/* ✅ هنا التعديل المهم: نمرر goTo للفوتر عشان زر "ابدأ" يشتغل */}
      <Footer goTo={goTo} />
    </>
  );
}
