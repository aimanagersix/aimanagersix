
import { getSupabase } from './supabaseClient';
import { Equipment, Instituicao, Entidade, Collaborator, Assignment, EquipmentType, Brand, Ticket, TicketActivity, CollaboratorHistory, Message, SoftwareLicense, LicenseAssignment, Team, TeamMember } from '../types';

// Função auxiliar para lidar com erros do Supabase de forma consistente
const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Erro em ${context}:`, error);
        throw new Error(`Erro do Supabase durante ${context}: ${error.message}`);
    }
};

// Função robusta para gerar UUIDs (funciona em contextos seguros e não seguros)
export const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch (e) {
            // Em alguns navegadores/contextos, randomUUID pode falhar
            console.warn("crypto.randomUUID falhou, a usar fallback", e);
        }
    }
    // Fallback simples compatível com todos os navegadores
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// --- Funções Genéricas de CRUD (Internal Use) ---

const insertData = async (tableName: string, record: any): Promise<any> => {
    const supabase = getSupabase();
    
    // Garante que existe um ID. Se não vier preenchido ou for vazio, gera um novo UUID.
    // Isto previne erros de "null value in column id" se a DB não tiver default gen_random_uuid().
    if (!record.id) {
        record.id = generateUUID();
    }
    
    const { data, error } = await supabase.from(tableName).insert(record).select();
    handleSupabaseError(error, `a inserir em ${tableName}`);
    if (!data || data.length === 0) throw new Error("A inserção não retornou dados.");
    return data[0];
};

const updateData = async (tableName: string, id: string, updates: any): Promise<any> => {
    const supabase = getSupabase();
    // Ensure we don't try to update the id itself or send empty id
    if (updates.id) delete updates.id;

    const { data, error } = await supabase.from(tableName).update(updates).eq('id', id).select();
    handleSupabaseError(error, `a atualizar em ${tableName}`);
    if (!data || data.length === 0) throw new Error("A atualização não retornou dados.");
    return data[0];
};

const deleteData = async (tableName: string, id: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    handleSupabaseError(error, `a eliminar de ${tableName}`);
};

const fetchDataInternal = async (tableName: string): Promise<any[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from(tableName).select('*');
    handleSupabaseError(error, `a obter dados de ${tableName}`);
    return data || [];
};

// --- MAPPERS (Bidirecionais: App camelCase <-> DB snake_case) ---

const cleanDbRecord = (db: any) => {
    // Utility to clean undefined values and ensure empty strings for IDs/Dates are removed
    // This prevents "invalid input syntax for type uuid" or "date" errors in Supabase
    Object.keys(db).forEach(key => {
        const value = db[key];
        if (value === undefined) {
            delete db[key];
        } else if (typeof value === 'string' && value === '') {
            // Remove empty strings for IDs and Dates to allow DB to set NULL or Default
            // NOTA: O insertData irá gerar um ID se a chave 'id' for removida aqui, o que é o comportamento desejado para novos registos.
            if (key === 'id' || key.endsWith('_id') || key.endsWith('_date') || key === 'date') {
                delete db[key];
            }
        }
    });
    return db;
};

// Equipment
const mapEquipmentFromDb = (db: any): Equipment => ({
    ...db,
    brandId: db.brand_id,
    typeId: db.type_id,
    serialNumber: db.serial_number,
    inventoryNumber: db.inventory_number,
    invoiceNumber: db.invoice_number,
    nomeNaRede: db.nome_na_rede,
    macAddressWIFI: db.mac_address_wifi,
    macAddressCabo: db.mac_address_cabo,
    purchaseDate: db.purchase_date,
    warrantyEndDate: db.warranty_end_date,
    creationDate: db.creation_date,
    modifiedDate: db.modified_date,
});
const mapEquipmentToDb = (eq: Partial<Equipment>): any => {
    const db: any = { ...eq };
    if ('brandId' in db) { db.brand_id = db.brandId; delete db.brandId; }
    if ('typeId' in db) { db.type_id = db.typeId; delete db.typeId; }
    if ('serialNumber' in db) { db.serial_number = db.serialNumber; delete db.serialNumber; }
    if ('inventoryNumber' in db) { db.inventory_number = db.inventoryNumber; delete db.inventoryNumber; }
    if ('invoiceNumber' in db) { db.invoice_number = db.invoiceNumber; delete db.invoiceNumber; }
    if ('nomeNaRede' in db) { db.nome_na_rede = db.nomeNaRede; delete db.nomeNaRede; }
    if ('macAddressWIFI' in db) { db.mac_address_wifi = db.macAddressWIFI; delete db.macAddressWIFI; }
    if ('macAddressCabo' in db) { db.mac_address_cabo = db.macAddressCabo; delete db.macAddressCabo; }
    if ('purchaseDate' in db) { db.purchase_date = db.purchaseDate; delete db.purchaseDate; }
    if ('warrantyEndDate' in db) { db.warranty_end_date = db.warrantyEndDate; delete db.warrantyEndDate; }
    if ('creationDate' in db) { db.creation_date = db.creationDate; delete db.creationDate; }
    if ('modifiedDate' in db) { db.modified_date = db.modifiedDate; delete db.modifiedDate; }
    return cleanDbRecord(db);
};

// EquipmentType
const mapEquipmentTypeFromDb = (db: any): EquipmentType => ({
    ...db,
    requiresNomeNaRede: db.requires_nome_na_rede,
    requiresMacWIFI: db.requires_mac_wifi,
    requiresMacCabo: db.requires_mac_cabo,
    requiresInventoryNumber: db.requires_inventory_number,
    default_team_id: db.default_team_id,
});
const mapEquipmentTypeToDb = (et: Partial<EquipmentType>): any => {
    const db: any = { ...et };
    if ('requiresNomeNaRede' in db) { db.requires_nome_na_rede = db.requiresNomeNaRede; delete db.requiresNomeNaRede; }
    if ('requiresMacWIFI' in db) { db.requires_mac_wifi = db.requiresMacWIFI; delete db.requiresMacWIFI; }
    if ('requiresMacCabo' in db) { db.requires_mac_cabo = db.requiresMacCabo; delete db.requiresMacCabo; }
    if ('requiresInventoryNumber' in db) { db.requires_inventory_number = db.requiresInventoryNumber; delete db.requiresInventoryNumber; }
    if ('default_team_id' in db) { db.default_team_id = db.default_team_id; delete db.default_team_id; }
    return cleanDbRecord(db);
};

// Entidade
const mapEntidadeFromDb = (db: any): Entidade => ({
    ...db,
    instituicaoId: db.instituicao_id,
    telefoneInterno: db.telefone_interno,
});
const mapEntidadeToDb = (ent: Partial<Entidade>): any => {
    const db: any = { ...ent };
    if ('instituicaoId' in db) { db.instituicao_id = db.instituicaoId; delete db.instituicaoId; }
    if ('telefoneInterno' in db) { db.telefone_interno = db.telefoneInterno; delete db.telefoneInterno; }
    return cleanDbRecord(db);
};

// Instituicao
const mapInstituicaoFromDb = (db: any): Instituicao => ({ ...db });
const mapInstituicaoToDb = (inst: Partial<Instituicao>): any => cleanDbRecord({ ...inst });

// Collaborator
const mapCollaboratorFromDb = (db: any): Collaborator => ({
    ...db,
    numeroMecanografico: db.numero_mecanografico,
    fullName: db.full_name,
    entidadeId: db.entidade_id,
    telefoneInterno: db.telefone_interno,
    canLogin: db.can_login,
    receivesNotifications: db.receives_notifications,
    photoUrl: db.photo_url,
    dateOfBirth: db.date_of_birth,
    allowedModules: db.allowed_modules || [],
});
const mapCollaboratorToDb = (col: Partial<Collaborator>): any => {
    const db: any = { ...col };
    if ('numeroMecanografico' in db) { db.numero_mecanografico = db.numeroMecanografico; delete db.numeroMecanografico; }
    if ('fullName' in db) { db.full_name = db.fullName; delete db.fullName; }
    if ('entidadeId' in db) { db.entidade_id = db.entidadeId; delete db.entidadeId; }
    if ('telefoneInterno' in db) { db.telefone_interno = db.telefoneInterno; delete db.telefoneInterno; }
    if ('canLogin' in db) { db.can_login = db.canLogin; delete db.canLogin; }
    if ('receivesNotifications' in db) { db.receives_notifications = db.receivesNotifications; delete db.receivesNotifications; }
    if ('photoUrl' in db) { db.photo_url = db.photoUrl; delete db.photoUrl; }
    if ('dateOfBirth' in db) { db.date_of_birth = db.dateOfBirth; delete db.dateOfBirth; }
    if ('allowedModules' in db) { db.allowed_modules = db.allowedModules; delete db.allowedModules; }
    return cleanDbRecord(db);
};

// Assignment
const mapAssignmentFromDb = (db: any): Assignment => ({
    ...db,
    equipmentId: db.equipment_id,
    entidadeId: db.entidade_id,
    collaboratorId: db.collaborator_id,
    assignedDate: db.assigned_date,
    returnDate: db.return_date,
});
const mapAssignmentToDb = (assign: Partial<Assignment>): any => {
    const db: any = { ...assign };
    if ('equipmentId' in db) { db.equipment_id = db.equipmentId; delete db.equipmentId; }
    if ('entidadeId' in db) { db.entidade_id = db.entidadeId; delete db.entidadeId; }
    if ('collaboratorId' in db) { db.collaborator_id = db.collaboratorId; delete db.collaboratorId; }
    if ('assignedDate' in db) { db.assigned_date = db.assignedDate; delete db.assignedDate; }
    if ('returnDate' in db) { db.return_date = db.returnDate; delete db.returnDate; }
    return cleanDbRecord(db);
};

// Ticket
const mapTicketFromDb = (dbTicket: any): Ticket => ({
    ...dbTicket,
    entidadeId: dbTicket.entidade_id,
    collaboratorId: dbTicket.collaborator_id,
    technicianId: dbTicket.technician_id,
    equipmentId: dbTicket.equipment_id,
    requestDate: dbTicket.request_date,
    finishDate: dbTicket.finish_date,
    team_id: dbTicket.team_id, 
});
const mapTicketToDb = (ticket: Partial<Ticket>): any => {
    const db: any = { ...ticket };
    if ('entidadeId' in db) { db.entidade_id = db.entidadeId; delete db.entidadeId; }
    if ('collaboratorId' in db) { db.collaborator_id = db.collaboratorId; delete db.collaboratorId; }
    if ('technicianId' in db) { db.technician_id = db.technicianId; delete db.technicianId; }
    if ('equipmentId' in db) { db.equipment_id = db.equipmentId; delete db.equipmentId; }
    if ('requestDate' in db) { db.request_date = db.requestDate; delete db.requestDate; }
    if ('finishDate' in db) { db.finish_date = db.finishDate; delete db.finishDate; }
    return cleanDbRecord(db);
};

// TicketActivity
const mapTicketActivityFromDb = (db: any): TicketActivity => ({
    ...db,
    ticketId: db.ticket_id,
    technicianId: db.technician_id,
    equipmentId: db.equipment_id,
});
const mapTicketActivityToDb = (act: Partial<TicketActivity>): any => {
    const db: any = { ...act };
    if ('ticketId' in db) { db.ticket_id = db.ticketId; delete db.ticketId; }
    if ('technicianId' in db) { db.technician_id = db.technicianId; delete db.technicianId; }
    if ('equipmentId' in db) { db.equipment_id = db.equipmentId; delete db.equipmentId; }
    return cleanDbRecord(db);
};

// License
const mapLicenseFromDb = (db: any): SoftwareLicense => ({
    ...db,
    productName: db.product_name,
    licenseKey: db.license_key,
    totalSeats: db.total_seats,
    purchaseDate: db.purchase_date,
    expiryDate: db.expiry_date,
    purchaseEmail: db.purchase_email,
    invoiceNumber: db.invoice_number,
});
const mapLicenseToDb = (lic: Partial<SoftwareLicense>): any => {
    const db: any = { ...lic };
    if ('productName' in db) { db.product_name = db.productName; delete db.productName; }
    if ('licenseKey' in db) { db.license_key = db.licenseKey; delete db.licenseKey; }
    if ('totalSeats' in db) { db.total_seats = db.totalSeats; delete db.totalSeats; }
    if ('purchaseDate' in db) { db.purchase_date = db.purchaseDate; delete db.purchaseDate; }
    if ('expiryDate' in db) { db.expiry_date = db.expiryDate; delete db.expiryDate; }
    if ('purchaseEmail' in db) { db.purchase_email = db.purchaseEmail; delete db.purchaseEmail; }
    if ('invoiceNumber' in db) { db.invoice_number = db.invoiceNumber; delete db.invoiceNumber; }
    return cleanDbRecord(db);
};

// License Assignment
const mapLicenseAssignmentFromDb = (db: any): LicenseAssignment => ({
    id: db.id,
    softwareLicenseId: db.software_license_id,
    equipmentId: db.equipment_id,
    assignedDate: db.assigned_date,
});

// Collaborator History
const mapCollaboratorHistoryFromDb = (db: any): CollaboratorHistory => ({
    ...db,
    collaboratorId: db.collaborator_id,
    entidadeId: db.entidade_id,
    startDate: db.start_date,
    endDate: db.end_date,
});
const mapCollaboratorHistoryToDb = (hist: Partial<CollaboratorHistory>): any => {
    const db: any = { ...hist };
    if ('collaboratorId' in db) { db.collaborator_id = db.collaborator_id; delete db.collaboratorId; }
    if ('entidadeId' in db) { db.entidade_id = db.entidade_id; delete db.entidadeId; }
    if ('startDate' in db) { db.start_date = db.startDate; delete db.startDate; }
    if ('endDate' in db) { db.end_date = db.endDate; delete db.endDate; }
    return cleanDbRecord(db);
};

// Message
const mapMessageFromDb = (db: any): Message => ({
    ...db,
    senderId: db.sender_id,
    receiverId: db.receiver_id,
});
const mapMessageToDb = (msg: Partial<Message>): any => {
    const db: any = { ...msg };
    if ('senderId' in db) { db.sender_id = db.senderId; delete db.senderId; }
    if ('receiverId' in db) { db.receiver_id = db.receiverId; delete db.receiverId; }
    return cleanDbRecord(db);
};


// --- SERVIÇOS ---

export const fetchAllData = async () => {
    const [
        equipmentRaw, instituicoesRaw, entidadesRaw, collaboratorsRaw, equipmentTypesRaw, brands,
        assignmentsRaw, ticketsRaw, ticketActivitiesRaw, collaboratorHistoryRaw, messagesRaw,
        softwareLicensesRaw, licenseAssignmentsRaw, teams, teamMembers
    ] = await Promise.all([
        fetchDataInternal('equipment'),
        fetchDataInternal('instituicao'),
        fetchDataInternal('entidade'),
        fetchDataInternal('collaborator'),
        fetchDataInternal('equipment_type'),
        fetchDataInternal('brand'),
        fetchDataInternal('assignment'),
        fetchDataInternal('ticket'),
        fetchDataInternal('ticket_activity'),
        fetchDataInternal('collaborator_history'),
        fetchDataInternal('message'),
        fetchDataInternal('software_license'),
        fetchDataInternal('license_assignment'),
        fetchDataInternal('teams'),
        fetchDataInternal('team_members'),
    ]);

    return {
        equipment: equipmentRaw.map(mapEquipmentFromDb),
        instituicoes: instituicoesRaw.map(mapInstituicaoFromDb),
        entidades: entidadesRaw.map(mapEntidadeFromDb),
        collaborators: collaboratorsRaw.map(mapCollaboratorFromDb),
        equipmentTypes: equipmentTypesRaw.map(mapEquipmentTypeFromDb),
        brands: brands, 
        assignments: assignmentsRaw.map(mapAssignmentFromDb),
        tickets: ticketsRaw.map(mapTicketFromDb),
        ticketActivities: ticketActivitiesRaw.map(mapTicketActivityFromDb),
        collaboratorHistory: collaboratorHistoryRaw.map(mapCollaboratorHistoryFromDb),
        messages: messagesRaw.map(mapMessageFromDb),
        softwareLicenses: softwareLicensesRaw.map(mapLicenseFromDb),
        licenseAssignments: licenseAssignmentsRaw.map(mapLicenseAssignmentFromDb),
        teams,
        teamMembers
    };
};

export const fetchBrands = async (): Promise<Brand[]> => {
    const data = await fetchDataInternal('brand');
    return data as Brand[];
};

export const fetchEquipmentTypes = async (): Promise<EquipmentType[]> => {
    const data = await fetchDataInternal('equipment_type');
    return data.map(mapEquipmentTypeFromDb);
};


// Equipment
export const addEquipment = async (record: Omit<Equipment, 'id' | 'creationDate' | 'modifiedDate'>) => {
    const dbRecord = mapEquipmentToDb(record);
    const res = await insertData('equipment', dbRecord);
    return mapEquipmentFromDb(res);
};
export const addMultipleEquipment = (records: any[]) => {
    const supabase = getSupabase();
    const dbRecords = records.map(r => {
        const db = mapEquipmentToDb(r);
        if (!db.id) db.id = generateUUID();
        return db;
    });
    return supabase.from('equipment').insert(dbRecords).select();
};
export const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    const dbUpdates = mapEquipmentToDb(updates);
    const res = await updateData('equipment', id, dbUpdates);
    return mapEquipmentFromDb(res);
};
export const deleteEquipment = (id: string) => deleteData('equipment', id);

// Instituicao
export const addInstituicao = async (record: Omit<Instituicao, 'id'>) => {
    const dbRecord = mapInstituicaoToDb(record);
    const res = await insertData('instituicao', dbRecord);
    return mapInstituicaoFromDb(res);
};
export const updateInstituicao = async (id: string, updates: Partial<Instituicao>) => {
    const dbUpdates = mapInstituicaoToDb(updates);
    const res = await updateData('instituicao', id, dbUpdates);
    return mapInstituicaoFromDb(res);
};
export const deleteInstituicao = (id: string) => deleteData('instituicao', id);
export const addMultipleInstituicoes = (records: any[]) => {
    const supabase = getSupabase();
    const dbRecords = records.map(r => {
        const db = mapInstituicaoToDb(r);
        if (!db.id) db.id = generateUUID();
        return db;
    });
    return supabase.from('instituicao').insert(dbRecords).select();
};

// Entidade
export const addEntidade = async (record: Omit<Entidade, 'id'>) => {
    const dbRecord = mapEntidadeToDb(record);
    const res = await insertData('entidade', dbRecord);
    return mapEntidadeFromDb(res);
};
export const updateEntidade = async (id: string, updates: Partial<Entidade>) => {
    const dbUpdates = mapEntidadeToDb(updates);
    const res = await updateData('entidade', id, dbUpdates);
    return mapEntidadeFromDb(res);
};
export const deleteEntidade = (id: string) => deleteData('entidade', id);
export const addMultipleEntidades = (records: any[]) => {
    const supabase = getSupabase();
    const dbRecords = records.map(r => {
        const db = mapEntidadeToDb(r);
        if (!db.id) db.id = generateUUID();
        return db;
    });
    return supabase.from('entidade').insert(dbRecords).select();
};


// Collaborator
export const addCollaborator = async (record: Omit<Collaborator, 'id'> | Collaborator): Promise<Collaborator> => {
    const dataToProcess = { ...record };
    
    // FIX: Postgres constraint workaround. 
    // If the DB table 'collaborator' has a 'password' column set to NOT NULL, 
    // we must provide a value even if the user cannot login.
    // We generate a random dummy password that is never shown to the user.
    if (!dataToProcess.password) {
        dataToProcess.password = generateUUID(); 
    }

    const dbRecord = mapCollaboratorToDb(dataToProcess);
    // Se já tiver ID (ex: do auth), usa-o. Se não, insertData gera um novo.
    const res = await insertData('collaborator', dbRecord);
    return mapCollaboratorFromDb(res);
};

export const updateCollaborator = async (id: string, updates: Partial<Collaborator>): Promise<Collaborator> => {
    const dbUpdates = mapCollaboratorToDb(updates);
    const res = await updateData('collaborator', id, dbUpdates);
    return mapCollaboratorFromDb(res);
};

export const deleteCollaborator = (id: string) => deleteData('collaborator', id);
export const addMultipleCollaborators = (records: any[]) => {
    const supabase = getSupabase();
    const dbRecords = records.map(r => {
        const dataWithPass = { ...r };
        // Also handle dummy password for bulk imports
        if (!dataWithPass.password) {
            dataWithPass.password = generateUUID();
        }
        const db = mapCollaboratorToDb(dataWithPass);
        if (!db.id) db.id = generateUUID();
        return db;
    });
    return supabase.from('collaborator').insert(dbRecords).select();
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
export const addAssignment = async (record: Omit<Assignment, 'id'>) => {
    const dbRecord = mapAssignmentToDb(record);
    const res = await insertData('assignment', dbRecord);
    return mapAssignmentFromDb(res);
};
export const addMultipleAssignments = (records: any[]) => {
    const supabase = getSupabase();
    const dbRecords = records.map(r => {
        const db = mapAssignmentToDb(r);
        if (!db.id) db.id = generateUUID();
        return db;
    });
    return supabase.from('assignment').insert(dbRecords).select();
};
export const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    const dbUpdates = mapAssignmentToDb(updates);
    const res = await updateData('assignment', id, dbUpdates);
    return mapAssignmentFromDb(res);
};

// EquipmentType
export const addEquipmentType = async (record: Omit<EquipmentType, 'id'>) => {
    const dbRecord = mapEquipmentTypeToDb(record);
    const res = await insertData('equipment_type', dbRecord);
    return mapEquipmentTypeFromDb(res);
};
export const updateEquipmentType = async (id: string, updates: Partial<EquipmentType>) => {
    const dbUpdates = mapEquipmentTypeToDb(updates);
    const res = await updateData('equipment_type', id, dbUpdates);
    return mapEquipmentTypeFromDb(res);
};
export const deleteEquipmentType = (id: string) => deleteData('equipment_type', id);

// Brand
export const addBrand = (record: Omit<Brand, 'id'>) => insertData('brand', record);
export const updateBrand = (id: string, updates: Partial<Brand>) => updateData('brand', id, updates);
export const deleteBrand = (id: string) => deleteData('brand', id);

// Ticket
export const addTicket = async (record: Omit<Ticket, 'id'>): Promise<Ticket> => {
    const dbRecord = mapTicketToDb(record);
    const res = await insertData('ticket', dbRecord);
    return mapTicketFromDb(res);
};

export const updateTicket = async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
    const dbUpdates = mapTicketToDb(updates);
    const res = await updateData('ticket', id, dbUpdates);
    return mapTicketFromDb(res);
};

// TicketActivity
export const addTicketActivity = async (record: Omit<TicketActivity, 'id'>): Promise<TicketActivity> => {
    const dbRecord = mapTicketActivityToDb(record);
    const res = await insertData('ticket_activity', dbRecord);
    return mapTicketActivityFromDb(res);
};

export const updateTicketActivity = async (id: string, updates: Partial<TicketActivity>): Promise<TicketActivity> => {
    const dbUpdates = mapTicketActivityToDb(updates);
    const res = await updateData('ticket_activity', id, dbUpdates);
    return mapTicketActivityFromDb(res);
};

// CollaboratorHistory
export const addCollaboratorHistory = async (record: Omit<CollaboratorHistory, 'id'>) => {
    const dbRecord = mapCollaboratorHistoryToDb(record);
    const res = await insertData('collaborator_history', dbRecord);
    return mapCollaboratorHistoryFromDb(res);
};
export const updateCollaboratorHistory = async (id: string, updates: Partial<CollaboratorHistory>) => {
    const dbUpdates = mapCollaboratorHistoryToDb(updates);
    const res = await updateData('collaborator_history', id, dbUpdates);
    return mapCollaboratorHistoryFromDb(res);
};

// Message
export const addMessage = async (record: Message) => {
    const dbRecord = mapMessageToDb(record);
    const res = await insertData('message', dbRecord);
    return mapMessageFromDb(res);
};
export const updateMessage = async (id: string, updates: Partial<Message>) => {
    const dbUpdates = mapMessageToDb(updates);
    const res = await updateData('message', id, dbUpdates);
    return mapMessageFromDb(res);
};
export const markMessagesAsRead = (senderId: string, receiverId: string) => {
    const supabase = getSupabase();
    return supabase.from('message')
        .update({ read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId)
        .eq('read', false);
};

// SoftwareLicense
export const addLicense = async (record: Omit<SoftwareLicense, 'id'>): Promise<SoftwareLicense> => {
    const dbRecord = mapLicenseToDb(record);
    const res = await insertData('software_license', dbRecord);
    return mapLicenseFromDb(res);
};

export const updateLicense = async (id: string, updates: Partial<SoftwareLicense>): Promise<SoftwareLicense> => {
    const dbUpdates = mapLicenseToDb(updates);
    const res = await updateData('software_license', id, dbUpdates);
    return mapLicenseFromDb(res);
};
export const deleteLicense = (id: string) => deleteData('software_license', id);

// LicenseAssignment
export const syncLicenseAssignments = async (equipmentId: string, licenseIds: string[]) => {
    const supabase = getSupabase();
    
    const colEquipmentId = 'equipment_id';
    const colLicenseId = 'software_license_id';
    const colAssignedDate = 'assigned_date';

    const { data: currentAssignments, error: fetchError } = await supabase
        .from('license_assignment')
        .select(`id, ${colLicenseId}`)
        .eq(colEquipmentId, equipmentId);
        
    handleSupabaseError(fetchError, 'a obter atribuições de licença');

    const currentLicenseIds = new Set(currentAssignments?.map((a: any) => a[colLicenseId]));
    const newLicenseIds = new Set(licenseIds);

    const toAdd = licenseIds.filter(id => !currentLicenseIds.has(id));
    const toRemove = currentAssignments?.filter((a: any) => !newLicenseIds.has(a[colLicenseId])).map((a: any) => a.id) || [];

    if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
            .from('license_assignment')
            .delete()
            .in('id', toRemove);
        handleSupabaseError(deleteError, 'a apagar atribuições de licença');
    }

    if (toAdd.length > 0) {
        const newRecords = toAdd.map(licenseId => ({
            [colEquipmentId]: equipmentId,
            [colLicenseId]: licenseId,
            [colAssignedDate]: new Date().toISOString().split('T')[0],
        }));

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

    const { error: deleteError } = await supabase.from('team_members').delete().eq('team_id', teamId);
    handleSupabaseError(deleteError, 'a remover membros antigos da equipa');

    if (memberIds.length > 0) {
        const newMembers = memberIds.map(collaborator_id => ({
            team_id: teamId,
            collaborator_id
        }));
        const { error: insertError } = await supabase.from('team_members').insert(newMembers);
        handleSupabaseError(insertError, 'a adicionar novos membros à equipa');
    }
};
