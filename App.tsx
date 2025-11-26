import React, { useState, useEffect, useMemo } from 'react';
import { 
    Collaborator, UserRole, ModuleKey, PermissionAction, defaultTooltipConfig, Ticket 
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
import OrganizationManager from './features/organization/OrganizationManager';
import TicketManager from './features/tickets/TicketManager';
import ComplianceManager from './features/compliance/ComplianceManager';
import SettingsManager from './features/settings/SettingsManager';

// Dashboards (Non-Refactored Modules)
import OverviewDashboard from './components/OverviewDashboard';
import SmartDashboard from './components/SmartDashboard';
import AgendaDashboard from './components/AgendaDashboard';
import MapDashboard from './components/MapDashboard';
import ReportsDashboard from './components/ReportsDashboard';

// Modals (Global or Non-Refactored)
import AddTicketModal from './components/AddTicketModal';
import ReportModal from './components/ReportModal';
import UserManualModal from './components/UserManualModal';
import CalendarModal from './components/CalendarModal';
import MagicCommandBar from './components/MagicCommandBar';
import { ChatWidget } from './components/ChatWidget';
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
    
    // -- Global/Utility Modals State --
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
    
    // Global Ticket Creation (Magic Bar)
    const [showAddTicketModal, setShowAddTicketModal] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<any>(null);
    
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
                    onOpenProfile={() => { alert("Perfil - Clique no seu nome"); }} // Simplified, usually opens Detail Modal
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
                    onOpenProfile={() => { alert("Perfil - Clique no seu nome"); }}
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

                    {/* --- MODULARIZED MANAGERS --- */}
                    
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
                    
                    {(activeTab.startsWith('organizacao') || activeTab === 'collaborators') && (
                         <OrganizationManager 
                            activeTab={activeTab}
                            appData={appData}
                            checkPermission={checkPermission}
                            refreshData={refreshData}
                            currentUser={currentUser}
                            setActiveTab={setActiveTab}
                            onStartChat={(c) => { setActiveChatCollaboratorId(c.id); setShowChatWidget(true); }}
                            setReportType={(t) => { setReportType(t as any); setShowReportModal(true); }}
                        />
                    )}
                    
                    {activeTab.startsWith('tickets') && (
                        <TicketManager 
                            appData={appData}
                            checkPermission={checkPermission}
                            refreshData={refreshData}
                            dashboardFilter={dashboardFilter}
                            setDashboardFilter={setDashboardFilter}
                            setReportType={(t) => { setReportType(t as any); setShowReportModal(true); }}
                            currentUser={currentUser}
                        />
                    )}

                    {activeTab.startsWith('nis2') && (
                        <ComplianceManager 
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

                    {activeTab === 'settings' && (
                        <SettingsManager 
                            appData={appData}
                            refreshData={refreshData}
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
                </div>
            </main>

            {/* --- GLOBAL MODALS --- */}
            {showReportModal && (
                <ReportModal 
                    type={reportType} 
                    onClose={() => setShowReportModal(false)}
                    equipment={appData.equipment}
                    brandMap={new Map(appData.brands.map((b: any) => [b.id, b.name]))}
                    equipmentTypeMap={new Map(appData.equipmentTypes.map((t: any) => [t.id, t.name]))}
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
            
            {showNotificationsModal && (
                <NotificationsModal 
                    onClose={() => setShowNotificationsModal(false)}
                    expiringWarranties={[]} // Logic should be inside useAppData or passed properly
                    expiringLicenses={[]}
                    teamTickets={appData.tickets.filter((t: Ticket) => t.status === 'Pedido')}
                    collaborators={appData.collaborators}
                    teams={appData.teams}
                    onViewItem={handleViewItem}
                    onSnooze={dataService.snoozeNotification}
                    currentUser={currentUser}
                    licenseAssignments={appData.licenseAssignments}
                />
            )}

            {/* Global Ticket Creation Modal (Called from MagicBar or other places) */}
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
                unreadMessagesCount={appData.messages.filter((m: any) => m.receiverId === currentUser.id && !m.read).length}
            />
            
            {isConfigured && (
                <MagicCommandBar 
                    brands={appData.brands}
                    types={appData.equipmentTypes}
                    collaborators={appData.collaborators}
                    currentUser={currentUser}
                    onAction={async (intent, data) => {
                        if (intent === 'create_equipment') {
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