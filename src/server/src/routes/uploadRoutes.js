// server/src/routes/uploadRoutes.js
const express = require("express");
const multer  = require("multer");
const path    = require("path");
const os      = require("os");
const fs      = require("fs");

const { verifyToken } = require("../middleware/authMiddleware");
const { uploadThenGenerate } = require("../controllers/uploadController");

const router = express.Router();

/* ========= إعداد مجلد مؤقت ========= */
const TMP_DIR = path.join(os.tmpdir(), "markaz_uploads");
fs.mkdirSync(TMP_DIR, { recursive: true });

const MAX_MB = 20;

/* ========= Multer ========= */
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TMP_DIR),
    filename: (_req, file, cb) => {
      const safe = (file.originalname || "file.pdf").replace(/\s+/g, "_");
      cb(null, `${Date.now()}_${safe}`);
    }
  }),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === "application/pdf" ||
      (file.originalname || "").toLowerCase().endsWith(".pdf");
    if (!ok) return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "PDF only"));
    cb(null, true);
  }
});

/* ========= الراوت =========
   اسم الحقل في الفرونت لازم يكون 'pdf'
*/
router.post("/upload-pdf", verifyToken, upload.single("pdf"), uploadThenGenerate);

/* ========= معالج أخطاء Multer ========= */
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ ok: false, msg: `حجم الملف يتجاوز ${MAX_MB}MB.` });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ ok: false, msg: "يُقبل فقط ملف PDF." });
    }
    return res.status(400).json({ ok: false, msg: `Multer error: ${err.code}` });
  }
  return next(err);
});

module.exports = router;
