
import { getSupabase } from './supabaseClient';
import { Equipment, Instituicao, Entidade, Collaborator, Assignment, EquipmentType, Brand, Ticket, TicketActivity, CollaboratorHistory, Message, SoftwareLicense, LicenseAssignment, Team, TeamMember } from '../types';

// Função auxiliar para lidar com erros do Supabase de forma consistente
const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Erro em ${context}:`, error);
        throw new Error(`Erro do Supabase durante ${context}: ${error.message}`);
    }
};

// --- Funções Genéricas de CRUD ---

export const fetchData = async <T>(tableName: string): Promise<T[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from(tableName).select('*');
    handleSupabaseError(error, `a obter dados de ${tableName}`);
    return data as T[] ?? [];
};

export const fetchDataById = async <T>(tableName: string, id: string): Promise<T | null> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
    handleSupabaseError(error, `a obter dados de ${tableName} com id ${id}`);
    return data as T | null;
};


const insertData = async <T>(tableName: string, record: Partial<T>): Promise<T> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from(tableName).insert(record as any).select();
    handleSupabaseError(error, `a inserir em ${tableName}`);
    if (!data) throw new Error("A inserção não retornou dados.");
    return data[0] as T;
};


export const updateData = async <T>(tableName: string, id: string, updates: Partial<T>): Promise<T> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from(tableName).update(updates as any).eq('id', id).select();
    handleSupabaseError(error, `a atualizar em ${tableName}`);
    if (!data) throw new Error("A atualização não retornou dados.");
    return data[0] as T;
};


export const deleteData = async (tableName: string, id: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    handleSupabaseError(error, `a eliminar de ${tableName}`);
};

// --- Helpers de Mapeamento para Tickets ---

const mapTicketFromDb = (dbTicket: any): Ticket => ({
    ...dbTicket,
    title: dbTicket.title,
    entidadeId: dbTicket.entidadeId || dbTicket.entidade_id,
    collaboratorId: dbTicket.collaboratorId || dbTicket.collaborator_id,
    technicianId: dbTicket.technicianId || dbTicket.technician_id,
    equipmentId: dbTicket.equipmentId || dbTicket.equipment_id,
    requestDate: dbTicket.requestDate || dbTicket.request_date,
    finishDate: dbTicket.finishDate || dbTicket.finish_date,
    team_id: dbTicket.team_id || dbTicket.teamId,
});

const mapTicketToDb = (ticket: Partial<Ticket>): any => {
    // Envia camelCase para manter compatibilidade com o esquema original
    return ticket;
};

// --- Helpers de Mapeamento para TicketActivity ---

const mapTicketActivityFromDb = (dbActivity: any): TicketActivity => ({
    ...dbActivity,
    ticketId: dbActivity.ticketId || dbActivity.ticket_id,
    technicianId: dbActivity.technicianId || dbActivity.technician_id,
    equipmentId: dbActivity.equipmentId || dbActivity.equipment_id,
});

const mapTicketActivityToDb = (activity: Partial<TicketActivity>): any => {
    // Envia camelCase
    return activity;
};

// --- Helpers de Mapeamento para SoftwareLicense ---

const mapLicenseFromDb = (db: any): SoftwareLicense => ({
    ...db,
    productName: db.productName || db.product_name,
    licenseKey: db.licenseKey || db.license_key,
    totalSeats: db.totalSeats || db.total_seats,
    purchaseDate: db.purchaseDate || db.purchase_date,
    expiryDate: db.expiryDate || db.expiry_date,
    purchaseEmail: db.purchaseEmail || db.purchase_email,
    invoiceNumber: db.invoiceNumber || db.invoice_number,
    status: db.status,
});

const mapLicenseToDb = (app: Partial<SoftwareLicense>): any => {
    // Mapeamento para snake_case para corresponder à base de dados atualizada
    const db: any = { ...app };

    if ('productName' in db) { db.product_name = db.productName; delete db.productName; }
    if ('licenseKey' in db) { db.license_key = db.licenseKey; delete db.licenseKey; }
    if ('totalSeats' in db) { db.total_seats = db.totalSeats; delete db.totalSeats; }
    if ('purchaseDate' in db) { db.purchase_date = db.purchaseDate; delete db.purchaseDate; }
    if ('expiryDate' in db) { db.expiry_date = db.expiryDate; delete db.expiryDate; }
    if ('purchaseEmail' in db) { db.purchase_email = db.purchaseEmail; delete db.purchaseEmail; }
    if ('invoiceNumber' in db) { db.invoice_number = db.invoiceNumber; delete db.invoiceNumber; }
    
    return db;
};

// --- Helpers de Mapeamento para LicenseAssignment ---

const mapLicenseAssignmentFromDb = (db: any): LicenseAssignment => ({
    id: db.id,
    softwareLicenseId: db.softwareLicenseId || db.software_license_id,
    equipmentId: db.equipmentId || db.equipment_id,
    assignedDate: db.assignedDate || db.assigned_date,
});


// --- Funções de Serviço Específicas ---

export const fetchAllData = async () => {
    const [
        equipment, instituicoes, entidades, collaborators, equipmentTypes, brands,
        assignments, ticketsRaw, ticketActivitiesRaw, collaboratorHistory, messages,
        softwareLicensesRaw, licenseAssignmentsRaw, teams, teamMembers
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
        fetchData<any>('software_license'),
        fetchData<any>('license_assignment'),
        fetchData<Team>('teams'),
        fetchData<TeamMember>('team_members'),
    ]);

    const tickets = ticketsRaw.map(mapTicketFromDb);
    const ticketActivities = ticketActivitiesRaw.map(mapTicketActivityFromDb);
    const softwareLicenses = softwareLicensesRaw.map(mapLicenseFromDb);
    const licenseAssignments = licenseAssignmentsRaw.map(mapLicenseAssignmentFromDb);

    return {
        equipment, instituicoes, entidades, collaborators, equipmentTypes, brands,
        assignments, tickets, ticketActivities, collaboratorHistory, messages,
        softwareLicenses, licenseAssignments, teams, teamMembers
    };
};

// Equipment
export const addEquipment = (record: Equipment) => insertData('equipment', record);
export const addMultipleEquipment = (records: any[]) => {
    const supabase = getSupabase();
    return supabase.from('equipment').insert(records).select();
};
export const updateEquipment = (id: string, updates: Partial<Equipment>) => updateData('equipment', id, updates);
export const deleteEquipment = (id: string) => deleteData('equipment', id);

// Instituicao
export const addInstituicao = (record: Instituicao) => insertData('instituicao', record);
export const updateInstituicao = (id: string, updates: Partial<Instituicao>) => updateData('instituicao', id, updates);
export const deleteInstituicao = (id: string) => deleteData('instituicao', id);
export const addMultipleInstituicoes = (records: any[]) => {
    const supabase = getSupabase();
    return supabase.from('instituicao').insert(records).select();
};

// Entidade
export const addEntidade = (record: Entidade) => insertData('entidade', record);
export const updateEntidade = (id: string, updates: Partial<Entidade>) => updateData('entidade', id, updates);
export const deleteEntidade = (id: string) => deleteData('entidade', id);
export const addMultipleEntidades = (records: any[]) => {
    const supabase = getSupabase();
    return supabase.from('entidade').insert(records).select();
};


// Collaborator
export const addCollaborator = (record: Collaborator) => insertData('collaborator', record);
export const updateCollaborator = (id: string, updates: Partial<Omit<Collaborator, 'id'>>) => updateData('collaborator', id, updates);
export const deleteCollaborator = (id: string) => deleteData('collaborator', id);
export const addMultipleCollaborators = (records: any[]) => {
    const supabase = getSupabase();
    return supabase.from('collaborator').insert(records).select();
};
export const uploadCollaboratorPhoto = async (userId: string, file: File): Promise<string | null> => {
    const supabase = getSupabase();
    const filePath = `${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
        .from('collaborator-photos')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        handleSupabaseError(uploadError, 'a carregar a foto do colaborador');
        return null;
    }

    const { data } = supabase.storage.from('collaborator-photos').getPublicUrl(filePath);
    return data.publicUrl;
};


