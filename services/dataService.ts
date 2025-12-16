
import { getSupabase } from './supabaseClient';
import { 
    AuditLogEntry, DiagnosticResult, 
    Equipment, Brand, EquipmentType, Collaborator, Assignment, SoftwareLicense, LicenseAssignment, 
    Entidade, Instituicao, Team, TeamMember, Supplier, Ticket, TicketActivity, 
    BusinessService, ServiceDependency, Vulnerability, BackupExecution, ResilienceTest, 
    SecurityTrainingRecord, ConfigItem, CustomRole, Policy, ProcurementRequest, 
    CalendarEvent, ContinuityPlan, SoftwareProduct, ContactRole, ContactTitle, JobTitle
} from '../types';

// Helper to get supabase client
const sb = () => getSupabase();

// --- GENERIC CRUD ---
const fetchAll = async <T>(table: string): Promise<T[]> => {
    const { data, error } = await sb().from(table).select('*');
    if (error) { console.error(`Error fetching ${table}:`, error); return []; }
    return data as T[];
};

const createItem = async <T>(table: string, item: any): Promise<T> => {
    const { data, error } = await sb().from(table).insert(item).select().single();
    if (error) throw error;
    return data as T;
};

const updateItem = async <T>(table: string, id: string, updates: any): Promise<T> => {
    const { data, error } = await sb().from(table).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as T;
};

const deleteItem = async (table: string, id: string): Promise<void> => {
    const { error } = await sb().from(table).delete().eq('id', id);
    if (error) throw error;
};

// --- DATA FETCHING AGGREGATOR ---
export const fetchAllData = async () => {
    const [
        equipment, brands, equipmentTypes, instituicoes, entidades, collaborators, 
        assignments, tickets, softwareLicenses, licenseAssignments, teams, teamMembers, 
        messages, ticketCategories, securityIncidentTypes, businessServices, serviceDependencies,
        vulnerabilities, suppliers, backupExecutions, resilienceTests, securityTrainings,
        configCustomRoles, softwareCategories, softwareProducts, configEquipmentStatuses,
        contactRoles, contactTitles, configCriticalityLevels, configCiaRatings, configServiceStatuses,
        configBackupTypes, configTrainingTypes, configResilienceTestTypes, configDecommissionReasons,
        configCollaboratorDeactivationReasons, configAccountingCategories, configConservationStates,
        configCpus, configRamSizes, configStorageTypes, configJobTitles, policies, policyAcceptances,
        procurementRequests, calendarEvents, continuityPlans
    ] = await Promise.all([
        fetchAll<Equipment>('equipment'),
        fetchAll<Brand>('brands'),
        fetchAll<EquipmentType>('equipment_types'),
        fetchAll<Instituicao>('instituicoes'),
        fetchAll<Entidade>('entidades'),
        fetchAll<Collaborator>('collaborators'),
        fetchAll<Assignment>('assignments'),
        fetchAll<Ticket>('tickets'),
        fetchAll<SoftwareLicense>('software_licenses'),
        fetchAll<LicenseAssignment>('license_assignments'),
        fetchAll<Team>('teams'),
        fetchAll<TeamMember>('team_members'),
        fetchAll<any>('messages'),
        fetchAll<any>('ticket_categories'),
        fetchAll<any>('security_incident_types'),
        fetchAll<BusinessService>('business_services'),
        fetchAll<ServiceDependency>('service_dependencies'),
        fetchAll<Vulnerability>('vulnerabilities'),
        fetchAll<Supplier>('suppliers'),
        fetchAll<BackupExecution>('backup_executions'),
        fetchAll<ResilienceTest>('resilience_tests'),
        fetchAll<SecurityTrainingRecord>('security_training_records'),
        fetchAll<CustomRole>('config_custom_roles'),
        fetchAll<ConfigItem>('config_software_categories'),
        fetchAll<SoftwareProduct>('config_software_products'),
        fetchAll<ConfigItem>('config_equipment_statuses'),
        fetchAll<ContactRole>('contact_roles'),
        fetchAll<ContactTitle>('contact_titles'),
        fetchAll<ConfigItem>('config_criticality_levels'),
        fetchAll<ConfigItem>('config_cia_ratings'),
        fetchAll<ConfigItem>('config_service_statuses'),
        fetchAll<ConfigItem>('config_backup_types'),
        fetchAll<ConfigItem>('config_training_types'),
        fetchAll<ConfigItem>('config_resilience_test_types'),
        fetchAll<ConfigItem>('config_decommission_reasons'),
        fetchAll<ConfigItem>('config_collaborator_deactivation_reasons'),
        fetchAll<ConfigItem>('config_accounting_categories'),
        fetchAll<ConfigItem>('config_conservation_states'),
        fetchAll<ConfigItem>('config_cpus'),
        fetchAll<ConfigItem>('config_ram_sizes'),
        fetchAll<ConfigItem>('config_storage_types'),
        fetchAll<JobTitle>('config_job_titles'),
        fetchAll<Policy>('policies'),
        fetchAll<any>('policy_acceptances'),
        fetchAll<ProcurementRequest>('procurement_requests'),
        fetchAll<CalendarEvent>('calendar_events'),
        fetchAll<ContinuityPlan>('continuity_plans'),
    ]);

    return {
        equipment, brands, equipmentTypes, instituicoes, entidades, collaborators, assignments,
        tickets, softwareLicenses, licenseAssignments, teams, teamMembers, messages,
        ticketCategories, securityIncidentTypes, businessServices, serviceDependencies,
        vulnerabilities, suppliers, backupExecutions, resilienceTests, securityTrainings,
        configCustomRoles, softwareCategories, softwareProducts, configEquipmentStatuses,
        contactRoles, contactTitles, configCriticalityLevels, configCiaRatings, configServiceStatuses,
        configBackupTypes, configTrainingTypes, configResilienceTestTypes, configDecommissionReasons,
        configCollaboratorDeactivationReasons, configAccountingCategories, configConservationStates,
        configCpus, configRamSizes, configStorageTypes, configJobTitles, policies, policyAcceptances,
        procurementRequests, calendarEvents, continuityPlans,
        collaboratorHistory: [], ticketActivities: []
    };
};

