
import React, { useState, useEffect } from 'react';
import * as dataService from '../../services/dataService';
import { parseSecurityAlert } from '../../services/geminiService';
import { 
    FaHeartbeat, FaTags, FaShapes, FaList, FaShieldAlt, FaTicketAlt, FaUserTag, FaServer, 
    FaGraduationCap, FaLock, FaIdCard, FaPalette, FaRobot, FaKey, FaNetworkWired, FaClock,
    FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaBroom, FaUserSlash, FaCompactDisc, FaHdd, FaMicrochip, FaMemory, FaLeaf, FaLandmark, FaSync, FaExclamationCircle
} from 'react-icons/fa';
import { ConfigItem } from '../../types';

// Child Dashboards/Components
import BrandDashboard from '../../components/BrandDashboard';
import EquipmentTypeDashboard from '../../components/EquipmentTypeDashboard';
import CategoryDashboard from '../../components/CategoryDashboard';
import SecurityIncidentTypeDashboard from '../../components/SecurityIncidentTypeDashboard';
import RoleManager from '../../components/RoleManager'; 
import BrandingTab from '../../components/settings/BrandingTab';
import GeneralScansTab from '../../components/settings/GeneralScansTab';
import ConnectionsTab from '../../components/settings/ConnectionsTab';
import AgentsTab from '../../components/settings/AgentsTab';
import WebhooksTab from '../../components/settings/WebhooksTab';
import CronJobsTab from '../../components/settings/CronJobsTab';
import SoftwareProductDashboard from '../../components/settings/SoftwareProductDashboard';

// Modals for Child Dashboards
import AddBrandModal from '../../components/AddBrandModal';
import AddEquipmentTypeModal from '../../components/AddEquipmentTypeModal';
import AddCategoryModal from '../../components/AddCategoryModal';
import AddSecurityIncidentTypeModal from '../../components/AddSecurityIncidentTypeModal';
import SystemDiagnosticsModal from '../../components/SystemDiagnosticsModal';
import GenericConfigDashboard from '../../components/settings/GenericConfigDashboard';

interface SettingsManagerProps {
    appData: any;
    refreshData: () => void;
}


