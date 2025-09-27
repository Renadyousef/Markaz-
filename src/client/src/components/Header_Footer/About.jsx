
import "./page-section.css";

export default function About() {
  return (
    <section className="about-section" dir="rtl" lang="ar" aria-label="عن المشروع">
      {/* عناصر ديكورية */}
      <div className="about-orb orb-1" aria-hidden="true" />
      <div className="about-orb orb-2" aria-hidden="true" />
      <div className="about-orb orb-3" aria-hidden="true" />

      <div className="about-wrapper">
        <h1 className="about-title reveal">عن المشروع</h1>

        <p className="about-text reveal delay-1">
         <p></p>هو منصة تعليمية ذكية تهدف إلى مساعدة الطلاب في تنظيم 
    
          وقتهم وتحسين أسلوب مذاكرتهم من خلال أدوات مبتكرة مثل الخطط الدراسية التفاعلية،
          الاختبارات القصيرة، والدردشة الذكية لشرح الدروس وحل الأسئلة.
        </p>

        <p className="about-text reveal delay-2">
          تم تطويره ليكون رفيقك الدراسي الذكي، حيث يجمع بين سهولة الاستخدام
          والذكاء الاصطناعي لتوفير تجربة تعليمية ممتعة وفعالة.
        </p>

        <p className="about-text reveal delay-3">
          رؤيتنا هي بناء جيل من الطلاب قادر على استغلال وقته بكفاءة وتحقيق أعلى
          الإنجازات الأكاديمية.
        </p>
      </div>
    </section>
  );
}


