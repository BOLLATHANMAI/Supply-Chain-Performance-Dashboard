
import { GoogleGenAI, Type } from "@google/genai";
import { Shipment, InsightReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeSupplyChainData = async (shipments: Shipment[]): Promise<InsightReport> => {
  // We send a summary rather than the whole raw dataset to save tokens and improve quality
  const carrierStats = shipments.reduce((acc: any, s) => {
    if (!acc[s.carrier]) acc[s.carrier] = { cost: 0, delay: 0, count: 0 };
    acc[s.carrier].cost += s.freightCost;
    acc[s.carrier].delay += s.delay;
    acc[s.carrier].count += 1;
    return acc;
  }, {});

  const prompt = `Analyze this supply chain data summary and provide strategic insights:
  Data Summary:
  - Total Shipments: ${shipments.length}
  - Overall Stats by Carrier: ${JSON.stringify(carrierStats)}
  - High Priority Delayed Shipments: ${shipments.filter(s => s.priority === 'High' && s.delay > 0).length}

  Please identify key inefficiencies and provide actionable recommendations.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyInefficiencies: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "keyInefficiencies", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Failed to load AI insights. Check API key and network.",
      keyInefficiencies: ["Analysis unavailable"],
      recommendations: ["Ensure API key is correctly configured"]
    };
  }
};
