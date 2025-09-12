/*import './App.css';
import { useState } from 'react'; // <--- added
import LandingPage from './components/landingPage/LandingPage';
import SignUp from './components/auth/SignUp';
import SignIn from './components/auth/SignIn';
import HomePage from './components/homePage/HomePage'; // welcome page




function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  return token ? (
    <HomePage token={token} />  // show home if logged in
  ) : (
    <SignIn setToken={setToken} /> // show login if not
  );
}

export default App;*/

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import LandingPage from "./components/landingPage/LandingPage";
import SignUp from "./components/auth/SignUp";
import SignIn from "./components/auth/SignIn";
import HomePage from "./components/homePage/HomePage";
import ResetPassword from "./components/resetPassword/resetPassword"; 


export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing is the default */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth pages */}
        <Route path="/signin" element={<SignIn setToken={setToken} />} />
        <Route path="/signup" element={<SignUp />} />
         <Route path="/forgot-password" element={<ResetPassword />} />

        {/* Protected home */}
        <Route
          path="/home"
          element={token ? <HomePage token={token} /> : <Navigate to="/signin" replace />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

