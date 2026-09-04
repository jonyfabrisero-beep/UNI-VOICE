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

// Chat & Knowledge Q&A API
app.post("/api/chat", async (req, res) => {
  try {
    const { message, documentContext, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Parámetro 'message' es requerido." });
    }

    const ai = getAIClient();

    // Fallback if no API key is set yet
    if (!ai) {
      console.warn("GEMINI_API_KEY no configurado, usando generador local de respuestas.");
      return res.json({
        reply: "Pollos Gran Combo cuenta con las hamburguesas Master Burguer 2026: Doppio Cheese por 6.99$ y Monster Cheese por 9.99$, combos como el Mega Sonrisa por 19.99$, y pedidos al WhatsApp +584243065534. Están ubicados en el bulevar cerca de la entrada al área climatizada."
      });
    }

    const systemInstruction = `Eres el Asistente de Voz oficial de información de tiendas. Tu función es responder de forma hablada, rápida, natural, amable y precisa basándote EXCLUSIVAMENTE en el siguiente documento de conocimiento:

--- DOCUMENTO DE CONOCIMIENTO (PDF) ---
${documentContext || 'Sin documento adicional'}
---------------------------------------

REGLAS OBLIGATORIAS PARA TUS RESPUESTAS:
1. Responde siempre en ESPAÑOL con un tono conversacional y claro, optimizado para ser leído en voz alta (Speech-to-Text / Voz sintetizada).
2. Sé conciso y directo (1 a 3 oraciones máximo), ya que el usuario te está escuchando por voz.
3. Menciona precios, ingredientes y datos con claridad (ej. "seis dólares con noventa y nueve centavos" o "$6.99").
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

    const replyText = response.text || "Disculpa, no pude procesar la respuesta en este momento.";
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Error al procesar consulta con Gemini:", error);
    res.status(500).json({
      error: "Error al generar la respuesta",
      details: error.message,
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
