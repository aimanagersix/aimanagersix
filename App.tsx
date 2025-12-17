
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Collaborator, UserRole, ModuleKey, PermissionAction, defaultTooltipConfig, Ticket, Brand, EquipmentType, Equipment, SoftwareLicense, TeamMember
} from './types';
import * as dataService from './services/dataService';
import { useAppData } from './hooks/useAppData';
import { useLayout } from './contexts/LayoutContext';
import { getSupabase } from './services/supabaseClient';
import { FaBars } from 'react-icons/fa';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import ConfigurationSetup from './components/ConfigurationSetup';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ResetPasswordModal from './components/ResetPasswordModal';

// Feature Managers (Modules)
import InventoryManager from './features/inventory/InventoryManager';
import OrganizationManager from './features/organization/OrganizationManager';
import TicketManager from './features/tickets/TicketManager';
import ComplianceManager from './features/compliance/ComplianceManager';
import SettingsManager from './features/settings/SettingsManager';

// Dashboards (Non-Refactored Modules)
import OverviewDashboard from './components/OverviewDashboard';
import SmartDashboard from './components/SmartDashboard';
import AgendaDashboard from './components/AgendaDashboard';
import MapDashboard from './components/MapDashboard';
import BIReportDashboard from './components/BIReportDashboard';

// Modals (Global or Non-Refactored)
import { AddTicketModal } from './components/AddTicketModal';
import ReportModal from './components/ReportModal';
import UserManualModal from './components/UserManualModal';
import CalendarModal from './components/CalendarModal';
import MagicCommandBar from './components/MagicCommandBar';
import { ChatWidget } from './components/ChatWidget';
import NotificationsModal from './components/NotificationsModal';
import PolicyAcceptanceModal from './components/PolicyAcceptanceModal';
import { CollaboratorDetailModal } from './components/CollaboratorDetailModal';


