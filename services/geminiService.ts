
import { GoogleGenAI, Type } from "@google/genai";
import { getSupabase } from "./supabaseClient";
import { VulnerabilityScanConfig } from "../types";

// Model Definitions
const flashModel = "gemini-3-flash-preview";
const proModel = "gemini-3-pro-preview";

/**
 * Verifica como a IA está configurada.
 * Retorna 'direct' se houver chave no .env local, 'proxy' se for usar Supabase, ou 'none'.
 */
export const getAiConfigurationType = (): 'direct' | 'proxy' | 'none' => {
    if (process.env.API_KEY && process.env.API_KEY.length > 5) {
        return 'direct';
    }
    // Se não há chave local, assumimos que o utilizador quer usar o Proxy do Supabase
    return 'proxy';
};

export const isAiConfigured = (): boolean => {
    return getAiConfigurationType() !== 'none';
};

/**
 * Executa um pedido à Gemini.
 * Se tivermos chave local, vai direto. Se não, usa a Edge Function do Supabase.
 */
const runGeminiRequest = async (
    modelName: string, 
    prompt: string, 
    images: { data: string, mimeType: string }[] = [],
    schema?: any,
    responseMimeType?: string
): Promise<string> => {
    const configType = getAiConfigurationType();

    // MODO 1: VIA PROXY (Supabase Secrets)
    if (configType === 'proxy') {
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
            console.error("[AI Bridge Error]:", error);
            // Se o erro for "Not Found", é porque a função ainda não foi publicada
            if (error.message?.includes('404')) {
                throw new Error("Ponte de IA não encontrada. Publicou a função 'ai-proxy' no Supabase?");
            }
            throw new Error(`Erro na IA: ${error.message}`);
        }
        return data?.text || "";
    }

    // MODO 2: DIRETO (Chave no .env local)
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
        console.error("[Direct AI Error]:", e);
        throw new Error(`Erro na IA (Local): ${e.message}`);
    }
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const prompt = "Extraia o número de série ou código de património desta imagem. Retorne apenas o código.";
    return await runGeminiRequest(flashModel, prompt, [{ data: base64Image, mimeType }]);
  } catch (error) {
    console.error("Vision Error:", error);
    throw new Error("Falha na análise visual.");
  }
};

export const getDeviceInfoFromText = async (serialNumber: string): Promise<{ brand: string; type: string }> => {
    try {
        const prompt = `Com base no número de série "${serialNumber}", identifique a marca e o tipo de equipamento informático. Formato JSON.`;
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
        const prompt = `Assistente de Gestão de TI. Pedido do utilizador: "${text}". Contexto: ${JSON.stringify(context)}. Identifique a intenção e os dados.`;
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
        const prompt = `Analise este ticket de TI: "${description}". Categorize, defina prioridade e sugira uma solução técnica curta.`;
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
        const prompt = `Como um técnico de suporte de TI, escreva um resumo técnico limpo (2-3 frases) da solução para este ticket: "${description}".
        Ações realizadas: "${activityContext}". 
        Idioma: Português (PT). Seja direto.`;
        
        return await runGeminiRequest(flashModel, prompt);
    } catch (error) {
        console.error("Summary Generation Error:", error);
        throw new Error("Falha ao gerar resumo da resolução.");
    }
};

export const analyzeBackupScreenshot = async (base64Image: string, mimeType: string): Promise<{ status: string; date: string; systemName: string }> => {
    try {
        const prompt = "Analise este screenshot de relatório de backup. Extraia: 1. Estado (Sucesso, Falha ou Parcial), 2. Data do backup (YYYY-MM-DD), 3. Nome do Sistema. JSON output.";
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
        const prompt = `Scanner de Vulnerabilidades. Inventário: ${JSON.stringify(inventory)}. Procure por CVEs Críticos/Altos recentes.`;
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
    const prompt = `Notificação de incidente NIS2. ${JSON.stringify(ticket)}. JSON output.`;
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
    const prompt = "Análise de relatório de Pentest. Extraia descobertas críticas.";
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
