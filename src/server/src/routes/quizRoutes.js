//this is for routing incoming requests to accept them and point them to my handelr function in controllers
const express = require("express");
const genrateQuiz=require("../controllers/quizControllers/genrateQuiz")

const router = express.Router();

//get the req by this url
router.post("/GetQuiz",genrateQuiz()); 



module.exports = router;
