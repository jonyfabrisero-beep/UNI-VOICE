import { useState, useEffect, useRef, useCallback } from 'react';
import { AssistantState, ChatMessage, VoiceSettings, KnowledgeDocument } from '../types';
import { DEFAULT_KNOWLEDGE_DOC } from '../data/defaultKnowledge';

// Fallback matching in case server is booting or offline
function matchLocalKnowledge(query: string, content: string): string {
  const q = query.toLowerCase();
  
  if (q.includes('hamburguesa') || q.includes('master burguer') || q.includes('doppio') || q.includes('monster') || q.includes('promo')) {
    return "En Pollos Gran Combo tienen las promociones del Master Burguer 2026 con dos opciones: la Doppio Cheese en versión estándar por 6.99 dólares, y la Monster Cheese en versión premium por 9.99 dólares.";
  }
  
  if (q.includes('ingrediente') && (q.includes('doppio') || q.includes('standard') || q.includes('estandar'))) {
    return "La hamburguesa Doppio Cheese lleva pan brioche coronado con queso parmesano, pollo crispy, queso Kraft, tocineta, cebolla caramelizada y salsa de ajo parmesano.";
  }

  if (q.includes('ingrediente') && (q.includes('monster') || q.includes('premium'))) {
    return "La hamburguesa Monster Cheese lleva pan pretzel, pollo crispy, queso gouda holandés, mermelada de tocineta, tira de tocineta extra, lechuga y salsa mayo ranch.";
  }

  if (q.includes('horario') || q.includes('hora') || q.includes('abierto') || q.includes('abren')) {
    return "El horario de Pollos Gran Combo es de 10 de la mañana a 10 de la noche, todos los días.";
  }

  if (q.includes('ubicacion') || q.includes('ubicación') || q.includes('donde') || q.includes('dónde') || q.includes('queda')) {
    return "Pollos Gran Combo está ubicado en el bulevar, cerca de la entrada al área climatizada.";
  }

  if (q.includes('whatsapp') || q.includes('telefono') || q.includes('teléfono') || q.includes('numero') || q.includes('número') || q.includes('contacto') || q.includes('pedir')) {
    return "Puedes hacer tus pedidos por WhatsApp al número +58 424 306 5534.";
  }

  if (q.includes('pollo') || q.includes('mega sonrisa') || q.includes('combo') || q.includes('familiar')) {
    return "Tienen combos desde individuales hasta familiares. Por ejemplo, el Mega Sonrisa cuesta 19.99 dólares e incluye 6 piezas de pollo, 2 raciones de arepitas, 2 raciones de papitas y 1 refresco de 1 litro.";
  }

  if (q.includes('belleza') || q.includes('tienda') || q.includes('peluqueria') || q.includes('estetica') || q.includes('cosmetics')) {
    return "Las tiendas de belleza disponibles son: Hallyu K-Beauty, Glossy Beauty Studio, MÏA Cosmetics, Studio 1118 y Vijones Beauty Bar.";
  }

  return "Según el documento de tiendas, Pollos Gran Combo ofrece las hamburguesas Master Burguer 2026, combos de pollo como el Mega Sonrisa, y también se encuentran disponibles tiendas de belleza como Hallyu K-Beauty y Glossy Beauty Studio. ¿En qué te puedo ayudar específicamente?";
}

