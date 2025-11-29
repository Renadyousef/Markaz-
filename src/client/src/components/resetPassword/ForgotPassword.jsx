import { useState } from "react";
import axios from "axios";
import emailjs from "@emailjs/browser";
import "./resetPassword.css";
import LandingHeader from "../landingPage/LandingHeader";
import { validateEmail } from "../auth/validation";

const OTP_STORAGE_KEY = "resetOtp";
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const persistOtp = (email, otp) => {
  localStorage.setItem(
    OTP_STORAGE_KEY,
    JSON.stringify({
      email,
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
    })
  );
};

export default function ForgotPassword({ goTo }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSending, setIsSending] = useState(false);

  const showMessage = (text, type = "") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showMessage("");

    if (!validateEmail(email)) {
      showMessage("الرجاء إدخال بريد إلكتروني صالح.", "error");
      return;
    }

    if (
      !EMAILJS_SERVICE_ID ||
      !EMAILJS_TEMPLATE_ID ||
      !EMAILJS_PUBLIC_KEY
    ) {
      showMessage(
        "يرجى إعداد بيانات EmailJS (الخدمة، القالب، المفتاح العام) قبل المتابعة.",
        "error"
      );
      return;
    }

    setIsSending(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/ResetRoutes/forgot-password",
        { email }
      );

      if (res.status === 200) {
        const otpCode = generateOtp();
        persistOtp(email, otpCode);

        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: email,
            otp_code: otpCode,
          },
          EMAILJS_PUBLIC_KEY
        );

        showMessage("تم إرسال رمز التحقق إلى بريدك المسجل.", "success");
        goTo?.("reset");
      }
    } catch (err) {
      console.error("ForgotPassword error:", err.response || err.message);
      showMessage(
        err.response?.data?.msg ||
          "فشل إرسال رمز التحقق، حاول مرة أخرى لاحقاً.",
        "error"
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="after_footer reset-auth">
      <LandingHeader goTo={goTo} />

      <div className="landing-header-space reset-auth__body">
        <section className="auth-dual reset-auth__panel fade-slide-right">
          <form className="auth-panel auth-panel--form fade-slide-left" onSubmit={handleSubmit}>
            <div className="auth-panel__head">
              <h2>استعادة كلمة المرور</h2>
              <p>أدخل بريدك وسنرسل رمز تحقق صالحاً لخمسة دقائق.</p>
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
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              disabled={isSending}
            >
              {isSending ? "جاري الإرسال..." : "إرسال الرمز"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
