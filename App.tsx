
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
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import ConfigurationSetup from './components/ConfigurationSetup';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import { useLayout } from './contexts/LayoutContext';
import { getSupabase } from './services/supabaseClient';

// Dashboards
import OverviewDashboard from './components/OverviewDashboard';
import SmartDashboard from './components/SmartDashboard';
import EquipmentDashboard from './components/EquipmentDashboard';
import LicenseDashboard from './components/LicenseDashboard';
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

// Modals
import AddEquipmentModal from './components/AddEquipmentModal';
import AddEquipmentKitModal from './components/AddEquipmentKitModal';
import AssignEquipmentModal from './components/AssignEquipmentModal';
import AssignMultipleEquipmentModal from './components/AssignMultipleEquipmentModal';
import AddBrandModal from './components/AddBrandModal';
import AddEquipmentTypeModal from './components/AddEquipmentTypeModal';
import AddInstituicaoModal from './components/AddInstituicaoModal';
import AddEntidadeModal from './components/AddEntidadeModal';
import AddCollaboratorModal from './components/AddCollaboratorModal';
import AddTeamModal from './components/AddTeamModal';
import ManageTeamMembersModal from './components/ManageTeamMembersModal';
import AddLicenseModal from './components/AddLicenseModal';
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
import EquipmentDetailModal from './components/EquipmentDetailModal';
import UserManualModal from './components/UserManualModal';
import CalendarModal from './components/CalendarModal';
import MagicCommandBar from './components/MagicCommandBar';
import { ChatWidget } from './components/ChatWidget';
import CredentialsModal from './components/CredentialsModal';
import NotificationsModal from './components/NotificationsModal';

// --- Initial State ---
const initialConfigState: ConfigItem[] = [];

