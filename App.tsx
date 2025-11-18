
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import ConfigurationSetup from './components/ConfigurationSetup';
import OverviewDashboard from './components/OverviewDashboard';
import EquipmentDashboard from './components/Dashboard';
import CollaboratorDashboard from './components/CollaboratorDashboard';
import InstituicaoDashboard from './components/InstituicaoDashboard';
import EntidadeDashboard from './components/EntidadeDashboard';
import LicenseDashboard from './components/LicenseDashboard';
import TicketDashboard from './components/TicketDashboard';
import TeamDashboard from './components/TeamDashboard';
import EquipmentTypeDashboard from './components/EquipmentTypeDashboard';
import BrandDashboard from './components/BrandDashboard';
import { ImportConfig } from './components/ImportModal';
import ManageAssignedLicensesModal from './components/ManageAssignedLicensesModal';
import AddCollaboratorModal from './components/AddCollaboratorModal';
import AddTicketModal from './components/AddTicketModal';
import TicketActivitiesModal from './components/TicketActivitiesModal';
import CloseTicketModal from './components/CloseTicketModal';
import CollaboratorDetailModal from './components/CollaboratorDetailModal';
import CollaboratorHistoryModal from './components/CollaboratorHistoryModal';
import ReportModal from './components/ReportModal';
import { ChatWidget } from './components/ChatWidget';
import * as dataService from './services/dataService';
import { getSupabase } from './services/supabaseClient';
import { 
    Equipment, Instituicao, Entidade, Collaborator, Assignment, EquipmentType, Brand, 
    Ticket, TicketActivity, CollaboratorHistory, Message, SoftwareLicense, LicenseAssignment, 
    Team, TeamMember, EquipmentStatus, TicketStatus, CollaboratorStatus
} from './types';
import { PlusIcon } from './components/common/Icons';

