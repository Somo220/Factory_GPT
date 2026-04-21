/**
 * main.jsx — AI PPT Maker entry point
 * PATCHED: adds postMessage bridge so Factory-GPT knows when the app is ready.
 *
 * Add this file to your ai-ppt-maker/src/ directory,
 * replacing the existing main.jsx.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// ── PostMessage bridge: notify parent (Factory-GPT) that PPT Maker is ready ──
window.addEventListener('load', () => {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'PPT_READY' }, '*');
  }
});

// ── Listen for theme changes from Factory-GPT ─────────────────────────────────
// If you want to react to theme changes, implement a custom event or context here.
window.addEventListener('message', (event) => {
  if (event.data?.type === 'FGPT_THEME') {
    // Optional: apply a CSS class or data attribute to react to Factory-GPT theme
    document.documentElement.setAttribute('data-fgpt-theme', event.data.theme);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);