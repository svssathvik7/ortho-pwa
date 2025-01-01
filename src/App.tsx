import { Route, Routes } from 'react-router-dom'
import './App.css'
import Auth from './pages/Auth'
import Home from './pages/Home'
import AssetUpload from './pages/AssetCenter'
import AssetResults from './components/assetResults'
import AssetDisplay from './pages/AssetResults'
import Account from './pages/Account'

function App() {

  return (
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path="/auth/:type" element={<Auth />} />
      <Route path='/assets/:type' element={<AssetUpload/>}/>
      <Route path='/asset' element={<AssetDisplay/>}/>
      <Route path='/account' element={<Account/>}/>
    </Routes>
  )
}

export default App
