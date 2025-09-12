import {initializeApp} from 'firebase/app'
import { getAuth } from "firebase/auth";

//all services intlized here and to use them we import them in files
//services used firebase Auth
const firebaseConfig = {
  apiKey: "AIzaSyDG06ESAVYfYs5CnP35yynJef3Up5kfCck",
  authDomain: "markaz-36153.firebaseapp.com",
  projectId: "markaz-36153",
  storageBucket: "markaz-36153.firebasestorage.app",
  messagingSenderId: "938288287971",
  appId: "1:938288287971:web:2ba95329ecaaddde6a35d6",
  measurementId: "G-8BGF03TPVJ"
};

// Initialize Firebase
//app is our point of connection to DB
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


export{app,auth};