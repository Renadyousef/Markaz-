// server/src/controllers/uploadController.js
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const os = require("os");
const { execFile, spawn } = require("child_process");
const axios = require("axios");
const pdfParse = require("pdf-parse");
const admin = require("firebase-admin");       // نفترض أنه مُهيأ مسبقًا
const db = admin.firestore();

const MODEL_API = process.env.MODEL_API || "http://localhost:6001/generate-from-text";
const MAX_SIZE_MB = 20;
const GS_TIMEOUT = 120000; // 120s
const AV_TIMEOUT = 120000;
const MODEL_TIMEOUT = 120000;

/* ===== أدوات مساعدة بسيطة ===== */
function execFileP(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) return reject(Object.assign(err, { stdout, stderr }));
      resolve({ stdout, stderr });
    });
  });
}

async function findBin(candidates) {
  const names = Array.isArray(candidates) ? candidates : [candidates];
  const locator = process.platform === "win32" ? "where" : "which";
  for (const name of names) {
    try {
      const { stdout } = await execFileP(locator, [name]);
      const full = stdout.split(/\r?\n/).find(Boolean);
      if (full) return full.trim();
    } catch (_) {}
  }
  return null;
}

function readFirstBytes(filePath, n = 5) {
  return new Promise((resolve, reject) => {
    fs.open(filePath, "r", (err, fd) => {
      if (err) return reject(err);
      const buf = Buffer.alloc(n);
      fs.read(fd, buf, 0, n, 0, (err2) => {
        fs.close(fd, () => {});
        if (err2) return reject(err2);
        resolve(buf);
      });
    });
  });
}

async function requireMagicPDF(filePath) {
  const sig = await readFirstBytes(filePath, 5);
  if (sig.toString() !== "%PDF-") {
    throw new Error("الملف ليس PDF صالحًا (فشل توقيع %PDF-).");
  }
}

