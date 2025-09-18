import { useRef, useState } from "react";
import axios from "axios";

/** ===== CSS داخل نفس الملف (مركّز على مربّع كبير بالنص) ===== */
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
  padding: 18px;
}

/* حاوية للتمركز العمودي */
.uploadWrap{
  min-height: min(62vh, 560px);
  width: 100%;
  display:grid; place-items:center;
}

/* مربّع الرفع الكبير */
.uploadBox{
  width: clamp(260px, 42vw, 420px);
  aspect-ratio: 1 / 1;                 /* مربّع */
  border: 2px dashed #ffd7a6;
  border-radius: 24px;
  background: #ffffff;                  /* أبيض صريح */
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  gap: 14px;
  padding: 22px;
  box-shadow: 0 12px 28px rgba(245,158,11,.08);
  text-align:center;
  cursor: default;
  transition: box-shadow .2s ease, border-color .2s ease, background .2s ease, transform .12s ease;
}

/* إبراز السحب */
.uploadBox.isDrag{
  border-color:#f59e0b;
  background:#fffaf3;
  box-shadow:0 16px 36px rgba(245,158,11,.14);
}

/* حالة الرفع */
.uploadBox.isUploading{ opacity:.95; }

/* الأيقونة كبيرة */
.uploadBox__ico{
  width: 76px; height: 76px;
  border-radius: 18px;
  display:grid; place-items:center;
  background:#fff7ed; color:#f59e0b;
  border:1px solid #ffe4c7;
  box-shadow: 0 8px 18px rgba(255,122,0,.08);
}
.uploadBox__ico svg{ width: 38px; height: 38px; }

/* العنوان والوصف */
.uploadBox__text{ display:flex; flex-direction:column; gap:6px; }
.uploadBox__title{ font-weight: 900; font-size: 16px; color:#0f172a; }
.uploadBox__sub{ font-size:13px; color:#64748b; }

/* زر اختيار ملف */
.uploadBox__btn{
  padding:10px 16px; border-radius:12px;
  border:1px solid #ffd6a8; background:#fff;
  font-weight:800; font-size:13px; cursor:pointer;
  box-shadow:0 8px 18px rgba(255,122,0,.12);
  transition:.15s ease;
}
.uploadBox__btn:hover{ transform:translateY(-1px); background:#fff8f0; }

/* صف التقدّم أسفل المربّع */
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
.upProg__bar{
  height:100%; width:0%; background:#f59e0b; transition:width .25s ease;
}

/* أزرار الإجراءات */
.upActions{ display:flex; gap:8px; justify-content:flex-end; }
.upBtn{
  padding:6px 10px; border-radius:10px; font-weight:800; font-size:12.5px;
  border:1px solid #ffd6a8; background:#fff; cursor:pointer; transition:.15s;
}
.upBtn:hover{ background:#fff8f0; }
.upBtn.ghost{ background:#ffffff; }

/* عنوان اللوحة */
.panel__title{
  margin:0 0 14px; font-size:18px; font-weight:800; color:#111827;
  position:relative; padding-inline-start:10px;
}
.panel__title::before{
  content:""; position:absolute; inset-inline-start:0; top:50%;
  width:4px; height:1.1em; transform:translateY(-50%); border-radius:999px; background:#f59e0b;
}

/* تحسين تركيز/لوحة المفاتيح */
.uploadBox:focus-visible{ outline: 3px solid #fde68a; outline-offset: 4px; }

/* تجاوب أصغر */
@media (max-width: 480px){
  .uploadBox{ width: min(86vw, 360px); }
  .upRow{ width: min(86vw, 360px); }
}
`;

export default function Upload({
  endpoint = "http://localhost:5000/home/upload-pdf",
  maxMB = 20,
}) {
  const inputRef = useRef(null);
  const cancelRef = useRef(null);

  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [bytes, setBytes] = useState({ loaded: 0, total: 0 });
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [message, setMessage] = useState("");

  const isUploading = status === "uploading";
  const isDone = status === "done";
  const isError = status === "error";

  const selectClick = () => inputRef.current?.click();

  const fmtSize = (n) => {
    if (n === undefined || n === null) return "";
    const kb = n / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
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
    cancelRef.current?.cancel();
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
      form.append("file", f);

      const token = localStorage.getItem("token") || "";
      const source = axios.CancelToken.source();
      cancelRef.current = source;

      await axios.post(endpoint, form, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        onUploadProgress: (e) => {
          const total = e.total || f.size;
          const pct = total ? Math.round((e.loaded * 100) / total) : 0;
          setProgress(pct);
          setBytes({ loaded: e.loaded, total });
        },
        cancelToken: source.token,
      });

      setStatus("done");
      setMessage("تم الرفع بنجاح. سيتم استخدام الملف لإنشاء الاختبارات والبطاقات.");
    } catch (e) {
      if (axios.isCancel(e)) {
        setMessage("تم إلغاء الرفع.");
      } else {
        setMessage(e?.response?.data?.msg || "تعذّر رفع الملف.");
      }
      setStatus("error");
    }
  };

  const onInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) startUpload(f);
    e.target.value = "";
  };

  // سحب/إفلات
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
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && selectClick()}
          >
            <div className="uploadBox__ico" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 3H6a2 2 0 0 0-2 2v14l4-2 4 2 4-2 4 2V9z" />
              </svg>
            </div>

            <div className="uploadBox__text">
              <div className="uploadBox__title">إضافة ملف</div>
              <div className="uploadBox__sub">اسحبي وأفلتي هنا أو اختاري ملف — فقط PDF (حد {maxMB}MB)</div>
            </div>

            <button type="button" className="uploadBox__btn" onClick={selectClick} disabled={isUploading}>
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
                  {isDone && `${fmtSize(bytes.total)} — تم الرفع`}
                  {isError && message}
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
            </div>
          )}

          {message && !isUploading && status !== "error" && (
            <div style={{ marginTop: 8, color: "#0f172a", fontWeight: 700 }}>{message}</div>
          )}
        </div>
      </section>
    </>
  );
}
