import { Route, Routes } from 'react-router-dom'
import './App.css'
import Auth from './pages/Auth'
import Home from './pages/Home'

function App() {

  return (
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path="/auth/:type" element={<Auth />} />
    </Routes>
  )
}

export default App
