import React from 'react';
import { Mic, MicOff, Square, Sparkles, Loader2, Volume2 } from 'lucide-react';
import { AssistantState } from '../types';

interface VoiceMicButtonProps {
  state: AssistantState;
  audioLevel: number;
  onToggleListening: () => void;
  onStopSpeaking: () => void;
  isSupported: boolean;
  errorMessage?: string | null;
}

export const VoiceMicButton: React.FC<VoiceMicButtonProps> = ({
  state,
  audioLevel,
  onToggleListening,
  onStopSpeaking,
  isSupported,
  errorMessage,
}) => {
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';
  const isSpeaking = state === 'speaking';

  return (
    <div id="voice-control-center" className="flex flex-col items-center justify-center gap-4 w-full px-4">
      {/* State Status Capsule Indicator */}
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-lg backdrop-blur-md transition-all">
        {isListening && (
          <div className="flex items-center gap-2 text-cyan-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span className="text-[11px] font-semibold tracking-wider uppercase">Escuchando... Di tu pregunta</span>
          </div>
        )}
        {isProcessing && (
          <div className="flex items-center gap-2 text-indigo-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[11px] font-semibold tracking-wider uppercase">Consultando base de conocimiento...</span>
          </div>
        )}
        {isSpeaking && (
          <div className="flex items-center gap-2 text-emerald-400">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider uppercase">Reproduciendo respuesta</span>
          </div>
        )}
        {state === 'idle' && (
          <div className="flex items-center gap-2 text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-medium tracking-wide">Toca el botón o pulsa Espacio para hablar</span>
          </div>
        )}
        {state === 'error' && (
          <div className="flex items-center gap-2 text-rose-400">
            <span className="text-[11px] font-medium">{errorMessage || 'Error en micrófono'}</span>
          </div>
        )}
      </div>

      {/* Main Bottom Central Button with Sleek Interface Luminous Effect */}
      <div className="relative flex items-center justify-center">
        {/* Sleek Luminous Outer Glow */}
        <div
          className={`absolute -inset-2 bg-gradient-to-tr from-indigo-600 via-cyan-500 to-purple-600 rounded-full blur-xl transition-all duration-300 pointer-events-none ${
            isListening
              ? 'opacity-90 scale-125'
              : isSpeaking
              ? 'opacity-80 scale-110'
              : 'opacity-40 group-hover:opacity-100'
          }`}
          style={{
            transform: isListening ? `scale(${1.2 + audioLevel * 0.5})` : undefined,
          }}
        />

        {/* Action Button */}
        {isSpeaking ? (
          <button
            id="stop-speaking-button"
            type="button"
            onClick={onStopSpeaking}
            className="group relative w-20 h-20 rounded-full flex items-center justify-center bg-white border-2 border-white/20 text-[#050508] shadow-[0_0_35px_rgba(52,211,153,0.5)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
            title="Detener respuesta de voz"
            aria-label="Detener voz"
          >
            <Square className="w-7 h-7 fill-[#050508] transition-transform group-hover:scale-90" />
            <span className="sr-only">Detener voz</span>
          </button>
        ) : (
          <button
            id="main-mic-button"
            type="button"
            disabled={!isSupported}
            onClick={onToggleListening}
            className={`group relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer select-none focus:outline-none ${
              isListening
                ? 'bg-cyan-400 text-[#050508] shadow-[0_0_40px_rgba(6,182,212,0.8)] scale-105 ring-4 ring-cyan-300/50'
                : isProcessing
                ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] animate-pulse'
                : 'bg-white text-[#050508] shadow-2xl hover:scale-105 active:scale-95 hover:shadow-[0_0_35px_rgba(255,255,255,0.6)]'
            } ${!isSupported ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={
              !isSupported
                ? 'Reconocimiento de voz no soportado'
                : isListening
                ? 'Haz clic para finalizar'
                : 'Haz clic para hablar'
            }
            aria-label={isListening ? 'Detener micrófono' : 'Activar micrófono'}
          >
            {isProcessing ? (
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            ) : isListening ? (
              <Mic className="w-8 h-8 animate-pulse text-[#050508]" />
            ) : !isSupported ? (
              <MicOff className="w-8 h-8 text-gray-400" />
            ) : (
              <Mic className="w-8 h-8 transition-transform group-hover:scale-110 text-[#050508]" />
            )}
          </button>
        )}
      </div>

      {/* Accessibility Sub-hint */}
      <p className="text-xs text-gray-400 font-normal text-center">
        {isListening ? (
          <span className="text-cyan-300 font-medium">Escuchando voz en directo...</span>
        ) : isSpeaking ? (
          <span className="text-emerald-300 font-medium">Pulsa el botón central para silenciar</span>
        ) : (
          <span>
            Pulsa el <strong className="text-white font-medium">botón central</strong> o la tecla <kbd className="px-1.5 py-0.5 text-[11px] bg-white/10 border border-white/10 rounded text-gray-200">Espacio</kbd>
          </span>
        )}
      </p>
    </div>
  );
};

