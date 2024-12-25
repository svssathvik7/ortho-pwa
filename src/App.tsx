import { Route, Routes } from 'react-router-dom'
import './App.css'
import Navbar from './components/navbar'
import Auth from './pages/Auth'

function App() {

  return (
    <Routes>
      {/* <Route path='/' element={<Home/>}/> */}
      <Route path="/auth" element={<Auth/>}/>
    </Routes>
  )
}

export default App
