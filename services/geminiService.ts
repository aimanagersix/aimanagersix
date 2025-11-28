import { GoogleGenAI, Type } from "@google/genai";
import { VulnerabilityScanConfig } from "../types";

let aiInstance: GoogleGenAI | null = null;
const model = "gemini-2.5-flash";

export const isAiConfigured = (): boolean => {
    const key = process.env.API_KEY;
    return !!key && key.length > 0;
};

const getAiClient = (): GoogleGenAI => {
    if (aiInstance) {
        return aiInstance;
    }

    // STRICTLY use process.env.API_KEY as per instructions.
    // The application must not ask the user for the key.
    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
        console.error("A chave da API Gemini não está configurada em process.env.API_KEY.");
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
        // Return a user-friendly error message if key is missing or quota exceeded
        return "<p>Erro ao gerar análise IA. Verifique a sua chave API no ambiente ou a disponibilidade do serviço.</p>";
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

// --- SIEM / RMM Ingestion Parser (AI Bridge) ---

export interface SecurityAlertResult {
    title: string;
    description: string;
    severity: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
    affectedAsset: string; // Hostname or IP or Serial
    incidentType: string; // e.g., Ransomware, Malware
    sourceSystem: string; // e.g., SentinelOne, CrowdStrike
}

export const parseSecurityAlert = async (rawJson: string): Promise<SecurityAlertResult> => {
    try {
        const ai = getAiClient();
        
        const prompt = `
        Act as a SOC Analyst.
        I will provide a raw JSON alert from a security tool (SIEM, EDR, RMM, or Firewall).
        
        Raw JSON:
        ${rawJson.substring(0, 10000)}

        Task:
        Extract the critical information to create a Security Incident Ticket.
        Normalize the severity to: Baixa, Média, Alta, Crítica.
        Identify the affected asset (Hostname, IP, or Serial).
        Identify the specific type of attack/incident.
        Identify the source system (e.g. SentinelOne, CrowdStrike, Datto).

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
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        severity: { type: Type.STRING, enum: ['Baixa', 'Média', 'Alta', 'Crítica'] },
                        affectedAsset: { type: Type.STRING },
                        incidentType: { type: Type.STRING },
                        sourceSystem: { type: Type.STRING }
                    },
                    required: ["title", "description", "severity", "affectedAsset", "incidentType", "sourceSystem"]
                }
            }
        });

        const jsonText = response.text ? response.text.trim() : "{}";
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error parsing security alert:", error);
        // Return a safe fallback
        return {
            title: "Alerta de Segurança (Parse Failed)",
            description: `Raw Data: ${rawJson.substring(0, 200)}...`,
            severity: "Alta",
            affectedAsset: "Unknown",
            incidentType: "Outro",
            sourceSystem: "Unknown"
        };
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

// --- Backup Audit (Vision) ---

export const analyzeBackupScreenshot = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<{ status: 'Sucesso' | 'Falha' | 'Parcial', date: string, systemName?: string }> => {
    try {
        const ai = getAiClient();
        
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType,
            },
        };
        
        const prompt = `
        Analyze this backup software screenshot/log.
        1. Determine the backup status (Success, Failed, or Partial/Warning). Map 'Completed successfully' to 'Sucesso'.
        2. Extract the date of the backup operation (YYYY-MM-DD format). If multiple, prefer the latest 'end time'.
        3. Try to identify the system name or job name.

        Return JSON.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                role: 'user',
                parts: [imagePart, { text: prompt }]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        status: { type: Type.STRING, enum: ['Sucesso', 'Falha', 'Parcial'] },
                        date: { type: Type.STRING },
                        systemName: { type: Type.STRING }
                    },
                    required: ["status", "date"]
                }
            }
        });

        const jsonText = response.text ? response.text.trim() : "{}";
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error analyzing backup screenshot:", error);
        throw new Error("Failed to analyze image.");
    }
};

// --- Automated Vulnerability Scanner (Using Gemini Intelligence) ---

export interface ScannedVulnerability {
    cve_id: string;
    description: string;
    severity: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
    affected_software: string;
    remediation: string;
}

