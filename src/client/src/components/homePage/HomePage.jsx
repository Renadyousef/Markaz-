import { useEffect, useState } from "react";
import axios from "axios";
import "./Home.css";
import Upload from "../study/upload";
import { Routes, Route, Link } from "react-router-dom";
import GetQuiz from "../GenrateQuiz/GetQuiz";
import FlashCards from "../FlashCards/FlashCards.jsx";
import FlashCardsView from "../FlashCards/FlashCardView.jsx";
import ViewQuizzes from "../ViewQuizzesPage.jsx";

/* ===== ثوابت API للهوم والتقدّم ===== */
const API_HOME_ME = "http://localhost:5000/home/me";
const API_PROGRESS_ME = "http://localhost:5000/api/progress/me";

/* ===== ستايلات موحدة للخط + لوحة الوصول السريع ===== */
const styles = `
  .hp,
  .hp * {
    font-family: "Cairo", "Helvetica Neue", sans-serif;
  }

  .heroText h1 {
    font-size: 2.4rem;
    font-weight: 800;
    color: #111827;
    margin-bottom: 0.4rem;
  }
  .heroText p {
    font-size: 1rem;
    color: #6b7280;
    margin: 0;
  }

  /* إزالة الخطوط/الحدود داخل لوحة الوصول السريع */
  #feature-shortcuts {
    border: none;
  }
  #feature-shortcuts .featureGrid {
    border: none;
  }
  #feature-shortcuts .featureCard {
    border: none !important;
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  }
  #feature-shortcuts .featureCard::before,
  #feature-shortcuts .featureCard::after {
    display: none;
  }
`;

