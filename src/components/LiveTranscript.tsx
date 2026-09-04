import React, { useState } from 'react';
import { Send, Volume2, Bot, User, Trash2, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';
import { ChatMessage } from '../types';

interface LiveTranscriptProps {
  messages: ChatMessage[];
  liveUserTranscript: string;
  isListening: boolean;
  onSendMessage: (text: string) => void;
  onReplaySpeech: (text: string) => void;
  onClearHistory: () => void;
  isProcessing: boolean;
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  messages,
  liveUserTranscript,
  isListening,
  onSendMessage,
  onReplaySpeech,
  onClearHistory,
  isProcessing,
}) => {
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div
      id="live-transcript-container"
      className="w-full max-w-xl mx-auto px-4 z-20 flex flex-col items-center"
    >
      {/* Live Voice Caption Overlay (Minimalist center subtitling) */}
      {(isListening || liveUserTranscript) && (
        <div className="w-full mb-3 p-4 rounded-2xl bg-white/5 border border-cyan-400/30 shadow-[0_0_25px_rgba(6,182,212,0.15)] backdrop-blur-xl animate-fade-in text-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold block mb-1">
            Reconociendo voz en vivo
          </span>
          <p className="text-base font-light text-white italic">
            "{liveUserTranscript || 'Escuchando tu voz...'}"
          </p>
        </div>
      )}

      {/* Latest Assistant Message Callout if collapsed */}
      {!isExpanded && lastMessage && lastMessage.role === 'assistant' && !isListening && (
        <div className="w-full mb-2 p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md animate-fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold mb-1">
              <Bot className="w-3.5 h-3.5" />
              <span>Respuesta del Asistente:</span>
            </div>
            <button
              type="button"
              onClick={() => onReplaySpeech(lastMessage.text)}
              className="p-1 text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Escuchar de nuevo"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-200 font-normal leading-relaxed max-h-24 overflow-y-auto">
            {lastMessage.text}
          </p>
        </div>
      )}

      {/* Expandable Conversation Transcript */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5 px-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white font-medium transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3 h-3 text-cyan-400" />
            <span>{isExpanded ? 'Ocultar historial' : 'Ver transcripción completa'}</span>
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="w-full max-h-60 overflow-y-auto p-4 mb-3 rounded-2xl bg-[#050508]/90 border border-white/10 space-y-3 shadow-2xl backdrop-blur-xl">
            {messages.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4 font-light">
                El historial de voz aparecerá aquí una vez que hables o envíes una consulta.
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">
                    {msg.role === 'user' ? (
                      <>
                        <span>Tú</span>
                        <User className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 text-cyan-400" />
                        <span className="text-cyan-400 font-medium">Asistente IA</span>
                      </>
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600/30 border border-indigo-500/40 text-indigo-100 rounded-tr-none'
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                    {msg.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => onReplaySpeech(msg.text)}
                        className="mt-1.5 flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                        title="Volver a escuchar esta respuesta"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Re-escuchar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Fallback Text Input Bar */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            id="text-query-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
            placeholder="O escribe tu pregunta aquí..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/60 focus:bg-white/10 transition-all shadow-inner backdrop-blur-md"
          />
          <button
            id="send-text-query-button"
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="p-2.5 rounded-xl bg-indigo-500 hover:bg-cyan-400 disabled:opacity-30 disabled:pointer-events-none text-white hover:text-slate-950 font-bold transition-all cursor-pointer shadow-md"
            title="Enviar mensaje escrito"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
