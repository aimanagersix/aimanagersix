
import { getSupabase } from './supabaseClient';
import { 
    Equipment, Brand, EquipmentType, Instituicao, Entidade, Collaborator, 
    Assignment, Ticket, TicketActivity, SoftwareLicense, LicenseAssignment, 
    Team, TeamMember, Message, CollaboratorHistory, TicketCategoryItem, 
    SecurityIncidentTypeItem, BusinessService, ServiceDependency, 
    Vulnerability, BackupExecution, ResilienceTest, SecurityTrainingRecord,
    Supplier, ConfigItem, CustomRole, Policy, PolicyAcceptance, ProcurementRequest, 
    CalendarEvent, ContinuityPlan, SoftwareProduct, AuditLogEntry, DiagnosticResult, ResourceContact,
    DbPolicy, DbTrigger, DbFunction
} from '../types';

const sb = () => getSupabase();

// --- AUTH & USER ---
export const adminResetPassword = async (userId: string, newPassword: string) => {
    const { data, error } = await sb().functions.invoke('admin-auth-helper', {
        body: { action: 'update_password', targetUserId: userId, newPassword: newPassword }
    });
    if (error) throw error;
    await sb().from('collaborators').update({ password_updated_at: new Date().toISOString() }).eq('id', userId);
    return { success: true };
};

export const updateMyPhoto = async (userId: string, photoUrl: string) => {
    const { error } = await sb().from('collaborators').update({ photoUrl }).eq('id', userId);
    if (error) throw error;
};

// --- GENERIC CONFIG TABLES ---
export const addConfigItem = async (table: string, item: any) => {
    const { data, error } = await sb().from(table).insert(item).select().single();
    if (error) throw error;
    return data;
};

export const updateConfigItem = async (table: string, id: string, updates: any) => {
    const { data, error } = await sb().from(table).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deleteConfigItem = async (table: string, id: string) => {
    const { error } = await sb().from(table).delete().eq('id', id);
    if (error) throw error;
};

// --- GLOBAL SETTINGS ---
export const getGlobalSetting = async (key: string): Promise<string | null> => {
    const { data, error } = await sb().from('global_settings').select('setting_value').eq('setting_key', key).maybeSingle();
    if (error) return null;
    return data?.setting_value || null;
};

export const updateGlobalSetting = async (key: string, value: string) => {
    const { error } = await sb().from('global_settings').upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });
    if (error) throw error;
};

// --- ATOMIC FETCHING FUNCTIONS ---
export const fetchOrganizationData = async () => {
    const [
        {data: inst}, {data: ent}, {data: collabs}, {data: roles}, {data: titles}, {data: contactRoles}, {data: history}
    ] = await Promise.all([
        sb().from('instituicoes').select('*'),
        sb().from('entidades').select('*'),
        sb().from('collaborators').select('*'),
        sb().from('config_custom_roles').select('*'),
        sb().from('contact_titles').select('*'),
        sb().from('contact_roles').select('*'),
        sb().from('collaborator_history').select('*')
    ]);
    return { 
        instituicoes: inst || [], 
        entidades: ent || [], 
        collaborators: collabs || [], 
        customRoles: roles || [], 
        contactTitles: titles || [],
        contactRoles: contactRoles || [],
        collaboratorHistory: history || []
    };
};

