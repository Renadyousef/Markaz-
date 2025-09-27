
import "./page-section.css";

export default function Contact() {
  return (
    <section className="about-section" dir="rtl" lang="ar" aria-label="تواصل معنا">
      {/* أوربز الخلفية */}
      <div className="about-orb orb-1" aria-hidden="true" />
      <div className="about-orb orb-2" aria-hidden="true" />
      <div className="about-orb orb-3" aria-hidden="true" />

      <div className="about-wrapper">
        {/* العنوان فقط بالنص */}
        <h1 className="about-title reveal text-center">تواصل معنا</h1>

        {/* المحتوى يمين */}
        <div className="about-content">
          <p className="about-text reveal delay-1">
            يسعدنا تواصلك معنا في حال وجود أي استفسار أو اقتراح حول التطبيق.
          </p>

          <h2 className="about-subtitle reveal delay-2">البريد الإلكتروني</h2>
          <p className="about-text reveal delay-2">
            <a href="mailto:support@markaz.com" className="about-link">support@markaz.com</a>
          </p>

          <h2 className="about-subtitle reveal delay-3">العنوان</h2>
          <p className="about-text reveal delay-3">
            الرياض، المملكة العربية السعودية
          </p>
        </div>
      </div>
    </section>
  );
}



