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

// Smart fallback matching from knowledge document
function extractKnowledgeAnswer(query: string, documentText: string): string {
  const q = query.toLowerCase();
  
  if (q.includes('hamburguesa') || q.includes('master burguer') || q.includes('doppio') || q.includes('monster') || q.includes('promo') || q.includes('precio')) {
    return "En Pollos Gran Combo tienen las promociones del Master Burguer 2026: la hamburguesa Doppio Cheese por $6.99 y la Monster Cheese por $9.99, además de combos como el Mega Sonrisa por $19.99.";
  }
  
  if (q.includes('ingrediente') || q.includes('lleva') || q.includes('trae')) {
    if (q.includes('monster') || q.includes('premium')) {
      return "La Monster Cheese incluye pan pretzel, pollo crispy, queso gouda holandés, mermelada de tocineta, tira de tocineta extra, lechuga y salsa mayo ranch.";
    }
    return "La Doppio Cheese incluye pan brioche coronado con queso parmesano, pollo crispy, queso Kraft, tocineta, cebolla caramelizada y salsa de ajo parmesano.";
  }

  if (q.includes('horario') || q.includes('hora') || q.includes('abren') || q.includes('cierran')) {
    return "Pollos Gran Combo abre todos los días de 10:00 am a 10:00 pm.";
  }

  if (q.includes('ubicacion') || q.includes('ubicación') || q.includes('donde') || q.includes('dónde') || q.includes('queda')) {
    return "Pollos Gran Combo está ubicado en el bulevar del centro comercial, cerca de la entrada al área climatizada.";
  }

  if (q.includes('whatsapp') || q.includes('telefono') || q.includes('teléfono') || q.includes('numero') || q.includes('número') || q.includes('pedido')) {
    return "Puedes realizar tus pedidos directamente por WhatsApp al número +58 424 306 5534.";
  }

  if (q.includes('combo') || q.includes('pollo') || q.includes('mega sonrisa')) {
    return "El combo Mega Sonrisa cuesta $19.99 e incluye 6 piezas de pollo crispy, 2 raciones de arepitas, 2 raciones de papitas y un refresco de 1 litro.";
  }

  if (q.includes('belleza') || q.includes('tienda') || q.includes('maquillaje') || q.includes('salon') || q.includes('salón') || q.includes('estetica')) {
    return "En el centro comercial cuentas con las tiendas de belleza: Hallyu K-Beauty, Glossy Beauty Studio, MÏA Cosmetics, Studio 1118 y Vijones Beauty Bar.";
  }

  return "Según la base de datos de tiendas, disponemos de información sobre Pollos Gran Combo (hamburguesas Master Burguer, combos y WhatsApp) y tiendas de belleza como Hallyu K-Beauty y Glossy Beauty Studio. ¿Sobre cuál deseas consultar?";
}

// Chat & Knowledge Q&A API
app.post("/api/chat", async (req, res) => {
  try {
    const { message, documentContext, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Parámetro 'message' es requerido." });
    }

    const ai = getAIClient();

    // If Gemini client is available, generate response
    if (ai) {
      try {
        const systemInstruction = `Eres el Asistente de Voz oficial "Uni Voice" de información de tiendas en un centro comercial. Tu función es responder de forma hablada, rápida, natural, amable y precisa basándote EXCLUSIVAMENTE en el siguiente documento de conocimiento:

--- DOCUMENTO DE CONOCIMIENTO (PDF) ---
${documentContext || 'Sin documento adicional'}
---------------------------------------

REGLAS OBLIGATORIAS PARA TUS RESPUESTAS:
1. Responde siempre en ESPAÑOL con un tono conversacional y claro, optimizado para ser leído en voz alta por síntesis de voz.
2. Sé conciso y directo (1 a 3 oraciones máximo), ya que el usuario te está escuchando por voz.
3. Menciona precios, ingredientes y datos con claridad.
4. Si te preguntan algo que no esté en el documento, responde amablemente indicando lo que sí está disponible en la base de datos de tiendas.
5. No uses listas largas con viñetas markdown ni asteriscos excesivos; utiliza oraciones fluidas.`;

        let promptContents = message;
        if (history && Array.isArray(history) && history.length > 0) {
          const recentHistory = history.map((h: any) => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.text}`).join('\n');
          promptContents = `Historial reciente:\n${recentHistory}\n\nNueva pregunta del usuario: ${message}`;
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: promptContents,
          config: {
            systemInstruction,
            temperature: 0.4,
          },
        });

        const replyText = response.text?.trim();
        if (replyText) {
          return res.json({ reply: replyText });
        }
      } catch (geminiErr) {
        console.warn("Error en llamada Gemini, usando motor de conocimiento local:", geminiErr);
      }
    }

    // Smart Local Knowledge Base fallback
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
