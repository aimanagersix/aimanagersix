
import { GoogleGenAI, Type } from "@google/genai";
import { getSupabase } from "./supabaseClient";
import { VulnerabilityScanConfig } from "../types";

// Model Definitions
const flashModel = "gemini-3-flash-preview";
const proModel = "gemini-3-pro-preview";

// --- SECURITY LOGIC ---
const USE_PROXY = !process.env.API_KEY;

export const isAiConfigured = (): boolean => {
    return USE_PROXY || (!!process.env.API_KEY && process.env.API_KEY.length > 0);
};

/**
 * Executes a request to Gemini models following strict SDK guidelines v25.
 * Uses .text property instead of .text() method.
 */
const runGeminiRequest = async (
    modelName: string, 
    prompt: string, 
    images: { data: string, mimeType: string }[] = [],
    schema?: any,
    responseMimeType?: string
): Promise<string> => {
    if (USE_PROXY) {
        const supabase = getSupabase();
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: {
                model: modelName,
                prompt: prompt,
                images: images,
                config: {
                    responseMimeType: responseMimeType,
                    responseSchema: schema
                }
            }
        });

        if (error) {
            console.error("[Absolute Proxy Error]:", error);
            const msg = error.message || "IA Offline.";
            throw new Error(`IA Error: ${msg}`);
        }
        return data?.text || "";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const parts: any[] = [];
    images.forEach(img => {
        parts.push({
            inlineData: {
                data: img.data,
                mimeType: img.mimeType,
            },
        });
    });
    parts.push({ text: prompt });

    const config: any = {};
    if (responseMimeType) config.responseMimeType = responseMimeType;
    if (schema) config.responseSchema = schema;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: config
        });

        const result = response.text;
        if (result === undefined) throw new Error("Resposta vazia da IA.");
        return result.trim();
    } catch (e: any) {
        console.error("[Absolute Direct Error]:", e);
        throw new Error(`IA Error: ${e.message}`);
    }
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const prompt = "Extract the most prominent serial number or alphanumeric code from this image. Return only the code itself.";
    return await runGeminiRequest(flashModel, prompt, [{ data: base64Image, mimeType }]);
  } catch (error) {
    console.error("Vision Error:", error);
    throw new Error("Falha na análise visual.");
  }
};

export const getDeviceInfoFromText = async (serialNumber: string): Promise<{ brand: string; type: string }> => {
    try {
        const prompt = `Based on serial "${serialNumber}", identify brand and type. JSON output.`;
        const schema = {
            type: Type.OBJECT,
            properties: {
                brand: { type: Type.STRING },
                type: { type: Type.STRING }
            },
            required: ["brand", "type"]
        };
        
        const jsonStr = await runGeminiRequest(flashModel, prompt, [], schema, "application/json");
        return JSON.parse(jsonStr || "{}");
    } catch (error) {
        return { brand: "Desconhecida", type: "Desconhecido" };
    }
};

export interface MagicActionResponse {
    intent: 'create_equipment' | 'create_ticket' | 'search' | 'unknown';
    data?: any;
    confidence: number;
}

export const parseNaturalLanguageAction = async (
    text: string, 
    context: { brands: string[], types: string[], users: {name: string, id: string}[], currentUser: string }
): Promise<MagicActionResponse> => {
    try {
        const prompt = `Assistant IT Manager. User request: "${text}". Context: ${JSON.stringify(context)}. Identify intent and data.`;
        const schema = {
            type: Type.OBJECT,
            properties: {
                intent: { type: Type.STRING, enum: ['create_equipment', 'create_ticket', 'search', 'unknown'] },
                data: {
                    type: Type.OBJECT,
                    properties: {
                        brandName: { type: Type.STRING },
                        typeName: { type: Type.STRING },
                        serialNumber: { type: Type.STRING },
                        description: { type: Type.STRING },
                        assignedToUserName: { type: Type.STRING },
                        title: { type: Type.STRING },
                        requesterName: { type: Type.STRING },
                        priority: { type: Type.STRING },
                        query: { type: Type.STRING }
                    }
                },
                confidence: { type: Type.NUMBER }
            },
            required: ["intent", "confidence"]
        };

        const jsonStr = await runGeminiRequest(flashModel, prompt, [], schema, "application/json");
        return JSON.parse(jsonStr || "{}");
    } catch (error) {
        return { intent: 'unknown', confidence: 0 };
    }
};

