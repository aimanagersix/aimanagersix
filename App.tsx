import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import EquipmentDashboard from './components/Dashboard';
import CollaboratorDashboard from './components/CollaboratorDashboard';
import TicketDashboard from './components/TicketDashboard';
import TeamDashboard from './components/TeamDashboard';
import EntidadeDashboard from './components/EntidadeDashboard';
import InstituicaoDashboard from './components/InstituicaoDashboard';
import BrandDashboard from './components/BrandDashboard';
import EquipmentTypeDashboard from './components/EquipmentTypeDashboard';
import LicenseDashboard from './components/LicenseDashboard';
import OverviewDashboard from './components/OverviewDashboard';
import LoginPage from './components/LoginPage';
import ConfigurationSetup from './components/ConfigurationSetup';
import * as dataService from './services/dataService';
import { getSupabase } from './services/supabaseClient';
import { 
    Equipment, Brand, EquipmentType, Instituicao, Entidade, Collaborator, 
    Assignment, Ticket, TicketActivity, Team, TeamMember, SoftwareLicense, 
    LicenseAssignment, Message, UserRole, CollaboratorStatus 
} from './types';

// Modal Imports
import AddEquipmentModal from './components/AddEquipmentModal';
import AddCollaboratorModal from './components/AddCollaboratorModal';
import AddTicketModal from './components/AddTicketModal';
import AddTeamModal from './components/AddTeamModal';
import AddEntidadeModal from './components/AddEntidadeModal';
import AddInstituicaoModal from './components/AddInstituicaoModal';
import AddBrandModal from './components/AddBrandModal';
import AddEquipmentTypeModal from './components/AddEquipmentTypeModal';
import AddLicenseModal from './components/AddLicenseModal';
import AddEquipmentKitModal from './components/AddEquipmentKitModal';
import AssignEquipmentModal from './components/AssignEquipmentModal';
import AssignMultipleEquipmentModal from './components/AssignMultipleEquipmentModal';
import CloseTicketModal from './components/CloseTicketModal';
import TicketActivitiesModal from './components/TicketActivitiesModal';
import EquipmentHistoryModal from './components/EquipmentHistoryModal';
import CollaboratorHistoryModal from './components/CollaboratorHistoryModal';
import CollaboratorDetailModal from './components/CollaboratorDetailModal';
import ManageAssignedLicensesModal from './components/ManageAssignedLicensesModal';
import ManageTeamMembersModal from './components/ManageTeamMembersModal';
import NotificationsModal from './components/NotificationsModal';
import ReportModal from './components/ReportModal';
import ImportModal, { ImportConfig } from './components/ImportModal';
import { ChatWidget } from './components/ChatWidget';
import ConfirmationModal from './components/common/ConfirmationModal';
import InfoModal from './components/common/InfoModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import { PlusIcon, FaFileImport } from './components/common/Icons';

// Types for Modal State
type ModalType = 
    | { type: 'add_equipment', data?: Equipment }
    | { type: 'add_collaborator', data?: Collaborator }
    | { type: 'add_ticket', data?: Ticket }
    | { type: 'add_team', data?: Team }
    | { type: 'add_entidade', data?: Entidade }
    | { type: 'add_instituicao', data?: Instituicao }
    | { type: 'add_brand', data?: Brand }
    | { type: 'add_equipment_type', data?: EquipmentType }
    | { type: 'add_license', data?: SoftwareLicense }
    | { type: 'add_kit', initialData?: Partial<Equipment> }
    | { type: 'assign_equipment', data: Equipment }
    | { type: 'assign_multiple', data: Equipment[] }
    | { type: 'close_ticket', data: Ticket }
    | { type: 'ticket_activities', data: Ticket }
    | { type: 'equipment_history', data: Equipment }
    | { type: 'collaborator_history', data: Collaborator }
    | { type: 'collaborator_detail', data: Collaborator }
    | { type: 'manage_licenses', data: Equipment }
    | { type: 'manage_team_members', data: Team }
    | { type: 'notifications' }
    | { type: 'report', reportType: 'equipment' | 'collaborator' | 'ticket' | 'licensing' }
    | { type: 'import', data: ImportConfig }
    | { type: 'forgot_password' }
    | { type: 'reset_password' }
    | null;

