import { getSupabase } from './supabaseClient';
import { 
    Equipment, Instituicao, Entidade, Collaborator, Assignment, EquipmentType, Brand, 
    Ticket, TicketActivity, CollaboratorHistory, Message, SoftwareLicense, LicenseAssignment, 
    Team, TeamMember
} from '../types';

const handleSupabaseError = (error: any, operation: string) => {
    if (error) {
        console.error(`Error ${operation}:`, error);
        throw new Error(`Erro ao ${operation}: ${error.message}`);
    }
};

// --- Batch Data Fetching ---
export const fetchAllData = async () => {
    const supabase = getSupabase();
    const [
        equipmentRes, instituicoesRes, entidadesRes, collaboratorsRes,
        assignmentsRes, ticketsRes, ticketActivitiesRes, brandsRes,
        equipmentTypesRes, softwareLicensesRes, licenseAssignmentsRes,
        teamsRes, teamMembersRes, messagesRes, historyRes
    ] = await Promise.all([
        supabase.from('equipment').select('*'),
        supabase.from('instituicoes').select('*'),
        supabase.from('entidades').select('*'),
        supabase.from('collaborators').select('*'),
        supabase.from('assignments').select('*'),
        supabase.from('tickets').select('*'),
        supabase.from('ticket_activities').select('*'),
        supabase.from('brands').select('*'),
        supabase.from('equipment_types').select('*'),
        supabase.from('software_licenses').select('*'),
        supabase.from('license_assignments').select('*'),
        supabase.from('teams').select('*'),
        supabase.from('team_members').select('*'),
        supabase.from('messages').select('*'),
        supabase.from('collaborator_history').select('*')
    ]);

    const check = (res: any, name: string) => { if (res.error) handleSupabaseError(res.error, `fetching ${name}`); };
    check(equipmentRes, 'equipment');
    check(instituicoesRes, 'instituicoes');
    check(entidadesRes, 'entidades');
    check(collaboratorsRes, 'collaborators');
    check(assignmentsRes, 'assignments');
    check(ticketsRes, 'tickets');
    check(ticketActivitiesRes, 'ticketActivities');
    check(brandsRes, 'brands');
    check(equipmentTypesRes, 'equipmentTypes');
    check(softwareLicensesRes, 'softwareLicenses');
    check(licenseAssignmentsRes, 'licenseAssignments');
    check(teamsRes, 'teams');
    check(teamMembersRes, 'teamMembers');
    check(messagesRes, 'messages');
    check(historyRes, 'history');

    return {
        equipment: equipmentRes.data || [],
        instituicoes: instituicoesRes.data || [],
        entidades: entidadesRes.data || [],
        collaborators: collaboratorsRes.data || [],
        assignments: assignmentsRes.data || [],
        tickets: ticketsRes.data || [],
        ticketActivities: ticketActivitiesRes.data || [],
        brands: brandsRes.data || [],
        equipmentTypes: equipmentTypesRes.data || [],
        softwareLicenses: softwareLicensesRes.data || [],
        licenseAssignments: licenseAssignmentsRes.data || [],
        teams: teamsRes.data || [],
        teamMembers: teamMembersRes.data || [],
        messages: messagesRes.data || [],
        collaboratorHistory: historyRes.data || []
    };
};

// --- Brands ---
export const fetchBrands = async () => {
    const { data, error } = await getSupabase().from('brands').select('*');
    handleSupabaseError(error, 'fetching brands');
    return data as Brand[];
};
export const addBrand = async (brand: Omit<Brand, 'id'>) => {
    const { data, error } = await getSupabase().from('brands').insert(brand).select().single();
    handleSupabaseError(error, 'adding brand');
    return data as Brand;
};
export const updateBrand = async (id: string, updates: Partial<Brand>) => {
    const { data, error } = await getSupabase().from('brands').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating brand');
    return data as Brand;
};
export const deleteBrand = async (id: string) => {
    const { error } = await getSupabase().from('brands').delete().eq('id', id);
    handleSupabaseError(error, 'deleting brand');
};

// --- Equipment Types ---
export const fetchEquipmentTypes = async () => {
    const { data, error } = await getSupabase().from('equipment_types').select('*');
    handleSupabaseError(error, 'fetching equipment types');
    return data as EquipmentType[];
};
export const addEquipmentType = async (type: Omit<EquipmentType, 'id'>) => {
    const { data, error } = await getSupabase().from('equipment_types').insert(type).select().single();
    handleSupabaseError(error, 'adding equipment type');
    return data as EquipmentType;
};
export const updateEquipmentType = async (id: string, updates: Partial<EquipmentType>) => {
    const { data, error } = await getSupabase().from('equipment_types').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating equipment type');
    return data as EquipmentType;
};
export const deleteEquipmentType = async (id: string) => {
    const { error } = await getSupabase().from('equipment_types').delete().eq('id', id);
    handleSupabaseError(error, 'deleting equipment type');
};