export const scanForVulnerabilities = async (
    inventory: string[], 
    config?: VulnerabilityScanConfig
): Promise<ScannedVulnerability[]> => {
    try {
        const ai = getAiClient();
        
        // Default configs
        const includeEol = config?.includeEol ?? true;
        const lookbackYears = config?.lookbackYears ?? 2;
        const customPrompt = config?.customInstructions ? `Custom Instructions: ${config.customInstructions}` : "";

        const prompt = `
        Act as a Cybersecurity Vulnerability Scanner (NVD/MITRE Expert).
        I will provide a list of software/OS inventory found in my network.
        
        Inventory List:
        ${JSON.stringify(inventory)}

        Task:
        Identify potential high-profile or critical CVEs (Common Vulnerabilities and Exposures) that are COMMONLY associated with versions of this software.
        
        CONFIGURATION:
        - Include EOL (End-of-Life) software risks: ${includeEol}. ${includeEol ? "If software is ancient (Win7, Server 2008), REPORT critical legacy vulnerabilities." : "Ignore EOL software."}
        - Timeframe: Focus on CVEs from the last ${lookbackYears} years (unless EOL and critical).
        ${customPrompt}
        
        Return a JSON array of up to 5 most critical vulnerabilities found based on this logic.
        Format:
        {
            cve_id: "CVE-XXXX-XXXX",
            description: "Short summary in Portuguese",
            severity: "Crítica" | "Alta" | "Média" | "Baixa",
            affected_software: "Name of the item from my list",
            remediation: "Brief fix action in Portuguese (e.g. 'Atualizar para v2.0', 'Isolar da rede')"
        }
        If no major vulnerabilities are obvious for this generic list, return an empty array.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            cve_id: { type: Type.STRING },
                            description: { type: Type.STRING },
                            severity: { type: Type.STRING, enum: ['Baixa', 'Média', 'Alta', 'Crítica'] },
                            affected_software: { type: Type.STRING },
                            remediation: { type: Type.STRING }
                        },
                        required: ["cve_id", "description", "severity", "affected_software", "remediation"]
                    }
                }
            }
        });

        const jsonText = response.text ? response.text.trim() : "[]";
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error scanning vulnerabilities:", error);
        return [];
    }
};

// --- Regulatory Notification Generation (NIS2/DORA) ---

export interface RegulatoryNotificationData {
    report_json: string;
    report_summary_html: string;
}

export const generateNis2Notification = async (ticket: any, activities: any[]): Promise<RegulatoryNotificationData> => {
    try {
        const ai = getAiClient();
        
        const prompt = `
        Act as a Cybersecurity Compliance Officer (CSIRT/ENISA context).
        
        Task: Generate a mandatory incident notification report (JSON format) for NIS2/DORA compliance authorities (e.g. CNCS Portugal).
        
        Input Data:
        - Incident Title: ${ticket.title}
        - Description: ${ticket.description}
        - Type: ${ticket.securityIncidentType}
        - Criticality: ${ticket.impactCriticality}
        - Date Detected: ${ticket.requestDate}
        - Activities Log: ${JSON.stringify(activities.map(a => a.description))}
        - Impact: Confidentiality (${ticket.impactConfidentiality}), Integrity (${ticket.impactIntegrity}), Availability (${ticket.impactAvailability})

        Requirements:
        1. **Anonymize PII**: Replace any person names or emails with placeholders (e.g., "REDACTED_USER_1").
        2. **Structure**: Create a JSON object with fields: 'incident_id', 'category', 'discovery_time', 'description', 'root_cause', 'impact_analysis', 'mitigation_status', 'is_personal_data_breach'.
        3. **Summary**: Also provide a brief HTML summary (<h3>, <p>, <ul>) for the user to preview.

        Return Schema:
        {
            "report_json": "Stringified JSON of the official report",
            "report_summary_html": "HTML string for preview"
        }
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        report_json: { type: Type.STRING },
                        report_summary_html: { type: Type.STRING }
                    },
                    required: ["report_json", "report_summary_html"]
                }
            }
        });

        const jsonText = response.text ? response.text.trim() : "{}";
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error generating regulatory notification:", error);
        throw new Error("Failed to generate report.");
    }
};

// --- Human Risk Analysis (Training Suggestion) ---

