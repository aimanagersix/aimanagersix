
import * as dataService from './dataService';
import { scanForVulnerabilities } from './geminiService';
import { CriticalityLevel, VulnerabilityStatus, TicketStatus } from '../types';

export const checkAndRunAutoScan = async () => {
    try {
        // 1. Check Configuration
        const frequencyStr = await dataService.getGlobalSetting('scan_frequency_days');
        if (!frequencyStr || frequencyStr === '0') return; // Disabled

        const frequencyDays = parseInt(frequencyStr);
        const lastScanStr = await dataService.getGlobalSetting('last_auto_scan');
        
        if (lastScanStr) {
            const lastScan = new Date(lastScanStr);
            const nextScan = new Date(lastScan);
            nextScan.setDate(lastScan.getDate() + frequencyDays);
            
            if (new Date() < nextScan) return; // Not due yet
        }

        console.log("Running Automated Security Scan...");
        
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

        if (inventoryContext.size === 0) return;

        // 3. Execute AI Scan
        const results = await scanForVulnerabilities(Array.from(inventoryContext).slice(0, 50));

        // 4. Process Results
        let newVulnCount = 0;
        for (const vuln of results) {
            // Check existence (Simple dedup by CVE ID)
            const exists = allData.vulnerabilities.some((v: any) => v.cve_id === vuln.cve_id);
            
            if (!exists) {
                // Determine affected assets by simple text matching
                const affectedAssets: string[] = [];
                const vulnSoftware = (vuln.affected_software || '').toLowerCase();
                
                equipmentDescriptions.forEach(eq => {
                    if (vulnSoftware.includes(eq.desc) || eq.desc.includes(vulnSoftware)) {
                        affectedAssets.push(eq.desc);
                    }
                });

                // Create Ticket First (if critical/high)
                let ticketId: string | undefined = undefined;
                if (vuln.severity === 'Crítica' || vuln.severity === 'Alta') {
                    const ticketPayload = {
                        title: `Auto-Detetado: ${vuln.cve_id} (${vuln.severity})`,
                        description: `Vulnerabilidade detetada automaticamente pelo scanner.\n\nDescrição: ${vuln.description}\nSoftware Afetado: ${vuln.affected_software}\n\nRemediação Sugerida: ${vuln.remediation}`,
                        category: 'Incidente de Segurança',
                        securityIncidentType: 'VulnerabilityExploit', // Mapping to enum string or raw
                        impactCriticality: vuln.severity === 'Crítica' ? CriticalityLevel.Critical : CriticalityLevel.High,
                        requestDate: new Date().toISOString(),
                        status: TicketStatus.Requested,
                        entidadeId: allData.entidades[0]?.id // Default entity or system
                    };
                    
                    try {
                        // If user is logged in, dataService uses it. If running background (simulated), uses current session.
                        const ticket = await dataService.addTicket(ticketPayload);
                        ticketId = ticket.id;
                    } catch (e) {
                        console.error("Failed to create auto-ticket", e);
                    }
                }

                // Create Vulnerability Record
                await dataService.addVulnerability({
                    cve_id: vuln.cve_id,
                    description: vuln.description,
                    severity: vuln.severity as CriticalityLevel,
                    affected_software: vuln.affected_software,
                    remediation: vuln.remediation,
                    status: VulnerabilityStatus.Open,
                    published_date: new Date().toISOString().split('T')[0],
                    ticket_id: ticketId,
                    affected_assets: affectedAssets.join(', ')
                });
                
                newVulnCount++;
            }
        }

        // 5. Update Last Scan Timestamp
        await dataService.updateGlobalSetting('last_auto_scan', new Date().toISOString());
        await dataService.logAction('AUTO_SCAN', 'System', `Automated scan completed. ${newVulnCount} new vulnerabilities found.`);

        if (newVulnCount > 0) {
            // Optional: Trigger UI notification if user is active, or just rely on dashboard update
            console.log(`Auto Scan: ${newVulnCount} vulnerabilities added.`);
        }

    } catch (error) {
        console.error("Auto Scan Error:", error);
    }
};
