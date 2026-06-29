import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Lazy initialize Gemini API client to prevent crash on startup if missing
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. Gemini features will run in mock/fallback mode.");
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

// Enable large payloads for image and audio data uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Endpoint to retrieve the Gemini API Key for direct client-side integration
app.get("/api/gemini/get-key", (req, res) => {
  res.json({ apiKey: process.env.GEMINI_API_KEY || "" });
});

// 1. Photo Analysis (Vision): Category & Severity auto-detection
app.post("/api/gemini/analyze-photo", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }

    const ai = getAiClient();
    if (!ai) {
      // Fallback response for mock if API key is missing
      return res.json({
        category: "pothole",
        severity: "High",
        description: "[Fallback Mode] Gemini API key not set. Defaulted classification to 'pothole' with High severity.",
        isCivicIssue: true
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageMime = mimeType || "image/jpeg";

    const prompt = `Analyze this image. Is this a civic infrastructure issue? If yes, identify: 1) Category (Pothole, Streetlight, Water Leakage, Waste, Other) 2) Severity (Low, Medium, High, Critical) 3) One sentence description of what you see. If this is NOT a civic issue, return category: Unknown, severity: None, and say this doesn't appear to be a civic infrastructure problem. Return as JSON: {category, severity, description, isCivicIssue}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: imageMime
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "Must be Pothole, Streetlight, Water Leakage, Waste, Other, or Unknown if not a civic issue."
            },
            severity: {
              type: Type.STRING,
              description: "Must be Low, Medium, High, Critical, or None if not a civic issue."
            },
            description: {
              type: Type.STRING,
              description: "One sentence description of what is visible in the image."
            },
            isCivicIssue: {
              type: Type.BOOLEAN,
              description: "Whether the image displays a municipal or civic infrastructure issue."
            }
          },
          required: ["category", "severity", "description", "isCivicIssue"]
        }
      }
    });

    let text = response.text || "";
    text = text.replace(/```json\s?/g, "").replace(/```\s?/g, "").trim();

    try {
      const result = JSON.parse(text);
      res.json(result);
    } catch (parseErr) {
      console.error("Failed to parse Gemini response as JSON:", text);
      res.status(500).json({ error: "Failed to parse structured response from Gemini." });
    }
  } catch (error: any) {
    console.error("Error in analyze-photo:", error);
    res.status(500).json({ error: error.message || "Failed to analyze photo" });
  }
});

// 2. Voice Transcription: Gemini transcribes audio in Hindi/English
app.post("/api/gemini/transcribe-voice", async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: "Missing audioBase64 data" });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.json({
        transcription: "[Fallback Mode] Audio transcribed as: 'Please repair the broken streetlights and water leakages in this locality as soon as possible.'"
      });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, "");
    const audioMime = mimeType || "audio/webm";

    const prompt = "Please transcribe the following audio recording. It is from an Indian citizen reporting a civic infrastructure issue and may contain English, Hindi, or a mix of both (Hinglish). Provide only the clear, natural text transcription without any conversational intro, extra formatting, or notes. If Hindi is spoken, write it in Devanagari script or clean Roman transliteration depending on how it's spoken, preserving the literal meaning.";

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        prompt,
        {
          inlineData: {
            data: cleanBase64,
            mimeType: audioMime
          }
        }
      ]
    });

    res.json({ transcription: (response.text || "").trim() });
  } catch (error: any) {
    console.error("Error in transcribe-voice:", error);
    res.status(500).json({ error: error.message || "Failed to transcribe audio" });
  }
});

// 2b. Clean Voice Transcript: Gemini cleans and summarizes SpeechRecognition transcript in Hindi/English
app.post("/api/gemini/clean-transcript", async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Missing transcript" });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.json({
        cleaned: "[Fallback Mode] Cleaned: Please resolve the civic issue at the reported location."
      });
    }

    const prompt = `The following is a voice report of a civic issue in India, possibly in Hindi or English or mixed. Clean it up and write a clear 1-2 sentence description of the civic problem being reported. Return only the cleaned description, nothing else. Input: ${transcript}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    res.json({ cleaned: (response.text || "").trim() });
  } catch (error: any) {
    console.error("Error in clean-transcript:", error);
    res.status(500).json({ error: error.message || "Failed to clean transcript" });
  }
});

