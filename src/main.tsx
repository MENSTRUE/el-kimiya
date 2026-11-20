import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LanguageProvider } from './lib/language'
import './language-v38.css'
import './index.css'
import './editorial.css'
import './interactive.css'
import './research.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider><App /></LanguageProvider>
  </React.StrictMode>,
)

// Install the PWA shell on HTTPS production deployments only.
// Offline AI is NOT implied; the reader/flashcards use browser-local state.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => { /* optional PWA enhancement */ });
  });
}
