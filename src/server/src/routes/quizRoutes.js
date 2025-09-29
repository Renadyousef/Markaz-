//this is for routing incoming requests to accept them and point them to my handelr function in controllers
const express = require("express");
const {generateQuiz} =require("../controllers/quizControllers/genrateQuiz")
const {verifyToken}=require("../middleware/authMiddleware")

const router = express.Router();

//get the req by this url
router.post("/GetQuiz",verifyToken,generateQuiz); 



module.exports = router;
