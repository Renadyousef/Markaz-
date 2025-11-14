// server/src/routes/studyPlanListRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { listAllPlans, deletePlan } = require("../controllers/studyPlanListController");

// جميع الخطط
router.get("/all", verifyToken, listAllPlans);

// ✅ حذف خطة حسب الـ id
router.delete("/:planId", verifyToken, deletePlan);

module.exports = router;
