







import { getSupabase } from './supabaseClient';
import { 
    Equipment, Instituicao, Entidade, Collaborator, Assignment, EquipmentType, Brand, 
    Ticket, TicketActivity, CollaboratorHistory, Message, SoftwareLicense, LicenseAssignment, 
    Team, TeamMember, AuditLogEntry, AuditAction, TicketCategoryItem, BusinessService, ServiceDependency, Vulnerability, SecurityIncidentTypeItem, Supplier, BackupExecution
} from '../types';

const handleSupabaseError = (error: any, operation: string) => {
    if (error) {
        console.error(`Error ${operation}:`, error);
        throw new Error(`Erro ao ${operation}: ${error.message}`);
    }
};

// --- Audit Logging ---
export const logAction = async (action: AuditAction, resourceType: string, details: string, resourceId?: string) => {
    const supabase = getSupabase();
    const { data: { user } } = await (supabase.auth as any).getUser();
    
    if (!user) return; // System action or no user logged in

    const entry = {
        user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        timestamp: new Date().toISOString()
    };

    try {
        // We try to insert into a theoretical 'audit_logs' table.
        // In a real deployment, this table must be created in Supabase SQL Editor.
        await supabase.from('audit_logs').insert(entry);
    } catch (e) {
        // Fail silently if table doesn't exist to not break the app flow
        console.warn("Audit log could not be saved (table might be missing)", e);
    }
};

export const fetchAuditLogs = async () => {
    const supabase = getSupabase();
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*, collaborators:user_id(email)')
            .order('timestamp', { ascending: false })
            .limit(500);
        
        if (error) throw error;

        return (data || []).map((log: any) => ({
            ...log,
            user_email: log.collaborators?.email || 'Desconhecido'
        })) as AuditLogEntry[];
    } catch (e) {
        console.warn("Could not fetch audit logs", e);
        return [];
    }
};

export const fetchLastAccessReviewDate = async (): Promise<string | null> => {
    const supabase = getSupabase();
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('timestamp')
            .eq('action', 'ACCESS_REVIEW')
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // Code PGRST116 means no rows returned (no review ever happened), which is fine
            if (error.code !== 'PGRST116') console.warn("Error fetching last review date:", error);
            return null;
        }
        return data?.timestamp || null;
    } catch (e) {
        console.warn("Could not fetch last access review date", e);
        return null;
    }
};


// --- Batch Data Fetching ---
export const fetchAllData = async () => {
    const supabase = getSupabase();
    const [
        equipmentRes, instituicoesRes, entidadesRes, collaboratorsRes,
        assignmentsRes, ticketsRes, ticketActivitiesRes, brandsRes,
        equipmentTypesRes, softwareLicensesRes, licenseAssignmentsRes,
        teamsRes, teamMembersRes, messagesRes, historyRes, categoriesRes,
        servicesRes, dependenciesRes, vulnerabilitiesRes, incidentTypesRes, suppliersRes, backupsRes
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
        supabase.from('collaborator_history').select('*'),
        supabase.from('ticket_categories').select('*').order('name'),
        supabase.from('business_services').select('*'),
        supabase.from('service_dependencies').select('*'),
        supabase.from('vulnerabilities').select('*'),
        supabase.from('security_incident_types').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('backup_executions').select('*').order('test_date', { ascending: false })
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
    // Don't fail strictly on newer tables to allow smooth migration
    if (categoriesRes.error) console.warn("Failed to fetch categories, table might be missing.");
    if (servicesRes.error) console.warn("Failed to fetch services, table might be missing.");
    if (vulnerabilitiesRes.error) console.warn("Failed to fetch vulnerabilities, table might be missing.");
    if (incidentTypesRes.error) console.warn("Failed to fetch incident types, table might be missing.");
    if (suppliersRes.error) console.warn("Failed to fetch suppliers, table might be missing.");
    if (backupsRes.error) console.warn("Failed to fetch backups, table might be missing.");

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
        collaboratorHistory: historyRes.data || [],
        ticketCategories: categoriesRes.data || [],
        businessServices: servicesRes.data || [],
        serviceDependencies: dependenciesRes.data || [],
        vulnerabilities: vulnerabilitiesRes.data || [],
        securityIncidentTypes: incidentTypesRes.data || [],
        suppliers: suppliersRes.data || [],
        backupExecutions: backupsRes.data || []
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
    await logAction('CREATE', 'Brand', `Created brand ${brand.name}`, data.id);
    return data as Brand;
};
export const updateBrand = async (id: string, updates: Partial<Brand>) => {
    const { data, error } = await getSupabase().from('brands').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating brand');
    await logAction('UPDATE', 'Brand', `Updated brand ${data.name}`, id);
    return data as Brand;
};
export const deleteBrand = async (id: string) => {
    const { error } = await getSupabase().from('brands').delete().eq('id', id);
    handleSupabaseError(error, 'deleting brand');
    await logAction('DELETE', 'Brand', `Deleted brand`, id);
};

// --- Suppliers (Fornecedores) ---
export const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    const { data, error } = await getSupabase().from('suppliers').insert(supplier).select().single();
    handleSupabaseError(error, 'adding supplier');
    await logAction('CREATE', 'Supplier', `Created supplier ${supplier.name}`, data.id);
    return data as Supplier;
};
export const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const { data, error } = await getSupabase().from('suppliers').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating supplier');
    await logAction('UPDATE', 'Supplier', `Updated supplier ${data.name}`, id);
    return data as Supplier;
};
export const deleteSupplier = async (id: string) => {
    const { error } = await getSupabase().from('suppliers').delete().eq('id', id);
    handleSupabaseError(error, 'deleting supplier');
    await logAction('DELETE', 'Supplier', `Deleted supplier`, id);
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
    await logAction('CREATE', 'EquipmentType', `Created type ${type.name}`, data.id);
    return data as EquipmentType;
};
export const updateEquipmentType = async (id: string, updates: Partial<EquipmentType>) => {
    const { data, error } = await getSupabase().from('equipment_types').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating equipment type');
    await logAction('UPDATE', 'EquipmentType', `Updated type ${data.name}`, id);
    return data as EquipmentType;
};
export const deleteEquipmentType = async (id: string) => {
    const { error } = await getSupabase().from('equipment_types').delete().eq('id', id);
    handleSupabaseError(error, 'deleting equipment type');
    await logAction('DELETE', 'EquipmentType', `Deleted type`, id);
};

