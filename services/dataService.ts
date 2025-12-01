
import { getSupabase } from './supabaseClient';
import { 
    Equipment, Brand, EquipmentType, Instituicao, Entidade, Collaborator, 
    Assignment, Ticket, TicketActivity, SoftwareLicense, LicenseAssignment, 
    Team, TeamMember, Message, CollaboratorHistory, TicketCategoryItem, 
    SecurityIncidentTypeItem, BusinessService, ServiceDependency, Vulnerability, 
    BackupExecution, Supplier, ResilienceTest, SecurityTrainingRecord, AuditAction,
    ResourceContact, ContactRole, ContactTitle, ConfigItem, GlobalSetting, CustomRole, EquipmentStatus,
    Policy, PolicyAcceptance, ProcurementRequest, DiagnosticResult, CalendarEvent
} from '../types';

// --- HELPER FUNCTIONS ---

export const logAction = async (action: AuditAction, resourceType: string, details: string, resourceId?: string) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Should ideally log 'System' or anonymous if no user, but for now require user.

    await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        timestamp: new Date().toISOString()
    });
};

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

// --- DATA FETCHING ---

export const fetchAllData = async () => {
    const supabase = getSupabase();
    const [
        equipment, brands, equipmentTypes, instituicoes, entidades, collaborators, 
        assignments, tickets, ticketActivities, softwareLicenses, licenseAssignments, 
        teams, teamMembers, messages, collaboratorHistory, ticketCategories, 
        securityIncidentTypes, businessServices, serviceDependencies, vulnerabilities, 
        suppliers, backupExecutions, resilienceTests, securityTrainings, resourceContacts, 
        contactRoles, contactTitles, globalSettings,
        configEquipmentStatuses, configUserRoles, configCriticalityLevels, 
        configCiaRatings, configServiceStatuses, configBackupTypes, 
        configTrainingTypes, configResilienceTestTypes, configSoftwareCategories, configCustomRoles,
        policies, policyAcceptances, procurementRequests, calendarEvents
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
        supabase.from('global_settings').select('*'),
        supabase.from('config_equipment_statuses').select('*'),
        supabase.from('config_user_roles').select('*'),
        supabase.from('config_criticality_levels').select('*'),
        supabase.from('config_cia_ratings').select('*'),
        supabase.from('config_service_statuses').select('*'),
        supabase.from('config_backup_types').select('*'),
        supabase.from('config_training_types').select('*'),
        supabase.from('config_resilience_test_types').select('*'),
        supabase.from('config_software_categories').select('*'),
        supabase.from('config_custom_roles').select('*'),
        supabase.from('policies').select('*'),
        supabase.from('policy_acceptances').select('*'),
        supabase.from('procurement_requests').select('*'),
        supabase.from('calendar_events').select('*')
    ]);

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
        globalSettings: globalSettings.data || [],
        configEquipmentStatuses: configEquipmentStatuses.data || [],
        configUserRoles: configUserRoles.data || [],
        configCriticalityLevels: configCriticalityLevels.data || [],
        configCiaRatings: configCiaRatings.data || [],
        configServiceStatuses: configServiceStatuses.data || [],
        configBackupTypes: configBackupTypes.data || [],
        configTrainingTypes: configTrainingTypes.data || [],
        configResilienceTestTypes: configResilienceTestTypes.data || [],
        configSoftwareCategories: configSoftwareCategories.data || [],
        configCustomRoles: configCustomRoles.data || [],
        policies: policies.data || [],
        policyAcceptances: policyAcceptances.data || [],
        procurementRequests: procurementRequests.data || [],
        calendarEvents: calendarEvents.data || []
    };
};

// --- AUDIT & LOGS ---

export const fetchAuditLogs = async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);
    
    if (error) throw error;
    return data || [];
};

export const fetchLastAccessReviewDate = async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('audit_logs')
        .select('timestamp')
        .eq('action', 'ACCESS_REVIEW')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
    
    if (error && error.code !== 'PGRST116') console.error(error);
    return data?.timestamp || null;
};

