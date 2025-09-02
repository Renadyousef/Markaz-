const admin=require('firebase-admin');

const serviceAccount=require('./serviceAccount.json');//?

admin.initializeApp({
    credential:admin.credential.cert(serviceAccount)
})

console.log("firebase Admin initialized!")

//1.get a DB instance connection
const DB=admin.firestore()

//2 create colloctions
const Students=DB.collection('students')
const Task=DB.collection('task')
const StudyPlans=DB.collection('study_plans')
const FlashCards=DB.collection('flash_cards')
const Quizzes=DB.collection('quizzes')
const Questions=DB.collection('questions')
const FeedBack=DB.collection('feed_back')
const QuizResult=DB.collection('quiz_result')
const StudySession=DB.collection('study_session')


module.exports = {
    Students,
    Task,
    StudyPlans,
    FlashCards,
    Quizzes,
    Questions,
    FeedBack,
    QuizResult,
    StudySession
};