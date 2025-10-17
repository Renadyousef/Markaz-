// src/components/landingPage/LandingPage.jsx
import "./landing.css";
import { Navbar, Container, Button } from "react-bootstrap";

const features = [
  {
    icon: "/Chatbot.svg",
    title: "شات بوت",
    desc: "مساعد ذكي يجيب فورًا ويبسّط المفاهيم.\nيقترح مصادر مناسبة وفق مستواك.\nيرافقك خطوة بخطوة أثناء المذاكرة.",
  },
  {
    icon: "/Quiz.svg",
    title: "الاختبارات",
    desc: "اختبارات سريعة قابلة للتخصيص.\nتحليل فوري للإجابات وتكرار للأسئلة الصعبة.\nتابع تقدّمك سؤالًا بعد سؤال.",
  },
  {
    icon: "/Flashcards.svg",
    title: "البطاقات التعليمية",
    desc: "تكرار متباعد يحفّظك بذكاء.\nأمثلة وصور لربط المعلومة بالذاكرة.\nمزامنة عبر أجهزتك.",
  },
  {
    icon: "/Progress.svg",
    title: "متابعة التقدم",
    desc: "لوحات واضحة لدرجاتك ووقتك.\nحدّد نقاط القوة والضعف بسهولة.\nاقتراحات عملية لتحسين الأداء.",
  },
  {
    icon: "/TaskList.svg",
    title: "المهام",
    desc: "خطّط يومك بقوائم مرنة وتنبيهات.\nاربط المهام بالدروس والاختبارات.\nإنجازات صغيرة تصنع فارقًا كبيرًا.",
  },
  {
    icon: "/timer.svg",
    title: "جلسات المذاكرة",
    desc: "مؤقّت بومودورو وأهداف قابلة للقياس.\nجلسات قصيرة مركّزة مع فواصل راحة.\nادخل في حالة تركيز عميق بسهولة.",
  },
];

export default function LandingPage({ goTo }) {
  const goToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main dir="rtl">
      {/* === HEADER === */}
      <Navbar
        fixed="top"
        expand={false}
        className="shadow-sm custom-navbar"
        style={{
          background: "#fdddcdf1",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Container fluid className="d-flex justify-content-between align-items-center">
          {/* Logo */}
          <Navbar.Brand href="#">
            <img
              src="/logo3.svg"
              alt="شعار مركز"
              style={{ height: "50px", width: "50px" }}
            />
          </Navbar.Brand>

          {/* Start button */}
          <Button
            variant="warning"
            className="fw-bold px-4"
            style={{ backgroundColor: "#ff914d", border: "none", color: "#ffffff" }}
            onClick={() => goTo("auth", "signin")} // ✅ use the goTo prop
          >
            ابدا الان
          </Button>
        </Container>
      </Navbar>

      {/* === HERO === */}
      <section className="landing-bg">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              مرحبًا بك في <span className="accent">مركز</span>
            </h1>
            <p className="hero-subtitle">
              هنا تصبح كل خطوة نحو التميّز أسهل وأقرب. اكتشف أدوات، خدمات، ونصائح
              تساعدك على الإبداع والتطوّر، وابدأ رحلتك نحو النجاح بثقة وسلاسة.
            </p>

            <Button
              type="button"
              className="cta-explore"
              style={{ backgroundColor: "#ff914d", color: "#fff", border: "none" }}
              onClick={goToFeatures}
            >
              تعرّف أكثر
            </Button>
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
        </div>
      </section>

      {/* === FEATURES === */}
      <section id="features" className="features" aria-label="features">
        <div className="features__container">
          <div className="features__grid">
            {features.map((f, idx) => (
              <article className="feature-card" key={f.title}>
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