// Assignment
export const addAssignment = (record: Assignment) => insertData('assignment', record);
export const addMultipleAssignments = (records: any[]) => {
    const supabase = getSupabase();
    return supabase.from('assignment').insert(records).select();
};
export const updateAssignment = (id: string, updates: Partial<Assignment>) => updateData('assignment', id, updates);

// EquipmentType
export const addEquipmentType = (record: Omit<EquipmentType, 'id'>) => insertData<EquipmentType>('equipment_type', record);
export const updateEquipmentType = (id: string, updates: Partial<EquipmentType>) => updateData('equipment_type', id, updates);
export const deleteEquipmentType = (id: string) => deleteData('equipment_type', id);

// Brand
export const addBrand = (record: Omit<Brand, 'id'>) => insertData<Brand>('brand', record);
export const updateBrand = (id: string, updates: Partial<Brand>) => updateData('brand', id, updates);
export const deleteBrand = (id: string) => deleteData('brand', id);

// Ticket
export const addTicket = async (record: Ticket): Promise<Ticket> => {
    const dbRecord = mapTicketToDb(record);
    const supabase = getSupabase();
    const { data, error } = await supabase.from('ticket').insert(dbRecord).select();
    handleSupabaseError(error, `a inserir em ticket`);
    if (!data) throw new Error("A inserção não retornou dados.");
    return mapTicketFromDb(data[0]);
};

