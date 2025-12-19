
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
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
import UserManualModal from './components/UserManualModal';
import CalendarModal from './components/CalendarModal';
import MapDashboard from './components/MapDashboard';
import SettingsManager from './features/settings/SettingsManager';
import { getSupabase } from './services/supabaseClient';
import * as dataService from './services/dataService';
import { ModuleKey, PermissionAction, Collaborator, UserRole, Ticket, Policy, Assignment } from './types';
import AgendaDashboard from './components/AgendaDashboard';

// Atomics Hooks
import { useOrganization } from './hooks/useOrganization';
import { useInventory } from './hooks/useInventory';
import { useSupport } from './hooks/useSupport';
import { useCompliance } from './hooks/useCompliance';

export const App: React.FC = () => {
    const { layoutMode } = useLayout();
    const { t } = useLanguage();

    // 1. Session & Global Config State
    const [isConfigured, setIsConfigured] = useState<boolean>(() => {
        const storageUrl = localStorage.getItem('SUPABASE_URL');
        const storageKey = localStorage.getItem('SUPABASE_ANON_KEY');
        return !!(storageUrl && storageKey);
    });
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [session, setSession] = useState<any>(null);
    const [isAppLoading, setIsAppLoading] = useState(true);

    // 2. Feature Hooks (Atomic Separation)
    const org = useOrganization(isConfigured);
    const inv = useInventory(isConfigured);
    const support = useSupport(isConfigured);
    const compliance = useCompliance(isConfigured);

    // 3. UI State
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [dashboardFilter, setDashboardFilter] = useState<any>(null);
    const [reportType, setReportType] = useState<string | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserManual, setShowUserManual] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [activeChatCollaboratorId, setActiveChatCollaboratorId] = useState<string | null>(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
    const [readingPolicy, setReadingPolicy] = useState<Policy | null>(null);

    // 4. Permission Checking Logic
    const checkPermission = useCallback((module: ModuleKey, action: PermissionAction): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === 'SuperAdmin' || currentUser.role === UserRole.SuperAdmin) return true;
        
        const role = org.data.customRoles.find(r => r.name === currentUser.role);
        if (!role || !role.permissions) return false;
        
        const modulePerms = role.permissions[module] || {};
        if (action === 'view' && modulePerms['view_own']) return true;
        return !!modulePerms[action];
    }, [currentUser, org.data.customRoles]);

    // 5. Data Compatibility & Security Filter Layer
    const appData = useMemo(() => {
        const rawData = {
            ...org.data,
            ...inv.data,
            ...support.data,
            ...compliance.data,
            messages: []
        };

        // FILTRAGEM PROFUNDA: Se o utilizador não tem visão global, limpamos o estado de dados sensíveis
        if (currentUser && !checkPermission('equipment', 'view')) {
            const myEquipmentIds = new Set(
                rawData.assignments
                    .filter((a: Assignment) => a.collaboratorId === currentUser.id && !a.returnDate)
                    .map((a: Assignment) => a.equipmentId)
            );
            rawData.equipment = rawData.equipment.filter(e => myEquipmentIds.has(e.id));
        }

        // Filtragem para Formações (Ver apenas as próprias se não for admin)
        if (currentUser && !checkPermission('compliance_training', 'view')) {
            rawData.securityTrainings = rawData.securityTrainings.filter(t => t.collaborator_id === currentUser.id);
        }

        return rawData;
    }, [org.data, inv.data, support.data, compliance.data, currentUser, checkPermission]);

    const refreshAll = useCallback(async () => {
        await Promise.all([
            org.refresh(),
            inv.refresh(),
            support.refresh(),
            compliance.refresh()
        ]);
    }, [org, inv, support, compliance]);

    // 6. Auth Logic
    useEffect(() => {
        const supabase = getSupabase();
        // Fix: Cast auth to any to resolve property 'getSession' does not exist error on SupabaseAuthClient
        (supabase.auth as any).getSession().then(({ data: { session: currentSession } }: any) => {
            setSession(currentSession);
            if (currentSession?.user) {
                const user = org.data.collaborators.find(c => c.email === currentSession.user.email);
                if (user) {
                    setCurrentUser(user);
                    setIsAppLoading(false);
                } else if (org.data.collaborators.length > 0) {
                    setIsAppLoading(false);
                }
            } else {
                setIsAppLoading(false);
            }
        });

        // Fix: Cast auth to any to resolve property 'onAuthStateChange' does not exist error on SupabaseAuthClient
        const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, newSession: any) => {
            setSession(newSession);
        });
        return () => subscription.unsubscribe();
    }, [org.data.collaborators]);

    const tabConfig = useMemo(() => {
        const canSeeMyArea = checkPermission('my_area', 'view');
        const canSeeKpis = checkPermission('widget_kpi_cards', 'view');
        
        return {
            'overview': canSeeMyArea || canSeeKpis,
            'my_area': canSeeMyArea,
            'overview.smart': checkPermission('dashboard_smart', 'view'),
            'equipment.inventory': checkPermission('equipment', 'view') || checkPermission('equipment', 'view_own'),
            'equipment.procurement': checkPermission('procurement', 'view'),
            'licensing': checkPermission('licensing', 'view') || checkPermission('licensing', 'view_own'),
            'organizacao.instituicoes': checkPermission('organization', 'view'),
            'organizacao.entidades': checkPermission('organization', 'view'),
            'collaborators': checkPermission('organization', 'view'),
            'organizacao.teams': checkPermission('organization', 'view'),
            'organizacao.suppliers': checkPermission('suppliers', 'view'),
            'tickets': checkPermission('tickets', 'view') || checkPermission('tickets', 'view_own'),
            'reports': checkPermission('reports', 'view'),
            'settings': checkPermission('settings', 'view'),
            'nis2': {
                bia: checkPermission('compliance_bia', 'view'),
                security: checkPermission('compliance_security', 'view'),
                backups: checkPermission('compliance_backups', 'view') || checkPermission('compliance_backups', 'view_own'),
                resilience: checkPermission('compliance_resilience', 'view') || checkPermission('compliance_resilience', 'view_own'),
                training: checkPermission('compliance_training', 'view') || checkPermission('compliance_training', 'view_own'),
                policies: checkPermission('compliance_policies', 'view') || checkPermission('compliance_policies', 'view_own'),
            },
            'tools': { agenda: true, map: true }
        };
    }, [checkPermission]);

    const handleLogout = async () => {
        const supabase = getSupabase();
        // Fix: Cast auth to any to resolve property 'signOut' does not exist error on SupabaseAuthClient
        await (supabase.auth as any).signOut();
        localStorage.removeItem('supabase.auth.token');
        setCurrentUser(null);
        window.location.reload();
    };

    const handleViewItem = (tab: string, filter: any) => {
        setActiveTab(tab);
        setDashboardFilter(filter);
    };

    if (!isConfigured) return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    if (isAppLoading || (session && !currentUser && org.data.collaborators.length === 0)) return <div className="min-h-screen bg-background-dark flex items-center justify-center text-white font-bold">A preparar ambiente seguro...</div>;
    if (!currentUser) return <LoginPage onLogin={async () => ({ success: true })} onForgotPassword={() => {}} />;

    const mainMarginClass = layoutMode === 'side' ? (sidebarExpanded ? 'md:ml-64' : 'md:ml-20') : '';

    return (
        <div className={`min-h-screen bg-background-dark text-on-surface-dark-secondary flex flex-col ${layoutMode === 'side' ? 'md:flex-row' : ''}`}>
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
                                onGenerateComplianceReport={() => {}} checkPermission={checkPermission} onRefresh={refreshAll}
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

                    {activeTab === 'my_area' && (
                        <SelfServiceDashboard 
                            currentUser={currentUser} equipment={appData.equipment} assignments={appData.assignments}
                            softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments}
                            trainings={appData.securityTrainings} brands={appData.brands} types={appData.equipmentTypes}
                            policies={appData.policies} acceptances={appData.policyAcceptances} tickets={appData.tickets}
                            onViewTicket={setViewingTicket} onViewPolicy={setReadingPolicy}
                        />
                    )}

                    {activeTab === 'overview.smart' && (
                        <SmartDashboard 
                            tickets={appData.tickets} vulnerabilities={appData.vulnerabilities} backups={appData.backupExecutions}
                            trainings={appData.securityTrainings} collaborators={appData.collaborators} currentUser={currentUser}
                        />
                    )}

                    {(activeTab.startsWith('equipment') || activeTab === 'licensing') && (
                        <InventoryManager 
                            activeTab={activeTab} appData={appData} checkPermission={checkPermission}
                            refreshData={inv.refresh} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter}
                            setReportType={setReportType} currentUser={currentUser} onViewItem={handleViewItem}
                        />
                    )}

                    {(activeTab.startsWith('organizacao') || activeTab === 'collaborators') && (
                        <OrganizationManager 
                            activeTab={activeTab} appData={appData} checkPermission={checkPermission}
                            refreshData={org.refresh} currentUser={currentUser} setActiveTab={setActiveTab}
                            onStartChat={(c) => { setActiveChatCollaboratorId(c.id); setChatOpen(true); }}
                            setReportType={setReportType}
                        />
                    )}

                    {activeTab === 'tickets.list' && (
                        <TicketManager 
                            appData={appData} checkPermission={checkPermission} refreshData={support.refresh}
                            dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter}
                            setReportType={setReportType} currentUser={currentUser}
                        />
                    )}

                    {activeTab.startsWith('nis2') && (
                        <ComplianceManager 
                            activeTab={activeTab} appData={appData} checkPermission={checkPermission}
                            refreshData={compliance.refresh} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter}
                            setReportType={setReportType} currentUser={currentUser}
                        />
                    )}
                    
                    {activeTab === 'reports' && <BIReportDashboard appData={appData} />}
                    {activeTab === 'settings' && <SettingsManager appData={appData} refreshData={refreshAll} />}
                    {activeTab === 'tools.agenda' && <AgendaDashboard />}
                    {activeTab === 'tools.map' && <MapDashboard instituicoes={appData.instituicoes} entidades={appData.entidades} suppliers={appData.suppliers} equipment={appData.equipment} assignments={appData.assignments} />}
                </div>
            </main>

            <MagicCommandBar brands={appData.brands} types={appData.equipmentTypes} collaborators={appData.collaborators} currentUser={currentUser} onAction={() => {}} />
            <ChatWidget currentUser={currentUser} collaborators={appData.collaborators} messages={appData.messages} onSendMessage={() => {}} onMarkMessagesAsRead={() => {}} isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} activeChatCollaboratorId={activeChatCollaboratorId} unreadMessagesCount={0} onSelectConversation={setActiveChatCollaboratorId} />
            {showUserManual && <UserManualModal onClose={() => setShowUserManual(false)} />}
            {showCalendar && <CalendarModal onClose={() => setShowCalendar(false)} tickets={appData.tickets} currentUser={currentUser} teams={appData.teams} teamMembers={appData.teamMembers} collaborators={appData.collaborators} onViewTicket={(t) => { handleViewItem('tickets.list', { id: t.id }); setShowCalendar(false); }} calendarEvents={appData.calendarEvents} />}
        </div>
    );
};