export const fetchInventoryData = async () => {
    const [
        {data: eq}, {data: brands}, {data: types}, {data: assignments}, 
        {data: licenses}, {data: licenseAssignments}, {data: procurement},
        {data: softwareCats}, {data: softwareProds}, {data: suppliers},
        {data: eqStatuses}, {data: licStatuses}, {data: cpus}, {data: ram}, {data: storage},
        {data: accounting}, {data: conservation}, {data: decomm},
        {data: jobTitles}, {data: deactivReasons}
    ] = await Promise.all([
        sb().from('equipment').select('*'),
        sb().from('brands').select('*'),
        sb().from('equipment_types').select('*'),
        sb().from('assignments').select('*'),
        sb().from('software_licenses').select('*'),
        sb().from('license_assignments').select('*'),
        sb().from('procurement_requests').select('*'),
        sb().from('config_software_categories').select('*'),
        sb().from('config_software_products').select('*'),
        sb().from('suppliers').select('*'),
        sb().from('config_equipment_statuses').select('*'),
        sb().from('config_license_statuses').select('*'),
        sb().from('config_cpus').select('*'),
        sb().from('config_ram_sizes').select('*'),
        sb().from('config_storage_types').select('*'),
        sb().from('config_accounting_categories').select('*'),
        sb().from('config_conservation_states').select('*'),
        sb().from('config_decommission_reasons').select('*'),
        sb().from('config_job_titles').select('*'),
        sb().from('config_collaborator_deactivation_reasons').select('*')
    ]);
    return {
        equipment: eq || [], brands: brands || [], equipmentTypes: types || [], 
        assignments: assignments || [], softwareLicenses: licenses || [], 
        licenseAssignments: licenseAssignments || [], procurementRequests: procurement || [],
        softwareCategories: softwareCats || [], softwareProducts: softwareProds || [],
        suppliers: suppliers || [], 
        configEquipmentStatuses: eqStatuses || [],
        configLicenseStatuses: licStatuses || [],
        configCpus: cpus || [], configRamSizes: ram || [], configStorageTypes: storage || [],
        configAccountingCategories: accounting || [], configConservationStates: conservation || [],
        configDecommissionReasons: decomm || [],
        configJobTitles: jobTitles || [],
        configCollaboratorDeactivationReasons: deactivReasons || []
    };
};

export const fetchSupportData = async () => {
    const [
        {data: tickets}, {data: cats}, {data: incidentTypes}, {data: teams}, {data: members}, {data: calendar}, {data: activities}, {data: msgs}, {data: tickStatuses}
    ] = await Promise.all([
        sb().from('tickets').select('*'),
        sb().from('ticket_categories').select('*'),
        sb().from('security_incident_types').select('*'),
        sb().from('teams').select('*'),
        sb().from('team_members').select('*'),
        sb().from('calendar_events').select('*'),
        sb().from('ticket_activities').select('*'),
        sb().from('messages').select('*'),
        sb().from('config_ticket_statuses').select('*')
    ]);
    return {
        tickets: tickets || [], 
        ticketCategories: cats || [], 
        securityIncidentTypes: incidentTypes || [], 
        teams: teams || [], 
        teamMembers: members || [], 
        calendarEvents: calendar || [],
        ticketActivities: activities || [],
        messages: msgs || [],
        configTicketStatuses: tickStatuses || []
    };
};

export const fetchComplianceData = async () => {
    const [
        {data: svcs}, {data: deps}, {data: vulns}, {data: backups}, 
        {data: tests}, {data: trainings}, {data: policies}, {data: acceptances}, {data: plans},
        {data: trainingTypes},
        {data: critLevels}, {data: ciaRatings}, {data: svcStatus}, {data: backTypes}, {data: resTypes}
    ] = await Promise.all([
        sb().from('business_services').select('*'),
        sb().from('service_dependencies').select('*'),
        sb().from('vulnerabilities').select('*'),
        sb().from('backup_executions').select('*'),
        sb().from('resilience_tests').select('*'),
        sb().from('security_trainings').select('*'),
        sb().from('policies').select('*'),
        sb().from('policy_acceptances').select('*'),
        sb().from('continuity_plans').select('*'),
        sb().from('config_training_types').select('*'),
        sb().from('config_criticality_levels').select('*'),
        sb().from('config_cia_ratings').select('*'),
        sb().from('config_service_statuses').select('*'),
        sb().from('config_backup_types').select('*'),
        sb().from('config_resilience_test_types').select('*')
    ]);
    return {
        businessServices: svcs || [], serviceDependencies: deps || [], 
        vulnerabilities: vulns || [], backupExecutions: backups || [], 
        resilienceTests: tests || [], securityTrainings: trainings || [], 
        policies: policies || [], policyAcceptances: acceptances || [], 
        continuityPlans: plans || [], configTrainingTypes: trainingTypes || [],
        configCriticalityLevels: critLevels || [],
        configCiaRatings: ciaRatings || [],
        configServiceStatuses: svcStatus || [],
        configBackupTypes: backTypes || [],
        configResilienceTestTypes: resTypes || []
    };
};

