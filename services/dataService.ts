import { supabase } from './supabaseClient';
import { Equipment, Instituicao, Entidade, Collaborator, Assignment, EquipmentType, Brand, Ticket, TicketActivity, CollaboratorHistory, Message, SoftwareLicense, LicenseAssignment, Team, TeamMember } from '../types';

// Função auxiliar para lidar com erros do Supabase de forma consistente
const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Erro em ${context}:`, error);
        throw new Error(`Erro do Supabase durante ${context}: ${error.message}`);
    }
};

// Helper para garantir que o cliente Supabase está inicializado
const checkSupabase = () => {
    if (!supabase) {
        throw new Error("Cliente Supabase não inicializado. Verifique as variáveis de ambiente.");
    }
    return supabase;
};

// --- Funções Genéricas de CRUD ---

export const fetchData = async <T>(tableName: string): Promise<T[]> => {
    const sb = checkSupabase();
    const { data, error } = await sb.from(tableName).select('*');
    handleSupabaseError(error, `a obter dados de ${tableName}`);
    return data as T[] ?? [];
};

export const fetchDataById = async <T>(tableName: string, id: string): Promise<T | null> => {
    const sb = checkSupabase();
    const { data, error } = await sb.from(tableName).select('*').eq('id', id).single();
    handleSupabaseError(error, `a obter dados de ${tableName} com id ${id}`);
    return data as T | null;
};


const insertData = async <T>(tableName: string, record: Partial<T>): Promise<T> => {
    const sb = checkSupabase();
    const { data, error } = await sb.from(tableName).insert(record as any).select();
    handleSupabaseError(error, `a inserir em ${tableName}`);
    if (!data) throw new Error("A inserção não retornou dados.");
    return data[0] as T;
};


export const updateData = async <T>(tableName: string, id: string, updates: Partial<T>): Promise<T> => {
    const sb = checkSupabase();
    const { data, error } = await sb.from(tableName).update(updates as any).eq('id', id).select();
    handleSupabaseError(error, `a atualizar em ${tableName}`);
    if (!data) throw new Error("A atualização não retornou dados.");
    return data[0] as T;
};


export const deleteData = async (tableName: string, id: string): Promise<void> => {
    const sb = checkSupabase();
    const { error } = await sb.from(tableName).delete().eq('id', id);
    handleSupabaseError(error, `a eliminar de ${tableName}`);
};

// --- Funções de Serviço Específicas ---

const transformTicketForSave = (ticketData: Partial<Ticket>): any => {
    const { equipmentId, entidadeId, collaboratorId, technicianId, ...rest } = ticketData;
    const recordToSend: any = { ...rest };
    if (equipmentId !== undefined) recordToSend.equipment_id = equipmentId;
    if (entidadeId !== undefined) recordToSend.entidade_id = entidadeId;
    if (collaboratorId !== undefined) recordToSend.collaborator_id = collaboratorId;
    if (technicianId !== undefined) recordToSend.technician_id = technicianId;
    return recordToSend;
};

const transformTicketFromFetch = (ticketData: any): Ticket => {
    const { equipment_id, entidade_id, collaborator_id, technician_id, ...rest } = ticketData;
    const recordToReturn: any = { ...rest };
    if (equipment_id !== undefined) recordToReturn.equipmentId = equipment_id;
    if (entidade_id !== undefined) recordToReturn.entidadeId = entidade_id;
    if (collaborator_id !== undefined) recordToReturn.collaboratorId = collaborator_id;
    if (technician_id !== undefined) recordToReturn.technicianId = technician_id;
    return recordToReturn as Ticket;
};

const transformTicketActivityForSave = (activityData: Partial<TicketActivity>): any => {
    const { ticketId, technicianId, equipmentId, ...rest } = activityData;
    const recordToSend: any = { ...rest };
    if (ticketId !== undefined) recordToSend.ticket_id = ticketId;
    if (technicianId !== undefined) recordToSend.technician_id = technicianId;
    if (equipmentId !== undefined) recordToSend.equipment_id = equipmentId;
    return recordToSend;
};

const transformTicketActivityFromFetch = (activityData: any): TicketActivity => {
    const { ticket_id, technician_id, equipment_id, ...rest } = activityData;
    const recordToReturn: any = { ...rest };
    if (ticket_id !== undefined) recordToReturn.ticketId = ticket_id;
    if (technician_id !== undefined) recordToReturn.technicianId = technician_id;
    if (equipment_id !== undefined) recordToReturn.equipmentId = equipment_id;
    return recordToReturn as TicketActivity;
};


export const fetchAllData = async () => {
    const [
        equipment, instituicoes, entidades, collaborators, equipmentTypes, brands,
        assignments, ticketsRaw, ticketActivitiesRaw, collaboratorHistory, messages,
        softwareLicenses, licenseAssignments, teams, teamMembers
    ] = await Promise.all([
        fetchData<Equipment>('equipment'),
        fetchData<Instituicao>('instituicao'),
        fetchData<Entidade>('entidade'),
        fetchData<Collaborator>('collaborator'),
        fetchData<EquipmentType>('equipment_type'),
        fetchData<Brand>('brand'),
        fetchData<Assignment>('assignment'),
        fetchData<any>('ticket'),
        fetchData<any>('ticket_activity'),
        fetchData<CollaboratorHistory>('collaborator_history'),
        fetchData<Message>('message'),
        fetchData<SoftwareLicense>('software_license'),
        fetchData<LicenseAssignment>('license_assignment'),
        fetchData<Team>('teams'),
        fetchData<TeamMember>('team_members'),
    ]);

    const tickets = ticketsRaw.map(transformTicketFromFetch);
    const ticketActivities = ticketActivitiesRaw.map(transformTicketActivityFromFetch);

    return {
        equipment, instituicoes, entidades, collaborators, equipmentTypes, brands,
        assignments, tickets, ticketActivities, collaboratorHistory, messages,
        softwareLicenses, licenseAssignments, teams, teamMembers
    };
};

// Equipment
export const addEquipment = (record: Equipment) => insertData('equipment', record);
export const addMultipleEquipment = (records: Equipment[]) => {
    const sb = checkSupabase();
    return sb.from('equipment').insert(records).select();
};
export const updateEquipment = (id: string, updates: Partial<Equipment>) => updateData('equipment', id, updates);
export const deleteEquipment = (id: string) => deleteData('equipment', id);

// Instituicao
export const addInstituicao = (record: Instituicao) => insertData('instituicao', record);
export const updateInstituicao = (id: string, updates: Partial<Instituicao>) => updateData('instituicao', id, updates);
export const deleteInstituicao = (id: string) => deleteData('instituicao', id);
export const addMultipleInstituicoes = (records: Instituicao[]) => {
    const sb = checkSupabase();
    return sb.from('instituicao').insert(records).select();
};

// Entidade
export const addEntidade = (record: Entidade) => insertData('entidade', record);
export const updateEntidade = (id: string, updates: Partial<Entidade>) => updateData('entidade', id, updates);
export const deleteEntidade = (id: string) => deleteData('entidade', id);
export const addMultipleEntidades = (records: Entidade[]) => {
    const sb = checkSupabase();
    return sb.from('entidade').insert(records).select();
};


// Collaborator
export const addCollaborator = (record: Collaborator) => insertData('collaborator', record);
export const updateCollaborator = (id: string, updates: Partial<Omit<Collaborator, 'id'>>) => updateData('collaborator', id, updates);
export const deleteCollaborator = (id: string) => deleteData('collaborator', id);
export const addMultipleCollaborators = (records: Collaborator[]) => {
    const sb = checkSupabase();
    return sb.from('collaborator').insert(records).select();
};
export const uploadCollaboratorPhoto = async (userId: string, file: File): Promise<string | null> => {
    const sb = checkSupabase();
    const filePath = `${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await sb.storage
        .from('collaborator-photos')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        handleSupabaseError(uploadError, 'a carregar a foto do colaborador');
        return null;
    }

    const { data } = sb.storage.from('collaborator-photos').getPublicUrl(filePath);
    return data.publicUrl;
};


