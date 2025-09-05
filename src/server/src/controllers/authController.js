const { Students } = require("../config/firebase-config"); // import collection directly

const signup = async (req, res) => {
    //since we sent them in the request body from the front end
  const { firstName, lastName, email, password } = req.body;

  try {
    // check if a user with the same email already exists
    const snapshot = await Students.where("email", "==", email).get();
    if (!snapshot.empty) return res.status(400).json({ msg: "Email already in use" }); //user already has an account

    // add a new user document with auto-generated ID
    await Students.add({ firstName, lastName, email, password });

    res.status(201).json({ msg: "User created successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Signup failed", error: error.message });
  }
};

module.exports = { signup };
