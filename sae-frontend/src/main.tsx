import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './services/offlineService'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Regista o Service Worker para suporte offline (PDFs em cache).
// Não bloqueia o render — só corre depois de o React montar.
registerServiceWorker();
