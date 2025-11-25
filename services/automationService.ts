
import * as dataService from './dataService';
import { scanForVulnerabilities } from './geminiService';
import { CriticalityLevel, VulnerabilityStatus } from '../types';

export const checkAndRunAutoScan = async (force: boolean = false): Promise<number> => {
    let newVulnCount = 0;
    try {
        let frequencyDays = 0;
        let includeEol = true;
        let lookbackYears = 2;
        let customInstructions = "";
        let nistApiKey = "";

        // 1. Check Configuration (Skip logic check if forcing, but load configs)
        const frequencyStr = await dataService.getGlobalSetting('scan_frequency_days');
        if (frequencyStr) frequencyDays = parseInt(frequencyStr);

        const eolStr = await dataService.getGlobalSetting('scan_include_eol');
        if (eolStr) includeEol = eolStr === 'true';

        const lookbackStr = await dataService.getGlobalSetting('scan_lookback_years');
        if (lookbackStr) lookbackYears = parseInt(lookbackStr);

        const customPrompt = await dataService.getGlobalSetting('scan_custom_prompt');
        if (customPrompt) customInstructions = customPrompt;
        
        const nistKeyStr = await dataService.getGlobalSetting('nist_api_key');
        if (nistKeyStr) nistApiKey = nistKeyStr;

        if (!force) {
            if (frequencyDays === 0) return 0; // Disabled

            const lastScanStr = await dataService.getGlobalSetting('last_auto_scan');
            
            if (lastScanStr) {
                const lastScan = new Date(lastScanStr);
                const nextScan = new Date(lastScan);
                nextScan.setDate(lastScan.getDate() + frequencyDays);
                
                if (new Date() < nextScan) return 0; // Not due yet
            }
        }

        console.log(force ? "Forcing Manual Security Scan..." : "Running Automated Security Scan...");
        
        // 2. Prepare Inventory Context
        const allData = await dataService.fetchAllData();
        const inventoryContext = new Set<string>();
        
        // Map for equipment description to check text matching later
        const equipmentDescriptions: {desc: string, id: string}[] = [];

        allData.equipment.forEach((eq: any) => {
            if (eq.os_version) inventoryContext.add(`OS: ${eq.os_version}`);
            if (eq.description) {
                inventoryContext.add(`Hardware: ${eq.description}`);
                equipmentDescriptions.push({ desc: eq.description.toLowerCase(), id: eq.id });
            }
        });
        
        allData.softwareLicenses.forEach((lic: any) => {
            inventoryContext.add(`Software: ${lic.productName}`);
        });

        if (inventoryContext.size === 0) {
            console.log("Inventory empty, nothing to scan.");
            return 0;
        }

        // 3. Execute Scan (Hybrid NIST + AI)
        let results: any[] = [];
        
        // --- REAL NIST API FETCH LOGIC ---
        // Only runs if API Key is configured, otherwise falls back to pure AI hallucination/knowledge
        if (nistApiKey) {
             console.log("NIST API Key detected. Fetching real CVEs...");
             
             // We specifically look for OS strings like "Windows 7", "Windows Server 2012"
             // Extract potential OS names from the inventory set
             const osList = Array.from(inventoryContext).filter(s => s.startsWith('OS:')).map(s => s.replace('OS:', '').trim());
             
             for (const os of osList) {
                 if (!os) continue;
                 try {
                     // Use CORS Proxy to bypass browser restrictions
                     // Request last 5 critical CVEs for this keyword
                     const keyword = encodeURIComponent(os);
                     const url = `https://corsproxy.io/?https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${keyword}&resultsPerPage=5`;
                     
                     const headers: any = {};
                     if (nistApiKey) headers['apiKey'] = nistApiKey;

                     const response = await fetch(url, { headers });
                     
                     if (response.ok) {
                         const data = await response.json();
                         if (data.vulnerabilities) {
                             const mapped = data.vulnerabilities.map((v:any) => {
                                 const metrics = v.cve.metrics?.cvssMetricV31?.[0]?.cvssData || v.cve.metrics?.cvssMetricV2?.[0]?.cvssData;
                                 const severity = metrics?.baseSeverity === 'CRITICAL' ? 'Crítica' : 
                                                  metrics?.baseSeverity === 'HIGH' ? 'Alta' : 
                                                  metrics?.baseSeverity === 'MEDIUM' ? 'Média' : 'Baixa';
                                 
                                 // Only return High/Critical to reduce noise
                                 if (severity === 'Baixa' || severity === 'Média') return null;

                                 return {
                                     cve_id: v.cve.id,
                                     description: v.cve.descriptions.find((d:any) => d.lang === 'en')?.value || 'Sem descrição',
                                     severity: severity,
                                     affected_software: os,
                                     remediation: 'Verificar site do fabricante (NIST/Microsoft)',
                                     published_date: v.cve.published
                                 };
                             }).filter(Boolean); // remove nulls
                             
                             results = [...results, ...mapped];
                         }
                     } else {
                         console.warn(`NIST API Error for ${os}:`, response.status);
                     }
                 } catch(e) { 
                     console.error("NIST Fetch Error:", e); 
                 }
             }
        }

        // Fallback or Complementary AI Scan
        // If NIST didn't return anything (e.g. no key or no matches), use AI. 
        // Or use AI for non-OS software.
        
        if (results.length === 0) {
             console.log("Using Gemini AI for vulnerability scanning...");
             // We slice to 50 to avoid token limits
             const scanConfig = { includeEol, lookbackYears, customInstructions };
             const aiResults = await scanForVulnerabilities(Array.from(inventoryContext).slice(0, 50), scanConfig);
             results = [...results, ...aiResults];
        }

        // 4. Process Results (Deduplicate & Save)
        for (const vuln of results) {
            // Check existence (Simple dedup by CVE ID)
            const exists = allData.vulnerabilities.some((v: any) => v.cve_id === vuln.cve_id);
            
            if (!exists) {
                // Determine affected assets by simple text matching against the inventory
                const affectedAssets: string[] = [];
                const vulnSoftware = (vuln.affected_software || '').toLowerCase();
                
                equipmentDescriptions.forEach(eq => {
                    // Simple heuristic: if the vulnerability software name is inside the equipment description
                    if (eq.desc.includes(vulnSoftware) || (vulnSoftware.length > 4 && vulnSoftware.includes(eq.desc))) {
                        affectedAssets.push(eq.desc);
                    }
                });

                await dataService.addVulnerability({
                    cve_id: vuln.cve_id,
                    description: vuln.description,
                    severity: vuln.severity as CriticalityLevel,
                    affected_software: vuln.affected_software,
                    remediation: vuln.remediation,
                    status: VulnerabilityStatus.Open,
                    published_date: vuln.published_date ? new Date(vuln.published_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    ticket_id: undefined, 
                    affected_assets: affectedAssets.length > 0 ? affectedAssets.join(', ') : 'Inventário Geral'
                });
                
                newVulnCount++;
            }
        }

        // 5. Update Last Scan Timestamp
        await dataService.updateGlobalSetting('last_auto_scan', new Date().toISOString());
        await dataService.logAction('AUTO_SCAN', 'System', `Automated scan completed. ${newVulnCount} new vulnerabilities found.`);

        if (newVulnCount > 0) {
            console.log(`Auto Scan: ${newVulnCount} vulnerabilities added.`);
        } else if (force) {
            console.log("Manual Scan complete. No new vulnerabilities found.");
        }

    } catch (error) {
        console.error("Auto Scan Error:", error);
    }
    return newVulnCount;
};
