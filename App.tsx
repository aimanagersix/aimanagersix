
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import LoginPage from './components/LoginPage';
import ConfigurationSetup from './components/ConfigurationSetup';
import { useLayout } from './contexts/LayoutContext';
import { useLanguage } from './contexts/LanguageContext';
import InventoryManager from './features/inventory/InventoryManager';
import OrganizationManager from './features/organization/OrganizationManager';
import TicketManager from './features/tickets/TicketManager';
import ComplianceManager from './features/compliance/ComplianceManager';
import SelfServiceDashboard from './features/selfservice/SelfServiceDashboard';
import OverviewDashboard from './components/OverviewDashboard';
import SmartDashboard from './components/SmartDashboard';
import BIReportDashboard from './components/BIReportDashboard';
import MagicCommandBar from './components/MagicCommandBar';
import { ChatWidget } from './components/ChatWidget';
import MapDashboard from './components/MapDashboard';
import SettingsManager from './features/settings/SettingsManager';
import { getSupabase } from './services/supabaseClient';
import * as dataService from './services/dataService';
import { ModuleKey, PermissionAction, Collaborator, UserRole, Ticket, Policy, Equipment, SoftwareLicense, SecurityTrainingRecord } from './types';
import AgendaDashboard from './components/AgendaDashboard';
import ModalOrchestrator from './components/ModalOrchestrator';
import UserProfileModal from './components/UserProfileModal';
import NotificationsModal from './components/NotificationsModal';
import CalendarModal from './components/CalendarModal';
import UserManualModal from './components/UserManualModal';
import ReportModal from './components/ReportModal';

// Atomic Hooks
import { useOrganization } from './hooks/useOrganization';
import { useInventory } from './hooks/useInventory';
import { useSupport } from './hooks/useSupport';
import { useCompliance } from './hooks/useCompliance';

