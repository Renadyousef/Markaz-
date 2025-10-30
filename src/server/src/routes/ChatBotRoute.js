
const express = require("express");
const {ChatBot} = require("../controllers/ChatBotController");

const router = express.Router();

// POST / setting the route to recive requests from the front end
router.post("/chat-bot",ChatBot); 


module.exports = router;
