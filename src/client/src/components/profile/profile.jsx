import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

/** يسمح فقط بـ:
 * - الحروف العربية U+0600–U+06FF (تشمل التشكيل والهمزات)
 * - التطويل U+0640
 * - الأرقام العربية U+0660–U+0669
 * - المسافة
 */
const ARABIC_ONLY = /[^\u0600-\u06FF\u0640\u0660-\u0669\s]/g;

function sanitizeArabic(input) {
  if (typeof input !== "string") return "";
  return input.replace(ARABIC_ONLY, "");
}

function validateArabicName(s) {
  const v = (s || "").trim();
  if (v.length < 2) return false;
  return v === sanitizeArabic(v);
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [okMessage, setOkMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(true);

  // أخطاء الحقول
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");

  // القيم الأصلية + تتبّع التغييرات
  const initialRef = useRef({ firstName: "", lastName: "" });
  const [isDirty, setIsDirty] = useState(false);

  // هيدر التوثيق من localStorage
  function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  // جلب بيانات المستخدم
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("لم يتم تسجيل الدخول.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/profile/me", getAuthHeaders());
        const fn = sanitizeArabic(res.data.firstName || "");
        const ln = sanitizeArabic(res.data.lastName  || "");
        const em = res.data.email || "";

        setFirstName(fn);
        setLastName(ln);
        setEmail(em);

        initialRef.current = { firstName: fn, lastName: ln };
      } catch (e) {
        setErrorMessage(e.response?.data?.msg || "تعذّر جلب البيانات.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // حساب التغييرات ببساطة
  useEffect(() => {
    const nowFn = sanitizeArabic(firstName).trim();
    const nowLn = sanitizeArabic(lastName).trim();
    const initFn = (initialRef.current.firstName || "").trim();
    const initLn = (initialRef.current.lastName  || "").trim();
    setIsDirty(nowFn !== initFn || nowLn !== initLn);
  }, [firstName, lastName]);

  // تحذير عند الإغلاق مع وجود تعديلات
  useEffect(() => {
    const beforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "لديك تعديلات غير محفوظة. هل تريدين المغادرة دون حفظ؟";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  // Handlers
  function handleFirstNameChange(value) {
    const clean = sanitizeArabic(value);
    setFirstName(value);
    if (value !== clean) {
      setFirstNameError("❌ يُسمح فقط بالحروف العربية، المسافة.");
    } else if (clean.trim().length < 2) {
      setFirstNameError("❌ يجب ألا يقل الاسم الأول عن حرفين.");
    } else {
      setFirstNameError("");
    }
  }

  function handleLastNameChange(value) {
    const clean = sanitizeArabic(value);
    setLastName(value);
    if (value !== clean) {
      setLastNameError("❌ يُسمح فقط بالحروف العربية.");
    } else if (clean.trim().length < 2) {
      setLastNameError("❌ يجب ألا يقل اسم العائلة عن حرفين.");
    } else {
      setLastNameError("");
    }
  }

  const enterEdit = () => {
    setErrorMessage("");
    setOkMessage("");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setFirstName(initialRef.current.firstName || "");
    setLastName(initialRef.current.lastName || "");
    setFirstNameError("");
    setLastNameError("");
    setErrorMessage("");
    setOkMessage("");
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setErrorMessage("");
    setOkMessage("");

    if (isEditing && (firstNameError || lastNameError)) {
      setErrorMessage("راجعي الأخطاء في الحقول قبل الحفظ.");
      return;
    }

    const fn = sanitizeArabic(firstName);
    const ln = sanitizeArabic(lastName);

    if (!validateArabicName(fn) || !validateArabicName(ln)) {
      setErrorMessage("الاسم الأول واسم العائلة يجب أن يكونا بالعربية فقط وبطول لا يقل عن حرفين.");
      return;
    }

    const ok = window.confirm("هل تريدين حفظ التغييرات؟");
    if (!ok) return;

    try {
      await axios.put(
        "http://localhost:5000/profile/me",
        { firstName: fn, lastName: ln },
        getAuthHeaders()
      );

      initialRef.current = { firstName: fn, lastName: ln };
      setOkMessage("تم حفظ التغييرات بنجاح ✅");

      // تختفي بعد 4 ثوانٍ
      setTimeout(() => {
        setOkMessage("");
        setIsEditing(false);
      }, 4000);
    } catch (e) {
      setErrorMessage(e.response?.data?.msg || "حدث خطأ أثناء الحفظ.");
    }
  };

  const handleBackClick = () => {
    if (isEditing && isDirty) {
      const choice = confirm("لديك تعديلات غير محفوظة. هل تريدين حفظها قبل الرجوع؟");
      if (choice) {
        handleSave();
        return;
      }
    }
    window.history.back();
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column gap-3 align-items-center justify-content-center" dir="rtl">
        <div className="spinner-border" role="status" aria-label="جارٍ التحميل" />
        <div>...تحميل</div>
      </div>
    );
  }

  const saveDisabled = !isEditing || !!firstNameError || !!lastNameError;

  return (
    <div className="profile-onepage" dir="rtl">
      {/* رأس الصفحة */}
      <header className="hero">
        

        <svg className="wave" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#FFD8A8" />
              <stop offset="55%"  stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <path d="M0,64 C240,100 480,40 720,64 C960,88 1200,76 1440,60 L1440,160 L0,160 Z" fill="url(#waveGrad)"/>
        </svg>
      </header>

      {/* المحتوى */}
      <main className="orange-area">
        <div className="avatar-wrap">
          <img
            className="avatar"
            src="/profile.png"
            alt="صورة المستخدم"
          />
        </div>

        <h3 className="p-name">{`${sanitizeArabic(firstName)} ${sanitizeArabic(lastName)}`.trim()}</h3>
        <div className="p-email">{email}</div>

        <div className="container px-3 px-md-4">
          <div className="card-area stack">
            {errorMessage && <div className="alert alert-danger text-center m-0 mb-2">{errorMessage}</div>}
            {okMessage && <div className="alert alert-success text-center m-0 mb-2">{okMessage}</div>}

            {/* فورم عرض+تعديل */}
            <form className="row g-3" onSubmit={handleSave}>
              <div className="col-12 col-md-6">
                <label className="form-label">
                  الاسم الأول <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${firstNameError ? "is-invalid" : ""}`}
                  value={firstName}
                  disabled={!isEditing}
                  onChange={(e)=> handleFirstNameChange(e.target.value)}
                  placeholder="مثال: أفنان"
                  required
                />
                {firstNameError && (
                  <div className="invalid-feedback d-block">{firstNameError}</div>
                )}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">
                  اسم العائلة <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${lastNameError ? "is-invalid" : ""}`}
                  value={lastName}
                  disabled={!isEditing}
                  onChange={(e)=> handleLastNameChange(e.target.value)}
                  placeholder="مثال: السبيعي"
                  required
                />
                {lastNameError && (
                  <div className="invalid-feedback d-block">{lastNameError}</div>
                )}
              </div>

              <div className="col-12">
                <label className="form-label">البريد الإلكتروني</label>
                <input className="form-control" value={email} disabled readOnly />
                <div className="form-text">لا يمكن تعديل البريد من هنا.</div>
              </div>

              <div className="col-12 d-flex flex-wrap gap-2 justify-content-end mt-2">
                {!isEditing ? (
                  <button
                    type="button"
                    className="btn btn-light border d-flex align-items-center gap-2"
                    onClick={enterEdit}
                    aria-label="تعديل"
                  >
                    {/* قلم برتقالي */}
                    <span className="icon-pen" aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.29a1 1 0 0 0-1.41 0L15.12 5.12l3.75 3.75 1.84-1.83z" fill="currentColor"/>
                      </svg>
                    </span>
                    تعديل
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit}>
                      إلغاء
                    </button>
                    <button type="submit" className="btn btn-primary px-4" disabled={saveDisabled}>
                      حفظ
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* أنماط الصفحة */}
      <style>{`
        :root{
          --orange:#FDA838;
          --bg:#ffffff;

          /* قيم ريسبونسف */
          --hero-h: clamp(96px, 14vh, 160px);
          --avatar-size: clamp(96px, 14vw, 140px);
          --wave-h: clamp(80px, 10vh, 140px);
          --name-fz: clamp(18px, 2.2vw, 26px);
          --email-fz: clamp(12px, 1.6vw, 15px);
        }

        .profile-onepage{ min-height:100vh; background:transparent; position:relative; color:#111; }
        html, body, #root { margin:0; padding:0; min-height:100%; }
        body{ position:relative; }
        body::before {
          content:"";
          position:fixed; inset:0; z-index:-1; pointer-events:none;
          background: linear-gradient(180deg, #fff7ed 0%, #fff 20%, #fff5eb 60%, #fff 100%);
          background-repeat:no-repeat; background-attachment:fixed;
        }

        .hero {
          height: var(--hero-h);
          background:#fff;
          border-top-left-radius:18px; border-top-right-radius:18px;
          position:relative;
        }

        .round-icon-btn{
          position:absolute; top:12px; left:12px; z-index:2; width:40px; height:40px;
          background:#fff; border:2px solid var(--orange); color:var(--orange);
          border-radius:50%; display:flex; align-items:center; justify-content:center;
          cursor:pointer; box-shadow:0 4px 14px rgba(0,0,0,.08);
        }
        .round-icon-btn:hover{ background:#fff7ec; }

        .wave{ position:absolute; bottom:-1px; left:0; right:0; width:100%; height: var(--wave-h); }
        .wave path{ filter: drop-shadow(0 -2px 6px rgba(0,0,0,.06)); }

        .orange-area{
          min-height:72vh;
          padding: calc(var(--avatar-size) / 2 + 28px) 12px 36px;
          display:flex; flex-direction:column; align-items:center; text-align:center;
        }

        .avatar-wrap{
          position:absolute;
          top: calc(var(--hero-h) - var(--avatar-size) / 2);
          left:50%;
          transform:translateX(-50%);
          width: var(--avatar-size);
          height: var(--avatar-size);
        }

        .avatar{
          width:100%; height:100%; border-radius:50%;
          border:6px solid #fff; object-fit:cover; box-shadow:0 6px 18px rgba(0,0,0,.18);
          background:#eee;
        }

        .p-name{ font-weight:800; font-size: var(--name-fz); margin:10px 0 2px; }
        .p-email{ opacity:.85; font-size: var(--email-fz); margin-bottom:16px; }

        .stack{ width: min(900px, 100%); }
        .card-area{
          text-align:start; background:#fff; border-radius:14px; padding:16px;
          box-shadow:0 6px 16px rgba(0,0,0,.08); margin:14px auto;
        }

        .icon-pen{
          width:28px; height:28px; border-radius:50%;
          display:grid; place-items:center; color:var(--orange);
          background:#fff; border:2px solid var(--orange);
        }

        /* تحسينات للشاشات الصغيرة */
        @media (max-width: 575.98px){
          .card-area{ padding:14px; }
          .form-label{ font-size:14px; }
          .form-control{ font-size:14px; }
          .round-icon-btn{ width:36px; height:36px; top:10px; left:10px; }
        }

        /* شاشات متوسطة فأعلى */
        @media (min-width:768px){
          .orange-area{ padding-top: calc(var(--avatar-size) / 2 + 36px); }
          .card-area{ padding:24px; }
        }

        /* احترام تفضيل تقليل الحركة */
        @media (prefers-reduced-motion: no-preference){
          .avatar{ transition: transform .2s ease; }
          .avatar:hover{ transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