export function useVoiceAssistant() {
  const [state, setState] = useState<AssistantState>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-init',
      role: 'assistant',
      text: 'Bienvenido a tu centro comercial inteligente, ¿En que puedo ayudarte?',
      timestamp: new Date(),
    },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [knowledgeDoc, setKnowledgeDoc] = useState<KnowledgeDocument>(DEFAULT_KNOWLEDGE_DOC);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voiceURI: '',
    voiceName: 'Voz en Español',
    voiceLang: 'es-ES',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    continuous: false,
    autoSpeak: true,
  });

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isRecognizingRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check speech recognition support
  const isSpeechRecognitionSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  // Initialize Web Speech Voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        // Find preferred Spanish voice
        const esVoice = voices.find(
          (v) => (v.lang.startsWith('es') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Paulina') || v.name.includes('Helena') || v.name.includes('Mónica') || v.name.includes('Jorge')))
        ) || voices.find((v) => v.lang.startsWith('es')) || voices[0];

        if (esVoice && !voiceSettings.voiceURI) {
          setVoiceSettings((prev) => ({
            ...prev,
            voiceURI: esVoice.voiceURI,
            voiceName: esVoice.name,
            voiceLang: esVoice.lang,
          }));
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [voiceSettings.voiceURI]);

  // Cleanup audio tracks
  const stopAudioCapture = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Setup live audio visualizer for mic
  const startAudioCapture = useCallback(async () => {
    try {
      stopAudioCapture();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(1, avg / 80); // scale 0 to 1
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (err) {
      console.warn('Microphone stream access not granted for visualization:', err);
    }
  }, [stopAudioCapture]);

  // Stop current AI speaking voice
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    currentUtteranceRef.current = null;
    if (state === 'speaking') {
      setState('idle');
      setAudioLevel(0);
    }
  }, [state]);

  // Speak AI response aloud using SpeechSynthesis
  const speakResponse = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !voiceSettings.autoSpeak) {
      setState('idle');
      return;
    }

    // Cancel previous speech
    window.speechSynthesis.cancel();

    // Clean text for speech (remove markdown asterisks, emojis)
    const cleanText = text
      .replace(/[*_#`~[\]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtteranceRef.current = utterance;

    // Pick configured voice
    const selectedVoice = availableVoices.find((v) => v.voiceURI === voiceSettings.voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      utterance.lang = 'es-ES';
    }

    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;

    utterance.onstart = () => {
      setState('speaking');
      // Simulate pulsating audio levels during speech
      const pulseInterval = setInterval(() => {
        if (stateRef.current !== 'speaking') {
          clearInterval(pulseInterval);
          return;
        }
        setAudioLevel(0.3 + Math.random() * 0.5);
      }, 100);
      (utterance as any)._pulseInterval = pulseInterval;
    };

    utterance.onend = () => {
      if ((utterance as any)._pulseInterval) {
        clearInterval((utterance as any)._pulseInterval);
      }
      setState('idle');
      setAudioLevel(0);
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      if ((utterance as any)._pulseInterval) {
        clearInterval((utterance as any)._pulseInterval);
      }
      setState('idle');
      setAudioLevel(0);
      currentUtteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  }, [availableVoices, voiceSettings]);

  // Auto-speak welcome greeting when app starts
  const hasSpokenWelcomeRef = useRef(false);

  useEffect(() => {
    if (hasSpokenWelcomeRef.current) return;

    const triggerWelcome = () => {
      if (hasSpokenWelcomeRef.current) return;
      hasSpokenWelcomeRef.current = true;
      speakResponse('Bienvenido a tu centro comercial inteligente, ¿En que puedo ayudarte?');
    };

    // Attempt auto-speech once speech synthesis engine is ready
    const timer = setTimeout(() => {
      triggerWelcome();
    }, 500);

    // Fallback if browser security blocks speech before first user interaction
    const handleFirstInteraction = () => {
      if (!hasSpokenWelcomeRef.current) {
        triggerWelcome();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [speakResponse]);

  // State ref for intervals & latest transcripts
  const stateRef = useRef(state);
  stateRef.current = state;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const knowledgeDocRef = useRef(knowledgeDoc);
  knowledgeDocRef.current = knowledgeDoc;
  const latestTranscriptRef = useRef<string>('');
  const silenceTimeoutRef = useRef<any>(null);
  const processQueryRef = useRef<(text: string) => Promise<void>>(async () => {});

  // Process a user query through backend Gemini API or local knowledge matcher
  const processQuery = useCallback(async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery) return;

    // Clear speech recognition
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    latestTranscriptRef.current = '';

    // Stop speaking if was active
    stopSpeaking();

    // Add user message to history
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: cleanQuery,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLiveTranscript('');
    setState('processing');
    setErrorMessage(null);

    let assistantResponseText = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanQuery,
          documentContext: knowledgeDocRef.current.content,
          history: messagesRef.current.slice(-4).map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      assistantResponseText = data.reply || data.text || matchLocalKnowledge(cleanQuery, knowledgeDocRef.current.content);
    } catch (err) {
      console.warn('Using local knowledge matcher fallback:', err);
      assistantResponseText = matchLocalKnowledge(cleanQuery, knowledgeDocRef.current.content);
    }

    const assistantMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      text: assistantResponseText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    speakResponse(assistantResponseText);
  }, [speakResponse, stopSpeaking]);

  processQueryRef.current = processQuery;

  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (stateRef.current === 'speaking') {
      stopSpeaking();
      return;
    }

    if (isRecognizingRef.current || stateRef.current === 'listening') {
      // Stop recognition and submit if we already captured speech
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      
      const textToSubmit = latestTranscriptRef.current.trim();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      stopAudioCapture();
      isRecognizingRef.current = false;
      
      if (textToSubmit) {
        processQueryRef.current(textToSubmit);
      } else {
        setState('idle');
      }
      return;
    }

    if (!isSpeechRecognitionSupported) {
      setErrorMessage('Tu navegador no soporta reconocimiento de voz. Usa la caja de texto inferior.');
      setState('error');
      return;
    }

    // Stop any ongoing speech
    stopSpeaking();
    latestTranscriptRef.current = '';

    try {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;

      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isRecognizingRef.current = true;
        setState('listening');
        setErrorMessage(null);
        setLiveTranscript('');
        latestTranscriptRef.current = '';
        startAudioCapture();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = (final || interim).trim();
        if (currentText) {
          latestTranscriptRef.current = currentText;
          setLiveTranscript(currentText);

          // Reset silence debounce timer (1.4s of quiet after speaking auto-submits)
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          silenceTimeoutRef.current = setTimeout(() => {
            if (isRecognizingRef.current && latestTranscriptRef.current.trim()) {
              if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
              }
              isRecognizingRef.current = false;
              stopAudioCapture();
              processQueryRef.current(latestTranscriptRef.current.trim());
            }
          }, 1400);
        }

        if (final && final.trim().length > 0) {
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
          isRecognizingRef.current = false;
          stopAudioCapture();
          processQueryRef.current(final.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        if (event.error === 'not-allowed') {
          isRecognizingRef.current = false;
          stopAudioCapture();
          setErrorMessage('Permiso de micrófono denegado. Permite el acceso para hablar.');
          setState('error');
        } else if (event.error === 'no-speech') {
          // If no speech was detected, gracefully return to idle
          if (!latestTranscriptRef.current.trim()) {
            isRecognizingRef.current = false;
            stopAudioCapture();
            setState('idle');
          }
        } else {
          isRecognizingRef.current = false;
          stopAudioCapture();
          setState('idle');
        }
      };

      recognition.onend = () => {
        isRecognizingRef.current = false;
        stopAudioCapture();
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        const captured = latestTranscriptRef.current.trim();
        if (stateRef.current === 'listening' && captured) {
          processQueryRef.current(captured);
        } else if (stateRef.current === 'listening') {
          setState('idle');
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage(err.message || 'No se pudo iniciar el micrófono');
      setState('error');
      stopAudioCapture();
    }
  }, [isSpeechRecognitionSupported, startAudioCapture, stopAudioCapture, stopSpeaking]);

  // Spacebar keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioCapture();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopAudioCapture]);

  const resetKnowledgeToDefault = () => {
    setKnowledgeDoc(DEFAULT_KNOWLEDGE_DOC);
  };

  const clearHistory = () => {
    setMessages([]);
    stopSpeaking();
  };

  return {
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
  };
}
