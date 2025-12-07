// controllers/studyPlanFetchController.js
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = require("../config/serviceAccountKey.json");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const StudyPlansCol = db.collection("study_plans");
const TasksCol = db.collection("tasks");

const withId = (doc) => ({ id: doc.id, ...doc.data() });

/**
 * يتحقق من حالة المهام لتحديث حالة الخطة (مكتملة / غير مكتملة)
 */
async function autoUpdatePlanStatus(planId) {
  try {
    const tasksSnap = await TasksCol.where("studyPlan_ID", "==", planId).get();

    // لو ما فيه مهام ما نحدّث شي (تقدرين لاحقاً تجبرينها تكون غير مكتملة لو حبيتي)
    if (tasksSnap.empty) return;

    const tasks = tasksSnap.docs.map((d) => d.data());
    const allCompleted = tasks.every((t) => t.completed === true);

    if (allCompleted) {
      await StudyPlansCol.doc(planId).update({ status: "مكتملة" });
    } else {
      await StudyPlansCol.doc(planId).update({ status: "غير مكتملة" });
    }
  } catch (err) {
    console.error("❌ autoUpdatePlanStatus error:", err.message);
  }
}

exports.listAllPlans = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ ok: false, msg: "غير مصرّح بالدخول" });

    const ownerId = req.user.id;

    // جلب الخطط مرتبة بالأحدث
    const snap = await StudyPlansCol
      .where("ownerId", "==", ownerId)
      .orderBy("createdAt", "desc")
      .get();

    // تحديث حالة كل خطة قبل الإرسال
    const updatePromises = snap.docs.map((doc) => autoUpdatePlanStatus(doc.id));
    await Promise.all(updatePromises);

    // جلب البيانات بعد التحديث
    const refreshedSnap = await StudyPlansCol
      .where("ownerId", "==", ownerId)
      .orderBy("createdAt", "desc")
      .get();

    // ===== حساب إحصائيات المهام لكل خطة (إجمالي / منجزة) =====
    let totalTasks = 0;
    let completedTasks = 0;
    const perPlanStats = {}; // { planId: { total, completed } }

    try {
      const allTasksSnap = await TasksCol.where(
        "ownerId",
        "==",
        ownerId
      ).get();

      totalTasks = allTasksSnap.size;

      allTasksSnap.forEach((doc) => {
        const data = doc.data();
        const isCompleted = data.completed === true;
        if (isCompleted) completedTasks++;

        const planId = String(
          data.studyPlan_ID || data.studyPlanId || ""
        );
        if (!planId) return;

        if (!perPlanStats[planId]) {
          perPlanStats[planId] = { total: 0, completed: 0 };
        }
        perPlanStats[planId].total += 1;
        if (isCompleted) perPlanStats[planId].completed += 1;
      });
    } catch (e) {
      console.warn("tasks stats error (listAllPlans):", e.code, e.message);
    }

    // تجهيز الخطط مع نسبة الإنجاز
    let plans = refreshedSnap.docs.map((d) => {
      const x = withId(d);
      const stats = perPlanStats[x.id] || {};

      // لو عندنا إحصائيات من المهام نستخدمها، وإلا نرجع لقيمة tasksCount اللي في الخطة
      const totalFromStats = Number(stats.total ?? 0);
      const totalTasksForPlan =
        totalFromStats > 0
          ? totalFromStats
          : Number(x.tasksCount || 0);

      const completedForPlan = Number(stats.completed ?? 0);

      const completionPercentage =
        totalTasksForPlan > 0
          ? Math.min(
              100,
              Math.max(0, (completedForPlan / totalTasksForPlan) * 100)
            )
          : 0;

      // نخلي الستاتس محصورة بين "مكتملة" و "غير مكتملة"
      const statusNormalized =
        completionPercentage === 100 && totalTasksForPlan > 0
          ? "مكتملة"
          : "غير مكتملة";

      return {
        id: x.id,
        title: x.title || "",
        createdAt: x.createdAt || "",
        tasksCount: totalTasksForPlan,
        status: x.status ? x.status : statusNormalized, // افتراضياً غير مكتملة/مكتملة
        completionPercentage, // ✅ نفس اللي تستخدمينه في StudyPlansPage
      };
    });

    // فلترة / ترتيب حسب الكويري
    const { q = "", status = "الكل", sort = "newest" } = req.query;

    if (q.trim()) {
      const s = q.trim();
      plans = plans.filter((p) => p.title.includes(s));
    }

    if (status && status !== "الكل") {
      plans = plans.filter((p) => p.status === status);
    }

    switch (sort) {
      case "newest":
        plans.sort((a, b) =>
          String(b.createdAt).localeCompare(String(a.createdAt))
        );
        break;
      case "oldest":
        plans.sort((a, b) =>
          String(a.createdAt).localeCompare(String(b.createdAt))
        );
        break;
      case "tasks_desc":
        plans.sort((a, b) => b.tasksCount - a.tasksCount);
        break;
      case "tasks_asc":
        plans.sort((a, b) => a.tasksCount - b.tasksCount);
        break;
      default:
        break;
    }

    res.json({
      ok: true,
      plans,
      // لو احتجتيها قدام في صفحة ثانية 🙂
      taskStats: {
        totalTasks,
        completedTasks,
        remainingTasks: Math.max(totalTasks - completedTasks, 0),
      },
    });
  } catch (err) {
    console.error("❌ listAllPlans error:", err);
    res
      .status(500)
      .json({ ok: false, msg: "فشل في الجلب", error: err.message });
  }
};

/* ✅ حذف خطة مع حذف مهامها التابعة */
exports.deletePlan = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ ok: false, msg: "غير مصرّح بالدخول" });
    const ownerId = req.user.id;
    const { planId } = req.params;

    if (!planId)
      return res
        .status(400)
        .json({ ok: false, msg: "planId مطلوب" });

    const planRef = StudyPlansCol.doc(planId);
    const planSnap = await planRef.get();
    if (!planSnap.exists)
      return res
        .status(404)
        .json({ ok: false, msg: "الخطة غير موجودة" });

    const plan = planSnap.data();
    if (plan.ownerId !== ownerId)
      return res.status(403).json({ ok: false, msg: "غير مسموح" });

    // حذف مهام الخطة ثم حذف الخطة
    const tasksSnap = await TasksCol.where(
      "studyPlan_ID",
      "==",
      planId
    ).get();
    const batch = db.batch();
    tasksSnap.forEach((d) => batch.delete(TasksCol.doc(d.id)));
    batch.delete(planRef);
    await batch.commit();

    res.json({ ok: true, msg: "تم حذف الخطة وجميع مهامها" });
  } catch (err) {
    console.error("❌ deletePlan error:", err);
    res
      .status(500)
      .json({ ok: false, msg: "فشل في الحذف", error: err.message });
  }
};
