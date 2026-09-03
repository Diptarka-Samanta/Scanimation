import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON payload parser for base64 image data
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // AI 5-frame motion sequence generator
  app.post("/api/ai/generate-sequence", async (req, res) => {
    try {
      const { prompt = "galloping horse", style = "silhouette" } = req.body;
      const ai = getGeminiClient();

      const systemPrompt = `You are an expert animator and optical illusion creator specializing in barrier-grid scanimation (kinegrams).
Generate 5 continuous sequential animation keyframes of "${prompt}" in a smooth looping cycle (frame 1 -> 2 -> 3 -> 4 -> 5 -> loop back to 1).
For scanimation, images must be high-contrast, clean silhouettes or solid bold shapes (pure black #000000 on pure white #ffffff background), centered in a 500x500 frame.
Return 5 complete, standalone SVG strings (viewBox="0 0 500 500"), each containing the object at that frame's pose.
Use <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500"><rect width="500" height="500" fill="#ffffff"/>...shape elements with fill="#000000"...</svg>.
Ensure the object stays centered and maintains consistent volume/scale across all 5 frames.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Generate 5 SVG animation frames for: "${prompt}". Style: ${style}. Return a JSON array with 5 items, each containing frameIndex (1-5), label, and the complete svg code string.`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              frames: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    frameIndex: { type: Type.INTEGER },
                    label: { type: Type.STRING },
                    svg: { type: Type.STRING },
                  },
                  required: ["frameIndex", "label", "svg"],
                },
              },
            },
            required: ["title", "frames"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error("AI sequence generation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate AI animation frames",
      });
    }
  });

  // AI Multimodal Analysis & Ordering of 5 user-uploaded frames
  app.post("/api/ai/analyze-and-align", async (req, res) => {
    try {
      const { images } = req.body as { images: string[] };
      if (!images || !Array.isArray(images) || images.length !== 5) {
        return res.status(400).json({
          success: false,
          error: "Please provide exactly 5 images to analyze.",
        });
      }

      const ai = getGeminiClient();

      const imageParts = images.map((base64Data, idx) => {
        // Strip data:image/...;base64, if present
        const match = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        const mimeType = match ? match[1] : "image/jpeg";
        const data = match ? match[2] : base64Data;
        return {
          inlineData: {
            mimeType,
            data,
          },
        };
      });

      const promptText = `I have 5 frames of the same moving object intended for barrier-grid scanimation.
Please analyze these 5 frames:
1. Identify the moving subject.
2. Determine if the current order [0, 1, 2, 3, 4] is sequential, or if a different sequence (e.g. [0, 2, 4, 3, 1]) would create a smoother looping animation.
3. Provide recommendations for contrast and silhouette thresholding to make the scanimation optical illusion pop.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          ...imageParts,
          { text: promptText },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subjectName: { type: Type.STRING },
              recommendedOrder: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
                description: "Array of 5 indices (0 to 4) representing the best frame order for smooth looping",
              },
              loopQuality: {
                type: Type.STRING,
                description: "Assessment: Excellent, Good, or Needs Alignment",
              },
              contrastTip: { type: Type.STRING },
              motionDescription: { type: Type.STRING },
            },
            required: ["subjectName", "recommendedOrder", "loopQuality", "contrastTip", "motionDescription"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error("AI frame analysis error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to analyze frames",
      });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Scanimation Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
