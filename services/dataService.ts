
import { getSupabase } from './supabaseClient';
import { 
    Equipment, Brand, EquipmentType, Instituicao, Entidade, Collaborator, 
    Assignment, Ticket, TicketActivity, SoftwareLicense, LicenseAssignment, 
    Team, TeamMember, Message, CollaboratorHistory, TicketCategoryItem, 
    SecurityIncidentTypeItem, BusinessService, ServiceDependency, Vulnerability, 
    BackupExecution, Supplier, ResilienceTest, SecurityTrainingRecord, AuditAction,
    ResourceContact, ContactRole, ContactTitle, ConfigItem
} from '../types';

// --- Helper to fetch all data concurrently ---
export const fetchAllData = async () => {
    const supabase = getSupabase();
    const [
        equipment, brands, equipmentTypes, instituicoes, entidades, collaborators, 
        assignments, tickets, ticketActivities, softwareLicenses, licenseAssignments, 
        teams, teamMembers, messages, collaboratorHistory, ticketCategories, 
        securityIncidentTypes, businessServices, serviceDependencies, vulnerabilities, 
        suppliers, backupExecutions, resilienceTests, securityTrainings, resourceContacts, 
        contactRoles, contactTitles,
        // Configuration Tables
        configEquipmentStatuses, configUserRoles, configCriticalityLevels, 
        configCiaRatings, configServiceStatuses, configBackupTypes, 
        configTrainingTypes, configResilienceTestTypes
    ] = await Promise.all([
        supabase.from('equipment').select('*'),
        supabase.from('brands').select('*'),
        supabase.from('equipment_types').select('*'),
        supabase.from('instituicoes').select('*'),
        supabase.from('entidades').select('*'),
        supabase.from('collaborators').select('*'),
        supabase.from('assignments').select('*'),
        supabase.from('tickets').select('*'),
        supabase.from('ticket_activities').select('*'),
        supabase.from('software_licenses').select('*'),
        supabase.from('license_assignments').select('*'),
        supabase.from('teams').select('*'),
        supabase.from('team_members').select('*'),
        supabase.from('messages').select('*'),
        supabase.from('collaborator_history').select('*'),
        supabase.from('ticket_categories').select('*'),
        supabase.from('security_incident_types').select('*'),
        supabase.from('business_services').select('*'),
        supabase.from('service_dependencies').select('*'),
        supabase.from('vulnerabilities').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('backup_executions').select('*'),
        supabase.from('resilience_tests').select('*'),
        supabase.from('security_training_records').select('*'),
        supabase.from('resource_contacts').select('*'),
        supabase.from('contact_roles').select('*'),
        supabase.from('contact_titles').select('*'),
        // Configs
        supabase.from('config_equipment_statuses').select('*'),
        supabase.from('config_user_roles').select('*'),
        supabase.from('config_criticality_levels').select('*'),
        supabase.from('config_cia_ratings').select('*'),
        supabase.from('config_service_statuses').select('*'),
        supabase.from('config_backup_types').select('*'),
        supabase.from('config_training_types').select('*'),
        supabase.from('config_resilience_test_types').select('*')
    ]);

    // Helper to attach contacts
    const attachContacts = (items: any[], type: string) => {
        return items.map(item => ({
            ...item,
            contacts: (resourceContacts.data || []).filter((c: any) => c.resource_type === type && c.resource_id === item.id)
        }));
    };

    return {
        equipment: equipment.data || [],
        brands: brands.data || [],
        equipmentTypes: equipmentTypes.data || [],
        instituicoes: attachContacts(instituicoes.data || [], 'instituicao'),
        entidades: attachContacts(entidades.data || [], 'entidade'),
        collaborators: collaborators.data || [],
        assignments: assignments.data || [],
        tickets: tickets.data || [],
        ticketActivities: ticketActivities.data || [],
        softwareLicenses: softwareLicenses.data || [],
        licenseAssignments: licenseAssignments.data || [],
        teams: teams.data || [],
        teamMembers: teamMembers.data || [],
        messages: messages.data || [],
        collaboratorHistory: collaboratorHistory.data || [],
        ticketCategories: ticketCategories.data || [],
        securityIncidentTypes: securityIncidentTypes.data || [],
        businessServices: businessServices.data || [],
        serviceDependencies: serviceDependencies.data || [],
        vulnerabilities: vulnerabilities.data || [],
        suppliers: attachContacts(suppliers.data || [], 'supplier'),
        backupExecutions: backupExecutions.data || [],
        resilienceTests: resilienceTests.data || [],
        securityTrainings: securityTrainings.data || [],
        contactRoles: contactRoles.data || [],
        contactTitles: contactTitles.data || [],
        // Configs
        configEquipmentStatuses: configEquipmentStatuses.data || [],
        configUserRoles: configUserRoles.data || [],
        configCriticalityLevels: configCriticalityLevels.data || [],
        configCiaRatings: configCiaRatings.data || [],
        configServiceStatuses: configServiceStatuses.data || [],
        configBackupTypes: configBackupTypes.data || [],
        configTrainingTypes: configTrainingTypes.data || [],
        configResilienceTestTypes: configResilienceTestTypes.data || []
    };
};

