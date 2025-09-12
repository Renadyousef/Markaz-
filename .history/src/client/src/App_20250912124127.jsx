import './App.css';
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

export default App;