// Assignment
export const addAssignment = (record: Assignment) => insertData('assignment', record);
export const addMultipleAssignments = (records: Assignment[]) => {
    const sb = checkSupabase();
    return sb.from('assignment').insert(records).select();
};
export const updateAssignment = (id: string, updates: Partial<Assignment>) => updateData('assignment', id, updates);

// EquipmentType
export const addEquipmentType = (record: EquipmentType) => insertData('equipment_type', record);
export const updateEquipmentType = (id: string, updates: Partial<EquipmentType>) => updateData('equipment_type', id, updates);
export const deleteEquipmentType = (id: string) => deleteData('equipment_type', id);

// Brand
export const addBrand = (record: Brand) => insertData('brand', record);
export const updateBrand = (id: string, updates: Partial<Brand>) => updateData('brand', id, updates);
export const deleteBrand = (id: string) => deleteData('brand', id);

// Ticket
export const addTicket = async (record: Ticket): Promise<Ticket> => {
    const sb = checkSupabase();
    const { data, error } = await sb.from('ticket').insert(transformTicketForSave(record)).select();
    handleSupabaseError(error, 'a inserir em ticket');
    if (!data) throw new Error("A inserção não retornou dados.");
    return transformTicketFromFetch(data[0]);
};
export const updateTicket = async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
    const sb = checkSupabase();
    const { data, error } = await sb.from('ticket').update(transformTicketForSave(updates)).eq('id', id).select();
    handleSupabaseError(error, 'a atualizar em ticket');
    if (!data) throw new Error("A atualização não retornou dados.");
    return transformTicketFromFetch(data[0]);
};