// --- Audit Logs ---
export const logAction = async (action: AuditAction, resourceType: string, details: string, resourceId?: string) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('audit_logs').insert({
        user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details
    });
};

export const fetchAuditLogs = async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    
    const { data: users } = await supabase.from('collaborators').select('id, email');
    const userMap = new Map(users?.map((u: any) => [u.id, u.email]));

    return data.map((log: any) => ({
        ...log,
        user_email: userMap.get(log.user_id) || 'Unknown'
    }));
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
            if (error.code !== 'PGRST116') console.warn("Error fetching last review date:", error);
            return null;
        }
        return data?.timestamp || null;
    } catch (e) {
        console.warn("Could not fetch last access review date", e);
        return null;
    }
};

export const fetchLastRiskAcknowledgement = async (): Promise<{ timestamp: string, user_email: string } | null> => {
    const supabase = getSupabase();
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('timestamp, user_id')
            .eq('action', 'RISK_ACKNOWLEDGE')
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') console.warn("Error fetching last acknowledgement:", error);
            return null;
        }
        
        const { data: user } = await supabase.from('collaborators').select('email').eq('id', data.user_id).single();
        
        return {
            timestamp: data.timestamp,
            user_email: user?.email || 'Utilizador'
        };
    } catch (e) {
        console.warn("Could not fetch last risk acknowledgement", e);
        return null;
    }
};

// --- Generic CRUD Helpers ---
const create = async (table: string, data: any) => {
    const supabase = getSupabase();
    const { data: res, error } = await supabase.from(table).insert(data).select().single();
    if (error) throw error;
    await logAction('CREATE', table, `Created record in ${table}`, res.id);
    return res;
};

const update = async (table: string, id: string, data: any) => {
    const supabase = getSupabase();
    const { data: res, error } = await supabase.from(table).update(data).eq('id', id).select().single();
    if (error) throw error;
    await logAction('UPDATE', table, `Updated record in ${table}`, id);
    return res;
};

const remove = async (table: string, id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    await logAction('DELETE', table, `Deleted record from ${table}`, id);
    return true;
};

// --- Specific Entities ---

// Equipment
export const addEquipment = (data: any) => create('equipment', data);
export const updateEquipment = (id: string, data: any) => update('equipment', id, data);
export const addMultipleEquipment = async (items: any[]) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('equipment').insert(items).select();
    if (error) throw error;
    await logAction('CREATE', 'equipment', `Created ${items.length} equipment items`);
    return data;
};

// Brands & Types
export const addBrand = (data: any) => create('brands', data);
export const updateBrand = (id: string, data: any) => update('brands', id, data);
export const deleteBrand = (id: string) => remove('brands', id);

export const addEquipmentType = (data: any) => create('equipment_types', data);
export const updateEquipmentType = (id: string, data: any) => update('equipment_types', id, data);
export const deleteEquipmentType = (id: string) => remove('equipment_types', id);

