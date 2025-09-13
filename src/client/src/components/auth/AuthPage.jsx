
import { useState, useEffect } from "react";
import SignUp from "./SignUp";
import SignIn from "./SignIn";

export default function AuthPage({ setToken, initialTab = "signin" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="auth-container">
      <div className="auth-tabs">
        <button
          className={activeTab === "signin" ? "tab active" : "tab"}
          onClick={() => setActiveTab("signin")}
        >
          تسجيل الدخول
        </button>
        <button
          className={activeTab === "signup" ? "tab active" : "tab"}
          onClick={() => setActiveTab("signup")}
        >
          إنشاء حساب
        </button>
      </div>

      <div className="auth-form">
        {activeTab === "signin" ? <SignIn setToken={setToken} /> : <SignUp setToken={setToken} />}
       
      </div>
    </div>
  );
}
