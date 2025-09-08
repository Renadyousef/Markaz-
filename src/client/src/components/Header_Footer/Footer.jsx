export default function Footer() {
  return (
    <footer className="mkzFooter" dir="rtl">
      <div className="mkzFooter__top">
        <a href="#" className="mkzBrand">
          <img src="/logo.png" alt="شعار مركز" />
          <span>مركز</span>
        </a>
      </div>

      <ul className="mkzLinks">
        <li><a href="#">عن المشروع</a></li>
        <li><a href="#">سياسة الخصوصية</a></li>
        <li><a href="#">تواصل معنا</a></li>
      </ul>

    
      <hr className="mkzDivider" />

      <div className="mkzFooter__bottom">
        <span>© 2025 مركز™. جميع الحقوق محفوظة.</span>
      </div>
    </footer>
  );
}