function cleanText(txt) {
  return (txt || "")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function assertFileExists(filePath) {
  try {
    const st = await fsp.stat(filePath);
    if (!st.isFile()) throw new Error("المسار ليس ملفًا.");
  } catch (e) {
    throw new Error(`المسار غير موجود أو غير صالح: ${filePath}`);
  }
}

/* اسم الملف العربي قد يأتي latin1 من Multer */
const decodeNameLatin1 = (s = "") => {
  try { return Buffer.from(s, "latin1").toString("utf8"); } catch { return s; }
};

/* ========== فحص الفيروسات (ClamAV) — مُحسّن ========== */
async function clamScanStrict(filePath) {
  const prefer = process.platform === "win32"
    ? ["clamscan", "clamdscan"]
    : ["clamscan", "clamdscan"];

  const dbArg = process.platform === "win32"
    ? ["--database=C:\\ProgramData\\ClamAV\\db"]
    : [];

  let lastErr = null;

  for (const candidate of prefer) {
    let bin = await findBin(candidate);

    if (!bin && process.platform === "win32" && candidate === "clamscan") {
      const guesses = [
        "C:\\ProgramData\\chocolatey\\lib\\clamav\\tools\\clamav-1.4.2.win.x64\\clamscan.exe",
        "C:\\Program Files\\ClamAV\\clamscan.exe"
      ];
      for (const g of guesses) { if (fs.existsSync(g)) { bin = g; break; } }
    }

    if (!bin) continue;

    const args = ["--no-summary", ...dbArg, filePath];

    const result = await new Promise((resolve) => {
      const p = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
      let out = "", err = "";
      const timer = setTimeout(() => {
        try { p.kill("SIGKILL"); } catch {}
        resolve({ code: 998, out, err: err || "timeout" });
      }, AV_TIMEOUT);

      p.stdout.on("data", d => out += d.toString());
      p.stderr.on("data", d => err += d.toString());
      p.on("error", (e) => { clearTimeout(timer); resolve({ code: 999, out, err: String(e?.message || e) }); });
      p.on("close", (code) => { clearTimeout(timer); resolve({ code, out, err }); });
    });

    if (result.code === 0) return true;
    if (result.code === 1) throw new Error("تم رفض الملف: مُصاب (ClamAV).");

    lastErr = `(${candidate}) code=${result.code} stderr=${(result.err || "").trim() || "<empty>"}`;

    if (candidate.includes("clamdscan") && /connect|socket|service/i.test(result.err || "")) {
      continue;
    }
  }

  throw new Error(`فشل فحص ClamAV. ${lastErr ? "تفاصيل: " + lastErr : "لم يتم العثور على clamscan/clamdscan في النظام."}`);
}

/* ========== تعقيم Ghostscript — مُحسّن ========== */
async function gsSanitizeStrict(filePath) {
  const candidates = process.platform === "win32" ? ["gswin64c", "gswin32c"] : ["gs"];
  let bin = await findBin(candidates);

  if (!bin && process.platform === "win32") {
    const guesses = [
      "C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe",
      "C:\\Program Files\\gs\\gs10.03.0\\bin\\gswin64c.exe",
      "C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe"
    ];
    for (const g of guesses) { if (fs.existsSync(g)) { bin = g; break; } }
  }

  if (!bin) throw new Error("Ghostscript غير مُثبّت. التعقيم إجباري.");

  const out = path.join(os.tmpdir(), `safe_${Date.now()}.pdf`);

  return new Promise((resolve, reject) => {
    const args = [
      "-dSAFER",
      "-o", out,
      "-sDEVICE=pdfwrite",
      "-dNOPAUSE",
      "-dBATCH",
      "-dEmbedAllFonts=true",
      "-dSubsetFonts=true",
      filePath,
    ];
    const p = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    const timer = setTimeout(() => {
      try { p.kill("SIGKILL"); } catch {}
      reject(new Error("انتهى وقت تعقيم Ghostscript."));
    }, GS_TIMEOUT);

    p.stderr.on("data", d => err += d.toString());
    p.on("error", (e) => { clearTimeout(timer); reject(new Error("تعذر تشغيل Ghostscript: " + (e?.message || e))); });
    p.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 && fs.existsSync(out)) return resolve(out);
      reject(new Error(`فشل تعقيم Ghostscript.${err ? " stderr: " + err.trim() : ""}`));
    });
  });
}

/* ===== Arabic-safe extraction toolset (Poppler + MuPDF + pdf-parse + OCR) ===== */
// تطبيع خفيف ومحايد + إنقاذ لام-ألف (بدون "تصحيح" للكلمات)
function normalizeArabicText(input = "") {
  let s = String(input);
  try { s = s.normalize("NFKC"); } catch {}

  // طبع لام-ألف أشكال العرض إلى حروف قياسية (ﻻ/ﻷ/ﻹ/ﻵ → لا/لأ/لإ/لآ)
  const lamAlefMap = {
    "\uFEF5":"لأ", "\uFEF6":"لأ",
    "\uFEF7":"لإ", "\uFEF8":"لإ",
    "\uFEF9":"لآ", "\uFEFA":"لآ",
    "\uFEFB":"لا", "\uFEFC":"لا"
  };
  s = s.replace(/[\uFEF5-\uFEFC]/g, ch => lamAlefMap[ch] || ch);

  // تنظيف طفيف فقط (لا نزيل كشيدة أو علامات اتجاه حتى لا نغيّر الشكل)
  s = s.replace(/\u0000/g, "")
       .replace(/\r/g, "\n")
       .replace(/\n{3,}/g, "\n\n")
       .trim();

  return s;
}

// قياس جودة العربي (يشمل Arabic Presentation Forms)
function scoreArabicQuality(s = "") {
  if (!s) return 0;
  const len = s.length;

  // Arabic + Supplement + Extended-A + Presentation A/B
  const ARABIC_RANGES = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;

  const arabicChars = (s.match(ARABIC_RANGES) || []).length;
  const replacement = (s.match(/\uFFFD|�/g) || []).length;
  const nonPrintableSingles = (s.match(/\b[A-Za-z]\b/g) || []).length;
  const avgLine = (() => {
    const lines = s.split(/\n+/).filter(Boolean);
    if (!lines.length) return 0;
    return lines.reduce((a, b) => a + b.length, 0) / lines.length;
  })();

  const arRatio = arabicChars / Math.max(1, len);
  const badRatio = replacement / Math.max(1, len);
  const singlesRatio = nonPrintableSingles / Math.max(1, len);

  let score = 0;
  score += arRatio * 60;
  score += Math.min(avgLine / 120, 1) * 10;
  score -= badRatio * 100;
  score -= singlesRatio * 40;
  score += Math.min(Math.log10(Math.max(10, len)) / 4, 8);

  return score;
}

