import { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const API_ROOT = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_PROGRESS = `${API_ROOT}/api/progress/me`;
const API_HISTORY = `${API_ROOT}/api/progress/history`;

export default function ProgressPage() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function fetchProgress() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const [res1, res2] = await Promise.all([
        axios.get(API_PROGRESS, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_HISTORY, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setData(res1.data);
      setHistory(res2.data.data || []);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  // ✅ يحدث تلقائي كل دقيقة بدون زر
  useEffect(() => {
    fetchProgress(); // أول مرة
    const interval = setInterval(fetchProgress, 60000); // كل 60 ثانية
    return () => clearInterval(interval); // تنظيف عند مغادرة الصفحة
  }, []);

  if (loading) return <div className="viewer">جاري تحميل التقدم...</div>;
  if (err) return <div className="alert err">حدث خطأ: {err}</div>;

  const chartData = {
    labels: history.map(h => h.date),
    datasets: [{
      label: "نسبة التقدم %",
      data: history.map(h => h.percent),
      borderColor: "#3b82f6",
      backgroundColor: "#93c5fd55",
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: "#2563eb",
    }],
  };

  return (
    <div className="hp" dir="rtl">
      <style>{`
        .progressWrap {
          display: grid;
          gap: 16px;
          direction: rtl;
          text-align: right;
        }
        .progressCard {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          box-shadow: var(--shadow);
        }
        .bar {
          height: 14px;
          background: #e0f2fe;
          border-radius: 10px;
          overflow: hidden;
        }
        .barFill {
          height: 100%;
          background: linear-gradient(90deg, #60a5fa, #3b82f6);
          width: ${data?.progressPercent || 0}%;
          transition: width .6s ease;
        }
        .fcTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>

      <section className="panel progressWrap">
        <div className="fcTop">
          <h3 className="title">📊 تتبّع تقدمك</h3>
          <Link to="/" className="back">رجوع</Link>
        </div>

        <div className="progressCard">
          <h4>ملخص اليوم ({data.date})</h4>
          <p>✅ المهام المنجزة: {data.completedTasks} / {data.totalTasks}</p>
          <p>📚 الجلسات الدراسية اليوم: {data.sessionsToday}</p>
          <p>🧠 تحسّن نتيجة الاختبار: {data.improvement >= 0 ? `+${data.improvement}` : data.improvement}</p>
          <div className="bar"><div className="barFill" /></div>
          <p style={{ marginTop: 10, fontWeight: 800 }}>{data.progressPercent}%</p>
          <p>{data.message}</p>
        </div>

        {history.length > 0 && (
          <div className="progressCard">
            <h4>📈 التقدم خلال الأسبوع</h4>
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { min: 0, max: 100 } }
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
