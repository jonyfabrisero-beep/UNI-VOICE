export type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  audioDuration?: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  pageCount: number;
  uploadedAt: string;
  isDefault?: boolean;
}

export interface VoiceSettings {
  voiceURI: string;
  voiceName: string;
  voiceLang: string;
  rate: number;
  pitch: number;
  volume: number;
  continuous: boolean;
  autoSpeak: boolean;
}

export interface AudioVisualizerData {
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  frequencyData: Uint8Array;
}
