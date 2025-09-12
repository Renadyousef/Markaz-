/*import LandingHeader from "./LandingHeader"
export default function LandingPage(){
    return <LandingHeader/>
}*/

/*import { Link } from "react-router-dom";
import LandingHeader from "./LandingHeader";
import "./landing.css";

export default function LandingPage() {
  return (
    <main className="landing-bg">
      <div className="landing-actions">
      <Link to="/signin" className="btn primary">تسجيل الدخول</Link>
       <Link to="/signup" className="btn ghost">انشاء حساب</Link>
      </div>

      <LandingHeader />
    </main>
  );
}*/ //mine

// LandingPage.jsx
// LandingPage.jsx
// LandingPage.jsx
// LandingPage.jsx
import "./landing.css";

const features = [
  { icon: "/Chatbot.svg", title: "شات بوت",
    desc: "مساعد ذكي يجيب فورًا ويبسّط المفاهيم.\nيقترح مصادر مناسبة وفق مستواك.\nيرافقك خطوة بخطوة أثناء المذاكرة." },
  { icon: "/Quiz.svg", title: "الاختبارات",
    desc: "اختبارات سريعة قابلة للتخصيص.\nتحليل فوري للإجابات وتكرار للأسئلة الصعبة.\nتابع تقدّمك سؤالًا بعد سؤال." },
  { icon: "/Flashcards.svg", title: "البطاقات التعليمية",
    desc: "تكرار متباعد يحفّظك بذكاء.\nأمثلة وصور لربط المعلومة بالذاكرة.\nمزامنة عبر أجهزتك." },
  { icon: "/Progress.svg", title: "متابعة التقدم",
    desc: "لوحات واضحة لدرجاتك ووقتك.\nحدّد نقاط القوة والضعف بسهولة.\nاقتراحات عملية لتحسين الأداء." },
  { icon: "/TaskList.svg", title: "المهام",
    desc: "خطّط يومك بقوائم مرنة وتنبيهات.\nاربط المهام بالدروس والاختبارات.\nإنجازات صغيرة تصنع فارقًا كبيرًا." },
  { icon: "/timer.svg", title: "جلسات المذاكرة",
    desc: "مؤقّت بومودورو وأهداف قابلة للقياس.\nجلسات قصيرة مركّزة مع فواصل راحة.\nادخل في حالة تركيز عميق بسهولة." },
];

export default function LandingPage() {
  const goToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main dir="rtl">
      {/* === HERO === */}
      <section className="landing-bg">
        <img src="/logo.svg" alt="شعار مركز" className="site-logo" />

        <div className="hero-header">
          <a href="/signin" className="chip chip--primary">تسجيل الدخول</a>
          <a href="/signup" className="chip chip--light">إنشاء حساب</a>
        </div>

        <div className="hero-text">
          <h1 className="hero-title">
            مرحبًا بك في <span className="accent">مركز</span>
          </h1>
          <p className="hero-subtitle">
            هنا تصبح كل خطوة نحو التميّز أسهل وأقرب. اكتشف أدوات، خدمات، ونصائح
            تساعدك على الإبداع والتطوّر، وابدأ رحلتك نحو النجاح بثقة وسلاسة.
          </p>

          {/* NEW: smooth scroll button */}
          <button type="button" className="cta-explore" onClick={goToFeatures}>
            تعرّف أكثر
          </button>
        </div>

        <div className="book-group">
          <img src="/book.svg" alt="" className="book" />
          <div className="icon i-timer" />
          <div className="icon i-tasklist" />
          <div className="icon i-chatbot" />
          <div className="icon i-flashcards" />
          <div className="icon i-quiz" />
          <div className="icon i-progress" />
        </div>
      </section>

      {/* === FEATURES (target) === */}
       {/* === FEATURES (target) === */}
<section id="features" className="features" aria-label="features">
  <div className="features__container">
    <div className="features__grid">
      {features.map((f, idx) => (
        <article className="feature-card" key={f.title}>
          {/* fixed box so the card size never changes */}
          <div className="feature-card__icon-box" data-card={idx + 1}>
            <img className="feature-card__icon" src={f.icon} alt="" />
          </div>

          <h3 className="feature-card__title">{f.title}</h3>
          <p className="feature-card__desc">{f.desc}</p>
        </article>
      ))}
    </div>
  </div>
</section>

    </main>
  );
}
