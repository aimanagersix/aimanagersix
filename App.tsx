import React, { useState, useEffect, useMemo } from 'react';
import { 
    Equipment, Brand, EquipmentType, Instituicao, Entidade, Collaborator, 
    Assignment, Ticket, TicketActivity, SoftwareLicense, LicenseAssignment, 
    Team, TeamMember, Message, CollaboratorHistory, TicketCategoryItem, 
    SecurityIncidentTypeItem, UserRole, BusinessService, ServiceDependency, 
    Vulnerability, BackupExecution, ResilienceTest, SecurityTrainingRecord,
    Supplier, ConfigItem, TooltipConfig, defaultTooltipConfig, CustomRole, ModuleKey, PermissionAction
} from './types';
import * as dataService from './services/dataService';
import { useAppData } from './hooks/useAppData';
import { useLayout } from './contexts/LayoutContext';
import { getSupabase } from './services/supabaseClient';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import ConfigurationSetup from './components/ConfigurationSetup';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ResetPasswordModal from './components/ResetPasswordModal';

// Feature Managers (Modules)
import InventoryManager from './features/inventory/InventoryManager';

// Dashboards (Non-Refactored Modules)
import OverviewDashboard from './components/OverviewDashboard';
import SmartDashboard from './components/SmartDashboard';
import InstituicaoDashboard from './components/InstituicaoDashboard';
import EntidadeDashboard from './components/EntidadeDashboard';
import CollaboratorDashboard from './components/CollaboratorDashboard';
import TeamDashboard from './components/TeamDashboard';
import SupplierDashboard from './components/SupplierDashboard';
import TicketDashboard from './components/TicketDashboard';
import ServiceDashboard from './components/ServiceDashboard';
import VulnerabilityDashboard from './components/VulnerabilityDashboard';
import BackupDashboard from './components/BackupDashboard';
import ResilienceDashboard from './components/ResilienceDashboard';
import AuxiliaryDataDashboard from './components/AuxiliaryDataDashboard';
import AgendaDashboard from './components/AgendaDashboard';
import MapDashboard from './components/MapDashboard';
import ReportsDashboard from './components/ReportsDashboard';

// Modals (Global or Non-Refactored)
import AddBrandModal from './components/AddBrandModal';
import AddEquipmentTypeModal from './components/AddEquipmentTypeModal';
import AddInstituicaoModal from './components/AddInstituicaoModal';
import AddEntidadeModal from './components/AddEntidadeModal';
import AddCollaboratorModal from './components/AddCollaboratorModal';
import AddTeamModal from './components/AddTeamModal';
import ManageTeamMembersModal from './components/ManageTeamMembersModal';
import AddTicketModal from './components/AddTicketModal';
import CloseTicketModal from './components/CloseTicketModal';
import TicketActivitiesModal from './components/TicketActivitiesModal';
import AddCategoryModal from './components/AddCategoryModal';
import AddSecurityIncidentTypeModal from './components/AddSecurityIncidentTypeModal';
import AddServiceModal from './components/AddServiceModal';
import ServiceDependencyModal from './components/ServiceDependencyModal';
import AddVulnerabilityModal from './components/AddVulnerabilityModal';
import AddBackupModal from './components/AddBackupModal';
import AddResilienceTestModal from './components/AddResilienceTestModal';
import AddSupplierModal from './components/AddSupplierModal';
import ImportModal from './components/ImportModal';
import ReportModal from './components/ReportModal';
import CollaboratorHistoryModal from './components/CollaboratorHistoryModal';
import CollaboratorDetailModal from './components/CollaboratorDetailModal';
import UserManualModal from './components/UserManualModal';
import CalendarModal from './components/CalendarModal';
import MagicCommandBar from './components/MagicCommandBar';
import { ChatWidget } from './components/ChatWidget';
import CredentialsModal from './components/CredentialsModal';
import NotificationsModal from './components/NotificationsModal';