export const analyzeTicketRequest = async (description: string): Promise<any> => {
    try {
        const prompt = `Analyze IT ticket: "${description}". Categorize, prioritize, solution suggested.`;
        const schema = {
            type: Type.OBJECT,
            properties: {
                suggestedCategory: { type: Type.STRING },
                suggestedPriority: { type: Type.STRING, enum: ['Baixa', 'Média', 'Alta', 'Crítica'] },
                suggestedSolution: { type: Type.STRING },
                isSecurityIncident: { type: Type.BOOLEAN }
            },
            required: ["suggestedCategory", "suggestedPriority", "suggestedSolution", "isSecurityIncident"]
        };

        const jsonStr = await runGeminiRequest(proModel, prompt, [], schema, "application/json");
        return JSON.parse(jsonStr || "{}");
    } catch (error) {
        throw new Error("Falha na análise IA do ticket.");
    }
};

export const generateTicketResolutionSummary = async (description: string, activities: string[]): Promise<string> => {
    try {
        const activityContext = activities.length > 0 ? activities.join('; ') : "Sem notas técnicas registadas.";
        const prompt = `As a professional IT Support, write a clean, 2-3 sentence technical summary of the solution for the following ticket: "${description}".
        The technicians performed these actions: "${activityContext}". 
        Language: Portuguese (PT). Be direct and factual for a Knowledge Base entry.`;
        
        return await runGeminiRequest(flashModel, prompt);
    } catch (error) {
        console.error("Summary Generation Error:", error);
        throw new Error("Falha ao gerar resumo da resolução.");
    }
};

export const analyzeBackupScreenshot = async (base64Image: string, mimeType: string): Promise<{ status: string; date: string; systemName: string }> => {
    try {
        const prompt = "Analyze this backup report screenshot. Extract: 1. Status (Sucesso, Falha, or Parcial), 2. Date of backup (YYYY-MM-DD), 3. System Name. JSON output.";
        const schema = {
            type: Type.OBJECT,
            properties: {
                status: { type: Type.STRING, enum: ['Sucesso', 'Falha', 'Parcial'] },
                date: { type: Type.STRING },
                systemName: { type: Type.STRING }
            },
            required: ["status", "date", "systemName"]
        };
        const jsonStr = await runGeminiRequest(flashModel, prompt, [{ data: base64Image, mimeType }], schema, "application/json");
        return JSON.parse(jsonStr || "{}");
    } catch (error) {
        console.error("Backup Analysis Error:", error);
        throw new Error("Falha na análise visual do backup.");
    }
};

export const scanForVulnerabilities = async (inventory: string[], config?: VulnerabilityScanConfig): Promise<any[]> => {
    try {
        const prompt = `Vulnerability Scanner. Inventory: ${JSON.stringify(inventory)}. High/Critical CVEs search.`;
        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    cve_id: { type: Type.STRING },
                    description: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    affected_software: { type: Type.STRING },
                    remediation: { type: Type.STRING }
                },
                required: ["cve_id", "severity"]
            }
        };
        const jsonStr = await runGeminiRequest(proModel, prompt, [], schema, "application/json");
        return JSON.parse(jsonStr || "[]");
    } catch (error) {
        return [];
    }
};

export const generateNis2Notification = async (ticket: any, activities: any[]): Promise<any> => {
    const prompt = `NIS2 incident notification. ${JSON.stringify(ticket)}. JSON output.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            report_json: { type: Type.STRING },
            report_summary_html: { type: Type.STRING }
        },
        required: ["report_json", "report_summary_html"]
    };
    const jsonStr = await runGeminiRequest(proModel, prompt, [], schema, "application/json");
    return JSON.parse(jsonStr || "{}");
};

export const extractFindingsFromReport = async (base64File: string, mimeType: string): Promise<any[]> => {
    const prompt = "Pentest report analysis. Extract critical findings.";
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING },
                remediation: { type: Type.STRING }
            },
            required: ["title", "severity"]
        }
    };
    const jsonStr = await runGeminiRequest(flashModel, prompt, [{ data: base64File, mimeType }], schema, "application/json");
    return JSON.parse(jsonStr || "[]");
};