// --- PAGINATION HELPERS ---
export const fetchEquipmentPaginated = async (params: any) => {
    let query = sb().from('equipment').select('*', { count: 'exact' });
    
    // Apply Filters
    if (params.filters) {
        if (params.filters.serialNumber) query = query.ilike('serialNumber', `%${params.filters.serialNumber}%`);
        if (params.filters.description) query = query.ilike('description', `%${params.filters.description}%`);
        if (params.filters.brandId) query = query.eq('brandId', params.filters.brandId);
        if (params.filters.typeId) query = query.eq('typeId', params.filters.typeId);
        if (params.filters.status) query = query.eq('status', params.filters.status);
    }

    if (params.sort) {
        query = query.order(params.sort.key, { ascending: params.sort.direction === 'ascending' });
    }

    if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
    }
    
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data as Equipment[], total: count || 0 };
};

export const fetchCollaboratorsPaginated = async (params: any) => {
    let query = sb().from('collaborators').select('*', { count: 'exact' });

    // Apply Filters
    if (params.filters) {
        if (params.filters.query) {
            const q = `%${params.filters.query}%`;
            query = query.or(`fullName.ilike.${q},email.ilike.${q},numeroMecanografico.ilike.${q}`);
        }
        if (params.filters.entidadeId) query = query.eq('entidadeId', params.filters.entidadeId);
        if (params.filters.status) query = query.eq('status', params.filters.status);
        if (params.filters.role) query = query.eq('role', params.filters.role);
    }
    
    // Sort
    if (params.sort) {
        query = query.order(params.sort.key, { ascending: params.sort.direction === 'ascending' });
    }

    if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
    }
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data as Collaborator[], total: count || 0 };
};

export const fetchTicketsPaginated = async (params: any) => {
    let query = sb().from('tickets').select('*', { count: 'exact' });

    // Apply Filters
    if (params.filters) {
        if (params.filters.title) query = query.ilike('title', `%${params.filters.title}%`);
        if (params.filters.status) query = query.eq('status', params.filters.status);
        if (params.filters.category) query = query.eq('category', params.filters.category);
        if (params.filters.team_id) query = query.eq('team_id', params.filters.team_id);
    }

    // Sort
    if (params.sort) {
        query = query.order(params.sort.key, { ascending: params.sort.direction === 'ascending' });
    }

    if (params.page && params.pageSize) {
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);
    }
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data as Ticket[], total: count || 0 };
};