export const fetchEquipmentPaginated = async (params: { page: number, pageSize: number, filters?: any, sort?: { key: string, direction: 'ascending' | 'descending' }, userId?: string, isAdmin?: boolean }) => {
    let query = sb().from('equipment').select('*', { count: 'exact' });
    if (!params.isAdmin && params.userId) {
        const { data: userEq } = await sb().from('assignments').select('equipmentId').eq('collaboratorId', params.userId).is('returnDate', null);
        const eqIds = userEq?.map(a => a.equipmentId) || [];
        if (eqIds.length > 0) query = query.in('id', eqIds);
        else return { data: [], total: 0 };
    }
    if (params.filters) {
        if (params.filters.serialNumber) query = query.ilike('serialNumber', `%${params.filters.serialNumber}%`);
        if (params.filters.description) query = query.ilike('description', `%${params.filters.description}%`);
        if (params.filters.brandId) query = query.eq('brandId', params.filters.brandId);
        if (params.filters.typeId) query = query.eq('typeId', params.filters.typeId);
        if (params.filters.status) query = query.eq('status', params.filters.status);
    }
    const sortObj = params.sort || { key: 'creationDate', direction: 'descending' };
    query = query.order(sortObj.key, { ascending: sortObj.direction === 'ascending' });
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    const { data, count, error } = await query.range(from, to);
    if (error) throw error;
    return { data: data || [], total: count || 0 };
};

export const fetchTicketsPaginated = async (params: { 
    page: number, 
    pageSize: number, 
    filters?: any, 
    sort?: { key: string, direction: 'ascending' | 'descending' },
    userContext?: { id: string, role: string, teamIds: string[] }
}) => {
    let query = sb().from('tickets').select('*', { count: 'exact' });
    if (params.userContext && params.userContext.role !== 'SuperAdmin' && params.userContext.role !== 'Admin') {
        const { id, teamIds } = params.userContext;
        if (teamIds && teamIds.length > 0) {
            query = query.or(`collaboratorId.eq.${id},team_id.in.(${teamIds.join(',')})`);
        } else {
            query = query.eq('collaboratorId', id);
        }
    }
    if (params.filters) {
        if (params.filters.status) query = query.eq('status', params.filters.status);
        if (params.filters.category) query = query.eq('category', params.filters.category);
        if (params.filters.team_id) query = query.eq('team_id', params.filters.team_id);
        if (params.filters.title) query = query.ilike('title', `%${params.filters.title}%`);
    }
    const sortObj = params.sort || { key: 'requestDate', direction: 'descending' };
    query = query.order(sortObj.key, { ascending: sortObj.direction === 'ascending' });
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    const { data, count, error } = await query.range(from, to);
    if (error) throw error;
    return { data: data || [], total: count || 0 };
};

export const addEquipment = async (eq: any) => {
    const { data, error } = await sb().from('equipment').insert(eq).select().single();
    if (error) throw error;
    return data;
};

export const updateEquipment = async (id: string, updates: any) => {
    const { data, error } = await sb().from('equipment').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const addAssignment = async (assignment: any) => {
    const { data, error } = await sb().from('assignments').insert(assignment).select().single();
    if (error) throw error;
    return data;
};

export const syncLicenseAssignments = async (equipmentId: string, licenseIds: string[]) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const { error: updateError } = await sb().from('license_assignments').update({ returnDate: nowStr }).eq('equipmentId', equipmentId).is('returnDate', null);
    if (updateError) throw updateError;
    if (licenseIds.length > 0) {
        const items = licenseIds.map(id => ({ equipmentId, softwareLicenseId: id, assignedDate: nowStr }));
        const { error: insertError } = await sb().from('license_assignments').insert(items);
        if (insertError) throw insertError;
    }
};

export const fetchAllData = async () => {
    const [org, inv, support, compliance] = await Promise.all([fetchOrganizationData(), fetchInventoryData(), fetchSupportData(), fetchComplianceData()]);
    return { ...org, ...inv, ...support, ...compliance };
};

export const fetchCollaboratorsPaginated = async (params: { page: number, pageSize: number, filters?: any, sort?: { key: string, direction: 'ascending' | 'descending' } }) => {
    let query = sb().from('collaborators').select('*', { count: 'exact' });
    if (params.filters) {
        if (params.filters.query) query = query.or(`fullName.ilike.%${params.filters.query}%,email.ilike.%${params.filters.query}%,numeroMecanografico.ilike.%${params.filters.query}%`);
        if (params.filters.entidadeId) query = query.eq('entidadeId', params.filters.entidadeId);
        if (params.filters.status) query = query.eq('status', params.filters.status);
        if (params.filters.role) query = query.eq('role', params.filters.role);
    }
    const sortObj = params.sort || { key: 'fullName', direction: 'ascending' };
    query = query.order(sortObj.key, { ascending: sortObj.direction === 'ascending' });
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    const { data, count, error } = await query.range(from, to);
    if (error) throw error;
    return { data: data || [], total: count || 0 };
};

