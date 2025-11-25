


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Equipment, EquipmentStatus, EquipmentType, Brand, Assignment, Collaborator, Entidade, Instituicao, Ticket, TicketStatus,
  TicketActivity, CollaboratorHistory, Message, UserRole, CollaboratorStatus, SoftwareLicense, LicenseAssignment, Team, TeamMember,
  TicketCategoryItem, SecurityIncidentTypeItem, BusinessService, ServiceDependency, Vulnerability, CriticalityLevel, Supplier, BackupExecution, ResilienceTest, SecurityTrainingRecord,
  ConfigItem, ContactRole, ContactTitle, TooltipConfig, defaultTooltipConfig
} from './types';
import * as dataService from './services/dataService';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import EquipmentDashboard from './components/Dashboard';
import AddEquipmentModal from './components/AddEquipmentModal';
import AssignEquipmentModal from './components/AssignEquipmentModal';
import CollaboratorDashboard from './components/CollaboratorDashboard';
import AddCollaboratorModal from './components/AddCollaboratorModal';
import EntidadeDashboard from './components/EntidadeDashboard';
import AddEntidadeModal from './components/AddEntidadeModal';
import InstituicaoDashboard from './components/InstituicaoDashboard';
import AddInstituicaoModal from './components/AddInstituicaoModal';
import ReportModal from './components/ReportModal';
import CollaboratorHistoryModal from './components/CollaboratorHistoryModal';
import LoginPage from './components/LoginPage';
import CollaboratorDetailModal from './components/CollaboratorDetailModal';
import TicketDashboard from './components/TicketDashboard';
import AddTicketModal from './components/AddTicketModal';
import TicketActivitiesModal from './components/TicketActivitiesModal';
import ConfigurationSetup from './components/ConfigurationSetup';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LayoutProvider, useLayout } from './contexts/LayoutContext';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import CredentialsModal from './components/CredentialsModal';
import { getSupabase } from './services/supabaseClient';
// import { Session } from '@supabase/supabase-js';
import AddEquipmentTypeModal from './components/AddEquipmentTypeModal';
import AddBrandModal from './components/AddBrandModal';
import { ChatWidget } from './components/ChatWidget';
import LicenseDashboard from './components/LicenseDashboard';
import AddLicenseModal from './components/AddLicenseModal';
import ManageAssignedLicensesModal from './components/ManageAssignedLicensesModal';
import TeamDashboard from './components/TeamDashboard';
import AddTeamModal from './components/AddTeamModal';
import ManageTeamMembersModal from './components/ManageTeamMembersModal';
import NotificationsModal from './components/NotificationsModal';
import ImportModal, { ImportConfig } from './components/ImportModal';
import OverviewDashboard from './components/OverviewDashboard';
import AddCategoryModal from './components/AddCategoryModal';
import AddSecurityIncidentTypeModal from './components/AddSecurityIncidentTypeModal';
import ServiceDashboard from './components/ServiceDashboard';
import AddServiceModal from './components/AddServiceModal';
import ServiceDependencyModal from './components/ServiceDependencyModal';
import VulnerabilityDashboard from './components/VulnerabilityDashboard';
import AddVulnerabilityModal from './components/AddVulnerabilityModal';
import PrintPreviewModal from './components/PrintPreviewModal';
import AddEquipmentKitModal from './components/AddEquipmentKitModal';
import ConfirmationModal from './components/common/ConfirmationModal';
import CloseTicketModal from './components/CloseTicketModal';
import EquipmentHistoryModal from './components/EquipmentHistoryModal';
import SupplierDashboard from './components/SupplierDashboard';
import AddSupplierModal from './components/AddSupplierModal';
import BackupDashboard from './components/BackupDashboard';
import AddBackupModal from './components/AddBackupModal';
import AutomationModal from './components/AutomationModal';
import MagicCommandBar from './components/MagicCommandBar';
import ResilienceDashboard from './components/ResilienceDashboard';
import AddResilienceTestModal from './components/AddResilienceTestModal';
import SmartDashboard from './components/SmartDashboard';
import CalendarModal from './components/CalendarModal';
import UserManualModal from './components/UserManualModal';
import AgendaDashboard from './components/AgendaDashboard';
import MapDashboard from './components/MapDashboard';
import AuxiliaryDataDashboard from './components/AuxiliaryDataDashboard';
import { checkAndRunAutoScan } from './services/automationService';

type Session = any;

