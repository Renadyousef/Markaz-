import { validatePassword, validateEmail } from "./validation";
import { useState } from "react";
import axios from "axios";

export default function SignIn({ setToken }) { // receive setToken from App.jsx
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const email = event.target.email.value.trim();
    const password = event.target.password.value;

    // 1. Validate email
    if (!validateEmail(email)) {
      setErrorMessage("الرجاء إدخال بريد إلكتروني صالح.");
      return;
    }

    // 2. Validate password not empty
    if (!password) {
      setErrorMessage("الرجاء إدخال كلمة المرور.");
      return;
    }

    setErrorMessage(""); // clear previous errors

    try {
      // 3. Send login request
      const res = await axios.post("http://localhost:5000/auth/login", { email, password });
      console.log(res.data);

      // 4. Save JWT token coming from backend so we can remember user in client
     // localStorage.removeItem("token");

      const token = res.data.token;
      localStorage.setItem("token", token);

      // 5. Pass token back to App.jsx to render Home
      setToken(token);

      alert("تم تسجيل الدخول بنجاح!");
    } catch (error) {
      // 6. Show backend error message or generic one
      setErrorMessage(error.response?.data?.msg || "حدث خطأ أثناء تسجيل الدخول");
    }
  };

  return (
    <form className="sign-up-container" onSubmit={handleSubmit}>
      <label htmlFor="email" className="required">البريد الإلكتروني</label>
      <input required type="email" name="email" id="email" />

      <label htmlFor="password" className="required">كلمة المرور</label>
      <input required type="password" name="password" id="password" />

      {errorMessage && <div style={{ color: "red", fontWeight: "bold" }}>{errorMessage}</div>}

      <input type="submit" value="تسجيل الدخول" />
    </form>
  );
}
