// server/src/controllers/uploadController.js
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const os = require("os");
const { execFile, spawn } = require("child_process");
const axios = require("axios");
const pdfParse = require("pdf-parse");
const admin = require("firebase-admin");
const db = admin.firestore();

const MODEL_API = process.env.MODEL_API || "http://localhost:6001/generate-from-text";
const MAX_SIZE_MB = 3;
const GS_TIMEOUT = 120000;
const AV_TIMEOUT = 120000;
const MODEL_TIMEOUT = 120000;

/* ===== أدوات مساعدة ===== */
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
    } catch {}
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
  if (sig.toString() !== "%PDF-") throw new Error("الملف ليس PDF صالحًا (فشل توقيع %PDF-).");
}

async function assertFileExists(filePath) {
  try {
    const st = await fsp.stat(filePath);
    if (!st.isFile()) throw new Error("المسار ليس ملفًا.");
  } catch {
    throw new Error(`المسار غير موجود أو غير صالح: ${filePath}`);
  }
}

const decodeNameLatin1 = (s = "") => {
  try { return Buffer.from(s, "latin1").toString("utf8"); }
  catch { return s; }
};

/* ========== ClamAV ========== */
async function clamScanStrict(filePath) {
  const prefer = process.platform === "win32" ? ["clamscan", "clamdscan"] : ["clamscan", "clamdscan"];
  const dbArg = process.platform === "win32" ? ["--database=C:\\ProgramData\\ClamAV\\db"] : [];
  let lastErr = null;

  for (const candidate of prefer) {
    let bin = await findBin(candidate);

    if (!bin && process.platform === "win32" && candidate === "clamscan") {
      const guesses = [
        "C:\\ProgramData\\chocolatey\\lib\\clamav\\tools\\clamav-1.4.2.win.x64\\clamscan.exe",
        "C:\\Program Files\\ClamAV\\clamscan.exe"
      ];
      for (const g of guesses) if (fs.existsSync(g)) { bin = g; break; }
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

    lastErr = `(${candidate}) code=${result.code} stderr=${(result.err || "").trim()}`;
  }

  throw new Error(`فشل فحص ClamAV. ${lastErr || "لم يتم العثور على clamscan/clamdscan."}`);
}

/* ========== Ghostscript Sanitize ========== */
async function gsSanitizeStrict(filePath) {
  const candidates = process.platform === "win32" ? ["gswin64c", "gswin32c"] : ["gs"];
  let bin = await findBin(candidates);

  if (!bin && process.platform === "win32") {
    const guesses = [
      "C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe",
      "C:\\Program Files\\gs\\gs10.03.0\\bin\\gswin64c.exe",
      "C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe"
    ];
    for (const g of guesses) if (fs.existsSync(g)) { bin = g; break; }
  }

  if (!bin) throw new Error("Ghostscript غير مُثبّت.");

  const out = path.join(os.tmpdir(), `safe_${Date.now()}.pdf`);

  return new Promise((resolve, reject) => {
    const args = [
      "-dSAFER", "-o", out, "-sDEVICE=pdfwrite",
      "-dNOPAUSE", "-dBATCH", "-dEmbedAllFonts=true", "-dSubsetFonts=true",
      filePath
    ];

    const p = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";

    const timer = setTimeout(() => {
      try { p.kill("SIGKILL"); } catch {}
      reject(new Error("انتهى وقت تعقيم Ghostscript."));
    }, GS_TIMEOUT);

    p.stderr.on("data", d => err += d.toString());
    p.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 && fs.existsSync(out)) return resolve(out);
      reject(new Error(`فشل تعقيم Ghostscript: ${err.trim()}`));
    });
  });
}

