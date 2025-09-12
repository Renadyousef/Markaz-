// server/src/routes/homeRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { getHomeData } = require("../controllers/homeController");

// GET /home/me
router.get("/me", verifyToken, getHomeData);

module.exports = router;
