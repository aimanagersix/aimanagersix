
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Equipment, EquipmentStatus, EquipmentType, Brand, Assignment, Collaborator, Entidade, Instituicao, Ticket, TicketStatus,
  TicketActivity, CollaboratorHistory, Message, UserRole, CollaboratorStatus, SoftwareLicense, LicenseAssignment, Team, TeamMember,
  TicketCategoryItem, SecurityIncidentTypeItem, BusinessService, ServiceDependency, Vulnerability, CriticalityLevel, Supplier, BackupExecution, ResilienceTest, SecurityTrainingRecord,
  ConfigItem, ContactRole, ContactTitle, TooltipConfig, defaultTooltipConfig, SoftwareCategory, ModuleKey
} from './types';
import { useLanguage, LanguageProvider } from './contexts/LanguageContext';
import { useLayout, LayoutProvider } from './contexts/LayoutContext';
import * as dataService from './services/dataService';
import { getSupabase } from './services/supabaseClient';
import { ImportConfig } from './components/ImportModal';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ConfigurationSetup from './components/ConfigurationSetup';
import LoginPage from './components/LoginPage';
import OverviewDashboard from './components/OverviewDashboard';
import EquipmentDashboard from './components/EquipmentDashboard';
import LicenseDashboard from './components/LicenseDashboard';
import CollaboratorDashboard from './components/CollaboratorDashboard';
import SupplierDashboard from './components/SupplierDashboard';
import AuxiliaryDataDashboard from './components/AuxiliaryDataDashboard';
import AddCollaboratorModal from './components/AddCollaboratorModal';
import CollaboratorDetailModal from './components/CollaboratorDetailModal';
import AddEquipmentModal from './components/AddEquipmentModal';
import AssignEquipmentModal from './components/AssignEquipmentModal';
import AddEntidadeModal from './components/AddEntidadeModal';
import AddInstituicaoModal from './components/AddInstituicaoModal';
import ReportModal from './components/ReportModal';
import CloseTicketModal from './components/CloseTicketModal';
import AddTicketModal from './components/AddTicketModal';
import TicketActivitiesModal from './components/TicketActivitiesModal';
import AddEquipmentTypeModal from './components/AddEquipmentTypeModal';
import AddBrandModal from './components/AddBrandModal';
import ChatModal from './components/ChatModal';
import AddLicenseModal from './components/AddLicenseModal';
import ManageAssignedLicensesModal from './components/ManageAssignedLicensesModal';
import AddTeamModal from './components/AddTeamModal';
import ManageTeamMembersModal from './components/ManageTeamMembersModal';
import NotificationsModal from './components/NotificationsModal';
import ImportModal from './components/ImportModal';
import AddCategoryModal from './components/AddCategoryModal';
import AddSecurityIncidentTypeModal from './components/AddSecurityIncidentTypeModal';
import AddServiceModal from './components/AddServiceModal';
import ServiceDependencyModal from './components/ServiceDependencyModal';
import AddVulnerabilityModal from './components/AddVulnerabilityModal';
import AddEquipmentKitModal from './components/AddEquipmentKitModal';
import ConfirmationModal from './components/common/ConfirmationModal';
import EquipmentDetailModal from './components/EquipmentDetailModal';
import AddSupplierModal from './components/AddSupplierModal';
import AddBackupModal from './components/AddBackupModal';
import AutomationModal from './components/AutomationModal';
import AddResilienceTestModal from './components/AddResilienceTestModal';
import CalendarModal from './components/CalendarModal';
import UserManualModal from './components/UserManualModal';
import CollaboratorHistoryModal from './components/CollaboratorHistoryModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import MagicCommandBar from './components/MagicCommandBar';
import AgendaDashboard from './components/AgendaDashboard';
import MapDashboard from './components/MapDashboard';
import TeamDashboard from './components/TeamDashboard';
import TicketDashboard from './components/TicketDashboard';
import InstituicaoDashboard from './components/InstituicaoDashboard';
import EntidadeDashboard from './components/EntidadeDashboard';
import ResilienceDashboard from './components/ResilienceDashboard';
import BackupDashboard from './components/BackupDashboard';
import VulnerabilityDashboard from './components/VulnerabilityDashboard';
import ServiceDashboard from './components/ServiceDashboard';
import SmartDashboard from './components/SmartDashboard';
import ReportsDashboard from './components/ReportsDashboard'; // NEW

import { checkAndRunAutoScan } from './services/automationService';

type Session = any;

