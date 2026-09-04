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
      exclusiveUnicentroPrompt: true,
      strictFallbackAntiRepetition: true,
    }
  });
});

// Robust fallback engine in server
function extractKnowledgeAnswer(query: string, documentText: string, previousReplies: string[] = []): { reply: string; sourceType: 'directory' | 'grounding' | 'pdf' } {
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // 1. Food and restaurants in Unicentro
  if (q.includes('pizza') || q.includes('beato') || q.includes('demaciao')) {
    return {
      reply: "En Unicentro Maracay tienes Beato Napoletano con pizzas a la leña en el bulevar gastronómico, y Demaciao Pizza para pizzas rápidas familiares. ¿Deseas que te indique en qué área se encuentran?",
      sourceType: 'directory'
    };
  }
  if (q.includes('sushi') || q.includes('cebiche') || q.includes('ceviche') || q.includes('japones') || q.includes('asiatic')) {
    return {
      reply: "Para comida japonesa y fusión peruana cuentas con Sushi & Cebiches en el bulevar, y Orbe Exotic Food con cócteles y comida asiática gourmet. ¿Te gustaría saber si cuentan con delivery?",
      sourceType: 'directory'
    };
  }
  if (q.includes('cafe') || q.includes('helado') || q.includes('gelato') || q.includes('postre') || q.includes('torta') || q.includes('merienda')) {
    return {
      reply: "Para café y postres tienes Ventus Café & Bistro con frappes y pastelería, o Biella Gelato con auténticos helados artesanales italianos en el bulevar. ¿Buscas merendar un café o un helado?",
      sourceType: 'directory'
    };
  }
  if (q.includes('arabe') || q.includes('shawarma') || q.includes('falafel') || q.includes('lubnan')) {
    return {
      reply: "Para comida árabe tradicional tienes Lubnan Shawarmas en el bulevar gastronómico, con shawarmas de pollo, carne y falafel. ¿Te gustaría saber su horario de atención?",
      sourceType: 'directory'
    };
  }

  // 2. Ingredients of burgers
  const ingredientKeywords = ['ingrediente', 'lleva', 'trae', 'contiene', 'prepara', 'receta', 'queso', 'tocineta', 'pan', 'gouda', 'kraft', 'parmesano', 'pretzel', 'brioche'];
  if (ingredientKeywords.some(kw => q.includes(kw))) {
    if (q.includes('monster') || q.includes('premium') || q.includes('pretzel') || q.includes('gouda')) {
      return {
        reply: "La Monster Cheese de Pollos Gran Combo incluye pan pretzel, pollo crispy, queso gouda holandés, mermelada de tocineta, lechuga y salsa mayo ranch por $9.99. ¿Deseas su número de WhatsApp para pedirla?",
        sourceType: 'pdf'
      };
    }
    if (q.includes('doppio') || q.includes('kraft') || q.includes('brioche') || q.includes('estandar') || q.includes('standard')) {
      return {
        reply: "La Doppio Cheese está preparada con pan brioche con queso parmesano, pollo crispy, queso Kraft, tocineta crujiente, cebolla caramelizada y salsa de ajo parmesano por $6.99. ¿Te gustaría ordenar delivery?",
        sourceType: 'pdf'
      };
    }
    return {
      reply: "En Pollos Gran Combo tienes la Doppio Cheese con queso Kraft ($6.99) y la Monster Cheese con queso gouda en pan pretzel ($9.99). ¿Prefieres sabores clásicos o una opción gourmet con pan pretzel?",
      sourceType: 'pdf'
    };
  }

  // 3. Price & Promotions
  const priceKeywords = ['precio', 'costo', 'cuesta', 'vale', 'cuanto', 'promo', 'promocion', 'promociones', 'oferta', 'descuento', 'barato', 'economico', 'combo', 'dolar'];
  if (priceKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "En Pollos Gran Combo tienes la hamburguesa Doppio Cheese por $6.99, la Monster Cheese por $9.99 y el combo familiar Mega Sonrisa con 6 piezas de pollo por $19.99. ¿Buscas un menú individual o para compartir en familia?",
      sourceType: 'pdf'
    };
  }

  // 4. Generic food inquiry -> INQUIRE TO REFINE
  const foodKeywords = ['hambre', 'comer', 'comida', 'almorzar', 'almuerzo', 'cenar', 'cena', 'restaurante', 'menu', 'sabroso', 'antojo'];
  if (foodKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "En nuestro bulevar gastronómico tenemos pollo crispy y hamburguesas en Pollos Gran Combo, pizzas a la leña en Beato Napoletano, sushi en Sushi & Cebiches o smash burgers en Zeta Burger. ¿Qué tipo de comida te apetece hoy: algo rápido o comida para sentarse?",
      sourceType: 'directory'
    };
  }

  // 5. Beauty and Aesthetics
  const beautyKeywords = ['belleza', 'maquillaje', 'cosmetico', 'cosmetica', 'peinado', 'cabello', 'pelo', 'unas', 'estetica', 'salon', 'peluqueria', 'spa', 'skincare', 'piel', 'k-beauty', 'hallyu', 'glossy', 'mia', 'studio 1118', 'vijones'];
  if (beautyKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "En Unicentro Maracay contamos con Hallyu K-Beauty para skincare coreano, Glossy Beauty Studio para balayage y pestañas, MÏA Cosmetics y Vijones Beauty Bar para uñas. ¿Qué servicio o producto de belleza estás buscando?",
      sourceType: 'directory'
    };
  }

  // 6. Supermarket, Pharmacy, Services
  if (q.includes('farmacia') || q.includes('farmatodo') || q.includes('medicina') || q.includes('salud')) {
    return {
      reply: "Unicentro Maracay cuenta con Farmatodo en planta baja con atención para medicamentos y conveniencia. ¿Deseas saber si cuenta con acceso vehicular directo?",
      sourceType: 'directory'
    };
  }
  if (q.includes('supermercado') || q.includes('forum') || q.includes('mercado') || q.includes('viveres') || q.includes('compras')) {
    return {
      reply: "Cuentas con Forum Súper Mayorista en el centro comercial para compras completas de alimentos y víveres al mayor y detal. ¿Buscas compras rápidas o mercado general?",
      sourceType: 'directory'
    };
  }
  if (q.includes('viaje') || q.includes('boleto') || q.includes('vuelo') || q.includes('viajea')) {
    return {
      reply: "En el nivel de servicios del piso 1 tienes la agencia Viajea para boletos nacionales e internacionales y paquetes de turismo. ¿Deseas planificar un viaje nacional o internacional?",
      sourceType: 'directory'
    };
  }
  if (q.includes('digitel') || q.includes('telefono') || q.includes('linea') || q.includes('chip') || q.includes('esim')) {
    return {
      reply: "En planta baja tienes el centro de atención Digitel para trámites móviles, planes 4G y recargas. ¿Deseas conocer su horario de atención?",
      sourceType: 'directory'
    };
  }

  // 7. Contact, WhatsApp & Delivery
  const contactKeywords = ['whatsapp', 'telefono', 'numero', 'contacto', 'pedir', 'pedido', 'delivery', 'domicilio', 'llamar'];
  if (contactKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "Para realizar tus pedidos o consultar por delivery de Pollos Gran Combo, puedes escribir directamente a su WhatsApp al +58 424 306 5534. ¿Deseas el contacto de algún otro restaurante?",
      sourceType: 'pdf'
    };
  }

  // 8. Hours & Schedule
  const scheduleKeywords = ['horario', 'hora', 'abierto', 'abren', 'cierran', 'atienden'];
  if (scheduleKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "Unicentro Maracay abre de lunes a domingo de 10:00 AM a 8:00 PM, y los locales del bulevar atienden hasta las 10:00 o 11:00 de la noche. ¿Planeas visitarnos en la tarde o para cenar?",
      sourceType: 'directory'
    };
  }

  // 9. Location
  const locationKeywords = ['ubicacion', 'donde', 'queda', 'llegar', 'piso', 'bulevar', 'direccion', 'casanova'];
  if (locationKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "Unicentro Maracay se ubica en la Avenida José Casanova Godoy, con bulevar gastronómico al aire libre y área climatizada de 2 pisos. ¿Vienes en vehículo propio o transporte público?",
      sourceType: 'directory'
    };
  }

  // 10. Greetings
  const greetingKeywords = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'quien eres', 'ayuda'];
  if (greetingKeywords.some(kw => q.includes(kw))) {
    return {
      reply: "¡Hola! Bienvenido a Unicentro Maracay. Te puedo orientar sobre tiendas, bulevar gastronómico, belleza, servicios y promociones. ¿Qué te gustaría consultar hoy?",
      sourceType: 'directory'
    };
  }

  // 11. STRICT FALLBACK WHEN NOT FOUND (Anti-repetition requirement)
  return {
    reply: "No encontré esa información específica en nuestro directorio de Unicentro Maracay. ¿Te gustaría que te recomiende tiendas similares o que indaguemos en las opciones de nuestro bulevar gastronómico?",
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
    const { message, systemPrompt, documentContext, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Parámetro 'message' es requerido." });
    }

    const ai = getAIClient();

    // If Gemini client is available, execute hybrid knowledge resolution:
    if (ai) {
      const needsSearchGrounding = shouldTriggerSearchGrounding(message);
      
      const robustSystemPrompt = `${systemPrompt || ''}

DIRECTORIO Y BASE CONOCIMIENTO SINCRONIZADA (UNICENTRO MARACAY Y OFICIAL unicentromaracay.com):
"""
${documentContext || 'Directorio comercial de Unicentro Maracay y Pollos Gran Combo'}
"""

INSTRUCCIONES CLAVE DE DIÁLOGO:
- Eres el asistente exclusivo de UNICENTRO MARACAY (Avenida José Casanova Godoy, Maracay, Venezuela).
- Si la pregunta del usuario es muy genérica (ej: "tengo hambre", "qué venden", "busco un regalo"), indaga con preguntas cortas y amables para entender su preferencia antes de abrumarlo.
- Al terminar cada respuesta informativa, haz una sugerencia relevante o pregunta contextual para continuar guiándolo (ej: "¿Deseas saber en qué piso se encuentra?", "¿Buscas opciones para almorzar o para picar?").
- Si el usuario pregunta por algo que NO está en el directorio o en la web de Unicentro Maracay, NUNCA repitas información anterior ni inventes tiendas ajenas. Di explícitamente:
  "No encontré esa información específica en nuestro directorio de Unicentro Maracay..." y pregunta qué tipo de producto o servicio busca para ofrecerle alternativas reales.
- Redacta de 2 a 3 oraciones cálidas y fluidas (máximo 50 palabras), sin markdown ni viñetas.`;

      let promptContents = message;
      if (history && Array.isArray(history) && history.length > 0) {
        const recentHistory = history.map((h: any) => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.text}`).join('\n');
        promptContents = `Historial de conversación reciente:\n${recentHistory}\n\nNueva consulta del usuario: ${message}`;
      }

      // Try with Search Grounding if query is dynamic or novel
      if (needsSearchGrounding) {
        try {
          const groundedResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `En el centro comercial Unicentro Maracay (Av. Casanova Godoy, Maracay, Venezuela): ${promptContents}`,
            config: {
              systemInstruction: robustSystemPrompt,
              temperature: 0.5,
              tools: [{ googleSearch: {} }],
            },
          });

          const groundedReply = groundedResponse.text?.trim()
            ?.replace(/[*#_~`]/g, '')
            ?.replace(/•\s*/g, '')
            ?.replace(/\n+/g, ' ');

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
          console.warn("Search Grounding fallback, continuando con directorio sincronizado:", groundingErr);
        }
      }

      // Fast Synchronizer & Base Knowledge generation
      try {
        const syncResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptContents,
          config: {
            systemInstruction: robustSystemPrompt,
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
        console.warn("Error en modelo Gemini, activando motor semántico Unicentro:", geminiErr);
      }
    }

    // Smart Local Knowledge Base fallback with strict anti-repetition
    const fallbackAnswer = extractKnowledgeAnswer(message, documentContext || '', []);
    return res.json({
      reply: fallbackAnswer.reply,
      sourceType: fallbackAnswer.sourceType,
    });
  } catch (error: any) {
    console.error("Error al procesar consulta en /api/chat:", error);
    const fallbackAnswer = extractKnowledgeAnswer(req.body?.message || '', req.body?.documentContext || '', []);
    res.json({
      reply: fallbackAnswer.reply,
      sourceType: fallbackAnswer.sourceType,
    });
  }
});

async function startServer() {
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
