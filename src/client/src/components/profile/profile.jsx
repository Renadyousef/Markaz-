import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

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
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const initialRef = useRef({ firstName: "", lastName: "" });
  const [isDirty, setIsDirty] = useState(false);

  function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("لم يتم تسجيل الدخول.");
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(
          "http://localhost:5000/profile/me",
          getAuthHeaders()
        );
        const fn = sanitizeArabic(res.data.firstName || "");
        const ln = sanitizeArabic(res.data.lastName || "");
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

  useEffect(() => {
    const nowFn = sanitizeArabic(firstName).trim();
    const nowLn = sanitizeArabic(lastName).trim();
    const initFn = (initialRef.current.firstName || "").trim();
    const initLn = (initialRef.current.lastName || "").trim();
    setIsDirty(nowFn !== initFn || nowLn !== initLn);
  }, [firstName, lastName]);

  useEffect(() => {
    const beforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "لديك تعديلات غير محفوظة. هل تريدين المغادرة دون حفظ؟";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

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
      setErrorMessage(
        "الاسم الأول واسم العائلة يجب أن يكونا بالعربية فقط وبطول لا يقل عن حرفين."
      );
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

      setTimeout(() => {
        setOkMessage("");
        setIsEditing(false);
      }, 4000);
    } catch (e) {
      setErrorMessage(e.response?.data?.msg || "حدث خطأ أثناء الحفظ.");
    }
  };

  if (loading) {
    return (
      <div
        className="min-vh-100 d-flex flex-column gap-3 align-items-center justify-content-center"
        dir="rtl"
      >
        <div
          className="spinner-border text-primary"
          role="status"
          aria-label="جارٍ التحميل"
        />
        <div className="text-secondary">...تحميل</div>
      </div>
    );
  }

  const saveDisabled =
    !isEditing || !!firstNameError || !!lastNameError || !isDirty;

  return (
    <div className="profile-page-modern-v5" dir="rtl">
      <main className="profile-shell-v5">
        {/* رأس البطاقة: الصورة والاسم والبريد */}
        <header className="profile-info-header-v5">
          <img
            className="profile-avatar-v5"
            src="/profile.png"
            alt="صورة المستخدم"
          />
          <div className="user-text-details-v5">
            <h2 className="user-name-v5">
              {`${sanitizeArabic(firstName)} ${sanitizeArabic(lastName)}`.trim() ||
                "غير مُحدّد"}
            </h2>
            <p className="user-email-v5">{email}</p>
          </div>
        </header>

        <section className="profile-content-v5">
          <div className="profile-header-text-v5">
            <h3 className="profile-title-v5">إدارة الملف الشخصي</h3>
            <p className="profile-subtitle-v5">
              تحديث بياناتك الشخصية الأساسية.
            </p>
          </div>

          <div className="profile-fields-card-v5">
            {errorMessage && (
              <div className="alert alert-danger text-center m-0 mb-3 modern-alert-error-v5">
                {errorMessage}
              </div>
            )}
            {okMessage && (
              <div className="alert alert-success text-center m-0 mb-3 modern-alert-success-v5">
                {okMessage}
              </div>
            )}

            <form className="row g-3" onSubmit={handleSave}>
              <div className="col-12 col-md-6">
                <label className="form-label text-secondary fw-semibold">
                  الاسم الأول <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control modern-input-v5 ${
                    firstNameError ? "is-invalid" : ""
                  }`}
                  value={firstName}
                  disabled={!isEditing}
                  onChange={(e) => handleFirstNameChange(e.target.value)}
                  placeholder="مثال: أفنان"
                  required
                />
                {firstNameError && (
                  <div className="invalid-feedback d-block">
                    {firstNameError}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label text-secondary fw-semibold">
                  اسم العائلة <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control modern-input-v5 ${
                    lastNameError ? "is-invalid" : ""
                  }`}
                  value={lastName}
                  disabled={!isEditing}
                  onChange={(e) => handleLastNameChange(e.target.value)}
                  placeholder="مثال: السبيعي"
                  required
                />
                {lastNameError && (
                  <div className="invalid-feedback d-block">
                    {lastNameError}
                  </div>
                )}
              </div>

              <div className="col-12">
                <label className="form-label text-secondary fw-semibold">
                  البريد الإلكتروني
                </label>
                <input
                  className="form-control modern-input-v5 bg-light-subtle"
                  value={email}
                  disabled
                  readOnly
                />
              </div>

              <div className="col-12 d-flex flex-wrap gap-2 justify-content-end mt-4">
                {!isEditing ? (
                  <button
                    type="button"
                    className="btn btn-light border d-flex align-items-center gap-2 modern-btn-outline-v5"
                    onClick={enterEdit}
                    aria-label="تعديل"
                  >
                    <span className="icon-edit-v5" aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path
                          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.29a1 1 0 0 0-1.41 0L15.12 5.12l3.75 3.75 1.84-1.83z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    تعديل البيانات
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-secondary modern-btn-secondary-v5"
                      onClick={cancelEdit}
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary px-4 modern-btn-primary-v5"
                      disabled={saveDisabled}
                    >
                      حفظ التغييرات
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </section>
      </main>

      <style>{`
        /* ---------------------------------- */
        /* تصميم عصري نهائي: Profile V5       */
        /* ---------------------------------- */

        .profile-page-modern-v5,
        .profile-page-modern-v5 * {
          font-family: "Cairo", "Helvetica Neue", sans-serif;
          box-sizing: border-box;
        }

        /* خلفية الصفحة الأساسية (Body/Page) */
        .profile-page-modern-v5 {
          min-height: 100vh;
          padding: 30px 15px 40px;
          display: flex;
          justify-content: center;
          /* بدون لون خلفية، تاخذ خلفية الصفحة الأساسية */
          background-color: transparent;
        }

        /* البطاقة الرئيسية (Shell) */
        .profile-shell-v5 {
          width: 100%;
          max-width: 700px;
          background-color: #fff;
          border-radius: 20px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        /* رأس البطاقة: الصورة والاسم والبريد */
        .profile-info-header-v5 {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 30px;
          background: linear-gradient(135deg, #fce0c7, #fcd7b9);
          border-bottom: 1px solid #f0e7dc;
        }

        .profile-avatar-v5 {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          flex-shrink: 0;
        }

        .user-text-details-v5 {
          text-align: right;
        }

        .user-name-v5 {
          font-weight: 800;
          font-size: clamp(20px, 2.5vw, 28px);
          margin-bottom: 4px;
          color: #2c3e50;
        }

        .user-email-v5 {
          font-size: clamp(14px, 1.8vw, 16px);
          color: #7f8c8d;
          margin: 0;
        }

        .profile-content-v5 {
          padding: 30px;
          text-align: center;
        }

        .profile-header-text-v5 {
          margin-bottom: 25px;
        }

        .profile-title-v5 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 6px;
        }

        .profile-subtitle-v5 {
          font-size: 0.95rem;
          color: #7f8c8d;
          margin: 0;
        }
        
        .profile-fields-card-v5 {
          background: #ffffff;
          border-radius: 16px;
          padding: 25px;
          text-align: start;
        }

        /* حقول الإدخال */
        .modern-input-v5 {
          border-radius: 10px;
          border-color: #e0e7ee;
          padding-inline: 14px;
          padding-block: 10px;
        }
        .modern-input-v5:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 0.15rem rgba(249, 115, 22, 0.25);
        }

        /* تنبيهات الأخطاء والنجاح */
        .modern-alert-error-v5 {
          border-radius: 10px;
          background-color: #fee2e2;
          color: #b91c1c;
          border-color: #fca5a5;
          font-weight: 600;
        }
        .modern-alert-success-v5 {
          border-radius: 10px;
          background-color: #d1fae5;
          color: #065f46;
          border-color: #a7f3d0;
          font-weight: 600;
        }

        /* أيقونة زر التعديل */
        .icon-edit-v5 {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #f97316;
          background: #fff7ed;
          border: 1px solid #fed7aa;
        }

        /* زر التعديل */
        .modern-btn-outline-v5 {
          border-radius: 999px;
          padding-inline: 18px;
          font-weight: 600;
          color: #f97316;
          border-color: #fed7aa;
          background: #fff;
          transition: all 0.2s ease;
        }
        .modern-btn-outline-v5:hover {
          background: #fff7ed;
          border-color: #f97316;
          transform: translateY(-1px);
        }

        /* زر الإلغاء */
        .modern-btn-secondary-v5 {
          border-radius: 999px;
          font-weight: 600;
          border-color: #dce1e6;
          color: #555;
          transition: all 0.2s ease;
        }
        .modern-btn-secondary-v5:hover {
          background-color: #f0f4f8;
          border-color: #c9d2de;
          color: #333;
        }

        /* زر الحفظ */
        .modern-btn-primary-v5 {
          border-radius: 999px;
          font-weight: 700;
          background: #f97316;
          border-color: #f97316;
          transition: all 0.2s ease;
        }
        .modern-btn-primary-v5:hover:not(:disabled) {
          background: #ea580c;
          border-color: #ea580c;
        }
        /* هنا التعديل: لما يكون معطّل يكون رمادي مو أزرق */
        .modern-btn-primary-v5:disabled {
          background-color: #d1d5db;
          border-color: #d1d5db;
          color: #4b5563;
          opacity: 1;
          cursor: not-allowed;
        }

        /* ---------------------------------- */
        /* تنسيقات الاستجابة        */
        /* ---------------------------------- */

        @media (max-width: 575.98px) {
          .profile-page-modern-v5 {
            padding-inline: 10px;
          }
          .profile-shell-v5 {
            box-shadow: none;
            border-radius: 0;
          }
          .profile-info-header-v5 {
            flex-direction: column;
            text-align: center;
            padding: 20px;
            gap: 10px;
          }
          .user-text-details-v5 {
            text-align: center;
          }
          .profile-content-v5 {
            padding: 20px;
          }
          .profile-fields-card-v5 {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
