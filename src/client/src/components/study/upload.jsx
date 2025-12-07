// client/src/components/study/upload.jsx

import { useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FileUp,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Layers3,
} from "lucide-react";

const styles = `
:root{
  --ring: var(--ring, #e5e7eb);
  --surface: var(--surface, #ffffff);
  --shadow: var(--shadow, 0 14px 36px rgba(15,23,42,.06));
  --bar-fill: var(--bar-fill, #ff8c42);
}

/* الخط العام */
body{
  font-family: "Cairo", "Helvetica Neue", sans-serif;
}

/* لوح مركزي */
.panel.centerPanel{
  display:grid; place-items:center;
  background: var(--surface);
  border:1px solid var(--ring);
  border-radius:18px;
  box-shadow: var(--shadow);
  padding: clamp(12px, 2vw, 24px);
}

/* حاوية للتمركز العمودي */
.uploadWrap{
  min-height: min(62vh, 560px);
  width: min(92vw, 980px);
  display:grid; place-items:center;
}

/* مربّع الرفع */
.uploadBox{
  width: clamp(260px, 42vw, 420px);
  aspect-ratio: 1 / 1;
  border: 2px dashed #ffdbbf;
  border-radius: 24px;
  background: #ffffff;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  gap: 14px;
  padding: clamp(16px, 2vw, 22px);
  box-shadow: 0 12px 28px rgba(255,140,66,.10);
  text-align:center;
  cursor: default;
  transition: box-shadow .2s ease, border-color .2s ease, background .2s ease, transform .12s ease;
}
.uploadBox.isDrag{
  border-color:#ff8c42;
  background:#fff7ed;
  box-shadow:0 16px 36px rgba(255,140,66,.18);
}
.uploadBox.isUploading{ opacity:.95; }

/* الأيقونة */
.uploadBox__ico{
  width: clamp(56px, 6vw, 76px);
  height: clamp(56px, 6vw, 76px);
  border-radius: 18px;
  display:grid; place-items:center;
  background:#fffbf5;
  color:#ff8c42;
  border:1px solid #ffdbbf;
  box-shadow: 0 8px 18px rgba(255,140,66,.10);
}
.uploadBox__ico svg{
  width: clamp(28px, 3.6vw, 38px);
  height: clamp(28px, 3.6vw, 38px);
}

/* العناوين */
.uploadBox__text{ display:flex; flex-direction:column; gap:6px; }
.uploadBox__title{ font-weight: 900; font-size: clamp(15px, 1.2vw, 16px); color:#0f172a; }
.uploadBox__sub{ font-size: clamp(12px, 1vw, 13px); color:#64748b; }

/* زر اختيار ملف */
.uploadBox__btn{
  padding:10px 16px; border-radius:12px;
  border:1px solid #ffdbbf; background:#fff;
  font-weight:800; font-size:13px; cursor:pointer;
  box-shadow:0 8px 18px rgba(255,140,66,.16);
  transition:.15s ease;
}
.uploadBox__btn:hover{ transform:translateY(-1px); background:#fff7ed; }

/* كارد بعد الرفع */
.upRow{
  width: clamp(260px, 42vw, 420px);
  display:flex;
  flex-direction:column;
  gap:8px;
  margin-top:16px;
  background:#fff;
  border:1px solid #e5e7eb;
  border-radius:16px;
  padding:12px 14px;
  box-shadow:0 10px 24px rgba(148,163,184,.16);
}

/* رأس الكارد (اسم الملف + الحجم) */
.upHeader{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
}
.upFileMeta{
  display:flex;
  align-items:center;
  gap:10px;
  min-width:0;
}
.upFileIcon{
  width:32px;
  height:32px;
  border-radius:999px;
  background:#fffbf5;
  color:#ff8c42;
  display:grid;
  place-items:center;
  border:1px solid #ffdbbf;
  flex-shrink:0;
}
.upMetaText{
  display:flex;
  flex-direction:column;
  gap:2px;
  min-width:0;
}
.upName{
  font-weight:900;
  color:#0f172a;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  font-size:13px;
}
.upSizes{
  color:#64748b;
  font-size:12px;
}

/* شريط التقدّم */
.upProg{
  height:8px; width:100%;
  border-radius:999px;
  background:#f3f4f6;
  overflow:hidden;
  border:1px solid #ffdbbf;
}
.upProg__bar{
  height:100%;
  width:0%;
  background:#ff8c42;
  transition:width .25s ease;
}

/* أزرار التوليد */
.upActionsMain{
  margin-top:8px;
  display:flex;
  gap:8px;
  justify-content:flex-end;
  flex-wrap:wrap;
}

/* زر إعادة الرفع تحت */
.upActionsBottom{
  margin-top:8px;
  display:flex;
  justify-content:flex-start;
}

/* أزرار عامة */
.upBtn{
  padding:6px 10px;
  border-radius:10px;
  font-weight:800;
  font-size:12.5px;
  border:1px solid #ffdbbf;
  background:#fff;
  cursor:pointer;
  transition:.15s;
  display:inline-flex;
  align-items:center;
  gap:6px;
}
.upBtn svg{
  width:14px; height:14px;
}
.upBtn:hover{ background:#fff7ed; }
.upBtn.ghost{
  background:#ffffff;
}

/* رسالة الحالة */
.upMsg{
  display:flex;
  align-items:center;
  gap:6px;
  font-size:13px;
  font-weight:600;
  margin-top:6px;
}
.upMsg svg{
  width:16px;
  height:16px;
  flex-shrink:0;
}
.upMsg--ok{ color:#15803d; }
.upMsg--err{ color:#b91c1c; }

/* عنوان اللوحة */
.panel__title{
  margin:0 0 14px;
  font-size:clamp(16px, 1.4vw, 18px);
  font-weight:800;
  color:#111827;
  position:relative;
  padding-inline-start:10px;
}
.panel__title::before{
  content:"";
  position:absolute;
  inset-inline-start:0;
  top:50%;
  width:4px;
  height:1.1em;
  transform:translateY(-50%);
  border-radius:999px;
  background:#ff8c42;
}

/* تركيز لوحة المفاتيح */
.uploadBox:focus-visible{
  outline: 3px solid #ffdbbf;
  outline-offset: 4px;
}

/* أنيميشن الدوران */
.spin{
  animation:spin 1s linear infinite;
}
@keyframes spin{
  from{ transform:rotate(0deg); }
  to  { transform:rotate(360deg); }
}

/* ===== Breakpoints ===== */
@media (max-width: 1024px){
  .uploadWrap{ width: min(94vw, 820px); }
  .uploadBox{ width: min(70vw, 520px); }
  .upRow{ width: min(70vw, 520px); }
}
@media (max-width: 768px){
  .uploadWrap{ width: 92vw; min-height: auto; }
  .uploadBox{ width: 100%; aspect-ratio: auto; min-height: 240px; }
  .upRow{ width: 100%; }
  .upHeader{ flex-direction:column; align-items:flex-start; }
  .upActionsMain{ justify-content:flex-start; }
}
@media (max-width: 480px){
  .uploadBox{ width: 100%; min-height: 220px; border-radius: 18px; }
  .upRow{ width: 100%; }
}
  /* ===== Modal Overlay ===== */
.practice-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* ===== Modal Body ===== */
.practice-modal__body {
  background: #ffffff;
  padding: 22px;
  border-radius: 16px;
  width: clamp(260px, 80vw, 380px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: pop 0.25s ease;
}

/* العنوان */
.practice-modal__body h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
}

/* أزرار */
.practice-modal__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.practice-modal__actions button {
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  border: none;
}

.practice-modal__actions .ghost {
  background: #f1f5f9;
  color: #475569;
}

.practice-modal__actions .solid {
  background: #ff8c42;
  color: #fff;
}

.practice-modal__actions .ghost:hover {
  background: #e2e8f0;
}

.practice-modal__actions .solid:hover {
  background: #ff7a1e;
}

/* Animation */
@keyframes pop {
  from { transform: scale(0.9); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

`;

