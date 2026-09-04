import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AssistantState } from '../types';
import { ArrowLeft, Mic, MicOff, Send, Volume2, VolumeX, Sparkles, Trash2, CheckCheck, Globe, Compass, ExternalLink } from 'lucide-react';

interface ChatViewProps {
  messages: ChatMessage[];
  state: AssistantState;
  audioLevel: number;
  liveTranscript: string;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  onSendMessage: (text: string) => void;
  onToggleListening: () => void;
  onReplaySpeech: (text: string) => void;
  onClearHistory: () => void;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  state,
  audioLevel,
  liveTranscript,
  isListening,
  isProcessing,
  isSpeaking,
  onSendMessage,
  onToggleListening,
  onReplaySpeech,
  onClearHistory,
  onClose,
  isMuted,
  onToggleMute,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, liveTranscript, isProcessing, isListening]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const formatTime = (date: Date) => {
    try {
      const d = new Date(date);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050508] text-white flex flex-col justify-between overflow-hidden font-sans">
      {/* Background Dot Grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Sleek Chat Header */}
      <header className="relative z-10 w-full max-w-3xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between border-b border-white/10 bg-[#07070e]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            id="chat-back-btn"
            type="button"
            onClick={onClose}
            className="p-2 -ml-1 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
            title="Volver al inicio"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#07070e] ${
                  isListening
                    ? 'bg-emerald-400 animate-pulse'
                    : isSpeaking
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Uni Voice</h2>
              <p className="text-[11px] text-gray-400">
                {isListening
                  ? 'Escuchando tu voz...'
                  : isProcessing
                  ? 'Pensando respuesta...'
                  : isSpeaking
                  ? 'Hablando por audio...'
                  : 'En línea'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            id="chat-toggle-mute-btn"
            type="button"
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
            title={isMuted ? 'Activar sonido' : 'Silenciar voz'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            id="chat-clear-btn"
            type="button"
            onClick={onClearHistory}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
            title="Limpiar conversación"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Message Timeline */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-4 w-full max-w-3xl mx-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all`}
            >
              <div
                className={`relative px-4 py-3 max-w-[85%] sm:max-w-[75%] rounded-2xl text-sm leading-relaxed shadow-md ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-br-sm'
                    : 'bg-[#11131f]/90 border border-white/10 text-slate-100 rounded-bl-sm backdrop-blur-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Hybrid Knowledge Badge & Sources */}
                {!isUser && msg.sourceType && (
                  <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    {msg.sourceType === 'grounding' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                        <Globe className="w-2.5 h-2.5 text-blue-400" />
                        Google Search Grounding
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                        <Compass className="w-2.5 h-2.5 text-emerald-400" />
                        Directorio Sincronizado
                      </span>
                    )}

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1 w-full">
                        {msg.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[9px] text-cyan-400/80 hover:text-cyan-300 underline underline-offset-2 hover:bg-white/5 px-1 py-0.5 rounded"
                          >
                            <ExternalLink className="w-2 h-2" />
                            {src.title.length > 25 ? `${src.title.slice(0, 25)}...` : src.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] ${
                    isUser ? 'text-indigo-200' : 'text-gray-400'
                  }`}
                >
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => onReplaySpeech(msg.text)}
                      className="hover:text-cyan-300 p-0.5 transition-colors cursor-pointer mr-auto"
                      title="Escuchar mensaje nuevamente"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  )}
                  <span>{formatTime(msg.timestamp)}</span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live speech transcription bubble while speaking */}
        {isListening && liveTranscript && (
          <div className="flex flex-col items-end">
            <div className="px-4 py-3 max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-sm bg-indigo-900/60 border border-cyan-400/40 text-cyan-100 text-sm shadow-lg animate-pulse">
              <p className="italic">"{liveTranscript}"</p>
              <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-cyan-300">
                <span>Escuchando...</span>
              </div>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex flex-col items-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[#11131f]/90 border border-white/10 text-slate-300 text-sm flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Sleek Bottom Input Bar */}
      <footer className="relative z-10 w-full max-w-3xl mx-auto p-3 sm:p-4 bg-[#07070e]/90 backdrop-blur-md border-t border-white/10">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Main Input Field */}
          <div className="relative flex-1">
            <input
              id="chat-text-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? 'Escuchando tu voz...' : 'Escribe tu pregunta o habla...'}
              disabled={isListening || isProcessing}
              className="w-full bg-[#131525] border border-white/10 focus:border-indigo-500 rounded-full px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-60 shadow-inner"
            />
          </div>

          {/* Voice Microphone Button in Input Bar */}
          <button
            id="chat-mic-btn"
            type="button"
            onClick={onToggleListening}
            className={`p-3 rounded-full transition-all duration-200 cursor-pointer shadow-lg flex items-center justify-center ${
              isListening
                ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/30 animate-pulse scale-105 shadow-emerald-500/30'
                : isSpeaking
                ? 'bg-cyan-500 text-black ring-4 ring-cyan-500/30'
                : 'bg-white/10 hover:bg-white/20 text-cyan-400 border border-white/10'
            }`}
            title={isListening ? 'Detener y enviar' : 'Hablar por micrófono'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send Button */}
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputText.trim() || isProcessing || isListening}
            className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-lg flex items-center justify-center"
            title="Enviar mensaje"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
};
