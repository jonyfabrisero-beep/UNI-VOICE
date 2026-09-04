import React, { useState } from 'react';
import { EnergyOrb } from './components/EnergyOrb';
import { QuickPrompts } from './components/QuickPrompts';
import { ChatView } from './components/ChatView';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { MessageSquare, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const {
    state,
    audioLevel,
    liveTranscript,
    messages,
    errorMessage,
    voiceSettings,
    setVoiceSettings,
    toggleListening,
    stopSpeaking,
    processQuery,
    clearHistory,
    speakResponse,
  } = useVoiceAssistant();

  const [isChatOpen, setIsChatOpen] = useState(false);

  // Auto-open chat view once the user has spoken and AI begins processing the response
  React.useEffect(() => {
    if (state === 'processing') {
      setIsChatOpen(true);
    }
  }, [state]);

  const handleToggleMute = () => {
    if (voiceSettings.volume > 0) {
      setVoiceSettings({ ...voiceSettings, volume: 0 });
      stopSpeaking();
    } else {
      setVoiceSettings({ ...voiceSettings, volume: 1 });
    }
  };

  const handleAtomClick = () => {
    // Only toggle listening, keep user on main screen to see the green listening atom
    toggleListening();
  };

  const handleSelectPrompt = (prompt: string) => {
    processQuery(prompt);
  };

  const isListening = state === 'listening';
  const isProcessing = state === 'processing';
  const isSpeaking = state === 'speaking';
  const isMuted = voiceSettings.volume === 0;

  return (
    <div className="relative min-h-screen bg-[#050508] text-white flex flex-col justify-between overflow-x-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Sleek Dot Grid Background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Atmospheric Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Sleek Minimal Header */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-6 py-6 flex justify-between items-center">
        {/* Brand */}
        <h1 className="text-2xl font-light tracking-tight text-white flex items-center gap-1.5">
          Uni <span className="font-bold text-indigo-400">Voice</span>
        </h1>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              id="open-chat-btn"
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-lg flex items-center gap-2 text-xs font-medium"
              title="Abrir historial del chat"
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Ver Chat</span>
            </button>
          )}

          {/* Mute / Unmute */}
          <button
            id="mute-toggle-btn"
            type="button"
            onClick={handleToggleMute}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-lg"
            title={isMuted ? 'Activar sonido' : 'Silenciar voz'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Interactive Stage: Atom with Mic + 2 Suggested Queries */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 py-8 w-full max-w-3xl mx-auto my-auto">
        <div className="relative flex flex-col items-center justify-center w-full">
          {/* Subtle concentric rings */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-8 sm:-inset-12 border border-white/5 rounded-full pointer-events-none opacity-40" />
            <div className="absolute -inset-3 sm:-inset-5 border border-white/5 rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <EnergyOrb
              state={state}
              audioLevel={audioLevel}
              onClick={handleAtomClick}
              className="w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96"
            />
          </div>

          {/* Status Hint */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-xs sm:text-sm tracking-wide">
              {isListening ? (
                <span className="text-emerald-400 font-medium animate-pulse flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {liveTranscript ? `"${liveTranscript}"` : 'Escuchando... Habla ahora'}
                </span>
              ) : isProcessing ? (
                <span className="text-cyan-400 font-medium animate-pulse">Pensando respuesta...</span>
              ) : isSpeaking ? (
                <span className="text-indigo-300 font-medium">Hablando respuesta...</span>
              ) : (
                <span className="text-gray-400">Toca el micrófono en el centro para hablar</span>
              )}
            </p>
          </div>

          {/* Suggested Queries */}
          <div className="mt-8 w-full">
            <QuickPrompts
              onSelectPrompt={handleSelectPrompt}
              disabled={isProcessing}
            />
          </div>
        </div>
      </main>

      {/* Minimal Footer Padding */}
      <div className="h-6" />

      {/* Chat View Overlay (Reference Image Style) */}
      {isChatOpen && (
        <ChatView
          messages={messages}
          state={state}
          audioLevel={audioLevel}
          liveTranscript={liveTranscript}
          isListening={isListening}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          onSendMessage={(text) => processQuery(text)}
          onToggleListening={toggleListening}
          onReplaySpeech={(text) => speakResponse(text)}
          onClearHistory={clearHistory}
          onClose={() => setIsChatOpen(false)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}
    </div>
  );
}