export const App: React.FC = () => {
    // Use Custom Hook for Data Management
    const { 
        isConfigured, setIsConfigured, 
        currentUser, setCurrentUser, 
        appData, refreshData 
    } = useAppData();
    
    const { layoutMode } = useLayout();
    
    // --- Routing Logic (Hash Based) ---
    const [activeTab, setActiveTabState] = useState(() => {
        const hash = window.location.hash.replace('#', '');
        return hash || 'overview';
    });

    const setActiveTab = (tab: string) => {
        setActiveTabState(tab);
        window.location.hash = tab;
    };

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && hash !== activeTab) {
                setActiveTabState(hash);
            } else if (!hash) {
                setActiveTabState('overview');
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [activeTab]);

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    
    // --- Modal State Management (Non-Inventory) ---
    
    // -- Organization Modals --
    const [showAddBrandModal, setShowAddBrandModal] = useState(false);
    const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
    
    const [showAddTypeModal, setShowAddTypeModal] = useState(false);
    const [typeToEdit, setTypeToEdit] = useState<EquipmentType | null>(null);

    const [showAddInstituicaoModal, setShowAddInstituicaoModal] = useState(false);
    const [instituicaoToEdit, setInstituicaoToEdit] = useState<Instituicao | null>(null);
    
    const [showAddEntidadeModal, setShowAddEntidadeModal] = useState(false);
    const [entidadeToEdit, setEntidadeToEdit] = useState<Entidade | null>(null);

    const [showAddCollaboratorModal, setShowAddCollaboratorModal] = useState(false);
    const [collaboratorToEdit, setCollaboratorToEdit] = useState<Collaborator | null>(null);
    
    const [showAddTeamModal, setShowAddTeamModal] = useState(false);
    const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
    const [showManageTeamMembersModal, setShowManageTeamMembersModal] = useState(false);
    const [teamToManage, setTeamToManage] = useState<Team | null>(null);

    // -- Ticket Modals --
    const [showAddTicketModal, setShowAddTicketModal] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
    const [showCloseTicketModal, setShowCloseTicketModal] = useState(false);
    const [ticketToClose, setTicketToClose] = useState<Ticket | null>(null);
    const [showTicketActivitiesModal, setShowTicketActivitiesModal] = useState(false);
    const [ticketForActivities, setTicketForActivities] = useState<Ticket | null>(null);

    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<TicketCategoryItem | null>(null);
    
    const [showAddIncidentTypeModal, setShowAddIncidentTypeModal] = useState(false);
    const [incidentTypeToEdit, setIncidentTypeToEdit] = useState<SecurityIncidentTypeItem | null>(null);

    // -- Compliance Modals --
    const [showAddServiceModal, setShowAddServiceModal] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<BusinessService | null>(null);
    const [showServiceDependencyModal, setShowServiceDependencyModal] = useState(false);
    const [serviceForDependencies, setServiceForDependencies] = useState<BusinessService | null>(null);

    const [showAddVulnerabilityModal, setShowAddVulnerabilityModal] = useState(false);
    const [vulnerabilityToEdit, setVulnerabilityToEdit] = useState<Vulnerability | null>(null);

    const [showAddBackupModal, setShowAddBackupModal] = useState(false);
    const [backupToEdit, setBackupToEdit] = useState<BackupExecution | null>(null);

    const [showAddResilienceTestModal, setShowAddResilienceTestModal] = useState(false);
    const [testToEdit, setTestToEdit] = useState<ResilienceTest | null>(null);

    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

    // -- Global/Utility Modals --
    const [showImportModal, setShowImportModal] = useState(false);
    const [importConfig, setImportConfig] = useState<any>(null);

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState<'equipment' | 'collaborator' | 'ticket' | 'licensing' | 'compliance' | 'bia'>('equipment');

    const [showCollaboratorHistoryModal, setShowCollaboratorHistoryModal] = useState(false);
    const [historyCollaborator, setHistoryCollaborator] = useState<Collaborator | null>(null);
    
    const [showCollaboratorDetailModal, setShowCollaboratorDetailModal] = useState(false);
    const [detailCollaborator, setDetailCollaborator] = useState<Collaborator | null>(null);

    const [showUserManualModal, setShowUserManualModal] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [showChatWidget, setShowChatWidget] = useState(false);
    const [activeChatCollaboratorId, setActiveChatCollaboratorId] = useState<string | null>(null);

    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [resetSession, setResetSession] = useState<any>(null);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [newCredentials, setNewCredentials] = useState<{email: string, password?: string} | null>(null);
    
    // Shared Filter State (Used to pass search queries from MagicBar to Dashboards)
    const [dashboardFilter, setDashboardFilter] = useState<any>(null);

    // --- Permission Logic (RBAC) ---
    const checkPermission = (module: ModuleKey, action: PermissionAction): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === UserRole.SuperAdmin) return true;
        
        const role = appData.customRoles.find(r => r.name === currentUser.role);
        if (role) {
            return role.permissions[module]?.[action] ?? false;
        }

        if (currentUser.role === UserRole.Admin) return true;
        
        if (currentUser.role === 'Técnico' || currentUser.role === 'Normal') {
             if (module === 'settings' || module === 'organization' || module === 'config_custom_roles') return false;
             if (action === 'delete') return false;
             return true;
        }

        if (currentUser.role === UserRole.Utilizador || currentUser.role === 'Basic') {
            if (module === 'tickets' && action === 'create') return true;
            if (module === 'tickets' && action === 'view') return true;
            return false;
        }
        
        return false;
    };
    
    const isBasic = !checkPermission('equipment', 'view') && !checkPermission('organization', 'view');
    const isAdmin = checkPermission('settings', 'view');

    const tabConfig: any = {
        'overview': !isBasic ? 'Visão Geral' : undefined,
        'overview.smart': isAdmin ? 'C-Level Dashboard' : undefined,
        'equipment.inventory': checkPermission('equipment', 'view') ? 'Inventário' : undefined,
        'licensing': checkPermission('licensing', 'view') ? 'Licenciamento' : undefined,
        
        'organizacao.instituicoes': checkPermission('organization', 'view') ? 'Instituições' : undefined,
        'organizacao.entidades': checkPermission('organization', 'view') ? 'Entidades' : undefined,
        'organizacao.teams': checkPermission('organization', 'view') ? 'Equipas' : undefined,
        'organizacao.suppliers': checkPermission('suppliers', 'view') ? 'Fornecedores' : undefined,
        'collaborators': checkPermission('organization', 'view') ? 'Colaboradores' : undefined,
        
        'tickets': checkPermission('tickets', 'view') ? { title: 'Tickets', list: 'Lista de Tickets' } : undefined,
        
        'nis2': checkPermission('compliance', 'view') ? { title: 'Compliance', bia: 'BIA (Serviços)', security: 'Segurança (CVE)', backups: 'Backups & Logs', resilience: 'Testes Resiliência' } : undefined,
        
        'reports': checkPermission('reports', 'view') ? 'Relatórios' : undefined,
        
        'tools': { title: 'Tools', agenda: 'Agenda de contactos', map: 'Pesquisa no Mapa' },
        'settings': checkPermission('settings', 'view') || isAdmin ? 'Configurações' : undefined
    };

    // --- Authentication Handlers ---
    const handleLogin = async (email: string, password: string) => {
        try {
            const supabase = getSupabase();
            const { data, error } = await (supabase.auth as any).signInWithPassword({ email, password });
            if (error) throw error;
            if (data.user) {
                await refreshData();
                const freshData = await dataService.fetchAllData();
                const user = freshData.collaborators.find((c: Collaborator) => c.email.toLowerCase() === email.toLowerCase());
                if (user) {
                    if (!user.canLogin) {
                        await (supabase.auth as any).signOut();
                        return { success: false, error: "Este utilizador não tem permissão para aceder à aplicação." };
                    }
                    if (user.status !== 'Ativo') {
                         await (supabase.auth as any).signOut();
                         return { success: false, error: "Conta inativa. Contacte o administrador." };
                    }
                    setCurrentUser(user);
                    dataService.logAction('LOGIN', 'Auth', `User ${user.email} logged in`);
                    return { success: true };
                } else {
                     await (supabase.auth as any).signOut();
                     return { success: false, error: "Colaborador não encontrado na base de dados." };
                }
            }
            return { success: false, error: "Login falhou." };
        } catch (error: any) {
            return { success: false, error: error.message || "Erro ao fazer login." };
        }
    };

    const handleLogout = async () => {
        const supabase = getSupabase();
        await (supabase.auth as any).signOut();
        setCurrentUser(null);
        setActiveTab('overview');
    };

    const handleViewItem = (tab: string, filter: any) => {
        setActiveTab(tab);
        setDashboardFilter(filter);
    };

    // --- Render ---

    if (!isConfigured) return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    if (!currentUser) return (
        <>
            <LoginPage onLogin={handleLogin} onForgotPassword={() => setShowForgotPasswordModal(true)} />
            {showForgotPasswordModal && <ForgotPasswordModal onClose={() => setShowForgotPasswordModal(false)} />}
            {showResetPasswordModal && <ResetPasswordModal onClose={() => { setShowResetPasswordModal(false); setResetSession(null); }} session={resetSession} />}
        </>
    );

    const userTooltipConfig = currentUser.preferences?.tooltipConfig || defaultTooltipConfig;

    return (
        <div className={`min-h-screen bg-background-dark flex ${layoutMode === 'top' ? 'flex-col' : 'flex-row'}`}>
            {layoutMode === 'side' ? (
                 <Sidebar 
                    currentUser={currentUser} 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    onLogout={handleLogout}
                    tabConfig={tabConfig}
                    notificationCount={0} 
                    onNotificationClick={() => setShowNotificationsModal(true)}
                    isExpanded={isSidebarExpanded}
                    onHover={setIsSidebarExpanded}
                    onOpenAutomation={() => { setActiveTab('settings'); }}
                    onOpenProfile={() => { setDetailCollaborator(currentUser); setShowCollaboratorDetailModal(true); }}
                    onOpenCalendar={() => setShowCalendarModal(true)}
                    onOpenManual={() => setShowUserManualModal(true)}
                />
            ) : (
                <Header 
                    currentUser={currentUser} 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    onLogout={handleLogout} 
                    tabConfig={tabConfig}
                    notificationCount={0} 
                    onNotificationClick={() => setShowNotificationsModal(true)}
                    onOpenAutomation={() => { setActiveTab('settings'); }}
                    onOpenProfile={() => { setDetailCollaborator(currentUser); setShowCollaboratorDetailModal(true); }}
                    onOpenCalendar={() => setShowCalendarModal(true)}
                    onOpenManual={() => setShowUserManualModal(true)}
                />
            )}

            <main className={`flex-1 bg-background-dark transition-all duration-300 overflow-y-auto custom-scrollbar ${layoutMode === 'side' ? (isSidebarExpanded ? 'ml-64' : 'ml-20') : ''}`}>
                <div className="max-w-screen-xl mx-auto p-4 md:p-6">
                    
                    {/* ---------------- DASHBOARDS ---------------- */}

                    {activeTab === 'overview' && <OverviewDashboard 
                        equipment={appData.equipment} 
                        instituicoes={appData.instituicoes}
                        entidades={appData.entidades} 
                        assignments={appData.assignments}
                        equipmentTypes={appData.equipmentTypes}
                        tickets={appData.tickets}
                        collaborators={appData.collaborators}
                        teams={appData.teams}
                        expiringWarranties={[]}
                        expiringLicenses={[]}
                        softwareLicenses={appData.softwareLicenses}
                        licenseAssignments={appData.licenseAssignments}
                        businessServices={appData.businessServices}
                        vulnerabilities={appData.vulnerabilities}
                        onViewItem={handleViewItem}
                        onGenerateComplianceReport={() => { setReportType('compliance'); setShowReportModal(true); }}
                    />}

                    {activeTab === 'overview.smart' && (
                        <SmartDashboard 
                            tickets={appData.tickets} 
                            vulnerabilities={appData.vulnerabilities} 
                            backups={appData.backupExecutions} 
                            trainings={appData.securityTrainings} 
                            collaborators={appData.collaborators}
                            currentUser={currentUser}
                        />
                    )}

                    {/* --- MODULARIZED INVENTORY --- */}
                    {(activeTab === 'equipment.inventory' || activeTab === 'licensing') && (
                        <InventoryManager 
                            activeTab={activeTab}
                            appData={appData}
                            checkPermission={checkPermission}
                            refreshData={refreshData}
                            dashboardFilter={dashboardFilter}
                            setDashboardFilter={setDashboardFilter}
                            setReportType={(t) => { setReportType(t as any); setShowReportModal(true); }}
                            currentUser={currentUser}
                        />
                    )}

                    {activeTab === 'organizacao.instituicoes' && (
                        <InstituicaoDashboard 
                            instituicoes={appData.instituicoes}
                            escolasDepartamentos={appData.entidades}
                            collaborators={appData.collaborators}
                            assignments={appData.assignments}
                            equipment={appData.equipment}
                            brands={appData.brands}
                            equipmentTypes={appData.equipmentTypes}
                            onEdit={checkPermission('organization', 'edit') ? (i) => { setInstituicaoToEdit(i); setShowAddInstituicaoModal(true); } : undefined}
                            onDelete={checkPermission('organization', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteInstituicao(id); refreshData(); } } : undefined}
                            onCreate={checkPermission('organization', 'create') ? () => { setInstituicaoToEdit(null); setShowAddInstituicaoModal(true); } : undefined}
                            onAddEntity={checkPermission('organization', 'create') ? (instId) => { setEntidadeToEdit({ instituicaoId: instId } as any); setShowAddEntidadeModal(true); } : undefined}
                            onCreateCollaborator={checkPermission('organization', 'create') ? () => { setCollaboratorToEdit(null); setShowAddCollaboratorModal(true); } : undefined}
                            onImport={checkPermission('organization', 'create') ? () => { setImportConfig({ dataType: 'instituicoes', title: 'Importar Instituições', columnMap: { 'Nome': 'name', 'Código': 'codigo', 'Email': 'email', 'Telefone': 'telefone' }, templateFileName: 'instituicoes_template.xlsx' }); setShowImportModal(true); } : undefined}
                            onToggleStatus={checkPermission('organization', 'edit') ? async (id) => { 
                                const inst = appData.instituicoes.find(i => i.id === id);
                                if (inst) { await dataService.updateInstituicao(id, { is_active: inst.is_active === false }); refreshData(); }
                            } : undefined}
                        />
                    )}

                    {activeTab === 'organizacao.entidades' && (
                        <EntidadeDashboard 
                            escolasDepartamentos={appData.entidades}
                            instituicoes={appData.instituicoes}
                            collaborators={appData.collaborators}
                            assignments={appData.assignments}
                            tickets={appData.tickets}
                            collaboratorHistory={appData.collaboratorHistory}
                            equipment={appData.equipment}
                            brands={appData.brands}
                            equipmentTypes={appData.equipmentTypes}
                            onEdit={checkPermission('organization', 'edit') ? (e) => { setEntidadeToEdit(e); setShowAddEntidadeModal(true); } : undefined}
                            onDelete={checkPermission('organization', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteEntidade(id); refreshData(); } } : undefined}
                            onCreate={checkPermission('organization', 'create') ? () => { setEntidadeToEdit(null); setShowAddEntidadeModal(true); } : undefined}
                            onAddCollaborator={checkPermission('organization', 'create') ? (entId) => { setCollaboratorToEdit({ entidadeId: entId } as any); setShowAddCollaboratorModal(true); } : undefined}
                            onImport={checkPermission('organization', 'create') ? () => { setImportConfig({ dataType: 'entidades', title: 'Importar Entidades', columnMap: { 'Nome': 'name', 'Código': 'codigo', 'Email': 'email', 'Responsável': 'responsavel' }, templateFileName: 'entidades_template.xlsx' }); setShowImportModal(true); } : undefined}
                            onToggleStatus={checkPermission('organization', 'edit') ? async (id) => {
                                const ent = appData.entidades.find(e => e.id === id);
                                if (ent) { await dataService.updateEntidade(id, { status: ent.status === 'Ativo' ? 'Inativo' : 'Ativo' }); refreshData(); }
                            } : undefined}
                        />
                    )}

                    {activeTab === 'collaborators' && (
                        <CollaboratorDashboard 
                            collaborators={appData.collaborators}
                            escolasDepartamentos={appData.entidades}
                            instituicoes={appData.instituicoes}
                            equipment={appData.equipment}
                            assignments={appData.assignments}
                            tickets={appData.tickets}
                            ticketActivities={appData.ticketActivities}
                            teamMembers={appData.teamMembers}
                            collaboratorHistory={appData.collaboratorHistory}
                            messages={appData.messages}
                            currentUser={currentUser}
                            onEdit={checkPermission('organization', 'edit') ? (c) => { setCollaboratorToEdit(c); setShowAddCollaboratorModal(true); } : undefined}
                            onDelete={checkPermission('organization', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteCollaborator(id); refreshData(); } } : undefined}
                            onCreate={checkPermission('organization', 'create') ? () => { setCollaboratorToEdit(null); setShowAddCollaboratorModal(true); } : undefined}
                            onShowHistory={(c) => { setHistoryCollaborator(c); setShowCollaboratorHistoryModal(true); }}
                            onShowDetails={(c) => { setDetailCollaborator(c); setShowCollaboratorDetailModal(true); }}
                            onStartChat={(c) => { setActiveChatCollaboratorId(c.id); setShowChatWidget(true); }}
                            onGenerateReport={checkPermission('reports', 'view') ? () => { setReportType('collaborator'); setShowReportModal(true); } : undefined}
                            onToggleStatus={checkPermission('organization', 'edit') ? async (id) => {
                                const col = appData.collaborators.find(c => c.id === id);
                                if (col) { await dataService.updateCollaborator(id, { status: col.status === 'Ativo' ? 'Inativo' : 'Ativo' }); refreshData(); }
                            } : undefined}
                            tooltipConfig={userTooltipConfig}
                        />
                    )}

                    {activeTab === 'organizacao.teams' && (
                        <TeamDashboard 
                            teams={appData.teams}
                            teamMembers={appData.teamMembers}
                            collaborators={appData.collaborators}
                            tickets={appData.tickets}
                            equipmentTypes={appData.equipmentTypes}
                            onEdit={checkPermission('organization', 'edit') ? (t) => { setTeamToEdit(t); setShowAddTeamModal(true); } : undefined}
                            onDelete={checkPermission('organization', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteTeam(id); refreshData(); } } : undefined}
                            onCreate={checkPermission('organization', 'create') ? () => { setTeamToEdit(null); setShowAddTeamModal(true); } : undefined}
                            onManageMembers={checkPermission('organization', 'edit') ? (t) => { setTeamToManage(t); setShowManageTeamMembersModal(true); } : undefined}
                            onToggleStatus={checkPermission('organization', 'edit') ? async (id) => {
                                const t = appData.teams.find(team => team.id === id);
                                if (t) { await dataService.updateTeam(id, { is_active: t.is_active === false }); refreshData(); }
                            } : undefined}
                        />
                    )}

                    {activeTab === 'organizacao.suppliers' && (
                        <SupplierDashboard 
                            suppliers={appData.suppliers}
                            businessServices={appData.businessServices}
                            onEdit={checkPermission('suppliers', 'edit') ? (s) => { setSupplierToEdit(s); setShowAddSupplierModal(true); } : undefined}
                            onDelete={checkPermission('suppliers', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteSupplier(id); refreshData(); } } : undefined}
                            onCreate={checkPermission('suppliers', 'create') ? () => { setSupplierToEdit(null); setShowAddSupplierModal(true); } : undefined}
                            onToggleStatus={checkPermission('suppliers', 'edit') ? async (id) => {
                                const s = appData.suppliers.find(sup => sup.id === id);
                                if (s) { await dataService.updateSupplier(id, { is_active: s.is_active === false }); refreshData(); }
                            } : undefined}
                        />
                    )}

                    {activeTab === 'tickets.list' && (
                        <TicketDashboard 
                            tickets={appData.tickets}
                            escolasDepartamentos={appData.entidades}
                            collaborators={appData.collaborators}
                            teams={appData.teams}
                            equipment={appData.equipment}
                            equipmentTypes={appData.equipmentTypes}
                            categories={appData.ticketCategories}
                            initialFilter={dashboardFilter}
                            onClearInitialFilter={() => setDashboardFilter(null)}
                            onEdit={checkPermission('tickets', 'edit') ? (t) => { setTicketToEdit(t); setShowAddTicketModal(true); } : undefined}
                            onCreate={checkPermission('tickets', 'create') ? () => { setTicketToEdit(null); setShowAddTicketModal(true); } : undefined}
                            onOpenCloseTicketModal={checkPermission('tickets', 'edit') ? (t) => { setTicketToClose(t); setShowCloseTicketModal(true); } : undefined}
                            onUpdateTicket={checkPermission('tickets', 'edit') ? async (t) => { await dataService.updateTicket(t.id, t); refreshData(); } : undefined}
                            onGenerateReport={checkPermission('reports', 'view') ? () => { setReportType('ticket'); setShowReportModal(true); } : undefined}
                            onOpenActivities={(t) => { setTicketForActivities(t); setShowTicketActivitiesModal(true); }}
                            onGenerateSecurityReport={(t) => { 
                                setTicketToEdit(t);
                                setShowAddTicketModal(true);
                            }}
                        />
                    )}

                    {activeTab === 'nis2.bia' && (
                        <ServiceDashboard 
                            services={appData.businessServices}
                            dependencies={appData.serviceDependencies}
                            collaborators={appData.collaborators}
                            onEdit={checkPermission('compliance', 'edit') ? (s) => { setServiceToEdit(s); setShowAddServiceModal(true); } : undefined}
                            onDelete={checkPermission('compliance', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteBusinessService(id); refreshData(); } } : undefined}
                            onCreate={checkPermission('compliance', 'create') ? () => { setServiceToEdit(null); setShowAddServiceModal(true); } : undefined}
                            onManageDependencies={checkPermission('compliance', 'edit') ? (s) => { setServiceForDependencies(s); setShowServiceDependencyModal(true); } : undefined}
                            onGenerateReport={() => { setReportType('bia'); setShowReportModal(true); }}
                        />
                    )}

                    {activeTab === 'nis2.security' && (
                        <VulnerabilityDashboard 
                            vulnerabilities={appData.vulnerabilities}
                            onEdit={checkPermission('compliance', 'edit') ? (v) => { setVulnerabilityToEdit(v); setShowAddVulnerabilityModal(true); } : undefined}
                            onDelete={checkPermission('compliance', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteVulnerability(id); refreshData(); } } : undefined}
                            onCreate={checkPermission('compliance', 'create') ? () => { setVulnerabilityToEdit(null); setShowAddVulnerabilityModal(true); } : undefined}
                            initialFilter={dashboardFilter}
                            onClearInitialFilter={() => setDashboardFilter(null)}
                            onCreateTicket={(vuln) => {
                                setTicketToEdit({
                                    title: `Vulnerabilidade: ${vuln.cve_id}`,
                                    description: `Correção necessária para vulnerabilidade ${vuln.cve_id}.\nAfeta: ${vuln.affected_software}\n\nDetalhes: ${vuln.description}`,
                                    category: 'Incidente de Segurança',
                                    securityIncidentType: 'Exploração de Vulnerabilidade',
                                    impactCriticality: vuln.severity,
                                } as any);
                                setShowAddTicketModal(true);
                            }}
                        />
                    )}

                    {activeTab === 'nis2.backups' && (
                        <BackupDashboard 
                            backups={appData.backupExecutions}
                            collaborators={appData.collaborators}
                            equipment={appData.equipment}
                            onEdit={checkPermission('compliance', 'edit') ? (b) => { setBackupToEdit(b); setShowAddBackupModal(true); } : undefined}
                            onDelete={checkPermission('compliance', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteBackupExecution(id); refreshData(); } } : undefined}
                            onCreate={checkPermission('compliance', 'create') ? () => { setBackupToEdit(null); setShowAddBackupModal(true); } : undefined}
                        />
                    )}

                    {activeTab === 'nis2.resilience' && (
                        <ResilienceDashboard 
                            resilienceTests={appData.resilienceTests}
                            onEdit={checkPermission('compliance', 'edit') ? (t) => { setTestToEdit(t); setShowAddResilienceTestModal(true); } : undefined}
                            onDelete={checkPermission('compliance', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteResilienceTest(id); refreshData(); } } : undefined}
                            onCreate={checkPermission('compliance', 'create') ? () => { setTestToEdit(null); setShowAddResilienceTestModal(true); } : undefined}
                            onCreateTicket={(ticketData) => {
                                setTicketToEdit(ticketData as any);
                                setShowAddTicketModal(true);
                            }}
                        />
                    )}

                    {activeTab === 'reports' && (
                        <ReportsDashboard 
                            equipment={appData.equipment}
                            assignments={appData.assignments}
                            collaborators={appData.collaborators}
                            entidades={appData.entidades}
                            brands={appData.brands}
                            equipmentTypes={appData.equipmentTypes}
                        />
                    )}

                    {activeTab === 'tools.agenda' && (
                        <AgendaDashboard />
                    )}

                    {activeTab === 'tools.map' && (
                        <MapDashboard 
                            instituicoes={appData.instituicoes}
                            entidades={appData.entidades}
                            suppliers={appData.suppliers}
                            equipment={appData.equipment}
                            assignments={appData.assignments}
                        />
                    )}

                    {activeTab === 'settings' && (
                         <AuxiliaryDataDashboard 
                            configTables={[
                                { tableName: 'config_equipment_statuses', label: 'Estados de Equipamento', data: appData.configEquipmentStatuses },
                                { tableName: 'contact_roles', label: 'Funções de Contacto', data: appData.contactRoles },
                                { tableName: 'contact_titles', label: 'Tratos (Honoríficos)', data: appData.contactTitles },
                                { tableName: 'config_criticality_levels', label: 'Níveis de Criticidade', data: appData.configCriticalityLevels },
                                { tableName: 'config_cia_ratings', label: 'Classificação CIA', data: appData.configCiaRatings },
                                { tableName: 'config_service_statuses', label: 'Estados de Serviço (BIA)', data: appData.configServiceStatuses },
                                { tableName: 'config_backup_types', label: 'Tipos de Backup', data: appData.configBackupTypes },
                                { tableName: 'config_training_types', label: 'Tipos de Formação', data: appData.configTrainingTypes },
                                { tableName: 'config_resilience_test_types', label: 'Tipos de Teste Resiliência', data: appData.configResilienceTestTypes },
                                { tableName: 'config_software_categories', label: 'Categorias de Software', data: appData.softwareCategories }
                            ]}
                            onRefresh={refreshData}
                            brands={appData.brands} equipment={appData.equipment} onEditBrand={async (b) => { setBrandToEdit(b); setShowAddBrandModal(true); }} onDeleteBrand={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteBrand(id); refreshData(); } }} onCreateBrand={() => { setBrandToEdit(null); setShowAddBrandModal(true); }}
                            equipmentTypes={appData.equipmentTypes} onEditType={async (t) => { setTypeToEdit(t); setShowAddTypeModal(true); }} onDeleteType={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteEquipmentType(id); refreshData(); } }} onCreateType={() => { setTypeToEdit(null); setShowAddTypeModal(true); }}
                            ticketCategories={appData.ticketCategories} tickets={appData.tickets} teams={appData.teams} onEditCategory={async (c) => { setCategoryToEdit(c); setShowAddCategoryModal(true); }} onDeleteCategory={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteTicketCategory(id); refreshData(); } }} onToggleCategoryStatus={async (id) => { const cat = appData.ticketCategories.find(c => c.id === id); if (cat) { await dataService.updateTicketCategory(id, { is_active: !cat.is_active }); refreshData(); } }} onCreateCategory={() => { setCategoryToEdit(null); setShowAddCategoryModal(true); }}
                            securityIncidentTypes={appData.securityIncidentTypes} onEditIncidentType={async (t) => { setIncidentTypeToEdit(t); setShowAddIncidentTypeModal(true); }} onDeleteIncidentType={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteSecurityIncidentType(id); refreshData(); } }} onToggleIncidentTypeStatus={async (id) => { const t = appData.securityIncidentTypes.find(i => i.id === id); if (t) { await dataService.updateSecurityIncidentType(id, { is_active: !t.is_active }); refreshData(); } }} onCreateIncidentType={() => { setIncidentTypeToEdit(null); setShowAddIncidentTypeModal(true); }}
                            collaborators={appData.collaborators} softwareLicenses={appData.softwareLicenses} businessServices={appData.businessServices} backupExecutions={appData.backupExecutions} securityTrainings={appData.securityTrainings} resilienceTests={appData.resilienceTests} suppliers={appData.suppliers} entidades={appData.entidades} instituicoes={appData.instituicoes} vulnerabilities={appData.vulnerabilities}
                        />
                    )}
                </div>
            </main>

            {/* ... Modals ... */}
            {/* -- Organization Modals -- */}
            {showAddBrandModal && (
                <AddBrandModal
                    onClose={() => setShowAddBrandModal(false)}
                    onSave={async (brand) => {
                        if (brandToEdit) await dataService.updateBrand(brandToEdit.id, brand);
                        else await dataService.addBrand(brand);
                        refreshData();
                    }}
                    brandToEdit={brandToEdit}
                    existingBrands={appData.brands}
                />
            )}
            {showAddTypeModal && (
                <AddEquipmentTypeModal
                    onClose={() => setShowAddTypeModal(false)}
                    onSave={async (type) => {
                        if (typeToEdit) await dataService.updateEquipmentType(typeToEdit.id, type);
                        else await dataService.addEquipmentType(type);
                        refreshData();
                    }}
                    typeToEdit={typeToEdit}
                    teams={appData.teams}
                    existingTypes={appData.equipmentTypes}
                />
            )}
            {showAddInstituicaoModal && (
                <AddInstituicaoModal
                    onClose={() => setShowAddInstituicaoModal(false)}
                    onSave={async (inst) => {
                        if (instituicaoToEdit) await dataService.updateInstituicao(instituicaoToEdit.id, inst);
                        else await dataService.addInstituicao(inst);
                        refreshData();
                        return { id: 'temp', ...inst };
                    }}
                    instituicaoToEdit={instituicaoToEdit}
                />
            )}
            {showAddEntidadeModal && (
                <AddEntidadeModal
                    onClose={() => setShowAddEntidadeModal(false)}
                    onSave={async (ent) => {
                        if (entidadeToEdit && entidadeToEdit.id) await dataService.updateEntidade(entidadeToEdit.id, ent);
                        else await dataService.addEntidade(ent);
                        refreshData();
                        return { id: 'temp', ...ent };
                    }}
                    entidadeToEdit={entidadeToEdit}
                    instituicoes={appData.instituicoes}
                />
            )}
            {showAddCollaboratorModal && (
                <AddCollaboratorModal
                    onClose={() => setShowAddCollaboratorModal(false)}
                    onSave={async (col, pass) => {
                        if (collaboratorToEdit) await dataService.updateCollaborator(collaboratorToEdit.id, col);
                        else {
                            const newCol = await dataService.addCollaborator(col, pass);
                            if (pass && newCol) setNewCredentials({ email: newCol.email, password: pass });
                            if (newCol) setShowCredentialsModal(true);
                        }
                        refreshData();
                        return true;
                    }}
                    collaboratorToEdit={collaboratorToEdit}
                    escolasDepartamentos={appData.entidades}
                    instituicoes={appData.instituicoes}
                    currentUser={currentUser}
                    roleOptions={appData.customRoles.map(r => ({ id: r.id, name: r.name }))}
                    titleOptions={appData.contactTitles.map(t => ({ id: t.id, name: t.name }))}
                />
            )}
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

            {/* -- Ticket Modals -- */}
            {showAddTicketModal && (
                <AddTicketModal
                    onClose={() => setShowAddTicketModal(false)}
                    onSave={async (ticket) => {
                        if (ticketToEdit) await dataService.updateTicket(ticketToEdit.id, ticket);
                        else await dataService.addTicket(ticket);
                        refreshData();
                    }}
                    ticketToEdit={ticketToEdit}
                    escolasDepartamentos={appData.entidades}
                    collaborators={appData.collaborators}
                    teams={appData.teams}
                    currentUser={currentUser}
                    userPermissions={{ viewScope: 'all' }}
                    equipment={appData.equipment}
                    equipmentTypes={appData.equipmentTypes}
                    assignments={appData.assignments}
                    categories={appData.ticketCategories}
                    securityIncidentTypes={appData.securityIncidentTypes}
                    pastTickets={appData.tickets}
                />
            )}
            {showCloseTicketModal && ticketToClose && (
                <CloseTicketModal
                    ticket={ticketToClose}
                    collaborators={appData.collaborators}
                    onClose={() => setShowCloseTicketModal(false)}
                    onConfirm={async (techId, resolution) => {
                        await dataService.updateTicket(ticketToClose.id, { 
                            status: 'Finalizado', 
                            finishDate: new Date().toISOString().split('T')[0], 
                            technicianId: techId,
                            resolution_summary: resolution 
                        });
                        refreshData();
                        setShowCloseTicketModal(false);
                    }}
                    activities={appData.ticketActivities.filter(a => a.ticketId === ticketToClose.id)}
                />
            )}
            {showTicketActivitiesModal && ticketForActivities && (
                <TicketActivitiesModal
                    ticket={ticketForActivities}
                    activities={appData.ticketActivities.filter(a => a.ticketId === ticketForActivities.id)}
                    collaborators={appData.collaborators}
                    currentUser={currentUser}
                    equipment={appData.equipment}
                    equipmentTypes={appData.equipmentTypes}
                    entidades={appData.entidades}
                    assignments={appData.assignments}
                    onClose={() => setShowTicketActivitiesModal(false)}
                    onAddActivity={async (activity) => {
                        await dataService.addTicketActivity({
                            ...activity,
                            ticketId: ticketForActivities.id,
                            technicianId: currentUser?.id || '',
                            date: new Date().toISOString()
                        });
                        refreshData();
                    }}
                />
            )}
            {showAddCategoryModal && (
                <AddCategoryModal
                    onClose={() => setShowAddCategoryModal(false)}
                    onSave={async (cat) => {
                        if (categoryToEdit) await dataService.updateTicketCategory(categoryToEdit.id, cat);
                        else await dataService.addTicketCategory(cat);
                        refreshData();
                    }}
                    categoryToEdit={categoryToEdit}
                    teams={appData.teams}
                />
            )}
            {showAddIncidentTypeModal && (
                <AddSecurityIncidentTypeModal
                    onClose={() => setShowAddIncidentTypeModal(false)}
                    onSave={async (type) => {
                        if (incidentTypeToEdit) await dataService.updateSecurityIncidentType(incidentTypeToEdit.id, type);
                        else await dataService.addSecurityIncidentType(type);
                        refreshData();
                    }}
                    typeToEdit={incidentTypeToEdit}
                />
            )}

            {/* -- Compliance Modals -- */}
            {showAddServiceModal && (
                <AddServiceModal 
                    onClose={() => setShowAddServiceModal(false)}
                    onSave={async (svc) => {
                        if (serviceToEdit) await dataService.updateBusinessService(serviceToEdit.id, svc);
                        else await dataService.addBusinessService(svc);
                        refreshData();
                    }}
                    serviceToEdit={serviceToEdit}
                    collaborators={appData.collaborators}
                    suppliers={appData.suppliers}
                />
            )}
            {showServiceDependencyModal && serviceForDependencies && (
                <ServiceDependencyModal 
                    onClose={() => setShowServiceDependencyModal(false)}
                    service={serviceForDependencies}
                    dependencies={appData.serviceDependencies.filter(d => d.service_id === serviceForDependencies.id)}
                    allEquipment={appData.equipment}
                    allLicenses={appData.softwareLicenses}
                    onAddDependency={async (dep) => { await dataService.addServiceDependency(dep); refreshData(); }}
                    onRemoveDependency={async (id) => { await dataService.deleteServiceDependency(id); refreshData(); }}
                />
            )}
            {showAddVulnerabilityModal && (
                <AddVulnerabilityModal 
                    onClose={() => setShowAddVulnerabilityModal(false)}
                    onSave={async (vuln) => {
                        if (vulnerabilityToEdit) await dataService.updateVulnerability(vulnerabilityToEdit.id, vuln);
                        else await dataService.addVulnerability(vuln);
                        refreshData();
                    }}
                    vulnToEdit={vulnerabilityToEdit}
                />
            )}
            {showAddBackupModal && (
                <AddBackupModal 
                    onClose={() => setShowAddBackupModal(false)}
                    onSave={async (backup) => {
                        if (backupToEdit) await dataService.updateBackupExecution(backupToEdit.id, backup);
                        else await dataService.addBackupExecution(backup);
                        refreshData();
                    }}
                    backupToEdit={backupToEdit}
                    currentUser={currentUser}
                    equipmentList={appData.equipment}
                    equipmentTypes={appData.equipmentTypes}
                    onCreateTicket={async (ticket) => { await dataService.addTicket(ticket); refreshData(); }}
                />
            )}
            {showAddResilienceTestModal && (
                <AddResilienceTestModal 
                    onClose={() => setShowAddResilienceTestModal(false)}
                    onSave={async (test) => {
                        if (testToEdit) await dataService.updateResilienceTest(testToEdit.id, test);
                        else await dataService.addResilienceTest(test);
                        refreshData();
                    }}
                    testToEdit={testToEdit}
                    onCreateTicket={async (ticket) => { await dataService.addTicket(ticket); refreshData(); }}
                    entidades={appData.entidades}
                    suppliers={appData.suppliers}
                />
            )}
            {showAddSupplierModal && (
                <AddSupplierModal 
                    onClose={() => setShowAddSupplierModal(false)}
                    onSave={async (sup) => {
                        if (supplierToEdit) await dataService.updateSupplier(supplierToEdit.id, sup);
                        else await dataService.addSupplier(sup);
                        refreshData();
                    }}
                    supplierToEdit={supplierToEdit}
                    teams={appData.teams}
                    businessServices={appData.businessServices}
                    onCreateTicket={async (ticket) => { await dataService.addTicket(ticket); refreshData(); }}
                />
            )}

            {/* -- Global/Utility Modals -- */}
            {showImportModal && importConfig && (
                <ImportModal 
                    config={importConfig} 
                    onClose={() => setShowImportModal(false)} 
                    onImport={async (type, data) => {
                        try {
                            if (type === 'instituicoes') {
                                // Bulk create logic would go here
                                // Currently simplified
                                alert('Importação de instituições não implementada em lote nesta versão de demonstração.');
                            }
                            else if (type === 'entidades') {
                                 alert('Importação de entidades não implementada em lote nesta versão de demonstração.');
                            }
                            refreshData();
                            return { success: true, message: `Importação processada.` };
                        } catch (e: any) {
                            return { success: false, message: e.message };
                        }
                    }} 
                />
            )}
            {showReportModal && (
                <ReportModal 
                    type={reportType} 
                    onClose={() => setShowReportModal(false)}
                    equipment={appData.equipment}
                    brandMap={new Map(appData.brands.map(b => [b.id, b.name]))}
                    equipmentTypeMap={new Map(appData.equipmentTypes.map(t => [t.id, t.name]))}
                    instituicoes={appData.instituicoes}
                    escolasDepartamentos={appData.entidades}
                    collaborators={appData.collaborators}
                    assignments={appData.assignments}
                    tickets={appData.tickets}
                    softwareLicenses={appData.softwareLicenses}
                    licenseAssignments={appData.licenseAssignments}
                    businessServices={appData.businessServices}
                    serviceDependencies={appData.serviceDependencies}
                />
            )}
            {showCollaboratorHistoryModal && historyCollaborator && (
                <CollaboratorHistoryModal 
                    collaborator={historyCollaborator} 
                    history={appData.collaboratorHistory} 
                    escolasDepartamentos={appData.entidades} 
                    onClose={() => setShowCollaboratorHistoryModal(false)} 
                />
            )}
            {showCollaboratorDetailModal && detailCollaborator && (
                <CollaboratorDetailModal
                    collaborator={detailCollaborator}
                    assignments={appData.assignments}
                    equipment={appData.equipment}
                    tickets={appData.tickets}
                    brandMap={new Map(appData.brands.map(b => [b.id, b.name]))}
                    equipmentTypeMap={new Map(appData.equipmentTypes.map(t => [t.id, t.name]))}
                    onClose={() => setShowCollaboratorDetailModal(false)}
                    onShowHistory={(c) => { setShowCollaboratorDetailModal(false); setHistoryCollaborator(c); setShowCollaboratorHistoryModal(true); }}
                    onStartChat={(c) => { setActiveChatCollaboratorId(c.id); setShowChatWidget(true); }}
                    onEdit={(c) => { setCollaboratorToEdit(c); setShowAddCollaboratorModal(true); }}
                />
            )}
            {showUserManualModal && <UserManualModal onClose={() => setShowUserManualModal(false)} />}
            {showCalendarModal && (
                <CalendarModal 
                    onClose={() => setShowCalendarModal(false)}
                    tickets={appData.tickets}
                    currentUser={currentUser}
                    teams={appData.teams}
                    teamMembers={appData.teamMembers}
                    collaborators={appData.collaborators}
                    onViewTicket={(t) => {
                        setTicketToEdit(t);
                        setShowAddTicketModal(true);
                    }}
                />
            )}
            {showCredentialsModal && newCredentials && (
                <CredentialsModal 
                    onClose={() => setShowCredentialsModal(false)} 
                    email={newCredentials.email} 
                    password={newCredentials.password} 
                />
            )}
            {showNotificationsModal && (
                <NotificationsModal 
                    onClose={() => setShowNotificationsModal(false)}
                    expiringWarranties={[]} // TODO: Add filter logic
                    expiringLicenses={[]} // TODO: Add filter logic
                    teamTickets={appData.tickets.filter(t => t.status === 'Pedido')} // Basic filter
                    collaborators={appData.collaborators}
                    teams={appData.teams}
                    onViewItem={handleViewItem}
                    onSnooze={dataService.snoozeNotification}
                    currentUser={currentUser}
                    licenseAssignments={appData.licenseAssignments}
                />
            )}

            <ChatWidget 
                currentUser={currentUser}
                collaborators={appData.collaborators}
                messages={appData.messages}
                onSendMessage={async (rxId, content) => {
                    await dataService.addMessage({
                        senderId: currentUser.id,
                        receiverId: rxId,
                        content,
                        timestamp: new Date().toISOString(),
                        read: false
                    });
                    refreshData();
                }}
                onMarkMessagesAsRead={(senderId) => dataService.markMessagesAsRead(senderId)}
                isOpen={showChatWidget}
                onToggle={() => setShowChatWidget(!showChatWidget)}
                activeChatCollaboratorId={activeChatCollaboratorId}
                onSelectConversation={setActiveChatCollaboratorId}
                unreadMessagesCount={appData.messages.filter(m => m.receiverId === currentUser.id && !m.read).length}
            />
            
            {isConfigured && (
                <MagicCommandBar 
                    brands={appData.brands}
                    types={appData.equipmentTypes}
                    collaborators={appData.collaborators}
                    currentUser={currentUser}
                    onAction={async (intent, data) => {
                        if (intent === 'create_equipment') {
                            // This intention is tricky now as Modal is inside InventoryManager
                            // For now, we redirect to Inventory tab and open modal via URL hash or state
                            // A better solution requires a Global Modal Context
                            setActiveTab('equipment.inventory');
                            alert("Por favor, clique em 'Adicionar' no menu de Inventário.");
                        } else if (intent === 'create_ticket') {
                            setTicketToEdit({
                                ...data,
                                status: 'Pedido',
                                requestDate: new Date().toISOString()
                            } as any);
                            setShowAddTicketModal(true);
                        } else if (intent === 'search') {
                            setDashboardFilter({ serialNumber: data.query });
                            setActiveTab('equipment.inventory');
                        }
                    }}
                />
            )}
        </div>
    );
};