
import { getSupabase } from './supabaseClient';
import { 
    AuditAction, DiagnosticResult, Equipment, Ticket, Collaborator, 
    SoftwareLicense, Supplier, EquipmentStatus, ConfigItem
} from '../types';

// Helper to get supabase client
const sb = () => getSupabase();

// --- LOGGING & DIAGNOSTICS ---

export const logAction = async (action: AuditAction, resourceType: string, details: string, resourceId?: string) => {
    try {
        const { data: { user } } = await sb().auth.getUser();
        if (!user) return; // Silent fail if no user
        await sb().from('audit_logs').insert({
            user_id: user.id,
            user_email: user.email,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error("Log action failed", e);
    }
};

export const fetchAuditLogs = async () => {
    const { data, error } = await sb().from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(500);
    if (error) throw error;
    return data || [];
};

export const runSystemDiagnostics = async (): Promise<DiagnosticResult[]> => {
    const results: DiagnosticResult[] = [];
    const tables = ['equipment', 'collaborators', 'tickets', 'audit_logs'];

    for (const table of tables) {
        try {
            const start = performance.now();
            const { error, count } = await sb().from(table).select('*', { count: 'exact', head: true });
            const duration = performance.now() - start;

            if (error) throw error;
            results.push({
                module: `Table: ${table}`,
                status: 'Success',
                message: `Connection OK. Records: ${count}. Latency: ${Math.round(duration)}ms`,
                timestamp: new Date().toISOString()
            });
        } catch (e: any) {
            results.push({
                module: `Table: ${table}`,
                status: 'Failure',
                message: `Error: ${e.message}`,
                timestamp: new Date().toISOString()
            });
        }
    }
    return results;
};

export const fetchDatabaseTriggers = async () => {
    // This requires a specific RPC function to be set up in Supabase to query information_schema or pg_trigger
    // If not available, we return empty or try a raw query if enabled (unlikely from client)
    // We'll try calling an RPC if it exists, otherwise return mockup or empty.
    // Assuming 'get_db_triggers' RPC exists from setup scripts.
    const { data, error } = await sb().rpc('get_db_triggers'); // Custom RPC needed
    if (error) {
        // Fallback for demo/dev if RPC missing
        return { data: [], error: null }; 
    }
    return { data, error };
};

// --- GENERIC CRUD ---

export const create = async (table: string, data: any) => {
    const { data: res, error } = await sb().from(table).insert(data).select().single();
    if (error) throw error;
    return res;
};

export const update = async (table: string, id: string, data: any) => {
    const { data: res, error } = await sb().from(table).update(data).eq('id', id).select().single();
    if (error) throw error;
    return res;
};

export const remove = async (table: string, id: string) => {
    const { error } = await sb().from(table).delete().eq('id', id);
    if (error) throw error;
};

export const getById = async (table: string, id: string) => {
    const { data, error } = await sb().from(table).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
};

// --- SETTINGS ---

export const getGlobalSetting = async (key: string): Promise<string | null> => {
    const { data, error } = await sb().from('global_settings').select('setting_value').eq('setting_key', key).single();
    if (error || !data) return null;
    return data.setting_value;
};

export const updateGlobalSetting = async (key: string, value: string) => {
    const { error } = await sb().from('global_settings').upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });
    if (error) throw error;
};

// --- ENTITY SPECIFIC FUNCTIONS ---

// Brands
export const addBrand = (data: any) => create('brands', data);
export const updateBrand = (id: string, data: any) => update('brands', id, data);
export const deleteBrand = (id: string) => remove('brands', id);

// Equipment Types
export const addEquipmentType = (data: any) => create('equipment_types', data);
export const updateEquipmentType = (id: string, data: any) => update('equipment_types', id, data);
export const deleteEquipmentType = (id: string) => remove('equipment_types', id);

// Equipment
export const addEquipment = (data: any) => create('equipment', data);
export const updateEquipment = (id: string, data: any) => update('equipment', id, data);
export const deleteEquipment = (id: string) => remove('equipment', id); // Not standard used but good to have
export const addMultipleEquipment = async (items: any[]) => {
    const { data, error } = await sb().from('equipment').insert(items).select();
    if (error) throw error;
    return data;
};

