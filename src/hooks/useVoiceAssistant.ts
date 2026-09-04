import { useState, useEffect, useRef, useCallback } from 'react';
import { AssistantState, ChatMessage, VoiceSettings, KnowledgeDocument } from '../types';
import { DEFAULT_KNOWLEDGE_DOC } from '../data/defaultKnowledge';

// Dynamic conversational & semantic intent interpreter (Universal fallback & contextual reasoner)
function interpretContextConversational(query: string, documentContent: string): string {
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const doc = documentContent || "";
  const docLower = doc.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Food, hunger, meal, burger, chicken, combos, cravings
  const foodKeywords = [
    'hambre', 'comer', 'comida', 'almorzar', 'almuerzo', 'cenar', 'cena', 'plato', 'picar', 'antojo',
    'hamburguesa', 'burger', 'burguer', 'doppio', 'monster', 'pollo', 'crispy', 'combo', 'arepitas',
    'papas', 'papitas', 'refresco', 'carne', 'rapida', 'restaurante', 'menu', 'sabroso', 'rico', 'alimento'
  ];
  const hasFoodIntent = foodKeywords.some(kw => q.includes(kw));

  // 2. Ingredients, contents, recipe, cheese, bacon, bread
  const ingredientKeywords = [
    'ingrediente', 'lleva', 'trae', 'contiene', 'prepara', 'receta', 'queso', 'tocineta', 'pan',
    'salsa', 'cebolla', 'lechuga', 'gouda', 'kraft', 'parmesano', 'pretzel', 'brioche', 'mayo', 'ranch'
  ];
  const hasIngredientIntent = ingredientKeywords.some(kw => q.includes(kw));

  // 3. Price, cost, promos, discounts, cheap, expensive
  const priceKeywords = [
    'precio', 'costo', 'cuesta', 'vale', 'cuanto', 'promo', 'promocion', 'promociones', 'oferta',
    'descuento', 'barato', 'economico', 'combo', 'dolar', 'dolares'
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
    'horario', 'hora', 'abierto', 'abren', 'cierran', 'atienden', 'tiempo', 'tarde', 'noche', 'domingo', 'hoy', 'manana'
  ];
  const hasScheduleIntent = scheduleKeywords.some(kw => q.includes(kw));

  // 6. Location, where is it, directions, floor
  const locationKeywords = [
    'ubicacion', 'donde', 'queda', 'llegar', 'piso', 'bulevar', 'entrada', 'sitio', 'direccion', 'local', 'lugar'
  ];
  const hasLocationIntent = locationKeywords.some(kw => q.includes(kw));

  // 7. Delivery, phone, contact, whatsapp, order
  const contactKeywords = [
    'whatsapp', 'telefono', 'numero', 'contacto', 'pedir', 'pedido', 'delivery', 'domicilio', 'llamar', 'envio'
  ];
  const hasContactIntent = contactKeywords.some(kw => q.includes(kw));

  // 8. Greetings & general assistance
  const greetingKeywords = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'quien eres', 'ayuda'];
  const hasGreetingIntent = greetingKeywords.some(kw => q.includes(kw));

  // Conversational Intent Resolution:
  if (hasIngredientIntent) {
    if (q.includes('monster') || q.includes('premium') || q.includes('pretzel') || q.includes('gouda')) {
      return "La hamburguesa Monster Cheese lleva pan pretzel, pollo crispy, queso gouda holandés, mermelada de tocineta, tira de tocineta extra, lechuga fresca y salsa mayo ranch.";
    }
    if (q.includes('doppio') || q.includes('kraft') || q.includes('brioche') || q.includes('estandar') || q.includes('standard')) {
      return "La hamburguesa Doppio Cheese viene con pan brioche con queso parmesano, pollo crispy, queso Kraft, tocineta crujiente, cebolla caramelizada y salsa de ajo parmesano.";
    }
    return "En Pollos Gran Combo tienes la Doppio Cheese con queso Kraft y cebolla caramelizada, o la Monster Cheese con queso gouda holandés y mermelada de tocineta en pan pretzel.";
  }

  if (hasPriceIntent) {
    if (q.includes('barat') || q.includes('econom') || q.includes('menor')) {
      return "La opción más económica de hamburguesa es la Doppio Cheese por 6 dólares con 99 centavos, mientras que la Monster Cheese cuesta 9 dólares con 99 centavos.";
    }
    return "En Pollos Gran Combo tienes la hamburguesa Doppio Cheese por $6.99, la Monster Cheese por $9.99 y el combo familiar Mega Sonrisa con 6 piezas de pollo, arepitas y papitas por $19.99.";
  }

  if (hasBeautyIntent) {
    return "En el centro comercial contamos con varias tiendas de belleza: Hallyu K-Beauty para cosmética coreana, Glossy Beauty Studio, MÏA Cosmetics, Studio 1118 y Vijones Beauty Bar para estilismo y uñas.";
  }

  if (hasContactIntent) {
    return "Puedes hacer tus pedidos o solicitar delivery directamente por WhatsApp escribiendo al número +58 424 306 5534.";
  }

  if (hasScheduleIntent) {
    return "Pollos Gran Combo está abierto todos los días desde las 10:00 de la mañana hasta las 10:00 de la noche.";
  }

  if (hasLocationIntent) {
    return "Pollos Gran Combo se encuentra ubicado en el bulevar del centro comercial, justo al lado de la entrada al área climatizada.";
  }

  if (hasFoodIntent) {
    return "Si buscas algo sabroso para comer, en Pollos Gran Combo te recomiendo probar las hamburguesas Master Burguer: la Doppio Cheese por $6.99 o la Monster Cheese por $9.99, además de sus combos de pollo crispy.";
  }

  if (hasGreetingIntent) {
    return "¡Hola! Con mucho gusto te ayudo. En el centro comercial te puedo informar sobre las promociones y opciones de Pollos Gran Combo o sobre nuestras tiendas de belleza. ¿Qué te gustaría saber?";
  }

  // Dynamic excerpt synthesis if custom document is loaded
  if (doc && !docLower.includes('pollos gran combo')) {
    const lines = doc.split('\n').filter(l => l.trim().length > 0);
    const words = q.split(' ').filter(w => w.length > 3);
    const matchedLine = lines.find(l => {
      const lineLower = l.toLowerCase();
      return words.some(w => lineLower.includes(w));
    });
    if (matchedLine) {
      return `De acuerdo a la información disponible: ${matchedLine.replace(/[#*•-]/g, '').trim()}`;
    }
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

    // Strictly filter for Spanish voices and discard English/foreign synthesizers
    const spanishVoices = voices.filter((v) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      const isSpanish = l.startsWith('es') || l.includes('spa') || n.includes('spanish') || n.includes('español');
      const isEnglish = n.includes('english') || (l.startsWith('en') && !n.includes('spanish'));
      return isSpanish && !isEnglish;
    });

    const candidateList = spanishVoices.length > 0 ? spanishVoices : voices.filter(v => v.lang.toLowerCase().startsWith('es'));
    if (candidateList.length === 0) return undefined;

    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      let score = 0;
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();

      // Priority 1: Latin American Spanish specific dialects
      if (lang === 'es-mx' || lang === 'es_mx') score += 180;
      if (lang.includes('419') || lang.includes('co') || lang.includes('ve') || lang.includes('ar') || lang.includes('cl') || lang.includes('pe')) score += 160;
      if (lang === 'es-us' && (name.includes('natural') || name.includes('online') || name.includes('google'))) score += 140;

      // Priority 2: Google & Microsoft Natural/Neural Latin voices
      if (name.includes('google español') || name.includes('google spanish')) score += 150;
      if (name.includes('dalia') || name.includes('jorge') || name.includes('sabina') || name.includes('salome') || name.includes('gonzalo') || name.includes('paulina')) score += 140;
      if (name.includes('natural') || name.includes('online')) score += 120;
      if (name.includes('neural')) score += 110;
      if (name.includes('enhanced') || name.includes('premium')) score += 90;
      if (name.includes('apple') || name.includes('siri') || name.includes('monica') || name.includes('sofia')) score += 80;

      // Penalize robotic synthesizers or non-Latin
      if (name.includes('desktop') || name.includes('espeak') || name.includes('compact') || name.includes('synthesizer')) {
        score -= 60;
      }

      if (lang === 'es-es') {
        score += 30; // Spanish from Spain is better than English fallback, but lower than Latin
      }

      return score;
    };

    const sorted = [...candidateList].sort((a, b) => scoreVoice(b) - scoreVoice(a));
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

        if (bestVoice) {
          setVoiceSettings((prev) => ({
            ...prev,
            voiceURI: bestVoice.voiceURI,
            voiceName: bestVoice.name,
            voiceLang: bestVoice.lang,
            rate: 0.98,
            pitch: 1.0,
          }));
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

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

  // Audio level simulator & optional visualizer
  const startAudioCapture = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        if (stream) {
          mediaStreamRef.current = stream;
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;

            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateVisual = () => {
              if (stateRef.current !== 'listening') return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(1, Math.max(0.15, avg / 128)));
              animFrameRef.current = requestAnimationFrame(updateVisual);
            };
            updateVisual();
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Audio visualization fallback:', e);
    }

    // Fallback pulse if AudioContext is unavailable
    const interval = setInterval(() => {
      if (stateRef.current !== 'listening') {
        clearInterval(interval);
        return;
      }
      setAudioLevel(0.25 + Math.random() * 0.45);
    }, 120);
  }, []);

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

    // Dynamically retrieve fresh voices from browser in case they loaded late
    const currentVoices = window.speechSynthesis.getVoices();
    const voicePool = currentVoices.length > 0 ? currentVoices : availableVoices;
    const selectedVoice = voicePool.find((v) => v.voiceURI === voiceSettings.voiceURI) || findBestSpanishVoice(voicePool);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'es-MX';
    }

    utterance.rate = voiceSettings.rate || 0.98;
    utterance.pitch = voiceSettings.pitch || 1.0;
    utterance.volume = voiceSettings.volume;

    utterance.onstart = () => {
      setState('speaking');
      let speechStep = 0;
      // Multi-harmonic vocal cadence generator (syllables, phrase cadence & volume dynamics)
      const pulseInterval = setInterval(() => {
        if (stateRef.current !== 'speaking') {
          clearInterval(pulseInterval);
          return;
        }
        speechStep += 0.18;
        // Syllable rhythm (~6Hz) + Phrase breathing wave (~1.5Hz) + Micro-fluctuation
        const syllableWave = Math.sin(speechStep * 3.2) * 0.35 + 0.35;
        const phraseWave = Math.sin(speechStep * 0.8) * 0.25 + 0.25;
        const jitter = (Math.random() - 0.5) * 0.2;
        const calculatedLevel = Math.max(0.15, Math.min(1.0, syllableWave * 0.6 + phraseWave * 0.3 + jitter + 0.2));
        setAudioLevel(calculatedLevel);
      }, 50);
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

    // Small delay to ensure synthesis queue is cleared
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Failed to trigger speech synthesis:', err);
        setState('idle');
      }
    }, 50);
  }, [availableVoices, voiceSettings, findBestSpanishVoice]);

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
      const rawResponse = data.reply || data.text || '';
      
      // Clean up markdown/bullet points so it sounds natural in TTS & reads clearly
      assistantResponseText = rawResponse
        ? rawResponse.replace(/[*#_~`]/g, '').replace(/•\s*/g, '').replace(/\n+/g, ' ').trim()
        : interpretContextConversational(cleanQuery, knowledgeDocRef.current.content);
    } catch (err) {
      console.warn('Using local conversational semantic interpreter fallback:', err);
      assistantResponseText = interpretContextConversational(cleanQuery, knowledgeDocRef.current.content);
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

      // Configure Speech Recognition for Latin American Spanish (es-MX is the standard Latin American dialect recognized by all browsers)
      const userBrowserLang = typeof navigator !== 'undefined' ? (navigator.language || '').toLowerCase() : '';
      if (userBrowserLang.startsWith('es') && userBrowserLang !== 'es-419') {
        recognition.lang = userBrowserLang;
      } else {
        recognition.lang = 'es-MX';
      }

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

          // Reset silence debounce timer (900ms of quiet after speaking auto-submits)
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
          }, 950);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          isRecognizingRef.current = false;
          stopAudioCapture();
          setErrorMessage('Permiso de micrófono no otorgado. Por favor permite el acceso al micrófono.');
          setState('error');
        } else if (event.error === 'no-speech') {
          // Keep listening or if user finished, process
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
