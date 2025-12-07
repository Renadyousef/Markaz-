// src/client/src/components/auth/AuthPage.jsx
import { useState, useEffect } from "react";
import SignUp from "./SignUp";
import SignIn from "./SignIn";
import Footer from "../Header_Footer/Footer";
import LandingHeader from "../landingPage/LandingHeader"; // تأكدي من المسار الصحيح

export default function AuthPage({ setToken: parentSetToken, initialTab = "signin", goTo }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const isSignIn = activeTab === "signin";

  // حالة المودال + التوكن المؤقت + الرسالة
  const [showAuthSuccess, setShowAuthSuccess] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // كومبوننت المودال + الستايل داخله
  const AuthSuccessModal = ({ open, onClose, message }) => {
    if (!open) return null;

    return (
      <>
        <style>{`
          .auth-success-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
          }

          .auth-success-modal {
            background: #fff;
            padding: 24px 32px;
            border-radius: 18px;
            width: 340px;
            max-width: 90%;
            text-align: center;
            font-family: "Cairo", sans-serif;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            animation: auth-pop 0.25s ease;
          }

          .auth-success-modal p {
            font-size: 17px;
            margin-bottom: 18px;
          }

          .auth-success-modal button {
            background: #ff8c42;
            border: none;
            padding: 8px 26px;
            border-radius: 12px;
            color: white;
            cursor: pointer;
            font-size: 16px;
          }

          @keyframes auth-pop {
            from {
              transform: scale(0.8);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>

        <div className="auth-success-backdrop">
          <div className="auth-success-modal" dir="rtl">
            <p>{message}</p>
            <button onClick={onClose}>حسناً</button>
          </div>
        </div>
      </>
    );
  };

  // هذه الدالة تُرسل إلى SignIn و SignUp بدل setToken مباشرة
  const handleAuthToken = (token) => {
    // نخزن التوكن مؤقتًا
    setPendingToken(token);

    // نحدد الرسالة حسب التاب الحالي
    if (isSignIn) {
      setSuccessMessage("تم تسجيل الدخول بنجاح! أهلاً بعودتك إلى مركز.");
    } else {
      setSuccessMessage("تم إنشاء الحساب بنجاح! سيتم تحويلك إلى الصفحة الرئيسية.");
    }

    // نفتح المودال
    setShowAuthSuccess(true);
  };

  // إغلاق المودال ثم تفعيل الجلسة فعليًا
  const handleCloseAuthSuccess = () => {
    setShowAuthSuccess(false);
    if (pendingToken) {
      parentSetToken(pendingToken); // هنا ينتقل المستخدم لباقي الصفحات
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="after_footer">
      <LandingHeader />

      <div className="auth-container" style={{ marginTop: "120px" }}>
        <div className="auth-shell">
          <section
            key={`hero-${isSignIn ? "signin" : "signup"}`}
            className="auth-hero fade-slide-left"
          >
            <h1 className="auth-hero__title">
              مرحباً بك في <span>مركز</span>
            </h1>
            <p className="auth-hero__subtitle">
              هنا تبدأ رحلتك نحو الإبداع بثقة. كل فكرة لها فرصة، وكل خطوة
              تقرّبك من التميز.
              أنشئ حسابك الآن وابدأ رحلتك، أو سجّل دخولك لتكمل طريقك نحو
              النجاح بسهولة وسلاسة.
            </p>
            <button
              type="button"
              className="auth-hero__cta"
              onClick={() => setActiveTab(isSignIn ? "signup" : "signin")}
            >
              {isSignIn ? "إنشاء حساب" : "تسجيل الدخول"}
            </button>
          </section>

          <section className="auth-main">
            <div
              key={`form-${isSignIn ? "signin" : "signup"}`}
              className="auth-form fade-slide-right"
            >
              {isSignIn ? (
                // نرسل handleAuthToken بدل setToken الأصلية
                <SignIn setToken={handleAuthToken} goTo={goTo} />
              ) : (
                <SignUp setToken={handleAuthToken} />
              )}
            </div>
          </section>
        </div>
      </div>

      {/* مودال النجاح المشترك بين تسجيل الدخول وإنشاء الحساب */}
      <AuthSuccessModal
        open={showAuthSuccess}
        onClose={handleCloseAuthSuccess}
        message={successMessage}
      />
    </div>
  );
}
