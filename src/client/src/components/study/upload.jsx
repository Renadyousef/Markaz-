import { useRef, useState } from "react";
import axios from "axios";

const styles = `
:root{
  --ring: var(--ring, #eef1f5);
  --surface: var(--surface, #ffffff);
  --shadow: var(--shadow, 0 14px 36px rgba(2,6,23,.07));
  --bar-fill: var(--bar-fill, #f59e0b);
  --fx-card-ring: var(--fx-card-ring, #e5e7eb);
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
  border: 2px dashed #ffd7a6;
  border-radius: 24px;
  background: #ffffff;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  gap: 14px;
  padding: clamp(16px, 2vw, 22px);
  box-shadow: 0 12px 28px rgba(245,158,11,.08);
  text-align:center;
  cursor: default;
  transition: box-shadow .2s ease, border-color .2s ease, background .2s ease, transform .12s ease;
}
.uploadBox.isDrag{
  border-color:#f59e0b;
  background:#fffaf3;
  box-shadow:0 16px 36px rgba(245,158,11,.14);
}
.uploadBox.isUploading{ opacity:.95; }

/* الأيقونة */
.uploadBox__ico{
  width: clamp(56px, 6vw, 76px);
  height: clamp(56px, 6vw, 76px);
  border-radius: 18px;
  display:grid; place-items:center;
  background:#fff7ed; color:#f59e0b;
  border:1px solid #ffe4c7;
  box-shadow: 0 8px 18px rgba(255,122,0,.08);
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
  border:1px solid #ffd6a8; background:#fff;
  font-weight:800; font-size:13px; cursor:pointer;
  box-shadow:0 8px 18px rgba(255,122,0,.12);
  transition:.15s ease;
}
.uploadBox__btn:hover{ transform:translateY(-1px); background:#fff8f0; }

/* صف التقدّم */
.upRow{
  width: clamp(260px, 42vw, 420px);
  display:flex; flex-direction:column; gap:10px;
  margin-top:14px; background:#fff; border:1px solid #ffe4c7;
  border-radius:14px; padding:12px; box-shadow:0 8px 18px rgba(255,122,0,.06);
}
.upMeta{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
.upName{ font-weight:900; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.upSizes{ color:#64748b; font-size:13px; }

.upProg{
  height:8px; width:100%; border-radius:999px; background:#eef2f7;
  overflow:hidden; border:1px solid #ffe4c7;
}
.upProg__bar{ height:100%; width:0%; background:#f59e0b; transition:width .25s ease; }

/* أزرار الإجراءات */
.upActions{ display:flex; gap:8px; justify-content:flex-end; flex-wrap: wrap; }
.upBtn{
  padding:6px 10px; border-radius:10px; font-weight:800; font-size:12.5px;
  border:1px solid #ffd6a8; background:#fff; cursor:pointer; transition:.15s;
}
.upBtn:hover{ background:#fff8f0; }
.upBtn.ghost{ background:#ffffff; }

/* عنوان اللوحة */
.panel__title{
  margin:0 0 14px; font-size:clamp(16px, 1.4vw, 18px); font-weight:800; color:#111827;
  position:relative; padding-inline-start:10px;
}
.panel__title::before{
  content:""; position:absolute; inset-inline-start:0; top:50%;
  width:4px; height:1.1em; transform:translateY(-50%); border-radius:999px; background:#f59e0b;
}

/* تركيز لوحة المفاتيح */
.uploadBox:focus-visible{ outline: 3px solid #fde68a; outline-offset: 4px; }

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
  .upMeta{ flex-direction: column; align-items: flex-start; gap:6px; }
  .upActions{ justify-content: center; }
}
@media (max-width: 480px){
  .uploadBox{ width: 100%; min-height: 220px; border-radius: 18px; }
  .upRow{ width: 100%; }
}
`;
/* دالة تضمن نظهر رسالة مفهومة */
function extractErr(e) {
  try {
    if (e?.response) {
      const { status, data } = e.response;
      if (data && typeof data === "object") {
        return data.msg || data.error || `HTTP ${status}`;
      }
      if (typeof data === "string") {
        try { const j = JSON.parse(data); return j?.msg || j?.error || data; }
        catch { return data; }
      }
      return `HTTP ${status}`;
    }
    return e?.message || "تعذّر الرفع.";
  } catch {
    return "تعذّر الرفع.";
  }
}