// TicketActivity
export const addTicketActivity = async (record: TicketActivity): Promise<TicketActivity> => {
    const sb = checkSupabase();
    const { data, error } = await sb.from('ticket_activity').insert(transformTicketActivityForSave(record)).select();
    handleSupabaseError(error, 'a inserir em ticket_activity');
    if (!data) throw new Error("A inserção não retornou dados.");
    return transformTicketActivityFromFetch(data[0]);
};
export const updateTicketActivity = async (id: string, updates: Partial<TicketActivity>): Promise<TicketActivity> => {
    const sb = checkSupabase();
    const { data, error } = await sb.from('ticket_activity').update(transformTicketActivityForSave(updates)).eq('id', id).select();
    handleSupabaseError(error, 'a atualizar em ticket_activity');
    if (!data) throw new Error("A atualização não retornou dados.");
    return transformTicketActivityFromFetch(data[0]);
};

// CollaboratorHistory
export const addCollaboratorHistory = (record: CollaboratorHistory) => insertData('collaborator_history', record);
export const updateCollaboratorHistory = (id: string, updates: Partial<CollaboratorHistory>) => updateData('collaborator_history', id, updates);

// Message
export const addMessage = (record: Message) => insertData('message', record);
export const updateMessage = (id: string, updates: Partial<Message>) => updateData('message', id, updates);
// Para 'marcar como lido', seria mais eficiente uma função que atualiza múltiplos
export const markMessagesAsRead = (senderId: string, receiverId: string) => {
    const sb = checkSupabase();
    return sb.from('message')
        .update({ read: true })
        .eq('senderId', senderId)
        .eq('receiverId', receiverId)
        .eq('read', false);
};

// SoftwareLicense
export const addLicense = (record: SoftwareLicense) => insertData('software_license', record);
export const updateLicense = (id: string, updates: Partial<SoftwareLicense>) => updateData('software_license', id, updates);
export const deleteLicense = (id: string) => deleteData('software_license', id);

// LicenseAssignment
export const syncLicenseAssignments = async (equipmentId: string, licenseIds: string[]) => {
    const sb = checkSupabase();

    // 1. Get current assignments for this equipment
    const { data: currentAssignments, error: fetchError } = await sb
        .from('license_assignment')
        .select('id, softwareLicenseId')
        .eq('equipmentId', equipmentId);
    handleSupabaseError(fetchError, 'a obter atribuições de licença');

    const currentLicenseIds = new Set(currentAssignments?.map(a => a.softwareLicenseId));
    const newLicenseIds = new Set(licenseIds);

    // 2. Determine which to add and which to remove
    const toAdd = licenseIds.filter(id => !currentLicenseIds.has(id));
    const toRemove = currentAssignments?.filter(a => !newLicenseIds.has(a.softwareLicenseId)).map(a => a.id) || [];

    // 3. Perform deletions
    if (toRemove.length > 0) {
        const { error: deleteError } = await sb
            .from('license_assignment')
            .delete()
            .in('id', toRemove);
        handleSupabaseError(deleteError, 'a apagar atribuições de licença');
    }

    // 4. Perform insertions
    if (toAdd.length > 0) {
        const newRecords = toAdd.map(licenseId => ({
            equipmentId,
            softwareLicenseId: licenseId,
            assignedDate: new Date().toISOString().split('T')[0],
            id: crypto.randomUUID(),
        }));
        const { error: insertError } = await sb
            .from('license_assignment')
            .insert(newRecords);
        handleSupabaseError(insertError, 'a adicionar atribuições de licença');
    }
};

// Teams
export const addTeam = (record: Omit<Team, 'id'>) => insertData('teams', record);
export const updateTeam = (id: string, updates: Partial<Team>) => updateData('teams', id, updates);
export const deleteTeam = (id: string) => deleteData('teams', id);

// TeamMembers
export const syncTeamMembers = async (teamId: string, memberIds: string[]) => {
    const sb = checkSupabase();

    // 1. Delete all existing members for the team
    const { error: deleteError } = await sb.from('team_members').delete().eq('team_id', teamId);
    handleSupabaseError(deleteError, 'a remover membros antigos da equipa');

    // 2. Insert new members if any
    if (memberIds.length > 0) {
        const newMembers = memberIds.map(collaborator_id => ({
            team_id: teamId,
            collaborator_id
        }));
        const { error: insertError } = await sb.from('team_members').insert(newMembers);
        handleSupabaseError(insertError, 'a adicionar novos membros à equipa');
    }
};
