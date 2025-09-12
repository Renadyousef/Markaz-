// server/src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Middlewares
const { verifyToken } = require("./middleware/authMiddleware");

// Routers
const authRoutes = require("./routes/authRoutes");
const homeRoutes = require("./routes/homeRoutes");
const sidebarRoutes = require("./routes/sidebarRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// ========== Middlewares عامة ==========
app.use(cors());            // يسمح بالطلبات بين React و Express
app.use(express.json());    // يحلل JSON القادم من الـ request

// ========== الراوترات ==========
app.use("/auth", authRoutes);       // POST /auth/signin
app.use("/home", homeRoutes);       // GET /home/me (يتطلب توكن)
app.use("/sidebar", sidebarRoutes); // GET /sidebar/me (يتطلب توكن)
app.use("/user", userRoutes);       // تجريب session أو جلب بيانات المستخدم

// ========== 404 ==========
app.use((req, res) => {
  res.status(404).json({
    msg: "المسار غير موجود",
    method: req.method,
    url: req.originalUrl,
  });
});

// ========== Error Handler ==========
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ msg: "خطأ في الخادم", error: err.message });
});

module.exports = app;
