// server/src/controllers/progressController.js
const admin = require("firebase-admin");
const db = admin.firestore();

/* ========================= HELPERS ========================= */

/** Extracts userId safely from token */
function getUserId(req, res) {
  const u = req.user || {};
  const userId =
    u.id ||
    u.uid ||
    u.userId ||
    u._id ||
    u.user?.id ||
    u.user?.uid ||
    req.userId ||
    null;

  if (!userId) {
    console.log("⚠️ Missing user ID in token:", req.user);
    res.status(401).json({ ok: false, error: "Unauthorized: Missing user ID" });
    return null;
  }
  return userId;
}

/* ========================= CONTROLLERS ========================= */

/**
 * GET /api/progress/me
 * Returns today's progress summary for the logged-in student
 */
exports.getProgress = async (req, res) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

    /* 🟢 1. Fetch Tasks (collection uses ownerId) */
    const tasksSnap = await db.collection("tasks")
      .where("ownerId", "==", userId)
      .get();

    const totalTasks = tasksSnap.size;
    const completedTasks = tasksSnap.docs.filter(d => d.data().completed === true).length;

    /* 🟢 2. Fetch Study Sessions (collection uses student_ID) */
    const sessionsSnap = await db.collection("study_session")
      .where("student_ID", "==", userId)
      .get();

    const sessionsToday = sessionsSnap.docs.filter(d => {
      const created = new Date(d.data().createdAt);
      const createdDate = created.toISOString().slice(0, 10);
      return createdDate === today;
    }).length;

    /* 🟢 3. Fetch last two quiz results (collection uses userId or user_id) */
    let quizSnap = await db.collection("quiz_result")
  .where("user_id", "==", userId)   // <-- عدلنا الاسم ليتطابق مع Firestore
  .orderBy("createdAt", "desc")
  .limit(2)
  .get();

    if (quizSnap.empty) {
      quizSnap = await db.collection("quiz_result")
        .where("user_id", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(2)
        .get();
    }

    const scores = quizSnap.docs.map(d => d.data().score || 0);
    const [latest, previous] = scores;
    const improvement = latest && previous ? latest - previous : 0;

    /* 🟢 4. Compute Progress % */
    const progressPercent = (
      ((completedTasks / (totalTasks || 1)) * 40) +
      ((sessionsToday / 5) * 30) +
      (((latest || 0) / 100) * 30)
    ).toFixed(1);

    /* 🟢 5. Motivational Message */
    let message;
    if (improvement > 0) message = `🎉 You improved by ${improvement} points! Keep it up!`;
    else if (improvement < 0) message = `Keep going! You'll do better next time 💪`;
    else message = `Let's study more and take another quiz to track progress 🚀`;

    /* 🟢 6. Save to "progress" collection (uses userId) */
    await db.collection("progress").doc(`${userId}_${today}`).set({
      userId: userId,
      createdAt: admin.firestore.Timestamp.now(),
      date: today,
      percent: Number(progressPercent),
    }, { merge: true });

    /* ✅ Return today’s summary */
    return res.json({
      ok: true,
      date: today,
      completedTasks,
      totalTasks,
      sessionsToday,
      improvement,
      progressPercent,
      message,
    });

  } catch (err) {
    console.error("🔥 getProgress err:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};


/**
 * GET /api/progress/history
 * Returns last 7 days’ progress for Chart.js
 */
exports.getProgressHistory = async (req, res) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    // 🔴 Requires Firestore composite index:
    // Fields: userId (ASC) + createdAt (DESC)
    const snap = await db.collection("progress")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(7)
      .get();

    const data = snap.docs.map(d => ({
      date: d.data().date || "Unknown",
      percent: d.data().percent || 0,
    })).reverse();

    return res.json({ ok: true, data });
  } catch (err) {
    console.error("🔥 getProgressHistory err:", err);

    if (err.code === 9) {
      // Index missing — clear guidance
      return res.status(400).json({
        ok: false,
        error: "Firestore index missing: create index on userId + createdAt",
        link: "https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes",
      });
    }

    res.status(500).json({ ok: false, error: err.message });
  }
};
