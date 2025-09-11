import { validateEmail } from "./validation";
import { useState } from "react";
import axios from "axios";

export default function SignIn({ setToken }) {
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
      setErrorMessage(error.response?.data?.msg || "حدث خطأ أثناء تسجيل الدخول");
    }
  };

  return (
    <form className="sign-up-container" onSubmit={handleSubmit}>
      <label htmlFor="email" className="required">البريد الإلكتروني</label>
      <input required type="email" name="email" id="email" />

      <label htmlFor="password" className="required">كلمة المرور</label>
      <div className="password-wrapper">
        <input
          required
          type={showPassword ? "text" : "password"}
          name="password"
          id="password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#555",
            fontSize: "1rem",
            padding: 0
          }}
        >
          <i className={showPassword ?  "fa-solid fa-eye":"fa-solid fa-eye-slash"}></i>
        </button>
      </div>

      {errorMessage && <div style={{ color: "red", fontWeight: "bold" }}>{errorMessage}</div>}

      <input type="submit" value="تسجيل الدخول" />
    </form>
  );
}