export const updateTicket = async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
    const dbUpdates = mapTicketToDb(updates);
    const supabase = getSupabase();
    const { data, error } = await supabase.from('ticket').update(dbUpdates).eq('id', id).select();
    handleSupabaseError(error, `a atualizar em ticket`);
    if (!data) throw new Error("A atualização não retornou dados.");
    return mapTicketFromDb(data[0]);
};

// TicketActivity
export const addTicketActivity = async (record: TicketActivity): Promise<TicketActivity> => {
    const dbRecord = mapTicketActivityToDb(record);
    const supabase = getSupabase();
    const { data, error } = await supabase.from('ticket_activity').insert(dbRecord).select();
    handleSupabaseError(error, `a inserir em ticket_activity`);
    if (!data) throw new Error("A inserção não retornou dados.");
    return mapTicketActivityFromDb(data[0]);
};

export const updateTicketActivity = async (id: string, updates: Partial<TicketActivity>): Promise<TicketActivity> => {
    const dbUpdates = mapTicketActivityToDb(updates);
    const supabase = getSupabase();
    const { data, error } = await supabase.from('ticket_activity').update(dbUpdates).eq('id', id).select();
    handleSupabaseError(error, `a atualizar em ticket_activity`);
    if (!data) throw new Error("A atualização não retornou dados.");
    return mapTicketActivityFromDb(data[0]);
};

// CollaboratorHistory
export const addCollaboratorHistory = (record: CollaboratorHistory) => insertData('collaborator_history', record);
export const updateCollaboratorHistory = (id: string, updates: Partial<CollaboratorHistory>) => updateData('collaborator_history', id, updates);

// Message
export const addMessage = (record: Message) => insertData('message', record);
export const updateMessage = (id: string, updates: Partial<Message>) => updateData('message', id, updates);
export const markMessagesAsRead = (senderId: string, receiverId: string) => {
    const supabase = getSupabase();
    return supabase.from('message')
        .update({ read: true })
        .eq('senderId', senderId)
        .eq('receiverId', receiverId)
        .eq('read', false);
};

