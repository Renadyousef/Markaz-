import './App.css';
import { useState } from 'react'; // <--- added
import LandingPage from './components/landingPage/LandingPage';
import SignUp from './components/auth/SignUp';
import SignIn from './components/auth/SignIn';
import HomePage from './components/homePage/HomePage'; // welcome page
import AuthPage from './components/auth/AuthPage';

//render ur page if theres a token and in goTo set to ur page name

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [page, setPage] = useState("landing"); // "landing", "auth", "home"
  const [authTab, setAuthTab] = useState("signin"); // which tab in AuthPage

  const goTo = (p, tab = "signin") => {
    if (p === "auth") {
      setPage("auth");
      setAuthTab(tab);
    } else {
      setPage(p);
    }
  };

  if (token) return <HomePage token={token} />; // always show Home if logged in

  return (
    <>
      {page === "landing" && <LandingPage goTo={goTo} />}
      {page === "auth" && <AuthPage setToken={setToken} initialTab={authTab} />}
    </>
  );
}