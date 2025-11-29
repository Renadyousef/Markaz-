import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  SendHorizontal,
  Upload,
} from "lucide-react";

export default function ChatBot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: " أهلاً! يمكنك رفع ملف PDF أو البدء بالمحادثة أدناه." },
  ]);
  const [input, setInput] = useState("");
  const [pdf, setPdf] = useState(null);
  const [pdfId, setPdfId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(""); // feedback message
  const chatContainerRef = useRef(null);
  const fileRef = useRef(null);
  const [botTyping, setBotTyping] = useState(false); //bot thinking wait


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // === رفع ملف PDF وحفظ الـ ID فقط ===
  const uploadPdf = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadStatus(""); // reset feedback
    const form = new FormData();
    form.append("pdf", file);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5000/home/upload-pdf", form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.ok && res.data.savedId) {
        setPdfId(res.data.savedId);
        setUploadStatus(" تم رفع الملف بنجاح!");
      } else {
        setUploadStatus(" حدث خطأ أثناء رفع الملف، حاول مرة أخرى.");
      }
    } catch (err) {
      console.error("Error uploading PDF:", err);
      setUploadStatus(" ! فشل الاتصال بالخادم حاول مجددا");
    } finally {
      setUploading(false);
    }
  };

  // === إرسال رسالة المستخدم ===
 const handleSend = async (e) => {
  e.preventDefault();
  if (!input.trim()) return;

  const userMsg = { sender: "user", text: input.trim() };
  setMessages((prev) => [...prev, userMsg]);
  setInput("");
  
  // Show typing indicator
  setBotTyping(true);

  try {
    const res = await axios.post("http://localhost:5000/chat/chat-bot", {
      message: userMsg.text,
      pdfId: pdfId,
    });

    const reply = res.data?.reply || "! لم أستطع معالجة الرسالة.";

    setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
  } catch (err) {
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: " خطأ في الخادم، حاول لاحقًا." },
    ]);
  } finally {
    setBotTyping(false);
  }
};


  //  عند اختيار الملف 
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setPdf(file);
    uploadPdf(file);
  };

  return (
    <>
      <div dir="rtl" className="d-flex justify-content-center align-items-center py-5">
      <div
        className="p-4 rounded-4"
        style={{
          maxWidth: "800px",
          width: "100%",
          background: "#ffffff",
          boxShadow: "0 14px 32px rgba(255,145,77,0.16)",
          border: "1px solid rgba(255,145,77,0.25)",
        }}
      >
        {/*  رأس الشات  */}
        <div
          className="text-center mb-4 p-3 fw-bold rounded-4"
          style={{
            background: "linear-gradient(135deg, #ff914d, #ffb476)",
            color: "white",
            fontSize: "1.2rem",
            boxShadow: "0 10px 28px rgba(255,145,77,0.35)",
          }}
        >
          <div className="d-flex align-items-center justify-content-center gap-2">
            <MessageCircle size={22} />
            <span>المساعد الذكي</span>
          </div>
        </div>

        {/* صندوق المحادثة  */}
        <div
          ref={chatContainerRef}
          className="p-4 mb-3"
          style={{
            height: "55vh",
            overflowY: "auto",
            background: "#fff8f0",
            borderRadius: "16px",
            border: "1px solid rgba(255,145,77,0.2)",
            boxShadow: "inset 0 0 16px rgba(255,186,140,0.25)",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`d-flex mb-3 ${
                msg.sender === "user" ? "justify-content-end" : "justify-content-start"
              }`}
            >
              <div
                className={`p-3 rounded-4 ${
                  msg.sender === "user"
                    ? ""
                    : "bg-white border border-0"
                }`}
                style={{
                  maxWidth: "70%",
                  lineHeight: "1.6",
                  background: msg.sender === "user"
                    ? "linear-gradient(135deg, #fffdfbff, #ffffffff)"
                    : "#fff",
                  color: msg.sender === "user" ? "#0b0202ff" : "#1f1f1f",
                  border: msg.sender === "user" ? "none" : "1px solid rgba(255, 255, 255, 0.9)",
                  animation: "fadeSlide 0.35s ease both",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
           {/* Typing indicator */}
  {botTyping && (
    <div className="d-flex mb-3 justify-content-start">
      <div
        className="p-3 rounded-4 bg-white border border-0 d-flex align-items-center gap-2"
        style={{
          maxWidth: "70%",
          lineHeight: "1.6",
          boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
          fontStyle: "italic",
          color: "#555",
          animation: "fadeSlide 0.35s ease both",
        }}
      >
        <Loader2 size={18} />
        جاري التفكير...
      </div>
    </div>
  )}
        </div>

        {/* رفع الملف  */}
        <div className="d-flex flex-column align-items-start mb-3 gap-2">
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              className="btn fw-bold rounded-4 px-4 d-flex align-items-center gap-2"
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              style={{
                background: "rgba(255,145,77,0.12)",
                border: "1px solid rgba(255,145,77,0.5)",
                color: "#ff7a1f",
              }}
            >
              <Upload size={18} />
              {uploading
                ? "جارٍ الرفع..."
                : pdf
                ? "إعادة رفع ملف PDF"
                : "رفع ملف PDF"}
            </button>
          </div>

          {/*  رسالة نجاح أو فشل الرفع */}
          {uploadStatus && (
            <div
              className={`small fw-bold d-flex align-items-center gap-2 ${
                uploadStatus.includes("نجاح")
                  ? "text-success"
                  : "text-danger"
              }`}
            >
              {uploadStatus.includes("نجاح") ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              <span>{uploadStatus}</span>
            </div>
          )}
        </div>

        {/* إدخال الرسائل  */}
        <form onSubmit={handleSend} className="d-flex gap-2">
          <input
            type="text"
            className="form-control rounded-4 border-0 shadow-sm text-end"
            placeholder="اكتب رسالتك هنا..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={uploading}
          />
          <button
            type="submit"
            className="btn rounded-4 fw-bold text-white d-flex align-items-center justify-content-center gap-2"
            disabled={uploading}
            style={{
              background: "linear-gradient(135deg, #ff914d, #ffb476)",
              border: "none",
            }}
          >
            <SendHorizontal size={18} />
            إرسال
          </button>
        </form>
      </div>
      </div>
      <style>
        {`
          @keyframes fadeSlide {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  );
}
