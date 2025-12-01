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

          {/* مقدمة */}
          <p className="about-text reveal delay-1">
            في مركز نهتم بخصوصية بياناتك، ونوضح لك هنا بشكل مبسّط كيف يتم جمعها واستخدامها وحمايتها.
          </p>

          {/* ===== صف واحد من 3 كاردز ===== */}
          <div className="policy-row reveal delay-2">

            {/* Card 1 */}
            <div className="policy-card">
              <h2 className="policy-card-title">المعلومات التي نجمعها</h2>
              <p className="policy-card-text">
                نجمع الاسم، البريد الإلكتروني، وبعض التفضيلات لضمان تجربة استخدام أفضل.
              </p>
            </div>

            {/* Card 2 */}
            <div className="policy-card">
              <h2 className="policy-card-title">كيفية استخدام المعلومات</h2>
              <p className="policy-card-text">
                نستخدم بياناتك لتخصيص المحتوى، تحسين أداء التطبيق، وتقديم الدعم عند الحاجة.
              </p>
            </div>

            {/* Card 3 */}
            <div className="policy-card">
              <h2 className="policy-card-title">حماية البيانات</h2>
              <p className="policy-card-text">
                نطبّق تقنيات أمان حديثة ولا نشارك معلوماتك إلا إذا طُلب قانونياً.
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
