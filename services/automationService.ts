
import * as dataService from './dataService';
import { scanForVulnerabilities } from './geminiService';
import { CriticalityLevel, VulnerabilityStatus } from '../types';

export const checkAndRunAutoScan = async (force: boolean = false): Promise<number> => {
    let newVulnCount = 0;
    try {
        // 1. Check Configuration (Skip if forcing)
        if (!force) {
            const frequencyStr = await dataService.getGlobalSetting('scan_frequency_days');
            if (!frequencyStr || frequencyStr === '0') return 0; // Disabled

            const frequencyDays = parseInt(frequencyStr);
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

        // 3. Execute AI Scan
        // We slice to 50 to avoid token limits, but ideally this should batch process
        const results = await scanForVulnerabilities(Array.from(inventoryContext).slice(0, 50));

        // 4. Process Results
        for (const vuln of results) {
            // Check existence (Simple dedup by CVE ID)
            const exists = allData.vulnerabilities.some((v: any) => v.cve_id === vuln.cve_id);
            
            if (!exists) {
                // Determine affected assets by simple text matching against the inventory
                const affectedAssets: string[] = [];
                const vulnSoftware = (vuln.affected_software || '').toLowerCase();
                
                equipmentDescriptions.forEach(eq => {
                    // Simple heuristic: if the vulnerability software name is inside the equipment description
                    // e.g. vuln="Windows 7", equip="PC Sala 1 (Windows 7)"
                    if (eq.desc.includes(vulnSoftware) || (vulnSoftware.length > 4 && vulnSoftware.includes(eq.desc))) {
                        affectedAssets.push(eq.desc);
                    }
                });

                // Create Vulnerability Record WITHOUT Ticket
                // The user will manually create the ticket to assign it correctly
                await dataService.addVulnerability({
                    cve_id: vuln.cve_id,
                    description: vuln.description,
                    severity: vuln.severity as CriticalityLevel,
                    affected_software: vuln.affected_software,
                    remediation: vuln.remediation,
                    status: VulnerabilityStatus.Open,
                    published_date: new Date().toISOString().split('T')[0],
                    ticket_id: undefined, // Explicitly no ticket yet
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
