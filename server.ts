import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client (lazy or guarded)
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
  res.json({ status: "ok", hasApiKey: !!process.env.GEMINI_API_KEY });
});

// Dynamic Knowledge & Intent Interpreter (Fallback & semantic analysis)
function extractKnowledgeAnswer(query: string, documentText: string): string {
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const doc = documentText || "";
  const docLower = doc.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Food, hunger, meal, burger, chicken, combos, taste
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
    'descuento', 'barato', 'economico', 'combo', 'dolar', 'dolares', 'tarifa'
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

  // 8. Greetings & general inquiries
  const greetingKeywords = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'quien eres', 'ayuda'];
  const hasGreetingIntent = greetingKeywords.some(kw => q.includes(kw));

  // Intent Routing:
  if (hasIngredientIntent) {
    if (q.includes('monster') || q.includes('premium') || q.includes('pretzel') || q.includes('gouda')) {
      return "La Monster Cheese de Pollos Gran Combo incluye pan pretzel, pollo crispy, queso gouda holandés, mermelada de tocineta, tira de tocineta extra, lechuga y salsa mayo ranch.";
    }
    if (q.includes('doppio') || q.includes('kraft') || q.includes('brioche') || q.includes('estandar') || q.includes('standard')) {
      return "La Doppio Cheese está preparada con pan brioche con queso parmesano, pollo crispy, queso Kraft, tocineta crujiente, cebolla caramelizada y salsa de ajo parmesano.";
    }
    return "En Pollos Gran Combo tienes dos deliciosas opciones: la Doppio Cheese con queso Kraft y cebolla caramelizada, o la Monster Cheese con queso gouda holandés y mermelada de tocineta en pan pretzel.";
  }

  if (hasPriceIntent) {
    if (q.includes('barat') || q.includes('econom')) {
      return "La opción más económica de hamburguesa es la Doppio Cheese por 6 dólares con 99 centavos, o puedes optar por la Monster Cheese por 9 dólares con 99 centavos.";
    }
    return "En Pollos Gran Combo tienes la hamburguesa Doppio Cheese por $6.99, la Monster Cheese por $9.99 y el combo familiar Mega Sonrisa con 6 piezas de pollo, arepitas y papitas por $19.99.";
  }

  if (hasBeautyIntent) {
    return "En el centro comercial contamos con varias tiendas de belleza: Hallyu K-Beauty para cosmética coreana, Glossy Beauty Studio, MÏA Cosmetics, Studio 1118 y Vijones Beauty Bar para uñas y peinados.";
  }

  if (hasContactIntent) {
    return "Para realizar tus pedidos o consultar por delivery, puedes escribir directamente al WhatsApp al +58 424 306 5534.";
  }

  if (hasScheduleIntent) {
    return "Pollos Gran Combo te atiende todos los días de diez de la mañana a diez de la noche.";
  }

  if (hasLocationIntent) {
    return "Pollos Gran Combo se encuentra ubicado en el bulevar del centro comercial, justo al lado de la entrada al área climatizada.";
  }

  if (hasFoodIntent) {
    return "Si buscas algo delicioso para comer, en Pollos Gran Combo puedes probar las hamburguesas Master Burguer: la Doppio Cheese por 6.99 dólares o la Monster Cheese por 9.99 dólares, además de sus combos familiares de pollo crispy.";
  }

  if (hasGreetingIntent) {
    return "¡Hola! Con gusto te oriento. Puedo ayudarte con las promociones y opciones de comida en Pollos Gran Combo, o indicarte sobre nuestras tiendas de belleza disponibles. ¿Qué te gustaría saber?";
  }

  // Dynamic excerpt matching if another document is loaded
  if (doc && !docLower.includes('pollos gran combo')) {
    const lines = doc.split('\n').filter(l => l.trim().length > 0);
    const matchedLine = lines.find(l => {
      const lineLower = l.toLowerCase();
      const words = q.split(' ').filter(w => w.length > 3);
      return words.some(w => lineLower.includes(w));
    });
    if (matchedLine) {
      return `De acuerdo a la información disponible: ${matchedLine.replace(/[#*•-]/g, '').trim()}`;
    }
  }

  return "Te puedo brindar información sobre las hamburguesas y combos de Pollos Gran Combo, sus horarios, ubicación y WhatsApp, o sobre nuestras tiendas de belleza disponibles. ¿En qué te puedo asesorar?";
}

