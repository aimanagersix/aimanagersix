
import { getSupabase } from './supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { 
    AuditAction, DiagnosticResult
} from '../types';

// --- HELPER FUNCTIONS ---

export const logAction = async (action: AuditAction, resourceType: string, details: string, resourceId?: string) => {
    const supabase = getSupabase();
    try {
        const { data: { user } } = await (supabase.auth as any).getUser();
        if (!user) return; 

        await supabase.from('audit_logs').insert({
            user_id: user.id,
            user_email: user.email,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.warn("Failed to log action:", e);
    }
};

const create = async (table: string, data: any) => {
    const supabase = getSupabase();
    // Use maybeSingle() instead of single() to avoid "Cannot coerce..." errors if RLS hides the return row
    const { data: res, error } = await supabase.from(table).insert(data).select().maybeSingle();
    
    if (error) throw error;
    
    // If creation succeeded but no data returned (RLS), we return the input data as fallback
    // assuming the ID might have been generated or passed.
    const result = res || data;
    
    await logAction('CREATE', table, `Created record in ${table}`, result.id);
    return result;
};

const update = async (table: string, id: string, data: any) => {
    const supabase = getSupabase();
    // Use maybeSingle() to be safe against RLS restrictions returning 0 rows
    const { data: res, error } = await supabase.from(table).update(data).eq('id', id).select().maybeSingle();
    
    if (error) throw error;
    
    // If update succeeded but RLS hid the result, return the data merged with ID
    const result = res || { ...data, id };
    
    await logAction('UPDATE', table, `Updated record in ${table}`, id);
    return result;
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
        configTrainingTypes, configResilienceTestTypes, configSoftwareCategories, configSoftwareProducts, configCustomRoles,
        configDecommissionReasons,
        configCollaboratorDeactivationReasons,
        configAccountingCategories, // CIBE
        configConservationStates,   // States
        configCpus, configRamSizes, configStorageTypes, // NEW HARDWARE TABLES
        policies, policyAcceptances, procurementRequests, calendarEvents, continuityPlans
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
        supabase.from('config_software_products').select('*'),
        supabase.from('config_custom_roles').select('*'),
        supabase.from('config_decommission_reasons').select('*'),
        supabase.from('config_collaborator_deactivation_reasons').select('*'),
        supabase.from('config_accounting_categories').select('*'),
        supabase.from('config_conservation_states').select('*'),
        supabase.from('config_cpus').select('*'),          // NEW
        supabase.from('config_ram_sizes').select('*'),     // NEW
        supabase.from('config_storage_types').select('*'), // NEW
        supabase.from('policies').select('*'),
        supabase.from('policy_acceptances').select('*'),
        supabase.from('procurement_requests').select('*'),
        supabase.from('calendar_events').select('*'),
        supabase.from('continuity_plans').select('*')
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
        configSoftwareProducts: configSoftwareProducts.data || [], 
        configCustomRoles: configCustomRoles.data || [],
        configDecommissionReasons: configDecommissionReasons.data || [],
        configCollaboratorDeactivationReasons: configCollaboratorDeactivationReasons.data || [],
        configAccountingCategories: configAccountingCategories.data || [],
        configConservationStates: configConservationStates.data || [],
        configCpus: configCpus.data || [],                  // NEW
        configRamSizes: configRamSizes.data || [],          // NEW
        configStorageTypes: configStorageTypes.data || [],  // NEW
        policies: policies.data || [],
        policyAcceptances: policyAcceptances.data || [],
        procurementRequests: procurementRequests.data || [],
        calendarEvents: calendarEvents.data || [],
        continuityPlans: continuityPlans.data || []
    };
};

// --- TEMPLATES ---
export const getDocumentTemplates = async () => {
    const supabase = getSupabase();
    const { data } = await supabase.from('document_templates').select('*');
    return data || [];
};
export const addDocumentTemplate = (data: any) => create('document_templates', data);
export const updateDocumentTemplate = (id: string, data: any) => update('document_templates', id, data);
export const deleteDocumentTemplate = (id: string) => remove('document_templates', id);

// --- CONFIG ITEMS ---
export const addConfigItem = (table: string, item: any) => create(table, item);
export const updateConfigItem = (table: string, id: string, item: any) => update(table, id, item);
export const deleteConfigItem = (table: string, id: string) => remove(table, id);

export const addSoftwareProduct = (data: any) => create('config_software_products', data);
export const updateSoftwareProduct = (id: string, data: any) => update('config_software_products', id, data);
export const deleteSoftwareProduct = (id: string) => remove('config_software_products', id);

export const addContactRole = (item: any) => create('contact_roles', item);
export const updateContactRole = (id: string, item: any) => update('contact_roles', id, item);
export const deleteContactRole = (id: string) => remove('contact_roles', id);
export const addContactTitle = (item: any) => create('contact_titles', item);
export const updateContactTitle = (id: string, item: any) => update('contact_titles', id, item);
export const deleteContactTitle = (id: string) => remove('contact_titles', id);

export const getGlobalSetting = async (key: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('global_settings').select('setting_value').eq('setting_key', key).single();
    return data?.setting_value || '';
};
export const updateGlobalSetting = async (key: string, value: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('global_settings').upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });
    if (error) throw error;
    await logAction('UPDATE', 'Settings', `Updated setting ${key}`);
};