export const App: React.FC = () => {
    const [isConfigured, setIsConfigured] = useState<boolean>(!!sessionStorage.getItem('SUPABASE_URL'));
    const [session, setSession] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [modal, setModal] = useState<ModalType>(null);
    const [confirmation, setConfirmation] = useState<{ message: string, onConfirm: () => void } | null>(null);
    const [infoModal, setInfoModal] = useState<{ title: string, content: React.ReactNode } | null>(null);
    const [initialFilter, setInitialFilter] = useState<any>(null);

    // Data State
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [entidades, setEntidades] = useState<Entidade[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [ticketActivities, setTicketActivities] = useState<TicketActivity[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [softwareLicenses, setSoftwareLicenses] = useState<SoftwareLicense[]>([]);
    const [licenseAssignments, setLicenseAssignments] = useState<LicenseAssignment[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [collaboratorHistory, setCollaboratorHistory] = useState<any[]>([]);

    // Chat
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeChatCollaboratorId, setActiveChatCollaboratorId] = useState<string | null>(null);

    // Load Session and Initial Data
    useEffect(() => {
        if (!isConfigured) return;

        const supabase = getSupabase();
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchInitialData(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchInitialData(session.user.id);
            } else {
                setCurrentUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [isConfigured]);

    const fetchInitialData = async (userId?: string) => {
        try {
            const data = await dataService.fetchAllData();
            setEquipment(data.equipment);
            setBrands(data.brands);
            setEquipmentTypes(data.equipmentTypes);
            setInstituicoes(data.instituicoes);
            setEntidades(data.entidades);
            setCollaborators(data.collaborators);
            setAssignments(data.assignments);
            setTickets(data.tickets);
            setTicketActivities(data.ticketActivities);
            setTeams(data.teams);
            setTeamMembers(data.teamMembers);
            setSoftwareLicenses(data.softwareLicenses);
            setLicenseAssignments(data.licenseAssignments);
            setMessages(data.messages);
            setCollaboratorHistory(data.collaboratorHistory);

            // Simple logic: try to match user email to collaborator email if present
            if (data.collaborators.length > 0) {
                 const supabase = getSupabase();
                 const { data: { user } } = await supabase.auth.getUser();
                 if (user && user.email) {
                     const matched = data.collaborators.find(c => c.email === user.email);
                     if (matched) setCurrentUser(matched);
                 }
            }

        } catch (error) {
            console.error("Failed to fetch initial data:", error);
        }
    };

    const handleLogin = async (email: string, password: string) => {
        const supabase = getSupabase();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const handleLogout = async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        setSession(null);
        setCurrentUser(null);
    };

    const handleResetData = () => {
        if (session?.user) fetchInitialData(session.user.id);
    };

    // Helper for Deletion
    const handleDelete = async (
        type: string, 
        id: string, 
        deleteFn: (id: string) => Promise<void>, 
        setStateFn: React.Dispatch<React.SetStateAction<any[]>>
    ) => {
        try {
            await deleteFn(id);
            setStateFn(prev => prev.filter(item => item.id !== id));
            setConfirmation(null);
        } catch (error) {
            console.error(`Failed to delete ${type}:`, error);
            alert(`Erro ao apagar ${type}.`);
        }
    };

    // Helper to update state after add/edit
    const handleSave = async (
        saveFn: (data: any) => Promise<any>,
        data: any,
        setStateFn: React.Dispatch<React.SetStateAction<any[]>>,
        isEdit: boolean
    ) => {
        try {
            const savedItem = await saveFn(data);
            setStateFn(prev => {
                if (isEdit) {
                    return prev.map(item => item.id === savedItem.id ? savedItem : item);
                }
                return [...prev, savedItem];
            });
            setModal(null);
        } catch (error) {
            console.error("Save failed:", error);
            alert("Erro ao guardar dados.");
        }
    };
    
    const handleImport = async (dataType: ImportConfig['dataType'], data: any[]) => {
        try {
            let count = 0;
            if (dataType === 'collaborators') {
                const { data: inserted } = await dataService.addMultipleCollaborators(data as any);
                count = inserted ? inserted.length : 0;
                setCollaborators(prev => [...prev, ...(inserted as Collaborator[] || [])]);
            } else if (dataType === 'instituicoes') {
                 const { data: inserted } = await dataService.addMultipleInstituicoes(data as any);
                 count = inserted ? inserted.length : 0;
                 setInstituicoes(prev => [...prev, ...(inserted || [])]);
            } else if (dataType === 'entidades') {
                 const { data: inserted } = await dataService.addMultipleEntidades(data as any);
                 count = inserted ? inserted.length : 0;
                 setEntidades(prev => [...prev, ...(inserted || [])]);
            }
            return { success: true, message: `Importação concluída com sucesso! ${count} registos importados.` };
        } catch (error: any) {
            return { success: false, message: `Erro na importação: ${error.message}` };
        }
    };

    // Specific Handlers
    const handleToggleCollaboratorStatus = async (id: string) => {
        const collaborator = collaborators.find(c => c.id === id);
        if (!collaborator) return;
        const newStatus = collaborator.status === CollaboratorStatus.Ativo ? CollaboratorStatus.Inativo : CollaboratorStatus.Ativo;
        
        try {
            const updated = await dataService.updateCollaborator(id, { status: newStatus });
            setCollaborators(prev => prev.map(c => c.id === id ? updated : c));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };
    
    const handleOpenChat = (target: Collaborator) => {
        setActiveChatCollaboratorId(target.id);
        setIsChatOpen(true);
    };

    // Derived Data
    const assignedEquipmentIds = useMemo(() => {
        return new Set(assignments.filter(a => !a.returnDate).map(a => a.equipmentId));
    }, [assignments]);

    const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const equipmentTypeMap = useMemo(() => new Map(equipmentTypes.map(t => [t.id, t.name])), [equipmentTypes]);

    const expiringWarranties = useMemo(() => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        return equipment.filter(eq => {
            if (!eq.warrantyEndDate) return false;
            const expiryDate = new Date(eq.warrantyEndDate);
            return expiryDate <= thirtyDaysFromNow; // Includes expired
        });
    }, [equipment]);

    const expiringLicenses = useMemo(() => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        return softwareLicenses.filter(lic => {
            if (!lic.expiryDate) return false;
            const expiryDate = new Date(lic.expiryDate);
            return expiryDate <= thirtyDaysFromNow;
        });
    }, [softwareLicenses]);
    
    const unreadMessagesCount = useMemo(() => {
        if (!currentUser) return 0;
        return messages.filter(m => m.receiverId === currentUser.id && !m.read).length;
    }, [messages, currentUser]);


    // Tab Configuration
    const tabConfig: Record<string, any> = {
        'overview': {
            title: 'Visão Geral',
            component: <OverviewDashboard 
                equipment={equipment}
                instituicoes={instituicoes}
                entidades={entidades}
                assignments={assignments}
                equipmentTypes={equipmentTypes}
                tickets={tickets}
                collaborators={collaborators}
                teams={teams}
                expiringWarranties={expiringWarranties}
                expiringLicenses={expiringLicenses}
                softwareLicenses={softwareLicenses}
                licenseAssignments={licenseAssignments}
                onViewItem={(tab, filter) => {
                    setActiveTab(tab);
                    setInitialFilter(filter);
                }}
            />
        },
        'equipment.inventory': {
            title: 'Inventário de Equipamentos',
            component: <EquipmentDashboard
                equipment={equipment}
                brands={brands}
                equipmentTypes={equipmentTypes}
                brandMap={brandMap}
                equipmentTypeMap={equipmentTypeMap}
                assignedEquipmentIds={assignedEquipmentIds}
                assignments={assignments}
                collaborators={collaborators}
                entidades={entidades}
                initialFilter={initialFilter}
                onClearInitialFilter={() => setInitialFilter(null)}
                onAssign={(eq) => setModal({ type: 'assign_equipment', data: eq })}
                onAssignMultiple={(eqs) => setModal({ type: 'assign_multiple', data: eqs })}
                onUnassign={async (id) => {
                    const assignment = assignments.find(a => a.equipmentId === id && !a.returnDate);
                    if (assignment) {
                        const returnDate = new Date().toISOString().split('T')[0];
                        const updated = await dataService.updateAssignment(assignment.id, { returnDate });
                        setAssignments(prev => prev.map(a => a.id === assignment.id ? updated : a));
                    }
                }}
                onUpdateStatus={async (id, status) => {
                    const updated = await dataService.updateEquipment(id, { status });
                    setEquipment(prev => prev.map(e => e.id === id ? updated : e));
                }}
                onShowHistory={(eq) => setModal({ type: 'equipment_history', data: eq })}
                onEdit={(eq) => setModal({ type: 'add_equipment', data: eq })}
                onGenerateReport={() => setModal({ type: 'report', reportType: 'equipment' })}
                onManageKeys={(eq) => setModal({ type: 'manage_licenses', data: eq })}
            />,
            buttonText: 'Adicionar Equipamento',
            onButtonClick: () => setModal({ type: 'add_equipment' }),
            onImportClick: () => setModal({ type: 'add_kit' })
        },
        'equipment.brands': {
            title: 'Marcas',
            component: <BrandDashboard 
                brands={brands} 
                equipment={equipment}
                onEdit={(brand) => setModal({ type: 'add_brand', data: brand })}
                onDelete={(id) => setConfirmation({ message: 'Tem a certeza que quer apagar esta marca?', onConfirm: () => handleDelete('brand', id, dataService.deleteBrand, setBrands) })}
            />,
            buttonText: 'Adicionar Marca',
            onButtonClick: () => setModal({ type: 'add_brand' })
        },
        'equipment.types': {
            title: 'Tipos de Equipamento',
            component: <EquipmentTypeDashboard 
                equipmentTypes={equipmentTypes}
                equipment={equipment}
                onEdit={(type) => setModal({ type: 'add_equipment_type', data: type })}
                onDelete={(id) => setConfirmation({ message: 'Tem a certeza que quer apagar este tipo?', onConfirm: () => handleDelete('equipment_type', id, dataService.deleteEquipmentType, setEquipmentTypes) })}
            />,
             buttonText: 'Adicionar Tipo',
             onButtonClick: () => setModal({ type: 'add_equipment_type' })
        },
        'organizacao.instituicoes': {
             title: 'Instituições',
             component: <InstituicaoDashboard 
                instituicoes={instituicoes}
                escolasDepartamentos={entidades}
                onEdit={(inst) => setModal({ type: 'add_instituicao', data: inst })}
                onDelete={(id) => setConfirmation({ message: 'Tem a certeza?', onConfirm: () => handleDelete('instituicao', id, dataService.deleteInstituicao, setInstituicoes) })}
             />,
             buttonText: 'Adicionar Instituição',
             onButtonClick: () => setModal({ type: 'add_instituicao' })
        },
        'organizacao.entidades': {
            title: 'Entidades',
            component: <EntidadeDashboard 
                escolasDepartamentos={entidades}
                instituicoes={instituicoes}
                collaborators={collaborators}
                onEdit={(ent) => setModal({ type: 'add_entidade', data: ent })}
                onDelete={(id) => setConfirmation({ message: 'Tem a certeza?', onConfirm: () => handleDelete('entidade', id, dataService.deleteEntidade, setEntidades) })}
                onToggleStatus={async (id) => {
                    const ent = entidades.find(e => e.id === id);
                    if(ent) {
                        const newStatus = ent.status === 'Ativo' ? 'Inativo' : 'Ativo';
                        const updated = await dataService.updateEntidade(id, { status: newStatus as any });
                        setEntidades(prev => prev.map(e => e.id === id ? updated : e));
                    }
                }}
            />,
            buttonText: 'Adicionar Entidade',
            onButtonClick: () => setModal({ type: 'add_entidade' })
        },
        'organizacao.teams': {
            title: 'Equipas',
            component: <TeamDashboard 
                teams={teams}
                teamMembers={teamMembers}
                collaborators={collaborators}
                tickets={tickets}
                onEdit={(team) => setModal({ type: 'add_team', data: team })}
                onDelete={(id) => setConfirmation({ message: 'Tem a certeza?', onConfirm: () => handleDelete('teams', id, dataService.deleteTeam, setTeams) })}
                onManageMembers={(team) => setModal({ type: 'manage_team_members', data: team })}
            />,
            buttonText: 'Adicionar Equipa',
            onButtonClick: () => setModal({ type: 'add_team' })
        },
        'collaborators': {
            title: 'Colaboradores',
            component: <CollaboratorDashboard 
                collaborators={collaborators}
                escolasDepartamentos={entidades}
                equipment={equipment}
                assignments={assignments}
                tickets={tickets}
                ticketActivities={ticketActivities}
                teamMembers={teamMembers}
                currentUser={currentUser}
                onEdit={(col) => setModal({ type: 'add_collaborator', data: col })}
                onDelete={(id) => {
                    // Safety check purely for the handler, though UI will likely be disabled
                    setConfirmation({ 
                        message: 'Tem a certeza que quer excluir este colaborador? Esta ação não pode ser desfeita.', 
                        onConfirm: () => handleDelete('collaborator', id, dataService.deleteCollaborator, setCollaborators) 
                    });
                }}
                onShowHistory={(col) => setModal({ type: 'collaborator_history', data: col })}
                onShowDetails={(col) => setModal({ type: 'collaborator_detail', data: col })}
                onStartChat={handleOpenChat}
                onGenerateReport={() => setModal({ type: 'report', reportType: 'collaborator' })}
                onToggleStatus={handleToggleCollaboratorStatus}
            />,
            buttonText: 'Adicionar Colaborador',
            onButtonClick: () => setModal({ type: 'add_collaborator' }),
            onImportClick: () => setModal({ type: 'import', data: { dataType: 'collaborators', title: 'Importar Colaboradores', columnMap: { numeroMecanografico: 'Nº Mecanográfico', fullName: 'Nome Completo', entidadeCodigo: 'Código Entidade', email: 'Email', telefoneInterno: 'Telefone Interno', telemovel: 'Telemóvel', canLogin: 'Pode Fazer Login (TRUE/FALSE)', receivesNotifications: 'Recebe Notificações (TRUE/FALSE)', role: 'Perfil (Admin/Normal/Basic/Utilizador)', status: 'Status (Ativo/Inativo)', password: 'Password Temporária (para novos com login)' }, templateFileName: 'template_colaboradores.xlsx' } as ImportConfig }),
        },
        'tickets': {
             title: 'Tickets de Suporte',
             component: <TicketDashboard 
                tickets={tickets}
                escolasDepartamentos={entidades}
                collaborators={collaborators}
                teams={teams}
                equipment={equipment}
                equipmentTypes={equipmentTypes}
                initialFilter={initialFilter}
                onClearInitialFilter={() => setInitialFilter(null)}
                onUpdateTicket={async (updatedTicket) => {
                    const saved = await dataService.updateTicket(updatedTicket.id, updatedTicket);
                    setTickets(prev => prev.map(t => t.id === saved.id ? saved : t));
                }}
                onEdit={(ticket) => setModal({ type: 'add_ticket', data: ticket })}
                onOpenCloseTicketModal={(ticket) => setModal({ type: 'close_ticket', data: ticket })}
                onGenerateReport={() => setModal({ type: 'report', reportType: 'ticket' })}
                onOpenActivities={(ticket) => setModal({ type: 'ticket_activities', data: ticket })}
             />,
             buttonText: 'Novo Ticket',
             onButtonClick: () => setModal({ type: 'add_ticket' })
        },
        'licensing': {
            title: 'Licenciamento',
            component: <LicenseDashboard 
                licenses={softwareLicenses}
                licenseAssignments={licenseAssignments}
                equipmentData={equipment}
                assignments={assignments}
                collaborators={collaborators}
                brandMap={brandMap}
                equipmentTypeMap={equipmentTypeMap}
                initialFilter={initialFilter}
                onClearInitialFilter={() => setInitialFilter(null)}
                onEdit={(lic) => setModal({ type: 'add_license', data: lic })}
                onDelete={(id) => setConfirmation({ message: 'Tem a certeza?', onConfirm: () => handleDelete('software_license', id, dataService.deleteLicense, setSoftwareLicenses) })}
                onToggleStatus={async (id) => {
                     const lic = softwareLicenses.find(l => l.id === id);
                     if (lic) {
                         const newStatus = lic.status === 'Ativo' ? 'Inativo' : 'Ativo';
                         const updated = await dataService.updateLicense(id, { status: newStatus as any });
                         setSoftwareLicenses(prev => prev.map(l => l.id === id ? updated : l));
                     }
                }}
                onGenerateReport={() => setModal({ type: 'report', reportType: 'licensing' })}
            />,
            buttonText: 'Adicionar Licença',
            onButtonClick: () => setModal({ type: 'add_license' })
        }
    };

    // If not configured, show setup
    if (!isConfigured) {
        return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    }

    // If configured but not logged in, show login
    if (!session) {
        return (
            <>
                {modal?.type === 'forgot_password' ? (
                     <ForgotPasswordModal onClose={() => setModal(null)} />
                ) : modal?.type === 'reset_password' ? (
                    <ResetPasswordModal onClose={() => setModal(null)} session={session} />
                ) : (
                    <LoginPage 
                        onLogin={handleLogin} 
                        onForgotPassword={() => setModal({ type: 'forgot_password' })} 
                    />
                )}
            </>
        );
    }

    const activeConfig = tabConfig[activeTab];

    return (
        <div className="min-h-screen bg-background-dark">
            <Header 
                currentUser={currentUser} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onLogout={handleLogout} 
                onResetData={handleResetData}
                tabConfig={tabConfig}
                notificationCount={(expiringWarranties.length + expiringLicenses.length)}
                onNotificationClick={() => setModal({ type: 'notifications' })}
            />

            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeConfig && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h1 className="text-2xl font-bold text-white">{activeConfig.title}</h1>
                            <div className="flex flex-wrap gap-3">
                                {activeConfig.onImportClick && (
                                     <button
                                        onClick={activeConfig.onImportClick}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                                    >
                                        <FaFileImport />
                                        {activeTab === 'equipment.inventory' ? 'Adicionar Kit' : 'Importar'}
                                    </button>
                                )}
                                {activeConfig.onButtonClick && (
                                    <button
                                        onClick={activeConfig.onButtonClick}
                                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors"
                                    >
                                        <PlusIcon />
                                        {activeConfig.buttonText}
                                    </button>
                                )}
                            </div>
                        </div>
                        {activeConfig.component}
                    </div>
                )}
            </main>
            
            <ChatWidget 
                currentUser={currentUser} 
                collaborators={collaborators} 
                messages={messages} 
                onSendMessage={async (receiverId, content) => {
                    const newMessage = {
                         senderId: currentUser!.id,
                         receiverId,
                         content,
                         timestamp: new Date().toISOString(),
                         read: false,
                    };
                    const saved = await dataService.addMessage(newMessage as any);
                    setMessages(prev => [...prev, saved]);
                }}
                onMarkMessagesAsRead={(senderId) => {
                     dataService.markMessagesAsRead(senderId, currentUser!.id);
                     setMessages(prev => prev.map(m => (m.senderId === senderId && m.receiverId === currentUser!.id) ? { ...m, read: true } : m));
                }}
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(!isChatOpen)}
                activeChatCollaboratorId={activeChatCollaboratorId}
                onSelectConversation={setActiveChatCollaboratorId}
                unreadMessagesCount={unreadMessagesCount}
            />

            {/* Modals Rendering - (Identical to previous, kept for completeness) */}
            {modal?.type === 'add_equipment' && (
                <AddEquipmentModal
                    onClose={() => setModal(null)}
                    onSave={(eq) => handleSave((eq as any).id ? (data) => dataService.updateEquipment((eq as any).id!, data) : dataService.addEquipment, eq, setEquipment, !!(eq as any).id)}
                    equipmentToEdit={modal.data}
                    brands={brands}
                    equipmentTypes={equipmentTypes}
                    onSaveBrand={(b) => dataService.addBrand(b as any).then(res => { setBrands(p => [...p, res]); return res; })}
                    onSaveEquipmentType={(t) => dataService.addEquipmentType(t as any).then(res => { setEquipmentTypes(p => [...p, res]); return res; })}
                    onOpenKitModal={(initialData) => setModal({ type: 'add_kit', initialData })}
                />
            )}
            {modal?.type === 'add_collaborator' && (
                <AddCollaboratorModal
                    onClose={() => setModal(null)}
                    onSave={async (col, password) => {
                        if ((col as any).id) {
                            handleSave((d) => dataService.updateCollaborator((col as any).id!, d), col, setCollaborators, true);
                        } else {
                             const { data: newUser, error } = await getSupabase().auth.signUp({ email: col.email, password: password! });
                             if (error) { alert(error.message); return; }
                             if (newUser.user) {
                                 handleSave(dataService.addCollaborator, { ...col, id: newUser.user.id }, setCollaborators, false);
                             }
                        }
                    }}
                    collaboratorToEdit={modal.data}
                    escolasDepartamentos={entidades}
                    currentUser={currentUser}
                />
            )}
            {modal?.type === 'add_ticket' && (
                <AddTicketModal
                    onClose={() => setModal(null)}
                    onSave={(ticket) => handleSave((ticket as any).id ? (d) => dataService.updateTicket((ticket as any).id!, d) : dataService.addTicket, ticket, setTickets, !!(ticket as any).id)}
                    ticketToEdit={modal.data}
                    escolasDepartamentos={entidades}
                    collaborators={collaborators}
                    teams={teams}
                    currentUser={currentUser}
                    userPermissions={{ viewScope: 'all' }}
                    equipment={equipment}
                    equipmentTypes={equipmentTypes}
                    assignments={assignments}
                />
            )}
             {modal?.type === 'add_team' && (
                <AddTeamModal
                    onClose={() => setModal(null)}
                    onSave={(team) => handleSave((team as any).id ? (d) => dataService.updateTeam((team as any).id!, d) : dataService.addTeam, team, setTeams, !!(team as any).id)}
                    teamToEdit={modal.data}
                />
            )}
             {modal?.type === 'add_entidade' && (
                <AddEntidadeModal
                    onClose={() => setModal(null)}
                    onSave={(ent) => handleSave((ent as any).id ? (d) => dataService.updateEntidade((ent as any).id!, d) : dataService.addEntidade, ent, setEntidades, !!(ent as any).id)}
                    entidadeToEdit={modal.data}
                    instituicoes={instituicoes}
                />
            )}
            {modal?.type === 'add_instituicao' && (
                <AddInstituicaoModal
                    onClose={() => setModal(null)}
                    onSave={(inst) => handleSave((inst as any).id ? (d) => dataService.updateInstituicao((inst as any).id!, d) : dataService.addInstituicao, inst, setInstituicoes, !!(inst as any).id)}
                    instituicaoToEdit={modal.data}
                />
            )}
            {modal?.type === 'add_brand' && (
                 <AddBrandModal
                    onClose={() => setModal(null)}
                    onSave={(br) => handleSave((br as any).id ? (d) => dataService.updateBrand((br as any).id!, d) : dataService.addBrand, br, setBrands, !!(br as any).id)}
                    brandToEdit={modal.data}
                 />
            )}
            {modal?.type === 'add_equipment_type' && (
                <AddEquipmentTypeModal
                    onClose={() => setModal(null)}
                    onSave={(tp) => handleSave((tp as any).id ? (d) => dataService.updateEquipmentType((tp as any).id!, d) : dataService.addEquipmentType, tp, setEquipmentTypes, !!(tp as any).id)}
                    typeToEdit={modal.data}
                    teams={teams}
                />
            )}
            {modal?.type === 'add_license' && (
                 <AddLicenseModal
                    onClose={() => setModal(null)}
                    onSave={(lic) => handleSave((lic as any).id ? (d) => dataService.updateLicense((lic as any).id!, d) : dataService.addLicense, lic, setSoftwareLicenses, !!(lic as any).id)}
                    licenseToEdit={modal.data}
                 />
            )}
            {modal?.type === 'add_kit' && (
                <AddEquipmentKitModal
                    onClose={() => setModal(null)}
                    onSaveKit={async (items) => {
                         const { data } = await dataService.addMultipleEquipment(items as any);
                         if (data) setEquipment(prev => [...prev, ...data]);
                    }}
                    brands={brands}
                    equipmentTypes={equipmentTypes}
                    initialData={modal.initialData}
                    onSaveEquipmentType={(t) => dataService.addEquipmentType(t as any).then(res => { setEquipmentTypes(p => [...p, res]); return res; })}
                    equipment={equipment}
                />
            )}
            {modal?.type === 'assign_equipment' && (
                <AssignEquipmentModal
                    equipment={modal.data}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    escolasDepartamentos={entidades}
                    collaborators={collaborators}
                    onClose={() => setModal(null)}
                    onAssign={async (assignment) => {
                        const newAssignment = await dataService.addAssignment(assignment as any);
                        setAssignments(prev => [...prev, newAssignment]);
                        setModal(null);
                    }}
                />
            )}
            {modal?.type === 'assign_multiple' && (
                <AssignMultipleEquipmentModal
                    equipmentList={modal.data}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    escolasDepartamentos={entidades}
                    collaborators={collaborators}
                    onClose={() => setModal(null)}
                    onAssign={async (assignmentData) => {
                        const assignmentsToCreate = modal.data.map(eq => ({
                            equipmentId: eq.id,
                            ...assignmentData
                        }));
                        const { data } = await dataService.addMultipleAssignments(assignmentsToCreate as any);
                        if (data) setAssignments(prev => [...prev, ...data]);
                        setModal(null);
                    }}
                />
            )}
             {modal?.type === 'close_ticket' && (
                <CloseTicketModal
                    ticket={modal.data}
                    collaborators={collaborators}
                    onClose={() => setModal(null)}
                    onConfirm={async (technicianId) => {
                        const updated = await dataService.updateTicket(modal.data.id, { 
                            status: 'Finalizado' as any, 
                            technicianId, 
                            finishDate: new Date().toISOString().split('T')[0] 
                        });
                        setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
                        setModal(null);
                    }}
                />
            )}
            {modal?.type === 'ticket_activities' && (
                <TicketActivitiesModal
                    ticket={modal.data}
                    activities={ticketActivities.filter(ta => ta.ticketId === modal.data.id)}
                    collaborators={collaborators}
                    currentUser={currentUser}
                    equipment={equipment}
                    equipmentTypes={equipmentTypes}
                    entidades={entidades}
                    onClose={() => setModal(null)}
                    onAddActivity={async (activity) => {
                         const newActivity = await dataService.addTicketActivity({
                             ...activity,
                             ticketId: modal.data.id,
                             technicianId: currentUser?.id || '',
                             date: new Date().toISOString()
                         } as any);
                         setTicketActivities(prev => [...prev, newActivity]);
                    }}
                    assignments={assignments}
                />
            )}
            {modal?.type === 'equipment_history' && (
                <EquipmentHistoryModal
                    equipment={modal.data}
                    assignments={assignments}
                    collaborators={collaborators}
                    escolasDepartamentos={entidades}
                    tickets={tickets}
                    ticketActivities={ticketActivities}
                    onClose={() => setModal(null)}
                />
            )}
            {modal?.type === 'collaborator_history' && (
                 <CollaboratorHistoryModal
                    collaborator={modal.data}
                    history={collaboratorHistory}
                    escolasDepartamentos={entidades}
                    onClose={() => setModal(null)}
                 />
            )}
            {modal?.type === 'collaborator_detail' && (
                <CollaboratorDetailModal
                    collaborator={modal.data}
                    assignments={assignments}
                    equipment={equipment}
                    tickets={tickets}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    onClose={() => setModal(null)}
                    onShowHistory={(col) => setModal({ type: 'collaborator_history', data: col })}
                    onStartChat={handleOpenChat}
                />
            )}
            {modal?.type === 'manage_licenses' && (
                <ManageAssignedLicensesModal
                    equipment={modal.data}
                    allLicenses={softwareLicenses}
                    allAssignments={licenseAssignments}
                    onClose={() => setModal(null)}
                    onSave={async (eqId, licenseIds) => {
                        await dataService.syncLicenseAssignments(eqId, licenseIds);
                        const freshData = await dataService.fetchAllData();
                        setLicenseAssignments(freshData.licenseAssignments);
                        setModal(null);
                    }}
                />
            )}
            {modal?.type === 'manage_team_members' && (
                <ManageTeamMembersModal
                    team={modal.data}
                    allCollaborators={collaborators}
                    teamMembers={teamMembers}
                    onClose={() => setModal(null)}
                    onSave={async (teamId, memberIds) => {
                        await dataService.syncTeamMembers(teamId, memberIds);
                         const freshData = await dataService.fetchAllData();
                         setTeamMembers(freshData.teamMembers);
                         setModal(null);
                    }}
                />
            )}
            {modal?.type === 'notifications' && (
                 <NotificationsModal
                    onClose={() => setModal(null)}
                    expiringWarranties={expiringWarranties}
                    expiringLicenses={expiringLicenses}
                    teamTickets={tickets}
                    collaborators={collaborators}
                    teams={teams}
                    onViewItem={(tab, filter) => {
                        setActiveTab(tab);
                        setInitialFilter(filter);
                        setModal(null);
                    }}
                    onSnooze={() => {}}
                 />
            )}
            {modal?.type === 'report' && (
                 <ReportModal
                    type={modal.reportType}
                    onClose={() => setModal(null)}
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
            {modal?.type === 'import' && (
                <ImportModal
                    onClose={() => setModal(null)}
                    onImport={handleImport}
                    config={modal.data}
                />
            )}

            {confirmation && (
                <ConfirmationModal
                    title="Confirmação"
                    message={confirmation.message}
                    onClose={() => setConfirmation(null)}
                    onConfirm={confirmation.onConfirm}
                />
            )}
            {infoModal && (
                <InfoModal
                    title={infoModal.title}
                    onClose={() => setInfoModal(null)}
                >
                    {infoModal.content}
                </InfoModal>
            )}
        </div>
    );
};
