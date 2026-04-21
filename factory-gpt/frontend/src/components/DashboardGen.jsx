import React, { useState, useCallback, useRef } from 'react';
import {
  UploadCloud, BarChart2, AlertCircle,
  Loader2, Sparkles, Eye, EyeOff, Database, X, RefreshCw
} from 'lucide-react';
import {
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import ChatInterface from './ChatInterface';

// ─── Colour palettes ──────────────────────────────────────────────────────────
const PALETTES = {
  default: ['#1988E1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
  blue:    ['#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
  green:   ['#14532d', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'],
  dark:    ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9'],
};

// ─── Glassmorphism card ───────────────────────────────────────────────────────
const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-xl ${className}`}>
    {children}
  </div>
);

// ─── KPI tile ────────────────────────────────────────────────────────────────
const KpiTile = ({ label, value, sub }) => (
  <div className="bg-white/80 rounded-2xl border border-white p-4 shadow-md flex flex-col gap-1">
    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    <span className="text-2xl font-black text-slate-800 leading-none">{value}</span>
    {sub && <span className="text-[9px] text-slate-400 font-medium">{sub}</span>}
  </div>
);

// ─── Chart renderer ──────────────────────────────────────────────────────────
const ChartBlock = ({ config, palette, onRemove }) => {
  const colors = PALETTES[palette] || PALETTES.default;

  // Safety guard — if config or data is broken, show error tile
  if (!config || !config.title || !Array.isArray(config.data) || config.data.length === 0) {
    return (
      <GlassCard className="p-5 relative">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-black text-slate-400">Invalid chart data</h4>
          <button onClick={onRemove} className="p-1.5 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-slate-400 text-center py-8">Could not render this chart.</p>
      </GlassCard>
    );
  }

  const renderChart = () => {
    switch (config.type) {
      case 'pie':
      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <RechartsPie>
              <Pie
                data={config.data}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                innerRadius={config.type === 'donut' ? 60 : 0}
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {config.data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        );

      case 'bar':
      case 'top-n-bar':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={config.data} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-35} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {config.data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return <p className="text-xs text-slate-400 text-center py-8">Unknown chart type: {config.type}</p>;
    }
  };

  return (
    <GlassCard className="p-5 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-black text-slate-700">{config.title}</h4>
        <button onClick={onRemove} className="p-1.5 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
          <X size={14} />
        </button>
      </div>
      {renderChart()}
    </GlassCard>
  );
};

// ─── Upload drop zone ─────────────────────────────────────────────────────────
const DropZone = ({ onFile, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-300 py-16 px-8 ${
        isDragging ? 'border-[#1988E1] bg-blue-50/50 scale-[1.02]' : 'border-slate-200 hover:border-[#1988E1]/50 hover:bg-blue-50/20'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={e => e.target.files[0] && onFile(e.target.files[0])}
      />
      {isLoading ? (
        <Loader2 size={40} className="text-[#1988E1] animate-spin" />
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
          <UploadCloud size={32} className="text-[#1988E1]" />
        </div>
      )}
      <div className="text-center">
        <p className="text-sm font-bold text-slate-700">Drop CSV / Excel here</p>
        <p className="text-xs text-slate-400 mt-1">or click to browse</p>
      </div>
    </div>
  );
};

// ─── Main DashboardGen component ──────────────────────────────────────────────
export default function DashboardGen({ apiBase = 'http://localhost:8000', openrouterKey = '' }) {
  const [meta, setMeta]         = useState(null);
  const [charts, setCharts]     = useState([]);   // always starts empty — no sessionStorage for charts
  const [palette, setPalette]   = useState('default');
  const [chatMsgs, setChatMsgs] = useState([]);
  const [isBusy, setIsBusy]     = useState(false);
  const [error, setError]       = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [showcaseMode, setShowcaseMode] = useState(
    () => new URLSearchParams(window.location.search).get('view') === 'showcase'
  );

  // ── Restore metadata from session (NOT charts — avoids corrupt state) ──────
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem('dashboardMeta');
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.rows && data.column_names) {
          setMeta(data);
          setChatMsgs([{
            id: 'sys-restore',
            role: 'assistant',
            content: `**Session restored.** Dataset: ${data.rows} rows × ${data.columns} columns.\nColumns: ${data.column_names.join(', ')}\n\nAsk me to generate a chart!`
          }]);
        }
      }
    } catch {
      sessionStorage.removeItem('dashboardMeta');
    }
  }, []);

  // ── File upload → metadata ────────────────────────────────────────────────
  const handleFile = async (file) => {
    setUploadBusy(true);
    setError('');
    setCharts([]);
    setChatMsgs([]);
    setMeta(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${apiBase}/dashboard/upload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMeta(data);
      sessionStorage.setItem('dashboardMeta', JSON.stringify(data));
      setChatMsgs([{
        id: 'sys-0',
        role: 'assistant',
        content: `**Dataset loaded!**\n${data.rows} rows × ${data.columns} columns.\n\nColumns: ${data.column_names.join(', ')}\n\nAsk me to generate a chart — e.g. "Pie chart of Sales by Region"`
      }]);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploadBusy(false);
    }
  };

  // ── NL → chart via backend ────────────────────────────────────────────────
  const handleChat = async (text) => {
    if (!meta) {
      setChatMsgs(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'user', content: text },
        { id: Date.now().toString() + 'e', role: 'assistant', content: 'Please upload a dataset first.' }
      ]);
      return;
    }

    setChatMsgs(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text }]);
    setIsBusy(true);
    setError('');

    // Check for palette command
    const paletteMatch = text.toLowerCase().match(/\b(blue|green|dark|default)\b/);
    if (paletteMatch) setPalette(paletteMatch[1]);

    try {
      const res = await fetch(`${apiBase}/dashboard/chart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          meta,
          openrouter_key: openrouterKey
        })
      });

      // Handle HTTP errors
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText}`);
      }

      const data = await res.json();

      // Handle app-level errors returned as { error: "..." }
      if (data.error) {
        setChatMsgs(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `⚠️ ${data.error}`
        }]);
        return;
      }

      // Validate chart_config before adding
      const cfg = data.chart_config;
      if (!cfg || !cfg.title || !Array.isArray(cfg.data)) {
        setChatMsgs(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: '⚠️ The AI returned an unrecognised chart format. Try rephrasing your request.'
        }]);
        return;
      }

      // All good — add chart
      setCharts(prev => [...prev, cfg]);
      setChatMsgs(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `**Chart generated:** ${cfg.title}\n${data.explanation || ''}`
      }]);

    } catch (err) {
      setChatMsgs(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Error: ${err.message}`
      }]);
    } finally {
      setIsBusy(false);
    }
  };

  const resetDataset = () => {
    setMeta(null);
    setCharts([]);
    setChatMsgs([]);
    setError('');
    sessionStorage.removeItem('dashboardMeta');
  };

  return (
    <div className="flex h-full w-full gap-4 overflow-hidden">

      {/* ── Left: main area ── */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">

        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow">
              Dashboard <span className="opacity-70">Gen</span>
            </h2>
            <p className="text-xs text-white/60 font-mono uppercase tracking-widest mt-0.5">
              Data-to-Insights Engine
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Palette picker */}
            {meta && (
              <div className="flex gap-1">
                {Object.keys(PALETTES).map(p => (
                  <button
                    key={p}
                    onClick={() => setPalette(p)}
                    title={p}
                    className={`w-6 h-6 rounded-lg border-2 transition-all ${palette === p ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
                    style={{ background: PALETTES[p][0] }}
                  />
                ))}
              </div>
            )}
            <button
              onClick={() => setShowcaseMode(s => !s)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all"
            >
              {showcaseMode ? <EyeOff size={14} /> : <Eye size={14} />}
              {showcaseMode ? 'Exit Showcase' : 'Showcase'}
            </button>
          </div>
        </div>

        {/* Upload */}
        {!meta && (
          <GlassCard className="p-6">
            <DropZone onFile={handleFile} isLoading={uploadBusy} />
            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-500 text-xs font-medium">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </GlassCard>
        )}

        {/* KPIs */}
        {meta && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0 animate-in fade-in duration-500">
            <KpiTile label="Total Rows"   value={meta.rows.toLocaleString()} />
            <KpiTile label="Columns"      value={meta.columns} />
            <KpiTile label="Numeric Cols" value={meta.numeric_cols ?? '—'} />
            <KpiTile label="Text Cols"    value={meta.text_cols ?? '—'} />
          </div>
        )}

        {/* Schema */}
        {meta && !showcaseMode && (
          <GlassCard className="p-4 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Database size={14} className="text-[#1988E1]" />
              <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Schema</span>
              <button
                onClick={resetDataset}
                className="ml-auto text-[9px] flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors"
              >
                <RefreshCw size={10} /> Reset
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {meta.column_names.map((col, i) => (
                <span key={i} className="px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-100 text-[10px] font-bold text-[#1988E1]">
                  {col} <span className="opacity-50 font-normal ml-1">{meta.dtypes?.[col]}</span>
                </span>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Empty state */}
        {charts.length === 0 && meta && (
          <GlassCard className="p-10 flex flex-col items-center justify-center text-center opacity-60">
            <BarChart2 size={40} className="text-[#1988E1] mb-3 opacity-40" />
            <p className="text-sm font-bold text-slate-500">No charts yet</p>
            <p className="text-xs text-slate-400 mt-1">Ask the AI in the chat panel →</p>
          </GlassCard>
        )}

        {/* Charts grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {charts
            .filter(cfg => cfg && cfg.title && Array.isArray(cfg.data))
            .map((cfg, i) => (
              <ChartBlock
                key={i}
                config={cfg}
                palette={palette}
                onRemove={() => setCharts(prev => prev.filter((_, idx) => idx !== i))}
              />
            ))}
        </div>

      </div>

      {/* ── Right: chat sidebar (hidden in showcase) ── */}
      {!showcaseMode && (
        <GlassCard className="w-80 shrink-0 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0">
            <Sparkles size={14} className="text-[#1988E1]" />
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">NL → Chart</span>
          </div>
          <ChatInterface
            messages={chatMsgs}
            onSend={handleChat}
            isProcessing={isBusy}
            placeholder='e.g. "Pie chart of Sales by Region"'
            className="flex-1 overflow-hidden"
          />
        </GlassCard>
      )}

    </div>
  );
}