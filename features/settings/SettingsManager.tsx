
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as dataService from '../../services/dataService';
import { 
    FaHeartbeat, FaTags, FaShapes, FaList, FaShieldAlt, FaTicketAlt, FaUserTag, FaServer, 
    FaGraduationCap, FaLock, FaIdCard, FaPalette, FaRobot, FaKey, FaNetworkWired, FaClock,
    FaBroom, FaUserSlash, FaCompactDisc, FaLandmark, FaLeaf, FaMicrochip, FaMemory, FaHdd, FaUserTie, FaSync, FaChevronRight, FaArrowLeft, FaBars, FaBolt, FaUsers
} from 'react-icons/fa';
import { ConfigItem, Brand, EquipmentType, TicketCategoryItem, SecurityIncidentTypeItem, TicketStatus, Team } from '../../types';
import { parseSecurityAlert } from '../../services/geminiService';
import { getSupabase } from '../../services/supabaseClient';

// Child Dashboards/Components (Shared)
import BrandDashboard from '../../components/BrandDashboard';
import EquipmentTypeDashboard from '../../components/EquipmentTypeDashboard';
import CategoryDashboard from '../../components/CategoryDashboard';
import SecurityIncidentTypeDashboard from '../../components/SecurityIncidentTypeDashboard';
import RoleManager from '../../components/RoleManager'; 
import AutomationRulesDashboard from '../../components/AutomationRulesDashboard';
import TeamDashboard from '../../components/TeamDashboard';

// Local Feature Components
import BrandingTab from './BrandingTab';
import GeneralScansTab from './GeneralScansTab';
import ConnectionsTab from './ConnectionsTab';
import AgentsTab from './AgentsTab';
import WebhooksTab from './WebhooksTab';
import CronJobsTab from './CronJobsTab';
import SoftwareProductDashboard from './SoftwareProductDashboard';
import GenericConfigDashboard from './GenericConfigDashboard';

// Modals
import AddBrandModal from '../../components/AddBrandModal';
import AddEquipmentTypeModal from '../../components/AddEquipmentTypeModal';
import AddCategoryModal from '../../components/AddCategoryModal';
import AddSecurityIncidentTypeModal from '../../components/AddSecurityIncidentTypeModal';
import SystemDiagnosticsModal from '../../components/SystemDiagnosticsModal';
import AddTeamModal from '../../components/AddTeamModal';
import ManageTeamMembersModal from '../../components/ManageTeamMembersModal';

