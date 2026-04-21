import React, { useState, useCallback, useRef } from 'react';
import {
  UploadCloud, Aperture, AlertCircle, Loader2,
  Sparkles, ZoomIn, CheckCircle, TrendingUp, AlertTriangle, Lightbulb
} from 'lucide-react';
import ChatInterface from './ChatInterface';

// ─── Glass card ───────────────────────────────────────────────────────────────
const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-xl ${className}`}>
    {children}
  </div>
);

// ─── Analysis insight tile ────────────────────────────────────────────────────
const InsightTile = ({ icon: Icon, label, color, items = [] }) => {
  if (!items.length) return null;
  return (
    <div className={`rounded-2xl p-4 border ${color.bg} ${color.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={color.icon} />
        <span className={`text-[10px] font-black uppercase tracking-widest ${color.icon}`}>{label}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${color.dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── Drop zone ────────────────────────────────────────────────────────────────
const ImageDropZone = ({ onFile, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 py-16 px-8 transition-all duration-300 ${
        isDragging ? 'border-[#1988E1] bg-blue-50/50 scale-[1.02]' : 'border-slate-200 hover:border-[#1988E1]/50 hover:bg-blue-50/10'
      }`}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="text-[#1988E1] animate-spin" />
          <p className="text-xs font-mono text-[#1988E1] animate-pulse uppercase tracking-widest">Running OCR + AI Analysis...</p>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
            <Aperture size={32} className="text-[#1988E1]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-700">Drop a dashboard screenshot here</p>
            <p className="text-xs text-slate-400 mt-1">Power BI, Tableau, Excel charts — any image</p>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Processing pipeline steps ────────────────────────────────────────────────
const PipelineStep = ({ step, label, status }) => {
  const statusStyles = {
    pending: 'bg-slate-100 text-slate-400 border-slate-200',
    active:  'bg-blue-50 text-[#1988E1] border-[#1988E1]/30 animate-pulse',
    done:    'bg-green-50 text-green-600 border-green-200',
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-bold transition-all duration-500 ${statusStyles[status]}`}>
      {status === 'active' && <Loader2 size={13} className="animate-spin shrink-0" />}
      {status === 'done' && <CheckCircle size={13} className="shrink-0" />}
      {status === 'pending' && <span className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center text-[9px]">{step}</span>}
      {label}
    </div>
  );
};

// ─── Main VisionAI component ──────────────────────────────────────────────────
export default function VisionAI({ apiBase = 'http://localhost:8000', openrouterKey = '' }) {
  const [imageFile, setImageFile]   = useState(null);
  const [imageUrl, setImageUrl]     = useState('');
  const [ocrText, setOcrText]       = useState('');
  const [analysis, setAnalysis]     = useState(null);   // { summary, trends, anomalies, actions }
  const [chatMsgs, setChatMsgs]     = useState([]);
  const [isBusy, setIsBusy]         = useState(false);
  const [chatBusy, setChatBusy]     = useState(false);
  const [error, setError]           = useState('');
  const [pipeline, setPipeline]     = useState({ ocr: 'pending', llm: 'pending' });
  const [imageB64, setImageB64]     = useState('');

  const handleFile = async (file) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setAnalysis(null);
    setOcrText('');
    setChatMsgs([]);
    setError('');
    setIsBusy(true);
    setPipeline({ ocr: 'active', llm: 'pending' });

    // Convert to base64 for LLM vision
    const b64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    setImageB64(b64);

    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('openrouter_key', openrouterKey);

      // Step 1: OCR
      const ocrRes = await fetch(`${apiBase}/vision/ocr`, { method: 'POST', body: fd });
      if (!ocrRes.ok) throw new Error(await ocrRes.text());
      const ocrData = await ocrRes.json();
      setOcrText(ocrData.text);
      setPipeline({ ocr: 'done', llm: 'active' });

      // Step 2: LLM analysis
      const analysisRes = await fetch(`${apiBase}/vision/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocr_text: ocrData.text,
          image_b64: b64,
          image_mime: file.type,
          openrouter_key: openrouterKey
        })
      });
      if (!analysisRes.ok) throw new Error(await analysisRes.text());
      const analysisData = await analysisRes.json();
      setAnalysis(analysisData);
      setPipeline({ ocr: 'done', llm: 'done' });

      setChatMsgs([{
        id: 'sys-0',
        role: 'assistant',
        content: `**Analysis complete!**\n\n${analysisData.summary}\n\nAsk me follow-up questions about this dashboard.`
      }]);
    } catch (err) {
      setError(err.message || 'Processing failed');
      setPipeline({ ocr: 'pending', llm: 'pending' });
    } finally {
      setIsBusy(false);
    }
  };

  const handleChat = async (text) => {
    if (!analysis) return;
    setChatMsgs(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text }]);
    setChatBusy(true);

    try {
      const res = await fetch(`${apiBase}/vision/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          ocr_text: ocrText,
          image_b64: imageB64,
          image_mime: imageFile?.type || 'image/png',
          history: chatMsgs.slice(-6).map(m => ({ role: m.role, content: m.content })),
          openrouter_key: openrouterKey
        })
      });
      const data = await res.json();
      setChatMsgs(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.answer || 'No response.' }]);
    } catch (err) {
      setChatMsgs(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setChatBusy(false);
    }
  };

  return (
    <div className="flex h-full w-full gap-4 overflow-hidden">

      {/* ── Left: image + analysis ── */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">

        {/* Header */}
        <div className="shrink-0">
          <h2 className="text-2xl font-black text-white tracking-tight drop-shadow">Vision <span className="opacity-70">AI</span></h2>
          <p className="text-xs text-white/60 font-mono uppercase tracking-widest mt-0.5">OCR + LLM Visual Intelligence</p>
        </div>

        {/* Upload */}
        {!imageUrl && (
          <GlassCard className="p-6">
            <ImageDropZone onFile={handleFile} isLoading={isBusy} />
            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-500 text-xs font-medium">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </GlassCard>
        )}

        {/* Preview + pipeline */}
        {imageUrl && (
          <GlassCard className="p-5 shrink-0 animate-in fade-in duration-500">
            <div className="flex gap-5">
              {/* Thumbnail */}
              <div className="relative group rounded-2xl overflow-hidden w-48 h-32 shrink-0 border border-slate-100 shadow">
                <img src={imageUrl} alt="Uploaded dashboard" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn size={20} className="text-white" />
                </div>
              </div>
              {/* Pipeline */}
              <div className="flex-1 flex flex-col justify-center gap-2">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Processing Pipeline</p>
                <PipelineStep step={1} label="EasyOCR Text Extraction" status={pipeline.ocr} />
                <PipelineStep step={2} label="LLM Visual Analysis" status={pipeline.llm} />
              </div>
            </div>
            {!isBusy && (
              <button
                onClick={() => { setImageUrl(''); setImageFile(null); setAnalysis(null); setOcrText(''); setChatMsgs([]); setPipeline({ ocr: 'pending', llm: 'pending' }); }}
                className="mt-3 text-[10px] text-slate-400 hover:text-red-400 transition-colors font-medium"
              >
                ← Upload a different image
              </button>
            )}
          </GlassCard>
        )}

        {/* Extracted OCR text */}
        {ocrText && (
          <GlassCard className="p-4 shrink-0 animate-in fade-in duration-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Extracted Text (OCR)</p>
            <p className="text-xs text-slate-600 font-mono leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
              {ocrText}
            </p>
          </GlassCard>
        )}

        {/* Analysis results */}
        {analysis && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <InsightTile
              icon={TrendingUp}
              label="Trends Identified"
              color={{ bg: 'bg-blue-50/60', border: 'border-blue-100', icon: 'text-[#1988E1]', dot: 'bg-[#1988E1]' }}
              items={analysis.trends || []}
            />
            <InsightTile
              icon={AlertTriangle}
              label="Anomalies Detected"
              color={{ bg: 'bg-amber-50/60', border: 'border-amber-100', icon: 'text-amber-500', dot: 'bg-amber-400' }}
              items={analysis.anomalies || []}
            />
            <InsightTile
              icon={Lightbulb}
              label="Business Actions"
              color={{ bg: 'bg-green-50/60', border: 'border-green-100', icon: 'text-green-600', dot: 'bg-green-400' }}
              items={analysis.actions || []}
            />
          </div>
        )}
      </div>

      {/* ── Right: follow-up chat ── */}
      {analysis && (
        <GlassCard className="w-80 shrink-0 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0">
            <Sparkles size={14} className="text-[#1988E1]" />
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Follow-up Chat</span>
          </div>
          <ChatInterface
            messages={chatMsgs}
            onSend={handleChat}
            isProcessing={chatBusy}
            placeholder="Ask about the dashboard..."
            className="flex-1 overflow-hidden"
          />
        </GlassCard>
      )}
    </div>
  );
}