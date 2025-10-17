import { useState, useEffect } from "react";
import SignUp from "./SignUp";
import SignIn from "./SignIn";
import Footer from '../Header_Footer/Footer'

export default function AuthPage({ setToken, initialTab = "signin" , goTo}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
   <div className="after_footer">  <div className="auth-container">
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
  {activeTab === "signin"
    ? <SignIn setToken={setToken} goTo={goTo} />
    : <SignUp setToken={setToken} goTo={goTo} />}
</div>

    </div>
    </div>
   
  );
}