// SoftwareLicense
export const addLicense = async (record: SoftwareLicense): Promise<SoftwareLicense> => {
    const dbRecord = mapLicenseToDb(record);
    const supabase = getSupabase();
    const { data, error } = await supabase.from('software_license').insert(dbRecord).select();
    handleSupabaseError(error, `a inserir em software_license`);
    if (!data) throw new Error("A inserção não retornou dados.");
    return mapLicenseFromDb(data[0]);
};

export const updateLicense = async (id: string, updates: Partial<SoftwareLicense>): Promise<SoftwareLicense> => {
    const dbUpdates = mapLicenseToDb(updates);
    const supabase = getSupabase();
    const { data, error } = await supabase.from('software_license').update(dbUpdates).eq('id', id).select();
    handleSupabaseError(error, `a atualizar em software_license`);
    if (!data) throw new Error("A atualização não retornou dados.");
    return mapLicenseFromDb(data[0]);
};
export const deleteLicense = (id: string) => deleteData('software_license', id);

// LicenseAssignment
export const syncLicenseAssignments = async (equipmentId: string, licenseIds: string[]) => {
    const supabase = getSupabase();

    // 1. Determine columns. Try standard snake_case first by checking a dummy select.
    // We attempt to select the 'equipment_id' column from one row. 
    // If this throws an error, we know snake_case is not being used.
    let colEquipmentId = 'equipment_id';
    let colLicenseId = 'software_license_id';
    let colAssignedDate = 'assigned_date';

    const { error: checkError } = await supabase.from('license_assignment').select('equipment_id').limit(1);

    if (checkError) {
        // If snake_case failed, assume camelCase (legacy/user created)
        console.warn("Detected potential schema mismatch (snake_case failed). Falling back to camelCase for license_assignment columns.");
        colEquipmentId = 'equipmentId';
        colLicenseId = 'softwareLicenseId';
        colAssignedDate = 'assignedDate';
    }

    // 2. Get current assignments for this equipment
    const { data: currentAssignments, error: fetchError } = await supabase
        .from('license_assignment')
        .select(`id, ${colLicenseId}`)
        .eq(colEquipmentId, equipmentId);
        
    handleSupabaseError(fetchError, 'a obter atribuições de licença');

    const currentLicenseIds = new Set(currentAssignments?.map((a: any) => a[colLicenseId]));
    const newLicenseIds = new Set(licenseIds);

    // 3. Determine which to add and which to remove
    const toAdd = licenseIds.filter(id => !currentLicenseIds.has(id));
    const toRemove = currentAssignments?.filter((a: any) => !newLicenseIds.has(a[colLicenseId])).map((a: any) => a.id) || [];

    // 4. Perform deletions
    if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
            .from('license_assignment')
            .delete()
            .in('id', toRemove);
        handleSupabaseError(deleteError, 'a apagar atribuições de licença');
    }

    // 5. Perform insertions
    if (toAdd.length > 0) {
        // Prepare records with dynamic keys
        const newRecords = toAdd.map(licenseId => ({
            [colEquipmentId]: equipmentId,
            [colLicenseId]: licenseId,
            [colAssignedDate]: new Date().toISOString().split('T')[0],
            id: crypto.randomUUID(),
        }));

        // Try insert
        const { error: insertError } = await supabase
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
    const supabase = getSupabase();

    // 1. Delete all existing members for the team
    const { error: deleteError } = await supabase.from('team_members').delete().eq('team_id', teamId);
    handleSupabaseError(deleteError, 'a remover membros antigos da equipa');

    // 2. Insert new members if any
    if (memberIds.length > 0) {
        const newMembers = memberIds.map(collaborator_id => ({
            team_id: teamId,
            collaborator_id
        }));
        const { error: insertError } = await supabase.from('team_members').insert(newMembers);
        handleSupabaseError(insertError, 'a adicionar novos membros à equipa');
    }
};

