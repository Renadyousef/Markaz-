// server/src/controllers/sidebarController.js
const { Students } = require("../config/firebase-config");

// GET /sidebar/me
const getSidebarData = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ msg: "غير مصرّح" });

    const snap = await Students.doc(req.user.id).get();
    if (!snap.exists) return res.status(404).json({ msg: "المستخدم غير موجود" });

    const u = snap.data();
    return res.status(200).json({
      firstName: u.firstName || "",
      lastName:  u.lastName  || "",
    });
  } catch (err) {
    return res.status(500).json({ msg: "خطأ في جلب بيانات السايدبار", error: err.message });
  }
};

module.exports = { getSidebarData };