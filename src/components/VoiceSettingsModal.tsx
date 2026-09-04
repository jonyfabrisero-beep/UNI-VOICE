import React from 'react';
import { Volume2, X, Sliders, Play } from 'lucide-react';
import { VoiceSettings } from '../types';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onUpdateSettings: (settings: VoiceSettings) => void;
  availableVoices: SpeechSynthesisVoice[];
  onTestVoice: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  availableVoices,
  onTestVoice,
}) => {
  if (!isOpen) return null;

  // Prioritize Spanish voices
  const spanishVoices = availableVoices.filter((v) => v.lang.startsWith('es'));
  const displayVoices = spanishVoices.length > 0 ? spanishVoices : availableVoices;

  return (
    <div
      id="voice-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050508]/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-[#050508] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sliders className="w-5 h-5" />
            <h2 className="text-sm font-bold text-white">Ajustes de Voz y Audio</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="p-6 space-y-5 text-sm">
          {/* Voice Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Voz de Síntesis (Español):
            </label>
            <select
              value={settings.voiceURI}
              onChange={(e) => {
                const selected = availableVoices.find((v) => v.voiceURI === e.target.value);
                if (selected) {
                  onUpdateSettings({
                    ...settings,
                    voiceURI: selected.voiceURI,
                    voiceName: selected.name,
                    voiceLang: selected.lang,
                  });
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {displayVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI} className="bg-[#050508] text-white">
                  {voice.name} ({voice.lang}) {voice.default ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Speed / Rate */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-300 mb-1">
              <span>Velocidad de Respuesta:</span>
              <span className="text-cyan-400 font-mono">{settings.rate}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={settings.rate}
              onChange={(e) =>
                onUpdateSettings({ ...settings, rate: parseFloat(e.target.value) })
              }
              className="w-full accent-cyan-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>Tranquilo (0.75x)</span>
              <span>Normal (1.0x)</span>
              <span>Rápido (1.5x)</span>
            </div>
          </div>

          {/* Pitch */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-300 mb-1">
              <span>Tono de Voz:</span>
              <span className="text-cyan-400 font-mono">{settings.pitch}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={settings.pitch}
              onChange={(e) =>
                onUpdateSettings({ ...settings, pitch: parseFloat(e.target.value) })
              }
              className="w-full accent-cyan-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Auto Speak Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <span className="text-xs font-semibold text-white block">Lectura Automática</span>
              <span className="text-[11px] text-gray-400">Reproducir la respuesta por voz al instante</span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSpeak}
              onChange={(e) =>
                onUpdateSettings({ ...settings, autoSpeak: e.target.checked })
              }
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          {/* Test Voice Button */}
          <button
            type="button"
            onClick={onTestVoice}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
            Probar voz actual
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-white/5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#050508] text-xs font-bold transition-colors cursor-pointer shadow-md"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
