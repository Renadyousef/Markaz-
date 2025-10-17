import { useState } from "react";
import axios from "axios";
import "./resetPassword.css";
import LandingHeader from "../landingPage/LandingHeader";

export default function ForgotPassword({ goTo }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:5000/ResetRoutes/forgot-password",
        { email }
      );

      if (res.status === 200) {
        setMessage("✅ تحققنا من البريد، تابع لإعادة التعيين");
        goTo?.("reset"); // ينتقل لصفحة إعادة التعيين
      }
    } catch (err) {
      console.error("ForgotPassword error:", err.response || err.message);
      setMessage(err.response?.data?.msg || "❌ فشل التحقق من البريد");
    }
  };

  return (
    <div className="page-wrapper landing-header-space">
      {/* الهيدر */}
      <LandingHeader goTo={goTo} />

      <form className="sign-up-container" onSubmit={handleSubmit}>
        <label htmlFor="email" className="required">أدخل بريدك الإلكتروني</label>
        <input
          type="email"
          id="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {message && <div className="reset-message">{message}</div>}

        <input type="submit" value="تحقق" />
      </form>
    </div>
  );
}