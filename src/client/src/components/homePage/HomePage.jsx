import { useEffect, useState } from "react";
import axios from "axios";
import "./Home.css";
import Upload from "../study/upload";
import { Routes, Route, Link } from "react-router-dom";
import GetQuiz from "../GenrateQuiz/GetQuiz";
import FlashCards from "../FlashCards/FlashCards.jsx";
import FlashCardsView from '../FlashCards/FlashCardView.jsx'
import ViewQuizzes from "../ViewQuizzesPage.jsx";


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

/* ========== 1) صف البطاقات الإحصائية (نفس ترتيب التصميم الثاني) ========== */
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

function StatsRow() {
  return (
    <section className="statsRow">
      {/* الخطط الدراسية المكتملة أولاً */}
      <StatCard
        label="الخطط الدراسية المكتملة"
        value={0}
        tone="green"
        d="M4 6h16M4 12h12M4 18h8"
      />
      {/* ثم الجلسات المكتملة */}
      <StatCard
        label="جلسات دراسية مكتملة"
        value={0}
        tone="green"
        d="M21 13a8 8 0 11-3-6.3M12 8v4l3 2"
      />
    </section>
  );
}

/* ========== 2) مولّد الكويز والبطاقات بنفس زر التصميم الثاني ========== */
function QuizFlashcardsBox() {
  return (
    <section className="panel">
      <h2 className="panel__title">مُولّد الاختبارات والبطاقات</h2>
      <Link to="upload" className="uploadBox__btn">
        ابدأ الآن
      </Link>
    </section>
  );
}

/* ========== 3) لوحة الوصول (باستخدام Link) ========== */
function FeatureAccessPanel() {
  return (
    <section className="panel" id="feature-shortcuts">
      <h2 className="panel__title">لوحة الوصول</h2>

      <div className="featureGrid">
        {/* الخطة الدراسية */}
        <article className="featureCard isPlan">
          <div className="featureIcon">
            <Ico d="M4 6h16M4 12h12M4 18h8" />
          </div>
          <h4 className="featureTitle">الخطة الدراسية</h4>
          <p className="featureDesc">نظّم جلساتك وحدّد أولوياتك بسهولة.</p>
          <Link to="/plans" className="featureCTA">
            <span className="arrow">↗</span>
            <span className="label">عرض الخطة</span>
          </Link>
        </article>

        {/* البطاقات التعليمية */}
        <article className="featureCard isCards">
          <div className="featureIcon">
            <Ico d="M3 9h18v10H3z M7 13h10M7 17h6" />
          </div>
          <h4 className="featureTitle">البطاقات التعليمية</h4>
          <p className="featureDesc">راجِع المفاهيم ببطاقات ذكية.</p>
          <Link to="/cards" className="featureCTA">
            <span className="arrow">↗</span>
            <span className="label">ابدأ المراجعة</span>
          </Link>
        </article>

        {/* الاختبارات */}
        <article className="featureCard isQuiz">
          <div className="featureIcon">
            <Ico d="M9 9a3 3 0 116 0c0 2-3 2-3 4 M12 17h.01" />
          </div>
          <h4 className="featureTitle">الاختبارات</h4>
          <p className="featureDesc">اختبر فهمك باختبارات تفاعلية.</p>
          <Link to="/quizzes" className="featureCTA">{/**where does this go */}
            <span className="arrow">↗</span>
            <span className="label">ابدأ الاختبار</span>
          </Link>
        </article>
        
{/* الجلسات الدراسية */}
<article className="featureCard isSessions">
  <div className="featureIcon">
    <Ico d="M12 8v5l3 2 M21 13a8 8 0 1 1-6-7.8" />
  </div>
  <h4 className="featureTitle">الجلسات الدراسية</h4>
  <p className="featureDesc">ابدأ جلسات مذاكرة وتتبع وقتك بسهولة.</p>
  <Link to="/sessions" className="featureCTA">
    <span className="arrow">↗</span>
    <span className="label">ابدأ جلسة</span>
  </Link>
</article>



        {/* الدردشة الذكية */}
        <article className="featureCard isChat">
          <div className="featureIcon">
            <Ico d="M21 15a4 4 0 01-4 4H8l-5 3 1.8-4.4A4 4 0 015 15V7a4 4 0 014-4h8a4 4 0 014 4v8z" />
          </div>
          <h4 className="featureTitle">الدردشة الذكية</h4>
          <p className="featureDesc">تحدّثي مع المساعد لشرح الدروس وحل الأسئلة.</p>
          <Link to="/chat" className="featureCTA">
            <span className="arrow">↗</span>
            <span className="label">ابدأ الدردشة</span>
          </Link>
        </article>
      </div>
    </section>
  );
}

