//fetch uer info  userRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");//verfiy token
const { Students } = require("../config/firebase-config");

// GET /user/me ?
router.get("/me", verifyToken, async (req, res) => {
  try {
    // req.user is set by verifyToken middleware
    const userDoc = await Students.doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ msg: "المستخدم غير موجود" });

    const user = userDoc.data();
    res.status(200).json({ firstName: user.firstName });
  } catch (error) {
    res.status(500).json({ msg: "فشل جلب بيانات المستخدم", error: error.message });
  }
});

module.exports = router;
