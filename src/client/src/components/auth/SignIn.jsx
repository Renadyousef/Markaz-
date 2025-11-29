import { validateEmail } from "./validation";
import { useState } from "react";
import axios from "axios";

export default function SignIn({ setToken , goTo }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = event.target.email.value.trim();
    const password = event.target.password.value;

    if (!validateEmail(email)) {
      setErrorMessage("الرجاء إدخال بريد إلكتروني صالح.");
      return;
    }

    if (!password) {
      setErrorMessage("الرجاء إدخال كلمة المرور.");
      return;
    }

    setErrorMessage("");

    try {
      const res = await axios.post("http://localhost:5000/auth/login", { email, password });
      const token = res.data.token;
      localStorage.setItem("token", token);
      setToken(token);
      alert("تم تسجيل الدخول بنجاح!");
    } catch (error) {
      setErrorMessage(error.response?.data?.msg || "حدث خطأ أثناء تسجيل الدخول");//this where error rises
    }
  };

  return (
    <section className="auth-dual">
      <form className="auth-panel auth-panel--form" onSubmit={handleSubmit}>
        <div className="auth-panel__head">
          <h2>تسجيل الدخول</h2>
          <p>استخدم بريدك وكلمة المرور للدخول إلى حسابك.</p>
        </div>

        <div className="auth-field">
          <label htmlFor="email" className="required">البريد الإلكتروني</label>
          <div className="auth-input-shell">
            <span className="auth-input-icon" aria-hidden="true">
              <i className="fa-regular fa-envelope" />
            </span>
            <input
              required
              type="email"
              name="email"
              id="email"
              placeholder="example@email.com"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="password" className="required">كلمة المرور</label>
          <div className="auth-input-shell">
            <span className="auth-input-icon" aria-hidden="true">
              <i className="fa-solid fa-lock" />
            </span>
            <input
              required
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              <i className={showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"} />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="auth-alert error">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="auth-actions">
          <button type="button" className="text-link" onClick={() => goTo("forgot")}>
            هل نسيت كلمة المرور؟
          </button>
        </div>

        <button type="submit" className="auth-primary-btn">تسجيل الدخول</button>
      </form>
    </section>
  );
}
