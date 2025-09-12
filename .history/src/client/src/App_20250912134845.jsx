import './App.css';
import { useState } from 'react';


import SignIn from './components/auth/SignIn';
import HomePage from './components/homePage/HomePage';

// ✅ مكونات الإطار
import Header from './components/Header_Footer/Header';
import Sidebar from './components/Header_Footer/Sidebar';
import Footer from './components/Header_Footer/Footer';

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [open, setOpen] = useState(false);   // للتحكم بالسايدبار
  const [active, setActive] = useState("home"); // الصفحة الحالية

  return token ? (
    <>
      {/* هيدر ثابت */}
      <Header onMenuClick={() => setOpen(!open)} />

      {/* صفحة مع سايدبار + محتوى */}
      <div className="appShell">
        <Sidebar open={open} active={active} onSelect={setActive} />
        <main className="appContent">
          <HomePage token={token} />
        </main>
      </div>

      {/* فوتر */}
      <Footer />
    </>
  ) : (
    <SignIn setToken={setToken} />
  );
}

export default App;
