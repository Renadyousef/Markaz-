import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token"); // get JWT from localStorage
      if (!token) {
        setError("لم يتم تسجيل الدخول");
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/user/me", {
          headers: { Authorization: `Bearer ${token}` } // send token in header
        });
        setFirstName(res.data.firstName);
      } catch (err) {
        setError(err.response?.data?.msg || "حدث خطأ أثناء جلب البيانات");
      }
    };

    fetchUser();
  }, []);

  if (error) return <div>{error}</div>;

  return <h1>مرحبًا {firstName}!</h1>;
}