// Main Component
const SettingsManager: React.FC<SettingsManagerProps> = ({ appData, refreshData }) => {
    const [selectedMenuId, setSelectedMenuId] = useState<string>('roles'); 

    // Modals State
    const [showAddBrandModal, setShowAddBrandModal] = useState(false);
    const [brandToEdit, setBrandToEdit] = useState<any>(null);
    const [showAddTypeModal, setShowAddTypeModal] = useState(false);
    const [typeToEdit, setTypeToEdit] = useState<any>(null);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
    const [showAddIncidentTypeModal, setShowAddIncidentTypeModal] = useState(false);
    const [incidentTypeToEdit, setIncidentTypeToEdit] = useState<any>(null);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    
    // State for Automation Tabs
    const [settings, setSettings] = useState<any>({
        webhookJson: '{\n  "alert_name": "Possible Ransomware Detected",\n  "hostname": "PC-FIN-01",\n  "severity": "critical",\n  "source": "SentinelOne",\n  "timestamp": "2024-05-20T10:00:00Z"\n}',
        simulatedTicket: null,
        isSimulating: false,
    });

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado para a área de transferência!');
    };

    const handleTestCron = () => {
        alert('Funcionalidade de teste ainda não implementada.');
    };

    const handleSimulateWebhook = async () => {
        setSettings((p:any) => ({...p, isSimulating: true, simulatedTicket: null}));
        try {
            const result = await parseSecurityAlert(settings.webhookJson);
            setSettings((p:any) => ({...p, simulatedTicket: result}));
        } catch (e) {
            alert("Erro ao simular alerta.");
        } finally {
            setSettings((p:any) => ({...p, isSimulating: false}));
        }
    };

    const handleCreateSimulatedTicket = async () => {
        if (!settings.simulatedTicket) return;
        try {
            await dataService.addTicket({
                title: settings.simulatedTicket.title,
                description: `Alerta Automático de: ${settings.simulatedTicket.sourceSystem}\n\n${settings.simulatedTicket.description}`,
                category: 'Incidente de Segurança',
                securityIncidentType: settings.simulatedTicket.incidentType,
                impactCriticality: settings.simulatedTicket.severity,
                // These need a default or logic to determine
                entidadeId: appData.entidades[0]?.id,
                collaboratorId: appData.collaborators[0]?.id,
            });
            alert("Ticket criado com sucesso!");
            setSettings((p:any) => ({...p, simulatedTicket: null}));
        } catch(e) {
            alert("Erro ao criar ticket.");
        }
    };

     useEffect(() => {
        const loadSettings = async () => {
            const keysToFetch = [
                'scan_frequency_days', 'scan_start_time', 'last_auto_scan', 
                'scan_include_eol', 'scan_lookback_years', 'scan_custom_prompt',
                'equipment_naming_prefix', 'equipment_naming_digits',
                'weekly_report_recipients', 'resend_api_key', 'resend_from_email',
                'app_logo_base64', 'app_logo_size', 'app_logo_alignment', 'report_footer_institution_id'
            ];
            
            const fetchedSettings: any = {};
            for (const key of keysToFetch) {
                fetchedSettings[key] = await dataService.getGlobalSetting(key);
            }

            const projectUrl = localStorage.getItem('SUPABASE_URL');
            
            setSettings((prev: any) => ({
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
                app_logo_base64: fetchedSettings.app_logo_base64 || '',
                app_logo_size: parseInt(fetchedSettings.app_logo_size || '80'),
                app_logo_alignment: fetchedSettings.app_logo_alignment || 'center',
                report_footer_institution_id: fetchedSettings.report_footer_institution_id || '',
                slackWebhookUrl: '',
            }));
            
            const slackUrl = await dataService.getGlobalSetting('slack_webhook_url');
            setSettings((prev: any) => ({ ...prev, slackWebhookUrl: slackUrl || '' }));
        };
        loadSettings();
    }, [selectedMenuId]);

    const simpleConfigTables: Record<string, { label: string; icon: React.ReactNode; data: ConfigItem[]; colorField?: boolean }> = {
        'config_equipment_statuses': { label: 'Estados de Equipamento', icon: <FaList/>, data: appData.configEquipmentStatuses, colorField: true },
        'config_decommission_reasons': { label: 'Motivos de Abate', icon: <FaBroom/>, data: appData.configDecommissionReasons },
        'config_collaborator_deactivation_reasons': { label: 'Motivos de Inativação', icon: <FaUserSlash/>, data: appData.configCollaboratorDeactivationReasons },
        'config_software_categories': { label: 'Categorias de Software', icon: <FaList/>, data: appData.softwareCategories },
        // 'config_software_products' is handled separately now
        'contact_roles': { label: 'Funções de Contacto', icon: <FaUserTag/>, data: appData.contactRoles },
        'contact_titles': { label: 'Tratos (Honoríficos)', icon: <FaUserTag/>, data: appData.contactTitles },
        'config_criticality_levels': { label: 'Níveis de Criticidade', icon: <FaServer/>, data: appData.configCriticalityLevels },
        'config_cia_ratings': { label: 'Classificação CIA', icon: <FaLock/>, data: appData.configCiaRatings },
        'config_service_statuses': { label: 'Estados de Serviço', icon: <FaServer/>, data: appData.configServiceStatuses },
        'config_backup_types': { label: 'Tipos de Backup', icon: <FaServer/>, data: appData.configBackupTypes },
        'config_training_types': { label: 'Tipos de Formação', icon: <FaGraduationCap/>, data: appData.configTrainingTypes },
        'config_resilience_test_types': { label: 'Tipos de Teste Resiliência', icon: <FaShieldAlt/>, data: appData.configResilienceTestTypes },
        'config_accounting_categories': { label: 'Classificador CIBE / SNC-AP', icon: <FaLandmark/>, data: appData.configAccountingCategories },
        'config_conservation_states': { label: 'Estados de Conservação', icon: <FaLeaf/>, data: appData.configConservationStates, colorField: true },
        'config_cpus': { label: 'Tipos de Processador', icon: <FaMicrochip/>, data: appData.configCpus },
        'config_ram_sizes': { label: 'Tamanhos de Memória RAM', icon: <FaMemory/>, data: appData.configRamSizes },
        'config_storage_types': { label: 'Tipos de Disco / Armazenamento', icon: <FaHdd/>, data: appData.configStorageTypes },
    };

    const getCount = (id: string) => {
        if (simpleConfigTables[id]) return simpleConfigTables[id].data?.length || 0;
        if (id === 'brands') return appData.brands?.length || 0;
        if (id === 'equipment_types') return appData.equipmentTypes?.length || 0;
        if (id === 'config_software_products') return appData.softwareProducts?.length || 0;
        if (id === 'ticket_categories') return appData.ticketCategories?.length || 0;
        if (id === 'security_incident_types') return appData.securityIncidentTypes?.length || 0;
        return null;
    };

    const menuStructure: { group: string; items: { id: string; label: string; icon: React.ReactNode }[] }[] = [
        {
            group: "Sistema & Automação",
            items: [
                { id: 'general', label: 'Geral & Scans', icon: <FaRobot /> },
                { id: 'connections', label: 'Conexões & APIs', icon: <FaKey /> },
                { id: 'agents', label: 'Agentes (PowerShell)', icon: <FaRobot /> },
                { id: 'webhooks', label: 'Webhooks (SIEM)', icon: <FaNetworkWired /> },
                { id: 'cronjobs', label: 'Tarefas Agendadas (Cron)', icon: <FaClock /> },
                { id: 'branding', label: 'Branding (Relatórios)', icon: <FaPalette /> },
                { id: 'diagnostics', label: 'Diagnóstico de Sistema', icon: <FaHeartbeat /> },
            ]
        },
        {
            group: "Perfis & Acesso (RBAC)",
            items: [
                { id: 'roles', label: 'Perfis de Acesso', icon: <FaIdCard /> }
            ]
        },
        {
            group: "Tabelas Auxiliares",
            items: [
                { id: 'brands', label: 'Marcas', icon: <FaTags /> },
                { id: 'equipment_types', label: 'Tipos de Equipamento', icon: <FaShapes /> },
                { id: 'config_equipment_statuses', label: 'Estados de Equipamento', icon: <FaList /> },
                { id: 'config_decommission_reasons', label: 'Motivos de Abate', icon: <FaBroom /> },
                { id: 'config_collaborator_deactivation_reasons', label: 'Motivos de Inativação', icon: <FaUserSlash /> },
                { id: 'config_software_categories', label: 'Categorias de Software', icon: <FaList /> },
                { id: 'config_software_products', label: 'Produtos de Software', icon: <FaCompactDisc /> }, 
                { id: 'ticket_categories', label: 'Categorias de Tickets', icon: <FaTicketAlt /> },
                { id: 'security_incident_types', label: 'Tipos de Incidente', icon: <FaShieldAlt /> },
                { id: 'contact_roles', label: 'Funções de Contacto', icon: <FaUserTag /> },
                { id: 'contact_titles', label: 'Tratos (Honoríficos)', icon: <FaUserTag /> },
                { id: 'config_criticality_levels', label: 'Níveis de Criticidade', icon: <FaServer /> },
                { id: 'config_cia_ratings', label: 'Classificação CIA', icon: <FaLock /> },
                { id: 'config_service_statuses', label: 'Estados de Serviço', icon: <FaServer /> },
                { id: 'config_backup_types', label: 'Tipos de Backup', icon: <FaServer /> },
                { id: 'config_training_types', label: 'Tipos de Formação', icon: <FaGraduationCap /> },
                { id: 'config_resilience_test_types', label: 'Tipos de Teste Resiliência', icon: <FaShieldAlt /> },
                { id: 'config_accounting_categories', label: 'Classificador CIBE', icon: <FaLandmark /> },
                { id: 'config_conservation_states', label: 'Estados Conservação', icon: <FaLeaf /> },
                { id: 'config_cpus', label: 'Processadores (CPU)', icon: <FaMicrochip /> },
                { id: 'config_ram_sizes', label: 'Tamanhos de RAM', icon: <FaMemory /> },
                { id: 'config_storage_types', label: 'Tipos de Disco', icon: <FaHdd /> },
            ]
        }
    ];

    return (
        <>
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-150px)]">
                {/* Sidebar Menu */}
                <div className="w-full lg:w-72 bg-surface-dark rounded-lg shadow-xl border border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
                    {/* Reload Button */}
                    <div className="p-2 border-b border-gray-700">
                         <button 
                            onClick={() => window.location.reload()}
                            className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 text-white p-2 rounded text-sm transition-colors font-bold"
                        >
                            <FaSync /> Forçar Recarregamento
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-grow p-2 space-y-4 custom-scrollbar">
                        {menuStructure.map((group, gIdx) => (
                            <div key={gIdx}>
                                <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group.group}</h3>
                                <div className="space-y-1">
                                    {group.items.map(item => {
                                        const count = getCount(item.id);
                                        return (
                                        <button
                                            key={item.id}
                                            onClick={() => item.id === 'diagnostics' ? setShowDiagnostics(true) : setSelectedMenuId(item.id)}
                                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md flex items-center justify-between gap-3 transition-colors ${
                                                selectedMenuId === item.id && item.id !== 'diagnostics'
                                                ? 'bg-brand-primary text-white shadow-md'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {item.icon}
                                                {item.label}
                                            </div>
                                            {count !== null && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${count > 0 ? 'bg-gray-700 text-gray-300' : 'bg-red-900/50 text-red-200'}`}>
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    )})}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-surface-dark rounded-lg shadow-xl border border-gray-700 overflow-hidden flex flex-col p-4" key={selectedMenuId}>
                    {/* ... rest of the content ... */}
                    {selectedMenuId === 'agents' && <AgentsTab />}
                    {selectedMenuId === 'cronjobs' && <CronJobsTab 
                        settings={settings} 
                        onSettingsChange={(k, v) => setSettings((p:any) => ({ ...p, [k]: v }))} 
                        onSave={async () => {
                            await dataService.updateGlobalSetting('weekly_report_recipients', settings.weekly_report_recipients); 
                            alert('Guardado!');
                        }}
                        onTest={handleTestCron}
                        onCopy={handleCopyToClipboard}
                    />}
                    {selectedMenuId === 'webhooks' && <WebhooksTab 
                        settings={settings} 
                        onSettingsChange={(k,v) => setSettings((p:any) => ({...p, [k]:v}))}
                        onSimulate={handleSimulateWebhook}
                        onCreateSimulatedTicket={handleCreateSimulatedTicket}
                    />}
                    {selectedMenuId === 'branding' && <BrandingTab settings={settings} onSettingsChange={(k,v) => setSettings((p: any) => ({...p, [k]:v}))} onSave={async () => { await dataService.updateGlobalSetting('app_logo_base64', settings.app_logo_base64); await dataService.updateGlobalSetting('app_logo_size', String(settings.app_logo_size)); await dataService.updateGlobalSetting('app_logo_alignment', settings.app_logo_alignment); await dataService.updateGlobalSetting('report_footer_institution_id', settings.report_footer_institution_id); alert('Guardado!'); }} instituicoes={appData.instituicoes} />}
                    {selectedMenuId === 'general' && <GeneralScansTab settings={settings} onSettingsChange={(k,v) => setSettings((p: any) => ({...p, [k]:v}))} onSave={async () => { for(const k of ['scan_frequency_days', 'scan_start_time', 'scan_include_eol', 'scan_lookback_years', 'scan_custom_prompt', 'equipment_naming_prefix', 'equipment_naming_digits', 'weekly_report_recipients']) { await dataService.updateGlobalSetting(k, String(settings[k])); } alert('Guardado!'); }} instituicoes={appData.instituicoes} />}
                    {selectedMenuId === 'connections' && <ConnectionsTab settings={settings} onSettingsChange={(k,v) => setSettings((p: any) => ({...p, [k]:v}))} onSave={async () => { await dataService.updateGlobalSetting('resend_api_key', settings.resendApiKey); await dataService.updateGlobalSetting('resend_from_email', settings.resendFromEmail); if (settings.sbUrl && settings.sbKey) {localStorage.setItem('SUPABASE_URL', settings.sbUrl); localStorage.setItem('SUPABASE_ANON_KEY', settings.sbKey);} if (settings.sbServiceKey) {localStorage.setItem('SUPABASE_SERVICE_ROLE_KEY', settings.sbServiceKey);} if(confirm("Guardado. Recarregar?")){window.location.reload();}}} />}
                    {selectedMenuId === 'roles' && <RoleManager roles={appData.customRoles} onRefresh={refreshData} />}
                    {selectedMenuId === 'brands' && <BrandDashboard brands={appData.brands} equipment={appData.equipment} onCreate={() => { setBrandToEdit(null); setShowAddBrandModal(true); }} onEdit={(b) => { setBrandToEdit(b); setShowAddBrandModal(true); }} onDelete={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteBrand(id); refreshData(); } }} />}
                    {selectedMenuId === 'equipment_types' && <EquipmentTypeDashboard equipmentTypes={appData.equipmentTypes} equipment={appData.equipment} onCreate={() => { setTypeToEdit(null); setShowAddTypeModal(true); }} onEdit={(t) => { setTypeToEdit(t); setShowAddTypeModal(true); }} onDelete={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteEquipmentType(id); refreshData(); } }} />}
                    {selectedMenuId === 'ticket_categories' && <CategoryDashboard categories={appData.ticketCategories} tickets={appData.tickets} teams={appData.teams} onCreate={() => { setCategoryToEdit(null); setShowAddCategoryModal(true); }} onEdit={(c) => { setCategoryToEdit(c); setShowAddCategoryModal(true); }} onDelete={async (id) => { if(window.confirm("Tem a certeza?")) {await dataService.deleteTicketCategory(id); refreshData();}}} onToggleStatus={async (id) => {const cat = appData.ticketCategories.find((c:any) => c.id === id); if(cat) {await dataService.updateTicketCategory(id, { is_active: !cat.is_active }); refreshData();}}} />}
                    {selectedMenuId === 'security_incident_types' && <SecurityIncidentTypeDashboard incidentTypes={appData.securityIncidentTypes} tickets={appData.tickets} onCreate={() => { setIncidentTypeToEdit(null); setShowAddIncidentTypeModal(true); }} onEdit={(i) => { setIncidentTypeToEdit(i); setShowAddIncidentTypeModal(true); }} onDelete={async (id) => { if(window.confirm("Tem a certeza?")) {await dataService.deleteSecurityIncidentType(id); refreshData();}}} onToggleStatus={async (id) => {const it = appData.securityIncidentTypes.find((i:any) => i.id === id); if(it) {await dataService.updateSecurityIncidentType(id, { is_active: !it.is_active }); refreshData();}}} />}
                    
                    {selectedMenuId === 'config_software_products' ? (
                         <SoftwareProductDashboard 
                            products={appData.softwareProducts}
                            categories={appData.softwareCategories}
                            onRefresh={refreshData}
                        />
                    ) : (
                        simpleConfigTables[selectedMenuId] && (
                            <GenericConfigDashboard 
                                title={simpleConfigTables[selectedMenuId].label}
                                icon={simpleConfigTables[selectedMenuId].icon}
                                items={simpleConfigTables[selectedMenuId].data}
                                tableName={selectedMenuId}
                                onRefresh={refreshData}
                                colorField={simpleConfigTables[selectedMenuId].colorField}
                            />
                        )
                    )}
                </div>
            </div>

            {/* Modals */}
            {showDiagnostics && <SystemDiagnosticsModal onClose={() => setShowDiagnostics(false)} />}
            {showAddBrandModal && <AddBrandModal onClose={() => setShowAddBrandModal(false)} onSave={async (b) => { if(brandToEdit) await dataService.updateBrand(brandToEdit.id, b); else await dataService.addBrand(b); refreshData(); }} brandToEdit={brandToEdit} existingBrands={appData.brands} />}
            {showAddTypeModal && <AddEquipmentTypeModal onClose={() => setShowAddTypeModal(false)} onSave={async (t) => { if(typeToEdit) await dataService.updateEquipmentType(typeToEdit.id, t); else await dataService.addEquipmentType(t); refreshData(); }} typeToEdit={typeToEdit} teams={appData.teams} existingTypes={appData.equipmentTypes} />}
            {showAddCategoryModal && <AddCategoryModal onClose={() => setShowAddCategoryModal(false)} onSave={async (c) => { if(categoryToEdit) await dataService.updateTicketCategory(categoryToEdit.id, c); else await dataService.addTicketCategory(c); refreshData(); }} categoryToEdit={categoryToEdit} teams={appData.teams} />}
            {showAddIncidentTypeModal && <AddSecurityIncidentTypeModal onClose={() => setShowAddIncidentTypeModal(false)} onSave={async (i) => { if(incidentTypeToEdit) await dataService.updateSecurityIncidentType(incidentTypeToEdit.id, i); else await dataService.addSecurityIncidentType(i); refreshData(); }} typeToEdit={incidentTypeToEdit} />}
        </>
    );
};

export default SettingsManager;
