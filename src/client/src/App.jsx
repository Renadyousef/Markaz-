import './App.css'
//here is where u render all components
//for example in the componenentes u need auth serivce below:
import {auth} from './config/firebase-config'
import LandingPage from './components/landingPage/LandingPage'
import SignUp from './components/auth/SignUp'
import SignIn from './components/auth/SignIn'
function App() {
  return <SignUp/>
}

export default App