/* ========== 5) التقدم الأسبوعي (نفس ستايل الحلقة) ========== */
function WeeklyProgress() {
  const days = [
    { d: "الأحد", h: 4, max: 4.5 },
    { d: "الإثنين", h: 3, max: 4 },
    { d: "الثلاثاء", h: 5, max: 5 },
    { d: "الأربعاء", h: 2, max: 3 },
    { d: "الخميس", h: 4.5, max: 4.5 },
    { d: "الجمعة", h: 1, max: 2 },
    { d: "السبت", h: 0, max: 2 },
  ];

  const pct = (h, max) =>
    Math.max(0, Math.min(100, Math.round((h / max) * 100)));
  const R = 20, C = 2 * Math.PI * R;
  const dash = (p) => C - (C * p) / 100;

  return (
    <section className="panel wp2Soft" id="section-progress">
      <div className="wp2Header">
        <h2 className="panel__title">التقدم الأسبوعي</h2>
      </div>
      <div className="wp2Grid">
        {days.map((x, i) => {
          const p = pct(x.h, x.max);
          return (
            <div
              key={i}
              className="wp2Card"
              role="group"
              aria-label={`${x.d}: ${x.h} من ${x.max} ساعة`}
            >
              <div className="ring sm">
                <svg viewBox="0 0 48 48" width="48" height="48" className="ringSvg" aria-hidden>
                  <circle cx="24" cy="24" r={R} className="ringBg" />
                  <circle
                    cx="24" cy="24" r={R}
                    className={`ringFg ${p >= 100 ? "isDone" : ""}`}
                    style={{ strokeDasharray: `${C}px`, strokeDashoffset: `${dash(p)}px` }}
                  />
                </svg>
                <div className="ringLabel">{p}%</div>
              </div>
              <div className="wp2Info">
                <div className="wp2Day">{x.d}</div>
                <div className="wp2Hours">
                  {x.h}س من {x.max}س
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ========== 6) تجميعة الأقسام ========== */
function DashboardBlocks() {
  return (
    <div className="gridWrap">
      <div className="col">
        <QuizFlashcardsBox />
        <FeatureAccessPanel />
      </div>
      <div className="col">
        <WeeklyProgress />
      </div>
    </div>
  );
}

/* ========== الصفحة الرئيسية (نفس منطقك + نفس شكل الهيرو) ========== */
export default function HomePage() {
  const [firstName, setFirstName] = useState("");
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
        const { data } = await axios.get("http://localhost:5000/home/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFirstName((data?.firstName || "").toString());
      } catch (e) {
        setErrorMsg(e?.response?.data?.msg || "تعذّر جلب الاسم.");
      } finally {
        setLoadingName(false);
      }
    })();
  }, []);

  return (
    <div className="hp">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <section className="heroBox">
                <div className="heroRow">
                  <div className="heroText">
                    <h1>
                      {loadingName
                        ? "جاري التحميل…"
                        : errorMsg
                        ? "مرحباً بعودتك!"
                        : `مرحباً بعودتك ${firstName ? firstName : "صديقي"}!`}
                    </h1>
                    <p>جاهزة لمتابعة رحلتك الدراسية؟</p>
                    {errorMsg && <div className="heroError">{errorMsg}</div>}
                  </div>
                </div>
              </section>

              {/* نفس ترتيب ودزاين الكود الثاني */}
              <StatsRow />
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
