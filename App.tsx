
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './Sidebar';
import { useAppData } from './hooks/useAppData';
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
import NotificationsModal from './components/NotificationsModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import ReportModal from './components/ReportModal';
import UserManualModal from './components/UserManualModal';
import CalendarModal from './components/CalendarModal';
import MapDashboard from './components/MapDashboard';
import SettingsManager from './features/settings/SettingsManager';
import { getSupabase } from './services/supabaseClient';
import * as dataService from './services/dataService';
import { ModuleKey, PermissionAction, Collaborator, UserRole, Ticket, TicketStatus, PolicyAcceptance, Policy } from './types';
import PolicyAcceptanceModal from './components/PolicyAcceptanceModal';
import AgendaDashboard from './components/AgendaDashboard';
import { AddTicketModal } from './components/AddTicketModal';

export const App: React.FC = () => {
    const { isConfigured, setIsConfigured, currentUser, setCurrentUser, appData, refreshData, isLoading } = useAppData();
    const { layoutMode } = useLayout();
    const { t } = useLanguage();

    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [dashboardFilter, setDashboardFilter] = useState<any>(null);
    const [reportType, setReportType] = useState<string | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserManual, setShowUserManual] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [activeChatCollaboratorId, setActiveChatCollaboratorId] = useState<string | null>(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [session, setSession] = useState<any>(null);

    const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
    const [readingPolicy, setReadingPolicy] = useState<Policy | null>(null);

    const checkPermission = useCallback((module: ModuleKey, action: PermissionAction): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === UserRole.SuperAdmin) return true;
        const role = appData.customRoles.find(r => r.name === currentUser.role);
        if (!role || !role.permissions) return false;
        
        const modulePerms = role.permissions[module] || {};
        
        // Se pedir 'view' (visibilidade da aba) e tiver 'view_own', autoriza a ver a aba
        if (action === 'view' && modulePerms['view_own']) return true;
        
        return !!modulePerms[action];
    }, [currentUser, appData.customRoles]);

    const tabConfig = useMemo(() => {
        // Visão Geral visível se tiver Minha Área OU KPIs Globais
        const canSeeMyArea = checkPermission('my_area', 'view');
        const canSeeKpis = checkPermission('widget_kpi_cards', 'view');
        
        return {
            'overview': canSeeMyArea || canSeeKpis,
            'my_area': canSeeMyArea,
            'overview.smart': checkPermission('dashboard_smart', 'view'),
            'equipment.inventory': checkPermission('equipment', 'view'),
            'equipment.procurement': checkPermission('procurement', 'view'),
            'licensing': checkPermission('licensing', 'view'),
            'organizacao.instituicoes': checkPermission('organization', 'view'),
            'organizacao.entidades': checkPermission('organization', 'view'),
            'collaborators': checkPermission('organization', 'view'),
            'organizacao.teams': checkPermission('organization', 'view'),
            'organizacao.suppliers': checkPermission('suppliers', 'view'),
            'tickets': checkPermission('tickets', 'view'),
            'reports': checkPermission('reports', 'view'),
            'settings': checkPermission('settings', 'view'),
            'nis2': {
                bia: checkPermission('compliance_bia', 'view'),
                security: checkPermission('compliance_security', 'view'),
                backups: checkPermission('compliance_backups', 'view'),
                resilience: checkPermission('compliance_resilience', 'view'),
                training: checkPermission('compliance_training', 'view'),
                policies: checkPermission('compliance_policies', 'view'),
            },
            'tools': {
                agenda: true,
                map: true
            }
        };
    }, [checkPermission]);

    useEffect(() => {
        const supabase = getSupabase();
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (_event === 'PASSWORD_RECOVERY') setShowResetPassword(true);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        setCurrentUser(null);
        window.location.reload();
    };

    const handleViewItem = (tab: string, filter: any) => {
        setActiveTab(tab);
        setDashboardFilter(filter);
    };

    if (!isConfigured) return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    if (isLoading) return <div className="min-h-screen bg-background-dark flex items-center justify-center text-white font-bold">A carregar sistema...</div>;
    if (!currentUser) return <LoginPage onLogin={async () => ({ success: true })} onForgotPassword={() => {}} />;

    const mainMarginClass = layoutMode === 'side' ? (sidebarExpanded ? 'md:ml-64' : 'md:ml-20') : '';

    return (
        <div className={`min-h-screen bg-background-dark text-on-surface-dark flex flex-col ${layoutMode === 'side' ? 'md:flex-row' : ''}`}>
            {layoutMode === 'side' ? (
                <Sidebar 
                    currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}
                    tabConfig={tabConfig} notificationCount={0} onNotificationClick={() => setShowNotifications(true)}
                    isExpanded={sidebarExpanded} onHover={setSidebarExpanded} onOpenProfile={() => setActiveTab('my_area')}
                    onOpenManual={() => setShowUserManual(true)} onOpenCalendar={() => setShowCalendar(true)}
                    checkPermission={checkPermission}
                />
            ) : (
                <Header 
                    currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}
                    tabConfig={tabConfig} notificationCount={0} onNotificationClick={() => setShowNotifications(true)}
                    onOpenProfile={() => setActiveTab('my_area')} onOpenManual={() => setShowUserManual(true)}
                    onOpenCalendar={() => setShowCalendar(true)} checkPermission={checkPermission}
                />
            )}

            <main className={`flex-1 p-4 md:p-8 overflow-y-auto h-screen custom-scrollbar transition-all duration-300 ${mainMarginClass}`}>
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'overview' && (
                        checkPermission('widget_kpi_cards', 'view') ? (
                            <OverviewDashboard 
                                equipment={appData.equipment} instituicoes={appData.instituicoes} entidades={appData.entidades}
                                assignments={appData.assignments} equipmentTypes={appData.equipmentTypes} tickets={appData.tickets}
                                collaborators={appData.collaborators} teams={appData.teams} expiringWarranties={[]}
                                expiringLicenses={[]} softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments}
                                vulnerabilities={appData.vulnerabilities} onViewItem={handleViewItem}
                                onGenerateComplianceReport={() => {}} checkPermission={checkPermission} onRefresh={refreshData}
                            />
                        ) : (
                            <SelfServiceDashboard 
                                currentUser={currentUser} equipment={appData.equipment} assignments={appData.assignments}
                                softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments}
                                trainings={appData.securityTrainings} brands={appData.brands} types={appData.equipmentTypes}
                                policies={appData.policies} acceptances={appData.policyAcceptances} tickets={appData.tickets}
                                onViewTicket={setViewingTicket} onViewPolicy={setReadingPolicy}
                            />
                        )
                    )}

                    {activeTab === 'my_area' && currentUser && (
                        <SelfServiceDashboard 
                            currentUser={currentUser} equipment={appData.equipment} assignments={appData.assignments}
                            softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments}
                            trainings={appData.securityTrainings} brands={appData.brands} types={appData.equipmentTypes}
                            policies={appData.policies} acceptances={appData.policyAcceptances} tickets={appData.tickets}
                            onViewTicket={setViewingTicket} onViewPolicy={setReadingPolicy}
                        />
                    )}

                    {(activeTab.startsWith('equipment') || activeTab === 'licensing') && (
                        <InventoryManager 
                            activeTab={activeTab} appData={appData} checkPermission={checkPermission}
                            refreshData={refreshData} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter}
                            setReportType={setReportType} currentUser={currentUser} onViewItem={handleViewItem}
                        />
                    )}

                    {(activeTab.startsWith('organizacao') || activeTab === 'collaborators') && (
                        <OrganizationManager 
                            activeTab={activeTab} appData={appData} checkPermission={checkPermission}
                            refreshData={refreshData} currentUser={currentUser} setActiveTab={setActiveTab}
                            onStartChat={(c) => { setActiveChatCollaboratorId(c.id); setChatOpen(true); }}
                            setReportType={setReportType}
                        />
                    )}

                    {activeTab === 'tickets.list' && (
                        <TicketManager 
                            appData={appData} checkPermission={checkPermission} refreshData={refreshData}
                            dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter}
                            setReportType={setReportType} currentUser={currentUser}
                        />
                    )}

                    {activeTab.startsWith('nis2') && (
                        <ComplianceManager 
                            activeTab={activeTab} appData={appData} checkPermission={checkPermission}
                            refreshData={refreshData} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter}
                            setReportType={setReportType} currentUser={currentUser}
                        />
                    )}
                    
                    {activeTab === 'reports' && <BIReportDashboard appData={appData} />}
                    {activeTab === 'settings' && <SettingsManager appData={appData} refreshData={refreshData} />}
                    {activeTab === 'tools.agenda' && <AgendaDashboard />}
                    {activeTab === 'tools.map' && <MapDashboard instituicoes={appData.instituicoes} entidades={appData.entidades} suppliers={appData.suppliers} equipment={appData.equipment} assignments={appData.assignments} />}
                </div>
            </main>

            <MagicCommandBar brands={appData.brands} types={appData.equipmentTypes} collaborators={appData.collaborators} currentUser={currentUser} onAction={() => {}} />
            <ChatWidget currentUser={currentUser} collaborators={appData.collaborators} messages={appData.messages} onSendMessage={() => {}} onMarkMessagesAsRead={() => {}} isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} activeChatCollaboratorId={activeChatCollaboratorId} unreadMessagesCount={0} onSelectConversation={setActiveChatCollaboratorId} />
            {showUserManual && <UserManualModal onClose={() => setShowUserManual(false)} />}
            {showCalendar && <CalendarModal onClose={() => setShowCalendar(false)} tickets={appData.tickets} currentUser={currentUser} teams={appData.teams} teamMembers={appData.teamMembers} collaborators={appData.collaborators} onViewTicket={(t) => { handleViewItem('tickets.list', { id: t.id }); setShowCalendar(false); }} calendarEvents={appData.calendarEvents} />}
            {showResetPassword && session && <ResetPasswordModal onClose={() => setShowResetPassword(false)} session={session} />}
        </div>
    );
};
