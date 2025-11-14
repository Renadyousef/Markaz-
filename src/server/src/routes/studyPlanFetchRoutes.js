const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { getOverview } = require("../controllers/studyPlanFetchController");

// ✅ جلب بيانات الصفحة (أقرب مهام + أحدث 3 خطط) حسب المستخدم المسجّل دخول
router.get("/study-plans/overview", verifyToken, getOverview);

module.exports = router;
