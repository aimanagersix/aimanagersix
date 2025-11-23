
import { getSupabase } from './supabaseClient';
import { 
    Equipment, Brand, EquipmentType, Instituicao, Entidade, Collaborator, 
    Assignment, Ticket, TicketActivity, SoftwareLicense, LicenseAssignment, 
    Team, TeamMember, Message, CollaboratorHistory, TicketCategoryItem, 
    SecurityIncidentTypeItem, BusinessService, ServiceDependency, Vulnerability, 
    BackupExecution, Supplier, ResilienceTest, SecurityTrainingRecord, AuditAction
} from '../types';

// --- Helper to fetch all data concurrently ---
export const fetchAllData = async () => {
    const supabase = getSupabase();
    const [
        equipment, brands, equipmentTypes, instituicoes, entidades, collaborators, 
        assignments, tickets, ticketActivities, softwareLicenses, licenseAssignments, 
        teams, teamMembers, messages, collaboratorHistory, ticketCategories, 
        securityIncidentTypes, businessServices, serviceDependencies, vulnerabilities, 
        suppliers, backupExecutions, resilienceTests, securityTrainings
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
        supabase.from('security_training_records').select('*')
    ]);

    return {
        equipment: equipment.data || [],
        brands: brands.data || [],
        equipmentTypes: equipmentTypes.data || [],
        instituicoes: instituicoes.data || [],
        entidades: entidades.data || [],
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
        suppliers: suppliers.data || [],
        backupExecutions: backupExecutions.data || [],
        resilienceTests: resilienceTests.data || [],
        securityTrainings: securityTrainings.data || []
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
    // Use a manual join approach or view if direct join is hard with simple query, 
    // but standard supabase select can join linked tables.
    // Assuming FK exists. If not, we fetch and map manually or rely on RLS.
    // Let's assume we fetch basic logs and map user emails in frontend if needed, 
    // or use a view. For now, basic fetch.
    
    // Trying to join with collaborators via user_id if possible, but auth.users is separate.
    // We'll fetch logs and mapping will be done in UI via collaborators list if user_id matches collaborator id.
    // However, auth.users != collaborators.id usually unless synced.
    // We'll just return logs for now.
    const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    
    // Enrich with email if possible (requires admin rights to see auth.users or a public profile table)
    // For this app, we assume collaborators table has the user info.
    // Let's fetch collaborators to map emails.
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
        
        // Fetch email manually since simple join might fail if relation not defined
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
    // Delete existing
    await supabase.from('team_members').delete().eq('team_id', teamId);
    // Insert new
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
    // Logic to close previous assignment for this equipment if exists
    const supabase = getSupabase();
    // 1. Close existing open assignment for this equipment
    await supabase.from('assignments')
        .update({ returnDate: new Date().toISOString().split('T')[0] })
        .eq('equipmentId', data.equipmentId)
        .is('returnDate', null);
        
    // 2. Create new
    return create('assignments', data);
};

// Suppliers
export const addSupplier = (data: any) => create('suppliers', data);
export const updateSupplier = (id: string, data: any) => update('suppliers', id, data);
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
    snoozeUntil.setDate(snoozeUntil.getDate() + 7); // Snooze for 7 days
    
    await supabase.from('user_notification_snoozes').insert({
        user_id: userId,
        reference_id: referenceId,
        notification_type: type,
        snooze_until: snoozeUntil.toISOString()
    });
};
