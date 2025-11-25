const admin = require("firebase-admin");

// safe firestore init
const isTest = process.env.NODE_ENV === "test";

// Initialize Firestore only if not in test environment 7 to 14
let db = null;
if (!isTest) {
  try {
    db = admin.firestore();
  } catch (e) {
    console.error("Firestore init failed:", e);
  }
}

//for unit tests 17
// const db = admin.firestore();


/* ================= HELPERS ================= */

function getUserId(req, res) {
  const userId = req.user?.id || req.user?.uid || req.userId;

  if (!userId) {
    res.status(401).json({ ok: false, error: "Unauthorized: Missing user ID" });
    return null;
  }
  return userId;
}

function safeDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  return new Date(value);
}

/* ================= GET /api/progress/me ================= */

exports.getProgress = async (req, res) => {
  try {
    if (!db) throw new Error("Firestore not initialized.");

    const userId = getUserId(req, res);
    if (!userId) return;

    const today = new Date().toISOString().slice(0, 10);
    const todayKey = `${userId}_${today}`;

    /* ---- Tasks ---- */
    const tasksSnap = await db
      .collection("tasks")
      .where("ownerId", "==", userId)
      .get();

    const totalTasks = tasksSnap?.size || 0;
    const completedTasks = tasksSnap?.docs?.filter(d => d.data()?.completed)?.length || 0;

    /* ---- Study Sessions ---- */
    const sessionsSnap = await db
      .collection("study_session")
      .where("student_ID", "==", userId)
      .get();

    const sessionsToday = sessionsSnap?.docs?.filter(d => {
      const created = safeDate(d.data()?.createdAt);
      if (!created) return false;
      return created.toISOString().slice(0, 10) === today;
    }).length || 0;

    /* ---- Quiz Results ---- */
    const quizSnap = await db
      .collection("quiz_result")
      .where("user_id", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(2)
      .get();

    const scores = quizSnap?.docs?.map(d => d.data()?.score || 0) || [];
    const [latest = 0, previous = 0] = scores;
    const improvement = latest - previous;

    /* ---- Progress % ---- */
    const progressPercent = (
      ((completedTasks / (totalTasks || 1)) * 40) +
      ((sessionsToday / 5) * 30) +
      ((latest / 100) * 30)
    ).toFixed(1);

    /* ---- Save Today ---- */
    await db.collection("progress").doc(todayKey).set(
      {
        userId,
        date: today,
        percent: Number(progressPercent),
        createdAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );

    return res.json({
      ok: true,
      date: today,
      completedTasks,
      totalTasks,
      sessionsToday,
      improvement,
      progressPercent,
    });

  } catch (err) {
    console.error("🔥 getProgress error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/* ================= GET /api/progress/history ================= */

exports.getProgressHistory = async (req, res) => {
  try {
    if (!db) throw new Error("Firestore not initialized.");

    const userId = getUserId(req, res);
    if (!userId) return;

    const snap = await db
      .collection("progress")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(7)
      .get();

    const data = snap.docs.map(d => ({
      date: d.data()?.date || "Unknown",
      percent: d.data()?.percent || 0,
    })).reverse();

    res.json({ ok: true, data });

  } catch (err) {
    console.error("🔥 getProgressHistory error:", err);

    if (err.code === 9) {
      return res.status(400).json({
        ok: false,
        error: "Firestore index missing: create index on userId + createdAt",
      });
    }

    res.status(500).json({ ok: false, error: err.message });
  }
};
