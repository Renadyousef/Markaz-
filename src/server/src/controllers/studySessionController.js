const {StudySession} = require("../config/firebase-config");

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

module.exports = { createSession, getMySessions };