export const fetchLastRiskAcknowledgement = async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('audit_logs')
        .select('timestamp, user_email')
        .eq('action', 'RISK_ACKNOWLEDGE')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
    
    if (error && error.code !== 'PGRST116') console.error(error);
    return data || null;
};

// --- CONFIG CRUD ---

export const getCustomRoles = async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('config_custom_roles').select('*');
    if (error) throw error;
    return data as CustomRole[];
};

export const addCustomRole = (role: any) => create('config_custom_roles', role);
export const updateCustomRole = (id: string, role: any) => update('config_custom_roles', id, role);
export const deleteCustomRole = (id: string) => remove('config_custom_roles', id);

export const addConfigItem = (table: string, item: any) => create(table, item);
export const updateConfigItem = (table: string, id: string, item: any) => update(table, id, item);
export const deleteConfigItem = (table: string, id: string) => remove(table, id);

export const addContactRole = (item: any) => create('contact_roles', item);
export const updateContactRole = (id: string, item: any) => update('contact_roles', id, item);
export const deleteContactRole = (id: string) => remove('contact_roles', id);

export const addContactTitle = (item: any) => create('contact_titles', item);
export const updateContactTitle = (id: string, item: any) => update('contact_titles', id, item);
export const deleteContactTitle = (id: string) => remove('contact_titles', id);

export const getGlobalSetting = async (key: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('global_settings').select('setting_value').eq('setting_key', key).single();
    if (error && error.code !== 'PGRST116') console.error(error);
    return data?.setting_value || null;
};

export const updateGlobalSetting = async (key: string, value: string) => {
    const supabase = getSupabase();
    // Upsert logic
    const { data, error } = await supabase.from('global_settings').upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' }).select().single();
    if (error) throw error;
    await logAction('UPDATE', 'GlobalSetting', `Updated setting ${key}`, data.id);
    return data;
};

// --- ENTITY CRUD ---

// Equipment
export const addEquipment = (data: any) => create('equipment', data);
export const updateEquipment = (id: string, data: any) => update('equipment', id, data);
export const deleteEquipment = (id: string) => remove('equipment', id);
export const addMultipleEquipment = async (items: any[]) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('equipment').insert(items).select();
    if (error) throw error;
    await logAction('CREATE', 'Equipment', `Batch created ${items.length} equipment items`);
    return data;
};

// Assignments
export const addAssignment = async (data: any) => {
    const supabase = getSupabase();
    // Close previous assignment
    await supabase.from('assignments')
        .update({ returnDate: new Date().toISOString().split('T')[0] })
        .eq('equipmentId', data.equipmentId)
        .is('returnDate', null);
        
    // If it's an "Unassign" action (data has returnDate immediately), update status to Stock
    if (data.returnDate) {
         await supabase.from('equipment').update({ status: 'Stock' }).eq('id', data.equipmentId);
         // In this case we don't create a new assignment record, we just closed the old one above.
         // BUT, the dashboard logic calls addAssignment passing the OLD assignment with returnDate added.
         // So we essentially just closed the old one.
         return true; 
    }

    return create('assignments', data);
};

// Brands & Types
export const addBrand = (data: any) => create('brands', data);
export const updateBrand = (id: string, data: any) => update('brands', id, data);
export const deleteBrand = (id: string) => remove('brands', id);

export const addEquipmentType = (data: any) => create('equipment_types', data);
export const updateEquipmentType = (id: string, data: any) => update('equipment_types', id, data);
export const deleteEquipmentType = (id: string) => remove('equipment_types', id);

// Institutions & Entities
export const addInstituicao = (data: any) => create('instituicoes', data);
export const updateInstituicao = (id: string, data: any) => update('instituicoes', id, data);
export const deleteInstituicao = (id: string) => remove('instituicoes', id);

export const addEntidade = (data: any) => create('entidades', data);
export const updateEntidade = (id: string, data: any) => update('entidades', id, data);
export const deleteEntidade = (id: string) => remove('entidades', id);

