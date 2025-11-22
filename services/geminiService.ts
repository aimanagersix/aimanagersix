




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

// --- Magic Command Bar Logic ---

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
        const ai = getAiClient();
        
        const prompt = `
        You are an IT Asset Manager Assistant. Analyze the following user request: "${text}".
        
        Context Data (for fuzzy matching):
        - Known Brands: ${JSON.stringify(context.brands)}
        - Known Equipment Types: ${JSON.stringify(context.types)}
        - Known Users: ${JSON.stringify(context.users.map(u => u.name))}
        - Current User ID: "${context.currentUser}"

        Determine the intent and extract entities.
        If user wants to add equipment, map to known Brand/Type if possible.
        If user wants to create a ticket/incident, infer priority and category.
        If user wants to search, extract the query.

        Supported Intents: 'create_equipment', 'create_ticket', 'search'.

        Return JSON matching the schema.
        For 'create_equipment', return 'data' with { brandName, typeName, serialNumber, description, assignedToUserName }.
        For 'create_ticket', return 'data' with { title, description, requesterName, priority (Baixa, Média, Alta, Crítica) }.
        For 'search', return 'data' with { query }.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        intent: {
                            type: Type.STRING,
                            enum: ['create_equipment', 'create_ticket', 'search', 'unknown']
                        },
                        data: {
                            type: Type.OBJECT,
                            properties: {
                                // Equipment Fields
                                brandName: { type: Type.STRING },
                                typeName: { type: Type.STRING },
                                serialNumber: { type: Type.STRING },
                                description: { type: Type.STRING },
                                assignedToUserName: { type: Type.STRING },
                                // Ticket Fields
                                title: { type: Type.STRING },
                                requesterName: { type: Type.STRING },
                                priority: { type: Type.STRING },
                                // Search Fields
                                query: { type: Type.STRING }
                            }
                        },
                        confidence: { type: Type.NUMBER }
                    },
                    required: ["intent", "confidence"]
                }
            }
        });

        const jsonText = response.text ? response.text.trim() : "{}";
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error parsing natural language:", error);
        return { intent: 'unknown', confidence: 0 };
    }
};

// --- AI Reporting (Idea 2) ---

export const generateExecutiveReport = async (
    reportType: string,
    dataContext: any
): Promise<string> => {
    try {
        const ai = getAiClient();
        
        // Truncate data context if too large (Gemini has limits, though high)
        const contextString = JSON.stringify(dataContext).substring(0, 30000); 

        const prompt = `
        Act as an Expert IT Manager & CIO. Analyze the provided JSON data for a "${reportType}" report.
        
        Data Context: ${contextString}

        Generate an HTML (no markdown, just inner HTML tags) Executive Summary with the following sections:
        1. **Executive Summary**: High-level overview of the current status.
        2. **Risk Analysis (NIS2 Focus)**: Identify potential security risks, outdated equipment, or single points of failure.
        3. **Operational Insights**: Efficiency, ticket volume trends, or asset utilization.
        4. **Recommendations**: 3-5 actionable bullet points for the administration (e.g., budget for upgrades, training needs).

        Style Guide:
        - Use <h3> for headers (text-white/text-purple-300).
        - Use <ul>/<li> for lists.
        - Use <strong> for emphasis.
        - Keep it professional, concise, and data-driven.
        - If data is empty, state that there is insufficient data for analysis.
        - Language: Portuguese (Portugal).
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text || "<p>Não foi possível gerar o relatório.</p>";

    } catch (error) {
        console.error("Error generating report:", error);
        return "<p>Erro ao gerar análise IA. Verifique a sua chave API.</p>";
    }
};

// --- AI Ticket Triage (Idea 3) ---

export interface TicketTriageResult {
    suggestedCategory: string;
    suggestedPriority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
    suggestedSolution: string;
    isSecurityIncident: boolean;
}

export const analyzeTicketRequest = async (description: string): Promise<TicketTriageResult> => {
    try {
        const ai = getAiClient();
        
        const prompt = `
        Analyze this IT support ticket description: "${description}".
        
        Tasks:
        1. Categorize the issue (Hardware, Software, Network, Access, Security Incident, Other).
        2. Estimate priority based on business impact (Low, Medium, High, Critical).
        3. Suggest a "First Aid" solution or quick fix the user/technician can try.
        4. Determine if this sounds like a Security Incident (phishing, virus, ransomware).

        Return JSON.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestedCategory: { type: Type.STRING },
                        suggestedPriority: { type: Type.STRING, enum: ['Baixa', 'Média', 'Alta', 'Crítica'] },
                        suggestedSolution: { type: Type.STRING },
                        isSecurityIncident: { type: Type.BOOLEAN }
                    },
                    required: ["suggestedCategory", "suggestedPriority", "suggestedSolution", "isSecurityIncident"]
                }
            }
        });

        const jsonText = response.text ? response.text.trim() : "{}";
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error analyzing ticket:", error);
        throw new Error("Failed to analyze ticket.");
    }
};

// --- AI Knowledge Base (RAG Lite) ---

export const generateTicketResolutionSummary = async (
    ticketDescription: string,
    activities: string[]
): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `
        Act as a Knowledge Base Manager. 
        Original Problem: "${ticketDescription}"
        Technician Notes: ${JSON.stringify(activities)}

        Create a concise, structured KB summary in Portuguese.
        Format:
        **Problema:** [1 sentence summary]
        **Causa:** [Likely cause based on notes]
        **Resolução:** [Steps taken to fix it]
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text ? response.text.trim() : "";
    } catch (error) {
        console.error("Error generating summary:", error);
        return "Não foi possível gerar o resumo automático.";
    }
};

export const findSimilarPastTickets = async (
    currentDescription: string,
    pastResolvedTickets: Array<{id: string, description: string, resolution: string}>
): Promise<{ found: boolean, ticketId?: string, similarityReason?: string, resolution?: string }> => {
    try {
        const ai = getAiClient();
        
        // Limit context size
        const context = pastResolvedTickets.slice(0, 50).map(t => ({
            id: t.id,
            desc: t.description.substring(0, 100), // Truncate to save tokens
            res: t.resolution
        }));

        const prompt = `
        I have a new support ticket: "${currentDescription}".
        
        Here is a list of past resolved tickets (ID, Description, Resolution):
        ${JSON.stringify(context)}

        Is there a ticket in this list that solves the EXACT SAME problem?
        If yes, return the ID, the resolution, and why it is similar.
        If no, return found: false.
        
        Return JSON.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        found: { type: Type.BOOLEAN },
                        ticketId: { type: Type.STRING },
                        similarityReason: { type: Type.STRING },
                        resolution: { type: Type.STRING }
                    },
                    required: ["found"]
                }
            }
        });

        const jsonText = response.text ? response.text.trim() : "{}";
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error finding similar tickets:", error);
        return { found: false };
    }
};