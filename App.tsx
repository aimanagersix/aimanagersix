
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
import { ModuleKey, PermissionAction, Collaborator, UserRole, Ticket, Policy, Assignment, Equipment, SoftwareLicense, SecurityTrainingRecord } from './types';
import AgendaDashboard from './components/AgendaDashboard';
import PolicyAcceptanceModal from './components/PolicyAcceptanceModal';
import EquipmentHistoryModal from './components/EquipmentHistoryModal';
import TicketActivitiesModal from './components/TicketActivitiesModal';
import Modal from './components/common/Modal';

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

    // 2. Feature Hooks
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
    
    // Viewing States (Modais)
    const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
    const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);
    const [readingPolicy, setReadingPolicy] = useState<Policy | null>(null);
    const [viewingLicense, setViewingLicense] = useState<SoftwareLicense | null>(null);
    const [viewingTraining, setViewingTraining] = useState<SecurityTrainingRecord | null>(null);

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

    // 5. Data Isolation Filter (Garante que utilizador limitado não vê equipamentos alheios)
    const appData = useMemo(() => {
        const rawData = {
            ...org.data,
            ...inv.data,
            ...support.data,
            ...compliance.data,
            messages: []
        };

        if (currentUser && !checkPermission('equipment', 'view')) {
            // 1. Filtrar Atribuições (Assignments) para as que pertencem ao user
            const myAssignments = rawData.assignments.filter((a: any) => 
                (a.collaboratorId === currentUser.id || a.collaborator_id === currentUser.id) && !a.returnDate
            );
            rawData.assignments = myAssignments;

            // 2. Extrair IDs de equipamentos próprios
            const myEquipmentIds = new Set(myAssignments.map((a: any) => a.equipmentId || a.equipment_id));
            
            // 3. Filtrar Equipamento
            rawData.equipment = rawData.equipment.filter(e => myEquipmentIds.has(e.id));
            
            // 4. Filtrar Atribuições de Licenças (License Assignments)
            const myLicenseAssignments = rawData.licenseAssignments.filter((la: any) => 
                myEquipmentIds.has(la.equipmentId || la.equipment_id) && !la.returnDate
            );
            rawData.licenseAssignments = myLicenseAssignments;
            
            // 5. Filtrar Licenças
            const myLicenseIds = new Set(myLicenseAssignments.map((la: any) => la.softwareLicenseId || la.software_license_id));
            rawData.softwareLicenses = rawData.softwareLicenses.filter(l => myLicenseIds.has(l.id));

            // 6. Filtrar Políticas aplicáveis
            rawData.policies = rawData.policies.filter(p => {
                if (!p.is_active) return false;
                if (p.target_type === 'Global' || !p.target_type) return true;
                if (p.target_type === 'Instituicao' && currentUser.instituicaoId) {
                    return (p.target_instituicao_ids || []).includes(currentUser.instituicaoId);
                }
                if (p.target_type === 'Entidade' && currentUser.entidadeId) {
                    return (p.target_entidade_ids || []).includes(currentUser.entidadeId);
                }
                return false;
            });
        }

        return rawData;
    }, [org.data, inv.data, support.data, compliance.data, currentUser, checkPermission]);

    // 6. Detect Pending Policies
    const pendingPolicies = useMemo(() => {
        if (!currentUser || !compliance.data.policies) return [];
        const myAcceptanceIds = new Set(
            compliance.data.policyAcceptances
                .filter(a => {
                    const cid = (a as any).collaboratorId || a.collaborator_id;
                    return cid === currentUser.id;
                })
                .map(a => a.policy_id + '-' + a.version)
        );

        return compliance.data.policies.filter(p => {
            if (!p.is_mandatory || !p.is_active) return false;
            let applies = false;
            if (p.target_type === 'Global' || !p.target_type) applies = true;
            else if (p.target_type === 'Instituicao' && currentUser.instituicaoId) applies = (p.target_instituicao_ids || []).includes(currentUser.instituicaoId);
            else if (p.target_type === 'Entidade' && currentUser.entidadeId) applies = (p.target_entidade_ids || []).includes(currentUser.entidadeId);

            return applies && !myAcceptanceIds.has(p.id + '-' + p.version);
        });
    }, [currentUser, compliance.data.policies, compliance.data.policyAcceptances]);

    const refreshAll = useCallback(async () => {
        await Promise.all([
            org.refresh(),
            inv.refresh(),
            support.refresh(),
            compliance.refresh()
        ]);
    }, [org, inv, support, compliance]);

    // 7. Auth Logic
    useEffect(() => {
        const supabase = getSupabase();
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
            'organizacao.instituicoes': checkPermission('org_institutions', 'view'),
            'organizacao.entidades': checkPermission('org_entities', 'view'),
            'collaborators': checkPermission('org_collaborators', 'view'),
            'organizacao.suppliers': checkPermission('org_suppliers', 'view'),
            'organizacao.teams': checkPermission('organization', 'view'),
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
            'tools': { 
                agenda: checkPermission('tools_agenda', 'view'), 
                map: checkPermission('tools_map', 'view'),
                calendar: checkPermission('tools_calendar', 'view'),
                manual: checkPermission('tools_manual', 'view')
            }
        };
    }, [checkPermission]);

    const handleLogout = async () => {
        const supabase = getSupabase();
        await (supabase.auth as any).signOut();
        localStorage.removeItem('supabase.auth.token');
        setCurrentUser(null);
        window.location.reload();
    };

    const handleViewItem = (tab: string, filter: any) => {
        setActiveTab(tab);
        setDashboardFilter(filter);
    };

    const handleAcceptPolicy = async (id: string, version: string) => {
        if (!currentUser) return;
        await dataService.addConfigItem('policy_acceptances', {
            policy_id: id,
            collaboratorId: currentUser.id,
            version: version,
            accepted_at: new Date().toISOString()
        });
        await refreshAll();
    };

    if (!isConfigured) return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    if (isAppLoading || (session && !currentUser && org.data.collaborators.length === 0)) return <div className="min-h-screen bg-background-dark flex items-center justify-center text-white font-bold">A preparar ambiente seguro...</div>;
    if (!currentUser) return <LoginPage onLogin={async () => ({ success: true })} onForgotPassword={() => {}} />;

    const mainMarginClass = layoutMode === 'side' ? (sidebarExpanded ? 'md:ml-64' : 'md:ml-20') : '';

    return (
        <div className={`min-h-screen bg-background-dark text-on-surface-dark-secondary flex flex-col ${layoutMode === 'side' ? 'md:flex-row' : ''}`}>
            {pendingPolicies.length > 0 && (
                <PolicyAcceptanceModal policies={pendingPolicies} onAccept={handleAcceptPolicy} />
            )}
            
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
                    {(activeTab === 'overview' || activeTab === 'my_area') && (
                        checkPermission('widget_kpi_cards', 'view') && activeTab === 'overview' ? (
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
                                onViewEquipment={setViewingEquipment} onViewTraining={setViewingTraining}
                                onViewLicense={setViewingLicense}
                            />
                        )
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
            
            {viewingEquipment && (
                <EquipmentHistoryModal 
                    equipment={viewingEquipment} assignments={appData.assignments} collaborators={appData.collaborators}
                    escolasDepartamentos={appData.entidades} tickets={appData.tickets} ticketActivities={appData.ticketActivities}
                    onClose={() => setViewingEquipment(null)} onViewItem={handleViewItem}
                    businessServices={appData.businessServices} serviceDependencies={appData.serviceDependencies}
                    softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments}
                    vulnerabilities={appData.vulnerabilities} suppliers={appData.suppliers}
                    accountingCategories={appData.configAccountingCategories} conservationStates={appData.configConservationStates}
                />
            )}

            {viewingTicket && (
                <TicketActivitiesModal
                    ticket={viewingTicket}
                    activities={appData.ticketActivities}
                    collaborators={appData.collaborators}
                    currentUser={currentUser}
                    equipment={appData.equipment}
                    equipmentTypes={appData.equipmentTypes}
                    entidades={appData.entidades}
                    onClose={() => setViewingTicket(null)}
                    onAddActivity={async (act) => {
                        await dataService.addTicketActivity({ ...act, ticketId: viewingTicket.id, technicianId: currentUser.id, date: new Date().toISOString() });
                        support.refresh();
                    }}
                    assignments={appData.assignments}
                />
            )}

            {viewingLicense && (
                <Modal title="Consulta de Licença" onClose={() => setViewingLicense(null)}>
                    <div className="space-y-4">
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-2">{viewingLicense.productName}</h3>
                            <p className="text-sm text-gray-400 font-mono tracking-wider bg-black/30 p-2 rounded">{viewingLicense.licenseKey}</p>
                            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                <div><span className="text-gray-500">Estado:</span> <span className="text-green-400 font-bold">{viewingLicense.status}</span></div>
                                <div><span className="text-gray-500">Expira em:</span> <span className="text-white">{viewingLicense.expiryDate || 'Vitalícia'}</span></div>
                                <div><span className="text-gray-500">Tipo:</span> <span className="text-white">{viewingLicense.is_oem ? 'OEM / Volume' : 'Retail'}</span></div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4"><button onClick={() => setViewingLicense(null)} className="bg-gray-600 text-white px-6 py-2 rounded">Fechar</button></div>
                    </div>
                </Modal>
            )}

            {viewingTraining && (
                <Modal title="Consulta de Formação" onClose={() => setViewingTraining(null)}>
                    <div className="space-y-4">
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-2">{viewingTraining.training_type}</h3>
                            <p className="text-sm text-gray-300">{viewingTraining.notes || 'Sem observações registadas.'}</p>
                            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                <div><span className="text-gray-500">Concluído em:</span> <span className="text-white">{new Date(viewingTraining.completion_date).toLocaleDateString()}</span></div>
                                <div><span className="text-gray-500">Pontuação:</span> <span className="text-green-400 font-bold">{viewingTraining.score}%</span></div>
                                <div><span className="text-gray-500">Duração:</span> <span className="text-white">{viewingTraining.duration_hours} Hora(s)</span></div>
                                <div><span className="text-gray-500">Status:</span> <span className="text-white">{viewingTraining.status}</span></div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4"><button onClick={() => setViewingTraining(null)} className="bg-gray-600 text-white px-6 py-2 rounded">Fechar</button></div>
                    </div>
                </Modal>
            )}
            
            {readingPolicy && (
                <Modal title={`Consulta de Política: ${readingPolicy.title}`} onClose={() => setReadingPolicy(null)} maxWidth="max-w-4xl">
                     <div className="space-y-4">
                        <div className="bg-white text-black p-6 rounded shadow-inner min-h-[300px] overflow-y-auto whitespace-pre-wrap font-serif">
                            {readingPolicy.content}
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Versão: {readingPolicy.version}</span>
                            <span>Atualizada em: {new Date(readingPolicy.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-end pt-4"><button onClick={() => setReadingPolicy(null)} className="bg-gray-600 text-white px-6 py-2 rounded">Fechar</button></div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
