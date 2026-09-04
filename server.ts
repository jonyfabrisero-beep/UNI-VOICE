import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client (guarded lazy initialization)
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    hasApiKey: !!process.env.GEMINI_API_KEY,
    features: {
      webSynchronizer: true,
      searchGrounding: true,
      directoryCount: 20
    }
  });
});

// Dynamic Knowledge & Intent Interpreter (Universal Fallback & semantic analysis)
function extractKnowledgeAnswer(query: string, documentText: string): { reply: string; sourceType: 'directory' | 'grounding' | 'pdf' } {
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // 1. Food and restaurants in Unicentro
  if (q.includes('pizza') || q.includes('beato') || q.includes('demaciao')) {
    return {
      reply: "En Unicentro Maracay tienes Beato Napoletano con pizzas a la leña en el bulevar gastronómico, y Demaciao Pizza para pizzas rápidas familiares.",
      sourceType: 'directory'
    };
  }
  if (q.includes('sushi') || q.includes('cebiche') || q.includes('ceviche') || q.includes('japones') || q.includes('asiatic')) {
    return {
      reply: "Para comida japonesa y fusión peruana cuentas con Sushi & Cebiches en el bulevar, y Orbe Exotic Food con cócteles y comida asiática gourmet.",
      sourceType: 'directory'
    };
  }
  if (q.includes('cafe') || q.includes('helado') || q.includes('gelato') || q.includes('postre') || q.includes('torta') || q.includes('merienda')) {
    return {
      reply: "Para café y postres tienes Ventus Café & Bistro con cafés y frappes, o Biella Gelato con helados artesanales italianos en el bulevar.",
      sourceType: 'directory'
    };
  }
  if (q.includes('arabe') || q.includes('shawarma') || q.includes('falafel') || q.includes('lubnan')) {
    return {
      reply: "Para comida árabe tradicional tienes Lubnan Shawarmas en el bulevar gastronómico, con shawarmas de pollo o carne, falafel y cremas.",
      sourceType: 'directory'
    };
  }

  // 2. Ingredients of burgers
  const ingredientKeywords = ['ingrediente', 'lleva', 'trae', 'contiene', 'prepara', 'receta', 'queso', 'tocineta', 'pan', 'gouda', 'kraft', 'parmesano', 'pretzel', 'brioche'];
  if (ingredientKeywords.some(kw => q.includes(kw))) {
    if (q.includes('monster') || q.includes('premium') || q.includes('pretzel') || q.includes('gouda')) {
      return {
        reply: "La Monster Cheese de Pollos Gran Combo incluye pan pretzel, pollo crispy, queso gouda holandés, mermelada de tocineta, tira de tocineta extra, lechuga y salsa mayo ranch.",
        sourceType: 'pdf'
      };
    }
    if (q.includes('doppio') || q.includes('kraft') || q.includes('brioche') || q.includes('estandar') || q.includes('standard')) {
      return {
        reply: "La Doppio Cheese está preparada con pan brioche con queso parmesano, pollo crispy, queso Kraft, tocineta crujiente, cebolla caramelizada y salsa de ajo parmesano.",
        sourceType: 'pdf'
      };
    }
    return {
      reply: "En Pollos Gran Combo tienes dos deliciosas opciones: la Doppio Cheese con queso Kraft y cebolla caramelizada ($6.99), o la Monster Cheese con queso gouda holandés y mermelada de tocineta en pan pretzel ($9.99).",
      sourceType: 'pdf'
    };
  }

  // 3. Price & Promotions
  const priceKeywords = ['precio', 'costo', 'cuesta', 'vale', 'cuanto', 'promo', 'promocion', 'promociones', 'oferta', 'descuento', 'barato', 'economico', 'combo', 'dolar'];
  if (priceKeywords.some(kw => q.includes(kw))) {
    if (q.includes('barat') || q.includes('econom')) {
      return {
        reply: "La opción más económica de hamburguesa es la Doppio Cheese por 6 dólares con 99 centavos, o puedes optar por la Monster Cheese por 9 dólares con 99 centavos.",
        sourceType: 'pdf'
      };
    }
    return {
      reply: "En Pollos Gran Combo tienes la hamburguesa Doppio Cheese por $6.99, la Monster Cheese por $9.99 y el combo familiar Mega Sonrisa con 6 piezas de pollo, arepitas y papitas por $19.99.",
      sourceType: 'pdf'
    };
  }

  // 4. Beauty and Aesthetics
  const beautyKeywords = ['belleza', 'maquillaje', 'cosmetico', 'cosmetica', 'peinado', 'cabello', 'pelo', 'unas', 'estetica', 'salon', 'peluqueria', 'spa', 'skincare', 'piel', 'k-beauty', 'hallyu', 'glossy', 'mia', 'studio 1118', 'vijones'];
  if (beautyKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "En Unicentro Maracay contamos con varias tiendas de belleza: Hallyu K-Beauty para cosmética coreana, Glossy Beauty Studio, MÏA Cosmetics, Studio 1118 y Vijones Beauty Bar para uñas y estilismo.",
      sourceType: 'directory'
    };
  }

  // 5. Supermarket, Pharmacy, Services
  if (q.includes('farmacia') || q.includes('farmatodo') || q.includes('medicina') || q.includes('salud')) {
    return {
      reply: "Unicentro Maracay cuenta con Farmatodo en planta baja con atención para medicinas, conveniencia y cuidado personal.",
      sourceType: 'directory'
    };
  }
  if (q.includes('supermercado') || q.includes('forum') || q.includes('mercado') || q.includes('viveres') || q.includes('compras')) {
    return {
      reply: "Cuentas con Forum Súper Mayorista en el centro comercial para compras completas de alimentos, víveres y productos para el hogar.",
      sourceType: 'directory'
    };
  }
  if (q.includes('viaje') || q.includes('boleto') || q.includes('vuelo') || q.includes('viajea')) {
    return {
      reply: "En el nivel de servicios tienes la agencia Viajea para boletos nacionales e internacionales, paquetes de turismo y reservas.",
      sourceType: 'directory'
    };
  }
  if (q.includes('digitel') || q.includes('telefono') || q.includes('linea') || q.includes('chip') || q.includes('esim')) {
    return {
      reply: "En planta baja tienes el centro de atención Digitel para trámites móviles, planes 4G y recargas.",
      sourceType: 'directory'
    };
  }

  // 6. Contact, WhatsApp & Delivery
  const contactKeywords = ['whatsapp', 'telefono', 'numero', 'contacto', 'pedir', 'pedido', 'delivery', 'domicilio', 'llamar'];
  if (contactKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "Para realizar tus pedidos o consultar por delivery de Pollos Gran Combo, puedes escribir directamente al WhatsApp al +58 424 306 5534.",
      sourceType: 'pdf'
    };
  }

  // 7. Hours & Schedule
  const scheduleKeywords = ['horario', 'hora', 'abierto', 'abren', 'cierran', 'atienden'];
  if (scheduleKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "Unicentro Maracay abre de lunes a domingo de 10:00 AM a 8:00 PM, y los locales del bulevar gastronómico atienden hasta las 10:00 o 11:00 PM.",
      sourceType: 'directory'
    };
  }

  // 8. Location
  const locationKeywords = ['ubicacion', 'donde', 'queda', 'llegar', 'piso', 'bulevar', 'direccion', 'casanova'];
  if (locationKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "Unicentro Maracay se ubica en la Avenida José Casanova Godoy. Pollos Gran Combo está en el bulevar al lado de la entrada al área climatizada.",
      sourceType: 'directory'
    };
  }

  // 9. General food inquiry
  const foodKeywords = ['hambre', 'comer', 'comida', 'almorzar', 'almuerzo', 'cenar', 'cena', 'restaurante', 'menu', 'sabroso'];
  if (foodKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "En el bulevar gastronómico tienes deliciosas opciones: Pollos Gran Combo con pollo crispy y hamburguesas, Beato Napoletano con pizzas, Sushi & Cebiches o Zeta Burger.",
      sourceType: 'directory'
    };
  }

  // 10. Greetings
  const greetingKeywords = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'quien eres', 'ayuda'];
  if (greetingKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "¡Hola! Bienvenido a Unicentro Maracay. Te puedo orientar sobre tiendas, bulevar gastronómico, belleza, servicios y promociones. ¿Qué deseas consultar?",
      sourceType: 'directory'
    };
  }

  return {
    reply: "Te puedo brindar información sobre tiendas, restaurantes del bulevar gastronómico, horarios de Unicentro Maracay y las promociones de Pollos Gran Combo. ¿En qué te puedo asesorar?",
    sourceType: 'directory'
  };
}

