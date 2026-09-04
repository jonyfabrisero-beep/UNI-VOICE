import { useState, useEffect, useRef, useCallback } from 'react';
import { AssistantState, ChatMessage, VoiceSettings, KnowledgeDocument } from '../types';
import { DEFAULT_KNOWLEDGE_DOC } from '../data/defaultKnowledge';
import { UNICENTRO_SYSTEM_PROMPT } from '../data/assistantSystemPrompt';
import { UNICENTRO_MARACAY_DIRECTORY, CommercialEntity } from '../data/unicentroDirectory';

/**
 * Intelligent and robust conversational fallback engine for Unicentro Maracay.
 * Guarantees:
 * 1. Exclusive focus on Unicentro Maracay.
 * 2. Active inquiry on generic questions (food, shopping, beauty).
 * 3. Proactive follow-up questions / suggestions at the end of each response.
 * 4. Strict anti-repetition: if not found, explicitly states:
 *    "No encontré esa información específica en nuestro directorio de Unicentro Maracay..."
 *    instead of looping generic messages.
 */
function interpretContextConversational(
  query: string, 
  previousBotResponses: string[] = []
): { reply: string; sourceType: 'directory' | 'grounding' | 'pdf' } {
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Helper to check if a response was already said recently to avoid repeating
  const wasAlreadySaid = (candidate: string): boolean => {
    return previousBotResponses.some(prev => {
      const prevNorm = prev.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const candNorm = candidate.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return prevNorm.includes(candNorm.slice(0, 30)) || candNorm.includes(prevNorm.slice(0, 30));
    });
  };

  // 1. GREETINGS & AMBIGUOUS OPENINGS -> Proactive welcoming + open inquiry
  const greetingKeywords = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'quien eres', 'ayuda', 'como estas'];
  if (greetingKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "¡Hola! Bienvenido a Unicentro Maracay. Puedo orientarte sobre nuestro bulevar gastronómico, tiendas de moda, servicios, o eventos. ¿Qué te gustaría explorar hoy?",
      sourceType: 'directory'
    };
  }

  // 2. GENERIC FOOD / HUNGER -> Inquire to clarify cravings instead of dumping everything
  const genericFood = ['hambre', 'comer', 'comida', 'almorzar', 'almuerzo', 'cenar', 'cena', 'restaurante', 'restaurantes', 'antojo', 'picar', 'desayuno'];
  const hasGenericFood = genericFood.some(kw => q.includes(kw));

  // Specific restaurant requests:
  if (q.includes('pizza') || q.includes('beato') || q.includes('demaciao')) {
    return {
      reply: "En el bulevar cuentas con Beato Napoletano para auténtica pizza napolitana a la leña, y Demaciao Pizza para porciones y pizzas familiares. ¿Deseas saber en qué parte del bulevar se encuentran?",
      sourceType: 'directory'
    };
  }

  if (q.includes('sushi') || q.includes('cebiche') || q.includes('ceviche') || q.includes('japones') || q.includes('asiatic') || q.includes('orbe')) {
    return {
      reply: "Para comida japonesa y fusión peruana tienes Sushi & Cebiches, o puedes visitar Orbe Exotic Food con cocina asiática gourmet. ¿Te gustaría saber sus horarios o pedir por delivery?",
      sourceType: 'directory'
    };
  }

  if (q.includes('cafe') || q.includes('helado') || q.includes('gelato') || q.includes('postre') || q.includes('dulce') || q.includes('merienda') || q.includes('torta') || q.includes('frappe')) {
    return {
      reply: "Para merendar te recomiendo Ventus Café & Bistro con frappes y pastelería fina, o Biella Gelato con heladería artesanal italiana. ¿Buscas un café caliente o un postre frío?",
      sourceType: 'directory'
    };
  }

  if (q.includes('arabe') || q.includes('shawarma') || q.includes('falafel') || q.includes('lubnan')) {
    return {
      reply: "En el bulevar gastronómico tienes Lubnan Shawarmas con shawarmas de pollo o carne, cremas y falafel. ¿Te gustaría que te indique cómo llegar desde la entrada?",
      sourceType: 'directory'
    };
  }

  // Ingredients & Burgers (Pollos Gran Combo / Master Burguer)
  const ingredientKeywords = ['ingrediente', 'lleva', 'trae', 'contiene', 'prepara', 'receta', 'queso', 'tocineta', 'pan', 'gouda', 'kraft', 'parmesano', 'pretzel', 'brioche'];
  if (ingredientKeywords.some(kw => q.includes(kw))) {
    if (q.includes('monster') || q.includes('pretzel') || q.includes('gouda')) {
      return {
        reply: "La Monster Cheese de Pollos Gran Combo incluye pan pretzel, pollo crispy, queso gouda holandés, mermelada de tocineta, lechuga y salsa mayo ranch por 9 dólares con 99. ¿Deseas conocer su número de WhatsApp para pedirla?",
        sourceType: 'pdf'
      };
    }
    if (q.includes('doppio') || q.includes('kraft') || q.includes('brioche') || q.includes('estandar')) {
      return {
        reply: "La Doppio Cheese trae pan brioche con queso parmesano, pollo crispy, queso Kraft, tocineta crujiente, cebolla caramelizada y salsa ajo parmesano por 6 dólares con 99. ¿Te gustaría que te dé el contacto para delivery?",
        sourceType: 'pdf'
      };
    }
    return {
      reply: "En Pollos Gran Combo tienes la Doppio Cheese con queso Kraft ($6.99) y la Monster Cheese con queso gouda en pan pretzel ($9.99). ¿Prefieres sabores clásicos o una hamburguesa gourmet con pan pretzel?",
      sourceType: 'pdf'
    };
  }

  // Promos / Combos
  const priceKeywords = ['precio', 'costo', 'cuesta', 'vale', 'cuanto', 'promo', 'promocion', 'promociones', 'oferta', 'descuento', 'barato', 'economico', 'combo', 'dolar'];
  if (priceKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "En Pollos Gran Combo tienes la Doppio Cheese por $6.99, la Monster Cheese por $9.99 y el combo familiar Mega Sonrisa con 6 piezas de pollo por $19.99. ¿Buscas una opción individual o un combo familiar?",
      sourceType: 'pdf'
    };
  }

  // Generic food inquiry -> INQUIRE TO REFINE
  if (hasGenericFood) {
    return {
      reply: "En nuestro bulevar gastronómico tenemos pollo crispy y hamburguesas en Pollos Gran Combo, pizzas a la leña en Beato Napoletano, sushi en Sushi & Cebiches y carnes o comida árabe en Lubnan. ¿Qué tipo de comida te apetece hoy: algo rápido, comida internacional o un café con postre?",
      sourceType: 'directory'
    };
  }

  // 3. BEAUTY & AESTHETICS
  const beautyKeywords = ['belleza', 'maquillaje', 'cosmetico', 'cosmetica', 'peinado', 'cabello', 'pelo', 'unas', 'estetica', 'salon', 'peluqueria', 'spa', 'skincare', 'piel', 'k-beauty', 'hallyu', 'glossy', 'mia', 'studio 1118', 'vijones', 'carolina reveron'];
  if (beautyKeywords.some(kw => q.includes(kw))) {
    if (q.includes('unas') || q.includes('manicura') || q.includes('pedicura') || q.includes('vijones')) {
      return {
        reply: "Para uñas y manicura spa cuentas con Vijones Beauty Bar en el piso 1 y Carolina Reveron para quiropedia clínica. ¿Buscas un diseño de uñas o atención quiropódica?",
        sourceType: 'directory'
      };
    }
    if (q.includes('skincare') || q.includes('corean') || q.includes('piel') || q.includes('hallyu') || q.includes('serum')) {
      return {
        reply: "Para cuidado de la piel tienes Hallyu K-Beauty en el piso 1, con cosmética coreana y protectores virales. ¿Buscas una rutina facial completa o productos específicos?",
        sourceType: 'directory'
      };
    }
    return {
      reply: "En Unicentro Maracay tenemos Hallyu K-Beauty para skincare coreano, Glossy Beauty Studio para balayage y pestañas, MÏA Cosmetics y Vijones Beauty Bar para uñas. ¿Qué servicio de belleza te gustaría realizarte hoy?",
      sourceType: 'directory'
    };
  }

  // 4. SUPERMARKET & PHARMACY
  if (q.includes('farmacia') || q.includes('farmatodo') || q.includes('medicina') || q.includes('remedio') || q.includes('pastilla') || q.includes('salud')) {
    return {
      reply: "Contamos con Farmatodo en planta baja con acceso vehicular y peatonal para medicamentos y cuidado personal. ¿Necesitas saber si cuentan con estacionamiento cercano?",
      sourceType: 'directory'
    };
  }

  if (q.includes('supermercado') || q.includes('forum') || q.includes('mercado') || q.includes('viveres') || q.includes('compras') || q.includes('charcuteria') || q.includes('carniceria')) {
    return {
      reply: "Cuentas con Forum Súper Mayorista en la entrada principal para compras completas al mayor y detal. ¿Buscas artículos de mercado diario o víveres importados?",
      sourceType: 'directory'
    };
  }

  // 5. SERVICES, TRAVEL, TELECOM
  if (q.includes('viaje') || q.includes('boleto') || q.includes('vuelo') || q.includes('pasaje') || q.includes('viajea') || q.includes('turismo')) {
    return {
      reply: "En el piso 1 se encuentra la agencia Viajea, donde gestionan boletos aéreos nacionales e internacionales y paquetes turísticos. ¿Planeas un viaje nacional o al exterior?",
      sourceType: 'directory'
    };
  }

  if (q.includes('digitel') || q.includes('telefono') || q.includes('linea') || q.includes('chip') || q.includes('esim') || q.includes('saldo') || q.includes('recarga')) {
    return {
      reply: "En planta baja tienes el centro de atención Digitel para activación de líneas 4G, eSIM y recargas. ¿Deseas saber el horario de atención del centro de servicios?",
      sourceType: 'directory'
    };
  }

  // 6. CLOTHING & SHOES
  if (q.includes('zapato') || q.includes('calzado') || q.includes('ropa') || q.includes('moda') || q.includes('arrow') || q.includes('jump') || q.includes('jadu') || q.includes('camisa') || q.includes('traje')) {
    return {
      reply: "En moda y calzado tienes Jump y Jadu para zapatos deportivos y casuales, X Shoes e Invictus para calzado formal, y la boutique masculina ARROW. ¿Buscas ropa para dama, caballero o calzado deportivo?",
      sourceType: 'directory'
    };
  }

  // 7. HOURS & ADDRESS
  const scheduleKeywords = ['horario', 'hora', 'abierto', 'abren', 'cierran', 'atienden', 'domingo', 'hoy'];
  if (scheduleKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "Unicentro Maracay abre de lunes a domingo de 10:00 AM a 8:00 PM, y nuestro bulevar gastronómico atiende hasta las 10:00 o 11:00 de la noche. ¿Planeas visitarnos para almorzar o para cenar?",
      sourceType: 'directory'
    };
  }

  const locationKeywords = ['ubicacion', 'donde', 'queda', 'llegar', 'piso', 'direccion', 'casanova', 'maracay'];
  if (locationKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "Estamos ubicados en la Avenida José Casanova Godoy en Maracay, con más de 200 locales y amplio estacionamiento vigilado. ¿Vienes en vehículo propio o en transporte público?",
      sourceType: 'directory'
    };
  }

  // 8. CONTACT & WHATSAPP
  const contactKeywords = ['whatsapp', 'telefono', 'numero', 'contacto', 'pedir', 'pedido', 'delivery', 'domicilio', 'llamar'];
  if (contactKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "Para pedidos y delivery de Pollos Gran Combo puedes escribir al WhatsApp al +58 424 306 5534. ¿Deseas el número de algún otro restaurante de nuestro bulevar?",
      sourceType: 'pdf'
    };
  }

  // 9. DYNAMIC SEARCH IN LOCAL DIRECTORY (Word matching with commercial entities)
  const matchedEntity = UNICENTRO_MARACAY_DIRECTORY.find((entity: CommercialEntity) => {
    const matchName = q.includes(entity.name.toLowerCase());
    const matchKey = entity.keywords.some(k => q.includes(k));
    return matchName || matchKey;
  });

  if (matchedEntity) {
    const fallbackAnswer = `En Unicentro Maracay contamos con ${matchedEntity.name}, ubicado en ${matchedEntity.floor} (${matchedEntity.location}). Ofrecen ${matchedEntity.description.slice(0, 100)}... ¿Te gustaría saber cómo contactarlos o cómo llegar?`;
    if (!wasAlreadySaid(fallbackAnswer)) {
      return {
        reply: fallbackAnswer,
        sourceType: 'directory'
      };
    }
  }

  // 10. STRICT FALLBACK WHEN NOT FOUND (Anti-repetition requirement)
  // Instead of repeating previous messages, explicitly states:
  return {
    reply: "No encontré esa información específica en nuestro directorio de Unicentro Maracay. ¿Te gustaría que te recomiende tiendas similares o que busque en nuestras opciones del bulevar gastronómico?",
    sourceType: 'directory'
  };
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
      sourceType: 'directory',
    },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [knowledgeDoc, setKnowledgeDoc] = useState<KnowledgeDocument>(DEFAULT_KNOWLEDGE_DOC);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('uni_voice_settings');
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Could not read voice settings from localStorage');
      }
    }
    return {
      voiceURI: '',
      voiceName: 'Voz en Español',
      voiceLang: 'es-MX',
      rate: 0.98,
      pitch: 1.0,
      volume: 1.0,
      continuous: false,
      autoSpeak: true,
    };
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

  // Load browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Save voice settings to localStorage
  const updateVoiceSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setVoiceSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('uni_voice_settings', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not persist voice settings');
      }
      return updated;
    });
  }, []);

  // Find best Spanish voice available
  const findBestSpanishVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (availableVoices.length === 0) return null;

    if (voiceSettings.voiceURI) {
      const exact = availableVoices.find((v) => v.voiceURI === voiceSettings.voiceURI);
      if (exact) return exact;
    }

    const preferredLangs = ['es-MX', 'es-VE', 'es-US', 'es-CO', 'es-419', 'es-ES', 'es'];
    for (const lang of preferredLangs) {
      const matched = availableVoices.find((v) =>
        v.lang.toLowerCase().replace('_', '-').startsWith(lang.toLowerCase())
      );
      if (matched) return matched;
    }

    const genericSpanish = availableVoices.find((v) => v.lang.toLowerCase().startsWith('es'));
    return genericSpanish || availableVoices[0] || null;
  }, [availableVoices, voiceSettings.voiceURI]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (currentUtteranceRef.current) {
      if ((currentUtteranceRef.current as any)._pulseInterval) {
        clearInterval((currentUtteranceRef.current as any)._pulseInterval);
      }
      currentUtteranceRef.current = null;
    }
    setState('idle');
    setAudioLevel(0);
  }, []);

  // Speak response with fluid Text-To-Speech
  const speakResponse = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!voiceSettings.autoSpeak) return;

    window.speechSynthesis.cancel();

    // Clean formatting for crisp speech
    const cleanSpeech = text
      .replace(/[*#_~`]/g, '')
      .replace(/•\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpeech) {
      setState('idle');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    const selectedVoice = findBestSpanishVoice();

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'es-MX';
    }

    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;

    currentUtteranceRef.current = utterance;

    utterance.onstart = () => {
      setState('speaking');
      const pulseInterval = setInterval(() => {
        const simulatedAudio = 0.35 + Math.random() * 0.55;
        setAudioLevel(simulatedAudio);
      }, 90);
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

    setTimeout(() => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Failed to trigger speech synthesis:', err);
        setState('idle');
      }
    }, 40);
  }, [voiceSettings, findBestSpanishVoice]);

  // Auto-speak initial greeting once
  const hasSpokenWelcomeRef = useRef(false);

  useEffect(() => {
    if (hasSpokenWelcomeRef.current) return;

    const triggerWelcome = () => {
      if (hasSpokenWelcomeRef.current) return;
      hasSpokenWelcomeRef.current = true;
      speakResponse('Bienvenido a tu centro comercial inteligente, ¿En que puedo ayudarte?');
    };

    const timer = setTimeout(() => {
      triggerWelcome();
    }, 500);

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

  // State refs
  const stateRef = useRef(state);
  stateRef.current = state;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const knowledgeDocRef = useRef(knowledgeDoc);
  knowledgeDocRef.current = knowledgeDoc;
  const latestTranscriptRef = useRef<string>('');
  const silenceTimeoutRef = useRef<any>(null);
  const processQueryRef = useRef<(text: string) => Promise<void>>(async () => {});

  // Process user query through Gemini API with System Prompt and strict fallback
  const processQuery = useCallback(async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery) return;

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    latestTranscriptRef.current = '';

    stopSpeaking();

    // Append user message
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
    let sources: Array<{ title: string; uri?: string }> | undefined = undefined;
    let sourceType: 'directory' | 'grounding' | 'pdf' | undefined = 'directory';

    // Collect previous assistant replies to prevent repetition
    const previousReplies = messagesRef.current
      .filter(m => m.role === 'assistant')
      .map(m => m.text);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanQuery,
          systemPrompt: UNICENTRO_SYSTEM_PROMPT,
          documentContext: knowledgeDocRef.current.content,
          history: messagesRef.current.slice(-6).map((m) => ({
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
      sources = data.sources;
      sourceType = data.sourceType || 'directory';

      if (rawResponse) {
        assistantResponseText = rawResponse
          .replace(/[*#_~`]/g, '')
          .replace(/•\s*/g, '')
          .replace(/\n+/g, ' ')
          .trim();
      } else {
        const fb = interpretContextConversational(cleanQuery, previousReplies);
        assistantResponseText = fb.reply;
        sourceType = fb.sourceType;
      }
    } catch (err) {
      console.warn('Using robust local fallback for Unicentro Maracay:', err);
      const fb = interpretContextConversational(cleanQuery, previousReplies);
      assistantResponseText = fb.reply;
      sourceType = fb.sourceType;
    }

    const assistantMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      text: assistantResponseText,
      timestamp: new Date(),
      sourceType,
      sources,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    speakResponse(assistantResponseText);
  }, [speakResponse, stopSpeaking]);

  processQueryRef.current = processQuery;

  // Toggle voice recognition
  const toggleListening = useCallback(() => {
    if (stateRef.current === 'speaking') {
      stopSpeaking();
      return;
    }

    if (isRecognizingRef.current || stateRef.current === 'listening') {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Error stopping recognition:', e);
        }
      }
      isRecognizingRef.current = false;
      setState('idle');
      return;
    }

    if (!isSpeechRecognitionSupported) {
      setErrorMessage('El reconocimiento de voz no está disponible en este navegador.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-MX';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isRecognizingRef.current = true;
        setState('listening');
        setErrorMessage(null);
        setLiveTranscript('');
        latestTranscriptRef.current = '';
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            currentFinal += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        const combinedTranscript = (currentFinal || currentInterim).trim();
        if (combinedTranscript) {
          setLiveTranscript(combinedTranscript);
          latestTranscriptRef.current = combinedTranscript;
        }

        // Reset silence detection timeout (1.5s silence triggers query processing)
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        silenceTimeoutRef.current = setTimeout(() => {
          const textToSend = latestTranscriptRef.current.trim();
          if (textToSend) {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch (e) {
                // Ignore
              }
            }
            isRecognizingRef.current = false;
            processQueryRef.current(textToSend);
          }
        }, 1500);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition warning/error:', event.error);
        if (event.error === 'no-speech') {
          return;
        }
        if (event.error === 'not-allowed') {
          setErrorMessage('Permiso de micrófono denegado. Permite el acceso para hablar.');
        }
        isRecognizingRef.current = false;
        setState('idle');
      };

      recognition.onend = () => {
        isRecognizingRef.current = false;
        if (stateRef.current === 'listening') {
          setState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

      // Audio visualizer setup via Web Audio API
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          .then((stream) => {
            mediaStreamRef.current = stream;
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioCtx();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);

            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);

            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateVisualizer = () => {
              if (isRecognizingRef.current && analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                setAudioLevel(Math.min(1, average / 128));
                animFrameRef.current = requestAnimationFrame(updateVisualizer);
              }
            };
            updateVisualizer();
          })
          .catch((err) => {
            console.warn('Mic audio level capture optional fallback:', err);
          });
      }
    } catch (e) {
      console.error('Failed to initialize speech recognition:', e);
      setErrorMessage('No se pudo iniciar el reconocimiento de voz.');
      setState('idle');
    }
  }, [isSpeechRecognitionSupported, stopSpeaking]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update knowledge document
  const updateKnowledgeDoc = useCallback((doc: KnowledgeDocument) => {
    setKnowledgeDoc(doc);
  }, []);

  // Clear chat history
  const clearChatHistory = useCallback(() => {
    stopSpeaking();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: 'Bienvenido a tu centro comercial inteligente, ¿En que puedo ayudarte?',
        timestamp: new Date(),
        sourceType: 'directory',
      },
    ]);
  }, [stopSpeaking]);

  return {
    state,
    audioLevel,
    liveTranscript,
    messages,
    errorMessage,
    knowledgeDoc,
    voiceSettings,
    availableVoices,
    isSpeechRecognitionSupported,
    toggleListening,
    sendTextMessage: processQuery,
    processQuery,
    stopSpeaking,
    speakResponse,
    updateVoiceSettings,
    setVoiceSettings: updateVoiceSettings,
    updateKnowledgeDoc,
    clearChatHistory,
    clearHistory: clearChatHistory,
  };
}
