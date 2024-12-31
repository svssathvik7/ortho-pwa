import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {BrowserRouter} from "react-router-dom";
import App from './App.tsx'
import { Toaster } from './components/ui/toaster.tsx';
import { registerServiceWorker } from './utils/serviceWorkerRegistration.ts';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <App />
    <Toaster/>
    </BrowserRouter>
  </StrictMode>,
)

registerServiceWorker();
