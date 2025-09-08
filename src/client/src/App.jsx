import './App.css';
import { useState } from 'react';
import AuthPage from './components/auth/AuthPage';
import HomePage from './components/homePage/HomePage';

function App() {
  // check localStorage for a saved token
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  return (
    <>
      {token ? (
        <HomePage token={token} />   // user is logged in → show HomePage
      ) : (
        <AuthPage setToken={setToken} />  // user not logged in → show AuthPage
      )}
    </>
  );
}

export default App;