// Org
export const addInstituicao = (data: any) => create('instituicoes', data);
export const updateInstituicao = (id: string, data: any) => update('instituicoes', id, data);
export const deleteInstituicao = (id: string) => remove('instituicoes', id);

export const addEntidade = (data: any) => create('entidades', data);
export const updateEntidade = (id: string, data: any) => update('entidades', id, data);
export const deleteEntidade = (id: string) => remove('entidades', id);

// Collaborators
export const addCollaborator = (data: any) => create('collaborators', data);
export const updateCollaborator = (id: string, data: any) => update('collaborators', id, data);
export const deleteCollaborator = (id: string) => remove('collaborators', id);
export const uploadCollaboratorPhoto = async (id: string, file: File) => {
    const supabase = getSupabase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, file, { upsert: true });
    if (uploadError) {
        console.warn("Storage not configured or error uploading:", uploadError);
        return null;
    }
    
    const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
    return data.publicUrl;
};

// Teams
export const addTeam = (data: any) => create('teams', data);
export const updateTeam = (id: string, data: any) => update('teams', id, data);
export const deleteTeam = (id: string) => remove('teams', id);
export const syncTeamMembers = async (teamId: string, memberIds: string[]) => {
    const supabase = getSupabase();
    await supabase.from('team_members').delete().eq('team_id', teamId);
    if (memberIds.length > 0) {
        const inserts = memberIds.map(mid => ({ team_id: teamId, collaborator_id: mid }));
        await supabase.from('team_members').insert(inserts);
    }
    await logAction('UPDATE', 'teams', `Synced members for team ${teamId}`, teamId);
};

// Licenses
export const addLicense = (data: any) => create('software_licenses', data);
export const updateLicense = (id: string, data: any) => update('software_licenses', id, data);
export const deleteLicense = (id: string) => remove('software_licenses', id);
export const syncLicenseAssignments = async (equipmentId: string, licenseIds: string[]) => {
    const supabase = getSupabase();
    await supabase.from('license_assignments').delete().eq('equipmentId', equipmentId);
    if (licenseIds.length > 0) {
        const inserts = licenseIds.map(lid => ({ equipmentId: equipmentId, softwareLicenseId: lid }));
        await supabase.from('license_assignments').insert(inserts);
    }
    await logAction('UPDATE', 'equipment', `Synced licenses for equipment ${equipmentId}`, equipmentId);
};

// Tickets & Support
export const addTicket = (data: any) => create('tickets', data);
export const updateTicket = (id: string, data: any) => update('tickets', id, data);
export const addTicketActivity = (data: any) => create('ticket_activities', data);
export const addTicketCategory = (data: any) => create('ticket_categories', data);
export const updateTicketCategory = (id: string, data: any) => update('ticket_categories', id, data);
export const deleteTicketCategory = (id: string) => remove('ticket_categories', id);
export const addSecurityIncidentType = (data: any) => create('security_incident_types', data);
export const updateSecurityIncidentType = (id: string, data: any) => update('security_incident_types', id, data);
export const deleteSecurityIncidentType = (id: string) => remove('security_incident_types', id);

// Assignments
export const addAssignment = async (data: any) => {
    const supabase = getSupabase();
    await supabase.from('assignments')
        .update({ returnDate: new Date().toISOString().split('T')[0] })
        .eq('equipmentId', data.equipmentId)
        .is('returnDate', null);
    return create('assignments', data);
};

// Suppliers
export const addSupplier = async (data: any) => {
    const contacts = data.contacts || [];
    const supplierData = { ...data };
    delete supplierData.contacts;
    
    const supplier = await create('suppliers', supplierData);
    
    if (contacts.length > 0 && supplier.id) {
        const supabase = getSupabase();
        const contactsWithId = contacts.map((c: any) => ({ 
            ...c, 
            supplier_id: undefined, // Remove legacy field if present in payload
            resource_id: supplier.id, 
            resource_type: 'supplier' 
        }));
        await supabase.from('resource_contacts').insert(contactsWithId);
    }
    return supplier;
};

