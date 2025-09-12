import { useEffect, useState } from "react";
// ✅ الاستيراد الصحيح للستايل
import "./ui.css";

function Ico({ d, className = "icon" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="headerWrap">
      <div className="headerBar">
        <div className="brand">
          <div className="logoBox">🌟</div>
          <span>Markaz</span>
        </div>
        <nav>
          <ul className="navLinks">
            <li><a href="#">الرئيسية</a></li>
            <li><a href="#">المهام</a></li>
            <li><a href="#">الخطط</a></li>
            <li><a href="#">تسجيل الخروج</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
