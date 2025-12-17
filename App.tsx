
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Collaborator, UserRole, ModuleKey, PermissionAction, Ticket, Brand, EquipmentType, Equipment, SoftwareLicense, TeamMember
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

// Modals
import { ChatWidget } from './components/ChatWidget';
import NotificationsModal from './components/NotificationsModal';


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

    const notificationCount = useMemo(() => {
        return appData.tickets.filter(t => t.status === 'Pedido').length;
    }, [appData.tickets]);
    
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
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [showChatWidget, setShowChatWidget] = useState(false);
    const [activeChatCollaboratorId, setActiveChatCollaboratorId] = useState<string | null>(null);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [dashboardFilter, setDashboardFilter] = useState<any>(null);

    // --- CRITICAL PERMISSION OVERRIDE (SUPERADMIN GOD MODE) ---
    const checkPermission = (module: ModuleKey, action: PermissionAction): boolean => {
        if (!currentUser) return false;
        
        // SuperAdmin can do EVERYTHING - Absolute override
        if (currentUser.role === 'SuperAdmin' || currentUser.role === UserRole.SuperAdmin) {
            return true;
        }
        
        const role = appData.customRoles.find((r:any) => r.name === currentUser.role);
        if (role) return role.permissions[module]?.[action] ?? false;
        
        // Legacy Admin fallback
        if (currentUser.role === 'Admin') return true;
        
        return false;
    };
    
    const isBasic = !checkPermission('equipment', 'view') && !checkPermission('organization', 'view');
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
        'nis2': checkPermission('compliance_bia', 'view') ? { title: 'Compliance', bia: 'BIA', security: 'Segurança', backups: 'Backups' } : undefined,
        'reports': checkPermission('reports', 'view') ? 'Relatórios' : undefined,
        'tools': { title: 'Tools', agenda: 'Agenda', map: 'Mapa' },
        'settings': checkPermission('settings', 'view') ? 'Configurações' : undefined
    };

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
                    if (!user.canLogin) { await (supabase.auth as any).signOut(); return { success: false, error: "Sem permissão." }; }
                    setCurrentUser(user);
                    return { success: true };
                }
            }
            return { success: false, error: "Falhou." };
        } catch (error: any) { return { success: false, error: error.message }; }
    };

    const handleLogout = async () => {
        const supabase = getSupabase();
        await (supabase.auth as any).signOut();
        setCurrentUser(null);
        setActiveTab('overview');
    };

    if (isLoading) return <div className="min-h-screen bg-background-dark flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div></div>;
    if (!isConfigured) return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    if (!currentUser) return (<><LoginPage onLogin={handleLogin} onForgotPassword={() => setShowForgotPasswordModal(true)} />{showForgotPasswordModal && <ForgotPasswordModal onClose={() => setShowForgotPasswordModal(false)} />}</>);

    return (
        <div className={`min-h-screen bg-background-dark ${layoutMode === 'top' ? 'flex flex-col' : 'flex h-screen overflow-hidden'}`}>
            {layoutMode === 'side' ? (
                 <Sidebar currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} tabConfig={tabConfig} notificationCount={notificationCount} onNotificationClick={() => setShowNotificationsModal(true)} isExpanded={isSidebarExpanded} onHover={setIsSidebarExpanded} />
            ) : (
                <Header currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} tabConfig={tabConfig} notificationCount={notificationCount} onNotificationClick={() => setShowNotificationsModal(true)} />
            )}

            <main className={`flex-1 bg-background-dark transition-all duration-300 overflow-y-auto custom-scrollbar`}>
                <div className={`w-full max-w-[1800px] mx-auto p-4 md:p-8`}>
                    {activeTab === 'overview' && <OverviewDashboard equipment={appData.equipment} instituicoes={appData.instituicoes} entidades={appData.entidades} assignments={appData.assignments} equipmentTypes={appData.equipmentTypes} tickets={appData.tickets} collaborators={appData.collaborators} teams={appData.teams} expiringWarranties={[]} expiringLicenses={[]} softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments} businessServices={appData.businessServices} vulnerabilities={appData.vulnerabilities} onViewItem={(t,f) => {setActiveTab(t); setDashboardFilter(f);}} onGenerateComplianceReport={() => {}} onRefresh={refreshData} checkPermission={checkPermission} />}
                    {activeTab === 'overview.smart' && canViewSmartDashboard && <SmartDashboard tickets={appData.tickets} vulnerabilities={appData.vulnerabilities} backups={appData.backupExecutions} trainings={appData.securityTrainings} collaborators={appData.collaborators} currentUser={currentUser} />}
                    {activeTab.startsWith('tickets') && <TicketManager appData={appData} checkPermission={checkPermission} refreshData={refreshData} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} setReportType={() => {}} currentUser={currentUser} />}
                    {(activeTab.startsWith('equipment') || activeTab === 'licensing') && <InventoryManager activeTab={activeTab} appData={appData} checkPermission={checkPermission} refreshData={refreshData} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} setReportType={() => {}} currentUser={currentUser} onViewItem={(t,f) => {setActiveTab(t); setDashboardFilter(f);}} />}
                    {(activeTab.startsWith('organizacao') || activeTab === 'collaborators') && <OrganizationManager activeTab={activeTab} appData={appData} checkPermission={checkPermission} refreshData={refreshData} currentUser={currentUser} setActiveTab={setActiveTab} onStartChat={(c) => { setActiveChatCollaboratorId(c.id); setShowChatWidget(true); }} setReportType={() => {}} />}
                    {activeTab.startsWith('nis2') && <ComplianceManager activeTab={activeTab} appData={appData} checkPermission={checkPermission} refreshData={refreshData} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} setReportType={() => {}} currentUser={currentUser} />}
                    {activeTab === 'settings' && <SettingsManager appData={appData} refreshData={refreshData} />}
                    {activeTab === 'reports' && <BIReportDashboard appData={appData} />}
                    {activeTab === 'tools.agenda' && <AgendaDashboard />}
                    {activeTab === 'tools.map' && <MapDashboard instituicoes={appData.instituicoes} entidades={appData.entidades} suppliers={appData.suppliers} equipment={appData.equipment} assignments={appData.assignments} onClose={() => setActiveTab('overview')} />}
                </div>
            </main>

            <ChatWidget currentUser={currentUser} collaborators={appData.collaborators} messages={appData.messages} onSendMessage={async (rxId, content) => { await dataService.addMessage({ senderId: currentUser.id, receiverId: rxId, content, timestamp: new Date().toISOString(), read: false }); refreshData(); }} onMarkMessagesAsRead={(senderId) => dataService.markMessagesAsRead(senderId)} isOpen={showChatWidget} onToggle={() => setShowChatWidget(!showChatWidget)} activeChatCollaboratorId={activeChatCollaboratorId} onSelectConversation={setActiveChatCollaboratorId} unreadMessagesCount={0} onlineUserIds={onlineUserIds} />
        </div>
    );
};
