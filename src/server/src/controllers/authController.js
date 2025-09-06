const { Students } = require("../config/firebase-config"); // import collection directly
const bcrypt = require("bcrypt"); //to hash passwords in DB
const jwt = require("jsonwebtoken");

// SECRET for JWT ?
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

const signup = async (req, res) => {
    //since we sent them in the request body from the front end
  const { firstName, lastName, email, password } = req.body;

  try {
    // 1.check if a user with the same email already exists
    const snapshot = await Students.where("email", "==", email).get();
    if (!snapshot.empty) return res.status(400).json({ msg: "البريد الإلكتروني مستخدم مسبقًا" }); //user already has an account

    //2. hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // add a new user document with auto-generated ID
    await Students.add({
         firstName,
          lastName, 
          email,
        password: hashedPassword
    });

    res.status(201).json({ msg: "تم إنشاء الحساب بنجاح" });
  } catch (error) {
    res.status(500).json({ msg: "فشل إنشاء الحساب", error: error.message });
  }
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. find user by email
    const snapshot = await Students.where("email", "==", email).get();
    if (snapshot.empty) return res.status(404).json({ msg: "المستخدم غير موجود" });

    const userDoc = snapshot.docs[0]; // get the first matching document
    const user = userDoc.data();

    // 2. compare passwords i DB hashed and the one user just entered
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ msg: "البريد الالكتروني او كلمة المرور غير صحيحة" });

       // 3. generate JWT
    const token = jwt.sign(
      { id: userDoc.id, email: user.email }, // payload
      JWT_SECRET, // secret
    // token expires in 1 hour:not anymore since its not security sesntive system
    );

    // 4. login successful and we send *JWT to front end
    res.status(200).json({ msg: "تم تسجيل الدخول بنجاح",token });
  } catch (error) {
    res.status(500).json({ msg: "فشل تسجيل الدخول", error: error.message });
  }
};

module.exports = { signup, login };