async function tryPdfParse(filePath) {
  const buf = await fsp.readFile(filePath);
  const parsed = await pdfParse(buf);
  return normalizeArabicText(parsed.text || "");
}

async function tryPdftotextWithMode(filePath, mode /* "layout" | "raw" */) {
  const bin = await findBin("pdftotext");
  if (!bin) return null;
  const outTxt = path.join(os.tmpdir(), `pt_${Date.now()}.txt`);
  const args = ["-enc", "UTF-8", mode === "raw" ? "-raw" : "-layout", "-nopgbrk", filePath, outTxt];
  await execFileP(bin, args);
  const txt = await fsp.readFile(outTxt, "utf8").catch(() => "");
  try { await fsp.unlink(outTxt); } catch {}
  return normalizeArabicText(txt);
}

async function tryPdftotextBest(filePath) {
  const a = await tryPdftotextWithMode(filePath, "layout");
  const b = await tryPdftotextWithMode(filePath, "raw");
  return [a, b].filter(Boolean);
}

// MuPDF mutool
async function tryMuPdfText(filePath) {
  const bin = await findBin("mutool");
  if (!bin) return null;
  try {
    const { stdout } = await execFileP(
      bin,
      ["draw", "-F", "text", "-o", "-", filePath],
      { maxBuffer: 1024 * 1024 * 200 }
    );
    return normalizeArabicText(stdout || "");
  } catch {
    return null;
  }
}

// pdftohtml -xml
async function tryPdftohtmlXml(filePath) {
  const bin = await findBin("pdftohtml");
  if (!bin) return null;
  const outBase = path.join(os.tmpdir(), `px_${Date.now()}`);
  try {
    await execFileP(bin, ["-xml", "-enc", "UTF-8", "-nodrm", filePath, outBase + ".xml"]);
    const xml = await fsp.readFile(outBase + ".xml", "utf8");
    const text = xml.replace(/<[^>]+>/g, " ").replace(/[ \t]+/g, " ");
    try { await fsp.unlink(outBase + ".xml"); } catch {}
    return normalizeArabicText(text);
  } catch {
    try { await fsp.unlink(outBase + ".xml"); } catch {}
    return null;
  }
}

// OCR
async function tryOcrAra(filePath) {
  const bin = await findBin(process.platform === "win32" ? "tesseract.exe" : "tesseract");
  if (!bin) return null;
  const base = path.join(os.tmpdir(), `ocr_${Date.now()}`);
  try {
    await execFileP(bin, [filePath, base, "-l", "ara+eng", "--oem", "1", "--psm", "6"], { timeout: 10 * 60 * 1000 });
    const txt = await fsp.readFile(`${base}.txt`, "utf8").catch(() => "");
    try { await fsp.unlink(`${base}.txt`); } catch {}
    return normalizeArabicText(txt);
  } catch {
    try { await fsp.unlink(`${base}.txt`); } catch {}
    return null;
  }
}

