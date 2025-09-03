const express=require('express');

const {
  Students,
  Task,
  StudyPlans,
  FlashCards,
  Quizzes,
  Questions,
  FeedBack,
  QuizResult,
  StudySession
} = require('./config/firebase-config'); // your exported collections

const app=express()
const PORT=5000;



//app routes
app.post('/',(req,res)=>{
    res.send("welcome abroed")
})



app.listen(PORT,()=>{console.log('server running on port 5000')})