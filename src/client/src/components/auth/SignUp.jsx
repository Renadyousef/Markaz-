import { useState } from "react";
import { validatePassword, validateName } from "./validation";
import axios from "axios";

export default function SignUp({ setToken }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldMessage, setFieldMessage] = useState({
    first_name: "",
    last_name: "",
    password: ""
  });

  // On Submit, 1.validate and 2.send form to backend
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

  if (!validatePassword(password)) {
    setErrorMessage(
      " كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، بما في ذلك حرف كبير، رقم، ورمز خاص (!@#$%^&*)"
    );
    return;
  }

  setErrorMessage("");
//2.before submitting we send the form to the backend
 try {
    // Send data to your backend
    const res = await axios.post("http://localhost:5000/auth/signup", {
      firstName,
      lastName,
      email,
      password,
    });
    
    //set token in LS
     // 1. get the token from response
  const token = res.data.token;
  if (token) {
    // 2. save token in localStorage
    localStorage.setItem("token", token);
    setToken(token)
    alert("تم إنشاء الحساب بنجاح! سيتم تحويلك إلى الصفحة الرئيسية.");
  }
else{
   alert("تم إنشاء الحساب بنجاح! الرجاء تسجيل الدخول الآن.");

}

    console.log(res.data); // should be { msg: "User created successfully" }
   
  } catch (error) {
    console.error(error.response?.data || error.message);
    setErrorMessage(error.response?.data?.msg || "حدث خطأ أثناء إنشاء الحساب");
  }

 
};


  // Focus / Blur reminder logic
  const handleFocus = (field) => {
    const messages = {
      first_name: "الرجاء إدخال الاسم الأول بالأحرف العربية فقط.",
      last_name: "الرجاء إدخال اسم العائلة بالأحرف العربية فقط.",
      password: "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، بما في ذلك حرف كبير، رقم، ورمز خاص (!@#$%^&*)."

     };
    setFieldMessage((prev) => ({ ...prev, [field]: messages[field] }));
  };

const handleBlur = (field, value) => {
  let error = "";
  if (field === "first_name") error = validateName(value, "first");
  if (field === "last_name") error = validateName(value, "last");
  if (field === "password") error = validatePassword(value);

  setFieldMessage((prev) => ({ ...prev, [field]: error }));
};


  return (
    <form className="sign-up-container" onSubmit={handleSubmit}>
      <label htmlFor="first_name" className="required">الاسم الاول</label>
      <input
        required
        type="text"
        name="first_name"
        id="first_name"
        onFocus={() => handleFocus("first_name")}
        onBlur={(e) => handleBlur("first_name", e.target.value)}
          onChange={() => setFieldMessage("")}
      />
      {fieldMessage.first_name && <div style={{ color: "gray" }}>{fieldMessage.first_name}</div>}

      <label htmlFor="last_name" className="required">اسم العائلة</label>
      <input
        required
        type="text"
        name="last_name"
        id="last_name"
        onFocus={() => handleFocus("last_name")}
        onBlur={(e) => handleBlur("last_name", e.target.value)}
          onChange={() => setFieldMessage("")}
      />
      {fieldMessage.last_name && <div style={{ color: "gray" }}>{fieldMessage.last_name}</div>}

      <label htmlFor="email" className="required">البريد الإلكتروني</label>
      <input required type="email" name="email" id="email" />

      <label htmlFor="password" className="required">كلمة المرور</label>
      <input
        required
        type="password"
        name="password"
        id="password"
        onFocus={() => handleFocus("password")}
        onBlur={(e) => handleBlur("password", e.target.value)}
          onChange={() => setFieldMessage("")}
      />
      {fieldMessage.password && <div style={{ color: "gray" }}>{fieldMessage.password}</div>}

      {errorMessage && <div style={{ color: "red", fontWeight: "bold" }}>{errorMessage}</div>}

      <input type="submit" value="إنشاء حساب" />
    </form>
  );
}