// --- Equipment ---
export const addEquipment = async (equipment: Omit<Equipment, 'id' | 'modifiedDate' | 'creationDate'>) => {
    const { data, error } = await getSupabase().from('equipment').insert(equipment).select().single();
    handleSupabaseError(error, 'adding equipment');
    await logAction('CREATE', 'Equipment', `Created equipment ${equipment.description} (${equipment.serialNumber})`, data.id);
    return data as Equipment;
};
export const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    const { data, error } = await getSupabase().from('equipment').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating equipment');
    await logAction('UPDATE', 'Equipment', `Updated equipment ${data.serialNumber}`, id);
    return data as Equipment;
};
export const addMultipleEquipment = async (equipmentList: any[]) => {
    const { data, error } = await getSupabase().from('equipment').insert(equipmentList).select();
    handleSupabaseError(error, 'adding multiple equipment');
    await logAction('CREATE', 'Equipment', `Batch created ${equipmentList.length} items`);
    return { data };
};

// --- Collaborators ---
export const addCollaborator = async (collaborator: Omit<Collaborator, 'id'> & { id?: string }) => {
    // Using upsert to allow restoring/overwriting admin access if ID exists
    const { data, error } = await getSupabase().from('collaborators').upsert(collaborator).select().single();
    handleSupabaseError(error, 'adding/updating collaborator');
    await logAction('CREATE', 'Collaborator', `Created/Upserted collaborator ${collaborator.fullName}`, data.id);
    return data as Collaborator;
};
export const updateCollaborator = async (id: string, updates: Partial<Collaborator>) => {
    const { data, error } = await getSupabase().from('collaborators').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating collaborator');
    await logAction('UPDATE', 'Collaborator', `Updated collaborator ${data.fullName} (Role: ${data.role})`, id);
    return data as Collaborator;
};
export const deleteCollaborator = async (id: string) => {
    const { error } = await getSupabase().from('collaborators').delete().eq('id', id);
    handleSupabaseError(error, 'deleting collaborator');
    await logAction('DELETE', 'Collaborator', `Deleted collaborator`, id);
};
export const addMultipleCollaborators = async (collaborators: any[]) => {
     const { data, error } = await getSupabase().from('collaborators').insert(collaborators).select();
     handleSupabaseError(error, 'adding multiple collaborators');
     await logAction('CREATE', 'Collaborator', `Batch created ${collaborators.length} collaborators`);
     return { data };
};
export const uploadCollaboratorPhoto = async (userId: string, file: File) => {
    const supabase = getSupabase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('collaborator-photos') 
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.warn('Photo upload failed (bucket might be missing or permissions wrong), proceeding without photo URL.', uploadError);
        return null;
    }

    const { data } = supabase.storage.from('collaborator-photos').getPublicUrl(filePath);
    return data.publicUrl;
};


