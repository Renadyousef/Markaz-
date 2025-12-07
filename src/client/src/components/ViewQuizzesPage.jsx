// client/src/components/Pages/ViewQuizzes.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AlertTriangle, CheckCircle } from "lucide-react";
import "./ViewQuizzes.css";

export default function ViewQuizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // الصفحة الحالية + حجم الصفحة (6 اختبارات لكل صفحة)
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/Quizess/view_results",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setQuizzes(res.data.quizzes || []);
      } catch (err) {
        console.error("Error fetching quiz results:", err);
        setError("فشل تحميل نتائج الاختبارات.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  // حساب الصفحات
  const totalPages = Math.max(1, Math.ceil(quizzes.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const startIdx = (pageSafe - 1) * pageSize;
  const pageData = quizzes.slice(startIdx, startIdx + pageSize);

  return (
    <div dir="rtl" className="viewQuizzes modern-dashboard">
      <section className="progress-wrap">
        {/* HEADER */}
        <div className="fc-top">
          <div className="title-block">
            <h1 className="title">نتائج الاختبارات</h1>
            <div className="page-subtitle">
              جميع الاختبارات التي تم إنشاؤها من ملفات PDF المحلولة مع عرض درجاتك النهائية.
            </div>
          </div>

          <button
            className="modern-action-btn modern-primary-btn"
            onClick={() => navigate("/upload")}
          >
            + اختبار جديد
          </button>
        </div>

        <div className="quizzes-content">
          {/* ERROR */}
          {error && (
            <div className="modern-alert-error">
              <div className="alert-row">
                <AlertTriangle size={20} />
                <span>
                  <strong>خطأ:</strong> {error}
                </span>
              </div>
            </div>
          )}

          {/* LOADING */}
          {loading && !error && (
            <div className="statusText">جاري تحميل النتائج...</div>
          )}

          {/* EMPTY */}
          {!loading && !error && quizzes.length === 0 && (
            <div className="empty-state-card">
              <p className="empty-title">لا توجد اختبارات محفوظة حتى الآن.</p>
              <p className="empty-subtitle">
                يمكنك البدء برفع ملف PDF محلول لإنشاء أول اختبار لك.
              </p>
            
            </div>
          )}

          {/* QUIZ CARDS */}
          {!loading && !error && quizzes.length > 0 && (
            <>
              <div className="row g-4 quizzes-grid">
                {pageData.map((quiz, i) => {
                  const score = quiz.score ?? 0;
                  const fileName =
                    quiz.originalName || quiz.pdfName || "اختبار بدون اسم";

                  return (
                    <div
                      className="col-12 col-md-6 col-lg-4"
                      key={startIdx + i}
                    >
                      <div className="quiz-card">
                        {/* أعلى شيء: الأيقونة القديمة + نص "نتيجة الاختبار" */}
                        <div className="quiz-header">
                          <div className="quiz-icon-circle">
                            <CheckCircle size={18} />
                          </div>
                          <span className="quiz-header-title">
                            نتيجة الاختبار
                          </span>
                        </div>

                        <div className="quiz-divider" />

                        {/* عنوان الملف : [اسم الملف] */}
                        <div className="quiz-row">
                          <span className="quiz-label">عنوان الملف :</span>
                          <span className="quiz-value quiz-filename">
                            {fileName}
                          </span>
                        </div>

                        {/* درجتك النهائية : 20 / 100 */}
                        <div className="quiz-row">
                          <span className="quiz-label">درجتك النهائية :</span>
                          <span className="quiz-value quiz-score-wrapper">
                            <span className="quiz-score-main">{score}</span>
                            <span className="quiz-score-outof">/ 100</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAGINATION */}
              <div className="pagination-bar">
                <div className="pagination-info">
                  إجمالي: {quizzes.length} اختبار — صفحة {pageSafe} من{" "}
                  {totalPages}
                </div>

                {totalPages > 1 && (
                  <div className="btn-group">
                    {pageSafe > 1 && (
                      <button
                        type="button"
                        className="btn-outline-orange"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        السابق
                      </button>
                    )}

                    {pageSafe < totalPages && (
                      <button
                        type="button"
                        className="btn-orange"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                      >
                        التالي
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
