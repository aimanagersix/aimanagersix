
import React, { useState, useEffect, useCallback } from 'react';
import * as dataService from '../../services/dataService';
import { FaArrowLeft } from 'react-icons/fa';
import { Brand, EquipmentType, TicketCategoryItem, SecurityIncidentTypeItem, Team } from '../../types';
import { getSupabase } from '../../services/supabaseClient';

// Shared Layout Components
import SettingsSidebar from './SettingsSidebar';
import SettingsRouter from './SettingsRouter';

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

    return (
        <div className="flex flex-col md:flex-row bg-surface-dark rounded-lg border border-gray-700 overflow-hidden min-h-[700px]">
            {/* Sidebar Section */}
            <div className={`w-full md:w-64 lg:w-72 bg-gray-900/50 border-r border-gray-700 flex flex-col ${mobileView === 'content' ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-700 font-bold text-gray-400 text-xs uppercase tracking-widest">Definições do Sistema</div>
                <SettingsSidebar 
                    selectedMenuId={selectedMenuId} 
                    onSelect={(id) => { setSelectedMenuId(id); setMobileView('content'); }} 
                />
            </div>

            {/* Content Section */}
            <div className={`flex-1 flex flex-col min-h-0 ${mobileView === 'menu' ? 'hidden md:flex' : 'flex'}`}>
                <div className="md:hidden p-4 border-b border-gray-700 flex items-center">
                    <button onClick={() => setMobileView('menu')} className="text-brand-secondary flex items-center gap-2 text-sm font-bold">
                        <FaArrowLeft /> Voltar ao Menu
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar bg-surface-dark">
                    <SettingsRouter 
                        selectedMenuId={selectedMenuId}
                        appData={appData}
                        settings={settings}
                        onSettingsChange={(k,v) => setSettings({...settings, [k]:v})}
                        onSaveSettings={handleSaveSettings}
                        onRefresh={refreshData}
                        onSyncSophos={handleTriggerSophosSync}
                        isSyncingSophos={isSyncing}
                        onShowDiagnostics={() => setShowDiagnostics(true)}
                        onEditBrand={(b) => { setBrandToEdit(b); setShowAddBrandModal(true); }}
                        onEditType={(t) => { setTypeToEdit(t); setShowAddTypeModal(true); }}
                        onEditCategory={(c) => { setCategoryToEdit(c); setShowAddCategoryModal(true); }}
                        onEditIncidentType={(i) => { setIncidentTypeToEdit(i); setShowAddIncidentTypeModal(true); }}
                        onEditTeam={(t) => { setTeamToEdit(t); setShowAddTeamModal(true); }}
                        onManageTeamMembers={(t) => { setTeamToManage(t); setShowManageTeamMembersModal(true); }}
                    />
                </div>
            </div>

            {/* Modals */}
            {showAddBrandModal && <AddBrandModal onClose={() => setShowAddBrandModal(false)} onSave={async (b) => { if(brandToEdit) await dataService.updateBrand(brandToEdit.id, b); else await dataService.addBrand(b); refreshData(); }} brandToEdit={brandToEdit} existingBrands={appData.brands} />}
            {showAddTypeModal && <AddEquipmentTypeModal onClose={() => setShowAddTypeModal(false)} onSave={async (t) => { if(typeToEdit) await dataService.updateEquipmentType(typeToEdit.id, t); else await dataService.addEquipmentType(t); refreshData(); }} typeToEdit={typeToEdit} teams={appData.teams} />}
            {showAddCategoryModal && <AddCategoryModal onClose={() => setShowAddCategoryModal(false)} onSave={async (c) => { if(categoryToEdit) await dataService.updateTicketCategory(categoryToEdit.id, c); else await dataService.addTicketCategory(c); refreshData(); }} categoryToEdit={categoryToEdit} teams={appData.teams} />}
            {showAddIncidentTypeModal && <AddSecurityIncidentTypeModal onClose={() => setShowAddIncidentTypeModal(false)} onSave={async (i) => { if(incidentTypeToEdit) await dataService.updateSecurityIncidentType(incidentTypeToEdit.id, i); else await dataService.addSecurityIncidentType(i); refreshData(); }} typeToEdit={incidentTypeToEdit} />}
            {showAddTeamModal && <AddTeamModal onClose={() => setShowAddTeamModal(false)} onSave={async (team) => { if (teamToEdit) await dataService.updateTeam(teamToEdit.id, team); else await dataService.addTeam(team); refreshData(); }} teamToEdit={teamToEdit} />}
            {showManageTeamMembersModal && teamToManage && <ManageTeamMembersModal onClose={() => setShowManageTeamMembersModal(false)} onSave={async (teamId, memberIds) => { await dataService.syncTeamMembers(teamId, memberIds); refreshData(); setShowManageTeamMembersModal(false); }} team={teamToManage} allCollaborators={appData.collaborators} teamMembers={appData.teamMembers} />}
            {showDiagnostics && <SystemDiagnosticsModal onClose={() => setShowDiagnostics(false)} />}
        </div>
    );
};

export default SettingsManager;
