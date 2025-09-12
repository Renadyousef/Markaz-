import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebase-config";
import "./ResetPassword.css";

const LOGIN_PATH = "/login"; 


export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  

  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelector(".will-reveal")?.classList.add("reveal");
    }, 20);
    return () => clearTimeout(t);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!email.trim()) { setErr("من فضلك أدخل بريدك الإلكتروني."); return; }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setSentTo(email);
      setShowPopup(true); 
      setEmail("");
    } catch (e) {
      console.error(e);
      setErr("تعذّر الإرسال. تحقّق من البريد وحاول مجددًا.");
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <main dir="rtl" className="auth-full auth-bg">

  <section className="landing-bg">
  <img src="/logo.svg" alt="شعار مركز" className="site-logo" />

  <div className="hero-header">
    <a href="/signin" className="chip chip--primary">تسجيل الدخول</a>
    <a href="/signup" className="chip chip--light">إنشاء حساب</a>
  </div>
</section>
      <form onSubmit={onSubmit} className="reset-stack will-reveal" aria-labelledby="fp-title">
        <img src="/resetPassword.svg" alt="" className="reset-hero" />
        <h1 id="fp-title" className="reset-title">هل نسيت كلمة المرور؟</h1>
        <p className="reset-sub">
          من فضلك أدخل بريدك الإلكتروني المسجَّل لدينا لإرسال رابط إعادة تعيين كلمة المرور.
        </p>

        <label htmlFor="email" className="reset-label">البريد الإلكتروني</label>
        <input
          id="email"
          type="email"
          className="reset-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@gmail.com"
          autoComplete="email"
          inputMode="email"
          required
        />

        {err && <div className="auth-alert auth-alert--err" role="alert">{err}</div>}

        <button type="submit" className="reset-btn" disabled={loading}>
          {loading ? "جارٍ الإرسال…" : "إرسال"}
        </button>

        <button
          type="button"
          className="reset-link"
          onClick={() => navigate(LOGIN_PATH)}
        >
          العودة إلى تسجيل الدخول
        </button>
      </form>

  
      {showPopup && (
        <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="sent-title">
          <div className="peach-toast">
            <img src="/resetPawword.svg" alt="" className="reset-hero small" />
            <div>
              <h3 id="sent-title" className="toast-title">تم الإرسال!</h3>
              <p className="toast-text">
                أرسلنا رابط إعادة التعيين إلى <strong>{sentTo}</strong>. تحقّق من بريدك
                
              </p>
            </div>
            <div className="toast-actions">
              <button className="reset-btn sm" onClick={() => navigate(LOGIN_PATH)}>العودة إلى تسجيل الدخول</button>
              <button className="reset-link sm" onClick={() => setShowPopup(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