interface SettingsManagerProps {
    appData: any;
    refreshData: () => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ appData, refreshData }) => {
    const [selectedMenuId, setSelectedMenuId] = useState<string>(() => {
        const hash = window.location.hash.replace('#settings.', '');
        if (hash && hash !== 'settings') return hash;
        return 'general';
    });
    const [mobileView, setMobileView] = useState<'menu' | 'content'>('menu');
    const [isSyncing, setIsSyncing] = useState(false);

    // Modals State
    const [showAddBrandModal, setShowAddBrandModal] = useState(false);
    const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
    const [showAddTypeModal, setShowAddTypeModal] = useState(false);
    const [typeToEdit, setTypeToEdit] = useState<EquipmentType | null>(null);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<TicketCategoryItem | null>(null);
    const [showAddIncidentTypeModal, setShowAddIncidentTypeModal] = useState(false);
    const [incidentTypeToEdit, setIncidentTypeToEdit] = useState<SecurityIncidentTypeItem | null>(null);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    const [showAddTeamModal, setShowAddTeamModal] = useState(false);
    const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
    const [showManageTeamMembersModal, setShowManageTeamMembersModal] = useState(false);
    const [teamToManage, setTeamToManage] = useState<Team | null>(null);
    
    const [settings, setSettings] = useState<any>({
        webhookJson: '{\n  "alert_type": "Event::Endpoint::Threat::Detected",\n  "severity": "high",\n  "full_name": "PC-FINANCEIRO-01",\n  "description": "Malware detected"\n}',
        simulatedTicket: null,
        isSimulating: false,
        sophos_client_id: '',
        sophos_client_secret: '',
        slackWebhookUrl: '',
        sbUrl: '',
        sbKey: '',
        resendApiKey: '',
        resendFromEmail: '',
        scan_frequency_days: '0',
        scan_start_time: '09:00',
        equipment_naming_prefix: 'PC-',
        equipment_naming_digits: '4',
        app_logo_base64: '',
        app_logo_size: 80,
        app_logo_alignment: 'center',
        report_footer_institution_id: '',
        birthday_email_subject: 'Feliz Aniversário!',
        birthday_email_body: 'Parabéns {{nome}}! Desejamos-te um dia fantástico.',
        weekly_report_recipients: ''
    });

    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const loadGlobalSettings = useCallback(async () => {
        const keys = [
            'sophos_client_id', 'sophos_client_secret', 'slack_webhook_url',
            'supabase_url', 'supabase_anon_key', 'resend_api_key', 'resend_from_email',
            'scan_frequency_days', 'scan_start_time', 'equipment_naming_prefix', 'equipment_naming_digits',
            'app_logo_base64', 'app_logo_size', 'app_logo_alignment', 'report_footer_institution_id',
            'birthday_email_subject', 'birthday_email_body', 'weekly_report_recipients', 'last_auto_scan'
        ];
        
        const loadedSettings: any = { ...settings };
        
        try {
            for (const key of keys) {
                const value = await dataService.getGlobalSetting(key);
                if (value !== null) {
                    if (key === 'slack_webhook_url') loadedSettings.slackWebhookUrl = value;
                    else if (key === 'supabase_url') loadedSettings.sbUrl = value;
                    else if (key === 'supabase_anon_key') loadedSettings.sbKey = value;
                    else if (key === 'resend_api_key') loadedSettings.resendApiKey = value;
                    else if (key === 'resend_from_email') loadedSettings.resendFromEmail = value;
                    else loadedSettings[key] = value;
                }
            }
            setSettings(loadedSettings);
        } catch (e) {
            console.error("Erro ao carregar configurações globais:", e);
        }
    }, []);

    useEffect(() => {
        loadGlobalSettings();
    }, [loadGlobalSettings]);

    useEffect(() => {
        if (selectedMenuId) {
             window.location.hash = `settings.${selectedMenuId}`;
        }
    }, [selectedMenuId]);

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            const mapping: any = {
                'sophos_client_id': settings.sophos_client_id,
                'sophos_client_secret': settings.sophos_client_secret,
                'slack_webhook_url': settings.slackWebhookUrl,
                'supabase_url': settings.sbUrl,
                'supabase_anon_key': settings.sbKey,
                'resend_api_key': settings.resendApiKey,
                'resend_from_email': settings.resendFromEmail,
                'scan_frequency_days': settings.scan_frequency_days,
                'scan_start_time': settings.scan_start_time,
                'equipment_naming_prefix': settings.equipment_naming_prefix,
                'equipment_naming_digits': settings.equipment_naming_digits,
                'app_logo_base64': settings.app_logo_base64,
                'app_logo_size': String(settings.app_logo_size),
                'app_logo_alignment': settings.app_logo_alignment,
                'report_footer_institution_id': settings.report_footer_institution_id,
                'birthday_email_subject': settings.birthday_email_subject,
                'birthday_email_body': settings.birthday_email_body,
                'weekly_report_recipients': settings.weekly_report_recipients
            };

            for (const [dbKey, value] of Object.entries(mapping)) {
                if (value !== undefined && value !== null) {
                    await dataService.updateGlobalSetting(dbKey, String(value));
                }
            }
            
            alert("Configurações gravadas com sucesso.");
            refreshData();
        } catch (e) {
            console.error(e);
            alert("Erro ao gravar as configurações.");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleTriggerSophosSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase.functions.invoke('sync-sophos', { 
                body: {},
                headers: { "Content-Type": "application/json" }
            });
            if (error) throw error;
            alert("Sincronização concluída: " + (data?.message || "Concluída."));
        } catch (e: any) {
            console.error("Sophos Sync Error:", e);
            alert(`Falha na Sincronização: ${e.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const safeData = (arr: any) => Array.isArray(arr) ? arr : [];

    const menuStructure = [
        {
            group: "Sistema & Automação",
            items: [
                { id: 'general', label: 'Geral & Scans', icon: <FaRobot /> },
                { id: 'config_automation', label: 'Regras de Automação', icon: <FaBolt /> },
                { id: 'connections', label: 'Conexões & APIs', icon: <FaKey /> },
                { id: 'agents', label: 'Agentes (PowerShell)', icon: <FaRobot /> },
                { id: 'webhooks', label: 'Webhooks (SIEM)', icon: <FaNetworkWired /> },
                { id: 'cronjobs', label: 'Tarefas Agendadas', icon: <FaClock /> },
                { id: 'branding', label: 'Branding', icon: <FaPalette /> },
                { id: 'diagnostics', label: 'Diagnóstico', icon: <FaHeartbeat /> },
            ]
        },
        {
            group: "Segurança & Acessos",
            items: [
                { id: 'roles', label: 'Perfis de Acesso (RBAC)', icon: <FaIdCard /> },
                { id: 'teams', label: 'Equipas de Suporte', icon: <FaUsers /> },
            ]
        },
        {
            group: "Tabelas Auxiliares",
            items: [
                { id: 'brands', label: 'Marcas', icon: <FaTags /> },
                { id: 'equipment_types', label: 'Tipos de Equipamento', icon: <FaShapes /> },
                { id: 'config_equipment_statuses', label: 'Estados Ativos', icon: <FaList /> },
                { id: 'config_ticket_statuses', label: 'Estados de Tickets', icon: <FaTicketAlt /> },
                { id: 'config_license_statuses', label: 'Estados de Licenças', icon: <FaKey /> },
                { id: 'config_decommission_reasons', label: 'Motivos de Abate', icon: <FaBroom /> },
                { id: 'ticket_categories', label: 'Categorias de Tickets', icon: <FaTicketAlt /> },
                { id: 'security_incident_types', label: 'Tipos de Incidente', icon: <FaShieldAlt /> },
                { id: 'config_job_titles', label: 'Cargos / Funções', icon: <FaUserTie /> },
                { id: 'config_software_products', label: 'Produtos Software', icon: <FaCompactDisc /> },
                { id: 'config_accounting_categories', label: 'Classificador CIBE', icon: <FaLandmark /> },
                { id: 'config_cpus', label: 'CPUs', icon: <FaMicrochip /> },
                { id: 'config_ram_sizes', label: 'RAM', icon: <FaMemory /> },
                { id: 'config_storage_types', label: 'Discos', icon: <FaHdd /> },
            ]
        }
    ];

    const simpleConfigTables = useMemo(() => ({
        'config_equipment_statuses': { label: 'Estados de Equipamento', icon: <FaList/>, data: safeData(appData.configEquipmentStatuses), colorField: true },
        'config_ticket_statuses': { label: 'Estados de Tickets', icon: <FaTicketAlt/>, data: safeData(appData.configTicketStatuses), colorField: true },
        'config_license_statuses': { label: 'Estados de Licenças', icon: <FaKey/>, data: safeData(appData.configLicenseStatuses), colorField: true },
        'config_decommission_reasons': { label: 'Motivos de Abate', icon: <FaBroom/>, data: safeData(appData.configDecommissionReasons) },
        'config_accounting_categories': { label: 'Classificador CIBE / SNC-AP', icon: <FaLandmark/>, data: safeData(appData.configAccountingCategories) },
        'config_conservation_states': { label: 'Estados de Conservação', icon: <FaLeaf/>, data: safeData(appData.configConservationStates), colorField: true },
        'config_cpus': { label: 'Tipos de Processador', icon: <FaMicrochip/>, data: safeData(appData.configCpus) },
        'config_ram_sizes': { label: 'Tamanhos de Memória RAM', icon: <FaMemory/>, data: safeData(appData.configRamSizes) },
        'config_storage_types': { label: 'Tipos de Disco / Armazenamento', icon: <FaHdd/>, data: safeData(appData.configStorageTypes) },
        'config_job_titles': { label: 'Cargos / Funções Profissionais', icon: <FaUserTie/>, data: safeData(appData.configJobTitles) },
    }), [appData]);

    const renderContent = () => {
        if (simpleConfigTables[selectedMenuId as keyof typeof simpleConfigTables]) {
            const cfg = (simpleConfigTables as any)[selectedMenuId];
            return <GenericConfigDashboard title={cfg.label} icon={cfg.icon} items={cfg.data} tableName={selectedMenuId} onRefresh={refreshData} colorField={cfg.colorField} />;
        }
        switch (selectedMenuId) {
            case 'general': return <GeneralScansTab settings={settings} onSettingsChange={(k,v) => setSettings({...settings, [k]:v})} onSave={handleSaveSettings} instituicoes={appData.instituicoes} />;
            case 'roles': return <RoleManager roles={safeData(appData.customRoles)} onRefresh={refreshData} />;
            case 'teams': return (
                <TeamDashboard 
                    teams={appData.teams}
                    teamMembers={appData.teamMembers}
                    collaborators={appData.collaborators}
                    tickets={appData.tickets}
                    equipmentTypes={appData.equipmentTypes}
                    onEdit={(t) => { setTeamToEdit(t); setShowAddTeamModal(true); }}
                    onDelete={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteTeam(id); refreshData(); } }}
                    onCreate={() => { setTeamToEdit(null); setShowAddTeamModal(true); }}
                    onManageMembers={(t) => { setTeamToManage(t); setShowManageTeamMembersModal(true); }}
                    onToggleStatus={async (id) => {
                        const t = appData.teams.find((team: Team) => team.id === id);
                        if (t) { await dataService.updateTeam(id, { is_active: t.is_active === false }); refreshData(); }
                    }}
                />
            );
            case 'config_automation': return <AutomationRulesDashboard />;
            case 'brands': return <BrandDashboard brands={safeData(appData.brands)} equipment={safeData(appData.equipment)} onCreate={() => { setBrandToEdit(null); setShowAddBrandModal(true); }} onEdit={(b) => { setBrandToEdit(b); setShowAddBrandModal(true); }} />;
            case 'equipment_types': return <EquipmentTypeDashboard equipmentTypes={safeData(appData.equipmentTypes)} equipment={safeData(appData.equipment)} onCreate={() => { setTypeToEdit(null); setShowAddTypeModal(true); }} onEdit={(t) => { setTypeToEdit(t); setShowAddTypeModal(true); }} />;
            case 'ticket_categories': return <CategoryDashboard categories={safeData(appData.ticketCategories)} tickets={safeData(appData.tickets)} teams={safeData(appData.teams)} onCreate={() => { setCategoryToEdit(null); setShowAddCategoryModal(true); }} onEdit={(c) => { setCategoryToEdit(c); setShowAddCategoryModal(true); }} onToggleStatus={(id) => {}} onDelete={(id) => {}} />;
            case 'security_incident_types': return <SecurityIncidentTypeDashboard incidentTypes={safeData(appData.securityIncidentTypes)} tickets={safeData(appData.tickets)} onCreate={() => { setIncidentTypeToEdit(null); setShowAddIncidentTypeModal(true); }} onEdit={(i) => { setIncidentTypeToEdit(i); setShowAddIncidentTypeModal(true); }} onToggleStatus={(id) => {}} onDelete={(id) => {}} />;
            case 'config_software_products': return <SoftwareProductDashboard products={safeData(appData.softwareProducts)} categories={safeData(appData.softwareCategories)} onRefresh={refreshData} />;
            case 'connections': return <ConnectionsTab settings={settings} onSettingsChange={(k,v) => setSettings({...settings, [k]:v})} onSave={handleSaveSettings} />;
            case 'cronjobs': return <CronJobsTab settings={settings} onSettingsChange={(k,v) => setSettings({...settings, [k]:v})} onSave={handleSaveSettings} onTest={() => {}} onCopy={(t) => navigator.clipboard.writeText(t)} onSyncSophos={handleTriggerSophosSync} isSyncingSophos={isSyncing} />;
            case 'branding': return <BrandingTab settings={settings} onSettingsChange={(k,v) => setSettings({...settings, [k]:v})} onSave={handleSaveSettings} instituicoes={appData.instituicoes} />;
            case 'agents': return <AgentsTab />;
            case 'webhooks': return <WebhooksTab settings={settings} onSettingsChange={(k,v) => setSettings({...settings, [k]:v})} onSimulate={() => {}} />;
            case 'diagnostics': return <div className="p-6 text-center"><button onClick={() => setShowDiagnostics(true)} className="bg-brand-primary text-white px-6 py-3 rounded-lg font-bold">Abrir Sistema de Diagnóstico</button></div>;
            default: return <div className="p-10 text-center text-gray-500">Selecione uma opção no menu à esquerda.</div>;
        }
    };

    return (
        <div className="flex flex-col md:flex-row bg-surface-dark rounded-lg border border-gray-700 overflow-hidden min-h-[700px]">
            <div className={`w-full md:w-64 lg:w-72 bg-gray-900/50 border-r border-gray-700 flex flex-col ${mobileView === 'content' ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-700 font-bold text-gray-400 text-xs uppercase tracking-widest">
                    Definições do Sistema
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
                    {menuStructure.map((group, gIdx) => (
                        <div key={gIdx} className="mb-6">
                            <h3 className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{group.group}</h3>
                            <div className="space-y-0.5">
                                {group.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => { setSelectedMenuId(item.id); setMobileView('content'); }}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 transition-colors ${selectedMenuId === item.id ? 'bg-brand-primary text-white font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`flex-1 flex flex-col min-h-0 ${mobileView === 'menu' ? 'hidden md:flex' : 'flex'}`}>
                <div className="md:hidden p-4 border-b border-gray-700 flex items-center">
                    <button onClick={() => setMobileView('menu')} className="text-brand-secondary flex items-center gap-2 text-sm font-bold">
                        <FaArrowLeft /> Voltar ao Menu
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar bg-surface-dark">
                    {renderContent()}
                </div>
            </div>

            {showAddBrandModal && <AddBrandModal onClose={() => setShowAddBrandModal(false)} onSave={async (b) => { if(brandToEdit) await dataService.updateBrand(brandToEdit.id, b); else await dataService.addBrand(b); refreshData(); }} brandToEdit={brandToEdit} existingBrands={appData.brands} />}
            {showAddTypeModal && <AddEquipmentTypeModal onClose={() => setShowAddTypeModal(false)} onSave={async (t) => { if(typeToEdit) await dataService.updateEquipmentType(typeToEdit.id, t); else await dataService.addEquipmentType(t); refreshData(); }} typeToEdit={typeToEdit} teams={appData.teams} />}
            {showAddCategoryModal && <AddCategoryModal onClose={() => setShowAddCategoryModal(false)} onSave={async (c) => { if(categoryToEdit) await dataService.updateTicketCategory(categoryToEdit.id, c); else await dataService.addTicketCategory(c); refreshData(); }} categoryToEdit={categoryToEdit} teams={appData.teams} />}
            {showAddIncidentTypeModal && <AddSecurityIncidentTypeModal onClose={() => setShowAddIncidentTypeModal(false)} onSave={async (i) => { if(incidentTypeToEdit) await dataService.updateSecurityIncidentType(incidentTypeToEdit.id, i); else await dataService.addSecurityIncidentType(i); refreshData(); }} typeToEdit={incidentTypeToEdit} />}
            {showAddTeamModal && (
                <AddTeamModal
                    onClose={() => setShowAddTeamModal(false)}
                    onSave={async (team) => {
                        if (teamToEdit) await dataService.updateTeam(teamToEdit.id, team);
                        else await dataService.addTeam(team);
                        refreshData();
                    }}
                    teamToEdit={teamToEdit}
                />
            )}
            {showManageTeamMembersModal && teamToManage && (
                <ManageTeamMembersModal 
                    onClose={() => setShowManageTeamMembersModal(false)}
                    onSave={async (teamId, memberIds) => {
                        await dataService.syncTeamMembers(teamId, memberIds);
                        refreshData();
                        setShowManageTeamMembersModal(false);
                    }}
                    team={teamToManage}
                    allCollaborators={appData.collaborators}
                    teamMembers={appData.teamMembers}
                />
            )}
            {showDiagnostics && <SystemDiagnosticsModal onClose={() => setShowDiagnostics(false)} />}
        </div>
    );
};

export default SettingsManager;
