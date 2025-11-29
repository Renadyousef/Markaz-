// src/client/src/components/resetPassword/ResetPassword.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "./resetPassword.css";
import { validatePassword, validateEmail } from "../auth/validation";
import LandingHeader from "../landingPage/LandingHeader";  // ✅ reuse header

const OTP_STORAGE_KEY = "resetOtp";

export default function ResetPassword({ goTo }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showMessage = (text, type = "") => {
    setMessage(text);
    setMessageType(type);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(OTP_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) {
          setEmail(parsed.email);
        }
      }
    } catch (error) {
      console.warn("Failed to read OTP cache:", error);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    showMessage("");

    if (!validateEmail(email)) {
      showMessage("الرجاء إدخال بريد إلكتروني صالح.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage("كلمتا المرور غير متطابقتان.", "error");
      return;
    }
    if (!validatePassword(newPassword)) {
      showMessage("كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل مع حرف كبير ورقم ورمز خاص.", "error");
      return;
    }

    const storedOtpRaw = localStorage.getItem(OTP_STORAGE_KEY);
    if (!storedOtpRaw) {
      showMessage("لم يتم العثور على رمز تحقق، أعد الطلب من صفحة نسيت كلمة المرور.", "error");
      return;
    }

    let storedOtp;
    try {
      storedOtp = JSON.parse(storedOtpRaw);
    } catch {
      showMessage("حدثت مشكلة في الرمز المخزن، أعد إرساله.", "error");
      return;
    }

    if (storedOtp.email !== email) {
      showMessage("البريد الإلكتروني لا يطابق الرمز المرسل.", "error");
      return;
    }

    if (Date.now() > storedOtp.expiresAt) {
      showMessage("انتهت صلاحية رمز التحقق، اطلب رمزاً جديداً.", "error");
      return;
    }

    if (storedOtp.otp !== otp.trim()) {
      showMessage("رمز التحقق غير صحيح.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post("http://localhost:5000/ResetRoutes/reset-password", {
        email,
        newPassword,
      });
      if (res.status === 200) {
        showMessage("تم تحديث كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن.", "success");
        localStorage.removeItem(OTP_STORAGE_KEY);
        goTo("auth", "signin");
      }
    } catch (err) {
      showMessage(err.response?.data?.msg || "فشل تحديث كلمة المرور.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="after_footer reset-auth">
      <LandingHeader onStart={() => goTo("auth", "signin")} />

      <div className="landing-header-space reset-auth__body">
        <section className="auth-dual reset-auth__panel fade-slide-right">
          <form className="auth-panel auth-panel--form fade-slide-left" onSubmit={handleSubmit}>
            <div className="auth-panel__head">
              <h2>إعادة تعيين كلمة المرور</h2>
              <p>أدخل الرمز المرسل إلى بريدك ثم اختر كلمة مرور جديدة.</p>
            </div>

            <div className="auth-field">
              <label htmlFor="resetEmail" className="required">البريد الإلكتروني</label>
              <div className="auth-input-shell">
                <span className="auth-input-icon" aria-hidden="true">
                  <i className="fa-regular fa-envelope" />
                </span>
                <input
                  type="email"
                  id="resetEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="otp" className="required">رمز التحقق</label>
              <div className="auth-input-shell">
                <span className="auth-input-icon" aria-hidden="true">
                  <i className="fa-solid fa-key" />
                </span>
                <input
                  type="text"
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  placeholder="أدخل الرمز المكوّن من 6 أرقام"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="newPassword" className="required">كلمة المرور الجديدة</label>
              <div className="auth-input-shell">
                <span className="auth-input-icon" aria-hidden="true">
                  <i className="fa-solid fa-lock" />
                </span>
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
                  className="password-toggle"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  <i className={showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}></i>
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword" className="required">تأكيد كلمة المرور</label>
              <div className="auth-input-shell">
                <span className="auth-input-icon" aria-hidden="true">
                  <i className="fa-solid fa-lock" />
                </span>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {message && (
              <div
                className={`auth-alert ${
                  messageType === "error" ? "error" : "success"
                }`}
              >
                <i
                  className={`fa-solid ${
                    messageType === "error"
                      ? "fa-circle-exclamation"
                      : "fa-circle-check"
                  }`}
                  aria-hidden="true"
                />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              className="auth-primary-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "جاري التحديث..." : "إعادة التعيين"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
