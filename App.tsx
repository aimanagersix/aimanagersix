
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
import ImportModal, { ImportConfig } from './components/ImportModal';
import ManageAssignedLicensesModal from './components/ManageAssignedLicensesModal';
import AddCollaboratorModal from './components/AddCollaboratorModal';
import AddTicketModal from './components/AddTicketModal';
import TicketActivitiesModal from './components/TicketActivitiesModal';
import CloseTicketModal from './components/CloseTicketModal';
import CollaboratorDetailModal from './components/CollaboratorDetailModal';
import CollaboratorHistoryModal from './components/CollaboratorHistoryModal';
import ReportModal from './components/ReportModal';
import AddEquipmentModal from './components/AddEquipmentModal';
import AddInstituicaoModal from './components/AddInstituicaoModal';
import AddEntidadeModal from './components/AddEntidadeModal';
import AddBrandModal from './components/AddBrandModal';
import AddEquipmentTypeModal from './components/AddEquipmentTypeModal';
import AddLicenseModal from './components/AddLicenseModal';
import AddTeamModal from './components/AddTeamModal';
import ManageTeamMembersModal from './components/ManageTeamMembersModal';
import AddEquipmentKitModal from './components/AddEquipmentKitModal';
import AssignEquipmentModal from './components/AssignEquipmentModal';
import AssignMultipleEquipmentModal from './components/AssignMultipleEquipmentModal';
import EquipmentHistoryModal from './components/EquipmentHistoryModal';
import { ChatWidget } from './components/ChatWidget';
import * as dataService from './services/dataService';
import { getSupabase } from './services/supabaseClient';
import { 
    Equipment, Instituicao, Entidade, Collaborator, Assignment, EquipmentType, Brand, 
    Ticket, TicketActivity, CollaboratorHistory, Message, SoftwareLicense, LicenseAssignment, 
    Team, TeamMember, EquipmentStatus, TicketStatus, CollaboratorStatus, LicenseStatus, EntidadeStatus
} from './types';
import { PlusIcon, FaFileImport } from './components/common/Icons';

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

    // --- Modal States ---
    const [importModalConfig, setImportModalConfig] = useState<ImportConfig | null>(null);

    // Equipment
    const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [showHistoryEquipment, setShowHistoryEquipment] = useState<Equipment | null>(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignEquipmentItem, setAssignEquipmentItem] = useState<Equipment | null>(null);
    const [assignMultipleModalOpen, setAssignMultipleModalOpen] = useState(false);
    const [assignMultipleList, setAssignMultipleList] = useState<Equipment[]>([]);
    const [manageLicensesEquipment, setManageLicensesEquipment] = useState<Equipment | null>(null);
    const [isKitModalOpen, setIsKitModalOpen] = useState(false);
    const [kitModalInitialData, setKitModalInitialData] = useState<Partial<Equipment> | null>(null);

    // Organization & Others
    const [isAddCollaboratorModalOpen, setIsAddCollaboratorModalOpen] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
    const [showDetailCollaborator, setShowDetailCollaborator] = useState<Collaborator | null>(null);
    const [showHistoryCollaborator, setShowHistoryCollaborator] = useState<Collaborator | null>(null);
    
    const [isAddInstituicaoModalOpen, setIsAddInstituicaoModalOpen] = useState(false);
    const [editingInstituicao, setEditingInstituicao] = useState<Instituicao | null>(null);
    
    const [isAddEntidadeModalOpen, setIsAddEntidadeModalOpen] = useState(false);
    const [editingEntidade, setEditingEntidade] = useState<Entidade | null>(null);

    const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

    const [isAddEquipmentTypeModalOpen, setIsAddEquipmentTypeModalOpen] = useState(false);
    const [editingEquipmentType, setEditingEquipmentType] = useState<EquipmentType | null>(null);
    
    const [isAddLicenseModalOpen, setIsAddLicenseModalOpen] = useState(false);
    const [editingLicense, setEditingLicense] = useState<SoftwareLicense | null>(null);

    const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [manageTeamMembersTeam, setManageTeamMembersTeam] = useState<Team | null>(null);

    // Tickets
    const [isAddTicketModalOpen, setIsAddTicketModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
    const [ticketActivitiesOpen, setTicketActivitiesOpen] = useState<Ticket | null>(null);
    const [ticketToClose, setTicketToClose] = useState<Ticket | null>(null);

    // Global
    const [reportType, setReportType] = useState<'equipment' | 'collaborator' | 'ticket' | 'licensing' | null>(null);
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
            
            if (dataType === 'equipment') {
                const resolvedData = [];
                const currentBrands = [...brands];
                const currentTypes = [...equipmentTypes];
                let brandsAdded = false;
                let typesAdded = false;

                for (const row of data) {
                    let brandId = currentBrands.find(b => b.name.toLowerCase() === row.brandName?.trim().toLowerCase())?.id;
                    if (!brandId && row.brandName) {
                        // Create Brand if it doesn't exist
                        const newBrand = await dataService.addBrand({ name: row.brandName.trim() });
                        currentBrands.push(newBrand);
                        brandId = newBrand.id;
                        brandsAdded = true;
                    }

                    let typeId = currentTypes.find(t => t.name.toLowerCase() === row.typeName?.trim().toLowerCase())?.id;
                    if (!typeId && row.typeName) {
                        // Create Type if it doesn't exist
                        const newType = await dataService.addEquipmentType({ name: row.typeName.trim() });
                        currentTypes.push(newType);
                        typeId = newType.id;
                        typesAdded = true;
                    }

                    if (brandId && typeId) {
                        resolvedData.push({
                            description: row.description || `${row.brandName} ${row.typeName}`,
                            serialNumber: row.serialNumber,
                            inventoryNumber: row.inventoryNumber,
                            purchaseDate: row.purchaseDate || new Date().toISOString().split('T')[0],
                            brandId: brandId,
                            typeId: typeId,
                            status: EquipmentStatus.Stock,
                            nomeNaRede: row.nomeNaRede,
                        });
                    }
                }

                if (brandsAdded) setBrands(currentBrands);
                if (typesAdded) setEquipmentTypes(currentTypes);

                if (resolvedData.length > 0) {
                    const { data: inserted } = await dataService.addMultipleEquipment(resolvedData);
                    count = inserted ? inserted.length : 0;
                     if (inserted) {
                        setEquipment(prev => [...prev, ...(inserted as any[] as Equipment[])]);
                    }
                }

            } else if (dataType === 'collaborators') {
                const resolvedData = [];
                for (const row of data) {
                    // Try to resolve Entidade ID from name
                    const entidadeId = entidades.find(e => e.name.toLowerCase() === row.entidadeName?.trim().toLowerCase())?.id;
                    
                    if (entidadeId) {
                        resolvedData.push({
                            fullName: row.fullName,
                            email: row.email,
                            numeroMecanografico: String(row.numeroMecanografico),
                            entidadeId: entidadeId,
                            canLogin: false,
                            receivesNotifications: false,
                            role: 'Utilizador',
                            status: 'Ativo',
                        });
                    }
                }
                if (resolvedData.length > 0) {
                    const { data: inserted } = await dataService.addMultipleCollaborators(resolvedData);
                    count = inserted ? inserted.length : 0;
                     if (inserted) {
                        setCollaborators(prev => [...prev, ...(inserted as any[] as Collaborator[])]);
                    }
                }

            } else if (dataType === 'entidades') {
                 const resolvedData = [];
                 for (const row of data) {
                    const instituicaoId = instituicoes.find(i => i.name.toLowerCase() === row.instituicaoName?.trim().toLowerCase())?.id;
                    if (instituicaoId) {
                        resolvedData.push({
                            name: row.name,
                            codigo: row.codigo,
                            instituicaoId: instituicaoId,
                            email: row.email || '',
                            description: '',
                            status: 'Ativo'
                        });
                    }
                 }
                 if (resolvedData.length > 0) {
                    const { data: inserted } = await dataService.addMultipleEntidades(resolvedData);
                    count = inserted ? inserted.length : 0;
                     if (inserted) {
                        setEntidades(prev => [...prev, ...(inserted as any[] as Entidade[])]);
                    }
                 }

            } else if (dataType === 'instituicoes') {
                 const { data: inserted } = await dataService.addMultipleInstituicoes(data as any);
                 count = inserted ? inserted.length : 0;
                 if (inserted) {
                     setInstituicoes(prev => [...prev, ...(inserted as any[] as Instituicao[])]);
                 }
            }

            refreshData(); // Refresh everything to be safe
            setImportModalConfig(null);
            return { success: true, message: `Importação concluída com sucesso! ${count} registos importados.` };
        } catch (error: any) {
            console.error("Import error:", error);
            return { success: false, message: `Erro na importação: ${error.message}` };
        }
    };

    const openImportModal = (type: ImportConfig['dataType']) => {
        let config: ImportConfig;
        if (type === 'equipment') {
             config = {
                dataType: 'equipment',
                title: 'Importar Equipamentos',
                columnMap: { 'Marca': 'brandName', 'Tipo': 'typeName', 'Descrição': 'description', 'Nº Série': 'serialNumber', 'Nº Inventário': 'inventoryNumber', 'Data Compra': 'purchaseDate', 'Nome na Rede': 'nomeNaRede' },
                templateFileName: 'template_equipamentos.xlsx'
            };
        } else if (type === 'collaborators') {
            config = {
                dataType: 'collaborators',
                title: 'Importar Colaboradores',
                columnMap: { 'Nome Completo': 'fullName', 'Email': 'email', 'Nº Mec.': 'numeroMecanografico', 'Entidade': 'entidadeName' },
                templateFileName: 'template_colaboradores.xlsx'
            };
        } else if (type === 'entidades') {
            config = {
                dataType: 'entidades',
                title: 'Importar Entidades',
                columnMap: { 'Nome': 'name', 'Código': 'codigo', 'Instituição': 'instituicaoName', 'Email': 'email' },
                templateFileName: 'template_entidades.xlsx'
            };
        } else {
             config = {
                dataType: 'instituicoes',
                title: 'Importar Instituições',
                columnMap: { 'Nome': 'name', 'Código': 'codigo', 'Email': 'email', 'Telefone': 'telefone' },
                templateFileName: 'template_instituicoes.xlsx'
            };
        }
        setImportModalConfig(config);
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
    
    // --- Handlers ---

    // Equipment
    const handleCreateEquipment = async (eq: any) => {
        await dataService.addEquipment({ ...eq, status: EquipmentStatus.Stock });
        refreshData();
    };
    const handleUpdateEquipment = async (eq: Equipment) => {
        await dataService.updateEquipment(eq.id, eq);
        refreshData();
    };
    const handleUpdateEquipmentStatus = async (id: string, status: EquipmentStatus) => {
        await dataService.updateEquipment(id, { status });
        refreshData();
    };
    const handleAssignEquipment = async (assignment: any) => {
        await dataService.addAssignment(assignment);
        await dataService.updateEquipment(assignment.equipmentId, { status: EquipmentStatus.Operational });
        setAssignModalOpen(false);
        refreshData();
    };
    const handleAssignMultiple = async (assignmentBase: any) => {
        const newAssignments = assignMultipleList.map(eq => ({
            ...assignmentBase,
            equipmentId: eq.id,
        }));
        await dataService.addMultipleAssignments(newAssignments);
        for (const eq of assignMultipleList) {
             await dataService.updateEquipment(eq.id, { status: EquipmentStatus.Operational });
        }
        setAssignMultipleModalOpen(false);
        setAssignMultipleList([]);
        refreshData();
    };
    const handleUnassignEquipment = async (equipmentId: string) => {
        const activeAssignment = assignments.find(a => a.equipmentId === equipmentId && !a.returnDate);
        if (activeAssignment) {
            await dataService.updateAssignment(activeAssignment.id, { returnDate: new Date().toISOString().split('T')[0] });
            await dataService.updateEquipment(equipmentId, { status: EquipmentStatus.Stock });
            refreshData();
        }
    };
    const handleCreateKit = async (items: any[]) => {
        const records = items.map(item => ({ ...item, status: EquipmentStatus.Stock }));
        await dataService.addMultipleEquipment(records);
        refreshData();
    };

    // Licensing
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
    const handleCreateLicense = async (lic: any) => {
        await dataService.addLicense(lic);
        refreshData();
    }
    const handleUpdateLicense = async (lic: any) => {
        await dataService.updateLicense(lic.id, lic);
        refreshData();
    }
    const handleDeleteLicense = async (id: string) => {
        await dataService.deleteLicense(id);
        refreshData();
    }
    const handleToggleLicenseStatus = async (id: string) => {
        const license = softwareLicenses.find(l => l.id === id);
        if (license) {
            await dataService.updateLicense(id, { status: license.status === LicenseStatus.Ativo ? LicenseStatus.Inativo : LicenseStatus.Ativo });
            refreshData();
        }
    }

    // Organization (Instituicoes, Entidades, Teams)
    const handleCreateInstituicao = async (inst: any) => {
        await dataService.addInstituicao(inst);
        refreshData();
    };
    const handleUpdateInstituicao = async (inst: any) => {
        await dataService.updateInstituicao(inst.id, inst);
        refreshData();
    };
    const handleDeleteInstituicao = async (id: string) => {
        await dataService.deleteInstituicao(id);
        refreshData();
    }
    const handleCreateEntidade = async (ent: any) => {
        await dataService.addEntidade(ent);
        refreshData();
    }
    const handleUpdateEntidade = async (ent: any) => {
        await dataService.updateEntidade(ent.id, ent);
        refreshData();
    }
    const handleDeleteEntidade = async (id: string) => {
        await dataService.deleteEntidade(id);
        refreshData();
    }
    const handleToggleEntidadeStatus = async (id: string) => {
        const ent = entidades.find(e => e.id === id);
        if (ent) {
             await dataService.updateEntidade(id, { status: ent.status === EntidadeStatus.Ativo ? EntidadeStatus.Inativo : EntidadeStatus.Ativo });
             refreshData();
        }
    }
    const handleCreateTeam = async (team: any) => {
        await dataService.addTeam(team);
        refreshData();
    }
    const handleUpdateTeam = async (team: any) => {
        await dataService.updateTeam(team.id, team);
        refreshData();
    }
    const handleDeleteTeam = async (id: string) => {
        await dataService.deleteTeam(id);
        refreshData();
    }
    const handleSaveTeamMembers = async (teamId: string, memberIds: string[]) => {
        await dataService.syncTeamMembers(teamId, memberIds);
        setManageTeamMembersTeam(null);
        refreshData();
    }

    // Brands & Types
    const handleCreateBrand = async (brand: any) => {
        await dataService.addBrand(brand);
        refreshData();
    }
    const handleUpdateBrand = async (brand: any) => {
        await dataService.updateBrand(brand.id, brand);
        refreshData();
    }
    const handleDeleteBrand = async (id: string) => {
        await dataService.deleteBrand(id);
        refreshData();
    }
    const handleCreateType = async (type: any) => {
        await dataService.addEquipmentType(type);
        refreshData();
    }
    const handleUpdateType = async (type: any) => {
        await dataService.updateEquipmentType(type.id, type);
        refreshData();
    }
    const handleDeleteType = async (id: string) => {
        await dataService.deleteEquipmentType(id);
        refreshData();
    }

    // Collaborators
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

    // Tickets
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
    
    // Chat
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
                notificationCount={0}
                onNotificationClick={() => {}}
            />
            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <OverviewDashboard 
                        equipment={equipment} instituicoes={instituicoes} entidades={entidades} assignments={assignments} 
                        equipmentTypes={equipmentTypes} tickets={tickets} collaborators={collaborators} teams={teams}
                        expiringWarranties={[]}
                        expiringLicenses={[]}
                        softwareLicenses={softwareLicenses} licenseAssignments={licenseAssignments}
                        onViewItem={handleViewItem} 
                    />
                )}
                {activeTab === 'equipment.inventory' && (
                    <div className="space-y-4">
                         <div className="flex justify-end gap-2">
                            <button onClick={() => openImportModal('equipment')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500">
                                <FaFileImport /> Importar Excel
                            </button>
                            <button onClick={() => setIsKitModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500">
                                <PlusIcon /> Criar Posto de Trabalho (Kit)
                            </button>
                             <button 
                                onClick={() => { setEditingEquipment(null); setIsAddEquipmentModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary"
                             >
                                 <PlusIcon /> Adicionar Equipamento
                             </button>
                         </div>
                        <EquipmentDashboard 
                             equipment={equipment} brands={brands} equipmentTypes={equipmentTypes} brandMap={brandMap} equipmentTypeMap={equipmentTypeMap}
                             assignedEquipmentIds={assignedEquipmentIds} assignments={assignments} collaborators={collaborators} entidades={entidades}
                             initialFilter={dashboardFilter} onClearInitialFilter={() => setDashboardFilter(null)} 
                             onShowHistory={(eq) => setShowHistoryEquipment(eq)}
                             onAssign={(eq) => { setAssignEquipmentItem(eq); setAssignModalOpen(true); }}
                             onUnassign={handleUnassignEquipment}
                             onUpdateStatus={handleUpdateEquipmentStatus}
                             onEdit={(eq) => { setEditingEquipment(eq); setIsAddEquipmentModalOpen(true); }}
                             onAssignMultiple={(list) => { setAssignMultipleList(list); setAssignMultipleModalOpen(true); }}
                             onManageKeys={handleManageKeys}
                             onGenerateReport={() => setReportType('equipment')}
                        />
                    </div>
                )}
                 {activeTab === 'collaborators' && (
                     <div className="space-y-4">
                         <div className="flex justify-end gap-2">
                             <button onClick={() => openImportModal('collaborators')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500">
                                <FaFileImport /> Importar Excel
                             </button>
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
                 {activeTab === 'organizacao.instituicoes' && (
                     <div className="space-y-4">
                        <div className="flex justify-end gap-2">
                             <button onClick={() => openImportModal('instituicoes')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500">
                                <FaFileImport /> Importar Excel
                             </button>
                             <button 
                                onClick={() => { setEditingInstituicao(null); setIsAddInstituicaoModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary"
                             >
                                 <PlusIcon /> Adicionar Instituição
                             </button>
                         </div>
                        <InstituicaoDashboard 
                            instituicoes={instituicoes} escolasDepartamentos={entidades} 
                            onEdit={(inst) => { setEditingInstituicao(inst); setIsAddInstituicaoModalOpen(true); }}
                            onDelete={handleDeleteInstituicao}
                        />
                     </div>
                 )}
                 {activeTab === 'organizacao.entidades' && (
                     <div className="space-y-4">
                         <div className="flex justify-end gap-2">
                             <button onClick={() => openImportModal('entidades')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500">
                                <FaFileImport /> Importar Excel
                             </button>
                             <button 
                                onClick={() => { setEditingEntidade(null); setIsAddEntidadeModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary"
                             >
                                 <PlusIcon /> Adicionar Entidade
                             </button>
                         </div>
                        <EntidadeDashboard 
                            escolasDepartamentos={entidades} instituicoes={instituicoes} collaborators={collaborators} 
                            onEdit={(ent) => { setEditingEntidade(ent); setIsAddEntidadeModalOpen(true); }}
                            onDelete={handleDeleteEntidade}
                            onToggleStatus={handleToggleEntidadeStatus}
                        />
                     </div>
                 )}
                 {activeTab === 'licensing' && (
                     <div className="space-y-4">
                         <div className="flex justify-end">
                             <button 
                                onClick={() => { setEditingLicense(null); setIsAddLicenseModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary"
                             >
                                 <PlusIcon /> Adicionar Licença
                             </button>
                         </div>
                        <LicenseDashboard 
                            licenses={softwareLicenses} licenseAssignments={licenseAssignments} equipmentData={equipment} 
                            assignments={assignments} collaborators={collaborators} brandMap={brandMap} equipmentTypeMap={equipmentTypeMap}
                            initialFilter={dashboardFilter} onClearInitialFilter={() => setDashboardFilter(null)}
                            onEdit={(lic) => { setEditingLicense(lic); setIsAddLicenseModalOpen(true); }}
                            onDelete={handleDeleteLicense}
                            onToggleStatus={handleToggleLicenseStatus}
                            onGenerateReport={() => setReportType('licensing')}
                        />
                    </div>
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
                     <div className="space-y-4">
                         <div className="flex justify-end">
                             <button 
                                onClick={() => { setEditingTeam(null); setIsAddTeamModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary"
                             >
                                 <PlusIcon /> Adicionar Equipa
                             </button>
                         </div>
                        <TeamDashboard 
                            teams={teams} teamMembers={teamMembers} collaborators={collaborators} tickets={tickets} 
                            onEdit={(t) => { setEditingTeam(t); setIsAddTeamModalOpen(true); }} 
                            onDelete={handleDeleteTeam} 
                            onManageMembers={(t) => setManageTeamMembersTeam(t)}
                        />
                     </div>
                 )}
                 {activeTab === 'equipment.brands' && (
                     <div className="space-y-4">
                         <div className="flex justify-end">
                             <button 
                                onClick={() => { setEditingBrand(null); setIsAddBrandModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary"
                             >
                                 <PlusIcon /> Adicionar Marca
                             </button>
                         </div>
                        <BrandDashboard 
                            brands={brands} equipment={equipment} 
                            onEdit={(b) => { setEditingBrand(b); setIsAddBrandModalOpen(true); }}
                            onDelete={handleDeleteBrand}
                        />
                     </div>
                 )}
                 {activeTab === 'equipment.types' && (
                     <div className="space-y-4">
                         <div className="flex justify-end">
                             <button 
                                onClick={() => { setEditingEquipmentType(null); setIsAddEquipmentTypeModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary"
                             >
                                 <PlusIcon /> Adicionar Tipo
                             </button>
                         </div>
                        <EquipmentTypeDashboard 
                            equipmentTypes={equipmentTypes} equipment={equipment} 
                            onEdit={(t) => { setEditingEquipmentType(t); setIsAddEquipmentTypeModalOpen(true); }}
                            onDelete={handleDeleteType}
                        />
                     </div>
                 )}
            </main>

            {/* Modals */}
            {importModalConfig && (
                <ImportModal
                    config={importModalConfig}
                    onClose={() => setImportModalConfig(null)}
                    onImport={handleImport}
                />
            )}

            {/* Equipment Modals */}
            {isAddEquipmentModalOpen && (
                <AddEquipmentModal
                    onClose={() => setIsAddEquipmentModalOpen(false)}
                    onSave={editingEquipment ? handleUpdateEquipment : handleCreateEquipment}
                    brands={brands}
                    equipmentTypes={equipmentTypes}
                    equipmentToEdit={editingEquipment}
                    onSaveBrand={async (b) => { await dataService.addBrand(b); const res = await dataService.fetchData<Brand>('brand'); setBrands(res); return res.find((x: any) => x.name === b.name)!; }}
                    onSaveEquipmentType={async (t) => { await dataService.addEquipmentType(t); const res = await dataService.fetchData<EquipmentType>('equipment_type'); setEquipmentTypes(res); return res.find((x: any) => x.name === t.name)!; }}
                    onOpenKitModal={(initialData) => { setIsAddEquipmentModalOpen(false); setKitModalInitialData(initialData); setIsKitModalOpen(true); }}
                />
            )}
            {isKitModalOpen && (
                <AddEquipmentKitModal
                    onClose={() => setIsKitModalOpen(false)}
                    onSaveKit={handleCreateKit}
                    brands={brands}
                    equipmentTypes={equipmentTypes}
                    initialData={kitModalInitialData}
                    onSaveEquipmentType={async (t) => { await dataService.addEquipmentType(t); const res = await dataService.fetchData<EquipmentType>('equipment_type'); setEquipmentTypes(res); return res.find((x: any) => x.name === t.name)!; }}
                    equipment={equipment}
                />
            )}
            {assignModalOpen && assignEquipmentItem && (
                <AssignEquipmentModal
                    equipment={assignEquipmentItem}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    escolasDepartamentos={entidades}
                    collaborators={collaborators}
                    onClose={() => setAssignModalOpen(false)}
                    onAssign={handleAssignEquipment}
                />
            )}
            {assignMultipleModalOpen && (
                <AssignMultipleEquipmentModal
                    equipmentList={assignMultipleList}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    escolasDepartamentos={entidades}
                    collaborators={collaborators}
                    onClose={() => setAssignMultipleModalOpen(false)}
                    onAssign={handleAssignMultiple}
                />
            )}
             {showHistoryEquipment && (
                <EquipmentHistoryModal
                    equipment={showHistoryEquipment}
                    assignments={assignments}
                    collaborators={collaborators}
                    escolasDepartamentos={entidades}
                    onClose={() => setShowHistoryEquipment(null)}
                    tickets={tickets}
                    ticketActivities={ticketActivities}
                />
            )}
            {manageLicensesEquipment && (
                <ManageAssignedLicensesModal
                    equipment={manageLicensesEquipment}
                    allLicenses={softwareLicenses}
                    allAssignments={licenseAssignments}
                    onClose={() => setManageLicensesEquipment(null)}
                    onSave={handleSaveAssignedLicenses}
                />
            )}
            
            {/* Organization Modals */}
            {isAddCollaboratorModalOpen && (
                <AddCollaboratorModal
                    onClose={() => setIsAddCollaboratorModalOpen(false)}
                    onSave={editingCollaborator ? handleUpdateCollaborator : handleCreateCollaborator}
                    collaboratorToEdit={editingCollaborator}
                    escolasDepartamentos={entidades}
                    currentUser={currentUser}
                />
            )}
            {isAddInstituicaoModalOpen && (
                <AddInstituicaoModal
                    onClose={() => setIsAddInstituicaoModalOpen(false)}
                    onSave={editingInstituicao ? handleUpdateInstituicao : handleCreateInstituicao}
                    instituicaoToEdit={editingInstituicao}
                />
            )}
            {isAddEntidadeModalOpen && (
                <AddEntidadeModal
                    onClose={() => setIsAddEntidadeModalOpen(false)}
                    onSave={editingEntidade ? handleUpdateEntidade : handleCreateEntidade}
                    entidadeToEdit={editingEntidade}
                    instituicoes={instituicoes}
                />
            )}
            {isAddTeamModalOpen && (
                <AddTeamModal
                    onClose={() => setIsAddTeamModalOpen(false)}
                    onSave={editingTeam ? handleUpdateTeam : handleCreateTeam}
                    teamToEdit={editingTeam}
                />
            )}
            {manageTeamMembersTeam && (
                <ManageTeamMembersModal
                    onClose={() => setManageTeamMembersTeam(null)}
                    onSave={handleSaveTeamMembers}
                    team={manageTeamMembersTeam}
                    allCollaborators={collaborators}
                    teamMembers={teamMembers}
                />
            )}

            {/* Types & Brands Modals */}
            {isAddBrandModalOpen && (
                <AddBrandModal
                    onClose={() => setIsAddBrandModalOpen(false)}
                    onSave={editingBrand ? handleUpdateBrand : handleCreateBrand}
                    brandToEdit={editingBrand}
                />
            )}
            {isAddEquipmentTypeModalOpen && (
                <AddEquipmentTypeModal
                    onClose={() => setIsAddEquipmentTypeModalOpen(false)}
                    onSave={editingEquipmentType ? handleUpdateType : handleCreateType}
                    typeToEdit={editingEquipmentType}
                    teams={teams}
                />
            )}

            {/* License Modals */}
            {isAddLicenseModalOpen && (
                <AddLicenseModal
                    onClose={() => setIsAddLicenseModalOpen(false)}
                    onSave={editingLicense ? handleUpdateLicense : handleCreateLicense}
                    licenseToEdit={editingLicense}
                />
            )}

            {/* Ticket Modals */}
            {isAddTicketModalOpen && (
                <AddTicketModal
                    onClose={() => setIsAddTicketModalOpen(false)}
                    onSave={editingTicket ? handleUpdateTicket : handleCreateTicket}
                    ticketToEdit={editingTicket}
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

            {/* Detail & History Modals */}
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
