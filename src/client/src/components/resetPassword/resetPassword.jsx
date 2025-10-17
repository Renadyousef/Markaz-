// src/client/src/components/resetPassword/ResetPassword.jsx
import { useState } from "react";
import axios from "axios";
import "./resetPassword.css";
import { validatePassword, validateEmail } from "../auth/validation";
import LandingHeader from "../landingPage/LandingHeader";  // ✅ reuse header
import Footer from "../Header_Footer/Footer";

export default function ResetPassword({ goTo }) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [fieldMessage, setFieldMessage] = useState({
    email: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateEmail(email)) {
      setMessage("❌ الرجاء إدخال بريد إلكتروني صالح.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("❌ كلمتا المرور غير متطابقتين");
      return;
    }
    if (!validatePassword(newPassword)) {
      setMessage("❌ كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، بما في ذلك حرف كبير، رقم، ورمز خاص (!@#$%^&*).");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/ResetRoutes/reset-password", {
        email,
        newPassword,
      });
      if (res.status === 200) {
        setMessage("✅ تم تحديث كلمة المرور بنجاح، الرجاء تسجيل الدخول");
        goTo("auth", "signin");
      }
    } catch (err) {
      setMessage(err.response?.data?.msg || "❌ فشل تحديث كلمة المرور");
    }
  };

  return (
    <div className="page-wrapper landing-header-space">
      {/* ✅ header */}
      <LandingHeader onStart={() => goTo("auth", "signin")} />

      <form className="sign-up-container" onSubmit={handleSubmit}>
        <label htmlFor="email" className="required">البريد الإلكتروني</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {fieldMessage.email && <div className="hint">{fieldMessage.email}</div>}

        <label htmlFor="newPassword" className="required">كلمة المرور الجديدة</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="toggle-btn"
          >
            <i className={showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}></i>
          </button>
        </div>
        {fieldMessage.newPassword && <div className="hint">{fieldMessage.newPassword}</div>}

        <label htmlFor="confirmPassword" className="required">تأكيد كلمة المرور</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {fieldMessage.confirmPassword && <div className="hint">{fieldMessage.confirmPassword}</div>}

        {message && <div className="reset-message">{message}</div>}

        <input type="submit" value="إعادة التعيين" />
      </form>

      <Footer />
    </div>
  );
}