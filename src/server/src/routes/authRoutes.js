//this is for routing incoming requests to accept them and point them to my handelr function in controllers
const express = require("express");
const { signup,login} = require("../controllers/authController");

const router = express.Router();

// POST /auth/signup setting the route to recive requests from the front end
router.post("/signup", signup); // React axios.post(.../signup) passing function from controllers

// POST /auth/login
router.post("/login", login);

module.exports = router;
