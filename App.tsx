

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from './services/supabaseClient';
import { Equipment, Instituicao, Entidade, Collaborator, Assignment, EquipmentStatus, EquipmentType, Brand, Ticket, TicketStatus, EntidadeStatus, UserRole, CollaboratorHistory, TicketActivity, Message, SoftwareLicense, LicenseAssignment, CollaboratorStatus } from './types';
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


    // Loading state
    const [isLoading, setIsLoading] = useState(true);
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
    
    const loadAllData = async () => {
        try {
            const allData = await dataService.fetchAllData();
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
            setLoadingError(null);
        } catch (error) {
            console.error("Failed to fetch data from Supabase:", error);
            setLoadingError("Não foi possível carregar os dados. Verifique a sua conexão e a configuração do Supabase.");
        }
    };
    
    // Auth Listener
    useEffect(() => {
        if (!supabase) {
            setLoadingError("Falha na ligação com o Supabase. Verifique as chaves de configuração.");
            setIsLoading(false);
            return;
        }

        const handleUserSession = async (session: Session) => {
            await loadAllData();
            const userProfile = await dataService.fetchDataById<Collaborator>('collaborator', session.user.id);
            if (userProfile) {
                setCurrentUser(userProfile);
                setIsAuthenticated(true);
            } else {
                await supabase.auth.signOut();
                setIsAuthenticated(false);
                setCurrentUser(null);
            }
        };

        const clearUserState = () => {
            setIsAuthenticated(false);
            setCurrentUser(null);
            setSessionForPasswordReset(null);
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
            setInitialNotificationsShown(false);
            setSnoozedNotifications([]);
        };

        // 1. Check initial session state ONCE.
        setIsLoading(true);
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            try {
                if (session) {
                    if (!window.location.hash.includes('type=recovery')) {
                        await handleUserSession(session);
                    }
                }
            } catch (e) {
                console.error("Erro ao carregar dados da sessão inicial:", e);
                setLoadingError("Ocorreu um erro ao carregar os dados da sua sessão.");
            } finally {
                setIsLoading(false); // This is critical for fixing the infinite spinner.
            }
        });

        // 2. Set up a listener for subsequent auth events.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY' && session) {
                setSessionForPasswordReset(session);
                setIsLoading(false); // Ensure spinner is off
                return;
            }

            if (event === 'SIGNED_IN' && session) {
                setIsLoading(true);
                try {
                    await handleUserSession(session);
                } catch (e) {
                    console.error("Erro ao fazer login:", e);
                } finally {
                    setIsLoading(false);
                }
            }
            
            if (event === 'SIGNED_OUT') {
                clearUserState();
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);


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
    const [snoozedNotifications, setSnoozedNotifications] = useState<string[]>([]);
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
                const { error } = await dataService.addMultipleLicenseAssignments(assignmentsToAdd);
                if (error) throw error;
            }
            
            // Refresh local state
            const updatedAssignments = await dataService.fetchData<LicenseAssignment>('license_assignment');
            setLicenseAssignments(updatedAssignments);

            setModal({ type: null }); // Close modal on success

        } catch (error) {
            console.error("Failed to save license assignments:", error);
            alert("Ocorreu um erro ao salvar as atribuições de licença.");
        }
    }, [licenseAssignments]);


    // --- Auth and Utility Callbacks ---
    
    const handleLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        if (!supabase) return { success: false, error: "Cliente Supabase não inicializado." };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.error("Login error:", error.message);
            if (error.message.includes("Invalid login credentials")) {
                return { success: false, error: "Credenciais inválidas." };
            }
            if (error.message.includes("Email not confirmed")) {
                return { success: false, error: "Por favor, confirme o seu email antes de fazer login." };
            }
            return { success: false, error: "Ocorreu um erro ao fazer login." };
        }
        return { success: true };
    };

    const handleLogout = useCallback(async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout error:", error);
        }
    }, []);
    
    
    const handleImport = useCallback(async (dataType: ImportConfig['dataType'], data: any[]): Promise<{ success: boolean; message: string }> => {
        try {
            let successCount = 0;
            let errorCount = 0;
            let errors: string[] = [];

            if (dataType === 'instituicoes') {
                 const newRecords = data.map(item => ({ ...item, id: crypto.randomUUID() }));
                 const { error } = await dataService.addMultipleInstituicoes(newRecords);
                 if (error) throw error;
                 setInstituicoes(prev => [...prev, ...newRecords]);
                 successCount = newRecords.length;
            } else if (dataType === 'entidades') {
                const newEntidades = data.map(item => ({...item, id: crypto.randomUUID()}));
                const { error } = await dataService.addMultipleEntidades(newEntidades);
                if (error) throw error;
                setEntidades(prev => [...prev, ...newEntidades]);
                successCount = newEntidades.length;
            } else if (dataType === 'collaborators') {
                const existingCodes = new Set(collaborators.map(c => c.numeroMecanografico));
                const recordsToAdd = data
                    .filter(item => !existingCodes.has(item.numeroMecanografico))
                    .map(item => ({
                        ...item,
                        id: crypto.randomUUID(),
                        password: item.password || crypto.randomUUID(), // Ensure password exists
                    }));
                
                errorCount = data.length - recordsToAdd.length;
                if (errorCount > 0) {
                    errors.push(`${errorCount} registos ignorados por terem Nº Mecanográfico duplicado.`);
                }
                
                if (recordsToAdd.length > 0) {
                    const { error } = await dataService.addMultipleCollaborators(recordsToAdd);
                    if (error) throw error;
                    setCollaborators(prev => [...prev, ...recordsToAdd]);
                    successCount = recordsToAdd.length;
                }
            }
            
            let message = `${successCount} registos importados com sucesso.`;
            if(errorCount > 0) {
                message += `\n${errors.join('\n')}`;
            }

            return { success: true, message: message };

        } catch (error: any) {
            console.error(`Failed to import ${dataType}:`, error);
            return { success: false, message: `Erro: ${error.message}` };
        }
    }, [instituicoes, entidades, collaborators]);


    // --- Memos for Derived Data ---
    
    const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const equipmentTypeMap = useMemo(() => new Map(equipmentTypes.map(et => [et.id, et.name])), [equipmentTypes]);
    const assignedEquipmentIds = useMemo(() => new Set(assignments.filter(a => !a.returnDate).map(a => a.equipmentId)), [assignments]);
    
    const unreadMessages = useMemo(() => {
        if (!currentUser) return [];
        return messages.filter(msg => msg.receiverId === currentUser.id && !msg.read);
    }, [messages, currentUser]);
    
     const allExpiringWarranties = useMemo(() => {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return equipment.filter(e => e.warrantyEndDate && new Date(e.warrantyEndDate) <= thirtyDaysFromNow);
    }, [equipment]);

    const allExpiringLicenses = useMemo(() => {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return softwareLicenses.filter(l => l.expiryDate && new Date(l.expiryDate) <= thirtyDaysFromNow);
    }, [softwareLicenses]);

    const expiringWarranties = useMemo(() => {
        return allExpiringWarranties.filter(item => !snoozedNotifications.includes(item.id));
    }, [allExpiringWarranties, snoozedNotifications]);

    const expiringLicenses = useMemo(() => {
        return allExpiringLicenses.filter(item => !snoozedNotifications.includes(item.id));
    }, [allExpiringLicenses, snoozedNotifications]);
    
    const handleViewItem = useCallback((tab: string, filter: any) => {
        setActiveTab(tab);
        setInitialDashboardFilter(filter);
        setIsNotificationsModalOpen(false); // Close notification modal after clicking
    }, []);
    
    const handleSnoozeNotification = useCallback((id: string) => {
        if (!currentUser) return;
        const updatedSnoozed = Array.from(new Set([...snoozedNotifications, id]));
        setSnoozedNotifications(updatedSnoozed);
        localStorage.setItem(`snoozedNotifications_${currentUser.id}`, JSON.stringify(updatedSnoozed));
    }, [snoozedNotifications, currentUser]);


    useEffect(() => {
        if (!isLoading && isAuthenticated && !initialNotificationsShown && (allExpiringWarranties.length > 0 || allExpiringLicenses.length > 0)) {
            setIsNotificationsModalOpen(true);
            setInitialNotificationsShown(true);
        }
    }, [isLoading, isAuthenticated, initialNotificationsShown, allExpiringWarranties, allExpiringLicenses]);
    
    // --- UI Configuration ---

    const tabConfig: Record<string, TabConfigItem> = useMemo(() => {
        const canEdit = userPermissions.canEdit;
        const isAdmin = currentUser?.role === UserRole.Admin;
        
        const config: Record<string, TabConfigItem> = {
            'overview': { title: 'Visão Geral', component: <OverviewDashboard equipment={equipment} instituicoes={instituicoes} entidades={entidades} assignments={assignments} equipmentTypes={equipmentTypes} tickets={tickets} onViewItem={handleViewItem} /> },
            'equipment.inventory': {
                title: 'Inventário',
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
                                onAssign={(eq) => setModal({ type: 'assign', data: eq })}
                                onAssignMultiple={(eqs) => setModal({ type: 'assign-multiple', data: eqs })}
                                onUnassign={(id) => setConfirmation({ message: 'Tem a certeza de que deseja desassociar este equipamento?', onConfirm: () => handleUnassignEquipment(id) })}
                                onUpdateStatus={handleUpdateEquipmentStatus}
                                onShowHistory={(eq) => setModal({ type: 'history', data: eq })}
                                onEdit={canEdit ? (eq) => setModal({ type: 'equipment', data: eq }) : undefined}
                                onManageKeys={(eq) => setModal({ type: 'manage-keys', data: eq })}
                                onGenerateReport={() => setIsReportModalOpen({type: 'equipment'})}
                            />,
                buttonText: 'Adicionar Equipamento',
                onButtonClick: canEdit ? () => setModal({ type: 'equipment' }) : undefined,
                secondaryButtonText: 'Criar Posto de Trabalho',
                onSecondaryButtonClick: canEdit ? () => handleOpenKitModal(null) : undefined,
            },
            'licensing': {
                 title: 'Licenciamento',
                 component: <LicenseDashboard
                                licenses={softwareLicenses}
                                licenseAssignments={licenseAssignments}
                                onEdit={canEdit ? (lic) => setModal({ type: 'license', data: lic }) : undefined}
                                onDelete={isAdmin ? (id) => setConfirmation({ message: 'Tem a certeza que deseja excluir esta licença? Todas as suas atribuições serão removidas.', onConfirm: () => handleDelete('software_license', id, dataService.deleteSoftwareLicense, setSoftwareLicenses) }) : undefined}
                                onGenerateReport={() => setIsReportModalOpen({type: 'licensing'})}
                            />,
                buttonText: 'Adicionar Licença',
                onButtonClick: canEdit ? () => setModal({ type: 'license' }) : undefined,
            },
            'tickets': {
                title: 'Tickets de Suporte',
                component: <TicketDashboard 
                                tickets={tickets}
                                escolasDepartamentos={entidades}
                                collaborators={collaborators}
                                initialFilter={initialDashboardFilter}
                                onClearInitialFilter={() => setInitialDashboardFilter(null)}
                                onUpdateTicket={(ticket) => handleSave('ticket', ticket, dataService.addTicket, dataService.updateTicket, setTickets)}
                                onEdit={canEdit ? (ticket) => setModal({ type: 'ticket', data: ticket }) : undefined}
                                onOpenCloseTicketModal={(ticket) => setModal({ type: 'close-ticket', data: ticket })}
                                onOpenActivities={(ticket) => {
                                    setSelectedTicketForActivities(ticket);
                                    setIsTicketActivitiesModalOpen(true);
                                }}
                            />,
                buttonText: 'Novo Ticket',
                onButtonClick: () => setModal({ type: 'ticket' }),
            }
        };
        
        if (userPermissions.viewScope === 'all') {
             Object.assign(config, {
                 'organizacao.instituicoes': {
                    title: 'Instituições',
                    component: <InstituicaoDashboard 
                                    instituicoes={instituicoes} 
                                    escolasDepartamentos={entidades}
                                    onEdit={canEdit ? (inst) => setModal({ type: 'instituicao', data: inst }) : undefined}
                                    onDelete={isAdmin ? (id) => setConfirmation({ message: 'Tem a certeza que deseja excluir esta instituição? Todas as entidades e equipamentos associados serão afetados.', onConfirm: () => handleDelete('instituicao', id, dataService.deleteInstituicao, setInstituicoes) }) : undefined}
                                />,
                    buttonText: 'Adicionar Instituição',
                    onButtonClick: canEdit ? () => setModal({ type: 'instituicao' }) : undefined,
                    onImportClick: isAdmin ? () => setModal({ type: 'import', data: { dataType: 'instituicoes', title: 'Importar Instituições', columnMap: { codigo: 'Código', name: 'Nome', email: 'Email', telefone: 'Telefone' }, templateFileName: 'template_instituicoes.xlsx' } }) : undefined,
                },
                'organizacao.entidades': {
                    title: 'Entidades',
                    component: <EntidadeDashboard 
                                    escolasDepartamentos={entidades} 
                                    instituicoes={instituicoes} 
                                    collaborators={collaborators}
                                    onEdit={canEdit ? (ent) => setModal({ type: 'entidade', data: ent }) : undefined}
                                    onDelete={isAdmin ? (id) => setConfirmation({ message: 'Tem a certeza que deseja excluir esta entidade? Todos os colaboradores e equipamentos associados serão afetados.', onConfirm: () => handleDelete('entidade', id, dataService.deleteEntidade, setEntidades) }) : undefined}
                                    onToggleStatus={isAdmin ? (id) => {
                                        const entidade = entidades.find(e => e.id === id);
                                        if (entidade) {
                                            const newStatus = entidade.status === EntidadeStatus.Ativo ? EntidadeStatus.Inativo : EntidadeStatus.Ativo;
                                            handleSave('entidade', { id, status: newStatus }, dataService.addEntidade, dataService.updateEntidade, setEntidades);
                                        }
                                    } : undefined}
                                />,
                    buttonText: 'Adicionar Entidade',
                    onButtonClick: canEdit ? () => setModal({ type: 'entidade' }) : undefined,
                    onImportClick: isAdmin ? () => setModal({ type: 'import', data: { dataType: 'entidades', title: 'Importar Entidades', columnMap: { instituicaoId: 'ID da Instituição', codigo: 'Código', name: 'Nome', description: 'Descrição', email: 'Email', responsavel: 'Responsável', telefone: 'Telefone', telemovel: 'Telemóvel', telefoneInterno: 'Telefone Interno' }, templateFileName: 'template_entidades.xlsx' } }) : undefined,
                },
                 'collaborators': {
                    title: 'Colaboradores',
                    component: <CollaboratorDashboard 
                                    collaborators={collaborators} 
                                    escolasDepartamentos={entidades}
                                    equipment={equipment}
                                    assignments={assignments}
                                    currentUser={currentUser}
                                    onEdit={canEdit ? (col) => setModal({ type: 'collaborator', data: col }) : undefined}
                                    onDelete={isAdmin ? (id) => setConfirmation({ message: 'Tem a certeza que deseja excluir este colaborador?', onConfirm: () => handleDelete('collaborator', id, dataService.deleteCollaborator, setCollaborators) }) : undefined}
                                    onShowHistory={(col) => setModal({type: 'collaborator-history', data: col})}
                                    onShowDetails={(col) => setModal({ type: 'collaborator-details', data: col })}
                                    onGenerateReport={() => setIsReportModalOpen({type: 'collaborator'})}
                                    onStartChat={handleOpenChat}
                                    onToggleStatus={isAdmin ? (id) => {
                                        const collaborator = collaborators.find(c => c.id === id);
                                        if (collaborator) {
                                            const newStatus = collaborator.status === CollaboratorStatus.Ativo ? CollaboratorStatus.Inativo : CollaboratorStatus.Ativo;
                                            handleSaveCollaborator({ ...collaborator, status: newStatus });
                                        }
                                    } : undefined}
                                />,
                    buttonText: 'Adicionar Colaborador',
                    onButtonClick: canEdit ? () => setModal({ type: 'collaborator' }) : undefined,
                    onImportClick: isAdmin ? () => setModal({ type: 'import', data: { dataType: 'collaborators', title: 'Importar Colaboradores', columnMap: { numeroMecanografico: 'Nº Mecanográfico', fullName: 'Nome Completo', entidadeId: 'ID da Entidade', email: 'Email', telefoneInterno: 'Telefone Interno', telemovel: 'Telemóvel', password: 'Password', canLogin: 'Pode Fazer Login (TRUE/FALSE)', role: 'Perfil (Admin, Normal, Basic, Utilizador)' }, templateFileName: 'template_colaboradores.xlsx' } }) : undefined,
                },
                 'equipment.brands': {
                    title: 'Marcas',
                    component: <BrandDashboard 
                                    brands={brands} 
                                    equipment={equipment}
                                    onEdit={canEdit ? (b) => setModal({ type: 'brand', data: b }) : undefined}
                                    onDelete={isAdmin ? (id) => setConfirmation({ message: 'Tem a certeza que deseja excluir esta marca?', onConfirm: () => handleDelete('brand', id, dataService.deleteBrand, setBrands) }) : undefined}
                                />,
                    buttonText: 'Adicionar Marca',
                    onButtonClick: canEdit ? () => setModal({ type: 'brand' }) : undefined,
                 },
                 'equipment.types': {
                    title: 'Tipos de Equipamento',
                    component: <EquipmentTypeDashboard 
                                    equipmentTypes={equipmentTypes} 
                                    equipment={equipment}
                                    onEdit={canEdit ? (et) => setModal({ type: 'equipment_type', data: et }) : undefined}
                                    onDelete={isAdmin ? (id) => setConfirmation({ message: 'Tem a certeza que deseja excluir este tipo de equipamento?', onConfirm: () => handleDelete('equipment_type', id, dataService.deleteEquipmentType, setEquipmentTypes) }) : undefined}
                                />,
                    buttonText: 'Adicionar Tipo',
                    onButtonClick: canEdit ? () => setModal({ type: 'equipment_type' }) : undefined,
                 }
            });
        }
        
        return config;
        
    }, [userPermissions, currentUser, equipment, instituicoes, entidades, assignments, equipmentTypes, tickets, brands, brandMap, equipmentTypeMap, assignedEquipmentIds, collaborators, initialDashboardFilter, softwareLicenses, licenseAssignments, messages, handleViewItem, handleUnassignEquipment, handleUpdateEquipmentStatus, handleSave, handleSaveCollaborator]);
    
    const currentDashboard = useMemo(() => {
        return tabConfig[activeTab]?.component || <div className="text-center p-8">Separador não encontrado.</div>;
    }, [activeTab, tabConfig]);
    
    const currentConfig = tabConfig[activeTab];
    

    const handleSaveKit = useCallback(async (items: Array<Omit<Equipment, 'id' | 'modifiedDate' | 'status' | 'creationDate'>>) => {
        try {
            // Find the highest inventory number
            let maxInventoryNum = equipment.reduce((max, eq) => {
                const num = parseInt(eq.inventoryNumber || '0', 10);
                return isNaN(num) ? max : Math.max(max, num);
            }, 0);

            const now = new Date().toISOString();
            const newEquipmentList: Equipment[] = items.map(item => {
                const itemType = equipmentTypes.find(t => t.id === item.typeId);
                let inventoryNumber = item.inventoryNumber;
                if (itemType?.requiresInventoryNumber) {
                    maxInventoryNum++;
                    inventoryNumber = String(maxInventoryNum);
                }
                return {
                    ...item,
                    id: crypto.randomUUID(),
                    creationDate: now,
                    modifiedDate: now,
                    status: EquipmentStatus.Stock,
                    inventoryNumber,
                } as Equipment;
            });

            const { data: addedEquipment, error } = await dataService.addMultipleEquipment(newEquipmentList);
            if (error) throw error;
            
            setEquipment(prev => [...prev, ...addedEquipment]);
            setModal({ type: null });

        } catch (error) {
            console.error("Failed to save kit:", error);
            alert("Ocorreu um erro ao salvar o posto de trabalho.");
        }
    }, [equipment, equipmentTypes]);

    const handleOpenKitModal = useCallback((initialData: Partial<Equipment> | null) => {
        setModal({ type: 'add-kit', data: initialData });
    }, []);
    
    
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-background-dark"><SpinnerIcon className="h-10 w-10 animate-spin text-brand-secondary" /></div>;
    }
    
    if (loadingError) {
         return <div className="flex items-center justify-center min-h-screen bg-background-dark text-red-400 p-8 text-center">{loadingError}</div>;
    }

    if (sessionForPasswordReset) {
        return <ResetPasswordModal session={sessionForPasswordReset} onClose={() => setSessionForPasswordReset(null)} />;
    }

    if (!isAuthenticated) {
        return <>
            <LoginPage onLogin={handleLogin} onForgotPassword={() => setIsForgotPasswordModalOpen(true)} />
            {isForgotPasswordModalOpen && <ForgotPasswordModal onClose={() => setIsForgotPasswordModalOpen(false)} />}
        </>;
    }

    return (
        <div className="min-h-screen bg-background-dark">
            <Header
                currentUser={currentUser}
                activeTab={activeTab}
                setActiveTab={(tab) => { setActiveTab(tab); setInitialDashboardFilter(null); }}
                onLogout={handleLogout}
                tabConfig={tabConfig}
                notificationCount={expiringWarranties.length + expiringLicenses.length}
                onNotificationClick={() => setIsNotificationsModalOpen(true)}
            />
            <main className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h1 className="text-2xl font-bold text-white">{currentConfig?.title}</h1>
                    <div className="flex gap-2 flex-wrap">
                       {currentConfig?.onButtonClick && (
                            <button onClick={currentConfig.onButtonClick} className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors">
                                <PlusIcon className="h-5 w-5" />
                                {currentConfig.buttonText}
                            </button>
                        )}
                        {currentConfig?.onSecondaryButtonClick && (
                            <button onClick={currentConfig.onSecondaryButtonClick} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors">
                                {currentConfig.secondaryButtonText}
                            </button>
                        )}
                        {currentConfig?.onImportClick && (
                            <button onClick={currentConfig.onImportClick} className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors">
                                <FaFileImport className="h-5 w-5" />
                                Importar
                            </button>
                        )}
                    </div>
                </div>
                {currentDashboard}
            </main>
            
            {/* Modals Section */}
            {modal.type === 'equipment' && <AddEquipmentModal 
                onClose={() => setModal({ type: null })} 
                onSave={(data) => handleSave('equipment', data, dataService.addEquipment, dataService.updateEquipment, setEquipment)}
                brands={brands}
                equipmentTypes={equipmentTypes}
                equipmentToEdit={modal.data}
                onSaveBrand={(data) => handleSave('brand', data, dataService.addBrand, dataService.updateBrand, setBrands)}
                onSaveEquipmentType={(data) => handleSave('equipment_type', data, dataService.addEquipmentType, dataService.updateEquipmentType, setEquipmentTypes)}
                onOpenKitModal={handleOpenKitModal}
            />}
            {modal.type === 'add-kit' && <AddEquipmentKitModal
                onClose={() => setModal({ type: null })}
                onSaveKit={handleSaveKit}
                brands={brands}
                equipmentTypes={equipmentTypes}
                initialData={modal.data}
                onSaveEquipmentType={(data) => handleSave('equipment_type', data, dataService.addEquipmentType, dataService.updateEquipmentType, setEquipmentTypes)}
                equipment={equipment}
            />}
            {modal.type === 'instituicao' && <AddInstituicaoModal 
                onClose={() => setModal({ type: null })} 
                onSave={(data) => handleSave('instituicao', data, dataService.addInstituicao, dataService.updateInstituicao, setInstituicoes)}
                instituicaoToEdit={modal.data}
            />}
            {modal.type === 'entidade' && <AddEntidadeModal 
                onClose={() => setModal({ type: null })} 
                onSave={(data) => handleSave('entidade', data, dataService.addEntidade, dataService.updateEntidade, setEntidades)}
                entidadeToEdit={modal.data}
                instituicoes={instituicoes}
            />}
            {modal.type === 'collaborator' && <AddCollaboratorModal 
                onClose={() => setModal({ type: null })}
                onSave={handleSaveCollaborator}
                collaboratorToEdit={modal.data}
                escolasDepartamentos={entidades}
                currentUser={currentUser}
            />}
            {modal.type === 'brand' && <AddBrandModal 
                onClose={() => setModal({ type: null })}
                onSave={(data) => handleSave('brand', data, dataService.addBrand, dataService.updateBrand, setBrands)}
                brandToEdit={modal.data}
            />}
            {modal.type === 'equipment_type' && <AddEquipmentTypeModal 
                onClose={() => setModal({ type: null })}
                onSave={(data) => handleSave('equipment_type', data, dataService.addEquipmentType, dataService.updateEquipmentType, setEquipmentTypes)}
                typeToEdit={modal.data}
            />}
            {modal.type === 'assign' && modal.data && <AssignEquipmentModal
                equipment={modal.data}
                brandMap={brandMap}
                equipmentTypeMap={equipmentTypeMap}
                escolasDepartamentos={entidades}
                collaborators={collaborators}
                onClose={() => setModal({ type: null })}
                onAssign={handleAssignEquipment}
            />}
            {modal.type === 'assign-multiple' && modal.data && <AssignMultipleEquipmentModal
                equipmentList={modal.data}
                brandMap={brandMap}
                equipmentTypeMap={equipmentTypeMap}
                escolasDepartamentos={entidades}
                collaborators={collaborators}
                onClose={() => setModal({ type: null })}
                onAssign={handleAssignMultipleEquipment}
            />}
            {modal.type === 'history' && modal.data && <EquipmentHistoryModal
                equipment={modal.data}
                assignments={assignments}
                collaborators={collaborators}
                escolasDepartamentos={entidades}
                onClose={() => setModal({ type: null })}
            />}
             {modal.type === 'collaborator-history' && modal.data && <CollaboratorHistoryModal
                collaborator={modal.data}
                history={collaboratorHistory}
                escolasDepartamentos={entidades}
                onClose={() => setModal({ type: null })}
            />}
            {modal.type === 'collaborator-details' && modal.data && <CollaboratorDetailModal
                collaborator={modal.data}
                assignments={assignments}
                equipment={equipment}
                tickets={tickets}
                brandMap={brandMap}
                equipmentTypeMap={equipmentTypeMap}
                onClose={() => setModal({ type: null })}
                onShowHistory={(col) => setModal({type: 'collaborator-history', data: col})}
                onStartChat={handleOpenChat}
            />}
            {modal.type === 'import' && <ImportModal
                onClose={() => setModal({ type: null })}
                onImport={handleImport}
                config={modal.data}
            />}
            {modal.type === 'ticket' && <AddTicketModal
                onClose={() => setModal({ type: null })}
                onSave={(data) => handleSave('ticket', data, dataService.addTicket, dataService.updateTicket, setTickets)}
                ticketToEdit={modal.data}
                escolasDepartamentos={entidades}
                collaborators={collaborators}
                currentUser={currentUser}
                userPermissions={userPermissions}
            />}
             {modal.type === 'license' && <AddLicenseModal
                onClose={() => setModal({ type: null })}
                onSave={(data) => handleSave('software_license', data, dataService.addSoftwareLicense, dataService.updateSoftwareLicense, setSoftwareLicenses)}
                licenseToEdit={modal.data}
            />}
            {modal.type === 'manage-keys' && modal.data && <ManageAssignedLicensesModal
                onClose={() => setModal({ type: null })}
                onSave={handleSaveLicenseAssignments}
                equipment={modal.data}
                allLicenses={softwareLicenses}
                allAssignments={licenseAssignments}
            />}
            {modal.type === 'close-ticket' && modal.data && <CloseTicketModal
                ticket={modal.data}
                collaborators={collaborators}
                onClose={() => setModal({ type: null })}
                onConfirm={(technicianId) => {
                    handleSave('ticket', { ...modal.data, status: TicketStatus.Finished, finishDate: new Date().toISOString().split('T')[0], technicianId }, dataService.addTicket, dataService.updateTicket, setTickets);
                    setModal({ type: null });
                }}
            />}
            {isTicketActivitiesModalOpen && selectedTicketForActivities && (
                <TicketActivitiesModal
                    ticket={selectedTicketForActivities}
                    activities={ticketActivities.filter(a => a.ticketId === selectedTicketForActivities.id)}
                    collaborators={collaborators}
                    currentUser={currentUser}
                    onClose={() => setIsTicketActivitiesModalOpen(false)}
                    onAddActivity={({ description }) => handleSave('ticket_activity', { ticketId: selectedTicketForActivities.id, technicianId: currentUser!.id, date: new Date().toISOString(), description }, dataService.addTicketActivity, () => Promise.resolve(), setTicketActivities)}
                />
            )}
             {isNotificationsModalOpen && (
                <NotificationsModal 
                    onClose={() => setIsNotificationsModalOpen(false)}
                    expiringWarranties={expiringWarranties}
                    expiringLicenses={expiringLicenses}
                    onViewItem={handleViewItem}
                    onSnooze={handleSnoozeNotification}
                />
            )}
            {confirmation && <ConfirmationModal 
                title="Confirmar Ação"
                message={confirmation.message}
                onClose={() => setConfirmation(null)}
                onConfirm={confirmation.onConfirm}
            />}
            {isReportModalOpen.type && <ReportModal
                type={isReportModalOpen.type}
                onClose={() => setIsReportModalOpen({ type: null })}
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
            />}
            {infoModal && (
                <InfoModal title={infoModal.title} onClose={() => setInfoModal(null)}>
                    {infoModal.content}
                </InfoModal>
            )}
            
            <ChatWidget
                currentUser={currentUser}
                collaborators={collaborators}
                messages={messages}
                onSendMessage={handleSendMessage}
                onMarkMessagesAsRead={handleMarkMessagesAsRead}
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(!isChatOpen)}
                activeChatCollaboratorId={activeChatCollaboratorId}
                onSelectConversation={setActiveChatCollaboratorId}
                unreadMessagesCount={unreadMessages.length}
            />
        </div>
    );
};