export const App = () => {
    // Auth & Config State
    const [session, setSession] = useState<any>(null);
    const [isConfigured, setIsConfigured] = useState(false);
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    
    // Data State
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [entidades, setEntidades] = useState<Entidade[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [ticketActivities, setTicketActivities] = useState<TicketActivity[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    const [softwareLicenses, setSoftwareLicenses] = useState<SoftwareLicense[]>([]);
    const [licenseAssignments, setLicenseAssignments] = useState<LicenseAssignment[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [collaboratorHistory, setCollaboratorHistory] = useState<CollaboratorHistory[]>([]);

    // Modal States
    const [manageLicensesEquipment, setManageLicensesEquipment] = useState<Equipment | null>(null);
    const [isAddCollaboratorModalOpen, setIsAddCollaboratorModalOpen] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
    const [isAddTicketModalOpen, setIsAddTicketModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
    const [ticketActivitiesOpen, setTicketActivitiesOpen] = useState<Ticket | null>(null);
    const [ticketToClose, setTicketToClose] = useState<Ticket | null>(null);
    const [showDetailCollaborator, setShowDetailCollaborator] = useState<Collaborator | null>(null);
    const [showHistoryCollaborator, setShowHistoryCollaborator] = useState<Collaborator | null>(null);
    const [reportType, setReportType] = useState<'equipment' | 'collaborator' | 'ticket' | 'licensing' | null>(null);
    
    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeChatCollaboratorId, setActiveChatCollaboratorId] = useState<string | null>(null);


    // Computed Maps
    const brandMap = React.useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const equipmentTypeMap = React.useMemo(() => new Map(equipmentTypes.map(t => [t.id, t.name])), [equipmentTypes]);
    const assignedEquipmentIds = React.useMemo(() => new Set(assignments.filter(a => !a.returnDate).map(a => a.equipmentId)), [assignments]);
    
    // Initial Filter State for Dashboards (passed from Overview)
    const [dashboardFilter, setDashboardFilter] = useState<any>(null);

    // Check Config & Auth on Mount
    useEffect(() => {
        const checkConfig = () => {
            const url = localStorage.getItem('SUPABASE_URL');
            const key = localStorage.getItem('SUPABASE_ANON_KEY');
            const apiKey = localStorage.getItem('API_KEY');
            if (url && key && apiKey) {
                setIsConfigured(true);
            }
        };
        checkConfig();
    }, []);

    const refreshData = async () => {
         try {
            const data = await dataService.fetchAllData();
            setEquipment(data.equipment);
            setInstituicoes(data.instituicoes);
            setEntidades(data.entidades);
            setCollaborators(data.collaborators);
            setEquipmentTypes(data.equipmentTypes);
            setBrands(data.brands);
            setAssignments(data.assignments);
            setTickets(data.tickets);
            setTicketActivities(data.ticketActivities);
            setSoftwareLicenses(data.softwareLicenses);
            setLicenseAssignments(data.licenseAssignments);
            setTeams(data.teams);
            setTeamMembers(data.teamMembers);
            setMessages(data.messages);
            setCollaboratorHistory(data.collaboratorHistory);
        } catch (error) {
            console.error("Error loading data", error);
        }
    };

    useEffect(() => {
        if (isConfigured) {
             const supabase = getSupabase();
             supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                if (session) refreshData();
             });

             const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session);
                if (session) refreshData();
             });
             return () => subscription.unsubscribe();
        }
    }, [isConfigured]);
    
    useEffect(() => {
        if (session?.user?.email && collaborators.length > 0) {
            const user = collaborators.find(c => c.email === session.user.email);
            setCurrentUser(user || null);
        }
    }, [session, collaborators]);

    const handleImport = async (dataType: ImportConfig['dataType'], data: any[]) => {
        try {
            let count = 0;
            if (dataType === 'collaborators') {
                const { data: inserted } = await dataService.addMultipleCollaborators(data as any);
                count = inserted ? inserted.length : 0;
                if (inserted) {
                    // Force cast to bypass TS mismatch between Supabase response and state type
                    setCollaborators(prev => [...prev, ...(inserted as any[] as Collaborator[])]);
                }
            } else if (dataType === 'instituicoes') {
                 const { data: inserted } = await dataService.addMultipleInstituicoes(data as any);
                 count = inserted ? inserted.length : 0;
                 if (inserted) {
                     setInstituicoes(prev => [...prev, ...(inserted as any[] as Instituicao[])]);
                 }
            } else if (dataType === 'entidades') {
                 const { data: inserted } = await dataService.addMultipleEntidades(data as any);
                 count = inserted ? inserted.length : 0;
                 if (inserted) {
                     setEntidades(prev => [...prev, ...(inserted as any[] as Entidade[])]);
                 }
            }
            return { success: true, message: `Importação concluída com sucesso! ${count} registos importados.` };
        } catch (error: any) {
            return { success: false, message: `Erro na importação: ${error.message}` };
        }
    };

    const handleLogin = async (email: string, pass: string) => {
        const supabase = getSupabase();
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) return { success: false, error: error.message };
        return { success: true };
    };
    
    const handleLogout = async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        setSession(null);
        setCurrentUser(null);
    };

    const handleViewItem = (tab: string, filter: any) => {
        setActiveTab(tab);
        setDashboardFilter(filter);
    };
    
    // --- Licensing Handlers ---
    const handleManageKeys = (equipment: Equipment) => {
        setManageLicensesEquipment(equipment);
    };

    const handleSaveAssignedLicenses = async (equipmentId: string, licenseIds: string[]) => {
        try {
            await dataService.syncLicenseAssignments(equipmentId, licenseIds);
            await refreshData();
            setManageLicensesEquipment(null);
        } catch (error) {
            console.error("Failed to sync licenses:", error);
            alert("Erro ao guardar as licenças. Por favor tente novamente.");
        }
    };

    // --- Collaborator Handlers ---
    const handleCreateCollaborator = async (collaborator: any, password?: string) => {
         try {
             if (collaborator.canLogin && password) {
                 const supabase = getSupabase();
                 const { data: authData, error: authError } = await supabase.auth.signUp({
                     email: collaborator.email,
                     password: password,
                 });
                 if (authError) throw authError;
                 // The trigger in Supabase will ideally handle linking or we insert the collaborator manually
                 // If using manual insertion:
                 await dataService.addCollaborator({...collaborator, id: authData.user?.id });
             } else {
                 await dataService.addCollaborator(collaborator);
             }
             refreshData();
         } catch (error) {
             console.error("Error creating collaborator", error);
             alert("Erro ao criar colaborador.");
         }
    };

    const handleUpdateCollaborator = async (collaborator: Collaborator) => {
        try {
            await dataService.updateCollaborator(collaborator.id, collaborator);
            refreshData();
        } catch (error) {
            console.error("Error updating collaborator", error);
            alert("Erro ao atualizar colaborador.");
        }
    };

    const handleDeleteCollaborator = async (id: string) => {
        if (window.confirm("Tem a certeza que deseja excluir este colaborador?")) {
            try {
                await dataService.deleteCollaborator(id);
                refreshData();
            } catch (error) {
                console.error("Error deleting collaborator", error);
                alert("Erro ao excluir colaborador. Verifique se não existem dependências.");
            }
        }
    };
    
    const handleToggleCollaboratorStatus = async (id: string) => {
        const collaborator = collaborators.find(c => c.id === id);
        if (collaborator) {
            const newStatus = collaborator.status === CollaboratorStatus.Ativo ? CollaboratorStatus.Inativo : CollaboratorStatus.Ativo;
            await handleUpdateCollaborator({ ...collaborator, status: newStatus });
        }
    };

    // --- Ticket Handlers ---
    const handleCreateTicket = async (ticket: any) => {
        try {
            await dataService.addTicket({ ...ticket, requestDate: new Date().toISOString(), status: TicketStatus.Requested });
            refreshData();
        } catch (error) {
             console.error("Error creating ticket", error);
             alert("Erro ao criar ticket.");
        }
    };

    const handleUpdateTicket = async (ticket: Ticket) => {
         try {
            await dataService.updateTicket(ticket.id, ticket);
            refreshData();
        } catch (error) {
             console.error("Error updating ticket", error);
             alert("Erro ao atualizar ticket.");
        }
    };
    
    const handleCloseTicket = async (technicianId: string) => {
        if (ticketToClose) {
             try {
                await dataService.updateTicket(ticketToClose.id, { 
                    status: TicketStatus.Finished, 
                    finishDate: new Date().toISOString(),
                    technicianId: technicianId
                });
                setTicketToClose(null);
                refreshData();
            } catch (error) {
                 console.error("Error closing ticket", error);
                 alert("Erro ao finalizar ticket.");
            }
        }
    };

    const handleAddActivity = async (activity: any) => {
        if (ticketActivitiesOpen && currentUser) {
             try {
                await dataService.addTicketActivity({
                    ...activity,
                    ticketId: ticketActivitiesOpen.id,
                    technicianId: currentUser.id,
                    date: new Date().toISOString()
                });
                // Update ticket status to In Progress if currently Requested
                if (ticketActivitiesOpen.status === TicketStatus.Requested) {
                    await dataService.updateTicket(ticketActivitiesOpen.id, { status: TicketStatus.InProgress });
                }
                refreshData();
            } catch (error) {
                 console.error("Error adding activity", error);
                 alert("Erro ao adicionar atividade.");
            }
        }
    };
    
    // --- Chat Handlers ---
    const handleSendMessage = async (receiverId: string, content: string) => {
        if (currentUser) {
             try {
                await dataService.addMessage({
                    id: crypto.randomUUID(),
                    senderId: currentUser.id,
                    receiverId,
                    content,
                    timestamp: new Date().toISOString(),
                    read: false
                });
                refreshData();
            } catch (error) {
                console.error("Error sending message", error);
            }
        }
    };

    const handleMarkMessagesRead = async (senderId: string) => {
        if (currentUser) {
            try {
                await dataService.markMessagesAsRead(senderId, currentUser.id);
                refreshData();
            } catch (error) {
                 console.error("Error marking read", error);
            }
        }
    };


    if (!isConfigured) return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    if (!session) return <LoginPage onLogin={handleLogin} onForgotPassword={() => {}} />;

    return (
        <div className="min-h-screen bg-background-dark text-on-surface-dark">
            <Header 
                currentUser={currentUser} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onLogout={handleLogout} 
                tabConfig={{
                    overview: true, 'equipment.inventory': true, 'equipment.brands': true, 'equipment.types': true,
                    'organizacao.instituicoes': true, 'organizacao.entidades': true, 'organizacao.teams': true,
                    collaborators: true, licensing: true, tickets: { title: 'Suporte' }
                }}
                notificationCount={0} // Todo: implement count logic
                onNotificationClick={() => {}}
            />
            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <OverviewDashboard 
                        equipment={equipment} instituicoes={instituicoes} entidades={entidades} assignments={assignments} 
                        equipmentTypes={equipmentTypes} tickets={tickets} collaborators={collaborators} teams={teams}
                        expiringWarranties={[]} // Todo: filter logic
                        expiringLicenses={[]} // Todo: filter logic
                        softwareLicenses={softwareLicenses} licenseAssignments={licenseAssignments}
                        onViewItem={handleViewItem} 
                    />
                )}
                {activeTab === 'equipment.inventory' && (
                    <EquipmentDashboard 
                         equipment={equipment} brands={brands} equipmentTypes={equipmentTypes} brandMap={brandMap} equipmentTypeMap={equipmentTypeMap}
                         assignedEquipmentIds={assignedEquipmentIds} assignments={assignments} collaborators={collaborators} entidades={entidades}
                         initialFilter={dashboardFilter} onClearInitialFilter={() => setDashboardFilter(null)} 
                         onShowHistory={() => {}} // Todo: implement handler
                         onAssign={() => {}} // Todo: implement handler
                         onManageKeys={handleManageKeys}
                    />
                )}
                 {activeTab === 'collaborators' && (
                     <div className="space-y-4">
                         <div className="flex justify-end">
                             <button 
                                onClick={() => { setEditingCollaborator(null); setIsAddCollaboratorModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary"
                             >
                                 <PlusIcon /> Adicionar Colaborador
                             </button>
                         </div>
                         <CollaboratorDashboard 
                            collaborators={collaborators} escolasDepartamentos={entidades} equipment={equipment} assignments={assignments} 
                            tickets={tickets} ticketActivities={ticketActivities} teamMembers={teamMembers} currentUser={currentUser}
                            onEdit={(col) => { setEditingCollaborator(col); setIsAddCollaboratorModalOpen(true); }}
                            onDelete={handleDeleteCollaborator}
                            onToggleStatus={handleToggleCollaboratorStatus}
                            onShowHistory={(col) => setShowHistoryCollaborator(col)}
                            onShowDetails={(col) => setShowDetailCollaborator(col)}
                            onStartChat={(col) => { setActiveChatCollaboratorId(col.id); setIsChatOpen(true); }}
                            onGenerateReport={() => setReportType('collaborator')}
                         />
                     </div>
                 )}
                 {activeTab === 'organizacao.instituicoes' && <InstituicaoDashboard instituicoes={instituicoes} escolasDepartamentos={entidades} />}
                 {activeTab === 'organizacao.entidades' && <EntidadeDashboard escolasDepartamentos={entidades} instituicoes={instituicoes} collaborators={collaborators} />}
                 {activeTab === 'licensing' && (
                    <LicenseDashboard 
                        licenses={softwareLicenses} licenseAssignments={licenseAssignments} equipmentData={equipment} 
                        assignments={assignments} collaborators={collaborators} brandMap={brandMap} equipmentTypeMap={equipmentTypeMap}
                        initialFilter={dashboardFilter} onClearInitialFilter={() => setDashboardFilter(null)}
                    />
                 )}
                 {activeTab === 'tickets' && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                             <button 
                                onClick={() => { setEditingTicket(null); setIsAddTicketModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary"
                             >
                                 <PlusIcon /> Novo Ticket
                             </button>
                         </div>
                        <TicketDashboard 
                            tickets={tickets} escolasDepartamentos={entidades} collaborators={collaborators} teams={teams} 
                            equipment={equipment} equipmentTypes={equipmentTypes} 
                            initialFilter={dashboardFilter} onClearInitialFilter={() => setDashboardFilter(null)}
                            onEdit={(ticket) => { setEditingTicket(ticket); setIsAddTicketModalOpen(true); }}
                            onUpdateTicket={handleUpdateTicket}
                            onOpenCloseTicketModal={(ticket) => setTicketToClose(ticket)}
                            onOpenActivities={(ticket) => setTicketActivitiesOpen(ticket)}
                            onGenerateReport={() => setReportType('ticket')}
                        />
                    </div>
                 )}
                 {activeTab === 'organizacao.teams' && (
                    <TeamDashboard 
                        teams={teams} teamMembers={teamMembers} collaborators={collaborators} tickets={tickets} 
                        onEdit={() => {}} onDelete={() => {}} onManageMembers={() => {}}
                    />
                 )}
                 {activeTab === 'equipment.brands' && <BrandDashboard brands={brands} equipment={equipment} />}
                 {activeTab === 'equipment.types' && <EquipmentTypeDashboard equipmentTypes={equipmentTypes} equipment={equipment} />}
            </main>

            {/* Modals */}
            {manageLicensesEquipment && (
                <ManageAssignedLicensesModal
                    equipment={manageLicensesEquipment}
                    allLicenses={softwareLicenses}
                    allAssignments={licenseAssignments}
                    onClose={() => setManageLicensesEquipment(null)}
                    onSave={handleSaveAssignedLicenses}
                />
            )}
            
            {isAddCollaboratorModalOpen && (
                <AddCollaboratorModal
                    onClose={() => setIsAddCollaboratorModalOpen(false)}
                    onSave={editingCollaborator ? handleUpdateCollaborator : handleCreateCollaborator}
                    collaboratorToEdit={editingCollaborator}
                    escolasDepartamentos={entidades}
                    currentUser={currentUser}
                />
            )}

            {isAddTicketModalOpen && (
                <AddTicketModal
                    onClose={() => setIsAddTicketModalOpen(false)}
                    onSave={editingTicket ? handleUpdateTicket : handleCreateTicket}
                    ticketToEdit={editingTicket}
                    escolasDepartamentos={entidades}
                    collaborators={collaborators}
                    teams={teams}
                    currentUser={currentUser}
                    userPermissions={{ viewScope: 'all' }} // Simplify for now
                    equipment={equipment}
                    equipmentTypes={equipmentTypes}
                    assignments={assignments}
                />
            )}

            {ticketActivitiesOpen && (
                <TicketActivitiesModal
                    ticket={ticketActivitiesOpen}
                    activities={ticketActivities.filter(ta => ta.ticketId === ticketActivitiesOpen.id)}
                    collaborators={collaborators}
                    currentUser={currentUser}
                    equipment={equipment}
                    equipmentTypes={equipmentTypes}
                    entidades={entidades}
                    assignments={assignments}
                    onClose={() => setTicketActivitiesOpen(null)}
                    onAddActivity={handleAddActivity}
                />
            )}

            {ticketToClose && (
                <CloseTicketModal
                    ticket={ticketToClose}
                    collaborators={collaborators}
                    onClose={() => setTicketToClose(null)}
                    onConfirm={handleCloseTicket}
                />
            )}

            {showDetailCollaborator && (
                <CollaboratorDetailModal
                    collaborator={showDetailCollaborator}
                    assignments={assignments}
                    equipment={equipment}
                    tickets={tickets}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    onClose={() => setShowDetailCollaborator(null)}
                    onShowHistory={(col) => { setShowDetailCollaborator(null); setShowHistoryCollaborator(col); }}
                    onStartChat={(col) => { setActiveChatCollaboratorId(col.id); setIsChatOpen(true); setShowDetailCollaborator(null); }}
                />
            )}

            {showHistoryCollaborator && (
                <CollaboratorHistoryModal
                    collaborator={showHistoryCollaborator}
                    history={collaboratorHistory}
                    escolasDepartamentos={entidades}
                    onClose={() => setShowHistoryCollaborator(null)}
                />
            )}
            
            {reportType && (
                <ReportModal
                    type={reportType}
                    onClose={() => setReportType(null)}
                    equipment={equipment}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    instituicoes={instituicoes}
                    escolasDepartamentos={entidades}
                    collaborators={collaborators}
                    assignments={assignments}
                    tickets={tickets}
                    softwareLicenses={softwareLicenses}
                    licenseAssignments={licenseAssignments}
                />
            )}

            {currentUser && (
                <ChatWidget
                    currentUser={currentUser}
                    collaborators={collaborators}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onMarkMessagesAsRead={handleMarkMessagesRead}
                    isOpen={isChatOpen}
                    onToggle={() => setIsChatOpen(!isChatOpen)}
                    activeChatCollaboratorId={activeChatCollaboratorId}
                    onSelectConversation={setActiveChatCollaboratorId}
                    unreadMessagesCount={messages.filter(m => m.receiverId === currentUser.id && !m.read).length}
                />
            )}
        </div>
    );
};