// --- Instituicoes ---
export const addInstituicao = async (instituicao: Omit<Instituicao, 'id'>) => {
    const { data, error } = await getSupabase().from('instituicoes').insert(instituicao).select().single();
    handleSupabaseError(error, 'adding instituicao');
    await logAction('CREATE', 'Instituicao', `Created institution ${instituicao.name}`, data.id);
    return data as Instituicao;
};
export const updateInstituicao = async (id: string, updates: Partial<Instituicao>) => {
    const { data, error } = await getSupabase().from('instituicoes').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating instituicao');
    await logAction('UPDATE', 'Instituicao', `Updated institution ${data.name}`, id);
    return data as Instituicao;
};
export const deleteInstituicao = async (id: string) => {
    const { error } = await getSupabase().from('instituicoes').delete().eq('id', id);
    handleSupabaseError(error, 'deleting instituicao');
    await logAction('DELETE', 'Instituicao', `Deleted institution`, id);
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
    await logAction('CREATE', 'Entidade', `Created entity ${entidade.name}`, data.id);
    return data as Entidade;
};
export const updateEntidade = async (id: string, updates: Partial<Entidade>) => {
    const { data, error } = await getSupabase().from('entidades').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating entidade');
    await logAction('UPDATE', 'Entidade', `Updated entity ${data.name}`, id);
    return data as Entidade;
};
export const deleteEntidade = async (id: string) => {
    const { error } = await getSupabase().from('entidades').delete().eq('id', id);
    handleSupabaseError(error, 'deleting entidade');
    await logAction('DELETE', 'Entidade', `Deleted entity`, id);
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
    await logAction('CREATE', 'License', `Created license ${license.productName}`, data.id);
    return data as SoftwareLicense;
};
export const updateLicense = async (id: string, updates: Partial<SoftwareLicense>) => {
    const { data, error } = await getSupabase().from('software_licenses').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating license');
    await logAction('UPDATE', 'License', `Updated license ${data.productName}`, id);
    return data as SoftwareLicense;
};
export const deleteLicense = async (id: string) => {
    const { error } = await getSupabase().from('software_licenses').delete().eq('id', id);
    handleSupabaseError(error, 'deleting license');
    await logAction('DELETE', 'License', `Deleted license`, id);
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
    await logAction('UPDATE', 'Equipment', `Synced licenses for equipment`, equipmentId);
};

// --- Teams ---
export const addTeam = async (team: Omit<Team, 'id'>) => {
    const { data, error } = await getSupabase().from('teams').insert(team).select().single();
    handleSupabaseError(error, 'adding team');
    await logAction('CREATE', 'Team', `Created team ${team.name}`, data.id);
    return data as Team;
};
export const updateTeam = async (id: string, updates: Partial<Team>) => {
    const { data, error } = await getSupabase().from('teams').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating team');
    await logAction('UPDATE', 'Team', `Updated team ${data.name}`, id);
    return data as Team;
};
export const deleteTeam = async (id: string) => {
    const { error } = await getSupabase().from('teams').delete().eq('id', id);
    handleSupabaseError(error, 'deleting team');
    await logAction('DELETE', 'Team', `Deleted team`, id);
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
    await logAction('UPDATE', 'Team', `Synced members`, teamId);
};

// --- Assignments ---
export const addAssignment = async (assignment: Omit<Assignment, 'id'>) => {
    const { data, error } = await getSupabase().from('assignments').insert(assignment).select().single();
    handleSupabaseError(error, 'adding assignment');
    await logAction('CREATE', 'Assignment', `Assigned equipment ${assignment.equipmentId} to entity/user`, data.id);
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
     await logAction('CREATE', 'Assignment', `Batch assigned ${assignments.length} items`);
     return { data };
};

