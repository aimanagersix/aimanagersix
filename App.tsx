import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from './services/supabaseClient';
import { Equipment, Instituicao, Entidade, Collaborator, Assignment, EquipmentStatus, EquipmentType, Brand, Ticket, TicketStatus, EntidadeStatus, UserRole, CollaboratorHistory, TicketActivity, Message, SoftwareLicense, LicenseAssignment, CollaboratorStatus, LicenseStatus } from './types';
import * as dataService from './services/dataService';
import Header from './components/Header';
import EquipmentDashboard from './components/Dashboard';
import EntidadeDashboard from './components/EntidadeDashboard';
import InstituicaoDashboard from './components/InstituicaoDashboard';
import CollaboratorDashboard from './components/CollaboratorDashboard';
import EquipmentTypeDashboard from './components/EquipmentTypeDashboard';
import BrandDashboard from './components/BrandDashboard';
import OverviewDashboard from './components/OverviewDashboard';
import TicketDashboard from './components/TicketDashboard';
import LicenseDashboard from './components/LicenseDashboard';
import LoginPage from './components/LoginPage';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import { ChatWidget } from './components/ChatWidget';
import AddEquipmentModal from './components/AddEquipmentModal';
import AddEntidadeModal from './components/AddEntidadeModal';
import AddInstituicaoModal from './components/AddInstituicaoModal';
import AddCollaboratorModal from './components/AddCollaboratorModal';
import AddEquipmentTypeModal from './components/AddEquipmentTypeModal';
import AddBrandModal from './components/AddBrandModal';
import AddTicketModal from './components/AddTicketModal';
import AddLicenseModal from './components/AddLicenseModal';
import CloseTicketModal from './components/CloseTicketModal';
import TicketActivitiesModal from './components/TicketActivitiesModal';
import ImportModal, { ImportConfig } from './components/ImportModal';
import AddEquipmentKitModal from './components/AddEquipmentKitModal';
import InfoModal from './components/common/InfoModal';
import ManageAssignedLicensesModal from './components/ManageAssignedLicensesModal';
import NotificationsModal from './components/NotificationsModal';
import AssignEquipmentModal from './components/AssignEquipmentModal';
import AssignMultipleEquipmentModal from './components/AssignMultipleEquipmentModal';
import ReportModal from './components/ReportModal';
import ConfirmationModal from './components/common/ConfirmationModal';
import EquipmentHistoryModal from './components/EquipmentHistoryModal';
import CollaboratorHistoryModal from './components/CollaboratorHistoryModal';
import CollaboratorDetailModal from './components/CollaboratorDetailModal';
import ConfigurationSetup from './components/ConfigurationSetup';
import { PlusIcon, FaFileImport, SpinnerIcon } from './components/common/Icons';
import { Session } from '@supabase/supabase-js';


// Define an interface for tab configuration to ensure type safety.
interface TabConfigItem {
    title: string;
    component: React.ReactNode;
    buttonText?: string;
    onButtonClick?: () => void;
    onImportClick?: () => void;
    secondaryButtonText?: string;
    onSecondaryButtonClick?: () => void;
    onGenerateReport?: () => void;
}

const areKeysConfigured = () => {
    const supabaseUrl = process.env.SUPABASE_URL || sessionStorage.getItem('SUPABASE_URL');
    const supabaseKey = process.env.SUPABASE_ANON_KEY || sessionStorage.getItem('SUPABASE_ANON_KEY');
    const geminiKey = process.env.API_KEY || sessionStorage.getItem('API_KEY');
    // FIX: Coerce the result to a strict boolean to ensure correct type inference for the `isConfigured` state.
    return !!(supabaseUrl && supabaseKey && geminiKey);
};