/* ========== أيقونة SVG قابلة لإعادة الاستخدام ========== */
function Ico({ d, className = "icon" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}

/* كارت ميزات (قابل للاستخدام لاحقاً) */
function Card({ d, title, desc, cta, onClick }) {
  return (
    <article className="hpCard">
      <div className="hpCard__icon">
        <Ico d={d} />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <button className="hpCard__cta" onClick={onClick}>
        {cta}
      </button>
    </article>
  );
}

/* ========== 1) صف البطاقات الإحصائية ========== */
function StatCard({ label, value = 0, d, tone = "green" }) {
  return (
    <div className={`statCard tone-${tone}`}>
      <div className="statCard__meta">
        <div className="statCard__label">{label}</div>
        <div className="statCard__value">{value}</div>
      </div>
      <div className="statCard__icon">
        <Ico d={d} />
      </div>
    </div>
  );
}

// ✅ عدد الخطط وعدد الجلسات
function StatsRow({ completedPlans = 0, completedSessions = 0 }) {
  return (
    <section className="statsRow">
      <StatCard
        label="الخطط الدراسية المكتملة"
        value={completedPlans}
        tone="green"
        d="M4 6h16M4 12h12M4 18h8"
      />
      <StatCard
        label="
         الجلسات الدراسية المكتملة "
        value={completedSessions}
        tone="green"
        d="M21 13a8 8 0 11-3-6.3M12 8v4l3 2"
      />
    </section>
  );
}

/* ========== 2) مولّد الكويز والبطاقات ========== */
function QuizFlashcardsBox() {
  return (
   <section className="panel quiz-box">
      <h2 className="panel__title">مُولّد الاختبارات والبطاقات</h2>
      <Link to="upload" className="uploadBox__btn">
        ابدأ الآن
      </Link>
    </section>
  );
}

/* ========== 5) التقدم الأسبوعي ========== */
/* ========== 5) التقدم الأسبوعي ========== */
/* ========== 5) التقدم الأسبوعي - دوائر صغيرة مودرن مع تاريخ كامل ========== */
function WeeklyProgress() {
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = [
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];

  // تحويل الأرقام إلى أرقام عربية (٠١٢٣٤٥٦٧٨٩)
  const toArabicDigits = (num) =>
    String(num).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

  // تنسيق التاريخ بالشكل: ٧ ديسمبر ٢٠٢٥
  const formatArabicFullDate = (date) => {
    const months = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];

    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    return `${toArabicDigits(day)} ${monthName} ${toArabicDigits(year)}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/progress/history",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = res.data.data || [];
        const today = new Date();

        const week = daysOfWeek.map((dayName, i) => {
          const day = new Date(today);
          // نخلي آخر عنصر = اليوم الحالي، والباقي للأيام السابقة
          day.setDate(today.getDate() - (6 - i));

          const iso = day.toISOString().slice(0, 10);
          const match = data.find((d) => d.date === iso);
          const percent = match ? match.percent : 0;

          return {
            dayName,
            dateLabel: formatArabicFullDate(day), // ⭐ هنا الفورمات الجديد
            percent,
          };
        });

        setWeekData(week);
      } catch (err) {
        console.error("Error loading weekly progress:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // إعداد الدائرة المصغّرة
  const R = 18; // نصف القطر (صغير)
  const C = 2 * Math.PI * R;
  const dash = (p) => {
    const clamped = Math.max(0, Math.min(100, p || 0));
    return C - (C * clamped) / 100;
  };

  return (
    <section className="panel wpBars" id="section-progress" dir="rtl">
      <div className="wp2Header">
        <h2 className="panel__title">تقدّمك الأسبوعي</h2>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#666" }}>
          جاري تحميل التقدّم...
        </p>
      ) : (
        <div className="wpBarsGrid">
          {weekData.map((x, i) => {
            const p = Math.round(x.percent || 0);

            return (
              <div
                key={i}
                className="wpDayCard"
                role="group"
                aria-label={`${x.dayName}: ${p}% في ${x.dateLabel}`}
              >
                <div className="wpCircleWrap">
                  <svg viewBox="0 0 50 50">
                    {/* الخلفية */}
                    <circle
                      className="wpCircleBg"
                      cx="25"
                      cy="25"
                      r={R}
                    />
                    {/* دائرة التقدّم البرتقالية */}
                    <circle
                      className="wpCircleFg"
                      cx="25"
                      cy="25"
                      r={R}
                      style={{
                        strokeDasharray: C,
                        strokeDashoffset: dash(p),
                      }}
                    />
                    {/* النسبة في الوسط */}
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dy="0.35em"
                      className="wpCircleText"
                    >
                      {p}%
                    </text>
                  </svg>
                </div>

                <div className="wpDayMeta">
                  <div className="wpDayName">{x.dayName}</div>
                  <div className="wpDayDate">{x.dateLabel}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}


/* ========== 6) تجميعة الأقسام ========== */
// الحين DashboardBlocks فيه بس التقدّم الأسبوعي
function DashboardBlocks() {
  return (
    <div className="gridWrap">
      <div className="col">
        <WeeklyProgress />
      </div>
    </div>
  );
}

/* ========== الصفحة الرئيسية ========== */
export default function HomePage() {
  const [firstName, setFirstName] = useState("");
  const [completedPlansCount, setCompletedPlansCount] = useState(0);   // الخطط المكتملة
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0); // الجلسات المكتملة
  const [loadingName, setLoadingName] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorMsg("لم يتم تسجيل الدخول.");
          setLoadingName(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [homeRes, progressRes] = await Promise.all([
          axios.get(API_HOME_ME, { headers }),
          axios.get(API_PROGRESS_ME, { headers }),
        ]);

   const homeData = homeRes.data || {};
const progData = progressRes.data || {}; // لو تحتاجينه لأشياء ثانية خليه

setFirstName((homeData.firstName || "").toString());
setCompletedPlansCount(homeData.completedPlansCount ?? 0);

// 🔥 هنا نستخدم العدد اللي يرجع من /home/me
setCompletedSessionsCount(
  homeData.completedSessionsCount ?? 0
);

      } catch (e) {
        setErrorMsg(e?.response?.data?.msg || "تعذّر جلب البيانات.");
      } finally {
        setLoadingName(false);
      }
    })();
  }, []);

  return (
    <div className="hp">
      <style>{styles}</style>

      <Routes>
        <Route
          path="/"
          element={
            <>
              {/* الترحيب */}
              <section className="heroBox">
                <div className="heroRow">
                  <div className="heroText">
                    <h1>
                      {loadingName
                        ? "جاري التحميل…"
                        : errorMsg
                        ? "مرحباً !"
                        : `مرحباً  ${firstName ? firstName : "صديقي"}!`}
                    </h1>
                    <p>هل أنت مستعد لمتابعة رحلتك الدراسية؟</p>
                    {errorMsg && <div className="heroError">{errorMsg}</div>}
                  </div>
                </div>
              </section>

              {/* ✅ أولاً: المولّد فوق */}
              <QuizFlashcardsBox />

              {/* ✅ ثانياً: كروت الإحصاءات (نفس الشكل الحالي) */}
              
              <StatsRow
                completedPlans={completedPlansCount}
                completedSessions={completedSessionsCount}
              />

              {/* ✅ ثالثاً: التقدّم الأسبوعي تحتهم */}
              <DashboardBlocks />
            </>
          }
        />
        <Route path="upload" element={<Upload />} />
        <Route path="get-quiz" element={<GetQuiz />} />
        <Route path="/cards" element={<FlashCards />} />
        <Route path="/cards/browse" element={<FlashCardsView />} />
        <Route path="/cards/view/:deckId" element={<FlashCardsView />} />
      </Routes>
    </div>
  );
}
