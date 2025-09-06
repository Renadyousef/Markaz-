const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log("Authorization header:", authHeader); // DEBUG

  if (!authHeader) {
    console.log("No token provided");
    return res.status(401).json({ msg: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log("Token decoded successfully:", decoded); // DEBUG
    next();
  } catch (err) {
    console.log("Token verification failed:", err.message); // DEBUG

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Unauthorized: Token expired" });
    }

    return res.status(403).json({ msg: "Forbidden: Invalid token" });
  }
}

module.exports = { verifyToken };
