import './index.css'
import App from './App.jsx'
import {createRoot} from 'react-dom/client'
import './config/firebase-config.js'
import 'bootstrap/dist/css/bootstrap.min.css';


createRoot(document.getElementById('root')).render(
  <App />

)
