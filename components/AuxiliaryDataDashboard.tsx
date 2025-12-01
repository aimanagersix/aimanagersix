import React, { useState, useEffect } from 'react';
import { FaRobot, FaCog, FaKey, FaNetworkWired, FaClock } from 'react-icons/fa';
import * as dataService from '../services/dataService';
import { parseSecurityAlert } from '../services/geminiService';

// Import Tab Components
import GeneralScansTab from './settings/GeneralScansTab';
import ConnectionsTab from './settings/ConnectionsTab';
import AgentsTab from './settings/AgentsTab';
import WebhooksTab from './settings/WebhooksTab';
import CronJobsTab from './settings/CronJobsTab';

interface AuxiliaryDataDashboardProps {
    appData: any;
    onRefresh: () => void;
}

const AuxiliaryDataDashboard: React.FC<AuxiliaryDataDashboardProps> = ({ appData, onRefresh }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'connections' | 'agents' | 'webhooks' | 'cron'>('general');
    
    // State is managed here and passed down to child components
    const [settings, setSettings] = useState({
        // General & Scans
        scan_frequency_days: '0',
        scan_start_time: '02:00',
        last_auto_scan: '-',
        scan_include_eol: true,
        scan_lookback_years: 2,
        scan_custom_prompt: '',
        equipment_naming_prefix: 'PC-',
        equipment_naming_digits: '4',
        weekly_report_recipients: '',

        // Connections
        sbUrl: '',
        sbKey: '',
        sbServiceKey: '',
        resendApiKey: '',
        resendFromEmail: '',

        // Webhook
        webhookJson: '{\n  "alert_name": "Malware Detected",\n  "severity": "Critical",\n  "hostname": "PC-FINANCE-01",\n  "description": "Ransomware detected in C:\\Users\\Admin"\n}',
        isSimulating: false,
        simulatedTicket: null,
        webhookUrl: '',

        // Cron
        cronFunctionUrl: '',
        isTestingCron: false,
        cronFunctionCode: '', // This will be static text
        cronSqlCode: '',
        copiedCode: null,
    });

    useEffect(() => {
        const loadSettings = async () => {
            const keysToFetch = [
                'scan_frequency_days', 'scan_start_time', 'last_auto_scan', 
                'scan_include_eol', 'scan_lookback_years', 'scan_custom_prompt',
                'equipment_naming_prefix', 'equipment_naming_digits',
                'weekly_report_recipients', 'resend_api_key', 'resend_from_email'
            ];
            
            const fetchedSettings: any = {};
            for (const key of keysToFetch) {
                fetchedSettings[key] = await dataService.getGlobalSetting(key);
            }

            const projectUrl = localStorage.getItem('SUPABASE_URL');

            setSettings(prev => ({
                ...prev,
                scan_frequency_days: fetchedSettings.scan_frequency_days || '0',
                scan_start_time: fetchedSettings.scan_start_time || '02:00',
                last_auto_scan: fetchedSettings.last_auto_scan ? new Date(fetchedSettings.last_auto_scan).toLocaleString() : '-',
                scan_include_eol: fetchedSettings.scan_include_eol ? fetchedSettings.scan_include_eol === 'true' : true,
                scan_lookback_years: fetchedSettings.scan_lookback_years ? parseInt(fetchedSettings.scan_lookback_years) : 2,
                scan_custom_prompt: fetchedSettings.scan_custom_prompt || '',
                equipment_naming_prefix: fetchedSettings.equipment_naming_prefix || 'PC-',
                equipment_naming_digits: fetchedSettings.equipment_naming_digits || '4',
                weekly_report_recipients: fetchedSettings.weekly_report_recipients || '',
                resendApiKey: fetchedSettings.resend_api_key || '',
                resendFromEmail: fetchedSettings.resend_from_email || '',

                sbUrl: localStorage.getItem('SUPABASE_URL') || '',
                sbKey: localStorage.getItem('SUPABASE_ANON_KEY') || '',
                sbServiceKey: localStorage.getItem('SUPABASE_SERVICE_ROLE_KEY') || '',
                
                webhookUrl: projectUrl ? `${projectUrl}/functions/v1/siem-ingest` : '',
                cronFunctionUrl: projectUrl ? `${projectUrl}/functions/v1/weekly-report` : '',
            }));
        };
        loadSettings();
    }, []);

    const handleSettingsChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveGeneral = async () => {
        const keysToSave = [
            'scan_frequency_days', 'scan_start_time', 
            'scan_include_eol', 'scan_lookback_years', 'scan_custom_prompt',
            'equipment_naming_prefix', 'equipment_naming_digits', 'weekly_report_recipients'
        ];
        for (const key of keysToSave) {
            await dataService.updateGlobalSetting(key, String((settings as any)[key]));
        }
        alert("Configurações guardadas.");
    };

    const handleSaveConnections = async () => {
        await dataService.updateGlobalSetting('resend_api_key', settings.resendApiKey);
        await dataService.updateGlobalSetting('resend_from_email', settings.resendFromEmail);
        
        if (settings.sbUrl && settings.sbKey) {
            localStorage.setItem('SUPABASE_URL', settings.sbUrl);
            localStorage.setItem('SUPABASE_ANON_KEY', settings.sbKey);
        }
        if (settings.sbServiceKey) {
            localStorage.setItem('SUPABASE_SERVICE_ROLE_KEY', settings.sbServiceKey);
        }

        if (confirm("Credenciais guardadas. A página será recarregada para aplicar a nova ligação.")) {
            window.location.reload();
        }
    };
    
    // Webhook Simulation Logic
    const handleSimulateWebhook = async () => {
        handleSettingsChange('isSimulating', true);
        handleSettingsChange('simulatedTicket', null);
        try {
            const result = await parseSecurityAlert(settings.webhookJson);
            handleSettingsChange('simulatedTicket', {
                title: result.title,
                description: `${result.description}\n\n[Origem: ${result.sourceSystem}] [Ativo: ${result.affectedAsset}]`,
                severity: result.severity,
                category: 'Incidente de Segurança',
                type: result.incidentType,
                status: 'Pedido'
            });
        } catch (error) {
            console.error(error);
            alert("Erro na simulação da IA.");
        } finally {
            handleSettingsChange('isSimulating', false);
        }
    };

    const handleCreateSimulatedTicket = async () => {
        if (!settings.simulatedTicket) return;
        if (confirm("Deseja criar este ticket real na base de dados?")) {
            try {
                await dataService.addTicket({
                    title: settings.simulatedTicket.title,
                    description: settings.simulatedTicket.description,
                    category: settings.simulatedTicket.category,
                    securityIncidentType: settings.simulatedTicket.type,
                    impactCriticality: settings.simulatedTicket.severity,
                    status: 'Pedido',
                    requestDate: new Date().toISOString(),
                    entidadeId: appData.entidades[0]?.id || '', 
                    collaboratorId: appData.collaborators[0]?.id || '' 
                });
                alert("Ticket criado com sucesso!");
                handleSettingsChange('simulatedTicket', null);
                onRefresh();
            } catch (e) {
                alert("Erro ao criar ticket.");
            }
        }
    };

    const handleTestCron = async () => {
        if (!settings.cronFunctionUrl) return;
        handleSettingsChange('isTestingCron', true);
        try {
            const response = await fetch(settings.cronFunctionUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${settings.sbKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const result = await response.json();
            if (response.ok) {
                alert(`Teste executado!\nResultado: ${JSON.stringify(result)}`);
            } else {
                alert(`Erro: ${result.error || response.statusText}\n\nVerifique se a Edge Function 'weekly-report' foi implementada (deployed) e se os 'secrets' estão configurados.`);
            }
        } catch (e: any) {
            alert(`Erro de conexão: ${e.message}.\n\nVerifique a implementação da Edge Function.`);
        } finally {
            handleSettingsChange('isTestingCron', false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                <FaRobot className="text-brand-secondary" /> Automação & Integrações
            </h2>

            <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
                <button onClick={() => setActiveTab('general')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'general' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Geral & Scans</button>
                <button onClick={() => setActiveTab('connections')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'connections' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Conexões</button>
                <button onClick={() => setActiveTab('agents')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'agents' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot /> Agentes</button>
                <button onClick={() => setActiveTab('webhooks')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'webhooks' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}><FaNetworkWired className="text-green-400" /> Webhooks</button>
                <button onClick={() => setActiveTab('cron')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'cron' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}><FaClock className="text-yellow-400" /> Cron Jobs</button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {activeTab === 'general' && <GeneralScansTab settings={settings} onSettingsChange={handleSettingsChange} onSave={handleSaveGeneral} instituicoes={appData.instituicoes} />}
                {activeTab === 'connections' && <ConnectionsTab settings={settings} onSettingsChange={handleSettingsChange} onSave={handleSaveConnections} />}
                {activeTab === 'agents' && <AgentsTab agentScript={agentScript} />}
                {activeTab === 'webhooks' && <WebhooksTab settings={{...settings, onCreateSimulatedTicket: handleCreateSimulatedTicket}} onSettingsChange={handleSettingsChange} onSimulate={handleSimulateWebhook} />}
                {activeTab === 'cron' && <CronJobsTab settings={{...settings, cronFunctionCode, cronSqlCode}} onSettingsChange={handleSettingsChange} onSave={handleSaveGeneral} onTest={handleTestCron} onCopy={(text, type) => handleSettingsChange('copiedCode', type)} />}
            </div>
        </div>
    );
};

export default AuxiliaryDataDashboard;