/* ========== البايبلاين: أمان → تعقيم → استخراج → حفظ → مودل ========== */
exports.uploadThenGenerate = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, stage: "init", msg: "لم يتم استلام ملف." });
  }

  const tmp = req.file.path ? path.resolve(req.file.path) : null;
  let safePath;
  let stage = "init";

  try {
    if (!tmp) throw new Error("لم يُحدَّد مسار الملف المؤقت.");
    await assertFileExists(tmp);

    // اسم الملف بصيغة UTF-8 (لأسماء عربية)
    const originalNameUtf8 = decodeNameLatin1(req.file.originalname || "file.pdf");

    stage = "size/type";
    if (req.file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`حجم الملف يتجاوز ${MAX_SIZE_MB}MB.`);
    }
    const isPdf =
      req.file.mimetype === "application/pdf" ||
      originalNameUtf8.toLowerCase().endsWith(".pdf");
    if (!isPdf) throw new Error("يُقبل فقط ملف PDF.");

    stage = "magic";
    await requireMagicPDF(tmp);

    stage = "clamav";
    await clamScanStrict(tmp);

    stage = "ghostscript";
    safePath = await gsSanitizeStrict(tmp);
    await assertFileExists(safePath);

    stage = "extract";

    // شغّلي كل طرق الاستخراج على الأصل والنسخة المعقمة، وخذي الأفضل
    const candidates = [];

    // Poppler (orig & safe, raw/layout)
    for (const fp of [tmp, safePath]) {
      const tag = (fp === tmp) ? "orig" : "safe";
      const pts = await tryPdftotextBest(fp);
      for (const t of pts) if (t) candidates.push({ name: `pdftotext(${tag})`, text: t });
    }

    // pdf-parse (orig & safe)
    for (const fp of [safePath, tmp]) {
      try {
        const t = await tryPdfParse(fp);
        if (t) candidates.push({ name: `pdf-parse(${fp === tmp ? "orig" : "safe"})`, text: t });
      } catch {}
    }

    // MuPDF mutool (orig & safe)
    for (const fp of [safePath, tmp]) {
      const t = await tryMuPdfText(fp);
      if (t) candidates.push({ name: `mutool(${fp === tmp ? "orig" : "safe"})`, text: t });
    }

    // pdftohtml -xml (orig & safe)
    for (const fp of [safePath, tmp]) {
      const t = await tryPdftohtmlXml(fp);
      if (t) candidates.push({ name: `pdftohtml-xml(${fp === tmp ? "orig" : "safe"})`, text: t });
    }

    // OCR كحل أخير (safe ثم orig)
    {
      const t = (await tryOcrAra(safePath)) || (await tryOcrAra(tmp));
      if (t && t.length > 30) candidates.push({ name: "tesseract(ara+eng)", text: t });
    }

    if (!candidates.length) throw new Error("تعذّر استخراج نص عربي قابل للقراءة من الملف.");

    candidates.forEach(c => c.score = scoreArabicQuality(c.text));
    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];
    const text = best.text;
    const methodUsed = `${best.name} [score=${best.score.toFixed(2)} len=${text.length}]`;

    console.log("[extract] chosen method:", methodUsed);
    if (!text || text.length < 5) throw new Error("النص المستخرج قصير جدًا.");

    stage = "save";
    // الحفظ في Firestore — كولكشن pdf (سيتكوّن تلقائيًا)
    const docRef = await db.collection("pdf").add({
      userId: req.user?.id || req.user?._id || null,   // يعتمد على verifyToken
      originalName: originalNameUtf8,
      size: req.file.size,
      text,
      methodUsed,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    stage = "model";
    let modelResp = null;
    let modelError = null;
    try {
      const { data } = await axios.post(
        MODEL_API,
        { text, docId: docRef.id },
        { timeout: MODEL_TIMEOUT }
      );
      modelResp = data ?? null;
    } catch (e) {
      modelError = e?.message || "تعذر الاتصال بالمودل.";
      console.error("MODEL_API error:", modelError);
      // لا نرمِي الخطأ لكي ينجح الرفع حتى لو المودل متوقف
    }

    return res.json({
  ok: true,
  stage: "done",
  savedId: docRef.id,
  methodUsed,
  model: modelResp,
  modelError,
});

  } catch (err) {
    console.error("UPLOAD ERROR @", stage, err?.message || err);
    return res.status(400).json({ ok: false, stage, msg: err.message });
  } finally {
    try { if (tmp) await fsp.unlink(tmp); } catch {}
    try { if (safePath && safePath !== tmp) await fsp.unlink(safePath); } catch {}
  }
};