// Chat & Knowledge Q&A API
app.post("/api/chat", async (req, res) => {
  try {
    const { message, documentContext, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Parámetro 'message' es requerido." });
    }

    const ai = getAIClient();

    // If Gemini client is available, generate response with smart contextual interpretation
    if (ai) {
      try {
        const systemInstruction = `Eres "Uni Voice", el asistente conversacional por voz del centro comercial. Tu tono es cálido, empático, natural y en ESPAÑOL LATINOAMERICANO fluido.

DOCUMENTO DE CONOCIMIENTO (BASE DE DATOS Y GUÍA DEL USUARIO):
"""
${documentContext || 'Información de Pollos Gran Combo y tiendas de belleza'}
"""

DIRECTRICES CONVERSACIONALES Y DE INTERPRETACIÓN SEMÁNTICA:
1. INTERPRETACIÓN DE LA INTENCIÓN:
   - El usuario no te va a leer fragmentos exactos del documento; te hablará de forma coloquial, con preguntas abiertas, indirectas o de gustos (ej. "tengo hambre", "¿qué me recomiendas para comer?", "¿cuál es la opción más barata?", "¿dónde puedo peinarme?", "¿qué salsa tiene?", "¿hasta qué hora están?").
   - Utiliza TODO el contexto del documento para inferir lo que el usuario necesita (gastronomía, belleza, precios, promociones, ingredientes, horarios, ubicación, pedidos por WhatsApp).
   - Conecta la necesidad del usuario con los datos reales del documento sin inventar datos que no existan, pero expresándolo con tus propias palabras cálidas y conversacionales.

2. FORMATO PARA VOZ (TEXT-TO-SPEECH):
   - Tu respuesta será leída en voz alta por el sintetizador de voz.
   - Responde en 2 a 3 oraciones cortas, fluidas y claras (máximo 45 palabras).
   - NUNCA uses símbolos de markdown como asteriscos (*, **), viñetas (- o •), numerales (#) ni encabezados.
   - Expresa las cantidades y precios de forma natural (ej. "seis dólares con noventa y nueve centavos" o "$6.99").

3. CONTINUIDAD CONVERSACIONAL:
   - Toma en cuenta el historial reciente de la conversación si el usuario hace preguntas de seguimiento (ej. "¿y qué trae esa?", "¿dónde queda?").`;

        let promptContents = message;
        if (history && Array.isArray(history) && history.length > 0) {
          const recentHistory = history.map((h: any) => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.text}`).join('\n');
          promptContents = `Historial reciente:\n${recentHistory}\n\nPregunta actual del usuario: ${message}`;
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: promptContents,
          config: {
            systemInstruction,
            temperature: 0.6,
          },
        });

        const replyText = response.text?.trim()
          ?.replace(/[*#_~`]/g, '')
          ?.replace(/•\s*/g, '')
          ?.replace(/\n+/g, ' ');

        if (replyText) {
          return res.json({ reply: replyText });
        }
      } catch (geminiErr) {
        console.warn("Error en llamada Gemini, usando motor semántico local:", geminiErr);
      }
    }

    // Smart Local Knowledge Base fallback with semantic NLP intent interpretation
    const fallbackAnswer = extractKnowledgeAnswer(message, documentContext || '');
    return res.json({ reply: fallbackAnswer });
  } catch (error: any) {
    console.error("Error al procesar consulta:", error);
    const fallbackAnswer = extractKnowledgeAnswer(req.body?.message || '', req.body?.documentContext || '');
    res.json({ reply: fallbackAnswer });
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
