const express = require("express");
const cors = require("cors"); //to allow request incoming between react and express
const authRoutes = require("./routes/authRoutes");

const { verifyToken } = require("./middleware/authMiddleware");

const userRoutes = require("./routes/userRoutes");




const app = express();

// Middlewares to parse json incoming in requests
app.use(cors());
app.use(express.json());

// Note:use Routes you have defined in routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes); //just to try if session works to fetch current user name


module.exports = app;
