//this is for routing incoming requests to accept them and point them to my handelr function in controllers
const express = require("express");
const {generateQuiz} =require("../controllers/quizControllers/genrateQuiz")
const {verifyToken}=require("../middleware/authMiddleware")
const {save_quiz_result}=require('../controllers/quizControllers/saveQuizResults')
const {get_quiz_results}=require('../controllers/quizControllers/viewQuizResults')

const router = express.Router();

//get the req by this url
router.post("/GetQuiz",verifyToken,generateQuiz); 
//save quiz route
router.post('/result',verifyToken,save_quiz_result)
//view quizzes results page
router.get('/view_results',verifyToken,save_quiz_result)

module.exports = router;
