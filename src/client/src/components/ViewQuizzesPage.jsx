import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewQuizzes.css";

export default function ViewQuizzes() {
  const navigate = useNavigate();

  // Mock data for one user
  const mockQuizzes = [
    { pdfName: "Quiz1.pdf", score: 85 },
    { pdfName: "Quiz2.pdf", score: 78 },
    { pdfName: "Quiz3.pdf", score: 92 },
  ];

  const [quizzes] = useState(mockQuizzes);

  return (
    <div className="viewQuizzes">
      <div className="viewHeader">
        <h1>نتائج الاختبارات</h1>
        <button
          className="newQuizBtn"
          onClick={() => navigate("/upload")}
        >
          + اختبار جديد
        </button>
      </div>

      <div className="quizGrid">
        {quizzes.map((quiz, i) => (
          <div key={i} className="quizCard">
            <div className="quizHeader">
              <h2>{quiz.pdfName}</h2>
            </div>
            <div className="quizBody">
              <p>الدرجة: <span>{quiz.score} / 100</span></p>
              
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
