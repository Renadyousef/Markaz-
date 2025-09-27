
import "./page-section.css";

export default function PrivacyPolicy() {
  return (
    <section className="about-section" dir="rtl" lang="ar" aria-label="سياسة الخصوصية">
      {/* أوربز الخلفية */}
      <div className="about-orb orb-1" aria-hidden="true" />
      <div className="about-orb orb-2" aria-hidden="true" />
      <div className="about-orb orb-3" aria-hidden="true" />

      <div className="about-wrapper">
        <h1 className="about-title reveal text-center">سياسة الخصوصية</h1>

        <div className="about-content">
          <p className="about-text reveal delay-1">
            في مركز نهتم بخصوصية بياناتك بشكل كبير. توضح هذه السياسة كيف يتم جمع واستخدام وحماية
            المعلومات الخاصة بك عند استخدام التطبيق.
          </p>

          <h2 className="about-subtitle reveal delay-2">المعلومات التي نجمعها</h2>
          <ul className="about-list reveal delay-2">
            <li>المعلومات الأساسية مثل الاسم والبريد الإلكتروني عند التسجيل.</li>
            <li>بيانات الاستخدام داخل التطبيق والإعدادات المفضلة.</li>
          </ul>

          <h2 className="about-subtitle reveal delay-3">كيفية استخدام المعلومات</h2>
          <ul className="about-list reveal delay-3">
            <li>تحسين تجربة المستخدم وتخصيص المحتوى.</li>
            <li>تقديم الدعم الفني والتواصل عند الحاجة.</li>
          </ul>

          <h2 className="about-subtitle reveal delay-3">حماية البيانات</h2>
          <p className="about-text reveal delay-3">
            نستخدم أحدث تقنيات الأمان لحماية بياناتك، ولا نشارك معلوماتك مع أي طرف ثالث إلا في
            الحالات التي يفرضها القانون.
          </p>
        </div>
      </div>
    </section>
  );
}