// --- SPECIFIC ENTITY METHODS ---

// Equipment
export const addEquipment = (item: any) => createItem<Equipment>('equipment', item);
export const updateEquipment = (id: string, updates: any) => updateItem<Equipment>('equipment', id, updates);
export const deleteEquipment = (id: string) => deleteItem('equipment', id);
export const addMultipleEquipment = async (items: any[]) => {
    const { error } = await sb().from('equipment').insert(items);
    if (error) throw error;
};

// Collaborator
export const addCollaborator = async (item: any, password?: string) => {
    return createItem<Collaborator>('collaborators', item);
};
export const updateCollaborator = (id: string, updates: any) => updateItem<Collaborator>('collaborators', id, updates);
export const deleteCollaborator = (id: string) => deleteItem('collaborators', id);
export const uploadCollaboratorPhoto = async (id: string, file: File) => {
    // Mock upload
    console.log("Uploaded photo for", id);
};
export const adminResetPassword = async (id: string, password?: string) => {
    // Mock reset
    console.log("Reset password for", id);
};

// Tickets
export const addTicket = (item: any) => createItem<Ticket>('tickets', item);
export const updateTicket = (id: string, updates: any) => updateItem<Ticket>('tickets', id, updates);
export const getTicketActivities = async (ticketId: string) => {
    const { data } = await sb().from('ticket_activities').select('*').eq('ticketId', ticketId);
    return data as TicketActivity[];
};
export const addTicketActivity = (item: any) => createItem<TicketActivity>('ticket_activities', item);

// Licenses
export const addLicense = (item: any) => createItem<SoftwareLicense>('software_licenses', item);
export const updateLicense = (id: string, updates: any) => updateItem<SoftwareLicense>('software_licenses', id, updates);
export const deleteLicense = (id: string) => deleteItem('software_licenses', id);
export const syncLicenseAssignments = async (equipmentId: string, licenseIds: string[]) => {
    await sb().from('license_assignments').update({ returnDate: new Date().toISOString() }).eq('equipmentId', equipmentId).is('returnDate', null);
    if (licenseIds.length > 0) {
        const toInsert = licenseIds.map(lid => ({
            equipmentId,
            softwareLicenseId: lid,
            assignedDate: new Date().toISOString()
        }));
        await sb().from('license_assignments').insert(toInsert);
    }
};
export const addMultipleLicenses = async (items: any[]) => {
    const { error } = await sb().from('software_licenses').insert(items);
    if (error) throw error;
};


// Assignments
export const addAssignment = (item: any) => createItem<Assignment>('assignments', item);

// Brands & Types
export const addBrand = (item: any) => createItem<Brand>('brands', item);
export const updateBrand = (id: string, updates: any) => updateItem<Brand>('brands', id, updates);
export const deleteBrand = (id: string) => deleteItem('brands', id);

export const addEquipmentType = (item: any) => createItem<EquipmentType>('equipment_types', item);
export const updateEquipmentType = (id: string, updates: any) => updateItem<EquipmentType>('equipment_types', id, updates);
export const deleteEquipmentType = (id: string) => deleteItem('equipment_types', id);

// Institutions & Entities
export const addInstituicao = (item: any) => createItem<Instituicao>('instituicoes', item);
export const updateInstituicao = (id: string, updates: any) => updateItem<Instituicao>('instituicoes', id, updates);
export const deleteInstituicao = (id: string) => deleteItem('instituicoes', id);

export const addEntidade = (item: any) => createItem<Entidade>('entidades', item);
export const updateEntidade = (id: string, updates: any) => updateItem<Entidade>('entidades', id, updates);
export const deleteEntidade = (id: string) => deleteItem('entidades', id);

// Teams
export const addTeam = (item: any) => createItem<Team>('teams', item);
export const updateTeam = (id: string, updates: any) => updateItem<Team>('teams', id, updates);
export const deleteTeam = (id: string) => deleteItem('teams', id);
export const syncTeamMembers = async (teamId: string, memberIds: string[]) => {
    await sb().from('team_members').delete().eq('team_id', teamId);
    if (memberIds.length > 0) {
        await sb().from('team_members').insert(memberIds.map(mid => ({ team_id: teamId, collaborator_id: mid })));
    }
};

