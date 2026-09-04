import { useState, useEffect, useRef, useCallback } from 'react';
import { AssistantState, ChatMessage, VoiceSettings, KnowledgeDocument } from '../types';
import { DEFAULT_KNOWLEDGE_DOC } from '../data/defaultKnowledge';

// Fallback matching with semantic NLP intent interpretation (Latin American Spanish)
function matchLocalKnowledge(query: string, content: string): string {
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Food, hunger, meal, burger, chicken, combos, cravings
  const foodKeywords = [
    'hambre', 'comer', 'comida', 'almorzar', 'almuerzo', 'cenar', 'cena', 'plato', 'picar', 'antojo',
    'hamburguesa', 'burger', 'burguer', 'doppio', 'monster', 'pollo', 'crispy', 'combo', 'arepitas',
    'papas', 'papitas', 'refresco', 'carne', 'rapida', 'restaurante', 'menu', 'sabroso', 'rico'
  ];
  const hasFoodIntent = foodKeywords.some(kw => q.includes(kw));

  // 2. Ingredients, contents, recipe, cheese, bacon, bread
  const ingredientKeywords = [
    'ingrediente', 'lleva', 'trae', 'contiene', 'prepara', 'receta', 'queso', 'tocineta', 'pan',
    'salsa', 'cebolla', 'lechuga', 'gouda', 'kraft', 'parmesano', 'pretzel', 'brioche', 'mayo', 'ranch'
  ];
  const hasIngredientIntent = ingredientKeywords.some(kw => q.includes(kw));

  // 3. Price, cost, promos, cheap, expensive
  const priceKeywords = [
    'precio', 'costo', 'cuesta', 'vale', 'cuanto', 'promo', 'promocion', 'promociones', 'oferta',
    'descuento', 'barato', 'economico', 'combo'
  ];
  const hasPriceIntent = priceKeywords.some(kw => q.includes(kw));

  // 4. Beauty, salon, aesthetics, cosmetics, hair, nails, skincare
  const beautyKeywords = [
    'belleza', 'maquillaje', 'cosmetico', 'cosmetica', 'peinado', 'cabello', 'pelo', 'unas',
    'estetica', 'salon', 'peluqueria', 'spa', 'skincare', 'piel', 'coreano', 'k-beauty', 'hallyu',
    'glossy', 'mia', 'studio 1118', 'vijones', 'mujer', 'arreglarme', 'ponerme linda', 'linda', 'guapa'
  ];
  const hasBeautyIntent = beautyKeywords.some(kw => q.includes(kw));

  // 5. Schedule, hours, open, close, time
  const scheduleKeywords = [
    'horario', 'hora', 'abierto', 'abren', 'cierran', 'atienden', 'tiempo', 'tarde', 'noche', 'domingo', 'hoy'
  ];
  const hasScheduleIntent = scheduleKeywords.some(kw => q.includes(kw));

  // 6. Location, where is it, directions, floor
  const locationKeywords = [
    'ubicacion', 'donde', 'queda', 'llegar', 'piso', 'bulevar', 'entrada', 'sitio', 'direccion', 'local'
  ];
  const hasLocationIntent = locationKeywords.some(kw => q.includes(kw));

  // 7. Delivery, phone, contact, whatsapp, order
  const contactKeywords = [
    'whatsapp', 'telefono', 'numero', 'contacto', 'pedir', 'pedido', 'delivery', 'domicilio', 'llamar', 'envio'
  ];
  const hasContactIntent = contactKeywords.some(kw => q.includes(kw));

  // 8. Greetings
  const greetingKeywords = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'quien eres', 'ayuda'];
  const hasGreetingIntent = greetingKeywords.some(kw => q.includes(kw));

  if (hasIngredientIntent) {
    if (q.includes('monster') || q.includes('premium') || q.includes('pretzel') || q.includes('gouda')) {
      return "La Monster Cheese de Pollos Gran Combo lleva pan pretzel, pollo crispy, queso gouda holandés, mermelada de tocineta, tira de tocineta extra, lechuga fresca y salsa mayo ranch.";
    }
    if (q.includes('doppio') || q.includes('kraft') || q.includes('brioche') || q.includes('estandar') || q.includes('standard')) {
      return "La Doppio Cheese lleva pan brioche coronado con queso parmesano, pollo crispy, queso Kraft, tocineta crujiente, cebolla caramelizada y salsa de ajo parmesano.";
    }
    return "En Pollos Gran Combo tienes la Doppio Cheese con queso Kraft, tocineta y cebolla caramelizada, o la Monster Cheese con queso gouda holandés, mermelada de tocineta y pan pretzel.";
  }

  if (hasPriceIntent) {
    return "En Pollos Gran Combo tienes la hamburguesa Doppio Cheese por $6.99, la Monster Cheese por $9.99 y el combo familiar Mega Sonrisa con 6 piezas de pollo, arepitas y papitas por $19.99.";
  }

  if (hasBeautyIntent) {
    return "Para belleza y cuidado personal tienes excelentes opciones: Hallyu K-Beauty con cosmética coreana, Glossy Beauty Studio, MÏA Cosmetics, Studio 1118 y Vijones Beauty Bar para uñas y estilismo.";
  }

  if (hasContactIntent) {
    return "Puedes hacer tus pedidos o solicitar delivery directamente por WhatsApp al número +58 424 306 5534.";
  }

  if (hasScheduleIntent) {
    return "Pollos Gran Combo está abierto todos los días de 10:00 de la mañana a 10:00 de la noche.";
  }

  if (hasLocationIntent) {
    return "Pollos Gran Combo se encuentra ubicado en el bulevar del centro comercial, justo al lado de la entrada al área climatizada.";
  }

  if (hasFoodIntent) {
    return "Si buscas algo delicioso para comer, en Pollos Gran Combo te sugiero probar las hamburguesas Master Burguer: la Doppio Cheese por $6.99 o la Monster Cheese por $9.99, además de sus combos de pollo crispy.";
  }

  if (hasGreetingIntent) {
    return "¡Hola! Con mucho gusto te ayudo. En el centro comercial te puedo informar sobre Pollos Gran Combo (hamburguesas, combos y pedidos) o sobre nuestras tiendas de belleza. ¿Qué te gustaría saber?";
  }

  return "Te puedo ayudar con información de Pollos Gran Combo, como sus hamburguesas Doppio y Monster Cheese, combos familiares, horarios, ubicación y WhatsApp, o también sobre nuestras tiendas de belleza disponibles. ¿Cuál te interesa?";
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

  // Helper to score and select the highest quality natural Latin American Spanish voice
  const findBestSpanishVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    if (!voices || voices.length === 0) return undefined;

    const spanishVoices = voices.filter((v) => 
      v.lang.toLowerCase().startsWith('es') || 
      v.lang.toLowerCase().includes('419') || 
      v.lang.toLowerCase().includes('mx') ||
      v.lang.toLowerCase().includes('us') ||
      v.lang.toLowerCase().includes('co') ||
      v.lang.toLowerCase().includes('ve') ||
      v.lang.toLowerCase().includes('ar') ||
      v.lang.toLowerCase().includes('cl')
    );

    const targetList = spanishVoices.length > 0 ? spanishVoices : voices;

    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      let score = 0;
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();

      // Top priority 1: Latin American Spanish regions
      if (lang.includes('419') || lang.includes('mx') || lang.includes('us') || lang.includes('co') || lang.includes('ve') || lang.includes('ar') || lang.includes('cl') || lang.includes('pe')) {
        score += 150;
      }

      // Top priority 2: Modern Natural / Neural / Online voices
      if (name.includes('natural') || name.includes('online')) score += 120;
      if (name.includes('neural')) score += 110;
      if (name.includes('enhanced') || name.includes('premium')) score += 90;
      if (name.includes('google')) score += 80;
      if (name.includes('microsoft')) score += 75;
      if (name.includes('apple') || name.includes('siri')) score += 70;

      // Well-known natural human-modeled Latin voices
      if (
        name.includes('dalia') ||
        name.includes('sabina') ||
        name.includes('salome') ||
        name.includes('jorge') ||
        name.includes('gonzalo') ||
        name.includes('paulina') ||
        name.includes('diego') ||
        name.includes('luciana') ||
        name.includes('sofia') ||
        name.includes('mia') ||
        name.includes('alvaro') ||
        name.includes('carlos')
      ) {
        score += 60;
      }

      // Penalize legacy robotic desktop synthesizers & non-Latin voices if Latin is available
      if (name.includes('desktop') || name.includes('espeak') || name.includes('compact') || name.includes('synthesizer')) {
        score -= 50;
      }

      // Lower priority for Spain accent if user asked for Latin American Spanish
      if (lang === 'es-es') {
        score -= 20;
      }

      return score;
    };

    const sorted = [...targetList].sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return sorted[0];
  };

  // Initialize Web Speech Voices with Natural Voice Priority
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        const bestVoice = findBestSpanishVoice(voices);

        if (bestVoice && !voiceSettings.voiceURI) {
          setVoiceSettings((prev) => ({
            ...prev,
            voiceURI: bestVoice.voiceURI,
            voiceName: bestVoice.name,
            voiceLang: bestVoice.lang,
            rate: 0.98,
            pitch: 1.02,
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

    // Clean and normalize text for natural conversational speech
    const cleanText = text
      .replace(/https?:\/\/\S+/gi, '') // remove URLs
      .replace(/[*_#`~[\]()<>]/g, '') // remove markdown artifacts
      .replace(/\bc\/u\b/gi, 'cada una')
      .replace(/\bej\./gi, 'por ejemplo')
      .replace(/\bwhatsapp\b/gi, 'Guasap')
      .replace(/\bpromos?\b/gi, 'promociones')
      .replace(/[:;]\s*/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtteranceRef.current = utterance;

    // Pick configured voice or best available Spanish voice
    const selectedVoice = availableVoices.find((v) => v.voiceURI === voiceSettings.voiceURI) || findBestSpanishVoice(availableVoices);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'es-419';
    }

    utterance.rate = voiceSettings.rate || 0.98;
    utterance.pitch = voiceSettings.pitch || 1.02;
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

      // Configure Speech Recognition for Latin American Spanish
      const userBrowserLang = typeof navigator !== 'undefined' ? navigator.language : 'es-419';
      recognition.lang = userBrowserLang.startsWith('es') ? userBrowserLang : 'es-419';
      recognition.continuous = true;
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
        let fullTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }

        const currentText = fullTranscript.trim();
        if (currentText) {
          latestTranscriptRef.current = currentText;
          setLiveTranscript(currentText);

          // Reset silence debounce timer (1.2s of quiet after speaking auto-submits)
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          silenceTimeoutRef.current = setTimeout(() => {
            if (isRecognizingRef.current && latestTranscriptRef.current.trim()) {
              const textToSend = latestTranscriptRef.current.trim();
              if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
              }
              isRecognizingRef.current = false;
              stopAudioCapture();
              processQueryRef.current(textToSend);
            }
          }, 1200);
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
          // If no speech was detected yet, don't crash, keep listening or gracefully stop
          if (!latestTranscriptRef.current.trim()) {
            isRecognizingRef.current = false;
            stopAudioCapture();
            setState('idle');
          }
        } else {
          const textToSubmit = latestTranscriptRef.current.trim();
          isRecognizingRef.current = false;
          stopAudioCapture();
          if (textToSubmit) {
            processQueryRef.current(textToSubmit);
          } else {
            setState('idle');
          }
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
