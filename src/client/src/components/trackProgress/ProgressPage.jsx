// client/src/components/Pages/ProgressPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { GaugeCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

// ثوابت API
const API_ROOT = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_PROGRESS = `${API_ROOT}/api/progress/me`;
const API_HISTORY = `${API_ROOT}/api/progress/history`;
const API_ME = `${API_ROOT}/home/me`;

// اللون البرتقالي الأساسي
const PRIMARY_COLOR = "#ff8c42";
const PRIMARY_LIGHT = "#ffdbbf";

/* ===== دوال تنسيق التاريخ (ميلادي بالعربي مثل ٢٧ نوفمبر ٢٠٢٥) ===== */
function formatArabicGregorianDate(date) {
  try {
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function formatArabicGregorianDateFromISO(iso) {
  if (!iso) return "";
  try {
    return formatArabicGregorianDate(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ProgressPage() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [firstName, setFirstName] = useState("");

  async function fetchProgress() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [res1, res2] = await Promise.all([
        axios.get(API_PROGRESS, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_HISTORY, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setData(res1.data);
      setHistory(res2.data.data || []);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  // جلب التقدم وتحديثه كل دقيقة
  useEffect(() => {
    fetchProgress();
    const interval = setInterval(fetchProgress, 60000);
    return () => clearInterval(interval);
  }, []);

  // جلب الاسم
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(API_ME, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFirstName((res.data?.firstName || "").toString());
      } catch {
        // تجاهل
      }
    })();
  }, []);

  if (loading) return <div className="modern-viewer">جاري تحميل التقدم...</div>;
  if (err) return <div className="alert-error">حدث خطأ: {err}</div>;

  const progressPercent = data?.progressPercent || 0;
  const improvement = data?.improvement ?? 0;

  const chartData = {
    labels: history.map((h) => h.date),
    datasets: [
      {
        label: "نسبة التقدم",
        data: history.map((h) => h.percent),
        borderColor: PRIMARY_COLOR,
        backgroundColor: "rgba(255, 140, 66, 0.12)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBorderWidth: 2,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: PRIMARY_COLOR,
        pointHoverRadius: 6,
      },
    ],
  };

  // اليوم + التاريخ: الخميس ٢٧ نوفمبر ٢٠٢٥ (مثال)
  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // كرت مؤشر (KPI)
  const KpiCard = ({
    icon: Icon,
    title,
    value,
    subText,
    pill1,
    pill2,
    pillColor = PRIMARY_COLOR,
  }) => (
    <div className="modern-progress-card">
      <div className="card-header">
        <Icon size={22} color={pillColor} strokeWidth={2.3} />
        <div className="card-title">{title}</div>
      </div>
      <div className="kpi-value" style={{ color: pillColor }}>
        {value}
      </div>
      <p className="kpi-sub">{subText}</p>
      {(pill1 || pill2) && (
        <div className="pill-row">
          {pill1 && <span className="modern-pill">{pill1}</span>}
          {pill2 && <span className="modern-pill">{pill2}</span>}
        </div>
      )}
    </div>
  );

  return (
    <div className="modern-dashboard" dir="rtl">
      <style>{`
        .modern-dashboard, .modern-dashboard * {
          font-family: "Cairo", "Helvetica Neue", sans-serif;
        }

        .modern-viewer {
          padding: 40px;
          font-size: 1.1rem;
          text-align: center;
          color: #4b5563;
        }

        .alert-error {
          padding: 15px;
          border-radius: 8px;
          background-color: #fef2f2;
          color: #ef4444;
          border: 1px solid #fecaca;
          margin: 20px;
          text-align: right;
          font-weight: 600;
        }
        
        /* ===== التخطيط العام ===== */
        .progress-wrap {
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding: 30px 20px 60px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ===== الهيدر ===== */
        .fc-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f3f4f6;
        }

        @media (max-width: 768px) {
          .fc-top {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        .title-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: right;
        }

        .fc-top .title {
          font-size: 2.2rem;
          font-weight: 800;
          color: #1f2937;
          line-height: 1.2;
        }

        .date-line {
          font-size: 0.95rem;
          font-weight: 500;
          color: #6b7280;
        }

        .modern-action-btn {
          padding: 8px 20px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid ${PRIMARY_LIGHT};
          font-size: 0.95rem;
          font-weight: 600;
          color: ${PRIMARY_COLOR};
          text-decoration: none;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all .2s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .modern-action-btn:hover {
          background: ${PRIMARY_LIGHT};
          color: ${PRIMARY_COLOR};
          border-color: ${PRIMARY_COLOR};
          box-shadow: 0 8px 18px rgba(255, 140, 66, 0.2);
          transform: translateY(-1px);
        }

        .modern-primary-btn {
          background: ${PRIMARY_COLOR};
          color: #ffffff;
          border-color: ${PRIMARY_COLOR};
        }
        .modern-primary-btn:hover {
          background: #e57e3f;
          border-color: #e57e3f;
          color: #ffffff;
          box-shadow: 0 8px 18px rgba(255, 140, 66, 0.4);
        }

        .cards-row {
          display: grid;
          gap: 20px;
          margin-top: 10px;
        }
        @media (min-width: 768px) {
          .cards-row {
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          }
        }

        .modern-progress-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 18px 20px;
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .modern-progress-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 34px rgba(0, 0, 0, 0.10);
          border-color: ${PRIMARY_LIGHT};
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .card-title {
          font-size: 0.98rem;
          font-weight: 700;
          color: #374151;
        }

        .kpi-value {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 6px;
          line-height: 1;
        }

        .kpi-sub {
          font-size: 0.9rem;
          color: #6b7280;
          margin-bottom: 10px;
          line-height: 1.5;
        }

        .pill-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 6px;
        }
        .modern-pill {
          background: #f3f4f6;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #4b5563;
        }

        .weekly-section {
          margin-top: 24px;
        }

        .weekly-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #1f2937;
          margin-bottom: 10px;
          border-right: 4px solid ${PRIMARY_COLOR};
          padding-right: 8px;
          display: inline-block;
        }

        .chart-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 22px;
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
          min-height: 320px;
        }
      `}</style>

      <section className="progress-wrap">
        {/* Header */}
        <div className="fc-top">
          <div className="title-block">
            <h3 className="title">
              {firstName
                ? `أهلاً ${firstName}، إليك تقدّمك اليوم`
                : "لوحة التقدّم اليومي"}
            </h3>

            <div className="date-line">اليوم هو: {today}</div>
          </div>

          <Link to="/" className="modern-action-btn">
            رجوع
          </Link>
        </div>

        {/* كروت المؤشرات */}
        <div className="cards-row">
          <KpiCard
            icon={GaugeCircle}
            title="نسبة التقدّم الإجمالية"
            value={`${progressPercent}%`}
            subText="النسبة المئوية التي حققتها من أهدافك."
            pill1={
              data?.date
                ? `حتى تاريخ ${formatArabicGregorianDateFromISO(data.date)}`
                : "جاري التحديث"
            }
          />

          <KpiCard
            icon={CheckCircle}
            title="المهام المنجزة"
            value={`${data.completedTasks} / ${data.totalTasks}`}
            subText="عدد المهام التي أنهيتها من إجمالي مهامك."
            pill1={`منجزة: ${data.completedTasks}`}
            pill2={`متبقية: ${Math.max(
              (data.totalTasks || 0) - (data.completedTasks || 0),
              0
            )}`}
          />

          <KpiCard
            icon={Clock}
            title="الجلسات الدراسية"
            value={data.sessionsToday}
            subText="عدد جلسات التركيز التي سجّلها النظام اليوم."
          />

          <KpiCard
            icon={TrendingUp}
            title="تحسّن نتائج الاختبار"
            value={improvement > 0 ? `+${improvement}` : improvement}
            subText="تغيّر نتيجتك بين آخر اختبارين (القيمة الأعلى تعني تحسّن أكبر)."
            pillColor={improvement > 0 ? "#10b981" : "#ef4444"}
          />
        </div>

        {/* الرسم البياني */}
        <div className="weekly-section">
          <h4 className="weekly-title"> التقدم الاسبوعي  </h4>

          {history.length > 0 ? (
            <div className="chart-card">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      rtl: true,
                      titleFont: { family: "Cairo", size: 13, weight: "700" },
                      bodyFont: { family: "Cairo", size: 12 },
                    },
                  },
                  scales: {
                    y: {
                      min: 0,
                      max: 100,
                      ticks: {
                        font: { family: "Cairo", size: 11 },
                        callback: (value) => `${value}%`,
                      },
                      grid: { color: "#f3f4f6" },
                    },
                    x: {
                      ticks: { font: { family: "Cairo", size: 11 } },
                      grid: { display: false },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div
              className="modern-progress-card"
              style={{ textAlign: "center", padding: "40px" }}
            >
              <p className="kpi-sub">
                لا توجد بيانات تاريخية كافية لعرض الرسم البياني بعد.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