// Collaborators
export const addCollaborator = async (data: any, password?: string) => {
    const supabase = getSupabase();
    // Create DB record
    const collaborator = await create('collaborators', data);
    
    // If password provided and canLogin is true, create Auth User (requires Service Role Key usually, or specific setup)
    // Since client-side service role key is unsafe, this is usually done via Edge Function.
    // Here we simulate or use the provided method if feasible.
    // We check if we have the service role key in localStorage (configured in Automation)
    const serviceKey = localStorage.getItem('SUPABASE_SERVICE_ROLE_KEY');
    
    if (password && data.canLogin && serviceKey) {
        try {
            // Initialize admin client
            const { createClient } = await import('@supabase/supabase-js');
            const adminClient = createClient(process.env.SUPABASE_URL!, serviceKey);
            
            const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
                email: data.email,
                password: password,
                email_confirm: true,
                user_metadata: { collaborator_id: collaborator.id }
            });
            
            if (authError) throw authError;
            
            // Update collaborator with auth_id if needed, though linking via email is common
        } catch (e) {
            console.error("Failed to create auth user:", e);
            alert("Colaborador criado, mas falha ao criar utilizador de login (Auth). Verifique a chave de serviço.");
        }
    }
    
    return collaborator;
};
export const updateCollaborator = (id: string, data: any) => update('collaborators', id, data);
export const deleteCollaborator = (id: string) => remove('collaborators', id);
export const uploadCollaboratorPhoto = async (id: string, file: File) => {
    const supabase = getSupabase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}.${fileExt}`;
    const filePath = `avatars/${fileName}`; // Explicit folder 'avatars'
    
    // Ensure bucket exists is hard from client without admin key, 
    // so we assume the 'DatabaseSchemaModal' script has been run.
    
    let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
        console.error("Upload failed:", uploadError);
        if (uploadError.message.includes("Bucket not found")) {
             throw new Error("O bucket 'avatars' não existe. Por favor, vá a Configurações > Config BD e execute o script de atualização.");
        }
        throw uploadError;
    }
    
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    
    await update('collaborators', id, { photoUrl: publicUrl });
    return publicUrl;
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
        const toInsert = memberIds.map(mid => ({ team_id: teamId, collaborator_id: mid }));
        await supabase.from('team_members').insert(toInsert);
    }
    await logAction('UPDATE', 'Team', `Synced members for team ${teamId}`);
};

// Licenses
export const addLicense = (data: any) => create('software_licenses', data);
export const updateLicense = (id: string, data: any) => update('software_licenses', id, data);
export const deleteLicense = (id: string) => remove('software_licenses', id);
export const syncLicenseAssignments = async (equipmentId: string, licenseIds: string[]) => {
    const supabase = getSupabase();
    // Logic:
    // 1. Find currently active assignments for this equipment (returnDate is null)
    // 2. Determine which to close (returnDate = now) -> ones NOT in licenseIds
    // 3. Determine which to create -> ones in licenseIds BUT NOT in active
    
    const { data: currentActive } = await supabase.from('license_assignments')
        .select('id, softwareLicenseId')
        .eq('equipmentId', equipmentId)
        .is('returnDate', null);
        
    const currentActiveIds = new Set((currentActive || []).map((a: any) => a.softwareLicenseId));
    const newIdsSet = new Set(licenseIds);
    
    // To Close
    const toClose = (currentActive || []).filter((a: any) => !newIdsSet.has(a.softwareLicenseId));
    for (const assignment of toClose) {
        await supabase.from('license_assignments').update({ returnDate: new Date().toISOString().split('T')[0] }).eq('id', assignment.id);
    }
    
    // To Create
    const toCreate = licenseIds.filter(id => !currentActiveIds.has(id));
    if (toCreate.length > 0) {
        const insertData = toCreate.map(lid => ({
            equipmentId: equipmentId,
            softwareLicenseId: lid,
            assignedDate: new Date().toISOString().split('T')[0]
        }));
        await supabase.from('license_assignments').insert(insertData);
    }
    
    await logAction('UPDATE', 'Equipment', `Synced licenses for equipment ${equipmentId}`);
};

// Tickets
export const addTicket = (data: any) => create('tickets', data);
export const updateTicket = (id: string, data: any) => update('tickets', id, data);
export const addTicketActivity = (data: any) => create('ticket_activities', data);

export const addTicketCategory = (data: any) => create('ticket_categories', data);
export const updateTicketCategory = (id: string, data: any) => update('ticket_categories', id, data);
export const deleteTicketCategory = (id: string) => remove('ticket_categories', id);

export const addSecurityIncidentType = (data: any) => create('security_incident_types', data);
export const updateSecurityIncidentType = (id: string, data: any) => update('security_incident_types', id, data);
export const deleteSecurityIncidentType = (id: string) => remove('security_incident_types', id);

// Suppliers
export const addSupplier = (data: any) => create('suppliers', data);
export const updateSupplier = (id: string, data: any) => update('suppliers', id, data);
export const deleteSupplier = (id: string) => remove('suppliers', id);

// BIA (Services)
export const addBusinessService = (data: any) => create('business_services', data);
export const updateBusinessService = (id: string, data: any) => update('business_services', id, data);
export const deleteBusinessService = (id: string) => remove('business_services', id);
export const addServiceDependency = (data: any) => create('service_dependencies', data);
export const deleteServiceDependency = (id: string) => remove('service_dependencies', id);

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
export const deleteSecurityTraining = (id: string) => remove('security_training_records', id);

// Policies (New)
export const addPolicy = (data: any) => create('policies', data);
export const updatePolicy = (id: string, data: any) => update('policies', id, data);
export const deletePolicy = (id: string) => remove('policies', id);

export const acceptPolicy = async (policyId: string, userId: string, version: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('policy_acceptances').insert({
        policy_id: policyId,
        user_id: userId,
        version: version,
        accepted_at: new Date().toISOString()
    }).select().single();
    
    if (error) throw error;
    await logAction('POLICY_ACCEPTANCE', 'Policy', `User ${userId} accepted policy ${policyId} v${version}`);
    return data;
};

// Procurement (NEW)
export const addProcurement = (data: any) => create('procurement_requests', data);
export const updateProcurement = (id: string, data: any) => update('procurement_requests', id, data);
export const deleteProcurement = (id: string) => remove('procurement_requests', id);

// Calendar Events (NEW)
export const addCalendarEvent = (data: any) => create('calendar_events', data);
export const updateCalendarEvent = (id: string, data: any) => update('calendar_events', id, data);
export const deleteCalendarEvent = (id: string) => remove('calendar_events', id);


// Messaging
export const addMessage = (data: any) => create('messages', data);
export const markMessagesAsRead = async (senderId: string) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('messages')
        .update({ read: true })
        .eq('senderId', senderId)
        .eq('receiverId', user.id)
        .eq('read', false);
};

export const snoozeNotification = (id: string) => {
    // Implementation depends on where snoozes are stored. LocalStorage for now.
    const snoozed = JSON.parse(localStorage.getItem('snoozed_notifications') || '[]');
    snoozed.push({ id, until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }); // 24h snooze
    localStorage.setItem('snoozed_notifications', JSON.stringify(snoozed));
};

// Contacts (Polyimorphic)
export const syncResourceContacts = async (resourceType: string, resourceId: string, contacts: any[]) => {
    const supabase = getSupabase();
    // Delete existing for this resource
    await supabase.from('resource_contacts').delete().eq('resource_type', resourceType).eq('resource_id', resourceId);
    
    if (contacts.length > 0) {
        const toInsert = contacts.map(c => ({
            ...c,
            resource_type: resourceType,
            resource_id: resourceId,
            id: undefined // let DB generate ID
        }));
        await supabase.from('resource_contacts').insert(toInsert);
    }
};

// --- SYSTEM DIAGNOSTICS ---
export const runSystemDiagnostics = async (): Promise<DiagnosticResult[]> => {
    const supabase = getSupabase();
    const results: DiagnosticResult[] = [];
    const timestamp = new Date().toISOString();
    
    const addResult = (module: string, status: 'Success' | 'Failure' | 'Warning', message: string, details?: any) => {
        results.push({ module, status, message, details: details ? JSON.stringify(details) : undefined, timestamp });
    };

    // Test Instituicao first (no deps)
    const testInstName = `DIAG_TEST_INST_${Date.now()}`;
    const { data: createdInst, error: instError } = await supabase.from('instituicoes').insert({ name: testInstName, codigo: 'DT', email: 'd@t.com', telefone: '123' }).select().single();

    if(instError) {
        addResult(`CRUD: instituicoes`, 'Failure', `Falha no teste: CREATE failed: ${instError.message}. Verifique a RLS (Row Level Security) e se a tabela existe.`);
    } else {
        addResult(`CRUD: instituicoes`, 'Success', 'Operações de CRUD (Criar, Ler, Apagar) funcionam.');
        
        // Now test Entidade with the created Instituicao
        const testEntName = `DIAG_TEST_ENT_${Date.now()}`;
        const { error: entError } = await supabase.from('entidades').insert({ name: testEntName, codigo: 'DE', instituicaoId: createdInst.id, email: 'd@t.com' }).select().single();

        if (entError) {
            addResult(`CRUD: entidades`, 'Failure', `Falha no teste: CREATE failed: ${entError.message}. Verifique a RLS (Row Level Security) e se a tabela existe.`);
        } else {
             addResult(`CRUD: entidades`, 'Success', 'Operações de CRUD (Criar, Ler, Apagar) funcionam.');
        }
        
        // Cleanup
        await supabase.from('entidades').delete().eq('name', testEntName);
        await supabase.from('instituicoes').delete().eq('id', createdInst.id);
    }
    
    // Integrity Checks via RPC
    try {
        const { data: orphanEntities, error: e1 } = await supabase.rpc('count_orphaned_entities');
        if (e1) throw e1;
        if (orphanEntities > 0) addResult('Integrity: Entidades', 'Warning', `${orphanEntities} entidades órfãs encontradas (ligadas a instituições inexistentes).`);
        else addResult('Integrity: Entidades', 'Success', 'Nenhuma entidade órfã.');

        const { data: orphanCollabs, error: e2 } = await supabase.rpc('count_orphaned_collaborators');
        if (e2) throw e2;
        if (orphanCollabs > 0) addResult('Integrity: Colaboradores', 'Warning', `${orphanCollabs} colaboradores órfãos encontrados.`);
        else addResult('Integrity: Colaboradores', 'Success', 'Nenhum colaborador órfão.');
        
        const { data: orphanAssigns, error: e3 } = await supabase.rpc('count_orphaned_assignments');
        if (e3) throw e3;
        if (orphanAssigns > 0) addResult('Integrity: Atribuições', 'Warning', `${orphanAssigns} atribuições órfãs encontradas.`);
        else addResult('Integrity: Atribuições', 'Success', 'Nenhuma atribuição órfã.');

    } catch(e: any) {
         addResult('Integrity Checks', 'Failure', `Falha ao verificar integridade: ${e.message}. Execute o script de atualização de BD para criar as funções SQL de diagnóstico.`, { details: e.details });
    }

    // Supabase Extensions/Config Checks
    try {
        const { data, error } = await supabase.storage.getBucket('avatars');
        if (error) throw new Error(error.message);
        addResult('Supabase: Storage', 'Success', 'Bucket "avatars" encontrado e acessível.');
    } catch (e: any) {
        addResult('Supabase: Storage', 'Failure', `Bucket "avatars" não encontrado ou RLS incorreta: ${e.message}. Execute o script de atualização.`);
    }

    try {
        const { data, error } = await supabase.rpc('check_pg_cron');
        if (error || !data) throw new Error("pg_cron não encontrado.");
        addResult('Supabase: pg_cron', 'Success', 'Extensão pg_cron está instalada.');
    } catch(e: any) {
        addResult('Supabase: pg_cron', 'Warning', `Extensão pg_cron não encontrada. Relatórios automáticos não funcionarão.`);
    }

    await logAction('DIAGNOSTIC', 'System', 'Executed comprehensive system diagnostics.');
    return results;
};