// Assignments
export const addAssignment = (data: any) => create('assignments', data);

// Software Licenses
export const addLicense = (data: any) => create('software_licenses', data);
export const updateLicense = (id: string, data: any) => update('software_licenses', id, data);
export const deleteLicense = (id: string) => remove('software_licenses', id);
export const addMultipleLicenses = async (items: any[]) => {
    const { data, error } = await sb().from('software_licenses').insert(items).select();
    if (error) throw error;
    return data;
};
export const syncLicenseAssignments = async (equipmentId: string, licenseIds: string[]) => {
    const supabase = sb();
    // 1. Get current active assignments
    const { data: current } = await supabase.from('license_assignments').select('*').eq('equipmentId', equipmentId).is('returnDate', null);
    // Explicitly cast to string to avoid 'unknown' inference issues
    const currentLicenseIds = new Set<string>((current?.map((c: any) => String(c.softwareLicenseId)) || []));

    const toAdd = licenseIds.filter(id => !currentLicenseIds.has(id));
    const toRemove = Array.from(currentLicenseIds).filter(id => !licenseIds.includes(id));

    // 2. Add new
    if (toAdd.length > 0) {
        const newRecords = toAdd.map(lid => ({
            equipmentId,
            softwareLicenseId: lid,
            assignedDate: new Date().toISOString().split('T')[0]
        }));
        await supabase.from('license_assignments').insert(newRecords);
    }

    // 3. Remove old (update returnDate)
    if (toRemove.length > 0) {
        await supabase.from('license_assignments')
            .update({ returnDate: new Date().toISOString().split('T')[0] })
            .eq('equipmentId', equipmentId)
            .is('returnDate', null)
            .in('softwareLicenseId', toRemove);
    }
};

// Procurement
export const addProcurement = (data: any) => create('procurement_requests', data);
export const updateProcurement = (id: string, data: any) => update('procurement_requests', id, data);
export const deleteProcurement = (id: string) => remove('procurement_requests', id);

// Organization
export const addInstituicao = (data: any) => create('instituicoes', data);
export const updateInstituicao = (id: string, data: any) => update('instituicoes', id, data);
export const deleteInstituicao = (id: string) => remove('instituicoes', id);

export const addEntidade = (data: any) => create('entidades', data);
export const updateEntidade = (id: string, data: any) => update('entidades', id, data);
export const deleteEntidade = (id: string) => remove('entidades', id);

export const addTeam = (data: any) => create('teams', data);
export const updateTeam = (id: string, data: any) => update('teams', id, data);
export const deleteTeam = (id: string) => remove('teams', id);
export const syncTeamMembers = async (teamId: string, memberIds: string[]) => {
    const supabase = sb();
    await supabase.from('team_members').delete().eq('team_id', teamId);
    if (memberIds.length > 0) {
        const records = memberIds.map(mid => ({ team_id: teamId, collaborator_id: mid }));
        await supabase.from('team_members').insert(records);
    }
};

export const addSupplier = (data: any) => create('suppliers', data);
export const updateSupplier = (id: string, data: any) => update('suppliers', id, data);
export const deleteSupplier = (id: string) => remove('suppliers', id);
export const syncResourceContacts = async (type: string, resourceId: string, contacts: any[]) => {
    const supabase = sb();
    // Soft delete or Hard delete? Hard delete for simplicity in editing session
    await supabase.from('resource_contacts').delete().eq('resource_type', type).eq('resource_id', resourceId);
    
    if (contacts.length > 0) {
        const records = contacts.map(c => ({
            ...c,
            id: undefined, // Let DB generate new ID
            resource_type: type,
            resource_id: resourceId
        }));
        await supabase.from('resource_contacts').insert(records);
    }
};