export const App: React.FC = () => {
    const { 
        isConfigured, setIsConfigured, 
        currentUser, setCurrentUser, 
        appData, refreshData,
        isLoading 
    } = useAppData();
    
    const { layoutMode } = useLayout();
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!isConfigured || !currentUser) return;
        const supabase = getSupabase();
        const channel = supabase.channel('global_presence', { config: { presence: { key: currentUser.id } } });
        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const onlineIds = new Set<string>();
                for (const key in newState) onlineIds.add(key);
                setOnlineUserIds(onlineIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ user_id: currentUser.id, online_at: new Date().toISOString() });
                }
            });
        return () => { supabase.removeChannel(channel); };
    }, [isConfigured, currentUser]);

    const thirtyDaysFromNow = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
    }, []);
    const today = useMemo(() => new Date(), []);

    const myTeamIds = useMemo(() => {
        if (!currentUser) return new Set<string>();
        return new Set(
            appData.teamMembers
                .filter((tm: TeamMember) => tm.collaborator_id === currentUser.id)
                .map((tm: TeamMember) => tm.team_id)
        );
    }, [appData.teamMembers, currentUser]);

    const teamTickets = useMemo(() => {
        if (!currentUser) return [];
        return appData.tickets.filter((t: Ticket) => {
            const isPending = t.status === 'Pedido' || t.status === 'Em progresso';
            if (!isPending) return false;
            const isForMyTeam = t.team_id && myTeamIds.has(t.team_id);
            const isAssignedToMe = t.technicianId === currentUser.id;
            return isForMyTeam || isAssignedToMe;
        });
    }, [appData.tickets, myTeamIds, currentUser]);

    const expiringWarranties = useMemo(() => {
        return appData.equipment.filter((eq: Equipment) => {
            if (!eq.warrantyEndDate) return false;
            try {
                const warrantyDate = new Date(eq.warrantyEndDate);
                return warrantyDate >= today && warrantyDate <= thirtyDaysFromNow;
            } catch (e) { return false; }
        });
    }, [appData.equipment, today, thirtyDaysFromNow]);

    const expiringLicenses = useMemo(() => {
        return appData.softwareLicenses.filter((lic: SoftwareLicense) => {
            if (!lic.expiryDate) return false;
            try {
                const expiryDate = new Date(lic.expiryDate);
                return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
            } catch (e) { return false; }
        });
    }, [appData.softwareLicenses, today, thirtyDaysFromNow]);
    
    const notificationCount = useMemo(() => {
        return expiringWarranties.length + expiringLicenses.length + teamTickets.length;
    }, [expiringWarranties, expiringLicenses, teamTickets]);
    
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
            if (hash && hash !== activeTab) setActiveTabState(hash);
            else if (!hash) setActiveTabState('overview');
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [activeTab]);

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState<'equipment' | 'collaborator' | 'ticket' | 'licensing' | 'compliance' | 'bia'>('equipment');
    const [showUserManualModal, setShowUserManualModal] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [showChatWidget, setShowChatWidget] = useState(false);
    const [activeChatCollaboratorId, setActiveChatCollaboratorId] = useState<string | null>(null);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [resetSession, setResetSession] = useState<any>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showAddTicketModal, setShowAddTicketModal] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<any>(null);
    const [dashboardFilter, setDashboardFilter] = useState<any>(null);

    // --- ENHANCED PERMISSION LOGIC ---
    const checkPermission = (module: ModuleKey, action: PermissionAction): boolean => {
        if (!currentUser) return false;
        
        // CRITICAL: SuperAdmin ALWAYS has all permissions
        if (currentUser.role === UserRole.SuperAdmin || currentUser.role === 'SuperAdmin') return true;
        
        const role = appData.customRoles.find((r:any) => r.name === currentUser.role);
        if (role) return role.permissions[module]?.[action] ?? false;
        
        // Fallbacks for legacy roles
        if (currentUser.role === 'Admin') return true;
        if (currentUser.role === 'Técnico' || currentUser.role === 'Normal') {
             if (module === 'settings' || module === 'organization' || module === 'config_custom_roles') return false;
             if (action === 'delete') return false;
             return true;
        }
        if (currentUser.role === UserRole.Utilizador || currentUser.role === 'Basic') {
            if (module === 'tickets' && (action === 'create' || action === 'view')) return true;
             if ((module === 'widget_kpi_cards' || module === 'widget_activity') && action === 'view') return true;
            return false;
        }
        return false;
    };
    
    const isBasic = !checkPermission('equipment', 'view') && !checkPermission('organization', 'view');
    const isAdmin = checkPermission('settings', 'view');
    const canViewBia = checkPermission('compliance_bia', 'view');
    const canViewSecurity = checkPermission('compliance_security', 'view');
    const canViewBackups = checkPermission('compliance_backups', 'view');
    const canViewResilience = checkPermission('compliance_resilience', 'view');
    const canViewTraining = checkPermission('compliance_training', 'view');
    const canViewPolicies = checkPermission('compliance_policies', 'view');
    const showComplianceMenu = canViewBia || canViewSecurity || canViewBackups || canViewResilience || canViewTraining || canViewPolicies;
    const canViewSmartDashboard = checkPermission('dashboard_smart', 'view');

    const tabConfig: any = {
        'overview': !isBasic ? 'Visão Geral' : undefined,
        'overview.smart': canViewSmartDashboard ? 'C-Level Dashboard' : undefined,
        'equipment.inventory': checkPermission('equipment', 'view') ? 'Inventário' : undefined,
        'equipment.procurement': checkPermission('procurement', 'view') ? 'Aquisições' : undefined,
        'licensing': checkPermission('licensing', 'view') ? 'Licenciamento' : undefined,
        'organizacao.instituicoes': checkPermission('organization', 'view') ? 'Instituições' : undefined,
        'organizacao.entidades': checkPermission('organization', 'view') ? 'Entidades' : undefined,
        'organizacao.teams': checkPermission('organization', 'view') ? 'Equipas' : undefined,
        'organizacao.suppliers': checkPermission('suppliers', 'view') ? 'Fornecedores' : undefined,
        'collaborators': checkPermission('organization', 'view') ? 'Colaboradores' : undefined,
        'tickets': checkPermission('tickets', 'view') ? { title: 'Tickets', list: 'Lista de Tickets' } : undefined,
        'nis2': showComplianceMenu ? { 
            title: 'Compliance', 
            bia: canViewBia ? 'BIA (Serviços)' : undefined, 
            security: canViewSecurity ? 'Segurança (CVE)' : undefined, 
            backups: canViewBackups ? 'Backups & Logs' : undefined, 
            resilience: canViewResilience ? 'Testes Resiliência' : undefined, 
            training: canViewTraining ? 'Formações' : undefined,
            policies: canViewPolicies ? 'Políticas' : undefined
        } : undefined,
        'reports': checkPermission('reports', 'view') ? 'Relatórios' : undefined,
        'tools': { title: 'Tools', agenda: 'Agenda de contactos', map: 'Pesquisa no Mapa' },
        'settings': checkPermission('settings', 'view') ? 'Configurações' : undefined
    };

    const pendingPolicies = useMemo(() => {
        if (!currentUser || appData.policies.length === 0) return [];
        return appData.policies.filter(p => {
            if (!p.is_active || !p.is_mandatory) return false;
            const acceptance = appData.policyAcceptances.find(a => a.policy_id === p.id && a.user_id === currentUser.id && a.version === p.version);
            return !acceptance;
        });
    }, [currentUser, appData.policies, appData.policyAcceptances]);

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
                    if (!user.canLogin) { await (supabase.auth as any).signOut(); return { success: false, error: "Sem permissão de acesso." }; }
                    if (user.status !== 'Ativo') { await (supabase.auth as any).signOut(); return { success: false, error: "Conta inativa." }; }
                    setCurrentUser(user);
                    return { success: true };
                }
            }
            return { success: false, error: "Login falhou." };
        } catch (error: any) { return { success: false, error: error.message }; }
    };

    const handleLogout = async () => {
        const supabase = getSupabase();
        await (supabase.auth as any).signOut();
        setCurrentUser(null);
        setActiveTab('overview');
    };

    const handleViewItem = (tab: string, filter: any) => { setActiveTab(tab); setDashboardFilter(filter); };
    const handleOpenProfile = () => setShowProfileModal(true);
    const handleSidebarHover = (state: boolean) => setIsSidebarExpanded(state);

    if (isLoading) return <div className="min-h-screen bg-background-dark flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div></div>;
    if (!isConfigured) return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    if (!currentUser) return (<><LoginPage onLogin={handleLogin} onForgotPassword={() => setShowForgotPasswordModal(true)} />{showForgotPasswordModal && <ForgotPasswordModal onClose={() => setShowForgotPasswordModal(false)} />}</>);
    if (pendingPolicies.length > 0) return <PolicyAcceptanceModal policies={pendingPolicies} onAccept={async (id, version) => { await dataService.acceptPolicy(id, currentUser.id, version); refreshData(); }} />;

    return (
        <div className={`min-h-screen bg-background-dark ${layoutMode === 'top' ? 'flex flex-col' : 'flex h-screen overflow-hidden'}`}>
            {layoutMode === 'side' && (
                <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center px-4 z-40 shadow-md">
                    <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="text-gray-400 p-2 hover:text-white"><FaBars className="h-6 w-6" /></button>
                    <span className="ml-4 font-bold text-xl text-white">AI<span className="text-brand-secondary">Manager</span></span>
                </div>
            )}

            {layoutMode === 'side' ? (
                 <Sidebar currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} tabConfig={tabConfig} notificationCount={notificationCount} onNotificationClick={() => setShowNotificationsModal(true)} isExpanded={isSidebarExpanded} onHover={handleSidebarHover} onOpenProfile={handleOpenProfile} onOpenCalendar={() => setShowCalendarModal(true)} onOpenManual={() => setShowUserManualModal(true)} />
            ) : (
                <Header currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} tabConfig={tabConfig} notificationCount={notificationCount} onNotificationClick={() => setShowNotificationsModal(true)} onOpenProfile={handleOpenProfile} onOpenCalendar={() => setShowCalendarModal(true)} onOpenManual={() => setShowUserManualModal(true)} />
            )}

            <main className={`flex-1 bg-background-dark transition-all duration-300 ${layoutMode === 'side' ? 'overflow-y-auto custom-scrollbar' : 'overflow-y-auto custom-scrollbar overflow-x-hidden'}`}>
                <div className={`w-full max-w-[1800px] mx-auto p-4 md:p-8 ${layoutMode === 'side' ? 'pt-20 md:pt-8' : ''}`}>
                    {activeTab === 'overview' && <OverviewDashboard equipment={appData.equipment} instituicoes={appData.instituicoes} entidades={appData.entidades} assignments={appData.assignments} equipmentTypes={appData.equipmentTypes} tickets={appData.tickets} collaborators={appData.collaborators} teams={appData.teams} expiringWarranties={expiringWarranties} expiringLicenses={expiringLicenses} softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments} businessServices={appData.businessServices} vulnerabilities={appData.vulnerabilities} onViewItem={handleViewItem} onGenerateComplianceReport={() => { setReportType('compliance'); setShowReportModal(true); }} procurementRequests={appData.procurementRequests} onRefresh={refreshData} checkPermission={checkPermission} />}
                    {activeTab === 'overview.smart' && canViewSmartDashboard && <SmartDashboard tickets={appData.tickets} vulnerabilities={appData.vulnerabilities} backups={appData.backupExecutions} trainings={appData.securityTrainings} collaborators={appData.collaborators} currentUser={currentUser} />}
                    {(activeTab === 'equipment.inventory' || activeTab === 'licensing' || activeTab === 'equipment.procurement') && <InventoryManager activeTab={activeTab} appData={appData} checkPermission={checkPermission} refreshData={refreshData} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} setReportType={(t) => { setReportType(t as any); setShowReportModal(true); }} currentUser={currentUser} onViewItem={handleViewItem} />}
                    {(activeTab.startsWith('organizacao') || activeTab === 'collaborators') && <OrganizationManager activeTab={activeTab} appData={appData} checkPermission={checkPermission} refreshData={refreshData} currentUser={currentUser} setActiveTab={setActiveTab} onStartChat={(c) => { setActiveChatCollaboratorId(c.id); setShowChatWidget(true); }} setReportType={(t) => { setReportType(t as any); setShowReportModal(true); }} />}
                    {activeTab.startsWith('tickets') && <TicketManager appData={appData} checkPermission={checkPermission} refreshData={refreshData} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} setReportType={(t) => { setReportType(t as any); setShowReportModal(true); }} currentUser={currentUser} />}
                    {activeTab.startsWith('nis2') && <ComplianceManager activeTab={activeTab} appData={appData} checkPermission={checkPermission} refreshData={refreshData} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} setReportType={(t) => { setReportType(t as any); setShowReportModal(true); }} currentUser={currentUser} />}
                    {activeTab === 'settings' && <SettingsManager appData={appData} refreshData={refreshData} />}
                    {activeTab === 'reports' && <BIReportDashboard appData={appData} />}
                    {activeTab === 'tools.agenda' && <AgendaDashboard />}
                    {activeTab === 'tools.map' && <MapDashboard instituicoes={appData.instituicoes} entidades={appData.entidades} suppliers={appData.suppliers} equipment={appData.equipment} assignments={appData.assignments} onClose={() => setActiveTab('overview')} />}
                </div>
            </main>

            <ChatWidget currentUser={currentUser} collaborators={appData.collaborators} messages={appData.messages} onSendMessage={async (rxId, content) => { await dataService.addMessage({ senderId: currentUser.id, receiverId: rxId, content, timestamp: new Date().toISOString(), read: false }); refreshData(); }} onMarkMessagesAsRead={(senderId) => dataService.markMessagesAsRead(senderId)} isOpen={showChatWidget} onToggle={() => setShowChatWidget(!showChatWidget)} activeChatCollaboratorId={activeChatCollaboratorId} onSelectConversation={setActiveChatCollaboratorId} unreadMessagesCount={appData.messages.filter((m: any) => m.receiverId === currentUser.id && !m.read).length} onlineUserIds={onlineUserIds} />
        </div>
    );
};
