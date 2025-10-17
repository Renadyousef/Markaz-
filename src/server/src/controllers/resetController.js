const { Students } = require("../config/firebase-config"); // import collection directly
const bcrypt = require("bcrypt"); //to hash passwords in DB
const jwt = require("jsonwebtoken");
// ========== FORGOT PASSWORD ==========
const forgotPassword = async (req, res) => {
  let { email } = req.body;
console.log("Forgot password called with:", email);

  try {


    const snapshot = await Students.where("email", "==", email).get();
   
    if (snapshot.empty) {
      return res.status(404).json({ msg: "البريد الإلكتروني غير موجود" });
    }

    res.status(200).json({ msg: "تم العثور على البريد الإلكتروني" });
  } catch (error) {
    res.status(500).json({ msg: "خطأ في التحقق من البريد", error: error.message });
  }
};

// ========== RESET PASSWORD ==========
const resetPassword = async (req, res) => {
  let { email, newPassword } = req.body;

  try {
  
  
    const snapshot = await Students.where("email", "==", email).get();
   if (snapshot.empty) {
     return res.status(404).json({ msg: "البريد الإلكتروني غير موجود" });
   }
  

    const userDoc = snapshot.docs[0];
    const userRef = userDoc.ref;
  
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await userRef.update({ password: hashedPassword });


    res.status(200).json({ msg: "تم تحديث كلمة المرور بنجاح" });
  } catch (error) {
    res.status(500).json({ msg: "فشل تحديث كلمة المرور", error: error.message });
  }
};

module.exports = { forgotPassword, resetPassword };




