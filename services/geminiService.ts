
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
 * Executes a request to Gemini models following strict SDK guidelines v21.
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
            console.error("[Diamond Proxy Error]:", error);
            const msg = error.message || "Erro de ligação à Edge Function.";
            if (msg.includes("Requested entity was not found")) {
                 return "ERRO_AUTH: Selecione uma chave de API válida no Supabase.";
            }
            throw new Error(`IA Offline: ${msg}`);
        }
        return data?.text || "";
    }

    // Direct mode Diamond Edition
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

        // SDK compliance: .text property access
        const result = response.text;
        if (!result) throw new Error("Resposta vazia da IA.");
        return result.trim();
    } catch (e: any) {
        console.error("[Diamond Direct Error]:", e);
        throw new Error(`IA Error: ${e.message}`);
    }
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const prompt = "Extract the most prominent serial number or alphanumeric code from this image. Return only the code itself, with no additional text or labels.";
    return await runGeminiRequest(flashModel, prompt, [{ data: base64Image, mimeType }]);
  } catch (error) {
    console.error("Vision Analysis Error:", error);
    throw new Error("Falha ao analisar imagem. Verifique a qualidade da foto.");
  }
};

export const getDeviceInfoFromText = async (serialNumber: string): Promise<{ brand: string; type: string }> => {
    try {
        const prompt = `Based on the serial number or model code "${serialNumber}", identify the brand and type of the electronic device. JSON output.`;
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
        console.error("Device ID Error:", error);
        return { brand: "Desconhecida", type: "Desconhecido" };
    }
};

export const suggestPeripheralsForKit = async (primaryDevice: { brand: string; type: string; description: string }): Promise<Array<{ brandName: string; typeName: string; description: string }>> => {
    try {
        const prompt = `For a primary device that is a ${primaryDevice.brand} ${primaryDevice.type} described as "${primaryDevice.description}", suggest standard peripherals.`;
        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    brandName: { type: Type.STRING },
                    typeName: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["brandName", "typeName", "description"]
            }
        };

        const jsonStr = await runGeminiRequest(flashModel, prompt, [], schema, "application/json");
        return JSON.parse(jsonStr || "[]");
    } catch (error) {
        return [];
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
        const prompt = `Assistant IT Manager. User request: "${text}". Confidence and intent identification. Context provided: ${JSON.stringify(context)}.`;
        
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

export const generateExecutiveReport = async (reportType: string, dataContext: any): Promise<string> => {
    try {
        const contextString = JSON.stringify(dataContext).substring(0, 30000);
        const prompt = `Expert IT Manager. HTML Executive Summary (PT-PT) for "${reportType}": ${contextString}. Sections: Summary, Risk, Insights, Recommendations.`;
        return await runGeminiRequest(proModel, prompt);
    } catch (error) {
        return "<p>Erro ao gerar relatório com IA.</p>";
    }
};

export interface TicketTriageResult {
    suggestedCategory: string;
    suggestedPriority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
    suggestedSolution: string;
    isSecurityIncident: boolean;
}

export const analyzeTicketRequest = async (description: string): Promise<TicketTriageResult> => {
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

export const parseSecurityAlert = async (rawJson: string): Promise<any> => {
    try {
        const prompt = `SOC Analyst. Parse security alert JSON: ${rawJson.substring(0,10000)}.`;
        const schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING },
                affectedAsset: { type: Type.STRING },
                incidentType: { type: Type.STRING },
                sourceSystem: { type: Type.STRING }
            },
            required: ["title", "description", "affectedAsset"]
        };
        const jsonStr = await runGeminiRequest(proModel, prompt, [], schema, "application/json");
        return JSON.parse(jsonStr || "{}");
    } catch (error) {
        return { title: "Parse Failed", description: rawJson, affectedAsset: "Unknown" };
    }
};

export const generateTicketResolutionSummary = async (ticketDescription: string, activities: string[]): Promise<string> => {
    try {
        const prompt = `Summarize ticket resolution for KB. Problem: "${ticketDescription}". Notes: ${JSON.stringify(activities)}.`;
        return await runGeminiRequest(proModel, prompt);
    } catch (e) { return "Resumo indisponível."; }
};

export const findSimilarPastTickets = async (currentDescription: string, pastResolvedTickets: any[]): Promise<any> => {
    try {
        const context = pastResolvedTickets.slice(0, 50).map(t => ({ id: t.id, desc: t.description.substring(0, 100), res: t.resolution }));
        const prompt = `New Ticket: "${currentDescription}". Past Tickets: ${JSON.stringify(context)}. Exact match search.`;
        const schema = {
            type: Type.OBJECT,
            properties: {
                found: { type: Type.BOOLEAN },
                ticketId: { type: Type.STRING },
                similarityReason: { type: Type.STRING },
                resolution: { type: Type.STRING }
            },
            required: ["found"]
        };
        const jsonStr = await runGeminiRequest(proModel, prompt, [], schema, "application/json");
        return JSON.parse(jsonStr || "{}");
    } catch (error) {
        return { found: false };
    }
};

export const analyzeBackupScreenshot = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<any> => {
    const prompt = "Analyze backup screenshot status, date, system.";
    const schema = {
        type: Type.OBJECT,
        properties: {
            status: { type: Type.STRING, enum: ['Sucesso', 'Falha', 'Parcial'] },
            date: { type: Type.STRING },
            systemName: { type: Type.STRING }
        },
        required: ["status", "date"]
    };
    const jsonStr = await runGeminiRequest(flashModel, prompt, [{ data: base64Image, mimeType }], schema, "application/json");
    return JSON.parse(jsonStr || "{}");
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
    const prompt = `NIS2 incident notification. ${JSON.stringify(ticket)}. JSON and HTML format.`;
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

export const analyzeCollaboratorRisk = async (ticketHistory: any[]): Promise<any> => {
    const prompt = `User risk analysis: ${JSON.stringify(ticketHistory)}. Training module recommendation.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            needsTraining: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            recommendedModule: { type: Type.STRING }
        },
        required: ["needsTraining"]
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

export const generateSqlHelper = async (userRequest: string): Promise<string> => {
    const prompt = `PostgreSQL query generator: "${userRequest}". SQL Code only.`;
    return await runGeminiRequest(proModel, prompt);
};

export const generatePlaywrightTest = async (userPrompt: string, credentials: {email: string, pass: string}): Promise<string> => {
    const prompt = `Playwright TS test generator: "${userPrompt}".`;
    return await runGeminiRequest(proModel, prompt);
};