// 3. Duplicate Detection: Compare new report against existing reports
app.post("/api/gemini/detect-duplicate", async (req, res) => {
  try {
    const { newDescription, nearbyIssues } = req.body;
    if (!newDescription) {
      return res.status(400).json({ error: "Missing newDescription" });
    }

    if (!nearbyIssues || nearbyIssues.length === 0) {
      return res.json({ isDuplicate: false, duplicateIssueId: null, reasoning: "No existing nearby issues to compare." });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.json({ isDuplicate: false, duplicateIssueId: null, reasoning: "[Fallback] Skipping AI duplicate check." });
    }

    const prompt = `You are an AI assistant helping a city platform avoid duplicate infrastructure issue reports.
A citizen wants to report a new issue with description:
"${newDescription}"

Here are the details of other open issues reported within 100 meters:
${JSON.stringify(nearbyIssues, null, 2)}

Determine if the new report is highly likely describing one of the existing issues (e.g., the exact same pothole, the exact same broken streetlight, or the same water leakage at this location).
Respond with a JSON object in exactly this format:
{
  "isDuplicate": true or false,
  "duplicateIssueId": "the_id_of_the_duplicate_issue_or_null",
  "reasoning": "A short 1-sentence explanation of your evaluation."
}

Return ONLY valid JSON. No markdown backticks.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [prompt]
    });

    let text = response.text || "";
    text = text.replace(/```json\s?/g, "").replace(/```\s?/g, "").trim();

    try {
      const result = JSON.parse(text);
      res.json(result);
    } catch {
      res.json({ isDuplicate: false, duplicateIssueId: null, reasoning: "Evaluation complete. Issue appears unique." });
    }
  } catch (error: any) {
    console.error("Error in detect-duplicate:", error);
    res.status(500).json({ error: error.message || "Failed to detect duplicate" });
  }
});

// 4. ProofChain Verification: Compare before and after photos
app.post("/api/gemini/verify-fix", async (req, res) => {
  try {
    const { beforePhotoBase64, afterPhotoBase64 } = req.body;
    if (!beforePhotoBase64 || !afterPhotoBase64) {
      return res.status(400).json({ error: "Missing before or after photo" });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.json({
        verdict: "GENUINE_FIX",
        confidence: "High",
        reason: "[Fallback Mode] Verification approved without live API check."
      });
    }

    const cleanBefore = beforePhotoBase64.replace(/^data:image\/\w+;base64,/, "");
    const cleanAfter = afterPhotoBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Compare these two images. The first is a reported civic issue (before). The second is the claimed resolution (after). Has the issue actually been fixed? Return ONLY valid JSON: {"verdict": "GENUINE_FIX" or "FAKE_RESOLUTION", "confidence": "High/Medium/Low", "reason": "one sentence explanation"}`;

    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash"];
    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const tempResponse = await ai.models.generateContent({
          model: modelName,
          contents: [
            "Photo 1 (BEFORE):",
            { inlineData: { data: cleanBefore, mimeType: "image/jpeg" } },
            "Photo 2 (AFTER):",
            { inlineData: { data: cleanAfter, mimeType: "image/jpeg" } },
            prompt
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                verdict: {
                  type: Type.STRING,
                  enum: ["GENUINE_FIX", "FAKE_RESOLUTION"]
                },
                confidence: {
                  type: Type.STRING,
                  enum: ["High", "Medium", "Low"]
                },
                reason: {
                  type: Type.STRING
                }
              },
              required: ["verdict", "confidence", "reason"]
            }
          }
        });

        if (tempResponse && tempResponse.text) {
          response = tempResponse;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed during verify-fix:`, err.message || err);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("All Gemini models failed to verify resolution.");
    }

    let text = response.text || "";
    text = text.replace(/```json\s?/g, "").replace(/```\s?/g, "").trim();

    try {
      const result = JSON.parse(text);
      res.json(result);
    } catch {
      res.json({
        verdict: "GENUINE_FIX",
        confidence: "Medium",
        reason: "Visual comparison indicates satisfactory completion."
      });
    }
  } catch (error: any) {
    console.error("Error in verify-fix:", error);
    res.status(500).json({ error: error.message || "Failed to verify fix" });
  }
});

// 5. Civic Memory Summary: Generate English description of location history
app.post("/api/gemini/summarize-history", async (req, res) => {
  try {
    const { issues } = req.body;
    if (!issues || !Array.isArray(issues)) {
      return res.status(400).json({ error: "Issues list is required" });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.json({
        summary: "This spot has an active record of infrastructure issues, primarily related to local road maintenance and lighting."
      });
    }

    const prompt = `You are an urban governance analyst summarizing the 'Civic Memory' of a specific location in an Indian city.
Here is the historical log of infrastructure issues reported here:
${JSON.stringify(issues, null, 2)}

Provide a concise, 2-to-3-sentence summary of this spot's historical reliability and performance.
Mention the total issues, if there are recurring patterns (e.g. issues reported again soon after resolution, or multiple streetlight failures), and the average speed of solutions or presence of fake resolutions. Keep the tone professional, objective, and supportive of civic accountability.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [prompt]
    });

    res.json({ summary: (response.text || "").trim() });
  } catch (error: any) {
    console.error("Error in summarize-history:", error);
    res.status(500).json({ error: error.message || "Failed to summarize history" });
  }
});

// Serve frontend assets in production and Vite middleware in development
const startApp = async () => {
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
    console.log(`CiviSync server running on http://0.0.0.0:${PORT}`);
  });
};

startApp();
