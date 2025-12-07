// controllers/homeController.js
const admin = require("firebase-admin");
const { Students } = require("../config/firebase-config");

const db = admin.firestore();
const StudyPlansCol = db.collection("study_plans");
const StudySessionsCol = db.collection("study_session");
const TasksCol = db.collection("tasks"); // ✅ نحتاج المهام هنا

const getHomeData = async (req, res) => {
  try {
    // التحقق من المستخدم
    if (!req.user) {
      return res.status(401).json({ msg: "غير مصرّح" });
    }

    // بيانات الطالب من كولكشن students
    const snap = await Students.doc(req.user.id).get();
    if (!snap.exists) {
      return res.status(404).json({ msg: "المستخدم غير موجود" });
    }

    const u = snap.data() || {};

    /* ==========================================
       1) عدد الخطط الدراسية المكتملة بناءً على المهام
       ========================================== */
    let completedPlansCount = 0;
    try {
      // نجيب كل خطط المستخدم
      const plansSnap = await StudyPlansCol
        .where("ownerId", "==", req.user.id)
        .get();

      // نجيب كل مهام المستخدم
      const tasksSnap = await TasksCol
        .where("ownerId", "==", req.user.id)
        .get();

      // خريطة إحصائيات لكل خطة: { planId: { total, completed } }
      const perPlanStats = {};

      tasksSnap.forEach((doc) => {
        const data = doc.data();
        const planId = String(
          data.studyPlan_ID || data.studyPlanId || ""
        );
        if (!planId) return;

        if (!perPlanStats[planId]) {
          perPlanStats[planId] = { total: 0, completed: 0 };
        }
        perPlanStats[planId].total += 1;
        if (data.completed === true) {
          perPlanStats[planId].completed += 1;
        }
      });

      // نحسب كم خطة كل مهامها مكتملة
      plansSnap.forEach((doc) => {
        const planId = doc.id;
        const stats = perPlanStats[planId];

        if (!stats) return; // خطة بدون مهام ما نعدّها مكتملة
        if (stats.total > 0 && stats.completed === stats.total) {
          completedPlansCount++;
        }
      });

      console.log(
        "✅ completedPlansCount (by tasks) for user",
        req.user.id,
        "=",
        completedPlansCount
      );
    } catch (err) {
      console.error("homeController completedPlansCount error:", err);
    }

    /* ==================================
       2) عدد جلسات الدراسة المكتملة فقط
       ================================== */
    let completedStudySessionsCount = 0;
    try {
      const sessionsSnap = await StudySessionsCol
        .where("student_ID", "==", req.user.id)
        .where("status", "==", "completed") // عدّ الجلسات المكتملة
        .get();

      completedStudySessionsCount = sessionsSnap.size;
      console.log(
        "✅ completedStudySessionsCount for user",
        req.user.id,
        "=",
        completedStudySessionsCount
      );
    } catch (err) {
      console.error(
        "homeController completedStudySessions error:",
        err
      );
    }

    // نعيد القيم للفرونت
    return res.status(200).json({
      firstName: u.firstName || "",
      completedPlansCount, // ✅ من المهام مباشرة
      completedSessionsCount: completedStudySessionsCount,
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
