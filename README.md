import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not set in the environment.");
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Gemini AI setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Route for AI Timetable Generation
app.post("/api/generate-timetable", async (req, res) => {
  try {
    const { prompt, userDetails } = req.body;
    
    const systemInstruction = `You are an expert time management assistant called TimeMint. Your goal is to "Design Your Perfect Day".
      Follow these constraints:
      - Return ONLY valid JSON.
      - Ensure NO overlaps. The end time of one task should be strictly before or equal to the start time of the next.
      - Include healthy habits: morning walk, hydration breaks, and proper meal times.
      - If sleep time is provided, ensure the routine ends before sleep and begins after wake-up.
      - Add occasional "Focus Sprints" (Pomodoro style) for work/study tasks.
      - Use 24-hour format (e.g., "14:30") for times.
      - Generate unique IDs (uuids) for each activity.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
        User Details: ${JSON.stringify(userDetails)}
        User Request: ${prompt}
      `,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            activities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  start: { type: Type.STRING },
                  end: { type: Type.STRING },
                  category: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN }
                },
                required: ["id", "name", "start", "end", "category", "priority", "completed"]
              }
            }
          },
          required: ["activities"]
        }
      }
    });
    
    if (response.text) {
      const timetableData = JSON.parse(response.text);
      res.json(timetableData);
    } else {
      throw new Error("Failed to generate timetable text");
    }
  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: "Failed to generate timetable" });
  }
});

// Vite middleware for development
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
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
