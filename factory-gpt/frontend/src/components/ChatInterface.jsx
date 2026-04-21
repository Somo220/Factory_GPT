import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Loader2, User, Cpu, X } from 'lucide-react';

/**
 * ChatInterface — Shared sidebar/inline chat component
 * Props:
 *   messages       : [{ id, role, content }]
 *   onSend         : (text) => void
 *   isProcessing   : bool
 *   placeholder    : string
 *   className      : string  (optional wrapper class)
 */
export default function ChatInterface({ messages = [], onSend, isProcessing = false, placeholder = 'Ask a question...', className = '' }) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    recognitionRef.current = rec;

    rec.onstart = () => setIsRecording(true);
    rec.onend = () => setIsRecording(false);

    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');

      const words = transcript.trim().split(/\s+/);
      const lastWord = words[words.length - 1]?.toLowerCase().replace(/[.,!?]/g, '');
      const clean = lastWord === 'send' ? words.slice(0, -1).join(' ') : words.join(' ');

      setInput(clean);
      if (lastWord === 'send' && clean.trim()) {
        rec.stop();
        onSend(clean.trim());
        setInput('');
      }
    };

    rec.onerror = () => setIsRecording(false);
  }, [onSend]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setInput('');
      recognitionRef.current.start();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40 select-none">
            <Cpu size={32} className="text-[#1988E1] mb-3" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start a conversation</p>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2 animate-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-[#1988E1]/10 border border-[#1988E1]/20 flex items-center justify-center shrink-0 mt-0.5">
                <Cpu size={14} className="text-[#1988E1]" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1988E1] text-white rounded-br-sm'
                  : 'bg-white/80 border border-slate-100 text-slate-700 rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.content.split('\n').map((line, i) => (
                <p key={i} className={`${i > 0 ? 'mt-1' : ''} ${line.startsWith('**') ? 'font-black text-[#1988E1]' : ''}`}>
                  {line.replace(/\*\*/g, '')}
                </p>
              ))}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} className="text-slate-500" />
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-2 justify-start animate-in fade-in">
            <div className="w-7 h-7 rounded-xl bg-[#1988E1]/10 border border-[#1988E1]/20 flex items-center justify-center shrink-0">
              <Cpu size={14} className="text-[#1988E1]" />
            </div>
            <div className="bg-white/80 border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-[#1988E1]" />
                <span className="text-[10px] font-mono font-bold text-[#1988E1] uppercase tracking-widest">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-100">
        <form onSubmit={handleSubmit} className={`flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 border-2 transition-all duration-300 ${isRecording ? 'border-red-400' : 'border-slate-100 focus-within:border-[#1988E1]'}`}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isRecording ? 'Listening...' : placeholder}
            className="flex-1 bg-transparent outline-none text-xs font-medium text-slate-700 placeholder:text-slate-300"
          />
          {recognitionRef.current && (
            <button
              type="button"
              onClick={toggleRecording}
              className={`relative p-2 rounded-xl transition-all ${isRecording ? 'bg-red-100 text-red-500' : 'text-slate-400 hover:text-[#1988E1] hover:bg-blue-50'}`}
            >
              {isRecording && <span className="absolute inset-0 rounded-xl animate-ping bg-red-300 opacity-40" />}
              {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          )}
          <button
            disabled={!input.trim() || isProcessing}
            className="w-8 h-8 rounded-xl bg-[#1988E1] flex items-center justify-center text-white disabled:opacity-30 transition-all hover:opacity-90 shrink-0"
          >
            {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </button>
        </form>
        <p className="text-[9px] text-slate-300 text-center mt-1.5 font-mono">Say "...SEND" to submit by voice</p>
      </div>
    </div>
  );
}