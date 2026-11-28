import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { PlatformProvider } from './v8/platform'
import { LanguageProvider } from './lib/language'
import './language-v38.css'
import './index.css'
import './editorial.css'
import './interactive.css'
import './research.css'
import './experience-v63.css'
import './dark-contrast-v70.css'
import './profile-studio-v71.css'
import './v8/platform.css'
import './v8/access81.css'
import './v8/access82.css'
import './v8/mobile83.css'
import './v8/visual84.css'
import './v8/design85.css'
import './v8/theme86.css'

// ELKIMIYA_V70_SYSTEM_THEME_BOOTSTRAP: on first visit only, respect system theme.
// Never override a manual Light/Dark choice already stored by React or Android.
let bootDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
try {
  const saved = localStorage.getItem('elk.dark');
  if (saved === null) localStorage.setItem('elk.dark', String(bootDark));
  else bootDark = saved === 'true';
} catch { /* Storage can be unavailable in private browser contexts. */ }
document.documentElement.dataset.elkTheme = bootDark ? 'dark' : 'light';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider><PlatformProvider><App /></PlatformProvider></LanguageProvider>
  </React.StrictMode>,
)

// Install the PWA shell on HTTPS production deployments only.
// Offline AI is NOT implied; the reader/flashcards use browser-local state.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => { /* optional PWA enhancement */ });
  });
}

