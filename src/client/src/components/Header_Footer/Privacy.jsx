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
            في مركز نهتم بخصوصية بياناتك بشكل كبير. توضح هذه السياسة كيفية جمع، استخدام،
            ومعالجة المعلومات الخاصة بك عند استخدامك للتطبيق.
          </p>

          <h2 className="about-subtitle reveal delay-2">المعلومات التي نجمعها</h2>
          <ul className="about-list reveal delay-2">
            <li>المعلومات الأساسية مثل الاسم والبريد الإلكتروني عند التسجيل.</li>
            <li>إعداداتك المفضلة داخل التطبيق وبيانات الاستخدام العامة.</li>
          </ul>

          <h2 className="about-subtitle reveal delay-3">كيفية استخدام المعلومات</h2>
          <ul className="about-list reveal delay-3">
            <li>تحسين تجربتك داخل التطبيق وتخصيص المحتوى وفق احتياجاتك.</li>
            <li>تقديم الدعم الفني والتواصل معك عند الضرورة.</li>
          </ul>

          <h2 className="about-subtitle reveal delay-3">حماية البيانات</h2>
          <p className="about-text reveal delay-3">
            نلتزم بحماية بياناتك باستخدام أحدث تقنيات الأمان، ولا تتم مشاركة معلوماتك مع أي طرف
            ثالث إلا في الحالات التي ينص عليها القانون.
          </p>

        </div>
      </div>
    </section>
  );
}
