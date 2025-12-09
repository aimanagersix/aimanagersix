import { GoogleGenAI, Type } from "@google/genai";
import { getSupabase } from "./supabaseClient";
import { VulnerabilityScanConfig } from "../types";

let aiInstance: GoogleGenAI | null = null;

// Model Definitions
const flashModel = "gemini-2.5-flash";
const proModel = "gemini-3-pro-preview";

// --- SECURITY LOGIC ---
// If API_KEY is present in env (Dev mode), we use direct client.
// If NOT present, we fall back to Supabase Edge Function (Prod/Secure mode).
const API_KEY = process.env.API_KEY;
const USE_PROXY = !API_KEY;

export const isAiConfigured = (): boolean => {
    // In Proxy mode, we assume the backend is configured. 
    // In Direct mode, we need the key.
    return USE_PROXY || (!!API_KEY && API_KEY.length > 0);
};

const getAiClient = (): GoogleGenAI => {
    if (USE_PROXY) {
        throw new Error("Client-side Gemini instance prohibited in Proxy Mode.");
    }
    if (aiInstance) return aiInstance;
    if (!API_KEY) throw new Error("API Key missing for direct mode.");
    
    aiInstance = new GoogleGenAI({ apiKey: API_KEY });
    return aiInstance;
};

// --- HELPER: CENTRALIZED REQUEST HANDLER ---
// This function decides whether to call Google directly or via Supabase Proxy
const runGeminiRequest = async (
    modelName: string, 
    prompt: string, 
    images: { data: string, mimeType: string }[] = [],
    schema?: any,
    responseMimeType?: string
): Promise<string> => {
    
    // 1. SECURE MODE (PROXY VIA SUPABASE)
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
            console.error("Edge Function Error:", error);
            throw new Error(`Erro no servidor de IA: ${error.message}`);
        }
        
        // The Edge Function should return { text: "..." }
        return data?.text || "";
    }

    // 2. DEV MODE (DIRECT CLIENT)
    const ai = getAiClient();
    
    const parts: any[] = [];
    
    // Add Images
    images.forEach(img => {
        parts.push({
            inlineData: {
                data: img.data,
                mimeType: img.mimeType,
            },
        });
    });

    // Add Text Prompt
    parts.push({ text: prompt });

    const config: any = {};
    if (responseMimeType) config.responseMimeType = responseMimeType;
    if (schema) config.responseSchema = schema;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: config
    });

    return response.text ? response.text.trim() : "";
};


// --- EXPORTED FUNCTIONS (Refactored to use runGeminiRequest) ---

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const prompt = "Extract the most prominent serial number or alphanumeric code from this image. Return only the code itself, with no additional text or labels.";
    return await runGeminiRequest(flashModel, prompt, [{ data: base64Image, mimeType }]);
  } catch (error) {
    console.error("Error extracting text:", error);
    throw new Error("Failed to analyze image.");
  }
};

export const getDeviceInfoFromText = async (serialNumber: string): Promise<{ brand: string; type: string }> => {
    try {
        const prompt = `Based on the serial number or model code "${serialNumber}", identify the brand and type of the electronic device. For example, for "SN-DELL-001", you might respond with Dell and Laptop.`;
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
        console.error("Error getting device info:", error);
        return { brand: "Desconhecida", type: "Desconhecido" };
    }
};

export const suggestPeripheralsForKit = async (primaryDevice: { brand: string; type: string; description: string }): Promise<Array<{ brandName: string; typeName: string; description: string }>> => {
    try {
        const prompt = `For a primary device that is a ${primaryDevice.brand} ${primaryDevice.type} described as "${primaryDevice.description}", suggest a standard set of peripherals.`;
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
        console.error("Error suggesting peripherals:", error);
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
        const prompt = `
        You are an IT Asset Manager Assistant. Analyze the user request: "${text}".
        Context: Brands: ${JSON.stringify(context.brands)}, Types: ${JSON.stringify(context.types)}, Users: ${JSON.stringify(context.users.map(u=>u.name))}.
        Determine intent ('create_equipment', 'create_ticket', 'search').
        `;
        
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
        const prompt = `Act as an Expert IT Manager. Analyze this JSON data for a "${reportType}" report: ${contextString}. Generate an HTML Executive Summary (in Portuguese) with sections: Summary, Risk Analysis, Insights, Recommendations. Use <h3>, <ul>, <strong>. No markdown.`;
        
        return await runGeminiRequest(proModel, prompt);
    } catch (error) {
        return "<p>Erro ao gerar relatório.</p>";
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
        const prompt = `Analyze IT ticket: "${description}". Categorize, prioritize (Low/Medium/High/Critical), suggest fix, check if security incident.`;
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
        throw new Error("Failed to analyze ticket.");
    }
};

export const parseSecurityAlert = async (rawJson: string): Promise<any> => {
    try {
        const prompt = `Act as SOC Analyst. Parse security alert JSON: ${rawJson.substring(0,10000)}. Extract title, description, severity (Baixa/Média/Alta/Crítica), affectedAsset, incidentType, sourceSystem.`;
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
            required: ["title", "description"]
        };
        const jsonStr = await runGeminiRequest(proModel, prompt, [], schema, "application/json");
        return JSON.parse(jsonStr || "{}");
    } catch (error) {
        return { title: "Parse Failed", description: rawJson };
    }
};

export const generateTicketResolutionSummary = async (ticketDescription: string, activities: string[]): Promise<string> => {
    const prompt = `Summarize ticket resolution for KB. Problem: "${ticketDescription}". Notes: ${JSON.stringify(activities)}. Format: **Problem**, **Cause**, **Resolution**. Portuguese.`;
    return await runGeminiRequest(proModel, prompt);
};

export const findSimilarPastTickets = async (currentDescription: string, pastResolvedTickets: any[]): Promise<any> => {
    try {
        const context = pastResolvedTickets.slice(0, 50).map(t => ({ id: t.id, desc: t.description.substring(0, 100), res: t.resolution }));
        const prompt = `New Ticket: "${currentDescription}". Past Tickets: ${JSON.stringify(context)}. Find EXACT similar problem? Return found boolean, ticketId, resolution.`;
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
    const prompt = "Analyze backup screenshot. Extract status (Sucesso/Falha/Parcial), date (YYYY-MM-DD), systemName.";
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
        const prompt = `Act as Vulnerability Scanner. Inventory: ${JSON.stringify(inventory)}. Config: ${JSON.stringify(config)}. Identify up to 5 critical/high CVEs commonly associated with this software. Return JSON array.`;
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
    const prompt = `Generate NIS2 incident notification JSON and HTML summary for: ${JSON.stringify(ticket)}. Activities: ${JSON.stringify(activities)}. Anonymize PII.`;
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
    const prompt = `Analyze user risk based on ticket history: ${JSON.stringify(ticketHistory)}. Recommend training?`;
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
    const prompt = "Analyze cybersecurity report (pentest). Extract critical findings: Title, Description, Severity (Baixa/Média/Alta/Crítica), Remediation.";
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
    const prompt = `Generate PostgreSQL query for: "${userRequest}". Return ONLY SQL code.`;
    return await runGeminiRequest(proModel, prompt);
};

export const generatePlaywrightTest = async (userPrompt: string, credentials: {email: string, pass: string}): Promise<string> => {
    const prompt = `Generate Playwright TypeScript test for: "${userPrompt}". Use creds: ${credentials.email}. Return ONLY code.`;
    return await runGeminiRequest(proModel, prompt);
};
