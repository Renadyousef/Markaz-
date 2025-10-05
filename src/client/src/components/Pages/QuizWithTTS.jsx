import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

/* ===== تهيئة عامة ===== */
const API_BASE = import.meta.env.VITE_API_BASE || "";
const TTS_URL  = API_BASE ? `${API_BASE}/tts` : "/tts";

const VOICES = [
  { id: "Hala", label: "الصوت الأول" },
  { id: "Zayd", label: "الصوت الثاني" },
];

/* عيّنة أسئلة */
const SAMPLE_QUESTIONS = [
  // Easy
  { id: "e1", level: "easy", question: "ما عاصمة المملكة العربية السعودية؟", options: ["الرياض", "جدة", "مكة المكرمة", "الدمام"], answer: "الرياض", type: "MCQ" },
  { id: "e2", level: "easy", question: "ما هو ترتيب اليوم بعد الأربعاء؟", options: ["الخميس", "الجمعة", "السبت", "الأحد"], answer: "الخميس", type: "MCQ" },
  { id: "e3", level: "easy", question: "وحدة قياس الزمن هي؟", options: ["المتر", "الثانية", "الكيلوغرام", "الفولت"], answer: "الثانية", type: "MCQ" },
  { id: "e4", level: "easy", question: "لغة شائعة لواجهات الويب؟", options: ["بايثون", "جافاسكريبت", "روبي", "سي"], answer: "جافاسكريبت", type: "MCQ" },
  // Medium
  { id: "m1", level: "medium", question: "٢٤ ÷ ٦ = ؟", options: ["٢", "٣", "٤", "٦"], answer: "٤", type: "MCQ" },
  { id: "m2", level: "medium", question: "HTTP اختصار يشير إلى؟", options: ["Hyper Text Transfer Protocol", "High Transfer Type Protocol", "Host Text Transport", "Hyper Transport Text"], answer: "Hyper Text Transfer Protocol", type: "MCQ" },
  { id: "m3", level: "medium", question: "أيٌّ مما يلي لغة برمجة كائنية؟", options: ["HTML", "CSS", "Java", "SQL"], answer: "Java", type: "MCQ" },
  { id: "m4", level: "medium", question: "أقرب كوكب للشمس؟", options: ["الأرض", "عطارد", "الزهرة", "المريخ"], answer: "عطارد", type: "MCQ" },
  // Hard
  { id: "h1", level: "hard", question: "تعقّب التعقيد الزمني لخوارزمية بحث ثنائية؟", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], answer: "O(log n)", type: "MCQ" },
  { id: "h2", level: "hard", question: "ما ناتج 2^10؟", options: ["128", "256", "512", "1024"], answer: "1024", type: "MCQ" },
  { id: "h3", level: "hard", question: "قاعدة البيانات العلائقية تستخدم؟", options: ["مستندات", "جداول", "رسوم بيانية", "مفاتيح/قيم فقط"], answer: "جداول", type: "MCQ" },
  { id: "h4", level: "hard", question: "طبقة النقل في نموذج OSI هي؟", options: ["Layer 2", "Layer 3", "Layer 4", "Layer 5"], answer: "Layer 4", type: "MCQ" },
];

/* ===== أدوات مساعدة ===== */
function robustOptions(raw){
  if (!raw) return [];
  const splitRegex = /[,\u060C;\/\\|•\n\r]+/;
  const out = [];
  if (Array.isArray(raw)) {
    raw.forEach(item => {
      if (typeof item === "string") {
        const parts = item.split(splitRegex).map(p=>p.trim()).filter(Boolean);
        if (parts.length) out.push(...parts); else if (item.trim()) out.push(item.trim());
      } else if (item !== null && item !== undefined) {
        out.push(String(item));
      }
    });
  } else if (typeof raw === "string") {
    out.push(...raw.split(splitRegex).map(p=>p.trim()).filter(Boolean));
  }
  return Array.from(new Set(out));
}
function getOptions(q){
  if (!q) return [];
  if (q.type && q.type !== "MCQ") return [];
  return robustOptions(q.options || q.choices || []);
}
function toSpeechText(q, index){
  const ord = ["الأول","الثاني","الثالث","الرابع","الخـامس","السادس","السابع","الثامن","التاسع","العاشر"];
  const title = q?.question || q?.statement || "";
  const header = `سؤال ${index + 1}: ${title}.`;
  const opts = getOptions(q).map((opt,i)=>`الخيار ${ord[i] || `${i+1}`}: ${opt}.`).join(" ");
  return `${header} ${opts}`.trim();
}