// Helper: Determine if a query requires live Google Search Grounding
function shouldTriggerSearchGrounding(query: string): boolean {
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const dynamicTriggers = [
    'evento', 'eventos', 'esta semana', 'semana', 'este fin de semana', 'fin de semana',
    'hoy', 'cartelera', 'cine', 'concierto', 'musica en vivo', 'noticia', 'novedad', 'novedades',
    'actividad', 'actividades', 'carrera', 'maraton', 'mcy run', 'promocion del mes',
    'concurso', 'sorteo', 'dia de las madres', 'dia del padre', 'navidad', 'carnaval',
    'proximo', 'proximamente', 'inauguracion', 'nueva tienda', 'actual', 'reciente'
  ];

  return dynamicTriggers.some(trigger => q.includes(trigger));
}

// Chat & Knowledge Q&A API
app.post("/api/chat", async (req, res) => {
  try {
    const { message, documentContext, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Parámetro 'message' es requerido." });
    }

    const ai = getAIClient();

    // If Gemini client is available, execute hybrid knowledge resolution:
    // Synchronizer (Stores, Menus, Floors) + Google Search Grounding (Live events, news, dynamic queries)
    if (ai) {
      const needsSearchGrounding = shouldTriggerSearchGrounding(message);
      
      const systemInstruction = `Eres "Uni Voice", el asistente conversacional por voz oficial e inteligente de Unicentro Maracay (ubicado en Av. José Casanova Godoy, Maracay, Venezuela).
Tu tono es cálido, empático, profesional y en ESPAÑOL LATINOAMERICANO fluido.

BASE DE CONOCIMIENTO SINCRONIZADA (DIRECTORIO OFICIAL, TIENDAS, MENÚS Y PISOS FIJOS):
"""
${documentContext || 'Directorio comercial y gastronómico de Unicentro Maracay y Pollos Gran Combo'}
"""

ESTRATEGIA HÍBRIDA DE CONOCIMIENTO:
1. SINCRONIZADOR WEB Y BASE FIJA:
   - Utiliza la base de conocimiento sincronizada arriba para responder de inmediato sobre tiendas, restaurantes del bulevar (Pollos Gran Combo, Beato Napoletano, Sushi & Cebiches, Ventus, Biella Gelato, etc.), cosmética (Hallyu K-Beauty, Glossy, etc.), supermercado (Forum), farmacia (Farmatodo), servicios (Viajea, Digitel), pisos, horarios e ingredientes.
2. GOOGLE SEARCH GROUNDING (NOVEDADES Y EVENTOS):
   - ${needsSearchGrounding ? 'Esta consulta requiere información reciente o novedades. Usa la herramienta de búsqueda de Google para complementar con eventos de la semana, actividades culturales, deportivas o noticias en Unicentro Maracay.' : 'Prioriza responder con precisión inmediata sobre la información fija del centro comercial.'}

FORMATO ESTRICTO PARA SÍNTESIS DE VOZ (TEXT-TO-SPEECH):
- Responde en 2 a 3 oraciones claras, fluidas y cálidas (máximo 45 palabras).
- NUNCA uses símbolos de markdown (*, **, viñetas -, numerales # ni tablas).
- Expresa los precios y cifras en palabras naturales (ej. "seis dólares con noventa y nueve centavos" o "$6.99").`;

      let promptContents = message;
      if (history && Array.isArray(history) && history.length > 0) {
        const recentHistory = history.map((h: any) => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.text}`).join('\n');
        promptContents = `Historial reciente:\n${recentHistory}\n\nPregunta actual del usuario: ${message}`;
      }

      // Try with Search Grounding if query is dynamic or novel
      if (needsSearchGrounding) {
        try {
          const groundedResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `En el contexto de Unicentro Maracay (Maracay, Venezuela): ${promptContents}`,
            config: {
              systemInstruction,
              temperature: 0.6,
              tools: [{ googleSearch: {} }],
            },
          });

          const groundedReply = groundedResponse.text?.trim()
            ?.replace(/[*#_~`]/g, '')
            ?.replace(/•\s*/g, '')
            ?.replace(/\n+/g, ' ');

          // Extract grounding metadata sources if available
          const searchChunks = groundedResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const sources: Array<{ title: string; uri?: string }> = [];
          
          for (const chunk of searchChunks) {
            if (chunk.web?.title && chunk.web?.uri) {
              sources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
          }

          if (groundedReply) {
            return res.json({
              reply: groundedReply,
              sourceType: 'grounding',
              sources: sources.slice(0, 3),
            });
          }
        } catch (groundingErr) {
          console.warn("Fallo o límite en Search Grounding, continuando con respuesta sincronizada:", groundingErr);
        }
      }

      // Fast Synchronizer & Base Knowledge generation
      try {
        const syncResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptContents,
          config: {
            systemInstruction,
            temperature: 0.5,
          },
        });

        const syncReply = syncResponse.text?.trim()
          ?.replace(/[*#_~`]/g, '')
          ?.replace(/•\s*/g, '')
          ?.replace(/\n+/g, ' ');

        if (syncReply) {
          return res.json({
            reply: syncReply,
            sourceType: 'directory',
          });
        }
      } catch (geminiErr) {
        console.warn("Error en modelo estándar, recurriendo a motor semántico local:", geminiErr);
      }
    }

    // Smart Local Knowledge Base fallback with semantic NLP intent interpretation
    const fallbackAnswer = extractKnowledgeAnswer(message, documentContext || '');
    return res.json({
      reply: fallbackAnswer.reply,
      sourceType: fallbackAnswer.sourceType,
    });
  } catch (error: any) {
    console.error("Error al procesar consulta en /api/chat:", error);
    const fallbackAnswer = extractKnowledgeAnswer(req.body?.message || '', req.body?.documentContext || '');
    res.json({
      reply: fallbackAnswer.reply,
      sourceType: fallbackAnswer.sourceType,
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
