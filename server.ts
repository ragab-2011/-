import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "أنت مساعد ذكي متميز ومتعدد المهام. يمكنك الإجابة على كافة أسئلة واستفسارات المستخدم بدقة وأدب وباللغة العربية. رغم وجودك داخل منصة لإدارة الصيدلية، إلا أنك تملك المعرفة للإجابة على أي موضوع يطرحه المستخدم (سواء كان طبياً أو عاماً أو في أي مجال آخر). كن دائماً مفيداً ومختصراً وودوداً.",
      },
    });

    const response = await chat.sendMessage({ message });
    res.json({ content: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء الاتصال بالمساعد الذكي." });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