/* ===== أيقونات ===== */
const IconPlay  = ({size=16}) => (<svg width={size} height={size} viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>);
const IconPause = ({size=16}) => (<svg width={size} height={size} viewBox="0 0 24 24"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>);

/* ===== CSS عام + سلايدر ===== */
const ExtraCSS = () => (
  <style>{`
    .nice-select{
      appearance:none; -webkit-appearance:none;
      padding:12px 40px 12px 14px; min-width:220px;
      border-radius:14px; border:1px solid #e5e7eb; background:#fff; font-weight:800;
    }
    .nice-select:focus{ outline:none; border-color:#e5e7eb; box-shadow:none; }
    .select-caret{ position:absolute; right:12px; top:50%; transform:translateY(-50%); width:14px; height:14px; pointer-events:none; opacity:.7; }

    .slider-row{ display:grid; grid-template-columns: 1fr auto; gap:12px; align-items:center; margin-bottom:14px; }
    .slider-wrap{ position:relative; height:36px; display:flex; align-items:center; }
    .slider{ -webkit-appearance:none; appearance:none; width:100%; height:6px; border-radius:999px; background:#e5e7eb; outline:none; }
    .slider::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:20px; height:20px; border-radius:50%; background:#f59e0b; border:none; box-shadow:0 2px 10px rgba(245,158,11,.35); cursor:pointer; }
    .slider::-moz-range-thumb{ width:20px; height:20px; border-radius:50%; background:#f59e0b; border:none; box-shadow:0 2px 10px rgba(245,158,11,.35); cursor:pointer; }
    .num-input{ width:92px; padding:8px 10px; border-radius:10px; border:1px solid #e5e7eb; font-weight:800; text-align:center; }
    .field-title{ font-weight:800; color:#0f172a; margin:6px 0 4px; }
    .contrast-row{ display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
    @media (max-width: 560px){ .qshell { border-radius: 0; } }
  `}</style>
);

/* ===== إعدادات الوصول ===== */
const A11Y_KEY = "quiz_a11y_settings";
const DEFAULT_A11Y = { baseSize: 18, lineHeight: 1.6, letterSpacing: 0.0, contrast: "default" };

function computeStyles(a11y, progressPercent=0){
  const base = a11y.baseSize;
  const lh   = a11y.lineHeight;
  const ls   = a11y.letterSpacing;
  const high = a11y.contrast === "high";
  const font = "Inter, system-ui, 'Segoe UI', Roboto, Arial, sans-serif";

  const colors = {
    pageBg: high ? "#ffffff" : "#f4f6fb",
    shellBg: "#ffffff",
    textMain: high ? "#000000" : "#0f172a",
    textSub:  high ? "#1f2937" : "#64748b",
    border:   high ? "#111827" : "#eef2f7",
    bar:      high ? "#111827" : "#f1f5f9",
    audio:    high ? "#111827" : "#0ea5e9",
    accent:   "#f59e0b",
    accent2:  "#fb923c",
  };

  return {
    __meta:{font,base,lh,ls,colors},
    page:{direction:"rtl",fontFamily:font,fontSize:base,letterSpacing:`${ls}px`,lineHeight:lh,background:colors.pageBg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:18},
    shell:{width:"100%",maxWidth:900,background:"#fff",borderRadius:22,boxShadow:"0 18px 50px rgba(2,6,23,.10)",border:`1px solid ${colors.border}`,overflow:"hidden"},
    header:{padding:0,background:`linear-gradient(135deg,${colors.accent2} 0%, ${colors.accent} 60%, #f97316 100%)`,color:"#fff"},
    headerInner:{padding:22,display:"flex",flexDirection:"column",gap:6},
    title:{fontSize:Math.round(base*1.6),fontWeight:900,color:"#fff"},
    sub:{fontSize:Math.round(base*0.95),color:"rgba(255,255,255,.92)"},
    progressWrap:{padding:"0 22px 16px"},
    progressBar:{height:10,background:"rgba(255,255,255,.25)",borderRadius:999,overflow:"hidden"},
    progressFill:{height:"100%",width:`${progressPercent}%`,background:"#fff",opacity:.9,transition:"width .25s ease"},
    body:{padding:22},
    card:(pad=16)=>({background:"#fff", border:`1px solid ${colors.border}`, borderRadius:16, padding:pad}),
    btn:(variant="primary")=>{
      const baseBtn = {padding:"12px 18px",borderRadius:14,fontWeight:900,cursor:"pointer",minWidth:160};
      if (variant==="primary") return {...baseBtn,background:colors.accent,color:"#fff",border:"none",boxShadow:"0 8px 22px rgba(245,158,11,.28)"};
      if (variant==="ghost")   return {...baseBtn,background:"#fff",color:colors.textMain,border:`1px solid ${colors.border}`};
      if (variant==="success") return {...baseBtn,background:"#059669",color:"#fff",border:"none",boxShadow:"0 8px 22px rgba(5,150,105,.28)"};
      return baseBtn;
    },
    options:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginTop:12},
    optionBtn:(active)=>({
      textAlign:"center",padding:"16px 14px",borderRadius:16,
      border: active ? "2px solid #f59e0b" : `1px solid ${high ? "#111827" : "#e5e7eb"}`,
      background: active ? "#fff7ed" : "#fff",
      cursor:"pointer",fontWeight:800,boxShadow: active ? "0 6px 18px rgba(245,158,11,.12)" : "0 2px 10px rgba(2,6,23,.06)",
      transition:"transform .12s ease, box-shadow .12s ease, border-color .12s ease"
    }),
    thtd:{border:`1px solid ${colors.border}`,padding:12,fontSize:Math.round(base*0.95),textAlign:"right",color:colors.textMain},
  };
}