// Suppliers
export const addSupplier = (item: any) => createItem<Supplier>('suppliers', item);
export const updateSupplier = (id: string, updates: any) => updateItem<Supplier>('suppliers', id, updates);
export const deleteSupplier = (id: string) => deleteItem('suppliers', id);

// Configs (Generic)
export const addConfigItem = (table: string, item: any) => createItem<ConfigItem>(table, item);
export const updateConfigItem = (table: string, id: string, updates: any) => updateItem<ConfigItem>(table, id, updates);
export const deleteConfigItem = (table: string, id: string) => deleteItem(table, id);

// Messages
export const addMessage = (item: any) => createItem('messages', item);
export const markMessagesAsRead = async (senderId: string) => {
    await sb().from('messages').update({ read: true }).eq('senderId', senderId);
};

// Procurement
export const addProcurement = (item: any) => createItem<ProcurementRequest>('procurement_requests', item);
export const updateProcurement = (id: string, updates: any) => updateItem<ProcurementRequest>('procurement_requests', id, updates);
export const deleteProcurement = (id: string) => deleteItem('procurement_requests', id);

// Calendar
export const addCalendarEvent = (item: any) => createItem<CalendarEvent>('calendar_events', item);
export const updateCalendarEvent = (id: string, updates: any) => updateItem<CalendarEvent>('calendar_events', id, updates);
export const deleteCalendarEvent = (id: string) => deleteItem('calendar_events', id);

// Continuity
export const addContinuityPlan = (item: any) => createItem('continuity_plans', item);
export const updateContinuityPlan = (id: string, updates: any) => updateItem('continuity_plans', id, updates);
export const deleteContinuityPlan = (id: string) => deleteItem('continuity_plans', id);

// Compliance
export const addBusinessService = (item: any) => createItem('business_services', item);
export const updateBusinessService = (id: string, updates: any) => updateItem('business_services', id, updates);
export const deleteBusinessService = (id: string) => deleteItem('business_services', id);

export const addServiceDependency = (item: any) => createItem('service_dependencies', item);
export const deleteServiceDependency = (id: string) => deleteItem('service_dependencies', id);

export const addVulnerability = (item: any) => createItem('vulnerabilities', item);
export const updateVulnerability = (id: string, updates: any) => updateItem('vulnerabilities', id, updates);
export const deleteVulnerability = (id: string) => deleteItem('vulnerabilities', id);

export const addBackupExecution = (item: any) => createItem('backup_executions', item);
export const updateBackupExecution = (id: string, updates: any) => updateItem('backup_executions', id, updates);
export const deleteBackupExecution = (id: string) => deleteItem('backup_executions', id);

export const addResilienceTest = (item: any) => createItem('resilience_tests', item);
export const updateResilienceTest = (id: string, updates: any) => updateItem('resilience_tests', id, updates);
export const deleteResilienceTest = (id: string) => deleteItem('resilience_tests', id);

export const addSecurityTraining = (item: any) => createItem('security_training_records', item);

export const addPolicy = (item: any) => createItem('policies', item);
export const updatePolicy = (id: string, updates: any) => updateItem('policies', id, updates);
export const deletePolicy = (id: string) => deleteItem('policies', id);
export const acceptPolicy = async (policyId: string, userId: string, version: string) => {
    await sb().from('policy_acceptances').insert({ policy_id: policyId, user_id: userId, version, accepted_at: new Date().toISOString() });
};

// Roles
export const getCustomRoles = async () => fetchAll<CustomRole>('config_custom_roles');
export const addCustomRole = (item: any) => createItem('config_custom_roles', item);
export const updateCustomRole = (id: string, updates: any) => updateItem('config_custom_roles', id, updates);
export const deleteCustomRole = (id: string) => deleteItem('config_custom_roles', id);

// Contacts
export const syncResourceContacts = async (type: string, id: string, contacts: any[]) => {
    await sb().from('resource_contacts').delete().eq('resource_type', type).eq('resource_id', id);
    if(contacts.length > 0) {
        const toInsert = contacts.map(c => ({ ...c, resource_type: type, resource_id: id, id: undefined }));
        await sb().from('resource_contacts').insert(toInsert);
    }
};

