import { Route, Routes } from 'react-router-dom'
import './App.css'
import Auth from './pages/Auth'
import Home from './pages/Home'
import AssetUpload from './pages/AssetCenter'

function App() {

  return (
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path="/auth/:type" element={<Auth />} />
      <Route path='/asset/upload' element={<AssetUpload/>}/>
    </Routes>
  )
}

export default App
