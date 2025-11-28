// server/src/controllers/homeController.js
const admin = require("firebase-admin");
const { Students } = require("../config/firebase-config");

// نفترض إنك تستخدم نفس مشروع Firebase في باقي الكنترولرز
const db = admin.firestore();
const StudyPlansCol = db.collection("study_plans");

const getHomeData = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ msg: "غير مصرّح" });

    // بيانات الطالب
    const snap = await Students.doc(req.user.id).get();
    if (!snap.exists)
      return res.status(404).json({ msg: "المستخدم غير موجود" });

    const u = snap.data() || {};

    // ✅ عدد الخطط المكتملة لهذا الطالب
    let completedPlansCount = 0;
    try {
      const plansSnap = await StudyPlansCol
        .where("ownerId", "==", req.user.id)
        .where("status", "==", "مكتملة") // نفس النص اللي تستخدمينه في الداتابيس
        .get();

      completedPlansCount = plansSnap.size;
    } catch (err) {
      console.error("homeController completedPlansCount error:", err.message);
    }

    // نعيد الاسم + عدد الخطط المكتملة
    return res.status(200).json({
      firstName: u.firstName || "",
      completedPlansCount, // 👈 هذا اللي بنستخدمه في الكارد
    });
  } catch (err) {
    console.error("getHomeData error:", err);
    return res.status(500).json({
      msg: "خطأ في جلب بيانات الهوم",
      error: err.message,
    });
  }
};

module.exports = { getHomeData };
