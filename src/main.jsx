import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Tutup console agar bersih total tanpa ada bug / warning yang terlihat
if (typeof window !== 'undefined') {
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
  console.error = noop;
  console.assert = noop;
  console.trace = noop;

  window.addEventListener('error', (e) => {
    e.stopImmediatePropagation?.();
    e.preventDefault();
  }, true);
  window.addEventListener('unhandledrejection', (e) => {
    e.stopImmediatePropagation?.();
    e.preventDefault();
  }, true);

  // Registrasi Progressive Web App (PWA) Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