/* دالة لاستخراج رسالة خطأ مفهومة */
function extractErr(e) {
  if (axios.isCancel?.(e)) return "تم إلغاء الرفع.";
  const res = e?.response;
  const data = res?.data;
  return (
    data?.msg ||
    data?.error ||
    e?.message ||
    "حدث خطأ غير متوقع أثناء رفع الملف."
  );
}

/* تنسيق حجم الملف */
function fmtSize(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "";
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} كيلوبايت`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} ميجابايت`;
}

/* التحقق من الملف */
function validateFile(f, maxMB) {
  if (!f) return "الرجاء اختيار ملف.";
  const name = f.name?.toLowerCase?.() || "";
  if (f.type !== "application/pdf" && !name.endsWith(".pdf")) {
    return "فقط ملفات PDF مسموحة.";
  }
  const maxBytes = maxMB * 1024 * 1024;
  if (f.size > maxBytes) {
    return `حجم الملف يتجاوز ${maxMB} ميجابايت.`;
  }
  return "";
}

export default function Upload({ maxMB = 20 }) {
  const navigate = useNavigate();
  const endpointUpload = "http://localhost:5000/home/upload-pdf";

  const inputRef = useRef(null);
  const cancelRef = useRef(null);

  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [bytes, setBytes] = useState({ loaded: 0, total: 0 });
  const [status, setStatus] = useState("idle");   // idle | uploading | done | error
  const [message, setMessage] = useState("");

  // ⬇️ جديد — تفعيل البوب أب + الاسم المخصص
const [namePromptOpen, setNamePromptOpen] = useState(false);
const [pdfName, setPdfName] = useState("");
const [displayName, setDisplayName] = useState("");


  const [pdfId, setPdfId] = useState(null); // تخزين pdfId بعد الرفع

  const isUploading = status === "uploading";
  const isDone = status === "done";
  const isError = status === "error";

  const selectClick = () => inputRef.current?.click();

  const reset = () => {
    setStatus("idle");
    setFile(null);
    setProgress(0);
    setBytes({ loaded: 0, total: 0 });
    setMessage("");
    setPdfId(null);
  };

  const cancelUpload = () => {
    cancelRef.current?.cancel?.();
    reset();
    setStatus("error");
    setMessage("تم إلغاء الرفع.");
  };

  const startUpload = async (f, customName = "") => {

    const err = validateFile(f, maxMB);
    if (err) {
      setStatus("error");
      setMessage(err);
      setFile(null);
      setProgress(0);
      setBytes({ loaded: 0, total: 0 });
      return;
    }

    setFile(f);
    setStatus("uploading");
    setMessage("");

    try {
      const form = new FormData();
      form.append("pdf", f);
      // ⬇️ جديد — نرسل اسم المستخدم للسيرفر
form.append("customName", customName);

      const token = localStorage.getItem("token") || "";
      const source = axios.CancelToken.source();
      cancelRef.current = source;

      const res = await axios.post(endpointUpload, form, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        onUploadProgress: (e) => {
          const total = e.total || f.size;
          const pct = total ? Math.round((e.loaded * 100) / total) : 0;
          setProgress(pct);
          setBytes({ loaded: e.loaded, total });
        },
        cancelToken: source.token,
        validateStatus: () => true,
      });

      if (res.data?.ok) {
        if (res.data.savedId) {
          setPdfId(res.data.savedId);
        }
        setStatus("done");
        // بدون إيموجي
        setMessage("تم رفع الملف بنجاح. يمكنك الآن توليد اختبار أو بطاقات مراجعة.");

 

      } else {
        setStatus("error");
        const msg = res.data?.msg || res.data?.error || `HTTP ${res.status}`;
        setMessage(msg);
      }
    } catch (e) {
      setStatus("error");
      setMessage(extractErr(e));
      console.error("UPLOAD ERROR =>", {
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
      });
    }
  };

 const onInputChange = (e) => {
  const f = e.target.files?.[0];
  if (f) {
    setFile(f);              // نخزن الملف
    setNamePromptOpen(true); // نفتح البوب-أب
  }
  e.target.value = "";
};


  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = (e) => { e.preventDefault(); setDragOver(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
  setFile(f);
setDisplayName(f.name); // ← الاسم الأساسي
setNamePromptOpen(true);

}

  };

  // تمرير pdfId عند الذهاب لصفحة الكويز
  function handelQuiz() {
    if (!pdfId) return;
    navigate("/get-quiz", { state: { pdfId } });
  }

  function handleFlashcards() {
    if (!pdfId) return;
    navigate("/flashcards", {
      state: { pdfId },
    });
  }

  function confirmName() {
  if (!pdfName.trim()) return;

  // نحدّث اسم الملف الظاهر مباشرة
  setDisplayName(pdfName + ".pdf");

  setNamePromptOpen(false);

  // نبدأ الرفع بالاسم الجديد
  startUpload(file, pdfName);
}




  const percentLabel =
    isUploading && progress ? `${progress.toFixed(0)}٪` : "";

  const handleReuploadClick = () => {
    reset();
    // نفتح اختيار ملف مباشرة بعد إعادة الضبط
    setTimeout(() => {
      selectClick();
    }, 0);
  };

  return (
    <>
      <style>{styles}</style>
      <section className="panel centerPanel" aria-labelledby="upl-title">
        <h2 id="upl-title" className="panel__title">
          مولّد الاختبارات والبطاقات
        </h2>

        <div className="uploadWrap">
          <div
            className={`uploadBox ${dragOver ? "isDrag" : ""} ${
              isUploading ? "isUploading" : ""
            }`}
            onDragOver={onDragOver}
            onDragEnter={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="button"
            aria-label="رفع ملف PDF"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && selectClick()
            }
            onClick={selectClick}
          >
            <div className="uploadBox__ico" aria-hidden>
              <FileUp />
            </div>
            <div className="uploadBox__text">
              <div className="uploadBox__title">إضافة ملف PDF</div>
              <div className="uploadBox__sub">
                اسحب وأفلت الملف هنا أو اختر من جهازك — فقط PDF (حد 30 صفحة)
              </div>
            </div>
            <button
              type="button"
              className="uploadBox__btn"
              disabled={isUploading}
            >
              اختيار ملف
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={onInputChange}
              style={{ display: "none" }}
            />
          </div>

          {(isUploading || file || isDone || isError) && (
            <div className="upRow" aria-live="polite">
              {/* اسم الملف + الحجم */}
<div className="upHeader">
  <div
    className="upFileMeta"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap",
    }}
  >
    {/* الأيقونة أولاً */}
    <div
      className="upFileIcon"
      aria-hidden
      style={{
        background: "#fffbf5",
        border: "1px solid #ffdbbf",
        color: "#ff8c42",
        width: "32px",
        height: "32px",
        borderRadius: "999px",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <FileText />
    </div>

    {/* النص الأسود */}
    <span
      style={{
        fontWeight: "900",
        fontSize: "16px",
        color: "#0f172a",
        whiteSpace: "nowrap",
      }}
    >
      اسم الملف :
    </span>

    {/* اسم الملف بالأسود */}
    <span
      style={{
        fontWeight: "900",
        fontSize: "16px",
        color: "#0f172a",
        maxWidth: "240px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
{displayName || (isError ? "فشل الرفع" : "لا يوجد ملف")}
    </span>
  </div>
</div>


              {/* شريط التقدّم أثناء الرفع */}
              {isUploading && (
                <div
                  className="upProg"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div
                    className="upProg__bar"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* رسالة الحالة تحت الهيدر */}
              {message && !isUploading && (
                <div
                  className={`upMsg ${
                    isError ? "upMsg--err" : isDone ? "upMsg--ok" : ""
                  }`}
                >
                  {isError && <AlertCircle />}
                  {isDone && <CheckCircle2 />}
                  {!isError && !isDone && <Loader2 className="spin" />}
                  <span>{message}</span>
                </div>
              )}

              {/* أزرار التوليد في صف واحد */}
              <div className="upActionsMain">
                {isUploading && (
                  <button
                    className="upBtn ghost"
                    type="button"
                    onClick={cancelUpload}
                  >
                    <XIcon /> إلغاء
                  </button>
                )}

                {isDone && (
                  <>
                    <button
                      type="button"
                      onClick={handelQuiz}
                      className="upBtn"
                    >
                      <FileQuestion /> توليد اختبار
                    </button>
                    <button
                      type="button"
                      className="upBtn"
                      onClick={handleFlashcards}
                    >
                      <Layers3 /> توليد بطاقات مراجعة
                    </button>
                  </>
                )}
              </div>

              {/* زر إعادة الرفع تحت التوليدات */}
              {(isDone || isError) && (
                <div className="upActionsBottom">
                  <button
                    type="button"
                    className="upBtn ghost"
                    onClick={handleReuploadClick}
                  >
                    إعادة رفع ملف
                  </button>
                </div>
              )}
            </div>
          )}
        </div>


        {namePromptOpen && (
  <div className="practice-modal">
    <div className="practice-modal__body">
      <h3>اسمّي ملف الـ PDF</h3>

      <input
        type="text"
        value={pdfName}
        onChange={(e) => setPdfName(e.target.value)}
        placeholder="اكتبي اسم الملف"
        style={{
          width:"100%",
          padding:"12px",
          borderRadius:"12px",
          border:"1px solid #e5e7eb"
        }}
      />

      <div className="practice-modal__actions">
        <button className="ghost" onClick={() => setNamePromptOpen(false)}>
          إلغاء
        </button>

        <button className="solid" onClick={confirmName}>
          تأكيد
        </button>
      </div>
    </div>
  </div>
)}
      </section>
    </>
  );
}




/* أيقونة X صغيرة */
function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}