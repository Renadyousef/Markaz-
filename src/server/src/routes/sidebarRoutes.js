// server/src/routes/sidebarRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { getSidebarData } = require("../controllers/sidebarController");

// GET /sidebar/me
router.get("/me", verifyToken, getSidebarData);

module.exports = router;
