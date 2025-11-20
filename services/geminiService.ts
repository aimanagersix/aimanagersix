
import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
const model = "gemini-2.5-flash";

const getAiClient = (): GoogleGenAI => {
    if (aiInstance) {
        return aiInstance;
    }

    // Helper to safely get env vars
    const getEnvVar = (key: string) => {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            // @ts-ignore
            return import.meta.env[key];
        }
        try {
            if (typeof process !== 'undefined' && process.env && process.env[key]) {
                return process.env[key];
            }
        } catch (e) {}
        return '';
    };

    // Prioritize localStorage
    const API_KEY = localStorage.getItem('API_KEY') || getEnvVar('API_KEY') || getEnvVar('VITE_API_KEY');

    if (!API_KEY) {
        console.error("A chave da API Gemini não está configurada.");
        throw new Error("A chave da API Gemini não está configurada.");
    }

    aiInstance = new GoogleGenAI({ apiKey: API_KEY });
    return aiInstance;
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    };
    const textPart = {
        text: "Extract the most prominent serial number or alphanumeric code from this image. Return only the code itself, with no additional text or labels."
    };
    
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, textPart] },
    });
    
    return response.text ? response.text.trim() : "";
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw new Error("Failed to analyze image with Gemini API.");
  }
};

export const getDeviceInfoFromText = async (serialNumber: string): Promise<{ brand: string; type: string }> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: model,
            contents: `Based on the serial number or model code "${serialNumber}", identify the brand and type of the electronic device. For example, for "SN-DELL-001", you might respond with Dell and Laptop.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        brand: {
                            type: Type.STRING,
                            description: "The brand of the device (e.g., Dell, HP, Apple)."
                        },
                        type: {
                            type: Type.STRING,
                            description: "The type of device (e.g., Laptop, Monitor, Keyboard)."
                        }
                    },
                    required: ["brand", "type"]
                }
            }
        });

        const jsonText = response.text ? response.text.trim() : "{}";
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error getting device info:", error);
        throw new Error("Failed to get device info with Gemini API.");
    }
};

export const suggestPeripheralsForKit = async (primaryDevice: { brand: string; type: string; description: string }): Promise<Array<{ brandName: string; typeName: string; description: string }>> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: model,
            contents: `For a primary device that is a ${primaryDevice.brand} ${primaryDevice.type} described as "${primaryDevice.description}", suggest a standard set of peripherals (like Monitor, Keyboard, Mouse, Docking Station if applicable). For each peripheral, provide a common brand and a generic model name or description. The brand should be plausible (e.g., a Dell monitor for a Dell computer).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            brandName: {
                                type: Type.STRING,
                                description: "A common brand for this type of peripheral (e.g., Dell, Logitech)."
                            },
                            typeName: {
                                type: Type.STRING,
                                description: "The type of the peripheral (e.g., Monitor, Keyboard, Mouse)."
                            },
                            description: {
                                type: Type.STRING,
                                description: "A generic model name or description (e.g., UltraSharp U2422H, KM5221W Wireless Keyboard & Mouse)."
                            }
                        },
                        required: ["brandName", "typeName", "description"]
                    }
                }
            }
        });

        const jsonText = response.text ? response.text.trim() : "[]";
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error suggesting peripherals:", error);
        throw new Error("Failed to get peripheral suggestions with Gemini API.");
    }
};