const InnerApp: React.FC = () => {
    const { t } = useLanguage();
    const { layoutMode } = useLayout();
    
    const getTabFromHash = () => {
        const hash = window.location.hash.replace('#', '');
        return hash || 'overview';
    };

    const [activeTab, setActiveTabState] = useState(getTabFromHash());
    const [initialFilter, setInitialFilter] = useState<any>(null);
    
    const setActiveTab = (tab: string) => {
        setActiveTabState(tab);
        window.location.hash = tab;
    };

    useEffect(() => {
        const handleHashChange = () => {
            const newTab = getTabFromHash();
            if (newTab !== activeTab) {
                setActiveTabState(newTab);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [activeTab]);
    
    const [sidebarExpanded, setSidebarExpanded] = useState(false);

    // Data States
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [entidades, setEntidades] = useState<Entidade[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [ticketActivities, setTicketActivities] = useState<TicketActivity[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [collaboratorHistory, setCollaboratorHistory] = useState<CollaboratorHistory[]>([]);
    const [softwareLicenses, setSoftwareLicenses] = useState<SoftwareLicense[]>([]);
    const [licenseAssignments, setLicenseAssignments] = useState<LicenseAssignment[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [ticketCategories, setTicketCategories] = useState<TicketCategoryItem[]>([]);
    const [securityIncidentTypes, setSecurityIncidentTypes] = useState<SecurityIncidentTypeItem[]>([]);
    const [businessServices, setBusinessServices] = useState<BusinessService[]>([]);
    const [serviceDependencies, setServiceDependencies] = useState<ServiceDependency[]>([]);
    const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [backupExecutions, setBackupExecutions] = useState<BackupExecution[]>([]);
    const [resilienceTests, setResilienceTests] = useState<ResilienceTest[]>([]);
    const [securityTrainings, setSecurityTrainings] = useState<SecurityTrainingRecord[]>([]);

    // Config States
    const [configEquipmentStatuses, setConfigEquipmentStatuses] = useState<ConfigItem[]>([]);
    const [configUserRoles, setConfigUserRoles] = useState<ConfigItem[]>([]);
    const [configCriticalityLevels, setConfigCriticalityLevels] = useState<ConfigItem[]>([]);
    const [configCiaRatings, setConfigCiaRatings] = useState<ConfigItem[]>([]);
    const [configServiceStatuses, setConfigServiceStatuses] = useState<ConfigItem[]>([]);
    const [configBackupTypes, setConfigBackupTypes] = useState<ConfigItem[]>([]);
    const [configTrainingTypes, setConfigTrainingTypes] = useState<ConfigItem[]>([]);
    const [configResilienceTestTypes, setConfigResilienceTestTypes] = useState<ConfigItem[]>([]);
    const [softwareCategories, setSoftwareCategories] = useState<SoftwareCategory[]>([]); 
    const [contactRoles, setContactRoles] = useState<ContactRole[]>([]);
    const [contactTitles, setContactTitles] = useState<ContactTitle[]>([]);
    
    const [tooltipConfig, setTooltipConfig] = useState<TooltipConfig>(defaultTooltipConfig);

    const [isConfigured, setIsConfigured] = useState(!!localStorage.getItem('SUPABASE_URL'));
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // ... modal states ...
    const [showAddEquipment, setShowAddEquipment] = useState(false);
    const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
    const [initialEquipmentData, setInitialEquipmentData] = useState<Partial<Equipment> | null>(null);
    const [showAssignEquipment, setShowAssignEquipment] = useState<Equipment | null>(null);
    const [showAddCollaborator, setShowAddCollaborator] = useState(false);
    const [collaboratorToEdit, setCollaboratorToEdit] = useState<Collaborator | null>(null);
    const [showAddEntidade, setShowAddEntidade] = useState(false);
    const [entidadeToEdit, setEntidadeToEdit] = useState<Entidade | null>(null);
    const [showAddInstituicao, setShowAddInstituicao] = useState(false);
    const [instituicaoToEdit, setInstituicaoToEdit] = useState<Instituicao | null>(null);
    const [showReport, setShowReport] = useState<{ type: 'equipment' | 'collaborator' | 'ticket' | 'licensing' | 'compliance' | 'bia', visible: boolean }>({ type: 'equipment', visible: false });
    const [historyCollaborator, setHistoryCollaborator] = useState<Collaborator | null>(null);
    const [detailCollaborator, setDetailCollaborator] = useState<Collaborator | null>(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [newCredentials, setNewCredentials] = useState<{email: string, password?: string} | null>(null);
    const [showAddTicket, setShowAddTicket] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
    const [initialTicketData, setInitialTicketData] = useState<Partial<Ticket> | null>(null);
    const [vulnIdForTicketCreation, setVulnIdForTicketCreation] = useState<string | null>(null);
    const [ticketActivitiesModal, setTicketActivitiesModal] = useState<Ticket | null>(null);
    const [showAddType, setShowAddType] = useState(false);
    const [typeToEdit, setTypeToEdit] = useState<EquipmentType | null>(null);
    const [showAddBrand, setShowAddBrand] = useState(false);
    const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
    const [activeChatCollaboratorId, setActiveChatCollaboratorId] = useState<string | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showAddLicense, setShowAddLicense] = useState(false);
    const [licenseToEdit, setLicenseToEdit] = useState<SoftwareLicense | null>(null);
    const [showManageLicenses, setShowManageLicenses] = useState<Equipment | null>(null);
    const [showAddTeam, setShowAddTeam] = useState(false);
    const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
    const [showManageTeamMembers, setShowManageTeamMembers] = useState<Team | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [importConfig, setImportConfig] = useState<ImportConfig | null>(null);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<TicketCategoryItem | null>(null);
    const [showAddIncidentType, setShowAddIncidentType] = useState(false);
    const [incidentTypeToEdit, setIncidentTypeToEdit] = useState<SecurityIncidentTypeItem | null>(null);
    const [showAddService, setShowAddService] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<BusinessService | null>(null);
    const [showServiceDependencies, setShowServiceDependencies] = useState<BusinessService | null>(null);
    const [showAddVulnerability, setShowAddVulnerability] = useState(false);
    const [vulnerabilityToEdit, setVulnerabilityToEdit] = useState<Vulnerability | null>(null);
    const [securityReportHtml, setSecurityReportHtml] = useState<string | null>(null);
    const [showAddKit, setShowAddKit] = useState(false);
    const [kitInitialData, setKitInitialData] = useState<Partial<Equipment> | null>(null);
    const [confirmationModal, setConfirmationModal] = useState<{ show: boolean, title: string, message: string, onConfirm: () => void } | null>(null);
    const [showCloseTicket, setShowCloseTicket] = useState<Ticket | null>(null);
    const [detailEquipment, setDetailEquipment] = useState<Equipment | null>(null);
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
    const [showAddBackup, setShowAddBackup] = useState(false);
    const [backupToEdit, setBackupToEdit] = useState<BackupExecution | null>(null);
    const [showAutomationModal, setShowAutomationModal] = useState(false);
    const [showAddResilienceTest, setShowAddResilienceTest] = useState(false);
    const [resilienceTestToEdit, setResilienceTestToEdit] = useState<ResilienceTest | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [showUserManual, setShowUserManual] = useState(false);

    // Maps
    const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const equipmentTypeMap = useMemo(() => new Map(equipmentTypes.map(t => [t.id, t.name])), [equipmentTypes]);
    const assignedEquipmentIds = useMemo(() => new Set(assignments.filter(a => !a.returnDate).map(a => a.equipmentId)), [assignments]);

    // Data Loading
    const refreshData = useCallback(async () => {
        if (!isConfigured) return;
        try {
            const data = await dataService.fetchAllData();
            setEquipment(data.equipment);
            setInstituicoes(data.instituicoes);
            setEntidades(data.entidades);
            setCollaborators(data.collaborators);
            setAssignments(data.assignments);
            setTickets(data.tickets);
            setTicketActivities(data.ticketActivities);
            setBrands(data.brands);
            setEquipmentTypes(data.equipmentTypes);
            setSoftwareLicenses(data.softwareLicenses);
            setLicenseAssignments(data.licenseAssignments);
            setTeams(data.teams);
            setTeamMembers(data.teamMembers);
            setMessages(data.messages);
            setCollaboratorHistory(data.collaboratorHistory);
            setTicketCategories(data.ticketCategories);
            setBusinessServices(data.businessServices);
            setServiceDependencies(data.serviceDependencies);
            setVulnerabilities(data.vulnerabilities);
            setSecurityIncidentTypes(data.securityIncidentTypes);
            setSuppliers(data.suppliers);
            setBackupExecutions(data.backupExecutions);
            setResilienceTests(data.resilienceTests);
            setSecurityTrainings(data.securityTrainings);
            
            // Configs
            setConfigEquipmentStatuses(data.configEquipmentStatuses);
            setConfigUserRoles(data.configUserRoles);
            setConfigCriticalityLevels(data.configCriticalityLevels);
            setConfigCiaRatings(data.configCiaRatings);
            setConfigServiceStatuses(data.configServiceStatuses);
            setConfigBackupTypes(data.configBackupTypes);
            setConfigTrainingTypes(data.configTrainingTypes);
            setConfigResilienceTestTypes(data.configResilienceTestTypes);
            setSoftwareCategories(data.configSoftwareCategories); 
            setContactRoles(data.contactRoles);
            setContactTitles(data.contactTitles);
            
            // Load Tooltip Config - Prioritize User Profile if available
            const tooltipSetting = await dataService.getGlobalSetting('tooltip_config');
            if (tooltipSetting && !currentUser?.preferences?.tooltipConfig) {
                try {
                    const parsedConfig = JSON.parse(tooltipSetting);
                    setTooltipConfig({ ...defaultTooltipConfig, ...parsedConfig });
                } catch (e) { console.error("Error parsing tooltip config", e); }
            }

        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    }, [isConfigured, currentUser?.preferences]);

    // Auth & Session
    useEffect(() => {
        if (!isConfigured) return;

        const supabase = getSupabase();
        (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
            setSession(session);
            if (session) loadUser(session.user.id);
            else setLoading(false);
            
            const hash = window.location.hash;
            if (hash && hash.includes('type=recovery')) {
                setShowResetPassword(true);
            }
        });

        const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
            setSession(session);
            if (session) loadUser(session.user.id);
            else {
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [isConfigured]);
    
    useEffect(() => {
        if (session) {
            refreshData();
            checkAndRunAutoScan();
            const interval = setInterval(refreshData, 30000); 
            return () => clearInterval(interval);
        }
    }, [session, refreshData]);

    const loadUser = async (userId: string) => {
        try {
             const data = await dataService.fetchAllData();
             const user = data.collaborators.find((c: any) => c.id === userId);
             
             // Get Custom Role permissions for this user
             let permissions = {}; 
             if (user) {
                 const roles = await dataService.getCustomRoles();
                 const role = roles.find(r => r.name === user.role);
                 if (role) permissions = role.permissions;
             }
             
             if (user) {
                 // Merge dynamic permissions into user object for access control
                 const userWithPermissions = { ...user, permissions };
                 setCurrentUser(userWithPermissions);
                 
                 if (user.preferences?.tooltipConfig) {
                     setTooltipConfig({ ...defaultTooltipConfig, ...user.preferences.tooltipConfig });
                 } else {
                     const tooltipSetting = await dataService.getGlobalSetting('tooltip_config');
                     if (tooltipSetting) {
                         try {
                            const parsed = JSON.parse(tooltipSetting);
                            setTooltipConfig({ ...defaultTooltipConfig, ...parsed });
                         } catch (e) { console.error(e); }
                     }
                 }

                 // Update state with fetched data to avoid double fetch
                 setEquipment(data.equipment);
                 setInstituicoes(data.instituicoes);
                 setEntidades(data.entidades);
                 setCollaborators(data.collaborators);
                 setAssignments(data.assignments);
                 setTickets(data.tickets);
                 setTicketActivities(data.ticketActivities);
                 setBrands(data.brands);
                 setEquipmentTypes(data.equipmentTypes);
                 setSoftwareLicenses(data.softwareLicenses);
                 setLicenseAssignments(data.licenseAssignments);
                 setTeams(data.teams);
                 setTeamMembers(data.teamMembers);
                 setMessages(data.messages);
                 setCollaboratorHistory(data.collaboratorHistory);
                 setTicketCategories(data.ticketCategories);
                 setBusinessServices(data.businessServices);
                 setServiceDependencies(data.serviceDependencies);
                 setVulnerabilities(data.vulnerabilities);
                 setSecurityIncidentTypes(data.securityIncidentTypes);
                 setSuppliers(data.suppliers);
                 setBackupExecutions(data.backupExecutions);
                 setResilienceTests(data.resilienceTests);
                 setSecurityTrainings(data.securityTrainings);
                 
                 setConfigEquipmentStatuses(data.configEquipmentStatuses);
                 setConfigUserRoles(data.configUserRoles);
                 setConfigCriticalityLevels(data.configCriticalityLevels);
                 setConfigCiaRatings(data.configCiaRatings);
                 setConfigServiceStatuses(data.configServiceStatuses);
                 setConfigBackupTypes(data.configBackupTypes);
                 setConfigTrainingTypes(data.configTrainingTypes);
                 setConfigResilienceTestTypes(data.configResilienceTestTypes);
                 setSoftwareCategories(data.configSoftwareCategories);
                 setContactRoles(data.contactRoles);
                 setContactTitles(data.contactTitles);
             } else {
                 console.warn("User logged in but not found in collaborators table");
             }
        } catch (e) {
            console.error("Error loading user data", e);
        } finally {
             setLoading(false);
        }
    };
    
    const isAdmin = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;
    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;
    const isBasic = currentUser?.role === UserRole.Basic || currentUser?.role === UserRole.Utilizador;
    
    // --- RBAC PERMISSION CHECKER ---
    // Updated to support granular keys
    const checkPermission = (module: ModuleKey, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean => {
        if (!currentUser) return false;
        if (isSuperAdmin) return true; // SuperAdmin bypass
        
        // Check dynamic permissions
        const perms = (currentUser as any).permissions;
        if (!perms) {
            // Fallback for legacy roles if migration didn't run perfectly (though migration script should fix this)
            if (currentUser.role === 'Admin') return true;
            // Map legacy keys for backward compat if needed, but better to rely on migration
            return false;
        }

        return perms[module]?.[action] === true;
    };

    const isCurrentUser = (collaboratorId: string) => currentUser && currentUser.id === collaboratorId;

    const handleMagicAction = (intent: string, data: any) => {
        if (intent === 'search') {
            if (data.query) {
                const query = data.query.toLowerCase();
                if (query.includes('ticket') || query.includes('suporte')) {
                    setActiveTab('tickets.list');
                    setInitialFilter({ status: '', description: query });
                } else if (query.includes('user') || query.includes('colaborador')) {
                    setActiveTab('collaborators');
                } else {
                    setActiveTab('equipment.inventory');
                    setInitialFilter({ description: data.query });
                }
            }
        } else if (intent === 'create_equipment') {
            const brand = brands.find(b => b.name.toLowerCase() === data.brandName?.toLowerCase());
            const type = equipmentTypes.find(t => t.name.toLowerCase() === data.typeName?.toLowerCase());
            
            setEquipmentToEdit(null);
            setInitialEquipmentData({
                brandId: brand?.id || '',
                typeId: type?.id || '',
                serialNumber: data.serialNumber || '',
                description: data.description || '',
            });
            setShowAddEquipment(true);
        } else if (intent === 'create_ticket') {
            const requester = collaborators.find(c => c.fullName.toLowerCase() === data.requesterName?.toLowerCase());
            
            let priority: string = CriticalityLevel.Low;
            if (data.priority?.toLowerCase().includes('alta')) priority = CriticalityLevel.High;
            if (data.priority?.toLowerCase().includes('crítica')) priority = CriticalityLevel.Critical;
            if (data.priority?.toLowerCase().includes('média')) priority = CriticalityLevel.Medium;

            setTicketToEdit(null);
            setInitialTicketData({
                title: data.title || '',
                description: data.description || '',
                collaboratorId: requester?.id || '',
                entidadeId: requester?.entidadeId || '',
                impactCriticality: priority
            });
            setShowAddTicket(true);
        }
    };

    const handleImportData = async (dataType: ImportConfig['dataType'], data: any[]) => {
        try {
            if (dataType === 'equipment') {
                await dataService.addMultipleEquipment(data);
            } else {
                // Simplified for example
                alert("Import logic for this type not fully implemented in snippet.");
            }
            await refreshData();
            return { success: true, message: `${data.length} registos importados.` };
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    };
    
    const handleLogin = async () => { return { success: true }; };
    const handleLogout = async () => {
        const supabase = getSupabase();
        await (supabase.auth as any).signOut();
        setCurrentUser(null);
        setSession(null);
    };

    const simpleSaveWrapper = async (saveFn: Function, data: any, editId?: string) => {
        try {
            let result;
            if (editId) result = await saveFn(editId, data);
            else result = await saveFn(data);
            await refreshData();
            return result;
        } catch (e: any) {
            console.error(e);
            alert(`Erro ao salvar dados: ${e.message || e.code || 'Erro desconhecido'}.`);
            return null;
        }
    };

    const handleDelete = (title: string, message: string, onConfirm: () => void) => {
        setConfirmationModal({ show: true, title, message, onConfirm: () => { onConfirm(); setConfirmationModal(null); } });
    };
    
    const expiringWarranties = useMemo(() => { 
        const now = new Date();
        const next30 = new Date();
        next30.setDate(now.getDate() + 30);
        return equipment.filter(e => e.warrantyEndDate && new Date(e.warrantyEndDate) <= next30 && new Date(e.warrantyEndDate) >= now);
    }, [equipment]);

    const expiringLicenses = useMemo(() => { 
        const now = new Date();
        const next30 = new Date();
        next30.setDate(now.getDate() + 30);
        return softwareLicenses.filter(l => l.expiryDate && new Date(l.expiryDate) <= next30 && new Date(l.expiryDate) >= now);
    }, [softwareLicenses]);

    const activeTickets = useMemo(() => { 
        return tickets.filter(t => t.status !== TicketStatus.Finished);
    }, [tickets]);

    const notificationCount = expiringWarranties.length + expiringLicenses.length + activeTickets.length;

    if (!isConfigured) {
        return <ConfigurationSetup onConfigured={() => { setIsConfigured(true); window.location.reload(); }} />;
    }

    if (loading) {
        return <div className="min-h-screen bg-background-dark flex items-center justify-center text-white">A carregar sistema...</div>;
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} onForgotPassword={() => setShowForgotPassword(true)} />;
    }
    
    // Build Tab Config based on Permissions
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

    const handleSaveEquipment = async (eqData: any, assignment?: any, licenseIds?: string[]) => {
        let result;
        if (eqData.id) {
            result = await dataService.updateEquipment(eqData.id, eqData);
        } else {
            result = await dataService.addEquipment(eqData);
        }
        if (result && assignment) {
            await dataService.addAssignment({ ...assignment, equipmentId: result.id });
        }
        if (result && licenseIds) {
            await dataService.syncLicenseAssignments(result.id, licenseIds);
        }
        await refreshData();
        return result;
    };

    const handleSaveCollaborator = async (colData: Collaborator, password?: string) => {
        let result;
        if (colData.id) {
            result = await dataService.updateCollaborator(colData.id, colData);
        } else {
            result = await dataService.addCollaborator(colData, password);
            if (password && result?.email) {
                setNewCredentials({ email: result.email, password });
            }
        }
        await refreshData();
        return result;
    };
    
    const handleSaveLicenses = async (eqId: string, licenseIds: string[]) => {
        await dataService.syncLicenseAssignments(eqId, licenseIds);
        await refreshData();
    };

    return (
        <div className={`min-h-screen bg-background-dark ${layoutMode === 'top' ? 'flex flex-col' : ''}`}>
            {/* ... Header/Sidebar ... */}
            {layoutMode === 'top' ? (
                <Header 
                    currentUser={currentUser} 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    onLogout={handleLogout}
                    tabConfig={tabConfig}
                    notificationCount={notificationCount}
                    onNotificationClick={() => setShowNotifications(true)}
                    onOpenAutomation={checkPermission('config_automation') ? () => setShowAutomationModal(true) : undefined}
                    onOpenProfile={() => { if(currentUser) { setCollaboratorToEdit(currentUser); setShowProfileModal(true); }}}
                    onOpenCalendar={() => setShowCalendarModal(true)}
                    onOpenManual={() => setShowUserManual(true)}
                />
            ) : (
                <Sidebar
                    currentUser={currentUser}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onLogout={handleLogout}
                    tabConfig={tabConfig}
                    notificationCount={notificationCount}
                    onNotificationClick={() => setShowNotifications(true)}
                    isExpanded={sidebarExpanded}
                    onHover={setSidebarExpanded}
                    onOpenAutomation={checkPermission('config_automation') ? () => setShowAutomationModal(true) : undefined}
                    onOpenProfile={() => { if(currentUser) { setCollaboratorToEdit(currentUser); setShowProfileModal(true); }}}
                    onOpenCalendar={() => setShowCalendarModal(true)}
                    onOpenManual={() => setShowUserManual(true)}
                />
            )}

            <main className={`transition-all duration-300 ease-in-out ${
                layoutMode === 'side' 
                    ? (sidebarExpanded ? 'ml-64' : 'ml-20') 
                    : 'w-full'
            }`}>
                <div className="max-w-screen-xl mx-auto p-4 sm:p-6 w-full">
                    
                    {activeTab === 'overview' && !isBasic && (
                        <OverviewDashboard
                            equipment={equipment}
                            instituicoes={instituicoes}
                            entidades={entidades}
                            assignments={assignments}
                            equipmentTypes={equipmentTypes}
                            tickets={tickets}
                            collaborators={collaborators}
                            teams={teams}
                            expiringWarranties={expiringWarranties}
                            expiringLicenses={expiringLicenses}
                            softwareLicenses={softwareLicenses}
                            licenseAssignments={licenseAssignments}
                            businessServices={businessServices}
                            vulnerabilities={vulnerabilities}
                            onViewItem={(tab, filter) => { setActiveTab(tab); setInitialFilter(filter); }}
                            onGenerateComplianceReport={() => { setShowReport({ type: 'compliance', visible: true }); }}
                        />
                    )}

                    {activeTab === 'overview.smart' && isAdmin && (
                        <SmartDashboard 
                            tickets={tickets}
                            vulnerabilities={vulnerabilities}
                            backups={backupExecutions}
                            trainings={securityTrainings}
                            collaborators={collaborators}
                            currentUser={currentUser}
                        />
                    )}
                    
                    {activeTab === 'reports' && checkPermission('reports', 'view') && (
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
                                { tableName: 'config_criticality_levels', label: 'Níveis de Criticidade', data: configCriticalityLevels },
                                { tableName: 'config_cia_ratings', label: 'Classificação CIA', data: configCiaRatings },
                                { tableName: 'config_service_statuses', label: 'Estados de Serviço', data: configServiceStatuses },
                                { tableName: 'config_backup_types', label: 'Tipos de Backup', data: configBackupTypes },
                                { tableName: 'config_training_types', label: 'Tipos de Formação', data: configTrainingTypes },
                                { tableName: 'config_resilience_test_types', label: 'Tipos de Teste Resiliência', data: configResilienceTestTypes },
                                { tableName: 'config_software_categories', label: 'Categorias de Software', data: softwareCategories },
                                { tableName: 'contact_roles', label: 'Funções de Contacto', data: contactRoles },
                                { tableName: 'contact_titles', label: 'Tratos (Honoríficos)', data: contactTitles }
                            ]}
                            onRefresh={refreshData}
                            brands={brands}
                            equipment={equipment}
                            equipmentTypes={equipmentTypes}
                            ticketCategories={ticketCategories}
                            tickets={tickets}
                            teams={teams}
                            securityIncidentTypes={securityIncidentTypes}
                            collaborators={collaborators}
                            softwareLicenses={softwareLicenses}
                            businessServices={businessServices}
                            backupExecutions={backupExecutions}
                            securityTrainings={securityTrainings}
                            resilienceTests={resilienceTests}
                            suppliers={suppliers}
                            entidades={entidades}
                            instituicoes={instituicoes}
                            vulnerabilities={vulnerabilities}
                            // Check specific permissions for handlers
                            onCreateBrand={checkPermission('brands', 'create') ? () => { setBrandToEdit(null); setShowAddBrand(true); } : () => {}}
                            onEditBrand={checkPermission('brands', 'edit') ? (b) => { setBrandToEdit(b); setShowAddBrand(true); } : () => {}}
                            onDeleteBrand={checkPermission('brands', 'delete') ? (id) => handleDelete('Excluir Marca', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteBrand, id)) : () => {}}
                            
                            onCreateType={checkPermission('equipment_types', 'create') ? () => { setTypeToEdit(null); setShowAddType(true); } : () => {}}
                            onEditType={checkPermission('equipment_types', 'edit') ? (t) => { setTypeToEdit(t); setShowAddType(true); } : () => {}}
                            onDeleteType={checkPermission('equipment_types', 'delete') ? (id) => handleDelete('Excluir Tipo', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteEquipmentType, id)) : () => {}}
                            
                            onCreateCategory={checkPermission('ticket_categories', 'create') ? () => { setCategoryToEdit(null); setShowAddCategory(true); } : () => {}}
                            onEditCategory={checkPermission('ticket_categories', 'edit') ? (c) => { setCategoryToEdit(c); setShowAddCategory(true); } : () => {}}
                            onDeleteCategory={checkPermission('ticket_categories', 'delete') ? (id) => handleDelete('Excluir Categoria', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteTicketCategory, id)) : () => {}}
                            onToggleCategoryStatus={(id) => {
                                const cat = ticketCategories.find(c => c.id === id);
                                if (cat && checkPermission('ticket_categories', 'edit')) simpleSaveWrapper(dataService.updateTicketCategory, { is_active: !cat.is_active }, id);
                            }}
                            
                            onCreateIncidentType={checkPermission('security_incident_types', 'create') ? () => { setIncidentTypeToEdit(null); setShowAddIncidentType(true); } : () => {}}
                            onEditIncidentType={checkPermission('security_incident_types', 'edit') ? (t) => { setIncidentTypeToEdit(t); setShowAddIncidentType(true); } : () => {}}
                            onDeleteIncidentType={checkPermission('security_incident_types', 'delete') ? (id) => handleDelete('Excluir Tipo Incidente', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteSecurityIncidentType, id)) : () => {}}
                            onToggleIncidentTypeStatus={(id) => {
                                const type = securityIncidentTypes.find(t => t.id === id);
                                if (type && checkPermission('security_incident_types', 'edit')) simpleSaveWrapper(dataService.updateSecurityIncidentType, { is_active: !type.is_active }, id);
                            }}
                            
                            onSaveTooltipConfig={setTooltipConfig}
                        />
                    )}
                    
                    {activeTab === 'licensing' && checkPermission('licensing', 'view') && (
                        <LicenseDashboard
                            licenses={softwareLicenses}
                            licenseAssignments={licenseAssignments}
                            equipmentData={equipment}
                            assignments={assignments}
                            collaborators={collaborators}
                            brandMap={brandMap}
                            equipmentTypeMap={equipmentTypeMap}
                            initialFilter={initialFilter}
                            onClearInitialFilter={() => setInitialFilter(null)}
                            onEdit={checkPermission('licensing', 'edit') ? (l) => { setLicenseToEdit(l); setShowAddLicense(true); } : undefined}
                            onDelete={checkPermission('licensing', 'delete') ? (id) => handleDelete('Excluir Licença', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteLicense, id)) : undefined}
                            onToggleStatus={(id) => {
                                const lic = softwareLicenses.find(l => l.id === id);
                                if (lic && checkPermission('licensing', 'edit')) {
                                    const newStatus = lic.status === 'Ativo' ? 'Inativo' : 'Ativo';
                                    simpleSaveWrapper(dataService.updateLicense, { status: newStatus }, id);
                                }
                            }}
                            onGenerateReport={() => setShowReport({ type: 'licensing', visible: true })}
                            businessServices={businessServices}
                            serviceDependencies={serviceDependencies}
                            onCreate={checkPermission('licensing', 'create') ? () => { setLicenseToEdit(null); setShowAddLicense(true); } : undefined}
                            softwareCategories={softwareCategories}
                        />
                    )}

                    {activeTab === 'collaborators' && checkPermission('organization', 'view') && (
                        <CollaboratorDashboard
                            collaborators={collaborators}
                            escolasDepartamentos={entidades}
                            instituicoes={instituicoes}
                            equipment={equipment}
                            assignments={assignments}
                            tickets={tickets}
                            ticketActivities={ticketActivities}
                            teamMembers={teamMembers}
                            collaboratorHistory={collaboratorHistory}
                            messages={messages}
                            currentUser={currentUser}
                            onEdit={checkPermission('organization', 'edit') ? (c) => { setCollaboratorToEdit(c); setShowAddCollaborator(true); } : undefined}
                            onDelete={checkPermission('organization', 'delete') ? (id) => handleDelete('Excluir Colaborador', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteCollaborator, id)) : undefined}
                            onShowHistory={(c) => { setHistoryCollaborator(c); }}
                            onShowDetails={(c) => { if (isCurrentUser(c.id)) { setCollaboratorToEdit(c); setShowProfileModal(true); } else { setDetailCollaborator(c); } }}
                            onGenerateReport={() => setShowReport({ type: 'collaborator', visible: true })}
                            onStartChat={(c) => { setActiveChatCollaboratorId(c.id); setIsChatOpen(true); }}
                            onCreate={checkPermission('organization', 'create') ? () => { setCollaboratorToEdit(null); setShowAddCollaborator(true); } : undefined}
                            onToggleStatus={(id) => {
                                const col = collaborators.find(c => c.id === id);
                                if (col && checkPermission('organization', 'edit')) {
                                    const newStatus = col.status === 'Ativo' ? 'Inativo' : 'Ativo';
                                    simpleSaveWrapper(dataService.updateCollaborator, { status: newStatus }, id);
                                }
                            }}
                            tooltipConfig={tooltipConfig}
                        />
                    )}

                     {activeTab === 'equipment.inventory' && checkPermission('equipment', 'view') && (
                        <EquipmentDashboard 
                            equipment={equipment}
                            brands={brands}
                            equipmentTypes={equipmentTypes}
                            brandMap={brandMap}
                            equipmentTypeMap={equipmentTypeMap}
                            assignedEquipmentIds={assignedEquipmentIds}
                            assignments={assignments}
                            collaborators={collaborators}
                            entidades={entidades}
                            initialFilter={initialFilter}
                            onClearInitialFilter={() => setInitialFilter(null)}
                            onAssign={(eq) => setShowAssignEquipment(eq)}
                            onShowHistory={(eq) => setDetailEquipment(eq)} 
                            onEdit={checkPermission('equipment', 'edit') ? (eq) => { setEquipmentToEdit(eq); setShowAddEquipment(true); } : undefined}
                            businessServices={businessServices}
                            serviceDependencies={serviceDependencies}
                            onGenerateReport={() => setShowReport({ type: 'equipment', visible: true })}
                            onManageKeys={(eq) => setShowManageLicenses(eq)}
                            onCreate={checkPermission('equipment', 'create') ? () => { setEquipmentToEdit(null); setInitialEquipmentData(null); setShowAddEquipment(true); } : undefined}
                            softwareLicenses={softwareLicenses}
                            licenseAssignments={licenseAssignments}
                            vulnerabilities={vulnerabilities}
                            suppliers={suppliers}
                            tooltipConfig={tooltipConfig}
                        />
                    )}

                     {activeTab === 'organizacao.suppliers' && checkPermission('suppliers', 'view') && (
                        <SupplierDashboard
                            suppliers={suppliers}
                            onEdit={checkPermission('suppliers', 'edit') ? (s) => { setSupplierToEdit(s); setShowAddSupplier(true); } : () => {}}
                            onDelete={checkPermission('suppliers', 'delete') ? (id) => handleDelete('Excluir Fornecedor', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteSupplier, id)) : () => {}}
                            onCreate={checkPermission('suppliers', 'create') ? () => { setSupplierToEdit(null); setShowAddSupplier(true); } : () => {}}
                            businessServices={businessServices}
                            onToggleStatus={(id) => {
                                const sup = suppliers.find(s => s.id === id);
                                if (sup && checkPermission('suppliers', 'edit')) {
                                    const newStatus = sup.is_active !== false ? false : true;
                                    simpleSaveWrapper(dataService.updateSupplier, { is_active: newStatus }, id);
                                }
                            }}
                        />
                    )}

                    {activeTab === 'organizacao.instituicoes' && checkPermission('organization', 'view') && (
                        <InstituicaoDashboard
                            instituicoes={instituicoes}
                            escolasDepartamentos={entidades}
                            collaborators={collaborators}
                            assignments={assignments}
                            onCreate={checkPermission('organization', 'create') ? () => { setInstituicaoToEdit(null); setShowAddInstituicao(true); } : undefined}
                            onEdit={checkPermission('organization', 'edit') ? (i) => { setInstituicaoToEdit(i); setShowAddInstituicao(true); } : undefined}
                            onDelete={checkPermission('organization', 'delete') ? (id) => handleDelete('Excluir Instituição', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteInstituicao, id)) : undefined}
                            onToggleStatus={(id) => {
                                const inst = instituicoes.find(i => i.id === id);
                                if (inst && checkPermission('organization', 'edit')) simpleSaveWrapper(dataService.updateInstituicao, { is_active: inst.is_active !== false ? false : true }, id);
                            }}
                            equipment={equipment}
                            brands={brands}
                            equipmentTypes={equipmentTypes}
                        />
                    )}

                    {activeTab === 'organizacao.entidades' && checkPermission('organization', 'view') && (
                        <EntidadeDashboard
                            escolasDepartamentos={entidades}
                            instituicoes={instituicoes}
                            collaborators={collaborators}
                            assignments={assignments}
                            tickets={tickets}
                            collaboratorHistory={collaboratorHistory}
                            onCreate={checkPermission('organization', 'create') ? () => { setEntidadeToEdit(null); setShowAddEntidade(true); } : undefined}
                            onEdit={checkPermission('organization', 'edit') ? (e) => { setEntidadeToEdit(e); setShowAddEntidade(true); } : undefined}
                            onDelete={checkPermission('organization', 'delete') ? (id) => handleDelete('Excluir Entidade', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteEntidade, id)) : undefined}
                            onToggleStatus={(id) => {
                                const ent = entidades.find(e => e.id === id);
                                if (ent && checkPermission('organization', 'edit')) simpleSaveWrapper(dataService.updateEntidade, { status: ent.status === 'Ativo' ? 'Inativo' : 'Ativo' }, id);
                            }}
                            equipment={equipment}
                            brands={brands}
                            equipmentTypes={equipmentTypes}
                        />
                    )}

                    {activeTab === 'organizacao.teams' && checkPermission('organization', 'view') && (
                        <TeamDashboard
                            teams={teams}
                            teamMembers={teamMembers}
                            collaborators={collaborators}
                            tickets={tickets}
                            equipmentTypes={equipmentTypes}
                            onCreate={checkPermission('organization', 'create') ? () => { setTeamToEdit(null); setShowAddTeam(true); } : undefined}
                            onEdit={checkPermission('organization', 'edit') ? (t) => { setTeamToEdit(t); setShowAddTeam(true); } : () => {}}
                            onDelete={checkPermission('organization', 'delete') ? (id) => handleDelete('Excluir Equipa', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteTeam, id)) : () => {}}
                            onManageMembers={(t) => setShowManageTeamMembers(t)}
                            onToggleStatus={(id) => {
                                const team = teams.find(t => t.id === id);
                                if (team && checkPermission('organization', 'edit')) simpleSaveWrapper(dataService.updateTeam, { is_active: team.is_active !== false ? false : true }, id);
                            }}
                        />
                    )}

                    {activeTab === 'tickets.list' && checkPermission('tickets', 'view') && (
                        <TicketDashboard
                            tickets={tickets}
                            escolasDepartamentos={entidades}
                            collaborators={collaborators}
                            teams={teams}
                            equipment={equipment}
                            equipmentTypes={equipmentTypes}
                            initialFilter={initialFilter}
                            onClearInitialFilter={() => setInitialFilter(null)}
                            onUpdateTicket={(t) => simpleSaveWrapper(dataService.updateTicket, t, t.id)}
                            onEdit={checkPermission('tickets', 'edit') ? (t) => { setTicketToEdit(t); setShowAddTicket(true); } : undefined}
                            onOpenCloseTicketModal={(t) => setShowCloseTicket(t)}
                            onGenerateReport={() => setShowReport({ type: 'ticket', visible: true })}
                            onOpenActivities={(t) => setTicketActivitiesModal(t)}
                            onGenerateSecurityReport={(t) => { /* Logic for Regulatory Modal */ setTicketToEdit(t); /* Open modal */ }}
                            categories={ticketCategories}
                            onCreate={checkPermission('tickets', 'create') ? () => { setTicketToEdit(null); setShowAddTicket(true); } : undefined}
                        />
                    )}

                    {activeTab === 'nis2.security' && checkPermission('compliance', 'view') && (
                        <VulnerabilityDashboard
                            vulnerabilities={vulnerabilities}
                            onCreate={checkPermission('compliance', 'create') ? () => { setVulnerabilityToEdit(null); setShowAddVulnerability(true); } : () => {}}
                            onEdit={checkPermission('compliance', 'edit') ? (v) => { setVulnerabilityToEdit(v); setShowAddVulnerability(true); } : () => {}}
                            onDelete={checkPermission('compliance', 'delete') ? (id) => handleDelete('Excluir Vulnerabilidade', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteVulnerability, id)) : () => {}}
                            initialFilter={initialFilter}
                            onClearInitialFilter={() => setInitialFilter(null)}
                            onCreateTicket={(v) => {
                                setVulnIdForTicketCreation(v.id);
                                setInitialTicketData({
                                    title: `Vulnerabilidade: ${v.cve_id}`,
                                    description: `Resolução de vulnerabilidade de segurança.\n\nCVE: ${v.cve_id}\nSeveridade: ${v.severity}\nSoftware: ${v.affected_software}\n\n${v.description}`,
                                    category: 'Incidente de Segurança',
                                    impactCriticality: v.severity
                                });
                                setShowAddTicket(true);
                            }}
                        />
                    )}

                    {activeTab === 'nis2.bia' && checkPermission('compliance', 'view') && (
                        <ServiceDashboard
                            services={businessServices}
                            dependencies={serviceDependencies}
                            collaborators={collaborators}
                            onCreate={checkPermission('compliance', 'create') ? () => { setServiceToEdit(null); setShowAddService(true); } : () => {}}
                            onEdit={checkPermission('compliance', 'edit') ? (s) => { setServiceToEdit(s); setShowAddService(true); } : () => {}}
                            onDelete={checkPermission('compliance', 'delete') ? (id) => handleDelete('Excluir Serviço BIA', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteBusinessService, id)) : () => {}}
                            onManageDependencies={(s) => setShowServiceDependencies(s)}
                            onGenerateReport={() => setShowReport({ type: 'bia', visible: true })}
                        />
                    )}

                    {activeTab === 'nis2.backups' && checkPermission('compliance', 'view') && (
                        <BackupDashboard
                            backups={backupExecutions}
                            collaborators={collaborators}
                            equipment={equipment}
                            onCreate={checkPermission('compliance', 'create') ? () => { setBackupToEdit(null); setShowAddBackup(true); } : () => {}}
                            onEdit={checkPermission('compliance', 'edit') ? (b) => { setBackupToEdit(b); setShowAddBackup(true); } : () => {}}
                            onDelete={checkPermission('compliance', 'delete') ? (id) => handleDelete('Excluir Registo Backup', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteBackupExecution, id)) : () => {}}
                        />
                    )}

                    {activeTab === 'nis2.resilience' && checkPermission('compliance', 'view') && (
                        <ResilienceDashboard
                            resilienceTests={resilienceTests}
                            onCreate={checkPermission('compliance', 'create') ? () => { setResilienceTestToEdit(null); setShowAddResilienceTest(true); } : () => {}}
                            onEdit={checkPermission('compliance', 'edit') ? (t) => { setResilienceTestToEdit(t); setShowAddResilienceTest(true); } : () => {}}
                            onDelete={checkPermission('compliance', 'delete') ? (id) => handleDelete('Excluir Teste', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteResilienceTest, id)) : () => {}}
                            onCreateTicket={(t) => {
                                setInitialTicketData(t);
                                setShowAddTicket(true);
                            }}
                        />
                    )}

                    {activeTab === 'tools.agenda' && <AgendaDashboard />}
                    {activeTab === 'tools.map' && (
                        <MapDashboard 
                            instituicoes={instituicoes} 
                            entidades={entidades} 
                            suppliers={suppliers} 
                            equipment={equipment}
                            assignments={assignments}
                        />
                    )}

                </div>
            </main>
            
            {/* ... Modals ... */}
            {showAddCollaborator && (
                <AddCollaboratorModal
                    onClose={() => { setShowAddCollaborator(false); setCollaboratorToEdit(null); }}
                    onSave={handleSaveCollaborator}
                    collaboratorToEdit={collaboratorToEdit}
                    escolasDepartamentos={entidades}
                    instituicoes={instituicoes}
                    currentUser={currentUser}
                    roleOptions={configUserRoles}
                    titleOptions={contactTitles}
                />
            )}
            
             {/* Reused Profile Modal */}
            {showProfileModal && collaboratorToEdit && (
                <CollaboratorDetailModal 
                    collaborator={collaboratorToEdit}
                    assignments={assignments}
                    equipment={equipment}
                    tickets={tickets}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    onClose={() => { setShowProfileModal(false); setCollaboratorToEdit(null); }}
                    onShowHistory={(c) => setHistoryCollaborator(c)}
                    onStartChat={(c) => { setActiveChatCollaboratorId(c.id); setIsChatOpen(true); }}
                    onEdit={(c) => { setShowProfileModal(false); setCollaboratorToEdit(c); setShowAddCollaborator(true); }}
                />
            )}

            {/* Add other modals below as needed based on state */}
            {showAddEquipment && (
                <AddEquipmentModal
                    onClose={() => { setShowAddEquipment(false); setEquipmentToEdit(null); setInitialEquipmentData(null); }}
                    onSave={handleSaveEquipment}
                    brands={brands}
                    equipmentTypes={equipmentTypes}
                    equipmentToEdit={equipmentToEdit}
                    onSaveBrand={(b) => simpleSaveWrapper(dataService.addBrand, b)}
                    onSaveEquipmentType={(t) => simpleSaveWrapper(dataService.addEquipmentType, t)}
                    onOpenKitModal={(data) => {
                        setShowAddEquipment(false);
                        setKitInitialData(data);
                        setShowAddKit(true);
                    }}
                    suppliers={suppliers}
                    softwareLicenses={softwareLicenses}
                    entidades={entidades}
                    collaborators={collaborators}
                    statusOptions={configEquipmentStatuses}
                    criticalityOptions={configCriticalityLevels}
                    ciaOptions={configCiaRatings}
                    initialData={initialEquipmentData}
                    licenseAssignments={licenseAssignments}
                    onOpenHistory={(eq) => setDetailEquipment(eq)}
                    onManageLicenses={(eq) => setShowManageLicenses(eq)}
                    onOpenAssign={(eq) => setShowAssignEquipment(eq)}
                />
            )}

            {showAssignEquipment && (
                <AssignEquipmentModal
                    equipment={showAssignEquipment}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    escolasDepartamentos={entidades}
                    collaborators={collaborators}
                    onClose={() => setShowAssignEquipment(null)}
                    onAssign={async (assignment) => {
                        await dataService.addAssignment(assignment);
                        await refreshData();
                    }}
                />
            )}

            {showAddEntidade && (
                <AddEntidadeModal
                    onClose={() => { setShowAddEntidade(false); setEntidadeToEdit(null); }}
                    onSave={async (data) => {
                        if (entidadeToEdit) await dataService.updateEntidade(entidadeToEdit.id, data);
                        else await dataService.addEntidade(data);
                        await refreshData();
                    }}
                    entidadeToEdit={entidadeToEdit}
                    instituicoes={instituicoes}
                />
            )}

            {showAddInstituicao && (
                <AddInstituicaoModal
                    onClose={() => { setShowAddInstituicao(false); setInstituicaoToEdit(null); }}
                    onSave={async (data) => {
                        if (instituicaoToEdit) await dataService.updateInstituicao(instituicaoToEdit.id, data);
                        else await dataService.addInstituicao(data);
                        await refreshData();
                    }}
                    instituicaoToEdit={instituicaoToEdit}
                />
            )}

            {showReport.visible && (
                <ReportModal
                    type={showReport.type}
                    onClose={() => setShowReport({ ...showReport, visible: false })}
                    equipment={equipment}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    instituicoes={instituicoes}
                    escolasDepartamentos={entidades}
                    collaborators={collaborators}
                    assignments={assignments}
                    tickets={tickets}
                    softwareLicenses={softwareLicenses}
                    licenseAssignments={licenseAssignments}
                    businessServices={businessServices}
                    serviceDependencies={serviceDependencies}
                />
            )}

            {historyCollaborator && (
                <CollaboratorHistoryModal
                    collaborator={historyCollaborator}
                    history={collaboratorHistory}
                    escolasDepartamentos={entidades}
                    onClose={() => setHistoryCollaborator(null)}
                />
            )}

            {detailCollaborator && (
                <CollaboratorDetailModal
                    collaborator={detailCollaborator}
                    assignments={assignments}
                    equipment={equipment}
                    tickets={tickets}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    onClose={() => setDetailCollaborator(null)}
                    onShowHistory={(c) => setHistoryCollaborator(c)}
                    onStartChat={(c) => { setActiveChatCollaboratorId(c.id); setIsChatOpen(true); }}
                    onEdit={(c) => { setDetailCollaborator(null); setCollaboratorToEdit(c); setShowAddCollaborator(true); }}
                />
            )}

            {showForgotPassword && (
                <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
            )}

            {showResetPassword && (
                <ResetPasswordModal session={session} onClose={() => setShowResetPassword(false)} />
            )}

            {showAddTicket && (
                <AddTicketModal
                    onClose={() => { setShowAddTicket(false); setTicketToEdit(null); setInitialTicketData(null); setVulnIdForTicketCreation(null); }}
                    onSave={async (ticketData) => {
                        let result;
                        if (ticketToEdit) {
                            result = await dataService.updateTicket(ticketToEdit.id, ticketData);
                        } else {
                            // If created from vuln, link it
                            const newTicket = await dataService.addTicket(ticketData);
                            if (vulnIdForTicketCreation && newTicket) {
                                await dataService.updateVulnerability(vulnIdForTicketCreation, { ticket_id: newTicket.id, status: 'Em Análise' });
                            }
                            result = newTicket;
                        }
                        await refreshData();
                        return result;
                    }}
                    ticketToEdit={ticketToEdit}
                    escolasDepartamentos={entidades}
                    collaborators={collaborators}
                    teams={teams}
                    currentUser={currentUser}
                    userPermissions={{ viewScope: 'all' }} // Simplified for now
                    equipment={equipment}
                    equipmentTypes={equipmentTypes}
                    assignments={assignments}
                    categories={ticketCategories}
                    securityIncidentTypes={securityIncidentTypes}
                    pastTickets={tickets}
                    initialData={initialTicketData}
                />
            )}

            {ticketActivitiesModal && (
                <TicketActivitiesModal
                    ticket={ticketActivitiesModal}
                    activities={ticketActivities.filter(ta => ta.ticketId === ticketActivitiesModal.id)}
                    collaborators={collaborators}
                    currentUser={currentUser}
                    equipment={equipment}
                    equipmentTypes={equipmentTypes}
                    entidades={entidades}
                    onClose={() => setTicketActivitiesModal(null)}
                    onAddActivity={async (activityData) => {
                        await dataService.addTicketActivity({
                            ...activityData,
                            ticketId: ticketActivitiesModal.id,
                            technicianId: currentUser?.id || '',
                            date: new Date().toISOString()
                        });
                        // Auto update status to InProgress if requested
                        if (ticketActivitiesModal.status === 'Pedido') {
                            await dataService.updateTicket(ticketActivitiesModal.id, { 
                                status: 'Em progresso',
                                technicianId: currentUser?.id
                            });
                        }
                        await refreshData();
                    }}
                    assignments={assignments}
                />
            )}

            {showAddType && (
                <AddEquipmentTypeModal
                    onClose={() => { setShowAddType(false); setTypeToEdit(null); }}
                    onSave={async (data) => {
                        if (typeToEdit) await dataService.updateEquipmentType(typeToEdit.id, data);
                        else await dataService.addEquipmentType(data);
                        await refreshData();
                    }}
                    typeToEdit={typeToEdit}
                    teams={teams}
                    existingTypes={equipmentTypes}
                />
            )}

            {showAddBrand && (
                <AddBrandModal
                    onClose={() => { setShowAddBrand(false); setBrandToEdit(null); }}
                    onSave={async (data) => {
                        if (brandToEdit) await dataService.updateBrand(brandToEdit.id, data);
                        else await dataService.addBrand(data);
                        await refreshData();
                    }}
                    brandToEdit={brandToEdit}
                    existingBrands={brands}
                />
            )}

            {isChatOpen && activeChatCollaboratorId && (
                <ChatModal
                    onClose={() => setIsChatOpen(false)}
                    targetCollaborator={collaborators.find(c => c.id === activeChatCollaboratorId)!}
                    currentUser={currentUser!}
                    messages={messages}
                    onSendMessage={async (receiverId, content) => {
                        await dataService.addMessage({
                            senderId: currentUser!.id,
                            receiverId,
                            content,
                            timestamp: new Date().toISOString(),
                            read: false
                        });
                        await refreshData();
                    }}
                    onMarkMessagesAsRead={async (senderId) => {
                        await dataService.markMessagesAsRead(senderId, currentUser!.id);
                        await refreshData();
                    }}
                />
            )}

            {showAddLicense && (
                <AddLicenseModal
                    onClose={() => { setShowAddLicense(false); setLicenseToEdit(null); }}
                    onSave={async (data) => {
                        if (licenseToEdit) await dataService.updateLicense(licenseToEdit.id, data);
                        else await dataService.addLicense(data);
                        await refreshData();
                    }}
                    licenseToEdit={licenseToEdit}
                    suppliers={suppliers}
                    categories={softwareCategories}
                />
            )}

            {showManageLicenses && (
                <ManageAssignedLicensesModal
                    equipment={showManageLicenses}
                    allLicenses={softwareLicenses}
                    allAssignments={licenseAssignments}
                    onClose={() => setShowManageLicenses(null)}
                    onSave={handleSaveLicenses}
                />
            )}

            {showAddTeam && (
                <AddTeamModal
                    onClose={() => { setShowAddTeam(false); setTeamToEdit(null); }}
                    onSave={async (data) => {
                        if (teamToEdit) await dataService.updateTeam(teamToEdit.id, data);
                        else await dataService.addTeam(data);
                        await refreshData();
                    }}
                    teamToEdit={teamToEdit}
                />
            )}

            {showManageTeamMembers && (
                <ManageTeamMembersModal
                    team={showManageTeamMembers}
                    allCollaborators={collaborators}
                    teamMembers={teamMembers}
                    onClose={() => setShowManageTeamMembers(null)}
                    onSave={async (teamId, memberIds) => {
                        await dataService.syncTeamMembers(teamId, memberIds);
                        await refreshData();
                        setShowManageTeamMembers(null);
                    }}
                />
            )}

            {showNotifications && (
                <NotificationsModal
                    onClose={() => setShowNotifications(false)}
                    expiringWarranties={expiringWarranties}
                    expiringLicenses={expiringLicenses}
                    teamTickets={activeTickets} // Simplified logic
                    collaborators={collaborators}
                    teams={teams}
                    onViewItem={(tab, filter) => {
                        setActiveTab(tab);
                        setInitialFilter(filter);
                        setShowNotifications(false);
                    }}
                    onSnooze={async (id) => {
                        await dataService.snoozeNotification(currentUser!.id, id, 'general'); // Type simplified
                        // Optimistic update or refresh
                    }}
                    currentUser={currentUser}
                    licenseAssignments={licenseAssignments}
                />
            )}

            {importConfig && (
                <ImportModal
                    config={importConfig}
                    onClose={() => setImportConfig(null)}
                    onImport={handleImportData}
                />
            )}

            {showAddCategory && (
                <AddCategoryModal
                    onClose={() => { setShowAddCategory(false); setCategoryToEdit(null); }}
                    onSave={async (data) => {
                        if (categoryToEdit) await dataService.updateTicketCategory(categoryToEdit.id, data);
                        else await dataService.addTicketCategory(data);
                        await refreshData();
                    }}
                    categoryToEdit={categoryToEdit}
                    teams={teams}
                />
            )}

            {showAddIncidentType && (
                <AddSecurityIncidentTypeModal
                    onClose={() => { setShowAddIncidentType(false); setIncidentTypeToEdit(null); }}
                    onSave={async (data) => {
                        if (incidentTypeToEdit) await dataService.updateSecurityIncidentType(incidentTypeToEdit.id, data);
                        else await dataService.addSecurityIncidentType(data);
                        await refreshData();
                    }}
                    typeToEdit={incidentTypeToEdit}
                />
            )}

            {showAddService && (
                <AddServiceModal
                    onClose={() => { setShowAddService(false); setServiceToEdit(null); }}
                    onSave={async (data) => {
                        if (serviceToEdit) await dataService.updateBusinessService(serviceToEdit.id, data);
                        else await dataService.addBusinessService(data);
                        await refreshData();
                    }}
                    serviceToEdit={serviceToEdit}
                    collaborators={collaborators}
                    suppliers={suppliers}
                />
            )}

            {showServiceDependencies && (
                <ServiceDependencyModal
                    onClose={() => setShowServiceDependencies(null)}
                    service={showServiceDependencies}
                    dependencies={serviceDependencies.filter(d => d.service_id === showServiceDependencies.id)}
                    allEquipment={equipment}
                    allLicenses={softwareLicenses}
                    onAddDependency={async (dep) => {
                        await dataService.addServiceDependency(dep);
                        await refreshData();
                    }}
                    onRemoveDependency={async (id) => {
                        await dataService.deleteServiceDependency(null, id);
                        await refreshData();
                    }}
                />
            )}

            {showAddVulnerability && (
                <AddVulnerabilityModal
                    onClose={() => { setShowAddVulnerability(false); setVulnerabilityToEdit(null); }}
                    onSave={async (data) => {
                        if (vulnerabilityToEdit) await dataService.updateVulnerability(vulnerabilityToEdit.id, data);
                        else await dataService.addVulnerability(data);
                        await refreshData();
                    }}
                    vulnToEdit={vulnerabilityToEdit}
                />
            )}

            {showAddKit && kitInitialData && (
                <AddEquipmentKitModal
                    onClose={() => setShowAddKit(false)}
                    onSaveKit={async (items) => {
                        await dataService.addMultipleEquipment(items);
                        await refreshData();
                    }}
                    brands={brands}
                    equipmentTypes={equipmentTypes}
                    initialData={kitInitialData}
                    onSaveEquipmentType={async (t) => {
                        const newType = await dataService.addEquipmentType(t);
                        await refreshData();
                        return newType;
                    }}
                    equipment={equipment}
                />
            )}

            {confirmationModal && (
                <ConfirmationModal 
                    onClose={() => setConfirmationModal(null)}
                    onConfirm={confirmationModal.onConfirm}
                    title={confirmationModal.title}
                    message={confirmationModal.message}
                />
            )}

            {showCloseTicket && (
                <CloseTicketModal
                    ticket={showCloseTicket}
                    collaborators={collaborators}
                    onClose={() => setShowCloseTicket(null)}
                    onConfirm={async (technicianId, resolutionSummary) => {
                        await dataService.updateTicket(showCloseTicket.id, {
                            status: 'Finalizado',
                            technicianId,
                            finishDate: new Date().toISOString(),
                            resolution_summary: resolutionSummary
                        });
                        await refreshData();
                        setShowCloseTicket(null);
                    }}
                    activities={ticketActivities.filter(ta => ta.ticketId === showCloseTicket.id)}
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
                    onEdit={(eq) => { setDetailEquipment(null); setEquipmentToEdit(eq); setShowAddEquipment(true); }}
                    businessServices={businessServices}
                    serviceDependencies={serviceDependencies}
                    softwareLicenses={softwareLicenses}
                    licenseAssignments={licenseAssignments}
                    vulnerabilities={vulnerabilities}
                    suppliers={suppliers}
                />
            )}

            {showAddSupplier && (
                <AddSupplierModal
                    onClose={() => { setShowAddSupplier(false); setSupplierToEdit(null); }}
                    onSave={async (data) => {
                        if (supplierToEdit) await dataService.updateSupplier(supplierToEdit.id, data);
                        else await dataService.addSupplier(data);
                        await refreshData();
                    }}
                    supplierToEdit={supplierToEdit}
                    teams={teams}
                    onCreateTicket={async (t) => {
                        await dataService.addTicket(t);
                        await refreshData();
                    }}
                    businessServices={businessServices}
                />
            )}

            {showAddBackup && (
                <AddBackupModal
                    onClose={() => { setShowAddBackup(false); setBackupToEdit(null); }}
                    onSave={async (data) => {
                        if (backupToEdit) await dataService.updateBackupExecution(backupToEdit.id, data);
                        else await dataService.addBackupExecution(data);
                        await refreshData();
                    }}
                    backupToEdit={backupToEdit}
                    currentUser={currentUser}
                    equipmentList={equipment}
                    equipmentTypes={equipmentTypes}
                    onCreateTicket={async (t) => {
                        await dataService.addTicket(t);
                        await refreshData();
                    }}
                />
            )}

            {showAutomationModal && (
                <AutomationModal onClose={() => setShowAutomationModal(false)} />
            )}

            {showAddResilienceTest && (
                <AddResilienceTestModal
                    onClose={() => { setShowAddResilienceTest(false); setResilienceTestToEdit(null); }}
                    onSave={async (data) => {
                        if (resilienceTestToEdit) await dataService.updateResilienceTest(resilienceTestToEdit.id, data);
                        else await dataService.addResilienceTest(data);
                        await refreshData();
                    }}
                    testToEdit={resilienceTestToEdit}
                    onCreateTicket={async (t) => {
                        await dataService.addTicket(t);
                        await refreshData();
                    }}
                    entidades={entidades}
                    suppliers={suppliers}
                />
            )}

            {showCalendarModal && (
                <CalendarModal
                    onClose={() => setShowCalendarModal(false)}
                    tickets={tickets}
                    currentUser={currentUser!}
                    teams={teams}
                    teamMembers={teamMembers}
                    collaborators={collaborators}
                    onViewTicket={(t) => {
                        setShowCalendarModal(false);
                        setTicketActivitiesModal(t);
                    }}
                />
            )}

            {showUserManual && (
                <UserManualModal onClose={() => setShowUserManual(false)} />
            )}

            {/* Magic Command Bar */}
            <MagicCommandBar
                brands={brands}
                types={equipmentTypes}
                collaborators={collaborators}
                currentUser={currentUser}
                onAction={handleMagicAction}
            />

        </div>
    );
};

export const App = () => (
    <LanguageProvider>
        <LayoutProvider>
            <InnerApp />
        </LayoutProvider>
    </LanguageProvider>
);
