import React, { useState } from 'react';
import { FileText, X, Check, RefreshCw, Layers, Sparkles, BookOpen } from 'lucide-react';
import { KnowledgeDocument } from '../types';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: KnowledgeDocument;
  onUpdateDocument: (doc: KnowledgeDocument) => void;
  onResetToDefault: () => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  document,
  onUpdateDocument,
  onResetToDefault,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(document.content);
  const [title, setTitle] = useState(document.title);
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateDocument({
      ...document,
      title,
      content,
      uploadedAt: `Modificado el ${new Date().toLocaleDateString()}`,
      isDefault: false,
    });
    setIsEditing(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleReset = () => {
    onResetToDefault();
    setIsEditing(false);
    onClose();
  };

  return (
    <div
      id="knowledge-base-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050508]/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#050508] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <FileText className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Knowledge Source (PDF)
                {document.isDefault && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    PDF Pre-cargado
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">
                Fuente de datos principal para las respuestas de la IA
              </p>
            </div>
          </div>
          <button
            id="close-knowledge-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {savedFeedback && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs animate-fade-in">
              <Check className="w-4 h-4" />
              <span>Base de conocimiento actualizada correctamente. La IA responderá con estos datos.</span>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre del Documento:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Contenido / Texto extraído del PDF:</label>
                <textarea
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 resize-none leading-relaxed"
                  placeholder="Pega aquí el contenido de tu documento..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-white">{document.title}</span>
                </div>
                <span className="text-[11px] text-gray-400">{document.uploadedAt}</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {document.content}
                </pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1">
                  <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Tienda Pollos Gran Combo
                  </div>
                  <p className="text-gray-400 text-[11px]">
                    Incluye ubicación, horario 10am-10pm, Master Burguer 2026 (Doppio Cheese $6.99 / Monster Cheese $9.99), Combo Mega Sonrisa $19.99 y WhatsApp +584243065534.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1">
                  <div className="font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Tiendas de Belleza
                  </div>
                  <p className="text-gray-400 text-[11px]">
                    Hallyu K-Beauty, Glossy Beauty Studio, MÏA Cosmetics, Studio 1118, Vijones Beauty Bar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/5">
          <div>
            {!document.isDefault && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar PDF Original
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setContent(document.content);
                    setTitle(document.title);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="save-knowledge-button"
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  Guardar Cambios
                </button>
              </>
            ) : (
              <button
                id="edit-knowledge-button"
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer border border-white/10"
              >
                Editar o Reemplazar Texto
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