export const addMultipleEquipment = async (items: any[]) => { const { error } = await sb().from('equipment').insert(items); if (error) throw error; };
export const deleteEquipment = async (id: string) => { const { error } = await sb().from('equipment').delete().eq('id', id); if (error) throw error; };
export const addBrand = async (brand: any) => { const { data, error } = await sb().from('brands').insert(brand).select().single(); if (error) throw error; return data; };
export const updateBrand = async (id: string, updates: any) => { const { data, error } = await sb().from('brands').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteBrand = async (id: string) => { const { error } = await sb().from('brands').delete().eq('id', id); if (error) throw error; };
export const addEquipmentType = async (type: any) => { const { data, error } = await sb().from('equipment_types').insert(type).select().single(); if (error) throw error; return data; };
export const updateEquipmentType = async (id: string, updates: any) => { const { data, error } = await sb().from('equipment_types').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteEquipmentType = async (id: string) => { const { error } = await sb().from('equipment_types').delete().eq('id', id); if (error) throw error; };
export const addInstituicao = async (inst: any) => { const { data, error } = await sb().from('instituicoes').insert(inst).select().single(); if (error) throw error; return data; };
export const updateInstituicao = async (id: string, updates: any) => { const { data, error } = await sb().from('instituicoes').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteInstituicao = async (id: string) => { const { error } = await sb().from('instituicoes').delete().eq('id', id); if (error) throw error; };
export const addEntidade = async (ent: any) => { const { data, error } = await sb().from('entidades').insert(ent).select().single(); if (error) throw error; return data; };
export const updateEntidade = async (id: string, updates: any) => { const { data, error } = await sb().from('entidades').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteEntidade = async (id: string) => { const { error } = await sb().from('entidades').delete().eq('id', id); if (error) throw error; };
export const addCollaborator = async (col: any, password?: string) => { const { data, error } = await sb().from('collaborators').insert(col).select().single(); if (error) throw error; return data; };
export const updateCollaborator = async (id: string, updates: any) => { const { data, error } = await sb().from('collaborators').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteCollaborator = async (id: string) => { const { error } = await sb().from('collaborators').delete().eq('id', id); if (error) throw error; };
export const uploadCollaboratorPhoto = async (id: string, file: File) => { const filePath = `avatars/${id}-${file.name}`; const { error: uploadError } = await sb().storage.from('avatars').upload(filePath, file, { upsert: true }); if (uploadError) throw uploadError; const { data: { publicUrl } } = sb().storage.from('avatars').getPublicUrl(filePath); await updateCollaborator(id, { photoUrl: publicUrl }); return publicUrl; };
export const addLicense = async (lic: any) => { const { data, error } = await sb().from('software_licenses').insert(lic).select().single(); if (error) throw error; return data; };
export const addMultipleLicenses = async (items: any[]) => { const { error } = await sb().from('software_licenses').insert(items); if (error) throw error; };
export const updateLicense = async (id: string, updates: any) => { const { data, error } = await sb().from('software_licenses').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteLicense = async (id: string) => { const { error } = await sb().from('software_licenses').delete().eq('id', id); if (error) throw error; };
export const addTicket = async (ticket: any) => { const { data, error } = await sb().from('tickets').insert(ticket).select().single(); if (error) throw error; return data; };
export const updateTicket = async (id: string, updates: any) => { const { data, error } = await sb().from('tickets').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const getTicketActivities = async (ticketId: string) => { const { data, error } = await sb().from('ticket_activities').select('*').eq('ticketId', ticketId); if (error) throw error; return data || []; };
export const addTicketActivity = async (activity: any) => { const { data, error } = await sb().from('ticket_activities').insert(activity).select().single(); if (error) throw error; return data; };
export const addTicketCategory = async (cat: any) => { const { data, error } = await sb().from('ticket_categories').insert(cat).select().single(); if (error) throw error; return data; };
export const updateTicketCategory = async (id: string, updates: any) => { const { data, error } = await sb().from('ticket_categories').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const addSecurityIncidentType = async (type: any) => { const { data, error } = await sb().from('security_incident_types').insert(type).select().single(); if (error) throw error; return data; };
export const updateSecurityIncidentType = async (id: string, updates: any) => { const { data, error } = await sb().from('security_incident_types').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const addTeam = async (team: any) => { const { data, error } = await sb().from('teams').insert(team).select().single(); if (error) throw error; return data; };
export const updateTeam = async (id: string, updates: any) => { const { data, error } = await sb().from('teams').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteTeam = async (id: string) => { const { error } = await sb().from('teams').delete().eq('id', id); if (error) throw error; };
export const syncTeamMembers = async (teamId: string, memberIds: string[]) => { await sb().from('team_members').delete().eq('team_id', teamId); if (memberIds.length > 0) { const items = memberIds.map(id => ({ team_id: teamId, collaborator_id: id })); await sb().from('team_members').insert(items); } };
export const addMessage = async (msg: any) => { const { data, error } = await sb().from('messages').insert(msg).select().single(); if (error) throw error; return data; };
export const markMessagesAsRead = async (senderId: string) => { await sb().from('messages').update({ read: true }).eq('senderId', senderId); };
export const fetchLastAccessReviewDate = async () => { const { data } = await sb().from('audit_log').select('timestamp').eq('action', 'ACCESS_REVIEW').order('timestamp', { ascending: false }).limit(1).maybeSingle(); return data?.timestamp || null; };
export const fetchLastRiskAcknowledgement = async () => { const { data } = await sb().from('audit_log').select('timestamp, user_email').eq('action', 'RISK_ACKNOWLEDGE').order('timestamp', { ascending: false }).limit(1).maybeSingle(); return data || null; };
export const logAction = async (action: string, resourceType: string, details?: string, resourceId?: string) => { await sb().from('audit_log').insert({ action, resource_type: resourceType, details, resource_id: resourceId }); };
export const fetchAuditLogs = async () => { const { data } = await sb().from('audit_log').select('*').order('timestamp', { ascending: false }); return data || []; };
export const addBusinessService = async (svc: any) => { const { data, error } = await sb().from('business_services').insert(svc).select().single(); if (error) throw error; return data; };
export const updateBusinessService = async (id: string, updates: any) => { const { data, error } = await sb().from('business_services').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteBusinessService = async (id: string) => { const { error } = await sb().from('business_services').delete().eq('id', id); if (error) throw error; };
export const addServiceDependency = async (dep: any) => { const { error } = await sb().from('service_dependencies').insert(dep); if (error) throw error; };
export const deleteServiceDependency = async (id: string) => { const { error } = await sb().from('service_dependencies').delete().eq('id', id); if (error) throw error; };
export const addVulnerability = async (vuln: any) => { const { data, error } = await sb().from('vulnerabilities').insert(vuln).select().single(); if (error) throw error; return data; };
export const updateVulnerability = async (id: string, updates: any) => { const { data, error } = await sb().from('vulnerabilities').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteVulnerability = async (id: string) => { const { error } = await sb().from('vulnerabilities').delete().eq('id', id); if (error) throw error; };
export const addBackupExecution = async (b: any) => { const { data, error } = await sb().from('backup_executions').insert(b).select().single(); if (error) throw error; return data; };
export const updateBackupExecution = async (id: string, updates: any) => { const { data, error } = await sb().from('backup_executions').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteBackupExecution = async (id: string) => { const { error } = await sb().from('backup_executions').delete().eq('id', id); if (error) throw error; };
export const addResilienceTest = async (t: any) => { const { data, error } = await sb().from('resilience_tests').insert(t).select().single(); if (error) throw error; return data; };
export const updateResilienceTest = async (id: string, updates: any) => { const { data, error } = await sb().from('resilience_tests').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteResilienceTest = async (id: string) => { const { error } = await sb().from('resilience_tests').delete().eq('id', id); if (error) throw error; };
export const addSecurityTraining = async (t: any) => { const { data, error } = await sb().from('security_trainings').insert(t).select().single(); if (error) throw error; return data; };
export const addProcurement = async (p: any) => { const { data, error } = await sb().from('procurement_requests').insert(p).select().single(); if (error) throw error; return data; };
export const updateProcurement = async (id: string, updates: any) => { const { data, error } = await sb().from('procurement_requests').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteProcurement = async (id: string) => { const { error } = await sb().from('procurement_requests').delete().eq('id', id); if (error) throw error; };
export const getAutomationRules = async () => { const { data } = await sb().from('automation_rules').select('*'); return data || []; };
export const addAutomationRule = async (rule: any) => { await sb().from('automation_rules').insert(rule); };
export const updateAutomationRule = async (id: string, updates: any) => { await sb().from('automation_rules').update(updates).eq('id', id); };
export const deleteAutomationRule = async (id: string) => { await sb().from('automation_rules').delete().eq('id', id); };
export const fetchDbPolicies = async (): Promise<DbPolicy[]> => { const { data } = await sb().rpc('get_db_policies'); return data || []; };
export const fetchDbTriggers = async (): Promise<DbTrigger[]> => { const { data } = await sb().rpc('get_db_triggers'); return data || []; };
export const fetchDbFunctions = async (): Promise<DbFunction[]> => { const { data } = await sb().rpc('get_db_functions'); return data || []; };
export const addCalendarEvent = async (event: any) => { const { data, error } = await sb().from('calendar_events').insert(event).select().single(); if (error) throw error; return data; };
export const updateCalendarEvent = async (id: string, updates: any) => { await sb().from('calendar_events').update(updates).eq('id', id); };
export const deleteCalendarEvent = async (id: string) => { await sb().from('calendar_events').delete().eq('id', id); };
export const addPolicy = async (p: any) => { await sb().from('policies').insert(p); };
export const updatePolicy = async (id: string, updates: any) => { await sb().from('policies').update(updates).eq('id', id); };
export const deletePolicy = async (id: string) => { await sb().from('policies').delete().eq('id', id); };
export const addSupplier = async (sup: any) => { const { data, error } = await sb().from('suppliers').insert(sup).select().single(); if (error) throw error; return data; };
export const updateSupplier = async (id: string, updates: any) => { const { data, error } = await sb().from('suppliers').update(updates).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteSupplier = async (id: string) => { const { error } = await sb().from('suppliers').delete().eq('id', id); if (error) throw error; };
export const syncResourceContacts = async (type: string, id: string, contacts: ResourceContact[]) => { await sb().from('resource_contacts').delete().eq('resource_type', type).eq('resource_id', id); if (contacts.length > 0) { const items = contacts.map(c => ({ ...c, resource_type: type, resource_id: id })); await sb().from('resource_contacts').insert(items); } };
export const addContactRole = async (role: any) => { await sb().from('contact_roles').insert(role); };
export const updateContactRole = async (id: string, updates: any) => { await sb().from('contact_roles').update(updates).eq('id', id); };
export const deleteContactRole = async (id: string) => { await sb().from('contact_roles').delete().eq('id', id); };
export const addContactTitle = async (title: any) => { await sb().from('contact_titles').insert(title); };
export const updateContactTitle = async (id: string, updates: any) => { await sb().from('contact_titles').update(updates).eq('id', id); };
export const deleteContactTitle = async (id: string) => { await sb().from('contact_titles').delete().eq('id', id); };
export const getCustomRoles = async () => { const { data } = await sb().from('config_custom_roles').select('*'); return data || []; };
export const addCustomRole = async (role: any) => { await sb().from('config_custom_roles').insert(role); };
export const updateCustomRole = async (id: string, updates: any) => { await sb().from('config_custom_roles').update(updates).eq('id', id); };
export const addSoftwareProduct = async (p: any) => { await sb().from('config_software_products').insert(p); };
export const updateSoftwareProduct = async (id: string, updates: any) => { await sb().from('config_software_products').update(updates).eq('id', id); };
export const deleteSoftwareProduct = async (id: string) => { await sb().from('config_software_products').delete().eq('id', id); };
export const addJobTitle = async (j: any) => { const { data, error } = await sb().from('config_job_titles').insert(j).select().single(); if (error) throw error; return data; };
export const runSystemDiagnostics = async (): Promise<DiagnosticResult[]> => { const results: DiagnosticResult[] = []; try { await sb().from('equipment').select('id').limit(1); results.push({ module: 'Database Connectivity', status: 'Success', message: 'Successfully reached Supabase.' }); } catch (e: any) { results.push({ module: 'Database Connectivity', status: 'Failure', message: e.message }); } return results; };
export const triggerBirthdayCron = async () => { const { error } = await sb().rpc('send_daily_birthday_emails'); if (error) throw error; };
export const snoozeNotification = (id: string) => { const existing = localStorage.getItem('snoozed_notifications'); let snoozed = existing ? JSON.parse(existing) : []; const until = new Date(); until.setDate(until.getDate() + 7); snoozed.push({ id, until: until.toISOString() }); localStorage.setItem('snoozed_notifications', JSON.stringify(snoozed)); };
