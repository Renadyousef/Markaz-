const { StudySession } = require("../config/firebase-config");

// إنشاء جلسة
const createSession = async (req, res) => {
  try {
    const { sessionTitle, totalStudyTime, totalBreakTime, status } = req.body;

    if (!req.user) return res.status(401).json({ msg: "غير مصرّح" });
    if (!sessionTitle) return res.status(400).json({ msg: "اسم الجلسة مطلوب" });

    const newSession = {
      student_ID: req.user.id, // من التوكن
      sessionTitle,
      totalStudyTime: totalStudyTime || 0,
      totalBreakTime: totalBreakTime || 0,
      status: status || "in-progress",
      createdAt: new Date().toISOString(),
    };

  const docRef = await StudySession.add(newSession);

    return res.status(201).json({ id: docRef.id, ...newSession });
  } catch (err) {
    return res.status(500).json({ msg: "خطأ في إنشاء الجلسة", error: err.message });
  }
};

// جلب الجلسات
const getMySessions = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ msg: "غير مصرّح" });

    const snap = await StudySession.where("student_ID", "==", req.user.id).get();
    if (snap.empty) return res.status(200).json([]);

    const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json(sessions);
  } catch (err) {
    return res.status(500).json({ msg: "خطأ في جلب الجلسات", error: err.message });
  }
};

// تحديث حالة الجلسة
const updateSessionStatus = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ msg: "غير مصرّح" });

    const { id } = req.params;
    const { status } = req.body || {};

    if (!id) return res.status(400).json({ msg: "sessionId مطلوب" });
    if (!status) return res.status(400).json({ msg: "status مطلوب" });

    const docRef = StudySession.doc(id);
    const snap = await docRef.get();

    if (!snap.exists) return res.status(404).json({ msg: "الجلسة غير موجودة" });
    if (snap.data().student_ID !== req.user.id) {
      return res.status(403).json({ msg: "غير مصرّح بتحديث هذه الجلسة" });
    }

    const now = new Date().toISOString();
    const updates = { status, updatedAt: now };
    if (status === "completed") updates.finishedAt = now;

    await docRef.update(updates);

    return res.status(200).json({ id, ...updates });
  } catch (err) {
    return res.status(500).json({ msg: "خطأ في تحديث الجلسة", error: err.message });
  }
};

module.exports = { createSession, getMySessions, updateSessionStatus };
