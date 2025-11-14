const admin = require("firebase-admin");

// ✅ تأكد أن Firebase Admin مهيأ
if (!admin.apps.length) {
  const serviceAccount = require("../config/serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const StudyPlansCol = db.collection("study_plans");
const TasksCol = db.collection("tasks");

/* ============================================================
   إنشاء خطة دراسية + المهام الخاصة بها
   (يتم أخذ ownerId تلقائياً من req.user مثل homeController)
   ============================================================ */
exports.createPlan = async (req, res) => {
  try {
    // ✅ التحقق من المستخدم
    if (!req.user) {
      return res.status(401).json({ msg: "غير مصرّح بالدخول" });
    }

    const ownerId = req.user.id; // ← هذا هو UID
    const { title, tasks = [] } = req.body;

    if (!title) return res.status(400).json({ msg: "العنوان مطلوب" });

    const now = new Date().toISOString();

    // ✅ إنشاء وثيقة الخطة
    const planDoc = await StudyPlansCol.add({
      title,
      ownerId,
      tasksCount: tasks.length,
      createdAt: now,
    });

    // ✅ إضافة المهام (إن وجدت)
    if (tasks.length > 0) {
      const batch = db.batch();
      tasks.forEach((t) => {
        const ref = TasksCol.doc();
        batch.set(ref, {
          studyPlan_ID: planDoc.id,
          title: t.title,
          priority: t.priority || "متوسطة",
          deadline: t.deadline || "",
          createdAt: now,
          ownerId, // ← من التوكن تلقائيًا
        });
      });
      await batch.commit();
    }

    res.status(201).json({
      ok: true,
      msg: "✅ تم حفظ الخطة بنجاح",
      planId: planDoc.id,
      ownerId, // ← نرجعه تأكيداً
    });
  } catch (err) {
    console.error("❌ createPlan error:", err);
    res.status(500).json({
      ok: false,
      msg: "فشل في حفظ الخطة",
      error: err.message,
    });
  }
};