// --- Tickets ---
export const addTicket = async (ticket: Omit<Ticket, 'id'>) => {
    const { data, error } = await getSupabase().from('tickets').insert(ticket).select().single();
    handleSupabaseError(error, 'adding ticket');
    await logAction('CREATE', 'Ticket', `Created ticket ${ticket.title} (Category: ${ticket.category})`, data.id);
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

// --- Ticket Categories ---
export const addTicketCategory = async (category: Omit<TicketCategoryItem, 'id'>) => {
    const { data, error } = await getSupabase().from('ticket_categories').insert(category).select().single();
    handleSupabaseError(error, 'adding ticket category');
    await logAction('CREATE', 'TicketCategory', `Created category ${category.name}`, data.id);
    return data as TicketCategoryItem;
};

export const updateTicketCategory = async (id: string, updates: Partial<TicketCategoryItem>) => {
    const { data, error } = await getSupabase().from('ticket_categories').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating ticket category');
    await logAction('UPDATE', 'TicketCategory', `Updated category ${data.name}`, id);
    return data as TicketCategoryItem;
};

export const deleteTicketCategory = async (id: string) => {
     const { error } = await getSupabase().from('ticket_categories').delete().eq('id', id);
    handleSupabaseError(error, 'deleting ticket category');
    await logAction('DELETE', 'TicketCategory', `Deleted category`, id);
};

// --- Security Incident Types ---
export const addSecurityIncidentType = async (type: Omit<SecurityIncidentTypeItem, 'id'>) => {
    const { data, error } = await getSupabase().from('security_incident_types').insert(type).select().single();
    handleSupabaseError(error, 'adding security incident type');
    await logAction('CREATE', 'SecurityIncidentType', `Created incident type ${type.name}`, data.id);
    return data as SecurityIncidentTypeItem;
};

export const updateSecurityIncidentType = async (id: string, updates: Partial<SecurityIncidentTypeItem>) => {
    const { data, error } = await getSupabase().from('security_incident_types').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating security incident type');
    await logAction('UPDATE', 'SecurityIncidentType', `Updated incident type ${data.name}`, id);
    return data as SecurityIncidentTypeItem;
};

export const deleteSecurityIncidentType = async (id: string) => {
    const { error } = await getSupabase().from('security_incident_types').delete().eq('id', id);
    handleSupabaseError(error, 'deleting security incident type');
    await logAction('DELETE', 'SecurityIncidentType', `Deleted incident type`, id);
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

// --- Business Services (BIA) ---
export const addBusinessService = async (service: Omit<BusinessService, 'id'>) => {
    const { data, error } = await getSupabase().from('business_services').insert(service).select().single();
    handleSupabaseError(error, 'adding business service');
    await logAction('CREATE', 'Service', `Created BIA service ${service.name}`, data.id);
    return data as BusinessService;
};

export const updateBusinessService = async (id: string, updates: Partial<BusinessService>) => {
    const { data, error } = await getSupabase().from('business_services').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating business service');
    await logAction('UPDATE', 'Service', `Updated BIA service ${data.name}`, id);
    return data as BusinessService;
};

export const deleteBusinessService = async (id: string) => {
    const { error } = await getSupabase().from('business_services').delete().eq('id', id);
    handleSupabaseError(error, 'deleting business service');
    await logAction('DELETE', 'Service', `Deleted BIA service`, id);
};

// --- Service Dependencies (BIA) ---
export const addServiceDependency = async (dependency: Omit<ServiceDependency, 'id'>) => {
    const { data, error } = await getSupabase().from('service_dependencies').insert(dependency).select().single();
    handleSupabaseError(error, 'adding service dependency');
    await logAction('UPDATE', 'Service', `Added dependency to service ${dependency.service_id}`, dependency.service_id);
    return data as ServiceDependency;
};

export const deleteServiceDependency = async (id: string) => {
    const { error } = await getSupabase().from('service_dependencies').delete().eq('id', id);
    handleSupabaseError(error, 'deleting service dependency');
    // Not logging as main action, detail enough
};

// --- Vulnerabilities (Security) ---
export const addVulnerability = async (vuln: Omit<Vulnerability, 'id'>) => {
    const { data, error } = await getSupabase().from('vulnerabilities').insert(vuln).select().single();
    handleSupabaseError(error, 'adding vulnerability');
    await logAction('CREATE', 'Vulnerability', `Created CVE ${vuln.cve_id}`, data.id);
    return data as Vulnerability;
};

export const updateVulnerability = async (id: string, updates: Partial<Vulnerability>) => {
    const { data, error } = await getSupabase().from('vulnerabilities').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating vulnerability');
    await logAction('UPDATE', 'Vulnerability', `Updated CVE ${data.cve_id}`, id);
    return data as Vulnerability;
};

export const deleteVulnerability = async (id: string) => {
    const { error } = await getSupabase().from('vulnerabilities').delete().eq('id', id);
    handleSupabaseError(error, 'deleting vulnerability');
    await logAction('DELETE', 'Vulnerability', `Deleted CVE`, id);
};

// --- Backup Executions ---
export const addBackupExecution = async (backup: Omit<BackupExecution, 'id'>) => {
    const { data, error } = await getSupabase().from('backup_executions').insert(backup).select().single();
    handleSupabaseError(error, 'adding backup execution');
    await logAction('CREATE', 'Backup', `Logged backup test for ${backup.system_name} (${backup.status})`, data.id);
    return data as BackupExecution;
};

export const updateBackupExecution = async (id: string, updates: Partial<BackupExecution>) => {
    const { data, error } = await getSupabase().from('backup_executions').update(updates).eq('id', id).select().single();
    handleSupabaseError(error, 'updating backup execution');
    return data as BackupExecution;
};

export const deleteBackupExecution = async (id: string) => {
    const { error } = await getSupabase().from('backup_executions').delete().eq('id', id);
    handleSupabaseError(error, 'deleting backup execution');
    await logAction('DELETE', 'Backup', `Deleted backup log`, id);
};