export const addCollaborator = async (collaborator: any, password?: string) => {
    const serviceKey = localStorage.getItem('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = localStorage.getItem('SUPABASE_URL');
    if (serviceKey && supabaseUrl && password && collaborator.email) {
         try {
            const adminClient = createClient(supabaseUrl, serviceKey);
            const { data, error } = await (adminClient.auth as any).admin.createUser({
                email: collaborator.email,
                password: password,
                email_confirm: true
            });
            if (error) {
                console.error("Auth creation error", error);
            } else if (data.user) {
                collaborator.id = data.user.id;
            }
        } catch (e) {
            console.error("Admin client error", e);
        }
    }
    return create('collaborators', collaborator);
};
export const updateCollaborator = (id: string, data: any) => update('collaborators', id, data);
export const deleteCollaborator = (id: string) => remove('collaborators', id);

export const adminResetPassword = async (userId: string, newPassword: string) => {
    const serviceKey = localStorage.getItem('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = localStorage.getItem('SUPABASE_URL');
    if (!serviceKey || !supabaseUrl) {
        throw new Error("Service Role Key não configurada.");
    }
    const adminClient = createClient(supabaseUrl, serviceKey, {auth: {autoRefreshToken: false, persistSession: false}});
    const { error: updateError } = await (adminClient.auth as any).admin.updateUserById(userId, { password: newPassword });
    if (!updateError) {
        await logAction('UPDATE', 'Auth', `Admin reset password for user ${userId}`);
        return true;
    }
    if (updateError.message.includes("User not found") || (updateError as any).status === 404) {
        const supabase = getSupabase();
        const { data: collaborator } = await supabase.from('collaborators').select('email, fullName').eq('id', userId).single();
        if (!collaborator || !collaborator.email) throw new Error("Colaborador não encontrado.");
        let targetAuthId: string | undefined;
        const { data: newUser, error: createError } = await (adminClient.auth as any).admin.createUser({
            email: collaborator.email,
            password: newPassword,
            email_confirm: true,
            user_metadata: { full_name: collaborator.fullName }
        });
        if (!createError && newUser?.user) {
            targetAuthId = newUser.user.id;
        } else if (createError) {
            if (createError.message.includes("already_registered") || createError.message.includes("already been registered")) {
                const { data: usersList } = await (adminClient.auth as any).admin.listUsers({ perPage: 1000 });
                const existingUser = usersList.users.find((u: any) => u.email?.toLowerCase() === collaborator.email.toLowerCase());
                if (existingUser) {
                    targetAuthId = existingUser.id;
                    const { error: updateExistingError } = await (adminClient.auth as any).admin.updateUserById(targetAuthId, { password: newPassword });
                    if (updateExistingError) throw updateExistingError;
                } else {
                    throw new Error("Erro de integridade de email.");
                }
            } else {
                throw createError;
            }
        }
        if (targetAuthId && targetAuthId !== userId) {
            const { error: updateDbError } = await supabase.from('collaborators').update({ id: targetAuthId }).eq('id', userId);
            if (updateDbError) throw new Error(`Erro de sincronização: ${updateDbError.message}`);
        }
        await logAction('UPDATE', 'Auth', `Admin fixed and reset password for user ${collaborator.email}`);
        return true;
    }
    throw updateError;
};

export const uploadCollaboratorPhoto = async (id: string, file: File) => {
    const supabase = getSupabase();
    const filePath = `avatars/${id}-${Date.now()}`;
    const { error } = await supabase.storage.from('avatars').upload(filePath, file);
    if (error) {
        if (error.message.includes('Bucket not found') || (error as any).statusCode === '404') {
             throw new Error("O bucket 'avatars' não existe.");
        }
        throw error;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    await updateCollaborator(id, { photoUrl: data.publicUrl });
};

export const addInstituicao = (data: any) => create('instituicoes', data);
export const updateInstituicao = (id: string, data: any) => update('instituicoes', id, data);
export const deleteInstituicao = (id: string) => remove('instituicoes', id);
export const addEntidade = (data: any) => create('entidades', data);
export const updateEntidade = (id: string, data: any) => update('entidades', id, data);
export const deleteEntidade = (id: string) => remove('entidades', id);
export const addBrand = (data: any) => create('brands', data);
export const updateBrand = (id: string, data: any) => update('brands', id, data);
export const deleteBrand = (id: string) => remove('brands', id);
export const addEquipmentType = (data: any) => create('equipment_types', data);
export const updateEquipmentType = (id: string, data: any) => update('equipment_types', id, data);
export const deleteEquipmentType = (id: string) => remove('equipment_types', id);
export const addEquipment = (data: any) => create('equipment', data);
export const updateEquipment = (id: string, data: any) => update('equipment', id, data);
export const deleteEquipment = (id: string) => remove('equipment', id); 
export const addMultipleEquipment = async (items: any[]) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('equipment').insert(items).select();
    if (error) throw error;
    await logAction('CREATE', 'Equipment', `Batch created ${items.length} items`);
    return data;
};
export const addAssignment = (data: any) => create('assignments', data);
export const addLicense = (data: any) => create('software_licenses', data);
export const updateLicense = (id: string, data: any) => update('software_licenses', id, data);
export const deleteLicense = (id: string) => remove('software_licenses', id);
export const syncLicenseAssignments = async (equipmentId: string, licenseIds: string[]) => {
    const supabase = getSupabase();
    const { data: current } = await supabase.from('license_assignments').select('*').eq('equipmentId', equipmentId).is('returnDate', null);
    if (current) {
        for (const curr of current) {
            if (!licenseIds.includes(curr.softwareLicenseId)) {
                await supabase.from('license_assignments').update({ returnDate: new Date().toISOString().split('T')[0] }).eq('id', curr.id);
            }
        }
    }
    const currentIds = current ? current.map((c: any) => c.softwareLicenseId) : [];
    for (const lid of licenseIds) {
        if (!currentIds.includes(lid)) {
            await supabase.from('license_assignments').insert({ 
                equipmentId: equipmentId, 
                softwareLicenseId: lid, 
                assignedDate: new Date().toISOString().split('T')[0] 
            });
        }
    }
};
export const addTicket = (data: any) => create('tickets', data);
export const updateTicket = (id: string, data: any) => update('tickets', id, data);
export const addTicketActivity = (data: any) => create('ticket_activities', data);
export const addTicketCategory = (data: any) => create('ticket_categories', data);
export const updateTicketCategory = (id: string, data: any) => update('ticket_categories', id, data);
export const deleteTicketCategory = (id: string) => remove('ticket_categories', id);
export const addSecurityIncidentType = (data: any) => create('security_incident_types', data);
export const updateSecurityIncidentType = (id: string, data: any) => update('security_incident_types', id, data);
export const deleteSecurityIncidentType = (id: string) => remove('security_incident_types', id);
export const addTeam = (data: any) => create('teams', data);
export const updateTeam = (id: string, data: any) => update('teams', id, data);
export const deleteTeam = (id: string) => remove('teams', id);
export const syncTeamMembers = async (teamId: string, collaboratorIds: string[]) => {
    const supabase = getSupabase();
    await supabase.from('team_members').delete().eq('team_id', teamId);
    if (collaboratorIds.length > 0) {
        const toInsert = collaboratorIds.map(cid => ({ team_id: teamId, collaborator_id: cid }));
        await supabase.from('team_members').insert(toInsert);
    }
};
export const addSupplier = (data: any) => create('suppliers', data);
export const updateSupplier = (id: string, data: any) => update('suppliers', id, data);
export const deleteSupplier = (id: string) => remove('suppliers', id);
export const syncResourceContacts = async (type: string, resourceId: string, contacts: any[]) => {
    const supabase = getSupabase();
    await supabase.from('resource_contacts').delete().eq('resource_type', type).eq('resource_id', resourceId);
    if (contacts.length > 0) {
        const toInsert = contacts.map(c => ({
            ...c,
            resource_type: type,
            resource_id: resourceId,
            id: undefined 
        }));
        await supabase.from('resource_contacts').insert(toInsert);
    }
};
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
export const addSecurityTraining = (data: any) => create('security_training_records', data);
export const addPolicy = (data: any) => create('policies', data);
export const updatePolicy = (id: string, data: any) => update('policies', id, data);
export const deletePolicy = (id: string) => remove('policies', id);
export const acceptPolicy = async (policyId: string, userId: string, version: string) => {
    const supabase = getSupabase();
    await supabase.from('policy_acceptances').insert({ policy_id: policyId, user_id: userId, version });
    await logAction('POLICY_ACCEPTANCE', 'Policy', `Accepted policy ${policyId} version ${version}`);
};
export const addProcurement = (data: any) => create('procurement_requests', data);
export const updateProcurement = (id: string, data: any) => update('procurement_requests', id, data);
export const deleteProcurement = (id: string) => remove('procurement_requests', id);
export const addCalendarEvent = (data: any) => create('calendar_events', data);
export const updateCalendarEvent = (id: string, data: any) => update('calendar_events', id, data);
export const deleteCalendarEvent = (id: string) => remove('calendar_events', id);
export const addMessage = (data: any) => create('messages', data);
export const markMessagesAsRead = async (senderId: string) => {
    const supabase = getSupabase();
    const { data: { user } } = await (supabase.auth as any).getUser();
    if (user) {
        await supabase.from('messages').update({ read: true }).eq('senderId', senderId).eq('receiverId', user.id);
    }
};
export const getCustomRoles = async () => {
    const supabase = getSupabase();
    const { data } = await supabase.from('config_custom_roles').select('*');
    return data || [];
};
export const addCustomRole = (data: any) => create('config_custom_roles', data);
export const updateCustomRole = (id: string, data: any) => update('config_custom_roles', id, data);
export const deleteCustomRole = (id: string) => remove('config_custom_roles', id);
export const fetchLastAccessReviewDate = async () => {
    const supabase = getSupabase();
    const { data } = await supabase.from('audit_logs').select('timestamp').eq('action', 'ACCESS_REVIEW').order('timestamp', { ascending: false }).limit(1).single();
    return data?.timestamp || null;
};
export const fetchLastRiskAcknowledgement = async () => {
    const supabase = getSupabase();
    const { data } = await supabase.from('audit_logs').select('timestamp, user_email').eq('action', 'RISK_ACKNOWLEDGE').order('timestamp', { ascending: false }).limit(1).single();
    return data || null;
};
export const fetchAuditLogs = async () => {
    const supabase = getSupabase();
    const { data } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(500);
    return data || [];
};
export const fetchDatabaseTriggers = async () => {
    const supabase = getSupabase();
    return await supabase.rpc('get_database_triggers');
};
export const snoozeNotification = (id: string) => {
    const snoozedStr = localStorage.getItem('snoozed_notifications');
    let snoozed = snoozedStr ? JSON.parse(snoozedStr) : [];
    const until = new Date();
    until.setDate(until.getDate() + 3); // Snooze for 3 days
    snoozed.push({ id, until: until.toISOString() });
    localStorage.setItem('snoozed_notifications', JSON.stringify(snoozed));
};
export const runSystemDiagnostics = async (): Promise<DiagnosticResult[]> => {
    const results: DiagnosticResult[] = [];
    const supabase = getSupabase();
    const addResult = (module: string, status: 'Success' | 'Failure' | 'Warning', message: string) => {
        results.push({ module, status, message, timestamp: new Date().toISOString() });
    };
    try {
        const { error } = await supabase.from('global_settings').select('count').limit(1);
        if (error) throw error;
        addResult('Database', 'Success', 'Connected to Supabase successfully.');
    } catch (e: any) {
        addResult('Database', 'Failure', `Connection failed: ${e.message}`);
        return results; 
    }
    try {
        const { data, error } = await supabase.storage.getBucket('avatars');
        if (error) throw error;
        addResult('Storage', 'Success', 'Bucket "avatars" accessible.');
    } catch (e: any) {
        addResult('Storage', 'Failure', `Bucket "avatars" check failed: ${e.message}`);
    }
    try {
        const { data, error } = await supabase.rpc('check_pg_cron');
        if (error || !data) addResult('Extensions', 'Warning', 'pg_cron not detected.');
        else addResult('Extensions', 'Success', 'pg_cron enabled.');
    } catch (e) {
        addResult('Extensions', 'Warning', 'Could not verify extensions.');
    }
    return results;
};