export interface TrainingRecommendation {
    needsTraining: boolean;
    reason: string;
    recommendedModule: string; // e.g., "Phishing Awareness", "Password Security"
}

export const analyzeCollaboratorRisk = async (ticketHistory: any[]): Promise<TrainingRecommendation> => {
    try {
        const ai = getAiClient();
        
        const context = ticketHistory.map(t => ({
            category: t.category,
            type: t.securityIncidentType,
            description: t.description,
            date: t.requestDate
        }));

        const prompt = `
        Act as a Cybersecurity Awareness Officer.
        Analyze the ticket history of a collaborator to identify risky behavior patterns.
        
        Ticket History:
        ${JSON.stringify(context)}

        Task:
        Determine if this user demonstrates a need for specific security training (e.g., clicking links, forgetting passwords often, losing devices).
        
        Return JSON:
        {
            "needsTraining": boolean,
            "reason": "Short explanation in Portuguese (e.g., 'Usuário reportou 3 incidentes de vírus/phishing este ano')",
            "recommendedModule": "Specific training topic (e.g., 'Navegação Segura', 'Gestão de Senhas', 'Simulação Phishing')"
        }
        If history is clean or sparse, return needsTraining: false.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        needsTraining: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING },
                        recommendedModule: { type: Type.STRING }
                    },
                    required: ["needsTraining", "reason", "recommendedModule"]
                }
            }
        });

        const jsonText = response.text ? response.text.trim() : "{}";
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error analyzing collaborator risk:", error);
        return { needsTraining: false, reason: "", recommendedModule: "" };
    }
};

// --- Pentest Report Parsing (DORA) ---

export interface PentestFinding {
    title: string;
    description: string;
    severity: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
    remediation: string;
}

export const extractFindingsFromReport = async (base64File: string, mimeType: string): Promise<PentestFinding[]> => {
    try {
        const ai = getAiClient();
        
        const filePart = {
            inlineData: {
                data: base64File,
                mimeType: mimeType,
            },
        };

        const prompt = `
        Act as a Cybersecurity Auditor.
        Analyze this Pentest/Audit Report (image/pdf).
        Extract the critical technical findings/vulnerabilities.
        
        For each finding, provide:
        - Title
        - Description (Brief summary)
        - Severity (Map to: Baixa, Média, Alta, Crítica)
        - Remediation (Suggested fix)

        Return a JSON Array of objects.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                role: 'user',
                parts: [filePart, { text: prompt }]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            severity: { type: Type.STRING, enum: ['Baixa', 'Média', 'Alta', 'Crítica'] },
                            remediation: { type: Type.STRING }
                        },
                        required: ["title", "description", "severity", "remediation"]
                    }
                }
            }
        });

        const jsonText = response.text ? response.text.trim() : "[]";
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error parsing report:", error);
        throw new Error("Failed to analyze report.");
    }
};

// --- SQL AI Helper ---

export const generateSqlHelper = async (userRequest: string): Promise<string> => {
    try {
        const ai = getAiClient();
        
        const schemaContext = `
        Tables:
        - equipment (id, serialNumber, description, status, brandId, typeId, purchaseDate, acquisitionCost, ...)
        - collaborators (id, fullName, email, role, status, ...)
        - tickets (id, title, description, status, requestDate, technicianId, ...)
        - assignments (id, equipmentId, collaboratorId, assignedDate, returnDate, ...)
        - software_licenses (id, productName, licenseKey, ...)
        - license_assignments (id, softwareLicenseId, equipmentId, ...)
        - brands (id, name, ...)
        - equipment_types (id, name, ...)
        - entidades (id, name, ...)
        - instituicoes (id, name, ...)
        `;

        const prompt = `
        Act as a PostgreSQL Expert.
        Generate a valid SQL query based on the following request: "${userRequest}".
        
        Schema Context:
        ${schemaContext}
        
        Rules:
        - Return ONLY the SQL code. No markdown, no explanations.
        - Use standard PostgreSQL syntax.
        - If a join is needed, assume standard foreign keys based on field names (e.g. brandId -> brands.id).
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text ? response.text.trim().replace(/```sql/g, '').replace(/```/g, '') : "-- No SQL generated";
    } catch (error) {
        console.error("Error generating SQL:", error);
        return "-- Error generating SQL";
    }
};