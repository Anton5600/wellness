import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post("/api/gemini/synthesis", async (req, res) => {
    try {
      const { testResult, card, quote } = req.body;
      if (!testResult || !card) {
        return res.status(400).json({ error: "Missing test result or card" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "API key is not configured" });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `Ты - эмпатичный и мудрый персональный советник (ассистент) в приложении для психологической поддержки "Внутренний компас".
Задача: Провести краткий, глубокий и вдохновляющий синтез между текущим состоянием пользователя (по результатам теста) и его Метафорической картой дня.

Входные данные:
- Текущее состояние пользователя: "${testResult.title}" (${testResult.headline})
- Описание состояния: ${testResult.description}
- Карта дня пользователя: "${card.title}"
- Послание карты: "${card.message}"
- Цитата дня (опционально): "${quote?.text || ''}"

Сформируй персональное напутствие (2-3 небольших абзаца). 
1. Подчеркни связь между эмоциональным состоянием и смыслом карты. 
2. Дай мягкий, поддерживающий совет на сегодняшний день.
Твой тон должен быть теплым, заботливым, без лишней эзотерики, но с глубоким пониманием психологии. Обращайся на "ты". Не используй приветствия, сразу переходи к сути. Форматируй текст чисто (без markdown-звездочек, используй обычные абзацы).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite", // Using flash lite for speed
        contents: prompt,
      });

      res.json({ result: response.text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to generate synthesis" });
    }
  });

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
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