export const updateSupplier = async (id: string, data: any) => {
    const contacts = data.contacts || [];
    const supplierData = { ...data };
    delete supplierData.contacts;
    
    const supplier = await update('suppliers', id, supplierData);
    
    if (supplier) {
        const supabase = getSupabase();
        // Sync contacts logic
        await supabase.from('resource_contacts').delete().eq('resource_id', id).eq('resource_type', 'supplier');
        if (contacts.length > 0) {
             const contactsWithId = contacts.map((c: any) => ({ 
                 resource_id: id,
                 resource_type: 'supplier',
                 title: c.title,
                 name: c.name, 
                 role: c.role, 
                 email: c.email, 
                 phone: c.phone 
            }));
            await supabase.from('resource_contacts').insert(contactsWithId);
        }
    }
    return supplier;
};

export const deleteSupplier = (id: string) => remove('suppliers', id);

// Business Services (BIA)
export const addBusinessService = (data: any) => create('business_services', data);
export const updateBusinessService = (id: string, data: any) => update('business_services', id, data);
export const deleteBusinessService = (id: string) => remove('business_services', id);
export const addServiceDependency = (data: any) => create('service_dependencies', data);
export const deleteServiceDependency = (_ignored: null, id: string) => remove('service_dependencies', id);

// Vulnerabilities
export const addVulnerability = (data: any) => create('vulnerabilities', data);
export const updateVulnerability = (id: string, data: any) => update('vulnerabilities', id, data);
export const deleteVulnerability = (id: string) => remove('vulnerabilities', id);

// Backups
export const addBackupExecution = (data: any) => create('backup_executions', data);
export const updateBackupExecution = (id: string, data: any) => update('backup_executions', id, data);
export const deleteBackupExecution = (id: string) => remove('backup_executions', id);

// Resilience
export const addResilienceTest = (data: any) => create('resilience_tests', data);
export const updateResilienceTest = (id: string, data: any) => update('resilience_tests', id, data);
export const deleteResilienceTest = (id: string) => remove('resilience_tests', id);

// Training
export const addSecurityTraining = (data: any) => create('security_training_records', data);

// Chat
export const addMessage = (data: any) => create('messages', data);
export const markMessagesAsRead = async (senderId: string, receiverId: string) => {
    const supabase = getSupabase();
    await supabase.from('messages')
        .update({ read: true })
        .eq('senderId', senderId)
        .eq('receiverId', receiverId)
        .eq('read', false);
};

// Notifications
export const snoozeNotification = async (userId: string, referenceId: string, type: string) => {
    const supabase = getSupabase();
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 7); 
    
    await supabase.from('user_notification_snoozes').insert({
        user_id: userId,
        reference_id: referenceId,
        notification_type: type,
        snooze_until: snoozeUntil.toISOString()
    });
};

// Contact Roles
export const addContactRole = (data: any) => create('contact_roles', data);
export const updateContactRole = (id: string, data: any) => update('contact_roles', id, data);
export const deleteContactRole = (id: string) => remove('contact_roles', id);

// Contact Titles (Tratos)
export const addContactTitle = (data: any) => create('contact_titles', data);
export const updateContactTitle = (id: string, data: any) => update('contact_titles', id, data);
export const deleteContactTitle = (id: string) => remove('contact_titles', id);

// Contacts Generic
export const syncResourceContacts = async (resourceType: 'supplier' | 'entidade' | 'instituicao', resourceId: string, contacts: any[]) => {
    const supabase = getSupabase();
    await supabase.from('resource_contacts').delete().eq('resource_id', resourceId).eq('resource_type', resourceType);
    
    if (contacts.length > 0) {
        const inserts = contacts.map(c => ({
            resource_type: resourceType,
            resource_id: resourceId,
            title: c.title,
            name: c.name,
            role: c.role,
            email: c.email,
            phone: c.phone
        }));
        await supabase.from('resource_contacts').insert(inserts);
    }
};

// --- Generic Config CRUD ---
export const addConfigItem = (table: string, data: any) => create(table, data);
export const updateConfigItem = (table: string, id: string, data: any) => update(table, id, data);
export const deleteConfigItem = (table: string, id: string) => remove(table, id);
