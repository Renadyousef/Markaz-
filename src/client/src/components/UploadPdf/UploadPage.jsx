import "./Home.css";
export default function UploadPage(){
      <div className="uploadBox" aria-label="رفع ملف">
        <div className="uploadBox__content">
          <div className="uploadBox__ico" aria-hidden>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 3H6a2 2 0 0 0-2 2v14l4-2 4 2 4-2 4 2V9z" />
            </svg>
          </div>
          <div className="uploadBox__text">
            <div className="uploadBox__title">إضافة ملف</div>
            <div className="uploadBox__sub">الملف سيُستخدم لإنشاء اختبارات وبطاقات تعليمية</div>
          </div>
        </div>

        <button type="button" className="uploadBox__btn">اختيار ملف</button>
      </div>
}