export const App: React.FC = () => {
    const [isConfigured, setIsConfigured] = useState(areKeysConfigured());
    
    if (!isConfigured) {
        return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    }

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [sessionForPasswordReset, setSessionForPasswordReset] = useState<Session | null>(null);


    // Loading states
    const [isSessionLoading, setIsSessionLoading] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    
    // Data State - Initialized as empty arrays, will be populated from Supabase
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [entidades, setEntidades] = useState<Entidade[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [ticketActivities, setTicketActivities] = useState<TicketActivity[]>([]);
    const [collaboratorHistory, setCollaboratorHistory] = useState<CollaboratorHistory[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [softwareLicenses, setSoftwareLicenses] = useState<SoftwareLicense[]>([]);
    const [licenseAssignments, setLicenseAssignments] = useState<LicenseAssignment[]>([]);
    
    const clearAllData = () => {
        setEquipment([]);
        setInstituicoes([]);
        setEntidades([]);
        setCollaborators([]);
        setEquipmentTypes([]);
        setBrands([]);
        setAssignments([]);
        setTickets([]);
        setTicketActivities([]);
        setCollaboratorHistory([]);
        setMessages([]);
        setSoftwareLicenses([]);
        setLicenseAssignments([]);
        setCurrentUser(null);
        setInitialNotificationsShown(false);
        setSnoozedNotifications([]);
    };
    
    const handleLogout = useCallback(async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout error:", error);
        }
    }, []);

    const handleLogin = async (email: string, password: string): Promise<{ success: boolean, error?: string }> => {
        if (!supabase) return { success: false, error: 'Supabase not initialized' };
        
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.error("Login error:", error);
            if (error.message.includes('Invalid login credentials')) {
                return { success: false, error: "Credenciais de login inválidas." };
            }
            if (error.message.includes('Email not confirmed')) {
                return { success: false, error: "Email não confirmado. Por favor, verifique a sua caixa de entrada." };
            }
            return { success: false, error: "Ocorreu um erro ao fazer login." };
        }
        return { success: true };
    };

    // Stage 1: Check for an active session. This is quick and removes the initial spinner.
    useEffect(() => {
        if (!supabase) {
            setLoadingError("Falha na ligação com o Supabase. Verifique as chaves de configuração.");
            setIsSessionLoading(false);
            return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' && session) {
                setSessionForPasswordReset(session);
                setIsAuthenticated(false);
            } else if (event !== 'PASSWORD_RECOVERY') {
                setSessionForPasswordReset(null);
                setIsAuthenticated(!!session);
            }
            
            if (event === 'INITIAL_SESSION') {
                setIsSessionLoading(false);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Stage 2: If authenticated, load all necessary user and application data.
    useEffect(() => {
        if (!isAuthenticated) {
            clearAllData();
            return;
        }

        const loadAppData = async () => {
            if (!supabase) return;
            
            setIsDataLoading(true);
            setLoadingError(null);

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Sessão de utilizador inválida.");

                const allData = await dataService.fetchAllData();
                const userProfile = allData.collaborators.find(c => c.id === user.id);
                
                if (!userProfile) {
                    throw new Error("Perfil do utilizador não encontrado. A fazer logout.");
                }

                setEquipment(allData.equipment);
                setInstituicoes(allData.instituicoes);
                setEntidades(allData.entidades);
                setCollaborators(allData.collaborators);
                setEquipmentTypes(allData.equipmentTypes);
                setBrands(allData.brands);
                setAssignments(allData.assignments);
                setTickets(allData.tickets);
                setTicketActivities(allData.ticketActivities);
                setCollaboratorHistory(allData.collaboratorHistory);
                setMessages(allData.messages);
                setSoftwareLicenses(allData.softwareLicenses);
                setLicenseAssignments(allData.licenseAssignments);
                
                setCurrentUser(userProfile);

            } catch (error: any) {
                console.error("Failed to load application data:", error);
                setLoadingError(error.message || "Não foi possível carregar os dados. A sessão será terminada.");
                setTimeout(() => {
                    handleLogout();
                }, 3000);
            } finally {
                setIsDataLoading(false);
            }
        };

        loadAppData();
    }, [isAuthenticated, handleLogout]);

    // UI State
    const [activeTab, setActiveTab] = useState('overview');
    const [modal, setModal] = useState<{ type: string | null; data?: any }>({ type: null });
    const [confirmation, setConfirmation] = useState<{ message: string; onConfirm: () => void; } | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState<{ type: 'equipment' | 'collaborator' | 'ticket' | 'licensing' | null }>({ type: null });
    const [initialDashboardFilter, setInitialDashboardFilter] = useState<any>(null);
    const [isTicketActivitiesModalOpen, setIsTicketActivitiesModalOpen] = useState(false);
    const [selectedTicketForActivities, setSelectedTicketForActivities] = useState<Ticket | null>(null);
    const [infoModal, setInfoModal] = useState<{ title: string; content: React.ReactNode; } | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeChatCollaboratorId, setActiveChatCollaboratorId] = useState<string | null>(null);
    const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
    const [snoozedNotifications, setSnoozedNotifications] = useState<string[]>(() => {
        const saved = localStorage.getItem('snoozedNotifications');
        return saved ? JSON.parse(saved) : [];
    });
    const [initialNotificationsShown, setInitialNotificationsShown] = useState(false);
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);


    const userPermissions = useMemo(() => {
        if (!currentUser) return { canEdit: false, viewScope: 'none' };
        
        switch (currentUser.role) {
            case UserRole.Admin:
                return { canEdit: true, viewScope: 'all' };
            case UserRole.Normal:
                return { canEdit: true, viewScope: 'all' };
            case UserRole.Basic:
                return { canEdit: false, viewScope: 'all' };
             case UserRole.Utilizador:
                return { canEdit: false, viewScope: 'own' };
            default:
                return { canEdit: false, viewScope: 'none' };
        }
    }, [currentUser]);

    // --- Data Handling Callbacks ---
    
    // Generic Save Handler
    const handleSave = useCallback(async <T extends { id: string }>(
        type: 'equipment' | 'instituicao' | 'entidade' | 'equipment_type' | 'brand' | 'ticket' | 'software_license' | 'ticket_activity' | 'message',
        data: Partial<T>,
        addFn: (record: any) => Promise<any>,
        updateFn: (id: string, updates: Partial<T>) => Promise<any>,
        setData: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
        try {
            let recordToSave = { ...data };
            // Remove id from payload if it exists to avoid sending it on updates where it's not needed in the body
            if ('id' in recordToSave && recordToSave.id) {
                delete (recordToSave as any).id;
            }

            if ('id' in data && data.id) { // Editing existing record
                const updatesPayload = { ...recordToSave };
                 if (type === 'equipment') {
                    delete (updatesPayload as Partial<Equipment>).creationDate;
                    (updatesPayload as Partial<Equipment>).modifiedDate = new Date().toISOString();
                }

                const updatedRecord = await updateFn(data.id, updatesPayload);
                setData(prev => prev.map(item => item.id === data.id ? updatedRecord : item));
                return updatedRecord;

            } else { // Adding new record
                 let recordWithDefaults: any = { ...data };
                 
                 if (type === 'equipment') {
                     const now = new Date().toISOString();
                     recordWithDefaults = {
                         ...recordWithDefaults,
                         creationDate: now,
                         modifiedDate: now,
                         status: EquipmentStatus.Stock,
                         id: crypto.randomUUID(),
                     };
                 } else if (type === 'ticket') {
                      recordWithDefaults = {
                         ...recordWithDefaults,
                         requestDate: new Date().toISOString().split('T')[0],
                         status: TicketStatus.Requested,
                         id: crypto.randomUUID(),
                      };
                 } else if (type !== 'message') {
                     recordWithDefaults.id = crypto.randomUUID();
                 }
                
                const newRecord = await addFn(recordWithDefaults);
                setData(prev => [...prev, newRecord]);
                return newRecord;
            }
        } catch (error: any) {
            console.error(`Failed to save ${type}:`, error);
            let userMessage = `Ocorreu um erro ao salvar os dados de ${type}. Por favor, tente novamente.`;
            if (error && error.message) {
                if (error.message.includes('violates foreign key constraint')) {
                    userMessage = `Não foi possível salvar. Verifique se todos os itens associados (como Marcas, Tipos ou Entidades) ainda existem.`;
                } else if (error.message.includes('violates unique constraint')) {
                    userMessage = `Não foi possível salvar. Já existe um registo com um destes valores que deve ser único (ex: Número de Série ou Nº Mecanográfico).`;
                } else if (error.message.includes('violates not-null constraint')) {
                    userMessage = `Não foi possível salvar. Um campo obrigatório não foi preenchido. Por favor, verifique o formulário.`;
                } else {
                    userMessage = `Ocorreu um erro ao salvar: ${error.message}`;
                }
            }
            alert(userMessage);
        }
    }, []);
    
     const handleSaveCollaborator = useCallback(async (collaboratorData: Collaborator, password?: string) => {
        if (!supabase) return;
        
        try {
            // Editing existing collaborator
            if (collaboratorData.id) {
                const { id, ...updates } = collaboratorData;
                delete (updates as Partial<Collaborator>).password; // Ensure password is not updated
                const updatedCollaborator = await dataService.updateCollaborator(id, updates);
                // FIX: Merge the updated data with existing data to ensure the `id` is preserved in the object's type, resolving a potential type mismatch.
                setCollaborators(prev => prev.map(c => c.id === id ? { ...c, ...updatedCollaborator } : c));
            } 
            // Creating new collaborator
            else {
                if (collaboratorData.canLogin) {
                    if (!password) {
                        alert("É necessária uma password temporária para criar um utilizador com acesso.");
                        return;
                    }
                    // 1. Create user in Supabase Auth
                    const { data: authData, error: authError } = await supabase.auth.signUp({
                        email: collaboratorData.email,
                        password: password,
                    });
                    if (authError) throw authError;
                    if (!authData.user) throw new Error("A criação do utilizador no Supabase não retornou um utilizador.");
                    
                    // 2. Create collaborator profile in public table with the same ID
                    const newCollaborator = {
                        ...collaboratorData,
                        id: authData.user.id,
                        password: password, // Pass password to satisfy DB constraint
                    };
                    const addedCollaborator = await dataService.addCollaborator(newCollaborator);
                    setCollaborators(prev => [...prev, addedCollaborator]);
                    setInfoModal({
                        title: "Utilizador Criado com Sucesso",
                        content: (
                            <p>O colaborador <strong>{addedCollaborator.fullName}</strong> foi criado. Um email de confirmação foi enviado para <strong>{addedCollaborator.email}</strong>. O colaborador deve clicar no link do email para ativar a sua conta antes de poder fazer login.</p>
                        )
                    });

                } else {
                    // Create collaborator without auth user
                    const newCollaborator = {
                        ...collaboratorData,
                        id: crypto.randomUUID(),
                        password: crypto.randomUUID(), // Use a random string as placeholder to satisfy NOT NULL constraint
                    };
                    const addedCollaborator = await dataService.addCollaborator(newCollaborator);
                    setCollaborators(prev => [...prev, addedCollaborator]);
                }
            }
        } catch (error: any) {
            console.error("Failed to save collaborator:", error);
            alert(`Ocorreu um erro ao salvar o colaborador: ${error.message}`);
        }
    }, [supabase]);


    // Generic Delete Handler
    const handleDelete = useCallback(async <T extends { id: string }>(
        type: 'equipment' | 'instituicao' | 'entidade' | 'collaborator' | 'equipment_type' | 'brand' | 'software_license',
        id: string,
        deleteFn: (id: string) => Promise<void>,
        setData: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
        try {
            await deleteFn(id);
            setData(prev => prev.filter(item => item.id !== id));
            setConfirmation(null); // Close confirmation modal on success
        } catch (error) {
            console.error(`Failed to delete ${type}:`, error);
             alert(`Ocorreu um erro ao excluir os dados de ${type}. Verifique se não há outros registos associados.`);
        }
    }, []);
    
    const handleAssignEquipment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'returnDate'>) => {
        const newAssignment = {
            ...assignmentData,
            id: crypto.randomUUID(),
        };
        try {
            const addedAssignment = await dataService.addAssignment(newAssignment);
            setAssignments(prev => [...prev, addedAssignment]);
            
            // Also update the equipment status to Operational
            await handleUpdateEquipmentStatus(assignmentData.equipmentId, EquipmentStatus.Operational);
            
            setModal({ type: null }); // Close assignment modal
        } catch (error) {
            console.error("Failed to assign equipment:", error);
            alert("Ocorreu um erro ao atribuir o equipamento.");
        }
    }, []);
    
    const handleAssignMultipleEquipment = useCallback(async (assignmentData: {entidadeId: string, collaboratorId?: string, assignedDate: string}) => {
        if (!modal.data || !Array.isArray(modal.data)) return;
        
        const newAssignments = modal.data.map((equipment: Equipment) => ({
            ...assignmentData,
            id: crypto.randomUUID(),
            equipmentId: equipment.id,
        }));

        try {
            const { data: addedAssignments, error } = await dataService.addMultipleAssignments(newAssignments);
            if (error) throw error;
            
            setAssignments(prev => [...prev, ...addedAssignments]);
            
            // Update statuses of all assigned equipment
            const updatePromises = modal.data.map((equipment: Equipment) =>
                dataService.updateEquipment(equipment.id, { status: EquipmentStatus.Operational, modifiedDate: new Date().toISOString() })
            );
            const updatedEquips = await Promise.all(updatePromises);

            setEquipment(prev => prev.map(eq => {
                const updated = updatedEquips.find(ue => ue.id === eq.id);
                return updated ? updated : eq;
            }));

            setModal({ type: null });
        } catch (error) {
            console.error("Failed to assign multiple equipments:", error);
            alert("Ocorreu um erro ao atribuir os equipamentos.");
        }

    }, [modal.data]);

    const handleUnassignEquipment = useCallback(async (equipmentId: string) => {
        const assignmentToEnd = assignments.find(a => a.equipmentId === equipmentId && !a.returnDate);
        if (!assignmentToEnd) {
            alert("Não foi possível encontrar uma atribuição ativa para este equipamento.");
            return;
        }

        try {
            const updatedAssignment = await dataService.updateAssignment(assignmentToEnd.id, { returnDate: new Date().toISOString().split('T')[0] });
            setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
            
            // Also update the equipment status back to Stock
            await handleUpdateEquipmentStatus(equipmentId, EquipmentStatus.Stock);

        } catch (error) {
            console.error("Failed to unassign equipment:", error);
            alert("Ocorreu um erro ao desassociar o equipamento.");
        }
    }, [assignments]);
    
    const handleUpdateEquipmentStatus = useCallback(async (id: string, status: EquipmentStatus) => {
        try {
            const updatedEquipment = await dataService.updateEquipment(id, { status, modifiedDate: new Date().toISOString() });
            setEquipment(prev => prev.map(e => e.id === id ? updatedEquipment : e));
        } catch (error) {
            console.error("Failed to update equipment status:", error);
            alert("Ocorreu um erro ao atualizar o estado do equipamento.");
        }
    }, []);
    
    const handleOpenChat = useCallback((collaborator: Collaborator) => {
        setActiveChatCollaboratorId(collaborator.id);
        setIsChatOpen(true);
    }, []);

    const handleSendMessage = useCallback(async (receiverId: string, content: string) => {
        if (!currentUser) return;
        
        const newMessage: Omit<Message, 'id'> = {
            senderId: currentUser.id,
            receiverId,
            content,
            timestamp: new Date().toISOString(),
            read: false,
        };
        
        await handleSave('message', newMessage, dataService.addMessage, dataService.updateMessage, setMessages);

    }, [currentUser, handleSave]);
    
    const handleMarkMessagesAsRead = useCallback(async (senderId: string) => {
        if (!currentUser) return;
        try {
            await dataService.markMessagesAsRead(senderId, currentUser.id);
            setMessages(prev => prev.map(msg => 
                (msg.senderId === senderId && msg.receiverId === currentUser.id && !msg.read) 
                ? { ...msg, read: true } 
                : msg
            ));
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    }, [currentUser]);
    
    const handleSaveLicenseAssignments = useCallback(async (equipmentId: string, assignedLicenseIds: string[]) => {
        try {
            const currentAssignments = licenseAssignments.filter(a => a.equipmentId === equipmentId);
            const currentAssignmentIds = new Set(currentAssignments.map(a => a.softwareLicenseId));
            const newAssignmentIds = new Set(assignedLicenseIds);

            const idsToAdd = assignedLicenseIds.filter(id => !currentAssignmentIds.has(id));
            const idsToRemove = Array.from(currentAssignmentIds).filter(id => !newAssignmentIds.has(id));
            
            const assignmentsToRemove = currentAssignments.filter(a => idsToRemove.includes(a.softwareLicenseId));
            const assignmentsToAdd: Omit<LicenseAssignment, 'id'>[] = idsToAdd.map(licenseId => ({
                softwareLicenseId: licenseId,
                equipmentId: equipmentId,
                assignedDate: new Date().toISOString().split('T')[0],
            }));
            
            // Perform deletions
            for (const assignment of assignmentsToRemove) {
                await dataService.deleteData('license_assignment', assignment.id);
            }

            // Perform additions
            if (assignmentsToAdd.length > 0) {
                const { data: addedAssignments, error } = await dataService.addMultipleLicenseAssignments(assignmentsToAdd);
                if (error) throw error;
                
                // Atomically update state
                setLicenseAssignments(prev => [
                    ...prev.filter(a => !assignmentsToRemove.some(r => r.id === a.id)), // remove deleted ones
                    ...addedAssignments, // add new ones
                ]);

            } else if (assignmentsToRemove.length > 0) {
                // If only deletions happened
                setLicenseAssignments(prev => prev.filter(a => !assignmentsToRemove.some(r => r.id === a.id)));
            }
            
            setModal({ type: null }); // Close modal
        } catch (error) {
            console.error("Failed to update license assignments:", error);
            alert("Ocorreu um erro ao atualizar as licenças atribuídas.");
        }
    }, [licenseAssignments]);
    
    const handleToggleLicenseStatus = useCallback(async (id: string) => {
        const license = softwareLicenses.find(l => l.id === id);
        if (!license) return;

        const newStatus = (license.status || LicenseStatus.Ativo) === LicenseStatus.Ativo ? LicenseStatus.Inativo : LicenseStatus.Ativo;
        
        try {
            const updatedLicense = await dataService.updateSoftwareLicense(id, { status: newStatus });
            setSoftwareLicenses(prev => prev.map(l => l.id === id ? updatedLicense : l));
        } catch (error) {
            console.error("Failed to toggle license status:", error);
            alert("Ocorreu um erro ao alterar o estado da licença.");
        }
    }, [softwareLicenses]);

    const handleToggleEntidadeStatus = useCallback(async (id: string) => {
        const entidade = entidades.find(e => e.id === id);
        if (!entidade) return;

        const newStatus = entidade.status === EntidadeStatus.Ativo ? EntidadeStatus.Inativo : EntidadeStatus.Ativo;
        
        try {
            const updatedEntidade = await dataService.updateEntidade(id, { status: newStatus });
            setEntidades(prev => prev.map(e => e.id === id ? updatedEntidade : e));
        } catch (error) {
            console.error("Failed to toggle entidade status:", error);
            alert("Ocorreu um erro ao alterar o estado da entidade.");
        }
    }, [entidades]);

    const handleToggleCollaboratorStatus = useCallback(async (id: string) => {
        const collaborator = collaborators.find(c => c.id === id);
        if (!collaborator) return;

        const newStatus = collaborator.status === CollaboratorStatus.Ativo ? CollaboratorStatus.Inativo : CollaboratorStatus.Ativo;
        
        try {
            const updatedCollaborator = await dataService.updateCollaborator(id, { status: newStatus });
            setCollaborators(prev => prev.map(c => c.id === id ? { ...c, ...updatedCollaborator } : c));
        } catch (error) {
            console.error("Failed to toggle collaborator status:", error);
            alert("Ocorreu um erro ao alterar o estado do colaborador.");
        }
    }, [collaborators]);

    const handleSnoozeNotification = (id: string) => {
        setSnoozedNotifications(prev => {
            const newSnoozed = [...prev, id];
            localStorage.setItem('snoozedNotifications', JSON.stringify(newSnoozed));
            return newSnoozed;
        });
    };

    const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const equipmentTypeMap = useMemo(() => new Map(equipmentTypes.map(et => [et.id, et.name])), [equipmentTypes]);
    const assignedEquipmentIds = useMemo(() => new Set(assignments.filter(a => !a.returnDate).map(a => a.equipmentId)), [assignments]);
    const unreadMessagesCount = useMemo(() => {
        if (!currentUser) return 0;
        return messages.filter(msg => msg.receiverId === currentUser.id && !msg.read).length;
    }, [messages, currentUser]);

    const expiringWarranties = useMemo(() => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        return equipment.filter(e => {
            if (snoozedNotifications.includes(e.id)) return false;
            if (!e.warrantyEndDate) return false;
            const endDate = new Date(e.warrantyEndDate);
            return endDate <= thirtyDaysFromNow;
        });
    }, [equipment, snoozedNotifications]);

    const expiringLicenses = useMemo(() => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        return softwareLicenses.filter(l => {
            if (snoozedNotifications.includes(l.id)) return false;
            if (!l.expiryDate) return false;
            const endDate = new Date(l.expiryDate);
            return endDate <= thirtyDaysFromNow;
        });
    }, [softwareLicenses, snoozedNotifications]);

    useEffect(() => {
        if (currentUser && !initialNotificationsShown && (expiringWarranties.length > 0 || expiringLicenses.length > 0)) {
            setIsNotificationsModalOpen(true);
            setInitialNotificationsShown(true);
        }
    }, [currentUser, expiringWarranties, expiringLicenses, initialNotificationsShown]);

    const tabConfig: Record<string, TabConfigItem> = {
        'overview': {
            title: 'Visão Geral',
            component: <OverviewDashboard 
                equipment={equipment}
                instituicoes={instituicoes}
                entidades={entidades}
                assignments={assignments}
                equipmentTypes={equipmentTypes}
                tickets={tickets}
                onViewItem={(tab, filter) => {
                    setActiveTab(tab);
                    setInitialDashboardFilter(filter);
                }}
            />,
        },
        'equipment.inventory': {
            title: 'Equipamentos',
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
                initialFilter={initialDashboardFilter}
                onClearInitialFilter={() => setInitialDashboardFilter(null)}
                onAssign={(eq) => setModal({ type: 'assign_equipment', data: eq })}
                onAssignMultiple={(eqs) => setModal({ type: 'assign_multiple_equipment', data: eqs })}
                onUnassign={(id) => setConfirmation({ message: 'Tem a certeza que quer desassociar este equipamento?', onConfirm: () => handleUnassignEquipment(id) })}
                onUpdateStatus={handleUpdateEquipmentStatus}
                onShowHistory={(eq) => setModal({ type: 'equipment_history', data: eq })}
                onEdit={(eq) => setModal({ type: 'add_equipment', data: eq })}
                onManageKeys={(eq) => setModal({ type: 'manage_licenses', data: eq })}
                onGenerateReport={() => setIsReportModalOpen({ type: 'equipment' })}
            />,
            buttonText: 'Adicionar Equipamento',
            onButtonClick: () => setModal({ type: 'add_equipment' }),
            secondaryButtonText: 'Adicionar Posto de Trabalho',
            onSecondaryButtonClick: () => setModal({ type: 'add_kit' }),
            onGenerateReport: () => setIsReportModalOpen({ type: 'equipment' }),
        },
        'equipment.brands': {
            title: 'Marcas',
            component: <BrandDashboard 
                brands={brands} 
                equipment={equipment}
                onEdit={(brand) => setModal({ type: 'add_brand', data: brand })}
                onDelete={(id) => setConfirmation({ message: 'Tem a certeza que quer excluir esta marca?', onConfirm: () => handleDelete('brand', id, dataService.deleteBrand, setBrands) })}
            />,
            buttonText: 'Adicionar Marca',
            onButtonClick: () => setModal({ type: 'add_brand' }),
        },
        'equipment.types': {
            title: 'Tipos de Equipamento',
            component: <EquipmentTypeDashboard 
                equipmentTypes={equipmentTypes}
                equipment={equipment}
                onEdit={(type) => setModal({ type: 'add_equipment_type', data: type })}
                onDelete={(id) => setConfirmation({ message: 'Tem a certeza que quer excluir este tipo?', onConfirm: () => handleDelete('equipment_type', id, dataService.deleteEquipmentType, setEquipmentTypes) })}
            />,
            buttonText: 'Adicionar Tipo',
            onButtonClick: () => setModal({ type: 'add_equipment_type' }),
        },
        'organizacao.instituicoes': {
            title: 'Instituições',
            component: <InstituicaoDashboard 
                instituicoes={instituicoes}
                escolasDepartamentos={entidades}
                onEdit={(inst) => setModal({ type: 'add_instituicao', data: inst })}
                onDelete={(id) => {
                    const isReferenced = entidades.some(e => e.instituicaoId === id);
                    if (isReferenced) {
                        setInfoModal({
                            title: "Ação Bloqueada",
                            content: <p>Não é possível excluir esta instituição porque existem entidades associadas a ela. Por favor, remova ou reatribua as entidades primeiro.</p>
                        });
                    } else {
                        setConfirmation({ 
                            message: 'Tem a certeza que quer excluir esta instituição?', 
                            onConfirm: () => handleDelete('instituicao', id, dataService.deleteInstituicao, setInstituicoes) 
                        });
                    }
                }}
            />,
            buttonText: 'Adicionar Instituição',
            onButtonClick: () => setModal({ type: 'add_instituicao' }),
            onImportClick: () => setModal({ type: 'import', data: { dataType: 'instituicoes', title: 'Importar Instituições', columnMap: { codigo: 'Código', name: 'Nome', email: 'Email', telefone: 'Telefone'}, templateFileName: 'template_instituicoes.xlsx' } as ImportConfig }),
        },
        'organizacao.entidades': {
            title: 'Entidades',
            component: <EntidadeDashboard 
                escolasDepartamentos={entidades}
                instituicoes={instituicoes}
                collaborators={collaborators}
                onEdit={(ent) => setModal({ type: 'add_entidade', data: ent })}
                onDelete={(id) => {
                    const hasCollaborators = collaborators.some(c => c.entidadeId === id);
                    const hasAssignments = assignments.some(a => a.entidadeId === id);
                    const hasTickets = tickets.some(t => t.entidadeId === id);
                    if (hasCollaborators || hasAssignments || hasTickets) {
                        const reasons = [];
                        if (hasCollaborators) reasons.push("Colaboradores");
                        if (hasAssignments) reasons.push("Atribuições de equipamento");
                        if (hasTickets) reasons.push("Tickets de suporte");

                        setInfoModal({
                            title: "Ação Bloqueada",
                            content: (
                                <div>
                                    <p className="mb-2">Não é possível excluir esta entidade porque existem os seguintes registos associados a ela:</p>
                                    <ul className="list-disc list-inside text-on-surface-dark-secondary">
                                        {reasons.map(reason => <li key={reason}>{reason}</li>)}
                                    </ul>
                                    <p className="mt-3">Por favor, remova ou reatribua estes registos primeiro.</p>
                                </div>
                            )
                        });
                    } else {
                        setConfirmation({ 
                            message: 'Tem a certeza que quer excluir esta entidade?', 
                            onConfirm: () => handleDelete('entidade', id, dataService.deleteEntidade, setEntidades) 
                        });
                    }
                }}
                onToggleStatus={handleToggleEntidadeStatus}
            />,
            buttonText: 'Adicionar Entidade',
            onButtonClick: () => setModal({ type: 'add_entidade' }),
            onImportClick: () => setModal({ type: 'import', data: { dataType: 'entidades', title: 'Importar Entidades', columnMap: { instituicaoCodigo: 'Código Instituição', codigo: 'Código', name: 'Nome', description: 'Descrição', email: 'Email', responsavel: 'Responsável', telefone: 'Telefone', telemovel: 'Telemóvel', telefoneInterno: 'Telefone Interno', status: 'Status' }, templateFileName: 'template_entidades.xlsx' } as ImportConfig }),
        },
        'collaborators': {
            title: 'Colaboradores',
            component: <CollaboratorDashboard 
                collaborators={collaborators}
                escolasDepartamentos={entidades}
                equipment={equipment}
                assignments={assignments}
                currentUser={currentUser}
                onEdit={(col) => setModal({ type: 'add_collaborator', data: col })}
                onDelete={(id) => setConfirmation({ message: 'Tem a certeza que quer excluir este colaborador?', onConfirm: () => handleDelete('collaborator', id, dataService.deleteCollaborator, setCollaborators) })}
                onShowHistory={(col) => setModal({ type: 'collaborator_history', data: col })}
                onShowDetails={(col) => setModal({ type: 'collaborator_detail', data: col })}
                onStartChat={handleOpenChat}
                onGenerateReport={() => setIsReportModalOpen({ type: 'collaborator' })}
                onToggleStatus={handleToggleCollaboratorStatus}
            />,
            buttonText: 'Adicionar Colaborador',
            onButtonClick: () => setModal({ type: 'add_collaborator' }),
            onImportClick: () => setModal({ type: 'import', data: { dataType: 'collaborators', title: 'Importar Colaboradores', columnMap: { numeroMecanografico: 'Nº Mecanográfico', fullName: 'Nome Completo', entidadeCodigo: 'Código Entidade', email: 'Email', telefoneInterno: 'Telefone Interno', telemovel: 'Telemóvel', canLogin: 'Pode Fazer Login (TRUE/FALSE)', receivesNotifications: 'Recebe Notificações (TRUE/FALSE)', role: 'Perfil (Admin/Normal/Basic/Utilizador)', status: 'Status (Ativo/Inativo)', password: 'Password Temporária (para novos com login)' }, templateFileName: 'template_colaboradores.xlsx' } as ImportConfig }),
        },
        'licensing': {
            title: 'Licenciamento',
            component: <LicenseDashboard 
                licenses={softwareLicenses}
                licenseAssignments={licenseAssignments}
                onEdit={(lic) => setModal({ type: 'add_license', data: lic })}
                onDelete={(id) => setConfirmation({ message: 'Tem a certeza que quer excluir esta licença?', onConfirm: () => handleDelete('software_license', id, dataService.deleteSoftwareLicense, setSoftwareLicenses) })}
                onGenerateReport={() => setIsReportModalOpen({ type: 'licensing' })}
                onToggleStatus={handleToggleLicenseStatus}
            />,
            buttonText: 'Adicionar Licença',
            onButtonClick: () => setModal({ type: 'add_license' }),
        },
        'tickets': {
            title: 'Tickets de Suporte',
            component: <TicketDashboard 
                tickets={tickets}
                escolasDepartamentos={entidades}
                collaborators={collaborators}
                initialFilter={initialDashboardFilter}
                onClearInitialFilter={() => setInitialDashboardFilter(null)}
                onEdit={(ticket) => setModal({ type: 'add_ticket', data: ticket })}
                onOpenCloseTicketModal={(ticket) => setModal({ type: 'close_ticket', data: ticket })}
                onOpenActivities={(ticket) => { setSelectedTicketForActivities(ticket); setIsTicketActivitiesModalOpen(true); }}
            />,
            buttonText: 'Novo Ticket',
            onButtonClick: () => setModal({ type: 'add_ticket' }),
        },
    };
    
    if (isSessionLoading || isDataLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background-dark text-white">
                <SpinnerIcon className="animate-spin h-10 w-10 mr-4" />
                <span>{isSessionLoading ? "A verificar sessão..." : "A carregar dados..."}</span>
            </div>
        );
    }
    
    if (loadingError) {
        return (
            <div className="flex items-center justify-center h-screen bg-background-dark text-red-400">
                <p>{loadingError}</p>
            </div>
        );
    }

    if (sessionForPasswordReset) {
        return <ResetPasswordModal session={sessionForPasswordReset} onClose={() => setSessionForPasswordReset(null)} />;
    }

    if (!isAuthenticated) {
        return (
            <>
                <LoginPage 
                    onLogin={handleLogin} 
                    onForgotPassword={() => setIsForgotPasswordModalOpen(true)}
                />
                {isForgotPasswordModalOpen && <ForgotPasswordModal onClose={() => setIsForgotPasswordModalOpen(false)} />}
            </>
        );
    }
    
    const activeTabConfig = tabConfig[activeTab];

    return (
        <div className="min-h-screen bg-background-dark text-on-surface-dark">
            <Header
                currentUser={currentUser}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
                tabConfig={tabConfig}
                notificationCount={expiringWarranties.length + expiringLicenses.length + unreadMessagesCount}
                onNotificationClick={() => setIsNotificationsModalOpen(true)}
            />
            <main className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h1 className="text-3xl font-bold text-white">{activeTabConfig?.title}</h1>
                    <div className="flex gap-4">
                        {activeTabConfig?.onImportClick && (
                            <button
                                onClick={activeTabConfig.onImportClick}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                            >
                                <FaFileImport />
                                Importar
                            </button>
                        )}
                        {activeTabConfig?.onSecondaryButtonClick && (
                            <button
                                onClick={activeTabConfig.onSecondaryButtonClick}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors"
                            >
                                {activeTabConfig.secondaryButtonText}
                            </button>
                        )}
                        {activeTabConfig?.onButtonClick && (
                            <button
                                onClick={activeTabConfig.onButtonClick}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors"
                            >
                                <PlusIcon />
                                {activeTabConfig.buttonText}
                            </button>
                        )}
                    </div>
                </div>

                {activeTabConfig?.component}
            </main>
            {currentUser && (
                <ChatWidget
                    currentUser={currentUser}
                    collaborators={collaborators}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onMarkMessagesAsRead={handleMarkMessagesAsRead}
                    isOpen={isChatOpen}
                    onToggle={() => setIsChatOpen(!isChatOpen)}
                    activeChatCollaboratorId={activeChatCollaboratorId}
                    onSelectConversation={(id) => setActiveChatCollaboratorId(id)}
                    unreadMessagesCount={unreadMessagesCount}
                />
            )}
            
            {/* Modals */}
            {modal.type === 'add_equipment' && <AddEquipmentModal onClose={() => setModal({ type: null })} onSave={(eq) => handleSave('equipment', eq, dataService.addEquipment, dataService.updateEquipment, setEquipment)} brands={brands} equipmentTypes={equipmentTypes} equipmentToEdit={modal.data} onSaveBrand={(brand) => handleSave('brand', brand, dataService.addBrand, dataService.updateBrand, setBrands)} onSaveEquipmentType={(type) => handleSave('equipment_type', type, dataService.addEquipmentType, dataService.updateEquipmentType, setEquipmentTypes)} onOpenKitModal={(data) => setModal({ type: 'add_kit', data })} />}
            {modal.type === 'add_entidade' && <AddEntidadeModal onClose={() => setModal({ type: null })} onSave={(ent) => handleSave('entidade', ent, dataService.addEntidade, dataService.updateEntidade, setEntidades)} entidadeToEdit={modal.data} instituicoes={instituicoes} />}
            {modal.type === 'add_instituicao' && <AddInstituicaoModal onClose={() => setModal({ type: null })} onSave={(inst) => handleSave('instituicao', inst, dataService.addInstituicao, dataService.updateInstituicao, setInstituicoes)} instituicaoToEdit={modal.data} />}
            {modal.type === 'add_collaborator' && <AddCollaboratorModal onClose={() => setModal({ type: null })} onSave={handleSaveCollaborator} escolasDepartamentos={entidades} collaboratorToEdit={modal.data} currentUser={currentUser} />}
            {modal.type === 'add_equipment_type' && <AddEquipmentTypeModal onClose={() => setModal({ type: null })} onSave={(type) => handleSave('equipment_type', type, dataService.addEquipmentType, dataService.updateEquipmentType, setEquipmentTypes)} typeToEdit={modal.data} />}
            {modal.type === 'add_brand' && <AddBrandModal onClose={() => setModal({ type: null })} onSave={(brand) => handleSave('brand', brand, dataService.addBrand, dataService.updateBrand, setBrands)} brandToEdit={modal.data} />}
            {modal.type === 'add_ticket' && <AddTicketModal onClose={() => setModal({ type: null })} onSave={(ticket) => handleSave('ticket', ticket, dataService.addTicket, dataService.updateTicket, setTickets)} ticketToEdit={modal.data} escolasDepartamentos={entidades} collaborators={collaborators} currentUser={currentUser} userPermissions={userPermissions} />}
            {modal.type === 'add_license' && <AddLicenseModal onClose={() => setModal({ type: null })} onSave={(lic) => handleSave('software_license', lic, dataService.addSoftwareLicense, dataService.updateSoftwareLicense, setSoftwareLicenses)} licenseToEdit={modal.data} />}
            {modal.type === 'close_ticket' && <CloseTicketModal ticket={modal.data} collaborators={collaborators} onClose={() => setModal({ type: null })} onConfirm={(technicianId) => { const updatedTicket = { ...modal.data, status: TicketStatus.Finished, finishDate: new Date().toISOString().split('T')[0], technicianId }; handleSave('ticket', updatedTicket, dataService.addTicket, dataService.updateTicket, setTickets); setModal({ type: null }); }} />}
            {modal.type === 'assign_equipment' && <AssignEquipmentModal equipment={modal.data} brandMap={brandMap} equipmentTypeMap={equipmentTypeMap} escolasDepartamentos={entidades} collaborators={collaborators} onClose={() => setModal({ type: null })} onAssign={handleAssignEquipment} />}
            {modal.type === 'assign_multiple_equipment' && <AssignMultipleEquipmentModal equipmentList={modal.data} brandMap={brandMap} equipmentTypeMap={equipmentTypeMap} escolasDepartamentos={entidades} collaborators={collaborators} onClose={() => setModal({ type: null })} onAssign={handleAssignMultipleEquipment} />}
            {modal.type === 'equipment_history' && <EquipmentHistoryModal equipment={modal.data} assignments={assignments} collaborators={collaborators} escolasDepartamentos={entidades} onClose={() => setModal({ type: null })} />}
            {modal.type === 'collaborator_history' && <CollaboratorHistoryModal collaborator={modal.data} history={collaboratorHistory} escolasDepartamentos={entidades} onClose={() => setModal({ type: null })} />}
            {modal.type === 'collaborator_detail' && <CollaboratorDetailModal collaborator={modal.data} assignments={assignments} equipment={equipment} tickets={tickets} brandMap={brandMap} equipmentTypeMap={equipmentTypeMap} onClose={() => setModal({ type: null })} onShowHistory={(col) => setModal({ type: 'collaborator_history', data: col })} onStartChat={handleOpenChat} />}
            {modal.type === 'manage_licenses' && <ManageAssignedLicensesModal equipment={modal.data} allLicenses={softwareLicenses} allAssignments={licenseAssignments} onClose={() => setModal({ type: null })} onSave={handleSaveLicenseAssignments} />}
            {modal.type === 'add_kit' && <AddEquipmentKitModal onClose={() => setModal({ type: null })} onSaveKit={async (items) => { await dataService.addMultipleEquipment(items as Equipment[]); const allData = await dataService.fetchAllData(); setEquipment(allData.equipment); }} brands={brands} equipmentTypes={equipmentTypes} initialData={modal.data} onSaveEquipmentType={(type) => handleSave('equipment_type', type, dataService.addEquipmentType, dataService.updateEquipmentType, setEquipmentTypes)} equipment={equipment} />}
            
            {isReportModalOpen.type && <ReportModal type={isReportModalOpen.type} onClose={() => setIsReportModalOpen({ type: null })} equipment={equipment} brandMap={brandMap} equipmentTypeMap={equipmentTypeMap} instituicoes={instituicoes} escolasDepartamentos={entidades} collaborators={collaborators} assignments={assignments} tickets={tickets} softwareLicenses={softwareLicenses} licenseAssignments={licenseAssignments} />}
            {isTicketActivitiesModalOpen && selectedTicketForActivities && <TicketActivitiesModal ticket={selectedTicketForActivities} activities={ticketActivities.filter(a => a.ticketId === selectedTicketForActivities.id)} collaborators={collaborators} currentUser={currentUser} onClose={() => setIsTicketActivitiesModalOpen(false)} onAddActivity={(activity) => { const newActivity = { ...activity, id: crypto.randomUUID(), ticketId: selectedTicketForActivities.id, technicianId: currentUser.id, date: new Date().toISOString() }; handleSave('ticket_activity', newActivity, dataService.addTicketActivity, () => Promise.resolve(), setTicketActivities); }} />}
            {infoModal && <InfoModal title={infoModal.title} onClose={() => setInfoModal(null)}>{infoModal.content}</InfoModal>}
            {confirmation && <ConfirmationModal title="Confirmar Ação" message={confirmation.message} onConfirm={confirmation.onConfirm} onClose={() => setConfirmation(null)} />}
            {isNotificationsModalOpen && <NotificationsModal onClose={() => setIsNotificationsModalOpen(false)} expiringWarranties={expiringWarranties} expiringLicenses={expiringLicenses} onViewItem={(tab, filter) => { setIsNotificationsModalOpen(false); setActiveTab(tab); setInitialDashboardFilter(filter); }} onSnooze={handleSnoozeNotification} />}
        </div>
    );
};
    