export const App: React.FC = () => {
    // --- Authentication & Setup State ---
    const [isConfigured, setIsConfigured] = useState(false);
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const { layoutMode } = useLayout();
    
    // --- Data State ---
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [entidades, setEntidades] = useState<Entidade[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [ticketActivities, setTicketActivities] = useState<TicketActivity[]>([]);
    const [softwareLicenses, setSoftwareLicenses] = useState<SoftwareLicense[]>([]);
    const [licenseAssignments, setLicenseAssignments] = useState<LicenseAssignment[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [collaboratorHistory, setCollaboratorHistory] = useState<CollaboratorHistory[]>([]);
    const [ticketCategories, setTicketCategories] = useState<TicketCategoryItem[]>([]);
    const [securityIncidentTypes, setSecurityIncidentTypes] = useState<SecurityIncidentTypeItem[]>([]);
    const [businessServices, setBusinessServices] = useState<BusinessService[]>([]);
    const [serviceDependencies, setServiceDependencies] = useState<ServiceDependency[]>([]);
    const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [backupExecutions, setBackupExecutions] = useState<BackupExecution[]>([]);
    const [resilienceTests, setResilienceTests] = useState<ResilienceTest[]>([]);
    const [securityTrainings, setSecurityTrainings] = useState<SecurityTrainingRecord[]>([]);
    const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
    const [softwareCategories, setSoftwareCategories] = useState<ConfigItem[]>([]);
    
    // Generic Config State (Statuses, etc)
    const [configEquipmentStatuses, setConfigEquipmentStatuses] = useState<ConfigItem[]>([]);
    const [contactRoles, setContactRoles] = useState<ConfigItem[]>([]);
    const [contactTitles, setContactTitles] = useState<ConfigItem[]>([]);

    // --- Modal State ---
    const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
    const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
    const [showKitModal, setShowKitModal] = useState(false);
    const [kitInitialData, setKitInitialData] = useState<Partial<Equipment> | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [equipmentToAssign, setEquipmentToAssign] = useState<Equipment | null>(null);
    const [showAssignMultipleModal, setShowAssignMultipleModal] = useState(false);
    const [equipmentListToAssign, setEquipmentListToAssign] = useState<Equipment[]>([]);
    
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

    const [showAddLicenseModal, setShowAddLicenseModal] = useState(false);
    const [licenseToEdit, setLicenseToEdit] = useState<SoftwareLicense | null>(null);

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

    // Detail Modals
    const [showEquipmentDetailModal, setShowEquipmentDetailModal] = useState(false);
    const [detailEquipment, setDetailEquipment] = useState<Equipment | null>(null);

    const [dashboardFilter, setDashboardFilter] = useState<any>(null);

    // --- Permission Logic (RBAC) ---
    const checkPermission = (module: ModuleKey, action: PermissionAction): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === UserRole.SuperAdmin) return true;
        
        const role = customRoles.find(r => r.name === currentUser.role);
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

    // --- Data Loading ---
    const loadData = async () => {
        try {
            const data = await dataService.fetchAllData();
            setEquipment(data.equipment);
            setBrands(data.brands);
            setEquipmentTypes(data.equipmentTypes);
            setInstituicoes(data.instituicoes);
            setEntidades(data.entidades);
            setCollaborators(data.collaborators);
            setAssignments(data.assignments);
            setTickets(data.tickets);
            setTicketActivities(data.ticketActivities);
            setSoftwareLicenses(data.softwareLicenses);
            setLicenseAssignments(data.licenseAssignments);
            setTeams(data.teams);
            setTeamMembers(data.teamMembers);
            setMessages(data.messages);
            setCollaboratorHistory(data.collaboratorHistory);
            setTicketCategories(data.ticketCategories);
            setSecurityIncidentTypes(data.securityIncidentTypes);
            setBusinessServices(data.businessServices);
            setServiceDependencies(data.serviceDependencies);
            setVulnerabilities(data.vulnerabilities);
            setSuppliers(data.suppliers);
            setBackupExecutions(data.backupExecutions);
            setResilienceTests(data.resilienceTests);
            setSecurityTrainings(data.securityTrainings);
            setCustomRoles(data.configCustomRoles);
            setSoftwareCategories(data.configSoftwareCategories);
            
            setConfigEquipmentStatuses(data.configEquipmentStatuses);
            setContactRoles(data.contactRoles);
            setContactTitles(data.contactTitles);

        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        const checkConfig = () => {
             try {
                const supabaseUrl = localStorage.getItem('SUPABASE_URL') || process.env.SUPABASE_URL;
                const supabaseKey = localStorage.getItem('SUPABASE_ANON_KEY') || process.env.SUPABASE_ANON_KEY;
                if (supabaseUrl && supabaseKey) {
                    setIsConfigured(true);
                    const supabase = getSupabase();
                    supabase.auth.getSession().then(({ data: { session } }) => {
                         if (session) {
                             loadData().then(() => {
                                dataService.fetchAllData().then(d => {
                                    const user = d.collaborators.find((c: Collaborator) => c.email === session.user.email);
                                    if (user) setCurrentUser(user);
                                });
                             });
                         }
                    });
                    
                    supabase.auth.onAuthStateChange((event, session) => {
                        if (event === 'PASSWORD_RECOVERY') {
                            setResetSession(session);
                            setShowResetPasswordModal(true);
                        }
                    });
                } else {
                    setIsConfigured(false);
                }
            } catch (e) {
                setIsConfigured(false);
            }
        };
        checkConfig();
    }, []);

    useEffect(() => {
        if (isConfigured && currentUser) {
            loadData();
            const interval = setInterval(loadData, 30000);
            return () => clearInterval(interval);
        }
    }, [isConfigured, currentUser]);

    // --- Handlers ---
    const handleLogin = async (email: string, password: string) => {
        try {
            const supabase = getSupabase();
            const { data, error } = await (supabase.auth as any).signInWithPassword({ email, password });
            if (error) throw error;
            if (data.user) {
                await loadData();
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

    const handleSaveLicenses = async (eqId: string, licenseIds: string[]) => {
        await dataService.syncLicenseAssignments(eqId, licenseIds);
        loadData();
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
                    notificationCount={0} // Calculated in component but needed here
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
                    
                    {activeTab === 'overview' && <OverviewDashboard 
                        equipment={equipment} 
                        instituicoes={instituicoes}
                        entidades={entidades} 
                        assignments={assignments}
                        equipmentTypes={equipmentTypes}
                        tickets={tickets}
                        collaborators={collaborators}
                        teams={teams}
                        expiringWarranties={[]}
                        expiringLicenses={[]}
                        softwareLicenses={softwareLicenses}
                        licenseAssignments={licenseAssignments}
                        businessServices={businessServices}
                        vulnerabilities={vulnerabilities}
                        onViewItem={handleViewItem}
                        onGenerateComplianceReport={() => { setReportType('compliance'); setShowReportModal(true); }}
                    />}

                    {activeTab === 'equipment.inventory' && (
                        <EquipmentDashboard 
                            equipment={equipment} 
                            brands={brands} 
                            equipmentTypes={equipmentTypes}
                            brandMap={new Map(brands.map(b => [b.id, b.name]))}
                            equipmentTypeMap={new Map(equipmentTypes.map(t => [t.id, t.name]))}
                            assignedEquipmentIds={new Set(assignments.filter(a => !a.returnDate).map(a => a.equipmentId))}
                            assignments={assignments}
                            collaborators={collaborators}
                            entidades={entidades}
                            instituicoes={instituicoes}
                            initialFilter={dashboardFilter}
                            onClearInitialFilter={() => setDashboardFilter(null)}
                            onAssign={checkPermission('equipment', 'edit') ? (eq) => { setEquipmentToAssign(eq); setShowAssignModal(true); } : undefined}
                            onAssignMultiple={checkPermission('equipment', 'edit') ? (eqs) => { setEquipmentListToAssign(eqs); setShowAssignMultipleModal(true); } : undefined}
                            onUnassign={checkPermission('equipment', 'edit') ? async (id) => {
                                await dataService.addAssignment({ equipmentId: id, returnDate: new Date().toISOString().split('T')[0] }); // Pass returnDate to trigger unassign logic
                                loadData();
                            } : undefined}
                            onUpdateStatus={checkPermission('equipment', 'edit') ? async (id, status) => {
                                await dataService.updateEquipment(id, { status });
                                loadData();
                            } : undefined}
                            onShowHistory={(eq) => { setDetailEquipment(eq); }} 
                            onEdit={checkPermission('equipment', 'edit') ? (eq) => { setEquipmentToEdit(eq); setShowAddEquipmentModal(true); } : undefined}
                            onCreate={checkPermission('equipment', 'create') ? () => { setEquipmentToEdit(null); setShowAddEquipmentModal(true); } : undefined}
                            onGenerateReport={checkPermission('reports', 'view') ? () => { setReportType('equipment'); setShowReportModal(true); } : undefined}
                            onManageKeys={checkPermission('licensing', 'edit') ? (eq) => { setDetailEquipment(eq); } : undefined}
                            businessServices={businessServices}
                            serviceDependencies={serviceDependencies}
                            tickets={tickets}
                            ticketActivities={ticketActivities}
                            softwareLicenses={softwareLicenses}
                            licenseAssignments={licenseAssignments}
                            vulnerabilities={vulnerabilities}
                            suppliers={suppliers}
                            tooltipConfig={userTooltipConfig}
                        />
                    )}

                    {/* ... Other Dashboards ... */}
                    {activeTab === 'reports' && (
                        <ReportsDashboard 
                            equipment={equipment}
                            assignments={assignments}
                            collaborators={collaborators}
                            entidades={entidades}
                            brands={brands}
                            equipmentTypes={equipmentTypes}
                        />
                    )}

                    {activeTab === 'settings' && (
                         <AuxiliaryDataDashboard 
                            configTables={[
                                { tableName: 'config_equipment_statuses', label: 'Estados de Equipamento', data: configEquipmentStatuses },
                                { tableName: 'contact_roles', label: 'Funções de Contacto', data: contactRoles },
                                { tableName: 'contact_titles', label: 'Tratos (Honoríficos)', data: contactTitles },
                            ]}
                            onRefresh={loadData}
                            brands={brands} equipment={equipment} onEditBrand={async (b) => { setBrandToEdit(b); setShowAddBrandModal(true); }} onDeleteBrand={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteBrand(id); loadData(); } }} onCreateBrand={() => { setBrandToEdit(null); setShowAddBrandModal(true); }}
                            equipmentTypes={equipmentTypes} onEditType={async (t) => { setTypeToEdit(t); setShowAddTypeModal(true); }} onDeleteType={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteEquipmentType(id); loadData(); } }} onCreateType={() => { setTypeToEdit(null); setShowAddTypeModal(true); }}
                            ticketCategories={ticketCategories} tickets={tickets} teams={teams} onEditCategory={async (c) => { setCategoryToEdit(c); setShowAddCategoryModal(true); }} onDeleteCategory={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteTicketCategory(id); loadData(); } }} onToggleCategoryStatus={async (id) => { const cat = ticketCategories.find(c => c.id === id); if (cat) { await dataService.updateTicketCategory(id, { is_active: !cat.is_active }); loadData(); } }} onCreateCategory={() => { setCategoryToEdit(null); setShowAddCategoryModal(true); }}
                            securityIncidentTypes={securityIncidentTypes} onEditIncidentType={async (t) => { setIncidentTypeToEdit(t); setShowAddIncidentTypeModal(true); }} onDeleteIncidentType={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteSecurityIncidentType(id); loadData(); } }} onToggleIncidentTypeStatus={async (id) => { const t = securityIncidentTypes.find(i => i.id === id); if (t) { await dataService.updateSecurityIncidentType(id, { is_active: !t.is_active }); loadData(); } }} onCreateIncidentType={() => { setIncidentTypeToEdit(null); setShowAddIncidentTypeModal(true); }}
                            collaborators={collaborators} softwareLicenses={softwareLicenses} businessServices={businessServices} backupExecutions={backupExecutions} securityTrainings={securityTrainings} resilienceTests={resilienceTests} suppliers={suppliers} entidades={entidades} instituicoes={instituicoes} vulnerabilities={vulnerabilities}
                        />
                    )}
                </div>
            </main>

            {/* ... Modals ... */}
            {showAddEquipmentModal && (
                <AddEquipmentModal
                    onClose={() => setShowAddEquipmentModal(false)}
                    onSave={async (data, assignment, licenseIds) => {
                        let eqId;
                        if (equipmentToEdit) {
                            await dataService.updateEquipment(equipmentToEdit.id, data);
                            eqId = equipmentToEdit.id;
                        } else {
                            const res = await dataService.addEquipment(data);
                            eqId = res.id;
                        }
                        if (assignment) await dataService.addAssignment({ ...assignment, equipmentId: eqId });
                        if (licenseIds && licenseIds.length > 0) await dataService.syncLicenseAssignments(eqId, licenseIds);
                        loadData();
                    }}
                    brands={brands}
                    equipmentTypes={equipmentTypes}
                    equipmentToEdit={equipmentToEdit}
                    onSaveBrand={dataService.addBrand}
                    onSaveEquipmentType={dataService.addEquipmentType}
                    onOpenKitModal={(data) => { setKitInitialData(data); setShowAddEquipmentModal(false); setShowKitModal(true); }}
                    suppliers={suppliers}
                    softwareLicenses={softwareLicenses}
                    entidades={entidades}
                    collaborators={collaborators}
                    statusOptions={configEquipmentStatuses}
                    licenseAssignments={licenseAssignments}
                    onOpenHistory={(eq) => { setDetailEquipment(eq); setShowEquipmentDetailModal(true); }}
                    onManageLicenses={(eq) => { setDetailEquipment(eq); setShowEquipmentDetailModal(true); }} // Open detail modal directly
                    onOpenAssign={(eq) => { setEquipmentToAssign(eq); setShowAssignModal(true); }}
                />
            )}
            
            {showAssignModal && equipmentToAssign && (
                <AssignEquipmentModal
                    equipment={equipmentToAssign}
                    brandMap={new Map(brands.map(b => [b.id, b.name]))}
                    equipmentTypeMap={new Map(equipmentTypes.map(t => [t.id, t.name]))}
                    escolasDepartamentos={entidades}
                    instituicoes={instituicoes}
                    collaborators={collaborators}
                    onClose={() => setShowAssignModal(false)}
                    onAssign={async (assignment) => {
                        await dataService.addAssignment(assignment);
                        loadData();
                    }}
                />
            )}
            
            {detailEquipment && (
                 <EquipmentDetailModal 
                    equipment={detailEquipment}
                    assignments={assignments}
                    collaborators={collaborators}
                    escolasDepartamentos={entidades}
                    tickets={tickets}
                    ticketActivities={ticketActivities}
                    onClose={() => setDetailEquipment(null)}
                    onEdit={(eq) => { setDetailEquipment(null); setEquipmentToEdit(eq); setShowAddEquipmentModal(true); }}
                    businessServices={businessServices}
                    serviceDependencies={serviceDependencies}
                    softwareLicenses={softwareLicenses}
                    licenseAssignments={licenseAssignments}
                    vulnerabilities={vulnerabilities}
                    suppliers={suppliers}
                 />
            )}
            
            {/* ... Other modals (AddBrand, AddType, etc) follow standard pattern ... */}
        </div>
    );
};
