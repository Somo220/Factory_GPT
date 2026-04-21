/**
 * PPTMaker.jsx
 * Embeds the standalone AI PPT Maker app inside Factory-GPT via postMessage bridge.
 *
 * Setup requirements:
 *   1. Run the PPT Maker dev server (npm run dev inside ai-ppt-maker/).
 *      By default it runs on http://localhost:5173 (Vite) + http://localhost:8788 (Express).
 *   2. Set the PPT_MAKER_ORIGIN env var or update PPT_ORIGIN below to match your PPT
 *      Maker's Vite dev URL (default: http://localhost:5174 if factory-gpt already uses 5173).
 *   3. The iframe uses sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
 *      which is sufficient for the PPT app to work fully.
 *
 * Communication (postMessage):
 *   Factory-GPT  →  PPT Maker :  { type: 'FGPT_THEME', theme: 'clean-dark' | ... }
 *   PPT Maker    →  Factory-GPT: { type: 'PPT_READY' }   (on load)
 *                                { type: 'PPT_NAVIGATE', view: 'home' | 'editor' }
 */

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, RefreshCw, Maximize2, Minimize2, AlertCircle } from 'lucide-react';

// ── Change this to wherever your PPT Maker Vite server is running ─────────────
const PPT_ORIGIN = import.meta.env.VITE_PPT_MAKER_URL || 'http://localhost:5174';

export default function PPTMaker({ factoryTheme = 'live-blank' }) {
  const iframeRef = useRef(null);
  const [status, setStatus]       = useState('loading'); // loading | ready | error
  const [isFullscreen, setFullscreen] = useState(false);
  const [loadError, setLoadError]  = useState('');

  // ── Tell the PPT app what theme Factory-GPT is using ──────────────────────
  useEffect(() => {
    if (status !== 'ready') return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'FGPT_THEME', theme: factoryTheme },
      PPT_ORIGIN,
    );
  }, [factoryTheme, status]);

  // ── Listen for messages from the PPT app ──────────────────────────────────
  useEffect(() => {
    const handler = (event) => {
      if (event.origin !== PPT_ORIGIN) return;
      const { type } = event.data || {};
      if (type === 'PPT_READY') setStatus('ready');
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const reload = () => {
    setStatus('loading');
    setLoadError('');
    if (iframeRef.current) iframeRef.current.src = PPT_ORIGIN;
  };

  return (
    <div
      className={`flex flex-col h-full w-full transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 p-0' : ''
      }`}
    >
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-white/60 backdrop-blur-xl border-b border-white/80 rounded-t-3xl shrink-0">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">
            PPT <span className="text-[#1988E1]">Maker</span>
          </h2>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            AI-Powered Slide Generator
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
              status === 'ready'
                ? 'bg-green-50 text-green-600 border-green-200'
                : status === 'error'
                ? 'bg-red-50 text-red-500 border-red-200'
                : 'bg-blue-50 text-[#1988E1] border-blue-200 animate-pulse'
            }`}
          >
            {status === 'ready' ? '● Connected' : status === 'error' ? '● Offline' : '● Connecting…'}
          </span>

          <button
            onClick={reload}
            title="Reload PPT Maker"
            className="p-2 rounded-xl text-slate-400 hover:text-[#1988E1] hover:bg-blue-50 transition-colors"
          >
            <RefreshCw size={15} />
          </button>

          <button
            onClick={() => setFullscreen((f) => !f)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="p-2 rounded-xl text-slate-400 hover:text-[#1988E1] hover:bg-blue-50 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <a
            href={PPT_ORIGIN}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="p-2 rounded-xl text-slate-400 hover:text-[#1988E1] hover:bg-blue-50 transition-colors"
          >
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* ── Iframe container ── */}
      <div className="relative flex-1 overflow-hidden rounded-b-3xl bg-white/40">
        {/* Loading shimmer */}
        {status === 'loading' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 animate-pulse">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="13" rx="2" stroke="#1988E1" strokeWidth="1.5"/>
                <path d="M8 20h8M12 16v4" stroke="#1988E1" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">Loading PPT Maker…</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Connecting to{' '}
                <span className="text-[#1988E1]">{PPT_ORIGIN}</span>
              </p>
            </div>
            <p className="text-[10px] text-slate-400 max-w-xs text-center">
              Make sure the PPT Maker dev server is running.{' '}
              <code className="bg-slate-100 px-1 rounded text-slate-600">cd ai-ppt-maker && npm run dev</code>
            </p>
          </div>
        )}

        {/* Load error */}
        {status === 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100">
              <AlertCircle size={24} className="text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">Could not reach PPT Maker</p>
              <p className="text-xs text-slate-400 mt-1">{loadError || `Ensure the server is running at ${PPT_ORIGIN}`}</p>
            </div>
            <button
              onClick={reload}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#1988E1] text-white text-xs font-bold shadow-lg shadow-[#1988E1]/20 hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={PPT_ORIGIN}
          title="AI PPT Maker"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          className="w-full h-full border-0"
          onLoad={() => {
            // Give postMessage 800 ms to arrive; fall back to "ready" if not
            setTimeout(() => setStatus((s) => (s === 'loading' ? 'ready' : s)), 800);
          }}
          onError={() => {
            setStatus('error');
            setLoadError(`Connection refused at ${PPT_ORIGIN}`);
          }}
        />
      </div>
    </div>
  );
}