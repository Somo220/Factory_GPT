/**
 * App.jsx — Factory-GPT main shell
 * Integrates: DashboardGen, VisionAI, PPTMaker (embedded iframe)
 * New additions vs original:
 *   • Settings drawer (OpenRouter key + Local Processing / Ollama toggle)
 *   • Module routing via state (no router needed)
 *   • ?view=showcase support forwarded to DashboardGen
 *   • PPT Maker embedded via iframe with postMessage bridge
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Layers, ArrowRight, Loader2, FileText,
  Paperclip, Sparkles, Factory, Mic, MicOff, X, Cpu as ChipIcon,
  User, Mail, CreditCard, LogIn, Layout, Aperture, Settings,
  Key, Cpu, ToggleLeft, ToggleRight, ExternalLink
} from 'lucide-react';

import DashboardGen from './components/DashboardGen';
import VisionAI     from './components/VisionAI';
import PPTMaker     from './components/PPTMaker';

/* ── Keep all original sub-components (NokiaPulseField, LoginPage, etc.) ──── */

const NokiaPulseField = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const COUNT = Math.floor((w * h) / 20000);
    const DIST  = 160;
    const nodes = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.5 + 1, pulse: false, prog: 0,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      nodes.forEach((n, i) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        if (!n.pulse && Math.random() < 0.001) { n.pulse = true; n.prog = 0; }
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2); ctx.fill();
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = n.x - b.x, dy = n.y - b.y, d2 = dx*dx + dy*dy;
          if (d2 < DIST * DIST) {
            const op = 1 - Math.sqrt(d2) / DIST;
            ctx.strokeStyle = `rgba(255,255,255,${op * 0.1})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            if (n.pulse) {
              const tx = n.x + (b.x - n.x) * n.prog, ty = n.y + (b.y - n.y) * n.prog;
              ctx.beginPath(); ctx.fillStyle = '#fff';
              ctx.arc(tx, ty, 2, 0, Math.PI * 2); ctx.fill();
            }
          }
        }
        if (n.pulse) { n.prog += 0.015; if (n.prog >= 1) { n.pulse = false; n.prog = 0; } }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-40" />;
};

const LoginPage = ({ onLogin }) => {
  const [form, setForm] = useState({ name: '', email: '', employeeId: '' });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.employeeId) return;
    setBusy(true);
    setTimeout(() => { onLogin(form); setBusy(false); }, 700);
  };
  const field = (label, icon, key, type = 'text', placeholder = '') => (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-4">{label}</label>
      <div className="relative group">
        {React.createElement(icon, { size: 18, className: 'absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1988E1] transition-colors' })}
        <input required type={type} placeholder={placeholder} value={form[key]}
          onChange={e => set(key, e.target.value)}
          className="w-full bg-white/60 border border-white rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#1988E1] focus:ring-4 focus:ring-[#1988E1]/10 transition-all placeholder:text-slate-400"
        />
      </div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-6">
      <div className="relative w-full max-w-md bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white shadow-2xl p-10 animate-in zoom-in-95 fade-in duration-700">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg mb-4 border border-slate-700">
            <Factory size={28} className="text-[#1988E1]" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">System Access</h2>
          <p className="text-[10px] font-mono text-slate-900 uppercase tracking-[0.2em] mt-2 font-bold">Enter credentials to proceed</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          {field('Full Name', User, 'name', 'text', 'John Doe')}
          {field('Email Address', Mail, 'email', 'email', 'john@factorygpt.ai')}
          {field('Employee ID', CreditCard, 'employeeId', 'text', 'EMP-8821')}
          <div className="flex justify-center w-full mt-8 h-[60px]">
            <button disabled={busy}
              className={`relative bg-[#1988E1] text-white font-bold shadow-xl shadow-[#1988E1]/20 transition-all duration-500 flex items-center justify-center overflow-hidden ${busy ? 'w-[60px] h-[60px] rounded-full scale-90' : 'w-full h-full rounded-[2rem] hover:opacity-90'}`}>
              <div className={`flex items-center gap-3 transition-all duration-300 ${busy ? 'opacity-0 scale-50' : 'opacity-100'}`}>
                <LogIn size={20} /><span>Login</span>
              </div>
              {busy && <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={24} className="animate-spin" /></div>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Settings drawer ─────────────────────────────────────────────────────── */
const SettingsDrawer = ({ open, onClose, config, setConfig }) => (
  <div className={`fixed right-0 top-0 h-full z-50 transition-all duration-500 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
    <div className="h-full w-80 bg-white/80 backdrop-blur-3xl border-l border-white shadow-2xl flex flex-col p-6 gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Settings</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={16} /></button>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Key size={11} /> OpenRouter API Key
        </label>
        <input
          type="password"
          placeholder="sk-or-..."
          value={config.apiKey}
          onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs font-mono text-slate-700 focus:outline-none focus:border-[#1988E1] transition-all"
        />
        <p className="text-[9px] text-slate-400">Required for AI features. Get yours at openrouter.ai</p>
      </div>

      {/* API Base */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Cpu size={11} /> Backend URL
        </label>
        <input
          type="text"
          placeholder="http://localhost:8000"
          value={config.apiBase}
          onChange={e => setConfig(c => ({ ...c, apiBase: e.target.value }))}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs font-mono text-slate-700 focus:outline-none focus:border-[#1988E1] transition-all"
        />
      </div>

      {/* Local Processing toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-700">Local Processing</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Route AI calls to local Ollama instead of OpenRouter</p>
        </div>
        <button
          onClick={() => setConfig(c => ({ ...c, localMode: !c.localMode }))}
          className={`shrink-0 transition-colors ${config.localMode ? 'text-[#1988E1]' : 'text-slate-300'}`}
        >
          {config.localMode ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      </div>

      {config.localMode && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-[10px] text-[#1988E1] font-medium">
          Set <code>LOCAL_OLLAMA=1</code> and <code>OLLAMA_URL</code> in your backend environment to activate local routing.
        </div>
      )}

      {/* PPT Maker iframe origin */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <FileText size={11} /> PPT Maker Dev URL
        </label>
        <input
          type="text"
          placeholder="http://localhost:5174"
          value={config.pptUrl}
          onChange={e => setConfig(c => ({ ...c, pptUrl: e.target.value }))}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs font-mono text-slate-700 focus:outline-none focus:border-[#1988E1] transition-all"
        />
        <p className="text-[9px] text-slate-400">
          The Vite dev server URL for your PPT Maker project.<br/>
          Also set <code className="bg-slate-100 px-1 rounded">VITE_PPT_MAKER_URL</code> in Factory-GPT's <code className="bg-slate-100 px-1 rounded">.env</code>.
        </p>
      </div>

      <div className="mt-auto text-[9px] text-slate-300 text-center font-mono">factory-gpt v1.0 · powered by Nokia</div>
    </div>
  </div>
);

/* ── Nav item ─────────────────────────────────────────────────────────────── */
const NavItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick}
    className={`relative flex items-center h-12 w-12 group-hover:w-full rounded-2xl transition-all duration-300 overflow-hidden ${active ? 'bg-white text-[#1988E1] shadow-lg shadow-slate-200/50' : 'text-slate-500 hover:bg-slate-50/50'}`}>
    <div className="w-12 shrink-0 flex items-center justify-center">{icon}</div>
    <span className="font-bold text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pr-4">{label}</span>
    {active && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#1988E1]" />}
  </button>
);

/* ── Splash ───────────────────────────────────────────────────────────────── */
const Splash = ({ progress }) => (
  <div className="fixed inset-0 z-[100] bg-gradient-to-br from-[#1988E1] via-[#158ea1] to-[#10b981] flex flex-col items-center justify-center p-6 overflow-hidden">
    <NokiaPulseField />
    <div className="relative z-10 flex flex-col items-center text-center">
      <div className="relative w-32 h-32 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/20 mb-12">
        <div className="absolute inset-0 bg-white/10 rounded-[2rem] animate-pulse" />
        <Factory size={64} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
        <div className="absolute -inset-6 border border-white/10 rounded-full animate-[spin_10s_linear_infinite]" />
      </div>
      <h1 className="text-6xl font-black text-white tracking-tighter mb-2">FACTORY <span className="opacity-60">GPT</span></h1>
      <p className="text-sm font-light text-white tracking-widest opacity-80 mb-12">powered by <span className="font-extrabold">NOKIA</span></p>
      <div className="w-64">
        <div className="flex justify-between text-[10px] font-mono font-bold text-white uppercase mb-2">
          <span>Syncing</span><span>{Math.floor(progress)}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/10">
          <div className="h-full bg-white shadow-[0_0_10px_white] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [splash, setSplash]     = useState(true);
  const [showLogin, setLogin]   = useState(false);
  const [user, setUser]         = useState(null);
  const [progress, setProgress] = useState(0);

  const [mode, setMode]         = useState('production');  // production | general | studio
  const [studioModule, setStudioModule] = useState(null);  // null | 'gen' | 'vision' | 'ppt'
  const [settingsOpen, setSettings] = useState(false);

  const [config, setConfig] = useState({
    apiKey:    localStorage.getItem('fgpt_api_key') || '',
    apiBase:   localStorage.getItem('fgpt_api_base') || 'http://localhost:8000',
    localMode: localStorage.getItem('fgpt_local') === '1',
    pptUrl:    localStorage.getItem('fgpt_ppt_url') || '/ppt-maker',
  });

  // Persist config
  useEffect(() => {
    localStorage.setItem('fgpt_api_key',  config.apiKey);
    localStorage.setItem('fgpt_api_base', config.apiBase);
    localStorage.setItem('fgpt_local',    config.localMode ? '1' : '0');
    localStorage.setItem('fgpt_ppt_url',  config.pptUrl);
  }, [config]);

  // Splash progress
  useEffect(() => {
    if (!splash) return;
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setTimeout(() => { setSplash(false); setLogin(true); }, 500); return 100; }
        return p + Math.random() * 5;
      });
    }, 50);
    return () => clearInterval(iv);
  }, [splash]);

  const handleLogin = (data) => { setUser(data); setLogin(false); };

  const handleStudioCard = (mod) => {
    setStudioModule(mod); // 'gen' | 'vision' | 'ppt'
  };

  if (splash) return <Splash progress={progress} />;
  if (showLogin) return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#1988E1] via-[#158ea1] to-[#10b981] overflow-hidden">
      <NokiaPulseField />
      <LoginPage onLogin={handleLogin} />
    </div>
  );

  const renderContent = () => {
    if (mode === 'studio') {
      if (studioModule === 'gen') {
        return <DashboardGen apiBase={config.apiBase} openrouterKey={config.apiKey} />;
      }
      if (studioModule === 'vision') {
        return <VisionAI apiBase={config.apiBase} openrouterKey={config.apiKey} />;
      }
      if (studioModule === 'ppt') {
        return <PPTMaker factoryTheme={config.apiKey ? 'corporate-blue' : 'live-blank'} />;
      }
      // Studio menu
      return (
        <div className="h-full flex flex-col items-center justify-center py-12">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#1988E1] text-[10px] font-bold uppercase tracking-widest mb-4">
              <Sparkles size={12} /> AI Studio Active
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 drop-shadow">
              Select <span className="opacity-70">Module</span>
            </h2>
            <p className="font-mono text-[10px] text-white/60 uppercase tracking-[0.2em]">Choose a generative core</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
            {[
              { mod: 'gen',    Icon: Layout,   title: 'Dashboard Gen',  desc: 'Auto-construct analytics interfaces and data visualization layers from raw streams.' },
              { mod: 'vision', Icon: Aperture, title: 'Vision AI',      desc: 'Advanced OCR, defect detection, and real-time visual anomaly processing via LLM.' },
              { mod: 'ppt',    Icon: FileText,  title: 'PPT Maker',     desc: 'Automated slide deck compilation, layout structuring, and executive summary generation.' },
            ].map(({ mod, Icon, title, desc, external }) => (
              <button key={mod} onClick={() => handleStudioCard(mod)}
                className="group relative bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl text-left overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[#1988E1]/20">
                <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-10 bg-[#1988E1]" />
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1988E1] flex items-center justify-center mb-6 transition-all group-hover:scale-110">
                  <Icon size={28} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-[#1988E1] transition-colors">{title}</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Production / General mode — original chat UI
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-20 px-10">
        <ChipIcon size={48} className="text-[#1988E1] mb-6 animate-pulse opacity-40" />
        {mode === 'general' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h3 className="text-2xl font-black text-white tracking-tight leading-tight drop-shadow">
              Hey! Welcome to <span className="opacity-70">FACTORY GPT</span>.
            </h3>
            <p className="text-lg font-bold text-white/70 mt-2">
              I'm your <span className="text-white">GENERAL AGENT</span>. How can I help?
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h3 className="text-2xl font-black text-white tracking-tight leading-tight drop-shadow">
              Hey! Welcome to <span className="opacity-70">Production GPT</span>
            </h3>
            <p className="text-lg font-bold text-white/70 mt-2">
              Ask me anything related to our company's <span className="text-white">production</span>
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-[#1988E1] via-[#158ea1] to-[#10b981] text-slate-900 font-sans overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <NokiaPulseField />

      {/* Settings overlay */}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettings(false)} config={config} setConfig={setConfig} />
      {settingsOpen && <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" onClick={() => setSettings(false)} />}

      <div className="relative z-10 flex w-full max-w-[1920px] mx-auto p-4 md:p-6 gap-6 h-full animate-in fade-in duration-1000">

        {/* SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-20 hover:w-64 transition-all duration-500 bg-white/40 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-2xl py-8 px-4 group z-40">
          <div className="flex items-center gap-4 mb-12 px-2 overflow-hidden">
            <div className="w-10 h-10 shrink-0 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-700 relative">
              <Factory size={20} className="text-[#1988E1]" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#1988E1] rounded-full shadow-[0_0_5px_#1988E1] animate-pulse" />
            </div>
            <span className="font-black text-xl tracking-tighter whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-slate-800">
              FACTORY <span className="text-[#1988E1]">GPT</span>
            </span>
          </div>

          <nav className="flex flex-col gap-4">
            <NavItem active={mode === 'production'} onClick={() => { setMode('production'); setStudioModule(null); }} icon={<Activity size={22} />} label="Production" />
            <NavItem active={mode === 'general'}    onClick={() => { setMode('general');    setStudioModule(null); }} icon={<Layers size={22} />} label="General Agent" />
            <NavItem active={mode === 'studio'}     onClick={() => { setMode('studio');     setStudioModule(null); }} icon={<Sparkles size={22} />} label="AI Studio" />
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-200 flex flex-col gap-3">
            {/* Settings button */}
            <button onClick={() => setSettings(true)}
              className="flex items-center h-12 w-12 group-hover:w-full rounded-2xl overflow-hidden text-slate-500 hover:bg-slate-50/50 hover:text-[#1988E1] transition-all duration-300">
              <div className="w-12 shrink-0 flex items-center justify-center"><Settings size={20} /></div>
              <span className="font-bold text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pr-4">Settings</span>
            </button>
            {/* User */}
            <div className="flex items-center gap-4 px-2 overflow-hidden py-2">
              <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-[#1988E1] to-[#10b981] border-2 border-white shadow-md flex items-center justify-center text-white font-black uppercase">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs font-bold whitespace-nowrap text-slate-800 truncate max-w-[140px]">{user?.name || 'Admin'}</span>
                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-tighter">{user?.employeeId || 'Level 4'}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 flex flex-col h-full min-w-0">
          <div className="flex-1 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] border border-white shadow-2xl relative overflow-hidden flex flex-col">

            {/* Back button when inside a studio module */}
            {mode === 'studio' && studioModule && (
              <div className="px-6 pt-5 shrink-0">
                <button onClick={() => setStudioModule(null)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1988E1] transition-colors">
                  ← Back to Studio
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8">
              <div className="h-full">
                {renderContent()}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}