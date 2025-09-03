const admin = require('firebase-admin');
const path = require('path');

// Load .env from server folder
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Load the service account JSON
const serviceAccountPath = path.resolve(__dirname, 'serviceAccount.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("firebase Admin initialized!");

// Firestore collections
const DB = admin.firestore();
const Students = DB.collection('students');
const Task = DB.collection('task');
const StudyPlans = DB.collection('study_plans');
const FlashCards = DB.collection('flash_cards');
const Quizzes = DB.collection('quizzes');
const Questions = DB.collection('questions');
const FeedBack = DB.collection('feed_back');
const QuizResult = DB.collection('quiz_result');
const StudySession = DB.collection('study_session');

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
