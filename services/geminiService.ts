
import { GoogleGenAI, Type } from "@google/genai";
import { WordEvolution } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchWordEvolution = async (word: string): Promise<WordEvolution> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Trace the etymological journey of the word "${word}" through time and geography. Provide a detailed timeline of how it moved between languages and regions from its earliest known root to modern usage.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          originWord: { type: Type.STRING },
          modernWord: { type: Type.STRING },
          etymologySummary: { type: Type.STRING },
          timeline: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                year: { type: Type.INTEGER, description: "Approximate year or century (use negative for BCE)" },
                latitude: { type: Type.NUMBER, description: "Geographic latitude of this linguistic stage" },
                longitude: { type: Type.NUMBER, description: "Geographic longitude of this linguistic stage" },
                language: { type: Type.STRING },
                word: { type: Type.STRING, description: "The form of the word at this stage" },
                description: { type: Type.STRING, description: "Brief historical context" },
                region: { type: Type.STRING }
              },
              required: ["year", "latitude", "longitude", "language", "word", "description", "region"]
            }
          }
        },
        required: ["originWord", "modernWord", "etymologySummary", "timeline"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from AI");
  
  return JSON.parse(text) as WordEvolution;
};