/* ========== Arabic Helpers ========== */
function normalizeArabicText(input = "") {
  let s = String(input);
  try { s = s.normalize("NFKC"); } catch {}

  const lamAlefMap = {
    "\uFEF5":"لأ", "\uFEF6":"لأ",
    "\uFEF7":"لإ", "\uFEF8":"لإ",
    "\uFEF9":"لآ", "\uFEFA":"لآ",
    "\uFEFB":"لا", "\uFEFC":"لا"
  };
  s = s.replace(/[\uFEF5-\uFEFC]/g, ch => lamAlefMap[ch] || ch);

  return s
    .replace(/\u0000/g, "")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function scoreArabicQuality(s = "") {
  if (!s) return 0;
  const len = s.length;
  const arabicRanges = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;

  const arabicChars = (s.match(arabicRanges) || []).length;
  const replacement = (s.match(/\uFFFD|�/g) || []).length;
  const singles = (s.match(/\b[A-Za-z]\b/g) || []).length;
  const lines = s.split(/\n+/).filter(Boolean);
  const avgLine = lines.length ? lines.reduce((a, b) => a + b.length, 0) / lines.length : 0;

  let score = 0;
  score += (arabicChars / len) * 60;
  score += Math.min(avgLine / 120, 1) * 10;
  score -= (replacement / len) * 100;
  score -= (singles / len) * 40;
  score += Math.min(Math.log10(Math.max(10, len)) / 4, 8);

  return score;
}

/* === Extractors === */
async function tryPdfParse(filePath) {
  const buf = await fsp.readFile(filePath);
  const parsed = await pdfParse(buf);
  return normalizeArabicText(parsed.text || "");
}

async function tryPdftotextWithMode(filePath, mode) {
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

async function tryMuPdfText(filePath) {
  const bin = await findBin("mutool");
  if (!bin) return null;
  try {
    const { stdout } = await execFileP(bin, ["draw", "-F", "text", "-o", "-", filePath], {
      maxBuffer: 1024 * 1024 * 200
    });
    return normalizeArabicText(stdout || "");
  } catch {
    return null;
  }
}

async function tryPdftohtmlXml(filePath) {
  const bin = await findBin("pdftohtml");
  if (!bin) return null;

  const outBase = path.join(os.tmpdir(), `px_${Date.now()}`);
  try {
    await execFileP(bin, ["-xml", "-enc", "UTF-8", "-nodrm", filePath, outBase + ".xml"]);
    const xml = await fsp.readFile(outBase + ".xml", "utf8");
    const txt = xml.replace(/<[^>]+>/g, " ").replace(/[ \t]+/g, " ");
    try { await fsp.unlink(outBase + ".xml"); } catch {}
    return normalizeArabicText(txt);
  } catch {
    try { await fsp.unlink(outBase + ".xml"); } catch {}
    return null;
  }
}

async function tryOcrAra(filePath) {
  const bin = await findBin(process.platform === "win32" ? "tesseract.exe" : "tesseract");
  if (!bin) return null;

  const base = path.join(os.tmpdir(), `ocr_${Date.now()}`);
  try {
    await execFileP(bin, [filePath, base, "-l", "ara+eng", "--oem", "1", "--psm", "6"], {
      timeout: 10 * 60 * 1000
    });
    const txt = await fsp.readFile(base + ".txt", "utf8").catch(() => "");
    try { await fsp.unlink(base + ".txt"); } catch {}
    return normalizeArabicText(txt);
  } catch {
    try { await fsp.unlink(base + ".txt"); } catch {}
    return null;
  }
}

/* ========== البايبلاين: أمان → تعقيم → استخراج Parallel → حفظ → مودل ========== */
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

    // 👇 نقرأ الاسم المخصص من البودي لو موجود
    const customNameRaw = (req.body?.customName || "").trim();

    // 👇 لو فيه اسم من البوب-أب نستخدمه، وإلا نرجع للاسم الأصلي
    const originalNameUtf8 = customNameRaw
      ? (customNameRaw.toLowerCase().endsWith(".pdf")
          ? customNameRaw
          : customNameRaw + ".pdf")
      : decodeNameLatin1(req.file.originalname || "file.pdf");
    stage = "size/type";
    if (req.file.size > MAX_SIZE_MB * 1024 * 1024)
      throw new Error(`حجم الملف يتجاوز ${MAX_SIZE_MB}MB.`);

    const isPdf =
      req.file.mimetype === "application/pdf" ||
      originalNameUtf8.toLowerCase().endsWith(".pdf");

    if (!isPdf) throw new Error("يُقبل فقط ملف PDF.");

    stage = "magic";
    await requireMagicPDF(tmp);


    stage = "clamav";

    const t_clam = Date.now();
await clamScanStrict(tmp);// await clamScanPermissive(tmp);
console.log("⏱ ClamAV took:", Date.now() - t_clam, "ms");

    stage = "ghostscript";

    const t_gs = Date.now();
safePath = await gsSanitizeStrict(tmp);// await gsSanitizePermissive(tmp);
console.log("⏱ Ghostscript took:", Date.now() - t_gs, "ms");

    await assertFileExists(safePath);


    stage = "extract";

    const jobs = [
      tryPdftotextBest(tmp).catch(() => null),
      tryPdftotextBest(safePath).catch(() => null),
      tryPdfParse(tmp).catch(() => null),
      tryPdfParse(safePath).catch(() => null),
      tryMuPdfText(tmp).catch(() => null),
      tryMuPdfText(safePath).catch(() => null),
      tryPdftohtmlXml(tmp).catch(() => null),
      tryPdftohtmlXml(safePath).catch(() => null),
      tryOcrAra(safePath).catch(() => null),
      tryOcrAra(tmp).catch(() => null),
    ];

    const t_extract = Date.now();
const results = await Promise.allSettled(jobs);// promise.all(jobs);
console.log("⏱ Extraction took:", Date.now() - t_extract, "ms");
    const candidates = [];

    results.forEach((r, i) => {
      if (r.status !== "fulfilled" || !r.value) return;
      const val = r.value;

      if (Array.isArray(val)) {
        val.forEach(t => t && candidates.push({ name: `job${i}`, text: t }));
      } else if (val && val.length > 3) {
        candidates.push({ name: `job${i}`, text: val });
      }
    });

    if (!candidates.length)
      throw new Error("تعذّر استخراج نص عربي قابل للقراءة من الملف.");

    candidates.forEach(c => c.score = scoreArabicQuality(c.text));
    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];
    const text = best.text;
    const methodUsed = `${best.name} [score=${best.score.toFixed(2)} len=${text.length}]`;

    if (!text || text.length < 5)
      throw new Error("النص المستخرج قصير جدًا.");

    console.log("[extract] chosen method:", methodUsed);

    
        stage = "save";

    const docRef = await db.collection("pdf").add({
      userId: req.user?.id || req.user?._id || null,
      originalName: originalNameUtf8,        // الاسم اللي رح نستخدمه بالعرض
      customName: customNameRaw || null,     // نخزن المخصص لو حابة تستخدمينه لاحقًا
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
      modelError = e?.message || "تعذر الاتصال openAI API .";
      console.error("MODEL_API error:", modelError);
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