export default function Upload({ maxMB = 20 }) {
  // ❗️يفضّل عبر بروكسي Vite:
  // const endpointUpload = "/api/home/upload-pdf";
  const endpointUpload = "http://localhost:5000/home/upload-pdf";

  const inputRef = useRef(null);
  const cancelRef = useRef(null);

  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [bytes, setBytes] = useState({ loaded: 0, total: 0 });
  const [status, setStatus] = useState("idle");   // idle | uploading | done | error
  const [message, setMessage] = useState("");

  const isUploading = status === "uploading";
  const isDone = status === "done";
  const isError = status === "error";

  const selectClick = () => inputRef.current?.click();

  const fmtSize = (n) => {
    if (n == null) return "";
    const kb = n / 1024;
    return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(2)} MB`;
  };

  const validate = (f) => {
    if (!f) return "لم يتم اختيار ملف.";
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf"))
      return "يُقبل فقط ملف PDF.";
    if (f.size > maxMB * 1024 * 1024)
      return `الحجم الأقصى ${maxMB}MB.`;
    return "";
  };

  const reset = () => {
    setStatus("idle");
    setFile(null);
    setProgress(0);
    setBytes({ loaded: 0, total: 0 });
    setMessage("");
  };

  const cancelUpload = () => {
    cancelRef.current?.cancel?.();
    reset();
    setMessage("تم إلغاء الرفع.");
  };

  const startUpload = async (f) => {
    const err = validate(f);
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
      form.append("pdf", f); // اسم الحقل لازم 'pdf'

      const token = localStorage.getItem("token") || "";
      const source = axios.CancelToken.source();
      cancelRef.current = source;

      // خلي Axios يرجع الرد حتى لو 4xx/5xx عشان نقرأ msg
      const res = await axios.post(endpointUpload, form, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        onUploadProgress: (e) => {
          const total = e.total || f.size;
          const pct = total ? Math.round((e.loaded * 100) / total) : 0;
          setProgress(pct);
          setBytes({ loaded: e.loaded, total });
        },
        cancelToken: source.token,
        validateStatus: () => true, // <-- مهم لعرض رسائل الخطأ
      });

      if (res.data?.ok) {
        // نجاح كامل (ClamAV + GS + استخراج +/− مودل)
        const parts = [];
        if (res.data.textChars) parts.push(`أحرف مستخرجة: ${res.data.textChars}`);
        if (res.data.savedId) parts.push(`تم الحفظ (ID: ${res.data.savedId})`);
        if (!parts.length) parts.push("تم التحميل والمعالجة بنجاح.");
        setStatus("done");
        setMessage(parts.join(" — "));
      } else {
        // خطأ من السيرفر مع رسالة
        setStatus("error");
        const msg = res.data?.msg || res.data?.error || `HTTP ${res.status}`;
        setMessage(msg);
      }
    } catch (e) {
      setStatus("error");
      setMessage(extractErr(e)); // نعرض النص الحقيقي
      // للمساعدة في التشخيص:
      console.error("UPLOAD ERROR =>", {
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
      });
    }
  };

  const onInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) startUpload(f);
    e.target.value = "";
  };

  // Drag & Drop
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = (e) => { e.preventDefault(); setDragOver(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) startUpload(f);
  };

  return (
    <>
      <style>{styles}</style>
      <section className="panel centerPanel" aria-labelledby="upl-title">
        <h2 id="upl-title" className="panel__title">مُولّد الاختبارات والبطاقات</h2>
        <div className="uploadWrap">
          <div
            className={`uploadBox ${dragOver ? "isDrag" : ""} ${isUploading ? "isUploading" : ""}`}
            onDragOver={onDragOver}
            onDragEnter={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="button"
            aria-label="رفع ملف PDF"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            onClick={() => inputRef.current?.click()}
          >
            <div className="uploadBox__ico" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </div>
            <div className="uploadBox__text">
              <div className="uploadBox__title">إضافة ملف</div>
              <div className="uploadBox__sub">اسحبي وأفلتي هنا أو اختاري ملف — فقط PDF (حد {maxMB}MB)</div>
            </div>
            <button type="button" className="uploadBox__btn" disabled={isUploading}>
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
              <div className="upMeta">
                <div className="upName">{file?.name || (isError ? "فشل الرفع" : "")}</div>
                <div className="upSizes">
                  {isUploading && `${fmtSize(bytes.loaded)} of ${fmtSize(bytes.total)} — جاري التحميل`}
                  {(isDone || isError) && (message || (isError ? "حدث خطأ" : ""))}
                </div>
              </div>

              {isUploading && (
                <div className="upProg" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                  <div className="upProg__bar" style={{ width: `${progress}%` }} />
                </div>
              )}

              <div className="upActions">
                {isUploading && <button className="upBtn ghost" onClick={cancelUpload}>إلغاء</button>}
                {(isDone || isError) && <button className="upBtn ghost" onClick={reset}>إعادة المحاولة</button>}
              </div>

              {message && !isUploading && (
                <div style={{ marginTop: 6, fontWeight: 700, color: isError ? "#b91c1c" : "#0f172a" }}>
                  {message}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