// Collaborators
export const addCollaborator = async (data: any, password?: string) => {
    const supabase = sb();
    // 1. Create in public.collaborators
    const { data: collab, error } = await supabase.from('collaborators').insert(data).select().single();
    if (error) throw error;

    // 2. If login enabled and password provided, create in Auth (Server-side usually, but here via client using service key if possible or anon key if allowed)
    // Note: Client-side creation of other users requires Admin privileges and likely a Supabase Edge Function or proper RLS.
    // For this demo, we assume the user creating has permission or using a special flow.
    // If we have a password, we try to signUp.
    if (data.canLogin && password && data.email) {
        // Warning: signUp signs in the user immediately in client context. 
        // To create user without signing in, use Admin API (Service Role) via Edge Function.
        // We will call an Edge Function or assume the user uses the 'invite' functionality later.
        // Falling back to a direct RPC call if exists, or just skipping auth creation here (manual signup).
        // Let's assume we call a helper RPC or edge function
        await supabase.functions.invoke('admin-create-user', { 
            body: { email: data.email, password, user_metadata: { collaborator_id: collab.id } }
        });
    }
    return collab;
};
export const updateCollaborator = (id: string, data: any) => update('collaborators', id, data);
export const deleteCollaborator = (id: string) => remove('collaborators', id);
export const uploadCollaboratorPhoto = async (id: string, file: File) => {
    const supabase = sb();
    const filePath = `photos/${id}-${Date.now()}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    await updateCollaborator(id, { photoUrl: publicUrl });
};
export const adminResetPassword = async (userId: string, newPassword: string) => {
    // This requires Service Role. We should call an edge function.
    await sb().functions.invoke('admin-reset-password', { body: { userId, newPassword } });
};

// Tickets
export const addTicket = (data: any) => create('tickets', data);
export const updateTicket = (id: string, data: any) => update('tickets', id, data);
export const getTicketActivities = async (ticketId: string) => {
    const { data, error } = await sb().from('ticket_activities').select('*').eq('ticketId', ticketId).order('date', { ascending: false });
    if (error) throw error;
    return data;
};
export const addTicketActivity = (data: any) => create('ticket_activities', data);

export const addTicketCategory = (data: any) => create('ticket_categories', data);
export const updateTicketCategory = (id: string, data: any) => update('ticket_categories', id, data);
export const deleteTicketCategory = (id: string) => remove('ticket_categories', id);

export const addSecurityIncidentType = (data: any) => create('security_incident_types', data);
export const updateSecurityIncidentType = (id: string, data: any) => update('security_incident_types', id, data);
export const deleteSecurityIncidentType = (id: string) => remove('security_incident_types', id);


// Compliance / NIS2
export const addBusinessService = (data: any) => create('business_services', data);
export const updateBusinessService = (id: string, data: any) => update('business_services', id, data);
export const deleteBusinessService = (id: string) => remove('business_services', id);

export const addServiceDependency = (data: any) => create('service_dependencies', data);
export const deleteServiceDependency = (id: string) => remove('service_dependencies', id);

export const addVulnerability = (data: any) => create('vulnerabilities', data);
export const updateVulnerability = (id: string, data: any) => update('vulnerabilities', id, data);
export const deleteVulnerability = (id: string) => remove('vulnerabilities', id);

export const addBackupExecution = (data: any) => create('backup_executions', data);
export const updateBackupExecution = (id: string, data: any) => update('backup_executions', id, data);
export const deleteBackupExecution = (id: string) => remove('backup_executions', id);

export const addResilienceTest = (data: any) => create('resilience_tests', data);
export const updateResilienceTest = (id: string, data: any) => update('resilience_tests', id, data);
export const deleteResilienceTest = (id: string) => remove('resilience_tests', id);

export const addPolicy = (data: any) => create('policies', data);
export const updatePolicy = (id: string, data: any) => update('policies', id, data);
export const deletePolicy = (id: string) => remove('policies', id);
export const acceptPolicy = async (policyId: string, userId: string, version: string) => {
    const { error } = await sb().from('policy_acceptances').insert({
        policy_id: policyId,
        user_id: userId,
        version: version,
        accepted_at: new Date().toISOString()
    });
    if (error) throw error;
};

export const addSecurityTraining = (data: any) => create('security_training_records', data);

// Messaging
export const addMessage = (data: any) => create('messages', data);
export const markMessagesAsRead = async (senderId: string) => {
    const { data: { user } } = await sb().auth.getUser();
    if (!user) return;
    await sb().from('messages').update({ read: true }).eq('senderId', senderId).eq('receiverId', user.id);
};

// Calendar
export const addCalendarEvent = (data: any) => create('calendar_events', data);
export const updateCalendarEvent = (id: string, data: any) => update('calendar_events', id, data);
export const deleteCalendarEvent = (id: string) => remove('calendar_events', id);

// Config Tables
export const addConfigItem = (table: string, data: any) => create(table, data);
export const updateConfigItem = (table: string, id: string, data: any) => update(table, id, data);
export const deleteConfigItem = (table: string, id: string) => remove(table, id);

export const addSoftwareProduct = (data: any) => create('config_software_products', data);
export const updateSoftwareProduct = (id: string, data: any) => update('config_software_products', id, data);
export const deleteSoftwareProduct = (id: string) => remove('config_software_products', id);

// Roles & Permissions
export const getCustomRoles = async () => {
    const { data, error } = await sb().from('config_custom_roles').select('*');
    if (error) throw error;
    return data || [];
};
export const addCustomRole = (data: any) => create('config_custom_roles', data);
export const updateCustomRole = (id: string, data: any) => update('config_custom_roles', id, data);
export const deleteCustomRole = (id: string) => remove('config_custom_roles', id);

// Misc Config Helpers
export const addJobTitle = (data: any) => create('config_job_titles', data);
export const addContactRole = (data: any) => create('contact_roles', data);
export const updateContactRole = (id: string, data: any) => update('contact_roles', id, data);
export const deleteContactRole = (id: string) => remove('contact_roles', id);

export const addContactTitle = (data: any) => create('contact_titles', data);
export const updateContactTitle = (id: string, data: any) => update('contact_titles', id, data);
export const deleteContactTitle = (id: string) => remove('contact_titles', id);

// Dashboard / System
export const fetchLastAccessReviewDate = async () => {
    const { data } = await sb().from('audit_logs').select('timestamp').eq('action', 'ACCESS_REVIEW').order('timestamp', { ascending: false }).limit(1).single();
    return data ? data.timestamp : null;
};
export const fetchLastRiskAcknowledgement = async () => {
    const { data } = await sb().from('audit_logs').select('timestamp, user_email').eq('action', 'RISK_ACKNOWLEDGE').order('timestamp', { ascending: false }).limit(1).single();
    return data;
};
export const triggerBirthdayCron = async () => {
    // Invoke function
    const { error } = await sb().rpc('send_daily_birthday_emails');
    if (error) throw error;
};
export const snoozeNotification = (id: string) => {
    const existing = localStorage.getItem('snoozed_notifications');
    const snoozed = existing ? JSON.parse(existing) : [];
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 7); // Snooze for 7 days
    snoozed.push({ id, until: snoozeUntil.toISOString() });
    localStorage.setItem('snoozed_notifications', JSON.stringify(snoozed));
};

// Pagination Helpers
export const fetchEquipmentPaginated = async ({ page, pageSize, filters, sort }: any) => {
    let query = sb().from('equipment').select('*', { count: 'exact' });

    if (filters) {
        if (filters.serialNumber) query = query.ilike('serialNumber', `%${filters.serialNumber}%`);
        if (filters.description) query = query.ilike('description', `%${filters.description}%`);
        if (filters.brandId) query = query.eq('brandId', filters.brandId);
        if (filters.typeId) query = query.eq('typeId', filters.typeId);
        if (filters.status) query = query.eq('status', filters.status);
    }
    
    if (sort) {
        query = query.order(sort.key, { ascending: sort.direction === 'ascending' });
    } else {
        query = query.order('creationDate', { ascending: false });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await query.range(from, to);
    if (error) throw error;
    
    return { data: data || [], total: count || 0 };
};

export const fetchCollaboratorsPaginated = async ({ page, pageSize, filters, sort }: any) => {
    let query = sb().from('collaborators').select('*', { count: 'exact' });

    if (filters) {
        if (filters.query) {
            query = query.or(`fullName.ilike.%${filters.query}%,email.ilike.%${filters.query}%,numeroMecanografico.ilike.%${filters.query}%`);
        }
        if (filters.entidadeId) query = query.eq('entidadeId', filters.entidadeId);
        if (filters.role) query = query.eq('role', filters.role);
        if (filters.status) query = query.eq('status', filters.status);
    }

    if (sort) {
        query = query.order(sort.key, { ascending: sort.direction === 'ascending' });
    } else {
        query = query.order('fullName', { ascending: true });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await query.range(from, to);
    if (error) throw error;
    
    return { data: data || [], total: count || 0 };
};

export const fetchTicketsPaginated = async ({ page, pageSize, filters, sort }: any) => {
    let query = sb().from('tickets').select('*', { count: 'exact' });

    if (filters) {
        if (filters.title) query = query.ilike('title', `%${filters.title}%`);
        if (filters.category) query = query.eq('category', filters.category);
        if (filters.team_id) query = query.eq('team_id', filters.team_id);
        if (filters.status) {
            if(Array.isArray(filters.status)) {
                query = query.in('status', filters.status);
            } else if (filters.status !== '') {
                query = query.eq('status', filters.status);
            }
        }
    }

    if (sort) {
        query = query.order(sort.key, { ascending: sort.direction === 'ascending' });
    } else {
        query = query.order('requestDate', { ascending: false });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await query.range(from, to);
    if (error) throw error;
    
    return { data: data || [], total: count || 0 };
};

export const fetchAllData = async () => {
    const supabase = sb();
    const [
        { data: brands },
        { data: equipmentTypes },
        { data: equipment }, 
        { data: instituicoes },
        { data: entidades },
        { data: collaborators },
        { data: assignments },
        { data: tickets },
        { data: ticketActivities },
        { data: softwareLicenses },
        { data: licenseAssignments },
        { data: teams },
        { data: teamMembers },
        { data: messages },
        { data: ticketCategories },
        { data: securityIncidentTypes },
        { data: businessServices },
        { data: serviceDependencies },
        { data: vulnerabilities },
        { data: suppliers },
        { data: resourceContacts }, 
        { data: backupExecutions },
        { data: resilienceTests },
        { data: securityTrainings },
        { data: configCustomRoles },
        { data: softwareCategories },
        { data: softwareProducts },
        { data: configEquipmentStatuses },
        { data: contactRoles },
        { data: contactTitles },
        { data: configCriticalityLevels },
        { data: configCiaRatings },
        { data: configServiceStatuses },
        { data: configBackupTypes },
        { data: configTrainingTypes },
        { data: configResilienceTestTypes },
        { data: configDecommissionReasons },
        { data: configCollaboratorDeactivationReasons },
        { data: configAccountingCategories },
        { data: configConservationStates },
        { data: configCpus },
        { data: configRamSizes },
        { data: configStorageTypes },
        { data: configJobTitles },
        { data: policies },
        { data: policyAcceptances },
        { data: procurementRequests },
        { data: calendarEvents },
        { data: continuityPlans },
        { data: collaboratorHistory },
        { data: documentTemplates } 
    ] = await Promise.all([
        supabase.from('brands').select('*'),
        supabase.from('equipment_types').select('*'),
        supabase.from('equipment').select('*'), 
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
        supabase.from('messages').select('*').order('timestamp', { ascending: false }).limit(500),
        supabase.from('ticket_categories').select('*'),
        supabase.from('security_incident_types').select('*'),
        supabase.from('business_services').select('*'),
        supabase.from('service_dependencies').select('*'),
        supabase.from('vulnerabilities').select('*'),
        supabase.from('suppliers').select('*'), 
        supabase.from('resource_contacts').select('*'), 
        supabase.from('backup_executions').select('*'),
        supabase.from('resilience_tests').select('*'),
        supabase.from('security_training_records').select('*'),
        supabase.from('config_custom_roles').select('*'),
        supabase.from('config_software_categories').select('*'),
        supabase.from('config_software_products').select('*'),
        supabase.from('config_equipment_statuses').select('*'),
        supabase.from('contact_roles').select('*'),
        supabase.from('contact_titles').select('*'),
        supabase.from('config_criticality_levels').select('*'),
        supabase.from('config_cia_ratings').select('*'),
        supabase.from('config_service_statuses').select('*'),
        supabase.from('config_backup_types').select('*'),
        supabase.from('config_training_types').select('*'),
        supabase.from('config_resilience_test_types').select('*'),
        supabase.from('config_decommission_reasons').select('*'),
        supabase.from('config_collaborator_deactivation_reasons').select('*'),
        supabase.from('config_accounting_categories').select('*'),
        supabase.from('config_conservation_states').select('*'),
        supabase.from('config_cpus').select('*'),
        supabase.from('config_ram_sizes').select('*'),
        supabase.from('config_storage_types').select('*'),
        supabase.from('config_job_titles').select('*'),
        supabase.from('policies').select('*'),
        supabase.from('policy_acceptances').select('*'),
        supabase.from('procurement_requests').select('*'),
        supabase.from('calendar_events').select('*'),
        supabase.from('continuity_plans').select('*'),
        supabase.from('collaborator_history').select('*'),
        supabase.from('document_templates').select('*')
    ]);

    const suppliersWithContacts = (suppliers || []).map((s: any) => ({
        ...s,
        contacts: (resourceContacts || []).filter((c: any) => c.resource_type === 'supplier' && c.resource_id === s.id)
    }));

    const entitiesWithContacts = (entidades || []).map((e: any) => ({
        ...e,
        contacts: (resourceContacts || []).filter((c: any) => c.resource_type === 'entidade' && c.resource_id === e.id)
    }));
    
    const institutionsWithContacts = (instituicoes || []).map((i: any) => ({
        ...i,
        contacts: (resourceContacts || []).filter((c: any) => c.resource_type === 'instituicao' && c.resource_id === i.id)
    }));

    return {
        brands: brands || [],
        equipmentTypes: equipmentTypes || [],
        equipment: equipment || [],
        instituicoes: institutionsWithContacts,
        entidades: entitiesWithContacts,
        collaborators: collaborators || [],
        assignments: assignments || [],
        tickets: tickets || [],
        ticketActivities: ticketActivities || [],
        softwareLicenses: softwareLicenses || [],
        licenseAssignments: licenseAssignments || [],
        teams: teams || [],
        teamMembers: teamMembers || [],
        messages: messages || [],
        ticketCategories: ticketCategories || [],
        securityIncidentTypes: securityIncidentTypes || [],
        businessServices: businessServices || [],
        serviceDependencies: serviceDependencies || [],
        vulnerabilities: vulnerabilities || [],
        suppliers: suppliersWithContacts,
        backupExecutions: backupExecutions || [],
        resilienceTests: resilienceTests || [],
        securityTrainings: securityTrainings || [],
        configCustomRoles: configCustomRoles || [],
        softwareCategories: softwareCategories || [],
        softwareProducts: softwareProducts || [],
        configEquipmentStatuses: configEquipmentStatuses || [],
        contactRoles: contactRoles || [],
        contactTitles: contactTitles || [],
        configCriticalityLevels: configCriticalityLevels || [],
        configCiaRatings: configCiaRatings || [],
        configServiceStatuses: configServiceStatuses || [],
        configBackupTypes: configBackupTypes || [],
        configTrainingTypes: configTrainingTypes || [],
        configResilienceTestTypes: configResilienceTestTypes || [],
        configDecommissionReasons: configDecommissionReasons || [],
        configCollaboratorDeactivationReasons: configCollaboratorDeactivationReasons || [],
        configAccountingCategories: configAccountingCategories || [],
        configConservationStates: configConservationStates || [],
        configCpus: configCpus || [],
        configRamSizes: configRamSizes || [],
        configStorageTypes: configStorageTypes || [],
        configJobTitles: configJobTitles || [],
        policies: policies || [],
        policyAcceptances: policyAcceptances || [],
        procurementRequests: procurementRequests || [],
        calendarEvents: calendarEvents || [],
        continuityPlans: continuityPlans || [],
        collaboratorHistory: collaboratorHistory || [],
        documentTemplates: documentTemplates || []
    };
};
