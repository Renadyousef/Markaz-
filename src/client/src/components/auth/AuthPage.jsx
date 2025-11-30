// src/client/src/components/auth/AuthPage.jsx
import { useState, useEffect } from "react";
import SignUp from "./SignUp";
import SignIn from "./SignIn";
import Footer from "../Header_Footer/Footer";
import LandingHeader from "../landingPage/LandingHeader"; // تأكدي من المسار الصحيح

export default function AuthPage({ setToken, initialTab = "signin", goTo }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const isSignIn = activeTab === "signin";

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="after_footer">
      {/* ما عاد نرسل goTo هنا */}
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
                <SignIn setToken={setToken} goTo={goTo} />
              ) : (
                <SignUp setToken={setToken} />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
