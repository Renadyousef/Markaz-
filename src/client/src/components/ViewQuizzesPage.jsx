import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ViewQuizzes.css";

export default function ViewQuizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/Quizess/view_results", {
          headers: { Authorization: `Bearer ${token}` },
        });
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

  return (
    <div className="viewQuizzes">
      <div className="viewHeader">
        <h1>نتائج الاختبارات</h1>
        <button className="newQuizBtn" onClick={() => navigate("/upload")}>
          + اختبار جديد
        </button>
      </div>

      {loading && <p>جاري تحميل النتائج...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="quizGrid">
        {quizzes.map((quiz, i) => (
          <div key={i} className="quizCard">
            <div className="quizHeader">
              <h2>{quiz.originalName || quiz.pdfName}</h2>
            </div>
            <div className="quizBody">
              <p>
                الدرجة: <span>{quiz.score} / 100</span>
              </p>
            </div>
          </div>
        ))}
        {!loading && quizzes.length === 0 && (
          <p>لا توجد اختبارات محفوظة بعد.</p>/**this is still showing */
        )}
      </div>
    </div>
  );
}