const InnerApp: React.FC = () => {
    const { t } = useLanguage();
    const { layoutMode } = useLayout();
    
    // Initialize activeTab from URL hash if present
    const getTabFromHash = () => {
        const hash = window.location.hash.replace('#', '');
        return hash || 'overview';
    };

    const [activeTab, setActiveTabState] = useState(getTabFromHash());
    const [initialFilter, setInitialFilter] = useState<any>(null);
    
    // Update URL hash when tab changes
    const setActiveTab = (tab: string) => {
        setActiveTabState(tab);
        window.location.hash = tab;
    };

    // Listen for hash changes (e.g., back button or manual URL change)
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
    
    // UI State for Sidebar Expansion
    const [sidebarExpanded, setSidebarExpanded] = useState(false);

    // State for Data
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

    // Configuration Tables State
    const [configEquipmentStatuses, setConfigEquipmentStatuses] = useState<ConfigItem[]>([]);
    const [configUserRoles, setConfigUserRoles] = useState<ConfigItem[]>([]);
    const [configCriticalityLevels, setConfigCriticalityLevels] = useState<ConfigItem[]>([]);
    const [configCiaRatings, setConfigCiaRatings] = useState<ConfigItem[]>([]);
    const [configServiceStatuses, setConfigServiceStatuses] = useState<ConfigItem[]>([]);
    const [configBackupTypes, setConfigBackupTypes] = useState<ConfigItem[]>([]);
    const [configTrainingTypes, setConfigTrainingTypes] = useState<ConfigItem[]>([]);
    const [configResilienceTestTypes, setConfigResilienceTestTypes] = useState<ConfigItem[]>([]);
    const [contactRoles, setContactRoles] = useState<ContactRole[]>([]);
    const [contactTitles, setContactTitles] = useState<ContactTitle[]>([]);
    
    // App Config State
    const [tooltipConfig, setTooltipConfig] = useState<TooltipConfig>(defaultTooltipConfig);

    // UI State
    const [isConfigured, setIsConfigured] = useState(!!localStorage.getItem('SUPABASE_URL'));
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [showAddEquipment, setShowAddEquipment] = useState(false);
    const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
    // New State for AI Pre-filling
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
    // New State for AI Pre-filling
    const [initialTicketData, setInitialTicketData] = useState<Partial<Ticket> | null>(null);
    // New State for Linking Ticket to Vulnerability
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
    const [equipmentForHistory, setEquipmentForHistory] = useState<Equipment | null>(null);
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
    const [showAddBackup, setShowAddBackup] = useState(false);
    const [backupToEdit, setBackupToEdit] = useState<BackupExecution | null>(null);
    const [showAutomationModal, setShowAutomationModal] = useState(false);
    
    const [showAddResilienceTest, setShowAddResilienceTest] = useState(false);
    const [resilienceTestToEdit, setResilienceTestToEdit] = useState<ResilienceTest | null>(null);
    
    // New Modals for User Menu
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
            setContactRoles(data.contactRoles);
            setContactTitles(data.contactTitles);
            
            // Load Tooltip Config with fallback merge
            const tooltipSetting = await dataService.getGlobalSetting('tooltip_config');
            if (tooltipSetting) {
                try {
                    const parsedConfig = JSON.parse(tooltipSetting);
                    // Merge with default to ensure new fields are present
                    setTooltipConfig({ ...defaultTooltipConfig, ...parsedConfig });
                } catch (e) { console.error("Error parsing tooltip config", e); }
            }

        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    }, [isConfigured]);

    // Auth & Session
    useEffect(() => {
        if (!isConfigured) return;

        const supabase = getSupabase();
        (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
            setSession(session);
            if (session) loadUser(session.user.id);
            else setLoading(false);
            
            // Check for password recovery flow
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
    
    // Fetch data periodically or on load
    useEffect(() => {
        if (session) {
            refreshData();
            // Auto Scan Check (Automation)
            checkAndRunAutoScan();
            const interval = setInterval(refreshData, 30000); // Refresh every 30s
            return () => clearInterval(interval);
        }
    }, [session, refreshData]);

    const loadUser = async (userId: string) => {
        try {
             const data = await dataService.fetchAllData(); // Ensure we have data
             const user = data.collaborators.find((c: any) => c.id === userId);
             if (user) {
                 setCurrentUser(user);
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
                 
                 // Configs
                 setConfigEquipmentStatuses(data.configEquipmentStatuses);
                 setConfigUserRoles(data.configUserRoles);
                 setConfigCriticalityLevels(data.configCriticalityLevels);
                 setConfigCiaRatings(data.configCiaRatings);
                 setConfigServiceStatuses(data.configServiceStatuses);
                 setConfigBackupTypes(data.configBackupTypes);
                 setConfigTrainingTypes(data.configTrainingTypes);
                 setConfigResilienceTestTypes(data.configResilienceTestTypes);
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
    
    // Role Based Access Logic
    const isAdmin = currentUser?.role === UserRole.Admin;
    const isBasic = currentUser?.role === UserRole.Basic || currentUser?.role === UserRole.Utilizador;

    // Set default tab for Basic Users
    useEffect(() => {
        if (isBasic && activeTab === 'overview') {
            setActiveTab('tickets.list');
        }
    }, [isBasic, activeTab]);

    // --- Magic Command Bar Logic ---
    const handleMagicAction = (intent: string, data: any) => {
        if (intent === 'search') {
            // Simple Global Search implementation (could be improved)
            if (data.query) {
                const query = data.query.toLowerCase();
                // Heuristic: if starts with "ticket", switch to tickets tab
                if (query.includes('ticket') || query.includes('suporte')) {
                    setActiveTab('tickets.list');
                    setInitialFilter({ status: '', description: query }); // Fake property just for context
                } else if (query.includes('user') || query.includes('colaborador')) {
                    setActiveTab('collaborators');
                } else {
                    setActiveTab('equipment.inventory');
                    setInitialFilter({ description: data.query });
                }
            }
        } else if (intent === 'create_equipment') {
            // Resolve IDs from names
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

    // --- Import Handling ---
    const handleImportData = async (dataType: ImportConfig['dataType'], data: any[]) => {
        try {
            let successCount = 0;
            for (const item of data) {
                try {
                    if (dataType === 'instituicoes') {
                        await dataService.addInstituicao(item);
                        successCount++;
                    } else if (dataType === 'entidades') {
                        await dataService.addEntidade(item);
                        successCount++;
                    }
                    // Add other types if needed
                } catch (e) {
                    console.error(`Error importing item in ${dataType}:`, item, e);
                }
            }
            await refreshData();
            return { success: true, message: `Importação concluída. ${successCount} registos importados com sucesso.` };
        } catch (e) {
            console.error("Import failed", e);
            return { success: false, message: "Erro fatal na importação." };
        }
    };

    const handleLogin = async () => {
        return { success: true };
    };

    const handleLogout = async () => {
        const supabase = getSupabase();
        await (supabase.auth as any).signOut();
        setCurrentUser(null);
        setSession(null);
    };
    
    const handleGenerateSecurityReport = (ticket: Ticket) => {
        // ... (existing logic kept)
        const entity = entidades.find(e => e.id === ticket.entidadeId);
        const requester = collaborators.find(c => c.id === ticket.collaboratorId);
        const technician = ticket.technicianId ? collaborators.find(c => c.id === ticket.technicianId) : null;
        const affectedEquipment = ticket.equipmentId ? equipment.find(e => e.id === ticket.equipmentId) : null;
        const activities = ticketActivities.filter(ta => ta.ticketId === ticket.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const collaboratorMap = new Map(collaborators.map(c => [c.id, c.fullName]));

        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6;">
                <div style="border-bottom: 3px solid #c0392b; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="margin: 0; font-size: 24px; color: #c0392b;">Notificação de Incidente de Segurança</h1>
                        <span style="font-size: 12px; color: #666; text-transform: uppercase;">Conformidade NIS2 / RGPD</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 14px;">ID: #${ticket.id.substring(0,8)}</div>
                        <div style="font-size: 12px;">Data: ${new Date().toLocaleDateString()}</div>
                    </div>
                </div>
                <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                    <h3 style="margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 5px;">1. Identificação</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px; font-weight: bold; width: 30%;">Organização Afetada:</td>
                            <td style="padding: 5px;">${entity?.name || 'N/A'} (${entity?.codigo || '-'})</td>
                        </tr>
                         <tr>
                            <td style="padding: 5px; font-weight: bold;">Reportado Por:</td>
                            <td style="padding: 5px;">${requester?.fullName || 'N/A'} (${requester?.email || '-'})</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; font-weight: bold;">Responsável Técnico:</td>
                            <td style="padding: 5px;">${technician?.fullName || 'Não atribuído'}</td>
                        </tr>
                    </table>
                </div>
                <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">2. Detalhes do Incidente</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px; font-weight: bold; width: 30%;">Tipo de Incidente:</td>
                            <td style="padding: 5px; color: #c0392b; font-weight: bold;">${ticket.securityIncidentType || 'Genérico'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; font-weight: bold;">Data/Hora Deteção:</td>
                            <td style="padding: 5px;">${new Date(ticket.requestDate).toLocaleString()}</td>
                        </tr>
                         <tr>
                            <td style="padding: 5px; font-weight: bold;">Estado Atual:</td>
                            <td style="padding: 5px;">${ticket.status}</td>
                        </tr>
                    </table>
                    <div style="margin-top: 10px;">
                        <span style="font-weight: bold; display: block; margin-bottom: 5px;">Descrição:</span>
                        <div style="padding: 10px; background-color: #fff; border: 1px solid #eee; font-style: italic;">
                            "${ticket.description}"
                        </div>
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">3. Análise de Impacto (C-I-A)</h3>
                    <table style="width: 100%; border: 1px solid #ddd; text-align: center; border-collapse: collapse;">
                        <thead style="background-color: #eee;">
                            <tr>
                                <th style="padding: 8px; border: 1px solid #ddd;">Criticidade Global</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Confidencialidade</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Integridade</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Disponibilidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #c0392b;">${ticket.impactCriticality || 'N/A'}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${ticket.impactConfidentiality || 'N/A'}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${ticket.impactIntegrity || 'N/A'}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${ticket.impactAvailability || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                ${affectedEquipment ? `
                <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">4. Ativos Comprometidos</h3>
                     <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px; font-weight: bold; width: 30%;">Equipamento:</td>
                            <td style="padding: 5px;">${affectedEquipment.description}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; font-weight: bold;">Marca/Modelo:</td>
                            <td style="padding: 5px;">${brands.find(b => b.id === affectedEquipment.brandId)?.name} / ${equipmentTypes.find(t => t.id === affectedEquipment.typeId)?.name}</td>
                        </tr>
                         <tr>
                            <td style="padding: 5px; font-weight: bold;">Nº Série:</td>
                            <td style="padding: 5px;">${affectedEquipment.serialNumber}</td>
                        </tr>
                    </table>
                </div>
                ` : ''}
                 <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">5. Cronologia de Resposta</h3>
                    ${activities.length > 0 ? `
                        <ul style="list-style-type: none; padding: 0;">
                            ${activities.map(act => `
                                <li style="margin-bottom: 10px; padding-left: 15px; border-left: 2px solid #ccc;">
                                    <div style="font-size: 11px; color: #777;">${new Date(act.date).toLocaleString()} - ${collaboratorMap.get(act.technicianId) || 'Técnico'}</div>
                                    <div style="font-size: 13px;">${act.description}</div>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p style="color: #777; font-style: italic;">Nenhuma intervenção registada até ao momento.</p>'}
                </div>
                <div style="margin-top: 50px; border-top: 2px solid #333; padding-top: 10px; display: flex; justify-content: space-between;">
                    <div style="text-align: center; width: 40%;">
                        <br><br>
                        <div style="border-top: 1px solid #999; font-size: 12px;">Assinatura do Responsável de Segurança</div>
                    </div>
                     <div style="text-align: center; width: 40%;">
                        <br><br>
                        <div style="border-top: 1px solid #999; font-size: 12px;">Data de Fecho / Aprovação</div>
                    </div>
                </div>
            </div>
        `;
        setSecurityReportHtml(html);
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
            // IMPROVED ERROR MESSAGE: Show specific error from DB if available
            alert(`Erro ao salvar dados: ${e.message || e.code || 'Erro desconhecido'}. Verifique a consola para mais detalhes.`);
            return null;
        }
    };

    const handleDelete = (title: string, message: string, onConfirm: () => void) => {
        setConfirmationModal({ show: true, title, message, onConfirm: () => { onConfirm(); setConfirmationModal(null); } });
    };
    
    const expiringWarranties = useMemo(() => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        return equipment.filter(e => {
            if (!e.warrantyEndDate) return false;
            const date = new Date(e.warrantyEndDate);
            return date <= thirtyDaysFromNow; 
        });
    }, [equipment]);

    const expiringLicenses = useMemo(() => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        const usedSeatsMap = licenseAssignments.reduce((acc, assignment) => {
            acc.set(assignment.softwareLicenseId, (acc.get(assignment.softwareLicenseId) || 0) + 1);
            return acc;
        }, new Map<string, number>());

        return softwareLicenses.filter(l => {
            if (l.is_oem) return false; // OEM/Unlimited doesn't expire in same way
            const isExpiring = l.expiryDate ? new Date(l.expiryDate) <= thirtyDaysFromNow : false;
            const used = usedSeatsMap.get(l.id) || 0;
            const isDepleted = l.totalSeats - used <= 0;
            return isExpiring || isDepleted;
        });
    }, [softwareLicenses, licenseAssignments]);

    const activeTickets = useMemo(() => {
        return tickets.filter(t => t.status !== TicketStatus.Finished && (!t.technicianId || t.technicianId === currentUser?.id));
    }, [tickets, currentUser]);

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
    
    // Define Tabs Config based on role
    const tabConfig: any = {
        'overview': !isBasic ? 'Visão Geral' : undefined, // Hide Overview for Basic users
        'overview.smart': isAdmin ? 'C-Level Dashboard' : undefined, // Only Admin sees Smart Dashboard
        'equipment.inventory': 'Inventário',
        'organizacao.instituicoes': 'Instituições',
        'organizacao.entidades': 'Entidades',
        'organizacao.teams': 'Equipas',
        'collaborators': 'Colaboradores',
        'licensing': 'Licenciamento',
        'organizacao.suppliers': 'Fornecedores (Risco)',
        'tickets': { title: 'Tickets', list: 'Lista de Tickets' },
        'nis2': { title: 'Compliance', bia: 'BIA (Serviços)', security: 'Segurança (CVE)', backups: 'Backups & Logs', resilience: 'Testes Resiliência' },
        'tools': { title: 'Tools', agenda: 'Agenda de contactos', map: 'Pesquisa no Mapa' },
        'settings': isAdmin ? 'Configurações' : undefined
    };

    return (
        <div className={`min-h-screen bg-background-dark flex ${layoutMode === 'side' ? 'flex-row' : 'flex-col'}`}>
            {layoutMode === 'top' ? (
                <Header 
                    currentUser={currentUser} 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    onLogout={handleLogout}
                    tabConfig={tabConfig}
                    notificationCount={notificationCount}
                    onNotificationClick={() => setShowNotifications(true)}
                    onOpenAutomation={() => setShowAutomationModal(true)}
                    onOpenProfile={() => setShowProfileModal(true)}
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
                    onOpenAutomation={() => setShowAutomationModal(true)}
                    onOpenProfile={() => setShowProfileModal(true)}
                    onOpenCalendar={() => setShowCalendarModal(true)}
                    onOpenManual={() => setShowUserManual(true)}
                />
            )}

            <main className={`flex-grow p-4 sm:p-6 lg:p-8 transition-all duration-300 ease-in-out ${
                layoutMode === 'side' 
                    ? `${sidebarExpanded ? 'ml-64' : 'ml-20'} w-auto bg-background-dark min-h-screen`
                    : 'max-w-screen-xl mx-auto w-full' // Topbar mode: centered, max width
            }`}>
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

                {activeTab === 'settings' && isAdmin && (
                    <AuxiliaryDataDashboard
                        configTables={[
                            { tableName: 'config_equipment_statuses', label: 'Estados de Equipamento', data: configEquipmentStatuses },
                            { tableName: 'config_user_roles', label: 'Perfis de Utilizador', data: configUserRoles },
                            { tableName: 'config_criticality_levels', label: 'Níveis de Criticidade', data: configCriticalityLevels },
                            { tableName: 'config_cia_ratings', label: 'Classificação CIA', data: configCiaRatings },
                            { tableName: 'config_service_statuses', label: 'Estados de Serviço', data: configServiceStatuses },
                            { tableName: 'config_backup_types', label: 'Tipos de Backup', data: configBackupTypes },
                            { tableName: 'config_training_types', label: 'Tipos de Formação', data: configTrainingTypes },
                            { tableName: 'config_resilience_test_types', label: 'Tipos de Teste Resiliência', data: configResilienceTestTypes },
                            { tableName: 'contact_roles', label: 'Funções de Contacto', data: contactRoles },
                            { tableName: 'contact_titles', label: 'Tratos (Honoríficos)', data: contactTitles }
                        ]}
                        onRefresh={refreshData}
                        // Pass complex data
                        brands={brands}
                        equipment={equipment}
                        equipmentTypes={equipmentTypes}
                        ticketCategories={ticketCategories}
                        tickets={tickets}
                        teams={teams}
                        securityIncidentTypes={securityIncidentTypes}
                        // NEW PROPS for integrity checks
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

                        // Pass complex handlers
                        onCreateBrand={() => { setBrandToEdit(null); setShowAddBrand(true); }}
                        onEditBrand={(b) => { setBrandToEdit(b); setShowAddBrand(true); }}
                        onDeleteBrand={(id) => handleDelete('Excluir Marca', 'Tem a certeza? Esta ação não pode ser desfeita.', () => simpleSaveWrapper(dataService.deleteBrand, id))}
                        
                        onCreateType={() => { setTypeToEdit(null); setShowAddType(true); }}
                        onEditType={(t) => { setTypeToEdit(t); setShowAddType(true); }}
                        onDeleteType={(id) => handleDelete('Excluir Tipo', 'Tem a certeza? Esta ação não pode ser desfeita.', () => simpleSaveWrapper(dataService.deleteEquipmentType, id))}
                        
                        onCreateCategory={() => { setCategoryToEdit(null); setShowAddCategory(true); }}
                        onEditCategory={(c) => { setCategoryToEdit(c); setShowAddCategory(true); }}
                        onDeleteCategory={(id) => handleDelete('Excluir Categoria', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteTicketCategory, id))}
                        onToggleCategoryStatus={(id) => {
                            const cat = ticketCategories.find(c => c.id === id);
                            if (cat) simpleSaveWrapper(dataService.updateTicketCategory, { is_active: !cat.is_active }, id);
                        }}

                        onCreateIncidentType={() => { setIncidentTypeToEdit(null); setShowAddIncidentType(true); }}
                        onEditIncidentType={(t) => { setIncidentTypeToEdit(t); setShowAddIncidentType(true); }}
                        onDeleteIncidentType={(id) => handleDelete('Excluir Tipo Incidente', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteSecurityIncidentType, id))}
                        onToggleIncidentTypeStatus={(id) => {
                            const type = securityIncidentTypes.find(t => t.id === id);
                            if (type) simpleSaveWrapper(dataService.updateSecurityIncidentType, { is_active: !type.is_active }, id);
                        }}
                        
                        onSaveTooltipConfig={setTooltipConfig}
                    />
                )}

                {activeTab === 'tickets.list' && (
                    <TicketDashboard
                        tickets={tickets}
                        escolasDepartamentos={entidades}
                        collaborators={collaborators}
                        teams={teams}
                        equipment={equipment}
                        equipmentTypes={equipmentTypes}
                        categories={ticketCategories}
                        initialFilter={initialFilter}
                        onClearInitialFilter={() => setInitialFilter(null)}
                        onUpdateTicket={(t) => simpleSaveWrapper(dataService.updateTicket, t, t.id)}
                        onEdit={(t) => { setTicketToEdit(t); setShowAddTicket(true); }}
                        onOpenCloseTicketModal={(t) => setShowCloseTicket(t)}
                        onOpenActivities={(t) => setTicketActivitiesModal(t)}
                        onGenerateReport={() => setShowReport({ type: 'ticket', visible: true })}
                        onGenerateSecurityReport={handleGenerateSecurityReport}
                        onCreate={() => { setTicketToEdit(null); setInitialTicketData(null); setShowAddTicket(true); }}
                    />
                )}
                
                    {activeTab === 'equipment.inventory' && (
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
                            onShowHistory={(eq) => setEquipmentForHistory(eq)} // Keep passing prop for the button
                            onEdit={(eq) => { setEquipmentToEdit(eq); setShowAddEquipment(true); }}
                            businessServices={businessServices}
                            serviceDependencies={serviceDependencies}
                            onGenerateReport={() => setShowReport({ type: 'equipment', visible: true })}
                            onManageKeys={(eq) => setShowManageLicenses(eq)}
                            onCreate={() => { setEquipmentToEdit(null); setInitialEquipmentData(null); setShowAddEquipment(true); }}
                            softwareLicenses={softwareLicenses}
                            licenseAssignments={licenseAssignments}
                            vulnerabilities={vulnerabilities}
                            suppliers={suppliers}
                            tooltipConfig={tooltipConfig}
                        />
                    )}
                
                {activeTab === 'organizacao.instituicoes' && (
                    <InstituicaoDashboard
                        instituicoes={instituicoes}
                        escolasDepartamentos={entidades}
                        collaborators={collaborators}
                        onEdit={(i) => { setInstituicaoToEdit(i); setShowAddInstituicao(true); }}
                        onDelete={(id) => handleDelete('Excluir Instituição', 'Tem a certeza que deseja excluir esta instituição?', () => simpleSaveWrapper(dataService.deleteInstituicao, id))}
                        onCreate={() => { setInstituicaoToEdit(null); setShowAddInstituicao(true); }}
                        onAddEntity={(instId) => { 
                            setEntidadeToEdit({ instituicaoId: instId } as Entidade); 
                            setShowAddEntidade(true); 
                        }}
                        onCreateCollaborator={() => { setCollaboratorToEdit(null); setShowAddCollaborator(true); }}
                        onImport={() => setImportConfig({
                            dataType: 'instituicoes',
                            title: 'Importar Instituições',
                            templateFileName: 'template_instituicoes.xlsx',
                            columnMap: { name: 'Nome', codigo: 'Código', email: 'Email', telefone: 'Telefone', nif: 'NIF', address: 'Morada' }
                        })}
                        assignments={assignments} // Pass assignments to allow drilling down
                        onEditEntity={(e) => {
                            setEntidadeToEdit(e);
                            setShowAddEntidade(true);
                        }}
                        // Pass Data for Detailed Modal
                        equipment={equipment}
                        brands={brands}
                        equipmentTypes={equipmentTypes}
                        // Toggle Status Handler
                        onToggleStatus={(id) => {
                            const inst = instituicoes.find(i => i.id === id);
                            if (inst) {
                                const newStatus = inst.is_active !== false ? false : true; // Toggle logic (default true)
                                simpleSaveWrapper(dataService.updateInstituicao, { is_active: newStatus }, id);
                            }
                        }}
                    />
                )}

                {activeTab === 'organizacao.entidades' && (
                    <EntidadeDashboard
                        escolasDepartamentos={entidades}
                        instituicoes={instituicoes}
                        collaborators={collaborators}
                        assignments={assignments}
                        tickets={tickets}
                        collaboratorHistory={collaboratorHistory}
                        onEdit={(e) => { setEntidadeToEdit(e); setShowAddEntidade(true); }}
                        onDelete={(id) => handleDelete('Excluir Entidade', 'Tem a certeza que deseja excluir esta entidade?', () => simpleSaveWrapper(dataService.deleteEntidade, id))}
                        onCreate={() => { setEntidadeToEdit(null); setShowAddEntidade(true); }}
                        onToggleStatus={(id) => {
                            const ent = entidades.find(e => e.id === id);
                            if (ent) {
                                const newStatus = ent.status === 'Ativo' ? 'Inativo' : 'Ativo';
                                simpleSaveWrapper(dataService.updateEntidade, { status: newStatus }, id);
                            }
                        }}
                        onAddCollaborator={(entId) => {
                            setCollaboratorToEdit({ entidadeId: entId } as Collaborator);
                            setShowAddCollaborator(true);
                        }}
                        onAssignEquipment={(entId) => {
                            // Trigger Assign Modal logic if needed, or navigate
                            setActiveTab('equipment.inventory');
                        }}
                        onImport={() => setImportConfig({
                            dataType: 'entidades',
                            title: 'Importar Entidades',
                            templateFileName: 'template_entidades.xlsx',
                            columnMap: { name: 'Nome', codigo: 'Código', email: 'Email', telefone: 'Telefone', nif: 'NIF', address: 'Morada', responsavel: 'Responsável' }
                        })}
                        // Pass Data for Detailed Modal
                        equipment={equipment}
                        brands={brands}
                        equipmentTypes={equipmentTypes}
                    />
                )}

                {activeTab === 'collaborators' && (
                    <CollaboratorDashboard
                        collaborators={collaborators}
                        escolasDepartamentos={entidades}
                        equipment={equipment}
                        assignments={assignments}
                        tickets={tickets}
                        ticketActivities={ticketActivities}
                        teamMembers={teamMembers}
                        collaboratorHistory={collaboratorHistory}
                        messages={messages}
                        currentUser={currentUser}
                        onEdit={(c) => { setCollaboratorToEdit(c); setShowAddCollaborator(true); }}
                        onDelete={(id) => handleDelete('Excluir Colaborador', 'Tem a certeza que deseja excluir este colaborador?', () => simpleSaveWrapper(dataService.deleteCollaborator, id))}
                        onShowHistory={(c) => { setHistoryCollaborator(c); }}
                        onShowDetails={(c) => { setDetailCollaborator(c); }}
                        onGenerateReport={() => setShowReport({ type: 'collaborator', visible: true })}
                        onStartChat={(c) => { setActiveChatCollaboratorId(c.id); setIsChatOpen(true); }}
                        onCreate={() => { setCollaboratorToEdit(null); setShowAddCollaborator(true); }}
                        onToggleStatus={(id) => {
                            const col = collaborators.find(c => c.id === id);
                            if (col) {
                                const newStatus = col.status === 'Ativo' ? 'Inativo' : 'Ativo';
                                simpleSaveWrapper(dataService.updateCollaborator, { status: newStatus }, id);
                            }
                        }}
                        tooltipConfig={tooltipConfig}
                    />
                )}

                {activeTab === 'licensing' && (
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
                        onEdit={(l) => { setLicenseToEdit(l); setShowAddLicense(true); }}
                        onDelete={(id) => handleDelete('Excluir Licença', 'Tem a certeza que deseja excluir esta licença?', () => simpleSaveWrapper(dataService.deleteLicense, id))}
                        onToggleStatus={(id) => {
                            const lic = softwareLicenses.find(l => l.id === id);
                            if (lic) {
                                const newStatus = lic.status === 'Ativo' ? 'Inativo' : 'Ativo';
                                simpleSaveWrapper(dataService.updateLicense, { status: newStatus }, id);
                            }
                        }}
                        onGenerateReport={() => setShowReport({ type: 'licensing', visible: true })}
                        businessServices={businessServices}
                        serviceDependencies={serviceDependencies}
                        onCreate={() => { setLicenseToEdit(null); setShowAddLicense(true); }}
                    />
                )}

                {activeTab === 'organizacao.teams' && (
                    <TeamDashboard
                        teams={teams}
                        teamMembers={teamMembers}
                        collaborators={collaborators}
                        tickets={tickets}
                        equipmentTypes={equipmentTypes}
                        onEdit={(t) => { setTeamToEdit(t); setShowAddTeam(true); }}
                        onDelete={(id) => handleDelete('Excluir Equipa', 'Tem a certeza que deseja excluir esta equipa?', () => simpleSaveWrapper(dataService.deleteTeam, id))}
                        onManageMembers={(t) => { setTeamToEdit(t); setShowManageTeamMembers(t); }}
                        onCreate={() => { setTeamToEdit(null); setShowAddTeam(true); }}
                        // Toggle Status Handler
                        onToggleStatus={(id) => {
                            const team = teams.find(t => t.id === id);
                            if (team) {
                                const newStatus = team.is_active !== false ? false : true;
                                simpleSaveWrapper(dataService.updateTeam, { is_active: newStatus }, id);
                            }
                        }}
                    />
                )}

                {activeTab === 'organizacao.suppliers' && (
                    <SupplierDashboard
                        suppliers={suppliers}
                        onEdit={(s) => { setSupplierToEdit(s); setShowAddSupplier(true); }}
                        onDelete={(id) => handleDelete('Excluir Fornecedor', 'Tem a certeza? Esta ação não pode ser desfeita.', () => simpleSaveWrapper(dataService.deleteSupplier, id))}
                        onCreate={() => { setSupplierToEdit(null); setShowAddSupplier(true); }}
                        businessServices={businessServices}
                        // Toggle Status Handler
                        onToggleStatus={(id) => {
                            const sup = suppliers.find(s => s.id === id);
                            if (sup) {
                                const newStatus = sup.is_active !== false ? false : true;
                                simpleSaveWrapper(dataService.updateSupplier, { is_active: newStatus }, id);
                            }
                        }}
                    />
                )}

                {activeTab === 'tools.agenda' && (
                    <AgendaDashboard />
                )}

                {activeTab === 'tools.map' && (
                    <MapDashboard 
                        instituicoes={instituicoes}
                        entidades={entidades}
                        suppliers={suppliers}
                    />
                )}

                {activeTab === 'nis2.bia' && (
                    <ServiceDashboard
                        services={businessServices}
                        dependencies={serviceDependencies}
                        collaborators={collaborators}
                        onEdit={(s) => { setServiceToEdit(s); setShowAddService(true); }}
                        onDelete={(id) => handleDelete('Excluir Serviço BIA', 'Tem a certeza? Isto removerá todas as dependências mapeadas.', () => simpleSaveWrapper(dataService.deleteBusinessService, id))}
                        onManageDependencies={(s) => { setServiceToEdit(s); setShowServiceDependencies(s); }}
                        onCreate={() => { setServiceToEdit(null); setShowAddService(true); }}
                        onGenerateReport={() => setShowReport({ type: 'bia', visible: true })}
                    />
                )}

                {activeTab === 'nis2.security' && (
                    <VulnerabilityDashboard
                        vulnerabilities={vulnerabilities}
                        initialFilter={initialFilter}
                        onClearInitialFilter={() => setInitialFilter(null)}
                        onEdit={(v) => { setVulnerabilityToEdit(v); setShowAddVulnerability(true); }}
                        onDelete={(id) => handleDelete('Excluir Vulnerabilidade', 'Tem a certeza que deseja excluir este registo?', () => simpleSaveWrapper(dataService.deleteVulnerability, id))}
                        onCreate={() => { setVulnerabilityToEdit(null); setShowAddVulnerability(true); }}
                        onCreateTicket={(vuln) => {
                            // Prepare Ticket Data from Vuln
                            setTicketToEdit(null);
                            setVulnIdForTicketCreation(vuln.id);
                            setInitialTicketData({
                                title: `Resolução Vulnerabilidade: ${vuln.cve_id}`,
                                description: `Vulnerabilidade Detetada: ${vuln.description}\n\nSoftware Afetado: ${vuln.affected_software}\n\nRemediação Recomendada: ${vuln.remediation || 'Ver detalhes CVE'}`,
                                category: 'Incidente de Segurança',
                                securityIncidentType: 'VulnerabilityExploit',
                                impactCriticality: vuln.severity,
                                status: 'Pedido',
                                requestDate: new Date().toISOString()
                            });
                            setShowAddTicket(true);
                        }}
                    />
                )}
                
                {activeTab === 'nis2.backups' && (
                    <BackupDashboard
                        backups={backupExecutions}
                        collaborators={collaborators}
                        equipment={equipment}
                        onEdit={(b) => { setBackupToEdit(b); setShowAddBackup(true); }}
                        onDelete={(id) => handleDelete('Excluir Teste de Backup', 'Tem a certeza?', () => simpleSaveWrapper(dataService.deleteBackupExecution, id))}
                        onCreate={() => { setBackupToEdit(null); setShowAddBackup(true); }}
                    />
                )}

                {activeTab === 'nis2.resilience' && (
                    <ResilienceDashboard
                        resilienceTests={resilienceTests}
                        onCreate={() => { setResilienceTestToEdit(null); setShowAddResilienceTest(true); }}
                        onEdit={(t) => { setResilienceTestToEdit(t); setShowAddResilienceTest(true); }}
                        onDelete={(id) => handleDelete('Excluir Teste', 'Tem a certeza? Os relatórios associados serão perdidos.', () => simpleSaveWrapper(dataService.deleteResilienceTest, id))}
                        onCreateTicket={(t) => simpleSaveWrapper(dataService.addTicket, { ...t, entidadeId: entidades[0]?.id, collaboratorId: currentUser?.id } as Ticket)}
                    />
                )}
                
                {importConfig && (
                    <ImportModal
                        config={importConfig}
                        onClose={() => setImportConfig(null)}
                        onImport={handleImportData}
                    />
                )}
                
                {showNotifications && (
                    <NotificationsModal
                        onClose={() => setShowNotifications(false)}
                        expiringWarranties={expiringWarranties}
                        expiringLicenses={expiringLicenses}
                        teamTickets={activeTickets} // Should filter by team if needed
                        collaborators={collaborators}
                        teams={teams}
                        onViewItem={(tab, filter) => { setShowNotifications(false); setActiveTab(tab); setInitialFilter(filter); }}
                        onSnooze={(id) => simpleSaveWrapper(dataService.snoozeNotification, id)}
                        currentUser={currentUser}
                        licenseAssignments={licenseAssignments}
                    />
                )}

                {showReport.visible && (
                    <ReportModal
                        type={showReport.type as any}
                        onClose={() => setShowReport({ ...showReport, visible: false })}
                        equipment={equipment}
                        brandMap={brandMap}
                        equipmentTypeMap={equipmentTypeMap}
                        instituicoes={instituicoes}
                        escolasDepartamentos={entidades}
                        collaborators={collaborators}
                        assignments={assignments}
                        tickets={tickets}
                        // Pass props for BIA & License Reports
                        softwareLicenses={softwareLicenses}
                        licenseAssignments={licenseAssignments}
                        businessServices={businessServices}
                        serviceDependencies={serviceDependencies}
                    />
                )}

                {showAddLicense && (
                    <AddLicenseModal
                        onClose={() => setShowAddLicense(false)}
                        onSave={(lic) => {
                            if (licenseToEdit) return simpleSaveWrapper(dataService.updateLicense, lic, licenseToEdit.id);
                            return simpleSaveWrapper(dataService.addLicense, lic);
                        }}
                        licenseToEdit={licenseToEdit}
                        suppliers={suppliers}
                    />
                )}

                {/* Add/Edit Collaborator Modal */}
                {showAddCollaborator && (
                    <AddCollaboratorModal
                        onClose={() => setShowAddCollaborator(false)}
                        onSave={(collab, password) => {
                            // If saving with password (new user), use specific logic in dataService if needed, or just pass
                            // Currently App handles simple save wrapper, but password needs to go to auth
                            // We'll implement a custom save here to handle auth creation if needed
                            const saveCollaborator = async () => {
                                try {
                                    let result;
                                    if (collaboratorToEdit) {
                                        result = await dataService.updateCollaborator(collaboratorToEdit.id, collab);
                                    } else {
                                        result = await dataService.addCollaborator(collab);
                                        if (password && result?.id) {
                                            // Create Auth User logic would be here (usually server side or special admin function)
                                            // For now assume manual or handled by trigger
                                            const supabase = getSupabase();
                                            const { data: authData, error: authError } = await (supabase.auth as any).signUp({
                                                email: collab.email,
                                                password: password,
                                                options: { data: { collaborator_id: result.id, role: collab.role } }
                                            });
                                            if (authError) throw authError;
                                            setNewCredentials({ email: collab.email, password });
                                        }
                                    }
                                    await refreshData();
                                    return result;
                                } catch (e) { throw e; }
                            };
                            return simpleSaveWrapper(saveCollaborator, null);
                        }}
                        collaboratorToEdit={collaboratorToEdit}
                        escolasDepartamentos={entidades}
                        currentUser={currentUser}
                        roleOptions={configUserRoles}
                        titleOptions={contactTitles}
                    />
                )}

                {/* Add/Edit Entidade Modal */}
                {showAddEntidade && (
                    <AddEntidadeModal
                        onClose={() => setShowAddEntidade(false)}
                        onSave={(ent) => {
                            if (entidadeToEdit && entidadeToEdit.id) return simpleSaveWrapper(dataService.updateEntidade, ent, entidadeToEdit.id);
                            return simpleSaveWrapper(dataService.addEntidade, ent);
                        }}
                        entidadeToEdit={entidadeToEdit}
                        instituicoes={instituicoes}
                    />
                )}

                {/* Add/Edit Instituicao Modal */}
                {showAddInstituicao && (
                    <AddInstituicaoModal
                        onClose={() => setShowAddInstituicao(false)}
                        onSave={(inst) => {
                            if (instituicaoToEdit && instituicaoToEdit.id) return simpleSaveWrapper(dataService.updateInstituicao, inst, instituicaoToEdit.id);
                            return simpleSaveWrapper(dataService.addInstituicao, inst);
                        }}
                        instituicaoToEdit={instituicaoToEdit}
                    />
                )}

                {/* New Credentials Modal */}
                {newCredentials && (
                    <CredentialsModal
                        onClose={() => setNewCredentials(null)}
                        email={newCredentials.email}
                        password={newCredentials.password}
                    />
                )}

                {/* Magic Command Bar */}
                <MagicCommandBar 
                    brands={brands} 
                    types={equipmentTypes} 
                    collaborators={collaborators} 
                    currentUser={currentUser}
                    onAction={handleMagicAction}
                />

                {showAutomationModal && (
                    <AutomationModal onClose={() => setShowAutomationModal(false)} />
                )}

                {confirmationModal && (
                    <ConfirmationModal
                        title={confirmationModal.title}
                        message={confirmationModal.message}
                        onConfirm={confirmationModal.onConfirm}
                        onClose={() => setConfirmationModal(null)}
                    />
                )}

                {/* Equipment History Modal - Rendered via State */}
                {equipmentForHistory && (
                    <EquipmentHistoryModal
                        equipment={equipmentForHistory}
                        assignments={assignments}
                        collaborators={collaborators}
                        escolasDepartamentos={entidades}
                        tickets={tickets}
                        ticketActivities={ticketActivities}
                        businessServices={businessServices}
                        serviceDependencies={serviceDependencies}
                        onClose={() => setEquipmentForHistory(null)}
                        softwareLicenses={softwareLicenses}
                        licenseAssignments={licenseAssignments}
                        vulnerabilities={vulnerabilities}
                        suppliers={suppliers}
                        onEdit={(eq) => {
                            setEquipmentForHistory(null);
                            setEquipmentToEdit(eq);
                            setShowAddEquipment(true);
                        }}
                    />
                )}

                {/* Ticket Activities Modal */}
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
                        onAddActivity={(activity) => simpleSaveWrapper(dataService.addTicketActivity, { ...activity, ticketId: ticketActivitiesModal.id, technicianId: currentUser?.id, date: new Date().toISOString() })}
                        assignments={assignments}
                    />
                )}

                {/* Close Ticket Modal */}
                {showCloseTicket && (
                    <CloseTicketModal
                        ticket={showCloseTicket}
                        collaborators={collaborators}
                        activities={ticketActivities.filter(ta => ta.ticketId === showCloseTicket.id)}
                        onClose={() => setShowCloseTicket(null)}
                        onConfirm={(techId, summary) => {
                            simpleSaveWrapper(dataService.updateTicket, { 
                                status: TicketStatus.Finished, 
                                finishDate: new Date().toISOString(), 
                                technicianId: techId,
                                resolution_summary: summary
                            }, showCloseTicket.id);
                            setShowCloseTicket(null);
                        }}
                    />
                )}

                {/* Collaborator History Modal */}
                {historyCollaborator && (
                    <CollaboratorHistoryModal
                        collaborator={historyCollaborator}
                        history={collaboratorHistory}
                        escolasDepartamentos={entidades}
                        onClose={() => setHistoryCollaborator(null)}
                    />
                )}

                {/* Collaborator Detail Modal */}
                {detailCollaborator && (
                    <CollaboratorDetailModal
                        collaborator={detailCollaborator}
                        assignments={assignments}
                        equipment={equipment}
                        tickets={tickets}
                        brandMap={brandMap}
                        equipmentTypeMap={equipmentTypeMap}
                        onClose={() => setDetailCollaborator(null)}
                        onShowHistory={(c) => { setDetailCollaborator(null); setHistoryCollaborator(c); }}
                        onStartChat={(c) => { setDetailCollaborator(null); setActiveChatCollaboratorId(c.id); setIsChatOpen(true); }}
                        onEdit={(c) => { setDetailCollaborator(null); setCollaboratorToEdit(c); setShowAddCollaborator(true); }}
                    />
                )}

                {/* Password Modals */}
                {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
                {showResetPassword && session && <ResetPasswordModal onClose={() => { setShowResetPassword(false); window.location.hash = ''; }} session={session} />}
                
                {/* Add Equipment Modal */}
                {showAddEquipment && (
                    <AddEquipmentModal
                        onClose={() => setShowAddEquipment(false)}
                        onSave={(eq, assignment, licenses) => {
                            const savePromise = async () => {
                                let savedEq;
                                if (equipmentToEdit) {
                                    savedEq = await dataService.updateEquipment(equipmentToEdit.id, eq);
                                } else {
                                    savedEq = await dataService.addEquipment(eq);
                                    if (assignment && savedEq?.id) {
                                        await dataService.addAssignment({ ...assignment, equipmentId: savedEq.id });
                                    }
                                }
                                if (licenses && licenses.length > 0 && savedEq?.id) {
                                    await dataService.syncLicenseAssignments(savedEq.id, licenses);
                                }
                                return savedEq;
                            };
                            return simpleSaveWrapper(savePromise, null);
                        }}
                        brands={brands}
                        equipmentTypes={equipmentTypes}
                        equipmentToEdit={equipmentToEdit}
                        onSaveBrand={dataService.addBrand}
                        onSaveEquipmentType={dataService.addEquipmentType}
                        onOpenKitModal={(data) => { setShowAddEquipment(false); setKitInitialData(data); setShowAddKit(true); }}
                        suppliers={suppliers}
                        softwareLicenses={softwareLicenses}
                        entidades={entidades}
                        collaborators={collaborators}
                        statusOptions={configEquipmentStatuses}
                        criticalityOptions={configCriticalityLevels}
                        ciaOptions={configCiaRatings}
                        initialData={initialEquipmentData}
                        licenseAssignments={licenseAssignments}
                        onOpenHistory={(eq) => { setShowAddEquipment(false); setEquipmentForHistory(eq); }}
                        onManageLicenses={(eq) => { setShowAddEquipment(false); setShowManageLicenses(eq); }}
                        onOpenAssign={(eq) => { setShowAddEquipment(false); setShowAssignEquipment(eq); }}
                    />
                )}

                {/* Assign Equipment Modal */}
                {showAssignEquipment && (
                    <AssignEquipmentModal
                        equipment={showAssignEquipment}
                        brandMap={brandMap}
                        equipmentTypeMap={equipmentTypeMap}
                        escolasDepartamentos={entidades}
                        collaborators={collaborators}
                        onClose={() => setShowAssignEquipment(null)}
                        onAssign={(assignment) => simpleSaveWrapper(dataService.addAssignment, assignment)}
                    />
                )}

                {/* Kit Modal */}
                {showAddKit && (
                    <AddEquipmentKitModal
                        onClose={() => setShowAddKit(false)}
                        onSaveKit={async (items) => {
                            try {
                                await dataService.addMultipleEquipment(items);
                                await refreshData();
                            } catch (e) {
                                console.error("Error saving kit:", e);
                                alert("Erro ao salvar kit de equipamentos.");
                            }
                        }}
                        brands={brands}
                        equipmentTypes={equipmentTypes}
                        initialData={kitInitialData}
                        onSaveEquipmentType={dataService.addEquipmentType}
                        equipment={equipment}
                    />
                )}

                {/* Add Ticket Modal */}
                {showAddTicket && (
                    <AddTicketModal
                        onClose={() => setShowAddTicket(false)}
                        onSave={(t) => {
                            if (ticketToEdit) return simpleSaveWrapper(dataService.updateTicket, t, ticketToEdit.id);
                            return simpleSaveWrapper(dataService.addTicket, t);
                        }}
                        ticketToEdit={ticketToEdit}
                        escolasDepartamentos={entidades}
                        collaborators={collaborators}
                        teams={teams}
                        currentUser={currentUser}
                        userPermissions={{ viewScope: isBasic ? 'own' : 'all' }}
                        equipment={equipment}
                        equipmentTypes={equipmentTypes}
                        assignments={assignments}
                        categories={ticketCategories}
                        securityIncidentTypes={securityIncidentTypes}
                        pastTickets={tickets}
                        initialData={initialTicketData}
                    />
                )}

                {/* Chat Widget */}
                <ChatWidget
                    currentUser={currentUser}
                    collaborators={collaborators}
                    messages={messages}
                    onSendMessage={(receiverId, content) => {
                        simpleSaveWrapper(dataService.addMessage, {
                            senderId: currentUser?.id,
                            receiverId,
                            content,
                            timestamp: new Date().toISOString(),
                            read: false
                        });
                    }}
                    onMarkMessagesAsRead={(senderId) => {
                        if (currentUser) dataService.markMessagesAsRead(senderId, currentUser.id);
                    }}
                    isOpen={isChatOpen}
                    onToggle={() => setIsChatOpen(!isChatOpen)}
                    activeChatCollaboratorId={activeChatCollaboratorId}
                    onSelectConversation={(id) => setActiveChatCollaboratorId(id)}
                    unreadMessagesCount={messages.filter(m => !m.read && m.receiverId === currentUser?.id).length}
                />

                {/* Add Brand Modal (rendered at root level to ensure it works when triggered from settings) */}
                {showAddBrand && (
                    <AddBrandModal
                        onClose={() => setShowAddBrand(false)}
                        onSave={(b) => {
                            if (brandToEdit) return simpleSaveWrapper(dataService.updateBrand, b, brandToEdit.id);
                            return simpleSaveWrapper(dataService.addBrand, b);
                        }}
                        brandToEdit={brandToEdit}
                        existingBrands={brands}
                    />
                )}

                {/* Add Type Modal */}
                {showAddType && (
                    <AddEquipmentTypeModal
                        onClose={() => setShowAddType(false)}
                        onSave={(t) => {
                            if (typeToEdit) return simpleSaveWrapper(dataService.updateEquipmentType, t, typeToEdit.id);
                            return simpleSaveWrapper(dataService.addEquipmentType, t);
                        }}
                        typeToEdit={typeToEdit}
                        teams={teams}
                        existingTypes={equipmentTypes}
                    />
                )}

                {/* Add Category Modal */}
                {showAddCategory && (
                    <AddCategoryModal 
                        onClose={() => setShowAddCategory(false)}
                        onSave={(c) => {
                            if (categoryToEdit) return simpleSaveWrapper(dataService.updateTicketCategory, c, categoryToEdit.id);
                            return simpleSaveWrapper(dataService.addTicketCategory, c);
                        }}
                        categoryToEdit={categoryToEdit}
                        teams={teams}
                    />
                )}

                {/* Add Incident Type Modal */}
                {showAddIncidentType && (
                    <AddSecurityIncidentTypeModal 
                        onClose={() => setShowAddIncidentType(false)}
                        onSave={(t) => {
                            if (incidentTypeToEdit) return simpleSaveWrapper(dataService.updateSecurityIncidentType, t, incidentTypeToEdit.id);
                            return simpleSaveWrapper(dataService.addSecurityIncidentType, t);
                        }}
                        typeToEdit={incidentTypeToEdit}
                    />
                )}

                {/* Add Service Modal */}
                {showAddService && (
                    <AddServiceModal
                        onClose={() => setShowAddService(false)}
                        onSave={(s) => {
                            if (serviceToEdit) return simpleSaveWrapper(dataService.updateBusinessService, s, serviceToEdit.id);
                            return simpleSaveWrapper(dataService.addBusinessService, s);
                        }}
                        serviceToEdit={serviceToEdit}
                        collaborators={collaborators}
                        suppliers={suppliers}
                    />
                )}

                {/* Manage Service Dependencies Modal */}
                {showServiceDependencies && (
                    <ServiceDependencyModal
                        onClose={() => setShowServiceDependencies(null)}
                        service={showServiceDependencies}
                        dependencies={serviceDependencies.filter(d => d.service_id === showServiceDependencies.id)}
                        allEquipment={equipment}
                        allLicenses={softwareLicenses}
                        onAddDependency={(dep) => simpleSaveWrapper(dataService.addServiceDependency, dep)}
                        onRemoveDependency={(id) => simpleSaveWrapper(dataService.deleteServiceDependency, null, id)}
                    />
                )}

                {/* Add Vulnerability Modal */}
                {showAddVulnerability && (
                    <AddVulnerabilityModal
                        onClose={() => setShowAddVulnerability(false)}
                        onSave={(v) => {
                            if (vulnerabilityToEdit) return simpleSaveWrapper(dataService.updateVulnerability, v, vulnerabilityToEdit.id);
                            return simpleSaveWrapper(dataService.addVulnerability, v);
                        }}
                        vulnToEdit={vulnerabilityToEdit}
                    />
                )}

                {/* Manage Licenses Modal (Keys) */}
                {showManageLicenses && (
                    <ManageAssignedLicensesModal
                        onClose={() => setShowManageLicenses(null)}
                        onSave={async (eqId, licenseIds) => {
                            await dataService.syncLicenseAssignments(eqId, licenseIds);
                            await refreshData();
                        }}
                        equipment={showManageLicenses}
                        allLicenses={softwareLicenses}
                        allAssignments={licenseAssignments}
                    />
                )}

                {/* Manage Team Members Modal */}
                {showManageTeamMembers && (
                    <ManageTeamMembersModal
                        onClose={() => setShowManageTeamMembers(null)}
                        onSave={async (teamId, members) => {
                            await dataService.syncTeamMembers(teamId, members);
                            await refreshData();
                        }}
                        team={showManageTeamMembers}
                        allCollaborators={collaborators}
                        teamMembers={teamMembers}
                    />
                )}

                {/* Add Supplier Modal */}
                {showAddSupplier && (
                    <AddSupplierModal
                        onClose={() => setShowAddSupplier(false)}
                        onSave={(s) => {
                            if (supplierToEdit) return simpleSaveWrapper(dataService.updateSupplier, s, supplierToEdit.id);
                            return simpleSaveWrapper(dataService.addSupplier, s);
                        }}
                        supplierToEdit={supplierToEdit}
                        teams={teams}
                        onCreateTicket={(t) => simpleSaveWrapper(dataService.addTicket, { ...t, entidadeId: entidades[0]?.id, collaboratorId: currentUser?.id } as Ticket)}
                        businessServices={businessServices}
                    />
                )}

                {/* Add Backup Modal */}
                {showAddBackup && (
                    <AddBackupModal
                        onClose={() => setShowAddBackup(false)}
                        onSave={(b) => {
                            if (backupToEdit) return simpleSaveWrapper(dataService.updateBackupExecution, b, backupToEdit.id);
                            return simpleSaveWrapper(dataService.addBackupExecution, b);
                        }}
                        backupToEdit={backupToEdit}
                        currentUser={currentUser}
                        equipmentList={equipment}
                        equipmentTypes={equipmentTypes}
                        onCreateTicket={(t) => simpleSaveWrapper(dataService.addTicket, { ...t, entidadeId: entidades[0]?.id, collaboratorId: currentUser?.id } as Ticket)}
                    />
                )}

                {/* Add Resilience Test Modal */}
                {showAddResilienceTest && (
                    <AddResilienceTestModal
                        onClose={() => setShowAddResilienceTest(false)}
                        onSave={async (test) => {
                            if (resilienceTestToEdit) await dataService.updateResilienceTest(resilienceTestToEdit.id, test);
                            else await dataService.addResilienceTest(test);
                            await refreshData();
                        }}
                        testToEdit={resilienceTestToEdit}
                        onCreateTicket={(t) => simpleSaveWrapper(dataService.addTicket, { ...t, entidadeId: entidades[0]?.id, collaboratorId: currentUser?.id } as Ticket)}
                        entidades={entidades}
                        suppliers={suppliers}
                    />
                )}

                {/* User Modals */}
                {showProfileModal && currentUser && (
                    <CollaboratorDetailModal
                        collaborator={currentUser}
                        assignments={assignments}
                        equipment={equipment}
                        tickets={tickets}
                        brandMap={brandMap}
                        equipmentTypeMap={equipmentTypeMap}
                        onClose={() => setShowProfileModal(false)}
                        onShowHistory={() => {}}
                        onStartChat={() => {}}
                        onEdit={(c) => {
                            setShowProfileModal(false);
                            setCollaboratorToEdit(c);
                            setShowAddCollaborator(true);
                        }}
                    />
                )}

                {showCalendarModal && currentUser && (
                    <CalendarModal 
                        onClose={() => setShowCalendarModal(false)}
                        tickets={tickets}
                        currentUser={currentUser}
                        teams={teams}
                        teamMembers={teamMembers}
                        collaborators={collaborators}
                        onViewTicket={(t) => {
                            setShowCalendarModal(false);
                            setTicketToEdit(t);
                            setShowAddTicket(true);
                        }}
                    />
                )}

                {showUserManual && (
                    <UserManualModal onClose={() => setShowUserManual(false)} />
                )}

            </main>
        </div>
    );
};

export const App: React.FC = () => {
    return (
        <LanguageProvider>
            <LayoutProvider>
                <InnerApp />
            </LayoutProvider>
        </LanguageProvider>
    );
};