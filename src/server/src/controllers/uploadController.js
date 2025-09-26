// server/src/controllers/uploadController.js
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const os = require("os");
const { execFile, spawn } = require("child_process");
const axios = require("axios");
const pdfParse = require("pdf-parse");
const admin = require("firebase-admin");       // 🔸 نفترض أنه مُهيّأ في مكان آخر
const db = admin.firestore();

const MODEL_API = process.env.MODEL_API || "http://localhost:6001/generate-from-text";
const MAX_SIZE_MB = 20;
const GS_TIMEOUT = 120000; // 120s
const AV_TIMEOUT = 120000;
const MODEL_TIMEOUT = 120000;

/* ========== أدوات مشتركة ========== */
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
    } catch (_) { /* جرّب التالي */ }
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
    .replace(/[ \t]+/g, " ")
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

/* ========== تعقيم Ghostscript — إجباري ========== */
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

    stage = "size/type";
    if (req.file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`حجم الملف يتجاوز ${MAX_SIZE_MB}MB.`);
    }
    const isPdf =
      req.file.mimetype === "application/pdf" ||
      (req.file.originalname || "").toLowerCase().endsWith(".pdf");
    if (!isPdf) throw new Error("يُقبل فقط ملف PDF.");

    stage = "magic";
    await requireMagicPDF(tmp);

    stage = "clamav";
    await clamScanStrict(tmp);

    stage = "ghostscript";
    safePath = await gsSanitizeStrict(tmp);
    await assertFileExists(safePath);

    stage = "extract";
    const buffer = await fsp.readFile(safePath);
    const parsed = await pdfParse(buffer); // سيرمي لو الملف مشفّر بكلمة مرور
    const text = cleanText(parsed.text);
    if (!text) throw new Error("تعذّر استخراج نص من الملف.");

    stage = "save";
    // 🔸 الحفظ في Firestore — كولكشن pdf يُنشأ تلقائيًا
    const docRef = await db.collection("pdf").add({
      userId: req.user?.id || req.user?._id || null,   // لو عندك verifyToken
      originalName: req.file.originalname,
      size: req.file.size,
      text,
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
      // 👈 لا نرمى الخطأ عشان الرفع ينجح حتى لو المودل طافي
    }

    // نجاح
    return res.json({
      ok: true,
      stage: "done",
      savedId: docRef.id,
      textChars: text.length,
      model: modelResp,
      modelError,       // null لو المودل اشتغل
    });
  } catch (err) {
    console.error("UPLOAD ERROR @", stage, err?.message || err);
    return res.status(400).json({ ok: false, stage, msg: err.message });
  } finally {
    try { if (tmp) await fsp.unlink(tmp); } catch {}
    try { if (safePath && safePath !== tmp) await fsp.unlink(safePath); } catch {}
  }
};
