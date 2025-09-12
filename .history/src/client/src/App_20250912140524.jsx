import './App.css';
import { useState } from 'react';

// المكونات
import Header from './components/Header_Footer/Header';
import Sidebar from './components/Header_Footer/Sidebar';
import Footer from './components/Header_Footer/Footer';
import HomePage from './components/homePage/HomePage';
import SignIn from './components/auth/SignIn';

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [open, setOpen] = useState(false); // للتحكم في السايدبار

  return token ? (
    <div className="app-shell">
      {/* الهيدر */}
      <Header onMenuClick={() => setOpen(!open)} />

      <div className="app-body">
        {/* السايدبار */}
        <Sidebar open={open} onClose={() => setOpen(false)} />

        {/* المحتوى الأساسي (HomePage) */}
        <main className="content">
          <HomePage token={token} />
        </main>
      </div>

      {/* الفوتر */}
      <Footer />
    </div>
  ) : (
    <SignIn setToken={setToken} />
  );
}

export default App;
