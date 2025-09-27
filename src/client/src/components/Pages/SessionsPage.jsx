
export default function SessionsPage() {
  return (
    <section className="about-section" dir="rtl" lang="ar" aria-label="الجلسات الدراسية">
      <div className="about-orb orb-1" aria-hidden="true" />
      <div className="about-orb orb-2" aria-hidden="true" />
      <div className="about-orb orb-3" aria-hidden="true" />

      <div className="about-wrapper">
        <h1 className="about-title reveal text-center">الجلسات الدراسية</h1>

        <div className="about-content">
          <p className="about-text reveal delay-1">
            هنا يمكنك بدء جلسة مذاكرة جديدة أو متابعة الجلسات السابقة.  
            الهدف هو مساعدتك على تنظيم وقتك ومتابعة تقدمك الدراسي بشكل أفضل.
          </p>

          <h2 className="about-subtitle reveal delay-2">ابدأ جلسة جديدة</h2>
          <p className="about-text reveal delay-2">
            اضغط على زر "بدء جلسة" لبدء جلسة جديدة وتحديد الوقت المطلوب.
          </p>

          <button className="uploadBox__btn">بدء جلسة</button>
        </div>
      </div>
    </section>
  );
}