// --- Equipment ---
export const addEquipment = async (equipment: Omit<Equipment, 'id' | 'modifiedDate' | 'creationDate'>) => {
    const { data, error } = await getSupabase().from('equipment').insert(equipment).select().single();
    handleSupabaseError(error, 'adding equipment');
    return data as Equipment;
};
export const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    const { data, error } = await getSupabase().from('equipment').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating equipment');
    return data as Equipment;
};
export const addMultipleEquipment = async (equipmentList: any[]) => {
    const { data, error } = await getSupabase().from('equipment').insert(equipmentList).select();
    handleSupabaseError(error, 'adding multiple equipment');
    return { data };
};

// --- Collaborators ---
export const addCollaborator = async (collaborator: Omit<Collaborator, 'id'> & { id?: string }) => {
    const { data, error } = await getSupabase().from('collaborators').insert(collaborator).select().single();
    handleSupabaseError(error, 'adding collaborator');
    return data as Collaborator;
};
export const updateCollaborator = async (id: string, updates: Partial<Collaborator>) => {
    const { data, error } = await getSupabase().from('collaborators').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating collaborator');
    return data as Collaborator;
};
export const deleteCollaborator = async (id: string) => {
    const { error } = await getSupabase().from('collaborators').delete().eq('id', id);
    handleSupabaseError(error, 'deleting collaborator');
};
export const addMultipleCollaborators = async (collaborators: any[]) => {
     const { data, error } = await getSupabase().from('collaborators').insert(collaborators).select();
     handleSupabaseError(error, 'adding multiple collaborators');
     return { data };
};
export const uploadCollaboratorPhoto = async (userId: string, file: File) => {
    const supabase = getSupabase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `collaborator-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.warn('Photo upload failed (bucket might be missing), proceeding without photo URL.', uploadError);
        return null;
    }

    const { data } = supabase.storage.from('public-assets').getPublicUrl(filePath);
    return data.publicUrl;
};


// --- Instituicoes ---
export const addInstituicao = async (instituicao: Omit<Instituicao, 'id'>) => {
    const { data, error } = await getSupabase().from('instituicoes').insert(instituicao).select().single();
    handleSupabaseError(error, 'adding instituicao');
    return data as Instituicao;
};
export const updateInstituicao = async (id: string, updates: Partial<Instituicao>) => {
    const { data, error } = await getSupabase().from('instituicoes').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating instituicao');
    return data as Instituicao;
};
export const deleteInstituicao = async (id: string) => {
    const { error } = await getSupabase().from('instituicoes').delete().eq('id', id);
    handleSupabaseError(error, 'deleting instituicao');
};
export const addMultipleInstituicoes = async (instituicoes: any[]) => {
    const { data, error } = await getSupabase().from('instituicoes').insert(instituicoes).select();
    handleSupabaseError(error, 'adding multiple instituicoes');
    return { data };
};


// --- Entidades ---
export const addEntidade = async (entidade: Omit<Entidade, 'id'>) => {
    const { data, error } = await getSupabase().from('entidades').insert(entidade).select().single();
    handleSupabaseError(error, 'adding entidade');
    return data as Entidade;
};
export const updateEntidade = async (id: string, updates: Partial<Entidade>) => {
    const { data, error } = await getSupabase().from('entidades').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating entidade');
    return data as Entidade;
};
export const deleteEntidade = async (id: string) => {
    const { error } = await getSupabase().from('entidades').delete().eq('id', id);
    handleSupabaseError(error, 'deleting entidade');
};
export const addMultipleEntidades = async (entidades: any[]) => {
    const { data, error } = await getSupabase().from('entidades').insert(entidades).select();
    handleSupabaseError(error, 'adding multiple entidades');
    return { data };
};

// --- Licenses ---
export const addLicense = async (license: Omit<SoftwareLicense, 'id'>) => {
    const { data, error } = await getSupabase().from('software_licenses').insert(license).select().single();
    handleSupabaseError(error, 'adding license');
    return data as SoftwareLicense;
};
export const updateLicense = async (id: string, updates: Partial<SoftwareLicense>) => {
    const { data, error } = await getSupabase().from('software_licenses').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating license');
    return data as SoftwareLicense;
};
export const deleteLicense = async (id: string) => {
    const { error } = await getSupabase().from('software_licenses').delete().eq('id', id);
    handleSupabaseError(error, 'deleting license');
};
export const syncLicenseAssignments = async (equipmentId: string, licenseIds: string[]) => {
    const supabase = getSupabase();
    
    // Delete existing
    const { error: deleteError } = await supabase.from('license_assignments').delete().eq('equipmentId', equipmentId);
    handleSupabaseError(deleteError, 'deleting old license assignments');

    if (licenseIds.length > 0) {
        const records = licenseIds.map(lid => ({ equipmentId, softwareLicenseId: lid, assignedDate: new Date().toISOString() }));
        const { error: insertError } = await supabase.from('license_assignments').insert(records);
        handleSupabaseError(insertError, 'inserting new license assignments');
    }
};

// --- Teams ---
export const addTeam = async (team: Omit<Team, 'id'>) => {
    const { data, error } = await getSupabase().from('teams').insert(team).select().single();
    handleSupabaseError(error, 'adding team');
    return data as Team;
};
export const updateTeam = async (id: string, updates: Partial<Team>) => {
    const { data, error } = await getSupabase().from('teams').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating team');
    return data as Team;
};
export const deleteTeam = async (id: string) => {
    const { error } = await getSupabase().from('teams').delete().eq('id', id);
    handleSupabaseError(error, 'deleting team');
};
export const syncTeamMembers = async (teamId: string, memberIds: string[]) => {
    const supabase = getSupabase();
    
    // Delete existing
    const { error: deleteError } = await supabase.from('team_members').delete().eq('team_id', teamId);
    handleSupabaseError(deleteError, 'deleting old team members');

    if (memberIds.length > 0) {
        const records = memberIds.map(mid => ({ team_id: teamId, collaborator_id: mid }));
        const { error: insertError } = await supabase.from('team_members').insert(records);
        handleSupabaseError(insertError, 'inserting new team members');
    }
};

// --- Assignments ---
export const addAssignment = async (assignment: Omit<Assignment, 'id'>) => {
    const { data, error } = await getSupabase().from('assignments').insert(assignment).select().single();
    handleSupabaseError(error, 'adding assignment');
    return data as Assignment;
};
export const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    const { data, error } = await getSupabase().from('assignments').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating assignment');
    return data as Assignment;
};
export const addMultipleAssignments = async (assignments: any[]) => {
     const { data, error } = await getSupabase().from('assignments').insert(assignments).select();
     handleSupabaseError(error, 'adding multiple assignments');
     return { data };
};

// --- Tickets ---
export const addTicket = async (ticket: Omit<Ticket, 'id'>) => {
    const { data, error } = await getSupabase().from('tickets').insert(ticket).select().single();
    handleSupabaseError(error, 'adding ticket');
    return data as Ticket;
};
export const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    const { data, error } = await getSupabase().from('tickets').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating ticket');
    return data as Ticket;
};
export const addTicketActivity = async (activity: Omit<TicketActivity, 'id'>) => {
    const { data, error } = await getSupabase().from('ticket_activities').insert(activity).select().single();
    handleSupabaseError(error, 'adding ticket activity');
    return data as TicketActivity;
};

// --- Messages ---
export const addMessage = async (message: Message) => {
    const { data, error } = await getSupabase().from('messages').insert(message).select().single();
    handleSupabaseError(error, 'sending message');
    return data as Message;
};
export const markMessagesAsRead = async (senderId: string, receiverId: string) => {
     const { error } = await getSupabase().from('messages')
        .update({ read: true })
        .eq('senderId', senderId)
        .eq('receiverId', receiverId)
        .eq('read', false);
     handleSupabaseError(error, 'marking messages read');
};

// --- Notification Snoozes ---
export const fetchUserActiveSnoozes = async (userId: string): Promise<Set<string>> => {
    const supabase = getSupabase();
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('user_notification_snoozes')
        .select('reference_id')
        .eq('user_id', userId)
        .gt('snooze_until', now);

    if (error) {
        console.warn("Erro ao obter snoozes:", error);
        return new Set();
    }

    const ids = new Set<string>((data || []).map((item: any) => String(item.reference_id)));
    return ids;
};

export const snoozeNotification = async (userId: string, referenceId: string, type: 'warranty' | 'license' | 'ticket', days: number = 7): Promise<void> => {
    const supabase = getSupabase();
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + days);

    const record = {
        user_id: userId,
        reference_id: referenceId,
        notification_type: type,
        snooze_until: snoozeUntil.toISOString()
    };

    const { error } = await supabase.from('user_notification_snoozes').insert(record);
    handleSupabaseError(error, 'a adiar notificação');
};
