const express = require("express");
const router = express.Router();
const { createPlan } = require("../controllers/studyPlanController");
const { verifyToken } = require("../middleware/authMiddleware");

// ✅ حماية الراوت
router.post("/", verifyToken, createPlan);

module.exports = router;