/* ====================== المكوّن الرئيسي ====================== */
export default function QuizWithTTS(){
  const { state } = useLocation();
  const navigate = useNavigate();
  const pdfId = state?.pdfId;

  /* حالتا الإعدادات */
  const [a11yDraft, setA11yDraft] = useState(()=>{
    try { return { ...DEFAULT_A11Y, ...JSON.parse(localStorage.getItem(A11Y_KEY) || "{}") }; }
    catch { return { ...DEFAULT_A11Y }; }
  });
  const [a11yApplied, setA11yApplied] = useState(()=>{
    try { return { ...DEFAULT_A11Y, ...JSON.parse(localStorage.getItem(A11Y_KEY) || "{}") }; }
    catch { return { ...DEFAULT_A11Y }; }
  });

  const [stage, setStage] = useState("a11y"); // a11y | level | quiz | result
  function saveA11y(){
    localStorage.setItem(A11Y_KEY, JSON.stringify(a11yDraft));
    setA11yApplied(a11yDraft);
    setStage("level");
  }

  /* حالات الكويز */
  const [level, setLevel] = useState(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState([]);

  /* الصوت */
  const [voiceId, setVoiceId] = useState("Zayd");
  const audioRef = useRef(new Audio());
  const lastKeyRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused,  setIsPaused]  = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [ttsError, setTtsError] = useState("");
  const [cache, setCache] = useState({});
  const [aDur, setADur] = useState(0);
  const [aPos, setAPos] = useState(0);
  const [started, setStarted] = useState(false);

  /* السيرفر */
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [remoteQuiz, setRemoteQuiz] = useState(null);

  const levelForServer = useMemo(()=>{
    if (!level) return "";
    return level==="easy"?"سهل":level==="medium"?"متوسط":"صعب";
  },[level]);

  async function fetchQuiz(){
    if (!pdfId || !levelForServer) return;
    setLoadingQuiz(true); setFetchError("");
    try{
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/Quizess/GetQuiz",
        { pdfId, level: levelForServer },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      if (res.data?.ok && Array.isArray(res.data?.quiz?.questions) && res.data.quiz.questions.length){
        const normalized = res.data.quiz.questions.map((q,i)=>({
          id: q.id || q._id || `q_${i}`,
          question: q.question || q.statement || "",
          options: q.options || q.choices || [],
          answer: q.answer,
          type: q.type || "MCQ",
          level
        }));
        setRemoteQuiz(normalized.slice(0,4));
        setIndex(0); setAnswers([]); setSelected(null); setShowAnswer(false);
        setStage("quiz");
      }else{
        setRemoteQuiz(null);
        setFetchError(res.data?.msg || "لم يتم العثور على أسئلة مناسبة. سيتم استخدام أسئلة افتراضية.");
        setStage("quiz");
      }
    }catch(e){
      setRemoteQuiz(null);
      setFetchError(e?.message || "خطأ في الاتصال بالسيرفر. سيتم استخدام أسئلة افتراضية.");
      setStage("quiz");
    }finally{
      setLoadingQuiz(false);
    }
  }

  /* الأسئلة (تعريف واحد فقط هنا) */
  const QUESTIONS = useMemo(()=>{
    if (!level) return [];
    if (remoteQuiz && remoteQuiz.length) return remoteQuiz;
    return SAMPLE_QUESTIONS.filter(q=>q.level===level).slice(0,4);
  },[level, remoteQuiz]);

  const current = QUESTIONS[index];
  const currentCorrectAnswer = current?.answer;

  /* التقدّم والأنماط */
  const progress = (stage === "quiz" && QUESTIONS.length) ? ((index+1)/QUESTIONS.length)*100 : 0;
  const styles = useMemo(()=>computeStyles(a11yApplied, progress), [a11yApplied, progress]);

  /* الصوت: مستمعات */
  useEffect(()=>{
    const el = audioRef.current;
    const onPlay  = ()=>{ setIsPlaying(true); setIsPaused(false); };
    const onPause = ()=>{ setIsPlaying(false); };
    const onEnded = ()=>{ setIsPlaying(false); setIsPaused(false); setAPos(0); setStarted(false); };
    const onLoaded= ()=>{ setADur(el.duration||0); };
    const onTick  = ()=>{ setAPos(el.currentTime||0); };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTick);

    return ()=>{
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTick);
      try{ el.pause(); }catch{}
      try{ if (el.src?.startsWith("blob:")) URL.revokeObjectURL(el.src); }catch{}
      el.removeAttribute("src"); el.load();
      Object.values(cache).forEach(u=>URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  function clearAudio(){
    const el = audioRef.current;
    try{ el.pause(); }catch{}
    try{ if (el.src?.startsWith("blob:")) URL.revokeObjectURL(el.src); }catch{}
    el.removeAttribute("src"); el.load();
    setAPos(0); setIsPlaying(false); setIsPaused(false); setStarted(false); setTtsError(""); lastKeyRef.current=null;
  }
  useEffect(()=>{ clearAudio(); setCache({}); },[voiceId]);
  useEffect(()=>{ clearAudio(); },[index]);

  async function getAudioForCurrent(){
    if (!current) return null;
    const key = `${current.id}:${voiceId}`;
    if (cache[key]) return cache[key];
    setTtsError(""); setLoadingAudio(true);
    try{
      const res = await fetch(TTS_URL,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ voiceId, format:"mp3", ssml:false, text: toSpeechText(current, index) }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const ab = await res.arrayBuffer();
      const blob = new Blob([ab], { type:"audio/mpeg" });
      const url  = URL.createObjectURL(blob);
      setCache(prev=>({...prev,[key]:url}));
      return url;
    }catch(e){ setTtsError("تعذّر توليد الصوت"); return null; }
    finally{ setLoadingAudio(false); }
  }
  async function onMainAudioAction(){
    const el = audioRef.current;
    const desiredKey = current ? `${current.id}:${voiceId}` : null;
    const needNew = !el.src || lastKeyRef.current !== desiredKey;

    if (needNew){
      const url = await getAudioForCurrent();
      if (!url) return;
      try{ if (el.src?.startsWith("blob:")) URL.revokeObjectURL(el.src); }catch{}
      el.src = url; el.load(); lastKeyRef.current = desiredKey;
      try{ setIsPlaying(true); setIsPaused(false); setStarted(true); await el.play(); }
      catch{ setIsPlaying(false); setStarted(false); }
      return;
    }
    if (isPlaying){ el.pause(); setIsPaused(true); setIsPlaying(false); return; }
    if (isPaused){ try{ await el.play(); setIsPaused(false); setIsPlaying(true); setStarted(true);}catch{} return; }
    try{ await el.play(); setIsPlaying(true); setStarted(true);}catch{}
  }
  function onStopAudio(){ clearAudio(); setCache({}); }

  /* ===================== شاشة الإعدادات (فقط هنا) ===================== */
  if (stage === "a11y"){
    const ui = styles;
    const setClamped = (key, val, min, max, step=1) => {
      const num = Number(val);
      const safe = isNaN(num) ? min : Math.max(min, Math.min(max, Math.round(num/step)*step));
      setA11yDraft(s=>({...s, [key]: safe}));
    };
    const preview = "معاينة: ما العوامل الأساسية التي تُسهم في تحسين قابلية القراءة؟ راعي التباين وحجم الخط وتباعد السطور.";

    return (
      <div style={ui.page}>
        <div className="qshell" style={ui.shell}>
          <div style={ui.header}>
            <div style={ui.headerInner}>
              <div style={ui.title}>إعدادات عرض النص للاختبار</div>
              <div style={ui.sub}>التعديل يؤثر على <b>المعاينة فقط</b>؛ اضغطي “حفظ وابدأ”.</div>
            </div>
            <div style={ui.progressWrap}>
              <div style={ui.progressBar}><div style={ui.progressFill}/></div>
            </div>
          </div>

          <div style={ui.body}>
            <div style={ui.card(18)}>
              {/* حجم الخط */}
              <div className="field-title">حجم الخط (px)</div>
              <div className="slider-row">
                <div className="slider-wrap">
                  <input className="slider" type="range" min={14} max={22} step={1}
                    value={a11yDraft.baseSize}
                    onChange={(e)=>setA11yDraft(s=>({...s, baseSize: Number(e.target.value)}))}
                    aria-label="حجم الخط"
                  />
                </div>
                <input className="num-input" type="number" min={14} max={22} step={1}
                  value={a11yDraft.baseSize}
                  onChange={(e)=>setClamped("baseSize", e.target.value, 14, 22, 1)}
                />
              </div>

              {/* تباعد السطور */}
              <div className="field-title">تباعد السطور</div>
              <div className="slider-row">
                <div className="slider-wrap">
                  <input className="slider" type="range" min={1.4} max={2.0} step={0.1}
                    value={a11yDraft.lineHeight}
                    onChange={(e)=>setA11yDraft(s=>({...s, lineHeight: Number(e.target.value)}))}
                    aria-label="تباعد السطور"
                  />
                </div>
                <input className="num-input" type="number" min={1.4} max={2.0} step={0.1}
                  value={a11yDraft.lineHeight}
                  onChange={(e)=>setClamped("lineHeight", e.target.value, 1.4, 2.0, 0.1)}
                />
              </div>

              {/* تباعد الحروف */}
              <div className="field-title">تباعد الحروف (px)</div>
              <div className="slider-row">
                <div className="slider-wrap">
                  <input className="slider" type="range" min={0} max={0.5} step={0.05}
                    value={a11yDraft.letterSpacing}
                    onChange={(e)=>setA11yDraft(s=>({...s, letterSpacing: Number(e.target.value)}))}
                    aria-label="تباعد الحروف"
                  />
                </div>
                <input className="num-input" type="number" min={0} max={0.5} step={0.05}
                  value={a11yDraft.letterSpacing}
                  onChange={(e)=>setClamped("letterSpacing", e.target.value, 0, 0.5, 0.05)}
                />
              </div>

              {/* معاينة */}
              <div style={{marginTop:18, padding:14, border:`1px dashed ${ui.__meta.colors.border}`, borderRadius:12, background:"#fff"}}>
                <div style={{
                  fontFamily: styles.__meta.font,
                  fontSize: a11yDraft.baseSize,
                  letterSpacing: `${a11yDraft.letterSpacing}px`,
                  lineHeight: a11yDraft.lineHeight,
                  color: styles.__meta.colors.textMain,
                  fontWeight: 800
                }}>
                  {preview}
                </div>
              </div>

              <div style={{marginTop:16,display:"flex",justifyContent:"space-between",gap:10}}>
                <button style={ui.btn("ghost")} onClick={()=>setStage("level")}>تخطي مؤقتًا</button>
                <button style={ui.btn("primary")} onClick={saveA11y}>حفظ وابدأ</button>
              </div>
            </div>
          </div>
        </div>
        <ExtraCSS/>
      </div>
    );
  }

  /* ===================== اختيار المستوى ===================== */
  if (stage === "level"){
    return (
      <div style={styles.page}>
        <div className="qshell" style={styles.shell}>
          <div style={styles.header}><div style={styles.headerInner}><div style={styles.title}>اختر مستوى الاختبار</div></div></div>
          <div style={styles.body}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
              <button style={styles.optionBtn(false)} onClick={()=>{setLevel("easy"); pdfId?fetchQuiz():setStage("quiz");}}>سهل</button>
              <button style={styles.optionBtn(false)} onClick={()=>{setLevel("medium"); pdfId?fetchQuiz():setStage("quiz");}}>متوسط</button>
              <button style={styles.optionBtn(false)} onClick={()=>{setLevel("hard"); pdfId?fetchQuiz():setStage("quiz");}}>صعب</button>
            </div>
            {loadingQuiz && <div style={{marginTop:12,color:styles.__meta.colors.textSub}}>جاري تحميل الاختبار...</div>}
            {fetchError && <div style={{marginTop:10,color:"#b91c1c",background:"#fff5f5",border:"1px solid #fecaca",borderRadius:12,padding:10}}>
              {fetchError}
            </div>}
          </div>
        </div>
        <ExtraCSS/>
      </div>
    );
  }

  /* ===================== شاشة النتيجة ===================== */
  if (stage === "result"){
    const total = answers.length;
    const correct = answers.filter(a=>a.isCorrect).length;
    const percent = total ? Math.round((correct/total)*100) : 0;

    return (
      <div style={styles.page}>
        <div className="qshell" style={styles.shell}>
          <div style={styles.header}><div style={styles.headerInner}><div style={styles.title}>النتيجة</div></div></div>
          <div style={styles.body}>
            <div style={styles.card(16)}>
              <div style={{fontWeight:900,fontSize:Math.round(a11yApplied.baseSize*1.1),marginBottom:6}}>الدرجة: {correct} من {total} ({percent}%)</div>
            </div>

            <table style={{width:"100%",borderCollapse:"collapse",marginTop:12}}>
              <thead>
                <tr>
                  <th style={styles.thtd}>السؤال</th>
                  <th style={styles.thtd}>إجابتك</th>
                  <th style={styles.thtd}>الإجابة الصحيحة</th>
                  <th style={styles.thtd}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {answers.map(a=>(
                  <tr key={a.id}>
                    <td style={styles.thtd}>{a.question}</td>
                    <td style={styles.thtd}>{a.userAnswer ?? "—"}</td>
                    <td style={styles.thtd}>{a.correctAnswer}</td>
                    <td style={styles.thtd}>{a.isCorrect ? "صحيحة" : "خاطئة"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:16}}>
     <button
  style={styles.btn("success")}
  onClick={() => navigate("/quizzes", { replace: true })}
>
  إنهاء الاختبار
</button>


              <button
                style={styles.btn("primary")}
                onClick={async ()=>{
                  clearAudio();
                  setIndex(0);
                  setSelected(null);
                  setShowAnswer(false);
                  setAnswers([]);
                  setTtsError("");
                  if (pdfId) { await fetchQuiz(); } else { setStage("quiz"); }
                }}
              >
                إعادة من البداية
              </button>
            </div>
          </div>
          <audio ref={audioRef} preload="metadata" playsInline style={{display:"none"}}/>
        </div>
        <ExtraCSS/>
      </div>
    );
  }

  /* ===================== شاشة الكويز ===================== */
  const isLast = current ? index === (QUESTIONS.length - 1) : false;
  const mainCtrlLabel = loadingAudio ? "تهيئة..." : isPlaying ? "إيقاف الصوت" : isPaused ? "استئناف" : "استمع";
  const mainCtrlIcon   = loadingAudio ? null : isPlaying ? <IconPause/> : <IconPlay/>;

  function nextQuestion(){
    const entry = {
      id: current.id,
      question: current.question || "",
      correctAnswer: currentCorrectAnswer,
      userAnswer: selected,
      isCorrect: String(selected) === String(currentCorrectAnswer),
    };
    setAnswers(prev=>{
      const copy=[...prev];
      const i = copy.findIndex(a=>a.id===entry.id);
      if (i>=0) copy[i]=entry; else copy.push(entry);
      return copy;
    });
    clearAudio();
    setSelected(null); setShowAnswer(false);

    if (!isLast) setIndex(index+1);
    else{
      const correctCount = [...answers, entry].filter(a=>a.isCorrect).length;
      if (pdfId){
        (async()=>{
          try{
            const token = localStorage.getItem("token");
            await axios.post(
              "http://localhost:5000/Quizess/result",
              { pdfId, level: levelForServer, score: Math.round((correctCount/QUESTIONS.length)*100) },
              { headers: { Authorization: token ? `Bearer ${token}` : "" } }
            );
          }catch(e){ console.error("save result error", e); }
        })();
      }
      setStage("result");
    }
  }

  return (
    <div style={styles.page}>
      <div className="qshell" style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.headerInner}>
            <div style={styles.title}>اختبار قصير</div>
            <div style={styles.sub}>
              {level ? <>المستوى: {level==="easy"?"سهل":level==="medium"?"متوسط":"صعب"} — سؤال {index+1} من {QUESTIONS.length}</> : "ابدئي بتحديد المستوى"}
            </div>
          </div>
          {level && (
            <div style={{padding:"0 22px 16px"}}>
              <div style={styles.progressBar}><div style={styles.progressFill}/></div>
            </div>
          )}
        </div>

        <div style={styles.body}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <span style={{background:"#f1f5f9",color:styles.__meta.colors.textMain,padding:"6px 10px",borderRadius:999,fontWeight:700}}>اختر إجابة</span>
            <div style={{position:"relative"}}>
              <select className="nice-select" value={voiceId} onChange={(e)=>setVoiceId(e.target.value)} title="اختيار الصوت">
                {VOICES.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
              <svg className="select-caret" viewBox="0 0 24 24"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr auto",alignItems:"center",gap:14,marginBottom:12}}>
            <div>
              <div style={{fontSize:Math.round(a11yApplied.baseSize*1.45),fontWeight:900,color:styles.__meta.colors.textMain,lineHeight:a11yApplied.lineHeight,letterSpacing:`${a11yApplied.letterSpacing}px`}}>
                {current?.question || "—"}
              </div>
              {(aDur>0) && (
                <div style={{height:4,background:styles.__meta.colors.bar,borderRadius:999,overflow:"hidden",marginTop:8}}>
                  <div style={{height:"100%",width:`${(aPos/aDur)*100}%`,background:styles.__meta.colors.audio,transition:"width .2s ease"}}/>
                </div>
              )}
            </div>

            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button style={styles.btn("primary")} onClick={onMainAudioAction} disabled={loadingAudio || !current} title={mainCtrlLabel}>
                {mainCtrlIcon}{mainCtrlLabel}
              </button>
              {started && <button style={styles.btn("ghost")} onClick={onStopAudio}>إلغاء</button>}
            </div>
          </div>

          <div style={styles.options}>
            {current && getOptions(current).map(opt=>(
              <button key={opt} className="opt-btn" style={styles.optionBtn(selected===opt)}
                onClick={()=>!showAnswer && setSelected(opt)}
                disabled={!!showAnswer}
              >{opt}</button>
            ))}
          </div>

          {showAnswer && current && (
            <div style={{marginTop:12, padding:12, border:`1px solid ${styles.__meta.colors.border}`, borderRadius:12, background:"#fff7ed", color:"#92400e", fontWeight:800}}>
              الإجابة الصحيحة: {currentCorrectAnswer ?? "—"}
            </div>
          )}

          {ttsError && <div style={{marginTop:10,color:"#b91c1c",background:"#fff5f5",border:"1px solid #fecaca",borderRadius:12,padding:10}}>{ttsError}</div>}

          <div style={{display:"flex",justifyContent:"space-between",marginTop:18,gap:10,flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button style={styles.btn("ghost")} onClick={()=>setShowAnswer(true)} disabled={showAnswer || !current}>إظهار الإجابة</button>
              {showAnswer && <button style={styles.btn("ghost")} onClick={()=>setShowAnswer(false)}>إخفاء الإجابة</button>}
            </div>
            {!current ? null : (!isLast
              ? <button style={styles.btn("primary")} onClick={nextQuestion} disabled={(selected===null && !showAnswer)}>التالي</button>
              : <button style={styles.btn("success")} onClick={nextQuestion} disabled={(selected===null && !showAnswer)}>إنهاء</button>
            )}
          </div>
        </div>

        <audio ref={audioRef} preload="metadata" playsInline style={{display:"none"}}/>
      </div>
      <ExtraCSS/>
    </div>
  );
}
