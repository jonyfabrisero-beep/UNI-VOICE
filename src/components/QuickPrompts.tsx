import React from 'react';
import { Sparkles } from 'lucide-react';
import { QUICK_VOICE_PROMPTS } from '../data/defaultKnowledge';

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt, disabled }) => {
  return (
    <div id="quick-prompts-section" className="w-full max-w-2xl px-4 mx-auto">
      <div className="flex items-center justify-center gap-1.5 mb-2.5 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span>Consultas sugeridas</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {QUICK_VOICE_PROMPTS.slice(0, 2).map((prompt, idx) => (
          <button
            key={idx}
            id={`quick-prompt-btn-${idx}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(prompt)}
            className="text-xs px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/40 text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-center whitespace-normal max-w-sm shadow-sm backdrop-blur-md"
          >
            "{prompt}"
          </button>
        ))}
      </div>
    </div>
  );
};