export const App: React.FC = () => {
    const { layoutMode } = useLayout();
    const { t } = useLanguage();
    const isRefreshing = useRef(false);

    const [isConfigured, setIsConfigured] = useState<boolean>(() => {
        return !!(process.env.SUPABASE_URL || localStorage.getItem('SUPABASE_URL'));
    });
    
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [session, setSession] = useState<any>(null);
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Initialize Specialized Hooks
    const org = useOrganization(isConfigured);
    const inv = useInventory(isConfigured);
    const support = useSupport(isConfigured);
    const compliance = useCompliance(isConfigured);

    // Navigation State
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [dashboardFilter, setDashboardFilter] = useState<any>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserManual, setShowUserManual] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [activeChatCollaboratorId, setActiveChatCollaboratorId] = useState<string | null>(null);
    
    // Global Modals State
    const [reportType, setReportType] = useState<string | null>(null);
    const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
    const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);
    const [readingPolicy, setReadingPolicy] = useState<Policy | null>(null);
    const [viewingLicense, setViewingLicense] = useState<SoftwareLicense | null>(null);
    const [viewingTraining, setViewingTraining] = useState<SecurityTrainingRecord | null>(null);

    // Permission Engine
    const checkPermission = useCallback((module: ModuleKey, action: PermissionAction): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === 'SuperAdmin' || currentUser.role === UserRole.SuperAdmin) return true;
        const role = org.data.customRoles.find(r => r.name === currentUser.role);
        if (!role || !role.permissions) return false;
        const modulePerms = role.permissions[module] || {};
        return action === 'view' && modulePerms['view_own'] ? true : !!modulePerms[action];
    }, [currentUser, org.data.customRoles]);

    // Fail-Safe Unified Data
    const appData = useMemo(() => {
        return { 
            ...org.data, ...inv.data, ...support.data, ...compliance.data,
            collaborators: org.data.collaborators || [],
            equipment: inv.data.equipment || [],
            tickets: support.data.tickets || [],
            assignments: inv.data.assignments || [],
            messages: support.data.messages || [],
            softwareLicenses: inv.data.softwareLicenses || [],
            licenseAssignments: inv.data.licenseAssignments || [],
            teams: support.data.teams || [],
            teamMembers: support.data.teamMembers || [],
            vulnerabilities: compliance.data.vulnerabilities || [],
            securityTrainings: compliance.data.securityTrainings || [],
            brands: inv.data.brands || [],
            equipmentTypes: inv.data.equipmentTypes || [],
            policies: compliance.data.policies || [],
            policyAcceptances: compliance.data.policyAcceptances || []
        };
    }, [org.data, inv.data, support.data, compliance.data]);

    const refreshAll = useCallback(async (force = false) => {
        if (isRefreshing.current) return;
        isRefreshing.current = true;
        setIsSyncing(true);
        try {
            // Forçamos o refresh global se solicitado, senão o dataService gere o cache
            if (force) localStorage.removeItem('aimanager_cache_timestamp');
            await Promise.allSettled([org.refresh(), inv.refresh(), support.refresh(), compliance.refresh()]);
        } finally {
            isRefreshing.current = false;
            setTimeout(() => setIsSyncing(false), 600);
        }
    }, [org, inv, support, compliance]);

    useEffect(() => {
        if (!isConfigured) return;
        const supabase = getSupabase();
        const initSession = async () => {
            const { data: { session: curSess } } = await supabase.auth.getSession();
            setSession(curSess);
            if (curSess?.user) {
                const user = org.data.collaborators.find(c => c.email === curSess.user.email);
                if (user) { setCurrentUser(user); setIsAppLoading(false); }
                else if (org.data.collaborators.length > 0) setIsAppLoading(false);
            } else setIsAppLoading(false);
        };
        initSession();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: any, curSess: any) => setSession(curSess));
        
        // Aumentado para 5 minutos (300.000ms) para poupança de egress/transferência de dados
        const interval = setInterval(() => { if(!isAppLoading && currentUser) refreshAll(); }, 300000);
        
        return () => { subscription.unsubscribe(); clearInterval(interval); };
    }, [org.data.collaborators, isConfigured, isAppLoading, currentUser, refreshAll]);

    if (!isConfigured) return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    if (isAppLoading) return <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mb-4"></div><p className="font-bold tracking-widest text-gray-500 uppercase text-xs">AIManager Absolute Zero</p></div>;
    if (!currentUser) return <LoginPage onLogin={async () => ({ success: true })} onForgotPassword={() => {}} />;

    const mainMarginClass = layoutMode === 'side' ? (sidebarExpanded ? 'md:ml-64' : 'md:ml-20') : '';

    return (
        <div className={`min-h-screen bg-background-dark text-on-surface-dark-secondary flex flex-col ${layoutMode === 'side' ? 'md:flex-row' : ''}`}>
            {isSyncing && <div className="fixed top-0 left-0 w-full h-1 z-[200] overflow-hidden bg-gray-800"><div className="h-full bg-brand-secondary animate-pulse w-full origin-left transform scale-x-0" style={{ animation: 'progress 1s infinite linear' }}></div></div>}
            
            {showProfile && <UserProfileModal user={currentUser} entidade={org.data.entidades.find(e => e.id === currentUser.entidade_id)} instituicao={org.data.instituicoes.find(i => i.id === currentUser.instituicao_id)} onClose={() => setShowProfile(false)} onUpdatePhoto={async (url) => { await dataService.updateMyPhoto(currentUser.id, url); refreshAll(true); }} />}
            {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} expiringWarranties={appData.equipment.filter(e => e.warranty_end_date && new Date(e.warranty_end_date) <= new Date(Date.now() + 30*24*60*60*1000))} expiringLicenses={appData.softwareLicenses.filter(l => l.expiry_date && new Date(l.expiry_date) <= new Date(Date.now() + 30*24*60*60*1000))} teamTickets={appData.tickets.filter(t => t.status === 'Pedido')} collaborators={appData.collaborators} teams={appData.teams} onViewItem={(t, f) => { setActiveTab(t); setDashboardFilter(f); setShowNotifications(false); }} currentUser={currentUser} licenseAssignments={appData.licenseAssignments} />}
            {showCalendar && <CalendarModal onClose={() => setShowCalendar(false)} tickets={appData.tickets} currentUser={currentUser} teams={appData.teams} teamMembers={appData.teamMembers} collaborators={appData.collaborators} onViewTicket={(t) => { setActiveTab('tickets.list'); setDashboardFilter({ id: t.id }); setShowCalendar(false); }} calendarEvents={appData.calendarEvents} />}
            {showUserManual && <UserManualModal onClose={() => setShowUserManual(false)} />}
            {reportType && <ReportModal type={reportType} onClose={() => setReportType(null)} equipment={appData.equipment} brandMap={new Map(appData.brands.map((b: any) => [b.id, b.name]))} equipmentTypeMap={new Map(appData.equipmentTypes.map((t: any) => [t.id, t.name]))} instituicoes={appData.instituicoes} escolasDepartamentos={appData.entidades} collaborators={appData.collaborators} assignments={appData.assignments} tickets={appData.tickets} softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments} businessServices={appData.businessServices} serviceDependencies={appData.serviceDependencies} />}
            
            {layoutMode === 'side' ? (
                <Sidebar currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => { getSupabase().auth.signOut(); window.location.reload(); }} tabConfig={{}} notificationCount={0} onNotificationClick={() => setShowNotifications(true)} isExpanded={sidebarExpanded} onHover={setSidebarExpanded} onOpenProfile={() => setShowProfile(true)} onOpenCalendar={() => setShowCalendar(true)} onOpenManual={() => setShowUserManual(true)} checkPermission={checkPermission} />
            ) : (
                <Header currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => { getSupabase().auth.signOut(); window.location.reload(); }} tabConfig={{}} notificationCount={0} onNotificationClick={() => setShowNotifications(true)} onOpenProfile={() => setShowProfile(true)} onOpenCalendar={() => setShowCalendar(true)} onOpenManual={() => setShowUserManual(true)} checkPermission={checkPermission} />
            )}

            <main className={`flex-1 p-4 md:p-8 overflow-y-auto h-screen custom-scrollbar transition-all duration-300 ${mainMarginClass}`}>
                <div className="max-w-7xl mx-auto">
                    {activeTab.startsWith('overview') || activeTab === 'my_area' ? (
                        activeTab === 'overview.smart' ? <SmartDashboard tickets={appData.tickets} vulnerabilities={appData.vulnerabilities} backups={appData.backupExecutions} trainings={appData.securityTrainings} collaborators={appData.collaborators} currentUser={currentUser} /> :
                        checkPermission('widget_kpi_cards', 'view') && activeTab === 'overview' ? <OverviewDashboard equipment={appData.equipment} instituicoes={appData.instituicoes} entidades={appData.entidades} assignments={appData.assignments} equipmentTypes={appData.equipmentTypes} tickets={appData.tickets} collaborators={appData.collaborators} teams={appData.teams} expiringWarranties={[]} expiringLicenses={[]} softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments} vulnerabilities={appData.vulnerabilities} onViewItem={(t,f) => { setActiveTab(t); setDashboardFilter(f); }} onGenerateComplianceReport={() => {}} checkPermission={checkPermission} onRefresh={() => refreshAll(true)} /> :
                        <SelfServiceDashboard currentUser={currentUser} equipment={appData.equipment} assignments={appData.assignments} softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments} trainings={appData.securityTrainings} brands={appData.brands} types={appData.equipmentTypes} policies={appData.policies} acceptances={appData.policyAcceptances} tickets={appData.tickets} onViewTicket={setViewingTicket} onViewPolicy={setReadingPolicy} onViewEquipment={setViewingEquipment} onViewTraining={setViewingTraining} onViewLicense={setViewingLicense} />
                    ) : null}

                    {(activeTab.startsWith('equipment') || activeTab === 'licensing') && <InventoryManager activeTab={activeTab} appData={appData} checkPermission={checkPermission} refreshData={() => refreshAll(true)} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} setReportType={setReportType} currentUser={currentUser} onViewItem={(t,f) => { setActiveTab(t); setDashboardFilter(f); }} />}
                    {(activeTab.startsWith('organizacao') || activeTab === 'collaborators') && <OrganizationManager activeTab={activeTab} appData={appData} checkPermission={checkPermission} refreshData={() => refreshAll(true)} currentUser={currentUser} setActiveTab={setActiveTab} onStartChat={(c) => { setActiveChatCollaboratorId(c.id); setChatOpen(true); }} setReportType={setReportType} />}
                    {activeTab === 'tickets.list' && <TicketManager appData={appData} checkPermission={checkPermission} refreshData={() => refreshAll(true)} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} setReportType={setReportType} currentUser={currentUser} />}
                    {activeTab.startsWith('nis2') && <ComplianceManager activeTab={activeTab} appData={appData} checkPermission={checkPermission} refreshData={() => refreshAll(true)} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} setReportType={setReportType} currentUser={currentUser} />}
                    {activeTab === 'reports' && <BIReportDashboard appData={appData} />}
                    {activeTab === 'settings' && <SettingsManager appData={appData} refreshData={() => refreshAll(true)} />}
                    {activeTab === 'tools.agenda' && <AgendaDashboard />}
                    {activeTab === 'tools.map' && <MapDashboard instituicoes={appData.instituicoes} entidades={appData.entidades} suppliers={appData.suppliers} equipment={appData.equipment} assignments={appData.assignments} />}
                </div>
            </main>

            <MagicCommandBar brands={appData.brands} types={appData.equipmentTypes} collaborators={appData.collaborators} currentUser={currentUser} onAction={() => {}} />
            <ChatWidget currentUser={currentUser} collaborators={appData.collaborators} messages={appData.messages} onSendMessage={async (r,c) => { await dataService.addMessage({ sender_id: currentUser.id, receiver_id: r, content: c, timestamp: new Date().toISOString(), read: false }); refreshAll(true); }} onMarkMessagesAsRead={async (id) => { await dataService.markMessagesAsRead(id); refreshAll(true); }} isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} activeChatCollaboratorId={activeChatCollaboratorId} unreadMessagesCount={appData.messages.filter((m: any) => m.receiver_id === currentUser.id && !m.read).length} onSelectConversation={setActiveChatCollaboratorId} checkPermission={checkPermission} />
            
            <ModalOrchestrator currentUser={currentUser} appData={appData} checkPermission={checkPermission} refreshSupport={() => refreshAll(true)} viewingTicket={viewingTicket} setViewingTicket={setViewingTicket} viewingEquipment={viewingEquipment} setViewingEquipment={setViewingEquipment} readingPolicy={readingPolicy} setReadingPolicy={setReadingPolicy} viewingLicense={viewingLicense} setViewingLicense={setViewingLicense} viewingTraining={viewingTraining} setViewingTraining={setViewingTraining} setActiveTab={setActiveTab} setDashboardFilter={setDashboardFilter} />
        </div>
    );
};
