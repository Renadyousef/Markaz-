// controllers/studyPlanFetchController.js
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = require("../config/serviceAccountKey.json");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const StudyPlansCol = db.collection("study_plans");
const TasksCol      = db.collection("tasks");

const withId = (doc) => ({ id: doc.id, ...doc.data() });

/* ===== اليوم بتوقيت الرياض (UTC+3) كسلسلة YYYY-MM-DD ===== */
function todayRiyadhISO() {
  const now = new Date();
  // ازاحة +3 ساعات
  const riyadh = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const y = riyadh.getUTCFullYear();
  const m = String(riyadh.getUTCMonth() + 1).padStart(2, "0");
  const d = String(riyadh.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* ===== نطاق اليوم لحقول Timestamp ===== */
function riyadhStartEndTodayAsUTC() {
  const now = new Date();
  // احسب منتصف الليل في الرياض ثم حوّله لـ UTC millis
  const riyadh = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const y = riyadh.getUTCFullYear();
  const m = riyadh.getUTCMonth();
  const d = riyadh.getUTCDate();
  const startRiyadh = new Date(Date.UTC(y, m, d, 0, 0, 0)); // 00:00 الرياض
  const endRiyadh   = new Date(Date.UTC(y, m, d, 23, 59, 59, 999)); // 23:59:59.999 الرياض
  // وارجعها كـ Timestamp لو متاح
  const ts = admin.firestore.Timestamp;
  return { startTS: ts.fromDate(startRiyadh), endTS: ts.fromDate(endRiyadh) };
}

const PRIORITY_RANK = {
  High: 0, "عالية": 0, 3: 0, "3": 0,
  Medium: 1, "متوسطة": 1, 2: 1, "2": 1,
  Low: 2, "منخفضة": 2, 1: 2, "1": 2,
};

function toDate(val) {
  if (!val) return null;
  if (val?.toDate) return val.toDate();        // Firestore Timestamp
  if (val?.toMillis) return new Date(val.toMillis());
  if (typeof val === "number") return new Date(val);
  if (typeof val === "string") {
    // "YYYY-MM-DD" → افترض منتصف الليل بتوقيت الرياض لتوحيد المقارنة
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(val + "T00:00:00+03:00");
    return new Date(val);
  }
  return null;
}

exports.getOverview = async (req, res) => {
  try {
    const user = req.user || {};
    const ownerId = user.id || user.uid; // ✅ يدعم كلا الحقلين
    if (!ownerId) return res.status(401).json({ ok:false, msg: "غير مصرّح بالدخول" });

    const todayISO = todayRiyadhISO();
    const { startTS, endTS } = riyadhStartEndTodayAsUTC();

    /* ========== أحدث الخطط ========== */
    let topThreePlans = [];
    try {
      const plansSnap = await StudyPlansCol
        .where("ownerId", "==", ownerId)
        .orderBy("createdAt", "desc")
        .limit(3)
        .get();
      topThreePlans = plansSnap.docs.map((d) => {
        const x = withId(d);
        return {
          id: x.id,
          title: x.title || "",
          createdAt: x.createdAt || "",
          tasksCount: Number(x.tasksCount || 0),
        };
      });
    } catch (e) {
      console.warn("Plans indexed query failed, falling back:", e.code, e.message);
      const snap = await StudyPlansCol.where("ownerId", "==", ownerId).limit(50).get();
      topThreePlans = snap.docs
        .map((d) => withId(d))
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
        .slice(0, 3)
        .map((x) => ({
          id: x.id,
          title: x.title || "",
          createdAt: x.createdAt || "",
          tasksCount: Number(x.tasksCount || 0),
        }));
    }

    /* ========== مهام اليوم فقط (تدعم String و Timestamp) ========== */
    let tasksStringType = [];
    let tasksTimestampType = [];
    let errors = [];

    // 1) deadline كسلسلة "YYYY-MM-DD"
    try {
      const snap1 = await TasksCol
        .where("ownerId", "==", ownerId)
        .where("deadline", "==", todayISO)
        .limit(100)
        .get();
      tasksStringType = snap1.docs.map(withId);
    } catch (e) {
      errors.push({ type: "string-equality", code: e.code, msg: e.message });
    }

    // 2) deadline كـ Timestamp ضمن نطاق اليوم (بتوقيت الرياض)
    try {
      const snap2 = await TasksCol
        .where("ownerId", "==", ownerId)
        .where("deadline", ">=", startTS)
        .where("deadline", "<=", endTS)
        .limit(100)
        .get();
      tasksTimestampType = snap2.docs.map(withId);
    } catch (e) {
      errors.push({ type: "timestamp-range", code: e.code, msg: e.message });
    }

    // لو فشلت الفهارس، سوي Fallback شامل
    let nearestTasksRaw = [...tasksStringType, ...tasksTimestampType];
    if (nearestTasksRaw.length === 0) {
      try {
        const snap = await TasksCol.where("ownerId", "==", ownerId).limit(500).get();
        nearestTasksRaw = snap.docs
          .map(withId)
          .filter((x) => {
            const st = (x.status || "").toString().toLowerCase();
            const isActive = ["pending", "inprogress", "in_progress", "قيد_التنفيذ"].includes(st) || !x.status;
            if (!isActive) return false;
            const d = toDate(x.deadline);
            if (!d) return false;
            // طابقي اليوم في الرياض
            const todayStr = todayISO; // "YYYY-MM-DD" في الرياض
            const y = d.getUTCFullYear();
            const m = String(d.getUTCMonth() + 1).padStart(2, "0");
            const day = String(d.getUTCDate()).padStart(2, "0");
            const asISOInRiyadh = `${y}-${m}-${day}`;
            return asISOInRiyadh === todayStr;
          });
      } catch (e) {
        errors.push({ type: "fallback-scan", code: e.code, msg: e.message });
      }
    }

    // نظّفي التكرار لو نفس المهمة انضافت من المسارين
    const seen = new Set();
    nearestTasksRaw = nearestTasksRaw.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });

    // رتّب حسب الأولوية ثم الوقت
    nearestTasksRaw.sort((a, b) => {
      const ra = PRIORITY_RANK[a.priority] ?? 999;
      const rb = PRIORITY_RANK[b.priority] ?? 999;
      if (ra !== rb) return ra - rb;
      const da = toDate(a.deadline)?.getTime() ?? 0;
      const db = toDate(b.deadline)?.getTime() ?? 0;
      if (da !== db) return da - db;
      return String(a.title || "").localeCompare(String(b.title || ""), "ar");
    });

    nearestTasksRaw = nearestTasksRaw.slice(0, 10);

    // جلب أسماء الخطط
    const planIds = Array.from(new Set(
      nearestTasksRaw.map(t => String(t.studyPlan_ID || t.studyPlanId || "")).filter(Boolean)
    ));
    const titlesMap = {};
    if (planIds.length) {
      const planSnaps = await Promise.all(planIds.map(id => StudyPlansCol.doc(id).get()));
      for (const s of planSnaps) {
        if (s.exists) titlesMap[s.id] = s.data()?.title || "";
      }
    }

    // ✅ فقط إضافة حقول deadlineISO و completed — بدون حذف أي شيء
    const nearestTasks = nearestTasksRaw.map((x) => {
      let deadlineISO = "";
      try {
        if (typeof x.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.deadline)) {
          deadlineISO = x.deadline;
        } else if (x.deadline?.toDate) {
          const d = x.deadline.toDate();
          const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
          deadlineISO = `${y}-${m}-${day}`;
        } else if (x.deadline?.toMillis) {
          const d = new Date(x.deadline.toMillis());
          const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
          deadlineISO = `${y}-${m}-${day}`;
        }
      } catch {}

      return {
        id: x.id,
        title: x.title || "",
        deadline: x.deadline || "",
        deadlineISO,                // ← إضافة 1: صيغة قياسية "YYYY-MM-DD"
        completed: !!x.completed,   // ← إضافة 2: حالة الإنجاز
        priority: x.priority || "متوسطة",
        planId: String(x.studyPlan_ID || x.studyPlanId || ""),
        planTitle: titlesMap[String(x.studyPlan_ID || x.studyPlanId || "")] || "",
      };
    });

    res.json({ ok: true, nearestTasks, topThreePlans, _debug: { errors } });
  } catch (err) {
    console.error("❌ getOverview fatal error:", err);
    res.status(500).json({
      ok: false,
      msg: "فشل في الجلب",
      error: err.message,
      errorCode: err.code || null,
    });
  }
};
