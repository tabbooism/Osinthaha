import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy-initialize Gemini client
  let aiClient: GoogleGenAI | null = null;
  function getGemini(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("WARNING: GEMINI_API_KEY env variable is not set. Using fallback key for initial safety checks.");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey || "MOCK_KEY",
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // API Check Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Main profiling endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { name, role, baseTraits, baseFacts, options } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Subject Name is required" });
      }

      const gemini = getGemini();

      const prompt = `
        You are a highly sophisticated Intelligence Analyst, Clinical Psychologist, and strategic advisor.
        Perform an deeply comprehensive, clinical-grade psychological dossier and Robert Greene-styled (Laws of Power) strategic threat assessment of the following subject.
        All analysis of behavioral data, "red ops" simulations, and social engineering risk assessments must serve educational and defensive security training purposes only, specifically teaching security awareness and physical or intellectual infrastructure security defenses.

        SUBJECT PROFILE:
        - Name: ${name}
        - Role / Position: ${role || "Not specified"}
        - Base Personality Traits: ${baseTraits || "Standard blend"}
        - Base Facts / Logistical Background: ${baseFacts || "Not specified"}
        - Strategic Directives / Analysis Focus: ${options || "General defense mapping"}

        INSTRUCTIONS:
        1. Construct a clinical-grade psychoanalytical portrait of the cognitive profiles, stress markers, motivators, and default psychological ego-defenses.
        2. Draft a Robert Greene Laws of Power matrix tailored specifically to the subject's positional vulnerability, identifying exactly which physical, cognitive, or logical Laws in the playbook they are susceptible to (providing exactly 3 extremely relevant Robert Greene laws, their numbers, titles, and strategic relevance to this person). Include high-level strategic leverage points.
        3. Draft a security awareness threat-modeling assessment on behavioral vulnerabilities ("Red Ops Human Vector Mapping"). Define susceptibility scores (between 0 and 100) and rationale for vectors such as Authority, Reciprocity, Social Proof, Urgency, technical pretexts, and flattery.
        4. Develop a theoretical tabletop simulation scenario ("Interactive Defense Simulation") trying to assess or train defenses for this profile, containing a setting, an NPC dialogue snippet leveraging his vulnerabilities, and 4 logical choices or approaches. For each choice, provide the psychological playout results and indicate whether that choice successfully defends or exposes the subject.

        Respond strictly in the requested JSON structure.
      `;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          clinicalDossier: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              cognitiveProfile: { type: Type.STRING },
              psychDefenseMechanisms: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              coreMotivators: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              stressors: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              interpersonalStyle: { type: Type.STRING }
            },
            required: ["summary", "cognitiveProfile", "psychDefenseMechanisms", "coreMotivators", "stressors", "interpersonalStyle"]
          },
          greeneAnalysis: {
            type: Type.OBJECT,
            properties: {
              dominantRobertGreeneLaws: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    lawNumber: { type: Type.INTEGER },
                    lawTitle: { type: Type.STRING },
                    relevance: { type: Type.STRING }
                  },
                  required: ["lawNumber", "lawTitle", "relevance"]
                }
              },
              powerVulnerabilities: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              leverageTactics: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["dominantRobertGreeneLaws", "powerVulnerabilities", "leverageTactics"]
          },
          redOpsAssessment: {
            type: Type.OBJECT,
            properties: {
              susceptibilityMeters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    vectorName: { type: Type.STRING },
                    score: { type: Type.INTEGER },
                    explanation: { type: Type.STRING }
                  },
                  required: ["vectorName", "score", "explanation"]
                }
              },
              socialEngineeringVectors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    scenarioName: { type: Type.STRING },
                    psychologicalTriggers: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    simulationReaction: { type: Type.STRING },
                    defensiveMitigation: { type: Type.STRING }
                  },
                  required: ["scenarioName", "psychologicalTriggers", "simulationReaction", "defensiveMitigation"]
                }
              }
            },
            required: ["susceptibilityMeters", "socialEngineeringVectors"]
          },
          interactiveSimulation: {
            type: Type.OBJECT,
            properties: {
              scenarioTitle: { type: Type.STRING },
              settingDescription: { type: Type.STRING },
              npcDialogue: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    resultDescription: { type: Type.STRING },
                    success: { type: Type.BOOLEAN }
                  },
                  required: ["label", "resultDescription", "success"]
                }
              }
            },
            required: ["scenarioTitle", "settingDescription", "npcDialogue", "options"]
          }
        },
        required: ["clinicalDossier", "greeneAnalysis", "redOpsAssessment", "interactiveSimulation"]
      };

      const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional clinical intelligence agent specializing in defensive profiling and cognitive security risk mapping. Deliver high-fidelity, polished insight.",
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.2
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response returned from Gemini API");
      }

      // Check if response is valid JSON
      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);

    } catch (error: any) {
      console.error("Analysis Exception:", error);
      res.status(500).json({
        error: "Failed to generate dossier. Please check server logs and configuration.",
        details: error?.message || String(error)
      });
    }
  });

  // Vite Integration for development / static serving for production
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
    console.log(`PsycheOps Full Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
