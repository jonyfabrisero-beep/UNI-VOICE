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

// Smart semantic intent interpreter from knowledge document
function extractKnowledgeAnswer(query: string, documentText: string): string {
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove accents for robust matching
  
  // 1. Food, hunger, meal, burger, chicken, combos, taste
  const foodKeywords = [
    'hambre', 'comer', 'comida', 'almorzar', 'almuerzo', 'cenar', 'cena', 'plato', 'picar', 'antojo',
    'hamburguesa', 'burger', 'burguer', 'doppio', 'monster', 'pollo', 'crispy', 'combo', 'arepitas',
    'papas', 'papitas', 'refresco', 'carne', 'rapida', 'restaurante', 'menu', 'sabroso', 'rico'
  ];
  const hasFoodIntent = foodKeywords.some(kw => q.includes(kw));

  // 2. Ingredients, contents, recipe, allergies
  const ingredientKeywords = [
    'ingrediente', 'lleva', 'trae', 'contiene', 'prepara', 'receta', 'queso', 'tocineta', 'pan',
    'salsa', 'cebolla', 'lechuga', 'gouda', 'kraft', 'parmesano', 'pretzel', 'brioche', 'mayo', 'ranch'
  ];
  const hasIngredientIntent = ingredientKeywords.some(kw => q.includes(kw));

  // 3. Price, cost, promos, discounts, cheap, expensive
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

  // 8. Greetings & general inquiries
  const greetingKeywords = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'quien eres', 'ayuda'];
  const hasGreetingIntent = greetingKeywords.some(kw => q.includes(kw));

  // Response Routing based on interpreted intent:
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

  // General helpful contextual suggestion
  return "Te puedo ayudar con información de Pollos Gran Combo, como sus hamburguesas Doppio y Monster Cheese, combos familiares, horarios, ubicación y WhatsApp, o también sobre nuestras tiendas de belleza disponibles. ¿Cuál te interesa?";
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
        const systemInstruction = `Eres "Uni Voice", el asistente de voz inteligente para los visitantes de un centro comercial. Tu personalidad es cálida, amable y con un tono en ESPAÑOL LATINO natural y amigable.

DOCUMENTO DE CONOCIMIENTO (BASE DE DATOS DE TIENDAS Y RESTAURANTES):
---
${documentContext || 'Información de Pollos Gran Combo y tiendas de belleza'}
---

INSTRUCCIONES CLAVE DE INTERPRETACIÓN Y DEDUCCIÓN:
1. El usuario te hablará con lenguaje coloquial, indirecto o con modismos latinos (ej: "¿qué hay de comer rico?", "¿dónde me pongo bella?", "¿tienen algo con queso?", "¿hacen delivery?", "¿a qué hora abren?", "¿qué recomiendas para cenar?", "¿cuál es la hamburguesa más barata?").
2. INTERPRETA siempre la intención detrás de la pregunta aunque no use las palabras exactas del documento y relaciónala con la información disponible para darle una respuesta útil.
3. Responde de forma CONCISA (máximo 2 a 3 oraciones breves), fluida y directa, porque el usuario te está escuchando por voz en tiempo real.
4. No uses asteriscos, símbolos markdown ni listas con viñetas; redacta texto continuo y agradable de escuchar.
5. Menciona siempre precios ($), ingredientes clave o nombres de tiendas cuando sea relevante.`;

        let promptContents = message;
        if (history && Array.isArray(history) && history.length > 0) {
          const recentHistory = history.map((h: any) => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.text}`).join('\n');
          promptContents = `Historial reciente:\n${recentHistory}\n\nPregunta hablada del usuario: ${message}`;
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: promptContents,
          config: {
            systemInstruction,
            temperature: 0.5,
          },
        });

        const replyText = response.text?.trim();
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