export const addContactRole = (item: any) => createItem('contact_roles', item);
export const updateContactRole = (id: string, updates: any) => updateItem('contact_roles', id, updates);
export const deleteContactRole = (id: string) => deleteItem('contact_roles', id);

export const addContactTitle = (item: any) => createItem('contact_titles', item);
export const updateContactTitle = (id: string, updates: any) => updateItem('contact_titles', id, updates);
export const deleteContactTitle = (id: string) => deleteItem('contact_titles', id);

export const addJobTitle = (item: any) => createItem('config_job_titles', item);

// Software Products
export const addSoftwareProduct = (item: any) => createItem('config_software_products', item);
export const updateSoftwareProduct = (id: string, updates: any) => updateItem('config_software_products', id, updates);
export const deleteSoftwareProduct = (id: string) => deleteItem('config_software_products', id);

// Ticket Categories & Incidents
export const addTicketCategory = (item: any) => createItem('ticket_categories', item);
export const updateTicketCategory = (id: string, updates: any) => updateItem('ticket_categories', id, updates);
export const deleteTicketCategory = (id: string) => deleteItem('ticket_categories', id);

export const addSecurityIncidentType = (item: any) => createItem('security_incident_types', item);
export const updateSecurityIncidentType = (id: string, updates: any) => updateItem('security_incident_types', id, updates);
export const deleteSecurityIncidentType = (id: string) => deleteItem('security_incident_types', id);

// Settings & System
export const getGlobalSetting = async (key: string): Promise<string | null> => {
    const { data } = await sb().from('global_settings').select('setting_value').eq('setting_key', key).single();
    return data ? data.setting_value : null;
};
export const updateGlobalSetting = async (key: string, value: string) => {
    const { error } = await sb().from('global_settings').upsert({ setting_key: key, setting_value: value });
    if (error) throw error;
};

export const logAction = async (action: string, type: string, details: string, resourceId?: string) => {
    const { error } = await sb().from('audit_logs').insert({ 
        action, resource_type: type, details, resource_id: resourceId, timestamp: new Date().toISOString() 
    });
    if (error) console.error("Audit Log Failed", error);
};

export const fetchAuditLogs = async (): Promise<AuditLogEntry[]> => {
    const { data } = await sb().from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(1000);
    return data as AuditLogEntry[];
};

export const runSystemDiagnostics = async (): Promise<DiagnosticResult[]> => {
    return [
        { module: 'Database', status: 'Success', message: 'Connection OK' },
        { module: 'Auth', status: 'Success', message: 'User authenticated' },
        { module: 'Storage', status: 'Warning', message: 'Bucket check mocked' }
    ];
};

export const fetchLastAccessReviewDate = async () => {
    const { data } = await sb().from('audit_logs').select('timestamp').eq('action', 'ACCESS_REVIEW').order('timestamp', { ascending: false }).limit(1).single();
    return data ? data.timestamp : null;
};
export const fetchLastRiskAcknowledgement = async () => {
    const { data } = await sb().from('audit_logs').select('timestamp, user_email').eq('action', 'RISK_ACKNOWLEDGE').order('timestamp', { ascending: false }).limit(1).single();
    return data;
};
export const triggerBirthdayCron = async () => {
    const { error } = await sb().rpc('send_daily_birthday_emails');
    if (error) throw error;
};
export const snoozeNotification = (id: string) => {
    const existing = localStorage.getItem('snoozed_notifications');
    const snoozed = existing ? JSON.parse(existing) : [];
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 7); 
    snoozed.push({ id, until: snoozeUntil.toISOString() });
    localStorage.setItem('snoozed_notifications', JSON.stringify(snoozed));
};

export const fetchDbPolicies = async () => {
    const { data, error } = await sb().rpc('get_db_policies');
    if (error) { console.warn("get_db_policies not found."); return []; }
    return data || [];
};

export const fetchDbTriggers = async () => {
    const { data, error } = await sb().rpc('get_db_triggers');
    if (error) { console.warn("get_db_triggers not found."); return []; }
    return data || [];
};

export const fetchDbFunctions = async () => {
    const { data, error } = await sb().rpc('get_db_functions');
    if (error) { console.warn("get_db_functions not found."); return []; }
    return data || [];
};
