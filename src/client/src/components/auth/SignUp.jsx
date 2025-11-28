import { useState } from "react";
import { validatePassword, validateName, validateEmail } from "./validation";
import axios from "axios";

export default function SignUp({ setToken }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldMessage, setFieldMessage] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  // On Submit, validate all fields and send form to backend
  const handleSubmit = async (event) => {
    event.preventDefault();

    const firstName = event.target.first_name.value.trim();
    const lastName = event.target.last_name.value.trim();
    const email = event.target.email.value.trim();
    const password = event.target.password.value;

    if (!validateName(firstName)) {
      setErrorMessage("الاسم الأول غير صالح. استخدم أحرف عربية فقط.");
      return;
    }

    if (!validateName(lastName)) {
      setErrorMessage("اسم العائلة غير صالح. استخدم أحرف عربية فقط.");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage("الرجاء إدخال بريد إلكتروني صالح.");
      return;
    }

    if (!validatePassword(password)) {
      setErrorMessage(
        "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، بما في ذلك حرف كبير، رقم، ورمز خاص (!@#$%^&*)"
      );
      return;
    }

    setErrorMessage("");

    try {
      // Send signup request to backend
      const res = await axios.post("http://localhost:5000/auth/signup", {
        firstName,
        lastName,
        email,
        password,
      });

      const token = res.data.token;
      if (token) {
        localStorage.setItem("token", token);
        setToken(token);
        alert("تم إنشاء الحساب بنجاح! سيتم تحويلك إلى الصفحة الرئيسية.");
      } else {
        alert("تم إنشاء الحساب بنجاح! الرجاء تسجيل الدخول الآن.");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.msg || "حدث خطأ أثناء إنشاء الحساب");
    }
  };

  // Focus / Blur reminder logic
  const handleFocus = (field) => {
    const messages = {
      first_name: "الرجاء إدخال الاسم الأول بالأحرف العربية فقط.",
      last_name: "الرجاء إدخال اسم العائلة بالأحرف العربية فقط.",
      email: "الرجاء إدخال بريد إلكتروني صالح (مثال: user@example.com).",
      password: "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، بما في ذلك حرف كبير، رقم، ورمز خاص (!@#$%^&*)."
    };
    setFieldMessage((prev) => ({ ...prev, [field]: messages[field] }));
  };

  const handleBlur = (field, value) => {
    let error = "";
    if (field === "first_name") error = validateName(value, "first");
    if (field === "last_name") error = validateName(value, "last");
    if (field === "email") error = validateEmail(value) ? "" : "البريد الإلكتروني غير صالح.";
    if (field === "password") error = validatePassword(value);
    setFieldMessage((prev) => ({ ...prev, [field]: error }));
  };

  return (
    <section className="auth-dual">
      <form className="auth-panel auth-panel--form" onSubmit={handleSubmit}>
        <div className="auth-panel__head">
          <h2>إنشاء حساب</h2>
          <p>أدخل بياناتك الشخصية لبدء رحلتك مع مركز.</p>
        </div>

        <div className="auth-grid">
          <div className="auth-field">
            <label htmlFor="first_name" className="required">الاسم الأول</label>
            <div className="auth-input-shell">
              <input
                required
                type="text"
                name="first_name"
                id="first_name"
                placeholder="مثال: اريج"
                onFocus={() => handleFocus("first_name")}
                onBlur={(e) => handleBlur("first_name", e.target.value)}
                onChange={() => setFieldMessage("")}
              />
            </div>
            {fieldMessage.first_name && <small className="field-hint">{fieldMessage.first_name}</small>}
          </div>

          <div className="auth-field">
            <label htmlFor="last_name" className="required">اسم العائلة</label>
            <div className="auth-input-shell">
              <input
                required
                type="text"
                name="last_name"
                id="last_name"
                placeholder="مثال: عبدالرحمن"
                onFocus={() => handleFocus("last_name")}
                onBlur={(e) => handleBlur("last_name", e.target.value)}
                onChange={() => setFieldMessage("")}
              />
            </div>
            {fieldMessage.last_name && <small className="field-hint">{fieldMessage.last_name}</small>}
          </div>
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
              onFocus={() => handleFocus("email")}
              onBlur={(e) => handleBlur("email", e.target.value)}
              onChange={() => setFieldMessage("")}
            />
          </div>
          {fieldMessage.email && <small className="field-hint">{fieldMessage.email}</small>}
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
              onFocus={() => handleFocus("password")}
              onBlur={(e) => handleBlur("password", e.target.value)}
              onChange={() => setFieldMessage("")}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              <i className={showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}></i>
            </button>
          </div>
          {fieldMessage.password && <small className="field-hint">{fieldMessage.password}</small>}
        </div>

        {errorMessage && (
          <div className="auth-alert error">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button type="submit" className="auth-primary-btn">إنشاء حساب</button>
      </form>
    </section>
  );
}
