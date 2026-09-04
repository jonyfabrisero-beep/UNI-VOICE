import React, { useState } from 'react';
import { EnergyOrb } from './components/EnergyOrb';
import { VoiceMicButton } from './components/VoiceMicButton';
import { QuickPrompts } from './components/QuickPrompts';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { LiveTranscript } from './components/LiveTranscript';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { FileText, Sliders, Volume2, VolumeX, Sparkles } from 'lucide-react';

export default function App() {
  const {
    state,
    audioLevel,
    liveTranscript,
    messages,
    errorMessage,
    knowledgeDoc,
    setKnowledgeDoc,
    resetKnowledgeToDefault,
    voiceSettings,
    setVoiceSettings,
    availableVoices,
    isSpeechRecognitionSupported,
    toggleListening,
    stopSpeaking,
    processQuery,
    clearHistory,
    speakResponse,
  } = useVoiceAssistant();

  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleTestVoice = () => {
    speakResponse("Hola, soy tu asistente de inteligencia artificial. Mi base de conocimiento está lista.");
  };

  const handleToggleMute = () => {
    if (voiceSettings.volume > 0) {
      setVoiceSettings({ ...voiceSettings, volume: 0 });
      stopSpeaking();
    } else {
      setVoiceSettings({ ...voiceSettings, volume: 1 });
    }
  };

  const isListening = state === 'listening';
  const isProcessing = state === 'processing';
  const isSpeaking = state === 'speaking';

  return (
    <div className="relative min-h-screen bg-[#050508] text-white flex flex-col justify-between overflow-x-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Sleek Dot Grid Pattern Background */}
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

      {/* Sleek Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Brand */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-light tracking-tight text-white flex items-center gap-1.5">
            Uni <span className="font-bold text-indigo-400">Voice</span>
          </h1>
        </div>

        {/* Knowledge Source Badge & Controls Card */}
        <div className="flex items-center gap-2.5">
          <button
            id="view-knowledge-doc-btn"
            type="button"
            onClick={() => setIsKnowledgeOpen(true)}
            className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-md rounded-2xl p-2.5 sm:px-4 sm:py-3 flex items-center space-x-3 max-w-xs transition-all duration-200 cursor-pointer text-left shadow-lg"
            title="Ver o editar documento PDF de conocimiento"
          >
            <div className="bg-red-500/20 p-2 rounded-xl text-red-400 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Knowledge Source</span>
              <span className="text-xs font-medium text-slate-100 truncate max-w-[140px] sm:max-w-[170px]">
                {knowledgeDoc.title}
              </span>
            </div>
          </button>

          {/* Quick Voice Settings */}
          <button
            id="voice-settings-btn"
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-lg"
            title="Ajustes de voz y sintetizador"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Mute / Unmute */}
          <button
            id="mute-toggle-btn"
            type="button"
            onClick={handleToggleMute}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-lg"
            title={voiceSettings.volume > 0 ? 'Silenciar voz' : 'Activar sonido'}
          >
            {voiceSettings.volume > 0 ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 py-4 w-full max-w-4xl mx-auto">
        {/* Sleek Concentric Rings around Orb */}
        <div className="relative flex flex-col items-center justify-center my-auto w-full">
          <div className="relative flex items-center justify-center">
            {/* Concentric Sleek Border Accents */}
            <div className="absolute -inset-8 sm:-inset-12 border border-white/5 rounded-full pointer-events-none opacity-50" />
            <div className="absolute -inset-3 sm:-inset-5 border border-white/5 rounded-full pointer-events-none" />
            
            {/* Atmospheric gradient glow behind Orb */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <EnergyOrb
              state={state}
              audioLevel={audioLevel}
              onClick={toggleListening}
              className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96"
            />
          </div>

          {/* Prompt Quote & Voice Status Feedback */}
          <div className="mt-8 text-center max-w-xl px-4">
            <p className="text-indigo-200 text-base sm:text-lg font-light tracking-wide italic">
              {liveTranscript
                ? `"${liveTranscript}"`
                : messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !isListening
                ? `"${messages[messages.length - 1].text.slice(0, 160)}${messages[messages.length - 1].text.length > 160 ? '...' : ''}"`
                : '"Bienvenido a tu centro comercial inteligente, ¿En que puedo ayudarte?"'}
            </p>
            {(isListening || isProcessing || isSpeaking) && (
              <p className="text-cyan-400 text-xs mt-2 uppercase tracking-[0.3em] font-medium animate-pulse">
                {isListening
                  ? 'Escuchando entrada de voz...'
                  : isProcessing
                  ? 'Procesando consulta...'
                  : 'Transmitiendo respuesta por voz...'}
              </p>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="mt-6 w-full">
            <QuickPrompts
              onSelectPrompt={(prompt) => processQuery(prompt)}
              disabled={isProcessing || isListening}
            />
          </div>
        </div>

        {/* Live Subtitle Transcript & Text Input Fallback */}
        <div className="w-full mt-4">
          <LiveTranscript
            messages={messages}
            liveUserTranscript={liveTranscript}
            isListening={isListening}
            onSendMessage={(text) => processQuery(text)}
            onReplaySpeech={(text) => speakResponse(text)}
            onClearHistory={clearHistory}
            isProcessing={isProcessing}
          />
        </div>
      </main>

      {/* Sleek Footer with Mic Button */}
      <footer className="relative z-10 w-full flex flex-col items-center pb-8 pt-2">
        <VoiceMicButton
          state={state}
          audioLevel={audioLevel}
          onToggleListening={toggleListening}
          onStopSpeaking={stopSpeaking}
          isSupported={isSpeechRecognitionSupported}
          errorMessage={errorMessage}
        />
      </footer>

      {/* Knowledge Base Modal */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
        document={knowledgeDoc}
        onUpdateDocument={setKnowledgeDoc}
        onResetToDefault={resetKnowledgeToDefault}
      />

      {/* Voice Settings Modal */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={voiceSettings}
        onUpdateSettings={setVoiceSettings}
        availableVoices={availableVoices}
        onTestVoice={handleTestVoice}
      />
    </div>
  );
}

