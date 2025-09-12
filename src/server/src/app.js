// server/src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// راوتراتنا
const authRoutes = require("./routes/authRoutes");
const homeRoutes = require("./routes/homeRoutes");
const sidebarRoutes = require("./routes/sidebarRoutes"); // ⬅️ جديد

const app = express();

// Middlewares عامة
app.use(cors());
app.use(express.json());

// ركّب الراوترات المطلوبة فقط
app.use("/auth", authRoutes);     // POST /auth/signin
app.use("/home", homeRoutes);     // GET  /home/me (يتطلب توكن)
app.use("/sidebar", sidebarRoutes); // ⬅️ GET /sidebar/me (يتطلب توكن)

// 404 (آخر شيء)
app.use((req, res) => {
  res.status(404).json({ msg: "المسار غير موجود", method: req.method, url: req.originalUrl });
});

// Error handler عام
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ msg: "خطأ في الخادم", error: err.message });
});

module.exports = app;
