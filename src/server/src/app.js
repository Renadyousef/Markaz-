const express = require("express");
const cors = require("cors"); //to allow request incoming between react and express
const authRoutes = require("./routes/authRoutes");




const app = express();

// Middlewares to parse json incoming in requests
app.use(cors());
app.use(express.json());

// Note:use Routes you have defined in routes
app.use("/auth", authRoutes);

module.exports = app;
