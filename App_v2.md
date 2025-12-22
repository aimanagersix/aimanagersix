
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
import { FaDatabase, FaWifi } from 'react-icons/fa';

// Atomic Hooks
import { useOrganization } from './hooks/useOrganization';
import { useInventory } from './hooks/useInventory';
import { useSupport } from './hooks/useSupport';
import { useCompliance } from './hooks/useCompliance';

const GENERAL_CHANNEL_ID = '00000000-0000-0000-0000-000000000000';
const SYSTEM_SENDER_ID = '00000000-0000-0000-0000-000000000000';

export const App: React.FC = () => {
    const { layoutMode } = useLayout();
    const { t } = useLanguage();
    const isRefreshing = useRef(false);

    const [isConfigured, setIsConfigured] = useState<boolean>(() => {
        if (dataService.isUsingMock()) return true;
        return !!(process.env.SUPABASE_URL || localStorage.getItem('SUPABASE_URL'));
    });
    
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [session, setSession] = useState<any>(null);
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    
    const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set());

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
    
    const [reportType, setReportType] = useState<string | null>(null);
    const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
    const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);
    const [readingPolicy, setReadingPolicy] = useState<Policy | null>(null);
    const [viewingLicense, setViewingLicense] = useState<SoftwareLicense | null>(null);
    const [viewingTraining, setViewingTraining] = useState<SecurityTrainingRecord | null>(null);

    const checkPermission = useCallback((module: ModuleKey, action: PermissionAction): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === 'SuperAdmin' || currentUser.role === UserRole.SuperAdmin) return true;
        const role = org.data.customRoles.find(r => r.name === currentUser.role);
        if (!role || !role.permissions) return false;
        const modulePerms = role.permissions[module] || {};
        return action === 'view' && modulePerms['view_own'] ? true : !!modulePerms[action];
    }, [currentUser, org.data.customRoles]);

    const userTeamIds = useMemo(() => {
        if (!currentUser || !support.data.teamMembers) return [];
        return support.data.teamMembers.filter((tm: any) => tm.collaborator_id === currentUser.id).map((tm: any) => tm.team_id);
    }, [support.data.teamMembers, currentUser]);

    const loadSnoozedIds = useCallback(() => {
        const raw = localStorage.getItem('snoozed_notifications');
        if (raw) {
            try {
                const data = JSON.parse(raw);
                const now = new Date().toISOString();
                const active = new Set<string>();
                if (Array.isArray(data)) {
                    data.forEach((item: any) => {
                        if (item.until > now) active.add(item.id);
                    });
                }
                setSnoozedIds(active);
            } catch (e) { console.error(e); }
        } else {
            setSnoozedIds(new Set());
        }
    }, []);

    useEffect(() => {
        loadSnoozedIds();
        window.addEventListener('storage', loadSnoozedIds);
        return () => window.removeEventListener('storage', loadSnoozedIds);
    }, [loadSnoozedIds]);

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

    const teamTicketsForNotifications = useMemo(() => {
        if (!currentUser || !appData.tickets) return [];
        if (currentUser.role === 'Admin' || currentUser.role === 'SuperAdmin') {
            return appData.tickets.filter((t: any) => t.status !== 'Finalizado' && t.status !== 'Cancelado');
        }
        return appData.tickets.filter((t: any) => 
            (t.status !== 'Finalizado' && t.status !== 'Cancelado') && 
            (
                (t.team_id && userTeamIds.includes(t.team_id)) || 
                t.technician_id === currentUser.id || 
                t.collaborator_id === currentUser.id
            )
        );
    }, [appData.tickets, currentUser, userTeamIds]);

    const alertBadgeCount = useMemo(() => {
        if (!currentUser) return 0;
        const unreadMsgs = (appData.messages || []).filter((m: any) => {
            const isTarget = m.receiver_id === currentUser.id || m.receiver_id === GENERAL_CHANNEL_ID;
            const isUnread = !m.read && m.sender_id !== currentUser.id;
            if (!isTarget || !isUnread) return false;
            if (m.receiver_id === GENERAL_CHANNEL_ID && m.sender_id === SYSTEM_SENDER_ID) {
                const content = m.content.toUpperCase();
                const isTicket = content.includes('TICKET') || content.includes('ATRIBUIÇÃO') || content.includes('ATUALIZAÇÃO');
                const isLicense = content.includes('LICENÇA');
                const isWarranty = content.includes('GARANTIA');
                if (isTicket && !checkPermission('msg_tickets', 'view')) return false;
                if (isLicense && !checkPermission('msg_licenses', 'view')) return false;
                if (isWarranty && !checkPermission('msg_warranties', 'view')) return false;
            }
            return true;
        }).length;
        const canSeeTicketNotifs = checkPermission('notif_tickets', 'view');
        const pendingTicketsCount = canSeeTicketNotifs ? teamTicketsForNotifications.filter((t: any) => t.status === 'Pedido' && !snoozedIds.has(t.id)).length : 0;
        const now = new Date();
        const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const canSeeLicenseNotifs = checkPermission('notif_licenses', 'view');
        const criticalExpiringLicenses = canSeeLicenseNotifs ? (appData.softwareLicenses || []).filter((l: any) => l.expiry_date && new Date(l.expiry_date) <= next30 && !snoozedIds.has(l.id)).length : 0;
        const canSeeWarrantyNotifs = checkPermission('notif_warranties', 'view');
        const criticalExpiringWarranties = canSeeWarrantyNotifs ? (appData.equipment || []).filter((e: any) => e.warranty_end_date && new Date(e.warranty_end_date) <= next30 && !snoozedIds.has(e.id)).length : 0;
        return unreadMsgs + pendingTicketsCount + criticalExpiringLicenses + criticalExpiringWarranties;
    }, [appData.messages, appData.softwareLicenses, appData.equipment, teamTicketsForNotifications, currentUser, snoozedIds, checkPermission]);

    const refreshAll = useCallback(async (force = false) => {
        if (isRefreshing.current) return;
        isRefreshing.current = true;
        setIsSyncing(true);
        try {
            if (force) {
                localStorage.removeItem('aimanager_global_cache');
                localStorage.removeItem('aimanager_cache_timestamp');
            }
            await Promise.allSettled([org.refresh(), inv.refresh(), support.refresh(), compliance.refresh()]);
        } finally {
            isRefreshing.current = false;
            setTimeout(() => setIsSyncing(false), 600);
        }
    }, [org, inv, support, compliance]);

    useEffect(() => {
        if (!isConfigured) return;
        
        // --- MOCK LOGIN LOGIC ---
        if (dataService.isUsingMock()) {
            // Procura pelo SuperAdmin raiz ou pelo primeiro disponível
            const mockUser = appData.collaborators.find((c: any) => c.id === 'user-superadmin') || appData.collaborators[0];
            if (mockUser) {
                setCurrentUser(mockUser);
                setIsAppLoading(false);
            } else if (org.data.collaborators.length > 0) {
                 // Fallback para quando o appData ainda está a fundir
                setCurrentUser(org.data.collaborators[0]);
                setIsAppLoading(false);
            }
            return;
        }

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
        const interval = setInterval(() => { if(!isAppLoading && currentUser) refreshAll(); }, 30000);
        return () => { subscription.unsubscribe(); clearInterval(interval); };
    }, [org.data.collaborators, isConfigured, isAppLoading, currentUser, refreshAll, appData.collaborators]);

    const handleNavigateFromChat = useCallback((ticketId: string) => {
        setActiveTab('tickets.list');
        setDashboardFilter({ id: ticketId });
        setChatOpen(false);
    }, []);

    if (!isConfigured) return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    if (isAppLoading) return <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mb-4"></div><p className="font-bold tracking-widest text-gray-500 uppercase text-xs">AIManager Absolute Zero</p></div>;
    if (!currentUser) return <LoginPage onLogin={async () => ({ success: true })} onForgotPassword={() => {}} />;

    const mainMarginClass = layoutMode === 'side' ? (sidebarExpanded ? 'md:ml-64' : 'md:ml-20') : '';

    return (
        <div className={`min-h-screen bg-background-dark text-on-surface-dark-secondary flex flex-col ${layoutMode === 'side' ? 'md:flex-row' : ''}`}>
            {isSyncing && <div className="fixed top-0 left-0 w-full h-1 z-[200] overflow-hidden bg-gray-800"><div className="h-full bg-brand-secondary animate-pulse w-full origin-left transform scale-x-0" style={{ animation: 'progress 1s infinite linear' }}></div></div>}
            
            {/* MOCK MODE INDICATOR */}
            {dataService.isUsingMock() && (
                <div className="fixed bottom-4 left-4 z-[300] bg-orange-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold border-2 border-white/20 animate-pulse">
                    <FaDatabase /> MOCK MODE (Offline)
                </div>
            )}

            {showProfile && <UserProfileModal user={currentUser} entidade={org.data.entidades.find(e => e.id === currentUser.entidade_id)} instituicao={org.data.instituicoes.find(i => i.id === currentUser.instituicao_id)} onClose={() => setShowProfile(false)} onUpdatePhoto={async (url) => { await dataService.updateMyPhoto(currentUser.id, url); refreshAll(true); }} />}
            {showNotifications && (
                <NotificationsModal 
                    onClose={() => setShowNotifications(false)} 
                    expiringWarranties={checkPermission('notif_warranties', 'view') ? appData.equipment.filter(e => e.warranty_end_date && new Date(e.warranty_end_date) <= new Date(Date.now() + 30*24*60*60*1000)) : []} 
                    expiringLicenses={checkPermission('notif_licenses', 'view') ? appData.softwareLicenses.filter(l => l.expiry_date && new Date(l.expiry_date) <= new Date(Date.now() + 30*24*60*60*1000)) : []} 
                    teamTickets={checkPermission('notif_tickets', 'view') ? teamTicketsForNotifications : []} 
                    collaborators={appData.collaborators} 
                    teams={appData.teams} 
                    onViewItem={(t, f) => { setActiveTab(t); setDashboardFilter(f); setShowNotifications(false); }} 
                    currentUser={currentUser} 
                    licenseAssignments={appData.licenseAssignments} 
                    checkPermission={checkPermission}
                />
            )}
            {showCalendar && <CalendarModal onClose={() => setShowCalendar(false)} tickets={appData.tickets} currentUser={currentUser} teams={appData.teams} teamMembers={appData.teamMembers} collaborators={appData.collaborators} onViewTicket={(t) => { setActiveTab('tickets.list'); setDashboardFilter({ id: t.id }); setShowCalendar(false); }} calendarEvents={appData.calendarEvents} />}
            {showUserManual && <UserManualModal onClose={() => setShowUserManual(false)} />}
            {reportType && <ReportModal type={reportType} onClose={() => setReportType(null)} equipment={appData.equipment} brandMap={new Map(appData.brands.map((b: any) => [b.id, b.name]))} equipmentTypeMap={new Map(appData.equipmentTypes.map((t: any) => [t.id, t.name]))} instituicoes={appData.instituicoes} escolasDepartamentos={appData.entidades} collaborators={appData.collaborators} assignments={appData.assignments} tickets={appData.tickets} softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments} businessServices={appData.businessServices} serviceDependencies={appData.serviceDependencies} />}
            
            {layoutMode === 'side' ? (
                <Sidebar currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => { getSupabase().auth.signOut(); window.location.reload(); }} tabConfig={{}} notificationCount={alertBadgeCount} onNotificationClick={() => setShowNotifications(true)} isExpanded={sidebarExpanded} onHover={setSidebarExpanded} onOpenProfile={() => setShowProfile(true)} onOpenCalendar={() => setShowCalendar(true)} onOpenManual={() => setShowUserManual(true)} checkPermission={checkPermission} />
            ) : (
                <Header currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => { getSupabase().auth.signOut(); window.location.reload(); }} tabConfig={{}} notificationCount={alertBadgeCount} onNotificationClick={() => setShowNotifications(true)} onOpenProfile={() => setShowProfile(true)} onOpenCalendar={() => setShowCalendar(true)} onOpenManual={() => setShowUserManual(true)} checkPermission={checkPermission} />
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
                    {activeTab === 'tickets.list' && <TicketManager appData={appData} checkPermission={checkPermission} refreshData={() => refreshAll(true)} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} setReportType={setReportType} currentUser={currentUser} onViewEquipment={setViewingEquipment} onViewLicense={setViewingLicense} />}
                    {activeTab.startsWith('nis2') && <ComplianceManager activeTab={activeTab} appData={appData} checkPermission={checkPermission} refreshData={() => refreshAll(true)} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} setReportType={setReportType} currentUser={currentUser} />}
                    {activeTab === 'reports' && <BIReportDashboard appData={appData} />}
                    {activeTab === 'settings' && <SettingsManager appData={appData} refreshData={() => refreshAll(true)} />}
                    {activeTab === 'tools.agenda' && <AgendaDashboard />}
                    {activeTab === 'tools.map' && <MapDashboard instituicoes={appData.instituicoes} entidades={appData.entidades} suppliers={appData.suppliers} equipment={appData.equipment} assignments={appData.assignments} />}
                </div>
            </main>

            <MagicCommandBar brands={appData.brands} types={appData.equipmentTypes} collaborators={appData.collaborators} currentUser={currentUser} onAction={() => {}} />
            <ChatWidget 
                currentUser={currentUser} collaborators={appData.collaborators} messages={appData.messages} 
                onSendMessage={async (r,c) => { if(dataService.isUsingMock()) return; await dataService.addMessage({ sender_id: currentUser.id, receiver_id: r, content: c, timestamp: new Date().toISOString(), read: false }); refreshAll(true); }} 
                onMarkMessagesAsRead={async (id) => { if(dataService.isUsingMock()) return; await dataService.markMessagesAsRead(id); refreshAll(true); }} 
                isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} activeChatCollaboratorId={activeChatCollaboratorId} 
                unreadMessagesCount={alertBadgeCount} onSelectConversation={setActiveChatCollaboratorId} 
                onNavigateToTicket={handleNavigateFromChat}
                checkPermission={checkPermission}
            />
            
            <ModalOrchestrator currentUser={currentUser} appData={appData} checkPermission={checkPermission} refreshSupport={() => refreshAll(true)} viewingTicket={viewingTicket} setViewingTicket={setViewingTicket} viewingEquipment={viewingEquipment} setViewingEquipment={setViewingEquipment} readingPolicy={readingPolicy} setReadingPolicy={setReadingPolicy} viewingLicense={viewingLicense} setViewingLicense={setViewingLicense} viewingTraining={viewingTraining} setViewingTraining={setViewingTraining} setActiveTab={setActiveTab} setDashboardFilter={setDashboardFilter} />
        </div>
    );
};
