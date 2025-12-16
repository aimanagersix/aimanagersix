
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
    // Use Custom Hook for Data Management
    const { 
        isConfigured, setIsConfigured, 
        currentUser, setCurrentUser, 
        appData, refreshData,
        isLoading 
    } = useAppData();
    
    const { layoutMode } = useLayout();
    
    // Real-time Presence State
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

    // --- REALTIME PRESENCE TRACKING ---
    useEffect(() => {
        if (!isConfigured || !currentUser) return;

        const supabase = getSupabase();
        
        // Create a presence channel
        const channel = supabase.channel('global_presence', {
            config: {
                presence: {
                    key: currentUser.id, // Track by User ID
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const onlineIds = new Set<string>();
                
                // Extract user IDs from presence state
                for (const key in newState) {
                    onlineIds.add(key);
                }
                
                setOnlineUserIds(onlineIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Send tracking info
                    await channel.track({
                        user_id: currentUser.id,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
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

            // CORRECTED: Show all tickets for my team, OR tickets directly assigned to me.
            return isForMyTeam || isAssignedToMe;
        });
    }, [appData.tickets, myTeamIds, currentUser]);


    const expiringWarranties = useMemo(() => {
        return appData.equipment.filter((eq: Equipment) => {
            if (!eq.warrantyEndDate) return false;
            try {
                const warrantyDate = new Date(eq.warrantyEndDate);
                return warrantyDate >= today && warrantyDate <= thirtyDaysFromNow;
            } catch (e) {
                return false;
            }
        });
    }, [appData.equipment, today, thirtyDaysFromNow]);

    const expiringLicenses = useMemo(() => {
        return appData.softwareLicenses.filter((lic: SoftwareLicense) => {
            if (!lic.expiryDate) return false;
            try {
                const expiryDate = new Date(lic.expiryDate);
                return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
            } catch (e) {
                return false;
            }
        });
    }, [appData.softwareLicenses, today, thirtyDaysFromNow]);
    
    const notificationCount = useMemo(() => {
        return expiringWarranties.length + expiringLicenses.length + teamTickets.length;
    }, [expiringWarranties, expiringLicenses, teamTickets]);
    
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
    const [showProfileModal, setShowProfileModal] = useState(false);
    
    // Global Ticket Creation (Magic Bar)
    const [showAddTicketModal, setShowAddTicketModal] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<any>(null);
    
    // Shared Filter State (Used to pass search queries from MagicBar to Dashboards)
    const [dashboardFilter, setDashboardFilter] = useState<any>(null);

    // --- Permission Logic (RBAC) ---
    const checkPermission = (module: ModuleKey, action: PermissionAction): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === UserRole.SuperAdmin) return true;
        
        const role = appData.customRoles.find((r:any) => r.name === currentUser.role);
        if (role) {
            return role.permissions[module]?.[action] ?? false;
        }
        
        if (currentUser.role === 'Técnico' || currentUser.role === 'Normal') {
             if (module === 'settings' || module === 'organization' || module === 'config_custom_roles') return false;
             if (action === 'delete') return false;
             return true;
        }

        if (currentUser.role === UserRole.Utilizador || currentUser.role === 'Basic') {
            if (module === 'tickets' && action === 'create') return true;
            if (module === 'tickets' && action === 'view') return true;
            // Dashboard widgets visible for basic users by default if not strictly denied (or handle via DB config if desired to be strict)
            // For now, let's assume Basic users see KPI and Activity, but not financial or heavy charts unless configured.
             if (module === 'widget_kpi_cards' && action === 'view') return true;
             if (module === 'widget_activity' && action === 'view') return true;
            return false;
        }
        
        return false;
    };
    
    const isBasic = !checkPermission('equipment', 'view') && !checkPermission('organization', 'view');
    const isAdmin = checkPermission('settings', 'view');

    // Granular Compliance Permissions
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
        'settings': checkPermission('settings', 'view') || isAdmin ? 'Configurações' : undefined
    };

    // --- Policy Acceptance Logic ---
    const pendingPolicies = useMemo(() => {
        if (!currentUser || appData.policies.length === 0) return [];
        
        // Find mandatory active policies that user hasn't accepted the CURRENT version of
        return appData.policies.filter(p => {
            if (!p.is_active || !p.is_mandatory) return false;
            
            const acceptance = appData.policyAcceptances.find(a => 
                a.policy_id === p.id && 
                a.user_id === currentUser.id && 
                a.version === p.version
            );
            
            return !acceptance;
        });
    }, [currentUser, appData.policies, appData.policyAcceptances]);

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
    
    const handleOpenProfile = () => {
        setShowProfileModal(true);
    };
    
    // NEW: Handle mobile menu close via layout context hook when expanding sidebar
    const handleSidebarHover = (state: boolean) => {
        setIsSidebarExpanded(state);
    };

    // Calculate Dynamic Margin class based on sidebar state
    // We use standard tailwind classes for responsiveness
    // On Desktop (md+), we enforce margin based on sidebar state
    // On Mobile, margin is 0 because sidebar overlays
    const mainContentMargin = layoutMode === 'side' 
        ? (isSidebarExpanded ? 'md:ml-64' : 'md:ml-20') 
        : '';

    // --- Render ---

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div>
            </div>
        );
    }

    if (!isConfigured) return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    if (!currentUser) return (
        <>
            <LoginPage onLogin={handleLogin} onForgotPassword={() => setShowForgotPasswordModal(true)} />
            {showForgotPasswordModal && <ForgotPasswordModal onClose={() => setShowForgotPasswordModal(false)} />}
            {showResetPasswordModal && <ResetPasswordModal onClose={() => { setShowResetPasswordModal(false); setResetSession(null); }} session={resetSession} />}
        </>
    );

    // BLOCKING POLICY MODAL
    if (pendingPolicies.length > 0) {
        return (
            <PolicyAcceptanceModal 
                policies={pendingPolicies}
                onAccept={async (id, version) => {
                    await dataService.acceptPolicy(id, currentUser.id, version);
                    refreshData(); // Refresh to update pending list
                }}
            />
        );
    }

    return (
        // Use block for layout root to simplify stacking contexts when using fixed sidebar
        <div className={`min-h-screen bg-background-dark ${layoutMode === 'top' ? 'flex flex-col' : ''}`}>
            
            {/* Mobile Header for Side Layout - provides hamburger menu on mobile */}
            {layoutMode === 'side' && (
                <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center px-4 z-40 shadow-md">
                    <button 
                        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} 
                        className="text-gray-400 p-2 hover:text-white"
                        aria-label="Toggle Menu"
                    >
                        <FaBars className="h-6 w-6" />
                    </button>
                    <span className="ml-4 font-bold text-xl text-white">AI<span className="text-brand-secondary">Manager</span></span>
                </div>
            )}

            {layoutMode === 'side' ? (
                 <Sidebar 
                    currentUser={currentUser} 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    onLogout={handleLogout}
                    tabConfig={tabConfig}
                    notificationCount={notificationCount}
                    onNotificationClick={() => setShowNotificationsModal(true)}
                    isExpanded={isSidebarExpanded}
                    onHover={handleSidebarHover}
                    onOpenProfile={handleOpenProfile}
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
                    notificationCount={notificationCount}
                    onNotificationClick={() => setShowNotificationsModal(true)}
                    onOpenProfile={handleOpenProfile}
                    onOpenCalendar={() => setShowCalendarModal(true)}
                    onOpenManual={() => setShowUserManualModal(true)}
                />
            )}

            <main 
                className={`flex-1 bg-background-dark transition-all duration-300 overflow-y-auto custom-scrollbar overflow-x-hidden ${mainContentMargin}`}
            >
                {/* Add padding top on mobile side layout to account for fixed header */}
                <div className={`w-full max-w-full p-2 md:p-6 ${layoutMode === 'side' ? 'pt-20 md:pt-6' : ''}`}>
                    
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
                        expiringWarranties={expiringWarranties}
                        expiringLicenses={expiringLicenses}
                        softwareLicenses={appData.softwareLicenses}
                        licenseAssignments={appData.licenseAssignments}
                        businessServices={appData.businessServices}
                        vulnerabilities={appData.vulnerabilities}
                        onViewItem={handleViewItem}
                        onGenerateComplianceReport={() => { setReportType('compliance'); setShowReportModal(true); }}
                        procurementRequests={appData.procurementRequests}
                        onRefresh={refreshData} 
                        checkPermission={checkPermission}
                    />}

                    {activeTab === 'overview.smart' && canViewSmartDashboard && (
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
                    
                    {(activeTab === 'equipment.inventory' || activeTab === 'licensing' || activeTab === 'equipment.procurement') && (
                        <InventoryManager 
                            activeTab={activeTab}
                            appData={appData}
                            checkPermission={checkPermission}
                            refreshData={refreshData}
                            dashboardFilter={dashboardFilter}
                            setDashboardFilter={setDashboardFilter}
                            setReportType={(t) => { setReportType(t as any); setShowReportModal(true); }}
                            currentUser={currentUser}
                            onViewItem={handleViewItem}
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
                        <BIReportDashboard appData={appData} />
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
                            onClose={() => setActiveTab('overview')}
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
                    calendarEvents={appData.calendarEvents} // Pass new events
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
                    expiringWarranties={expiringWarranties} 
                    expiringLicenses={expiringLicenses}
                    teamTickets={teamTickets}
                    collaborators={appData.collaborators}
                    teams={appData.teams}
                    onViewItem={handleViewItem}
                    currentUser={currentUser}
                    licenseAssignments={appData.licenseAssignments}
                />
            )}

            {/* Global Ticket Creation Modal */}
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
                    instituicoes={appData.instituicoes}
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

            {/* Profile Modal */}
            {showProfileModal && (
                <CollaboratorDetailModal
                    collaborator={currentUser}
                    assignments={appData.assignments}
                    equipment={appData.equipment}
                    tickets={appData.tickets}
                    brandMap={new Map(appData.brands.map((b: Brand) => [b.id, b.name]))}
                    equipmentTypeMap={new Map(appData.equipmentTypes.map((t: EquipmentType) => [t.id, t.name]))}
                    licenseAssignments={appData.licenseAssignments}
                    softwareLicenses={appData.softwareLicenses}
                    onClose={() => setShowProfileModal(false)}
                    onShowHistory={() => {}}
                    onStartChat={() => {}}
                    onEdit={() => alert("Use a edição no menu de configurações se for admin.")}
                />
            )}

            <ChatWidget 
                currentUser={currentUser}
                collaborators={appData.collaborators}
                messages={appData.messages}
                onSendMessage={async (rxId, content) => {
                    try {
                        await dataService.addMessage({
                            senderId: currentUser.id,
                            receiverId: rxId,
                            content,
                            timestamp: new Date().toISOString(),
                            read: false
                        });
                        refreshData();
                    } catch (e: any) {
                        console.error("Send Message Error:", e);
                        alert("Erro ao enviar mensagem. Se o erro persistir, vá a 'Configuração BD -> Reparar Chat' para corrigir a base de dados.");
                    }
                }}
                onMarkMessagesAsRead={(senderId) => dataService.markMessagesAsRead(senderId)}
                isOpen={showChatWidget}
                onToggle={() => setShowChatWidget(!showChatWidget)}
                activeChatCollaboratorId={activeChatCollaboratorId}
                onSelectConversation={setActiveChatCollaboratorId}
                unreadMessagesCount={appData.messages.filter((m: any) => m.receiverId === currentUser.id && !m.read).length}
                // NEW PROP for Real-time status
                onlineUserIds={onlineUserIds}
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
