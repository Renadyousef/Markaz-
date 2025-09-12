// routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { getMe, updateMe } = require("../controllers/profileController");

// =========================
// GET /api/profile/me
// → Fetch the logged-in user's basic profile info
// =========================
router.get("/me", verifyToken, getMe);

// =========================
// PUT /api/profile/me
// → Update the user's firstName & lastName
// =========================
router.put("/me", verifyToken, updateMe);

module.exports = router;

