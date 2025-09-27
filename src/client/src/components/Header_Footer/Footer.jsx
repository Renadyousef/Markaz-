import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mkzFooter" dir="rtl">
      <div className="mkzFooter__top">
        <Link to="/" className="mkzBrand" style={{ cursor: "pointer" }}>
          <img src="/logo1.png" alt="شعار مركز" />
          <span>مركز</span>
        </Link>
      </div>

      <ul className="mkzLinks">
        <li><Link to="/about">عن المشروع</Link></li>
        <li><Link to="/privacy">سياسة الخصوصية</Link></li>
        <li><Link to="/contact">تواصل معنا</Link></li>
      </ul>

      <hr className="mkzDivider" />
      <div className="mkzFooter__bottom">
        <span>© 2025 مركز™. جميع الحقوق محفوظة.</span>
      </div>
    </footer>
  );
}
