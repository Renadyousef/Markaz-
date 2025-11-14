// server/src/controllers/studyPlanTasksController.js
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = require("../config/serviceAccountKey.json");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const TasksCol = db.collection("tasks");
const PlansCol = db.collection("study_plans");

const withId = (doc) => ({ id: doc.id, ...doc.data() });

/** يعيد مرجع/بيانات الخطة ويتأكد من الملكية */
async function ensurePlanOwned(ownerId, planId) {
  const planRef = PlansCol.doc(String(planId));
  const planSnap = await planRef.get();
  if (!planSnap.exists) {
    const e = new Error("Plan not found"); e.status = 404; throw e;
  }
  const plan = planSnap.data();
  if (plan.ownerId && plan.ownerId !== ownerId) {
    const e = new Error("Forbidden: not your plan"); e.status = 403; throw e;
  }
  return { planRef, plan };
}

/** GET /study-plans/:planId  → عنوان الخطة + tasksCount (للعرض فقط) */
exports.getPlanMeta = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ msg: "غير مصرّح بالدخول" });
    const ownerId = req.user.id || req.user.uid;
    const { planId } = req.params;
    if (!planId) return res.status(400).json({ msg: "planId مفقود" });

    const snap = await PlansCol.doc(String(planId)).get();
    if (!snap.exists) return res.status(404).json({ msg: "Plan not found" });

    const plan = snap.data();
    if (plan.ownerId && plan.ownerId !== ownerId) {
      return res.status(403).json({ msg: "Forbidden: not your plan" });
    }

    return res.json({
      id: snap.id,
      title: plan.title || "الخطة",
      ownerId: plan.ownerId || ownerId,
      createdAt: plan.createdAt || null,
      tasksCount: plan.tasksCount || 0,   // ← نرجع العداد
    });
  } catch (err) {
    console.error("❌ getPlanMeta error:", err);
    return res.status(err.status || 500).json({ msg: "Server error", error: err.message });
  }
};

/** GET /study-plans/:planId/tasks  → مهام الخطة */
exports.listTasksByPlan = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, msg: "غير مصرّح بالدخول" });
    const ownerId = req.user.id || req.user.uid;
    const { planId } = req.params;
    if (!planId) return res.status(400).json({ ok: false, msg: "planId مفقود" });

    const snap = await TasksCol
      .where("ownerId", "==", ownerId)
      .where("studyPlan_ID", "==", planId)
      .get();

    const tasks = snap.docs.map((d) => {
      const x = withId(d);
      return {
        id: x.id,
        title: x.title || "",
        priority: x.priority || "متوسطة",
        deadline: x.deadline || "",
        completed: !!x.completed,
        status: x.status || "Pending",
      };
    });

    res.json({ ok: true, planId, tasks });
  } catch (err) {
    console.error("❌ listTasksByPlan error:", err);
    res.status(500).json({
      ok: false,
      msg: "فشل في الجلب",
      error: err.message,
      code: err.code || null,
    });
  }
};

/** POST /study-plans/:planId/tasks  → إنشاء مهمة + زيادة tasksCount (من داخل view فقط) */
exports.createTask = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ msg: "غير مصرّح بالدخول" });
    const ownerId = req.user.id || req.user.uid;
    const { planId } = req.params;
    const { title, priority = "متوسطة", deadline = "", completed = false } = req.body || {};
    if (!planId) return res.status(400).json({ msg: "planId مفقود" });
    if (!title || !String(title).trim()) return res.status(400).json({ msg: "title مطلوب" });

    // تأكيد ملكية الخطة + تجهيز المراجع
    const { planRef } = await ensurePlanOwned(ownerId, planId);
    const newTaskRef = TasksCol.doc();

    // التحديث يتم داخل Transaction عشان العداد يتأثر من داخل هذا المسار فقط
    await db.runTransaction(async (tx) => {
      tx.set(newTaskRef, {
        studyPlan_ID: String(planId),
        ownerId,
        title: String(title).trim(),
        priority,
        deadline,                 // ISO yyyy-mm-dd
        completed: !!completed,   // يمديك تخلّينه دائمًا false لو تبين
        status: "Pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // زيادة العداد لهذه الخطة
      tx.update(planRef, {
        tasksCount: admin.firestore.FieldValue.increment(1),
      });
    });

    return res.status(201).json({ id: newTaskRef.id });
  } catch (err) {
    console.error("❌ createTask error:", err);
    return res.status(err.status || 500).json({ msg: "Server error", error: err.message });
  }
};

/** PATCH /study-plans/:planId/tasks/:taskId  → تعديل مهمة (لا يمس العداد) */
exports.updateTask = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ msg: "غير مصرّح بالدخول" });
    const ownerId = req.user.id || req.user.uid;
    const { planId, taskId } = req.params;

    const ref = TasksCol.doc(String(taskId));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ msg: "Task not found" });
    const data = snap.data();

    const belongs = (data.ownerId === ownerId) && (data.studyPlan_ID === String(planId));
    if (!belongs) return res.status(403).json({ msg: "Forbidden" });

    const updates = {};
    if ("title" in req.body)     updates.title     = String(req.body.title);
    if ("priority" in req.body)  updates.priority  = req.body.priority;
    if ("deadline" in req.body)  updates.deadline  = req.body.deadline;
    if ("completed" in req.body) updates.completed = !!req.body.completed;
    if ("status" in req.body)    updates.status    = req.body.status;

    if (!Object.keys(updates).length) return res.status(400).json({ msg: "لا يوجد حقول لتحديثها" });

    await ref.update(updates);
    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ updateTask error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/** DELETE /study-plans/:planId/tasks/:taskId  → حذف مهمة + إنقاص tasksCount (من داخل view فقط) */
exports.deleteTask = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ msg: "غير مصرّح بالدخول" });
    const ownerId = req.user.id || req.user.uid;
    const { planId, taskId } = req.params;

    const { planRef } = await ensurePlanOwned(ownerId, planId);

    const taskRef = TasksCol.doc(String(taskId));
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) return res.status(404).json({ msg: "Task not found" });
    const task = taskSnap.data();

    const belongs = (task.ownerId === ownerId) && (task.studyPlan_ID === String(planId));
    if (!belongs) return res.status(403).json({ msg: "Forbidden" });

    await db.runTransaction(async (tx) => {
      tx.delete(taskRef);
      // إنقاص العداد لهذه الخطة
      tx.update(planRef, {
        tasksCount: admin.firestore.FieldValue.increment(-1),
      });
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ deleteTask error:", err);
    return res.status(err.status || 500).json({ msg: err.message || "Server error" });
  }
};
