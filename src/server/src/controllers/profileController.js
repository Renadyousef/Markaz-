// controllers/profileController.js
const { Students } = require("../config/firebase-config");

// GET /profile/me
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: "غير مصرّح" });
    }

    const userId = req.user.id;
    const doc = await Students.doc(userId).get();

    if (!doc.exists) {
      return res.status(404).json({ msg: "المستخدم غير موجود" });
    }

    const u = doc.data();
    return res.status(200).json({
      firstName: u.firstName || "",
      lastName:  u.lastName  || "",
      email:     u.email     || ""
    });
  } catch (error) {
    return res.status(500).json({ msg: "تعذّر جلب البيانات", error: error.message });
  }
};

// PUT /profile/me
const updateMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: "غير مصرّح" });
    }

    let { firstName, lastName } = req.body;

    if (typeof firstName !== "string" || typeof lastName !== "string") {
      return res.status(400).json({ msg: "مدخلات غير صالحة" });
    }

    const fn = firstName.trim();
    const ln = lastName.trim();

    if (fn.length < 2 || ln.length < 2) {
      return res.status(400).json({ msg: "الاسم الأول واسم العائلة يجب ألا يقلّا عن حرفين" });
    }

    await Students.doc(req.user.id).update({ firstName: fn, lastName: ln });

    return res.status(200).json({ msg: "تم التحديث بنجاح" });
  } catch (error) {
    return res.status(500).json({ msg: "تعذّر تحديث البيانات", error: error.message });
  }
};

module.exports = { getMe, updateMe };
