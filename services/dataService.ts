
import { getSupabase } from './supabaseClient';
import { 
    Equipment, Brand, EquipmentType, Instituicao, Entidade, Collaborator, 
    Assignment, Ticket, TicketActivity, SoftwareLicense, LicenseAssignment, 
    Team, TeamMember, Message, CollaboratorHistory, TicketCategoryItem, 
    SecurityIncidentTypeItem, BusinessService, ServiceDependency, Vulnerability, 
    BackupExecution, Supplier, ResilienceTest, SecurityTrainingRecord, AuditAction,
    ResourceContact, ContactRole, ContactTitle, ConfigItem, GlobalSetting, CustomRole
} from '../types';
import { createClient } from '@supabase/supabase-js';

// --- Helper to fetch all data concurrently ---
export const fetchAllData = async () => {
    const supabase = getSupabase();
    const [
        equipment, brands, equipmentTypes, instituicoes, entidades, collaborators, 
        assignments, tickets, ticketActivities, softwareLicenses, licenseAssignments, 
        teams, teamMembers, messages, collaboratorHistory, ticketCategories, 
        securityIncidentTypes, businessServices, serviceDependencies, vulnerabilities, 
        suppliers, backupExecutions, resilienceTests, securityTrainings, resourceContacts, 
        contactRoles, contactTitles, globalSettings,
        // Configuration Tables
        configEquipmentStatuses, configUserRoles, configCriticalityLevels, 
        configCiaRatings, configServiceStatuses, configBackupTypes, 
        configTrainingTypes, configResilienceTestTypes, configSoftwareCategories, configCustomRoles
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
        // Configs
        supabase.from('config_equipment_statuses').select('*'),
        supabase.from('config_user_roles').select('*'),
        supabase.from('config_criticality_levels').select('*'),
        supabase.from('config_cia_ratings').select('*'),
        supabase.from('config_service_statuses').select('*'),
        supabase.from('config_backup_types').select('*'),
        supabase.from('config_training_types').select('*'),
        supabase.from('config_resilience_test_types').select('*'),
        supabase.from('config_software_categories').select('*'),
        supabase.from('config_custom_roles').select('*')
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
        globalSettings: globalSettings.data || [],
        // Configs
        configEquipmentStatuses: configEquipmentStatuses.data || [],
        configUserRoles: configUserRoles.data || [],
        configCriticalityLevels: configCriticalityLevels.data || [],
        configCiaRatings: configCiaRatings.data || [],
        configServiceStatuses: configServiceStatuses.data || [],
        configBackupTypes: configBackupTypes.data || [],
        configTrainingTypes: configTrainingTypes.data || [],
        configResilienceTestTypes: configResilienceTestTypes.data || [],
        configSoftwareCategories: configSoftwareCategories.data || [],
        configCustomRoles: configCustomRoles.data || []
    };
};

// --- Audit Logs ---
export const logAction = async (action: AuditAction, resourceType: string, details: string, resourceId?: string) => {
    const supabase = getSupabase();
    const { data: { user } } = await (supabase.auth as any).getUser();
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

// --- Custom Roles (RBAC) ---
export const getCustomRoles = async (): Promise<CustomRole[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('config_custom_roles').select('*');
    if (error) throw error;
    return data || [];
};
export const addCustomRole = (data: any) => create('config_custom_roles', data);
export const updateCustomRole = (id: string, data: any) => update('config_custom_roles', id, data);
export const deleteCustomRole = (id: string) => remove('config_custom_roles', id);

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
export const deleteEquipment = async (id: string) => {
    const supabase = getSupabase();
    await supabase.from('service_dependencies').delete().eq('equipment_id', id);
    await supabase.from('license_assignments').delete().eq('equipmentId', id);
    await supabase.from('assignments').delete().eq('equipmentId', id);
    await supabase.from('backup_executions').delete().eq('equipment_id', id);
    return remove('equipment', id);
};

// Brands & Types
export const addBrand = (data: any) => create('brands', data);
export const updateBrand = (id: string, data: any) => update('brands', id, data);
export const deleteBrand = (id: string) => remove('brands', id);

export const addEquipmentType = (data: any) => create('equipment_types', data);
export const updateEquipmentType = (id: string, data: any) => update('equipment_types', id, data);
export const deleteEquipmentType = (id: string) => remove('equipment_types', id);

// Org
export const addInstituicao = (data: any) => {
    const { contacts, ...rest } = data;
    return create('instituicoes', rest);
};
export const updateInstituicao = (id: string, data: any) => {
    const { contacts, ...rest } = data;
    return update('instituicoes', id, rest);
};
export const deleteInstituicao = (id: string) => remove('instituicoes', id);

export const addEntidade = (data: any) => {
    const { contacts, ...rest } = data;
    return create('entidades', rest);
};
export const updateEntidade = (id: string, data: any) => {
    const { contacts, ...rest } = data;
    return update('entidades', id, rest);
};
export const deleteEntidade = (id: string) => remove('entidades', id);

// Collaborators
export const addCollaborator = async (data: any, password?: string) => {
    const supabase = getSupabase();

    // 1. PRE-CHECK: Ensure email doesn't exist in collaborators table
    // This prevents creating a duplicate collaborator even if Auth is handled
    const { data: existingCollaborator } = await supabase
        .from('collaborators')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();

    if (existingCollaborator) {
        throw new Error("Este email já se encontra registado na ficha de outro colaborador.");
    }

    // Check if login is enabled
    if (data.canLogin) {
        const serviceRoleKey = localStorage.getItem('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = localStorage.getItem('SUPABASE_URL') || process.env.SUPABASE_URL;

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error("Para criar utilizadores com login, configure a Service Role Key em Automação -> Conexões.");
        }

        // Create Admin Client to bypass normal auth restrictions
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        try {
            // Attempt to Create Auth User
            const { data: authData, error: authError } = await (supabaseAdmin.auth as any).admin.createUser({
                email: data.email,
                password: password, // Optional: if undefined, sends invite link
                email_confirm: true, // Auto-confirm email
                user_metadata: { full_name: data.fullName }
            });

            if (authError) {
                // Handle "User already registered" error gracefully
                if (authError.message?.includes('already been registered') || authError.status === 422) {
                    console.log("User already exists in Auth. Attempting to link...");
                    
                    // Fetch user to get ID - Admin client needed to list users
                    const { data: usersData, error: listError } = await (supabaseAdmin.auth as any).admin.listUsers({ perPage: 1000 });
                    
                    if (listError) throw listError;

                    const existingUser = usersData.users.find((u: any) => u.email?.toLowerCase() === data.email?.toLowerCase());

                    if (existingUser) {
                        // Link the new collaborator record to the existing Auth ID
                        data.id = existingUser.id;
                        
                        // If password provided, update it
                        if (password) {
                            await (supabaseAdmin.auth as any).admin.updateUserById(existingUser.id, { password: password });
                        }
                    } else {
                        throw new Error("Email já registado na autenticação, mas não foi possível localizar o ID.");
                    }
                } else {
                    throw authError;
                }
            } else if (authData.user) {
                // New user created successfully
                data.id = authData.user.id;
            }
        } catch (error: any) {
            console.error("Error managing Auth user:", error);
            throw new Error(`Erro na gestão de utilizador: ${error.message}`);
        }
    }

    // Create Data Record
    // create() uses supabase.from().insert(). If data.id is set (from auth), Supabase will use it.
    return create('collaborators', data);
};

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
export const deleteLicense = async (id: string) => {
    const supabase = getSupabase();
    await supabase.from('service_dependencies').delete().eq('software_license_id', id);
    await supabase.from('license_assignments').delete().eq('softwareLicenseId', id);
    return remove('software_licenses', id);
};

export const syncLicenseAssignments = async (equipmentId: string, licenseIds: string[]) => {
    const supabase = getSupabase();
    
    // 1. Fetch ALL current active assignments for this equipment
    const { data: currentActive } = await supabase
        .from('license_assignments')
        .select('id, softwareLicenseId')
        .eq('equipmentId', equipmentId)
        .is('returnDate', null);

    const currentRows = currentActive || [];
    const targetLicenseIds = new Set(licenseIds);
    
    // Track already active licenses to avoid duplicates during addition
    const licensesCurrentlyActive = new Set<string>();

    // 2. Identify rows to CLOSE (Remove)
    // If a currently active row has a License ID NOT in the target list, close it.
    const toRemoveRowIds: string[] = [];
    
    currentRows.forEach((row: any) => {
        if (!targetLicenseIds.has(row.softwareLicenseId)) {
            toRemoveRowIds.push(row.id);
        } else {
            licensesCurrentlyActive.add(row.softwareLicenseId);
        }
    });
    
    // 3. Identify licenses to ADD
    // Add only if it's in target list BUT NOT active in DB (prevents duplicates)
    const toAddLicenseIds: string[] = [];
    targetLicenseIds.forEach(lid => {
        if (!licensesCurrentlyActive.has(lid)) {
            toAddLicenseIds.push(lid);
        }
    });
    
    // Execute DB Operations
    if (toRemoveRowIds.length > 0) {
        await supabase
            .from('license_assignments')
            .update({ returnDate: new Date().toISOString().split('T')[0] })
            .in('id', toRemoveRowIds);
    }

    if (toAddLicenseIds.length > 0) {
        const inserts = toAddLicenseIds.map(lid => ({ 
            equipmentId: equipmentId, 
            softwareLicenseId: lid,
            assignedDate: new Date().toISOString().split('T')[0]
        }));
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
            supplier_id: undefined, 
            resource_id: supplier.id, 
            resource_type: 'supplier',
            is_active: c.is_active !== false
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
                 phone: c.phone,
                 is_active: c.is_active !== false
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
export const deleteBusinessService = async (id: string) => {
    const supabase = getSupabase();
    await supabase.from('service_dependencies').delete().eq('service_id', id);
    return remove('business_services', id);
};
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
        const contactsWithId = contacts.map((c: any) => ({
            resource_id: resourceId,
            resource_type: resourceType,
            title: c.title,
            name: c.name,
            role: c.role,
            email: c.email,
            phone: c.phone,
            is_active: c.is_active !== false
        }));
        await supabase.from('resource_contacts').insert(contactsWithId);
    }
};

// --- Global Settings ---

export const getGlobalSetting = async (key: string): Promise<string | null> => {
    const supabase = getSupabase();
    try {
        const { data, error } = await supabase
            .from('global_settings')
            .select('setting_value')
            .eq('setting_key', key)
            .single();
        
        if (error) {
            if (error.code !== 'PGRST116') console.warn(`Error fetching setting ${key}:`, error);
            return null;
        }
        return data?.setting_value || null;
    } catch (e) {
        return null;
    }
};

export const updateGlobalSetting = async (key: string, value: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('global_settings').upsert({ 
        setting_key: key, 
        setting_value: value,
        updated_at: new Date().toISOString()
    }, { onConflict: 'setting_key' });
    
    if (error) {
        console.error(`Error updating setting ${key}:`, error);
        throw error;
    }
};

// --- Generic Config Items ---

export const addConfigItem = (tableName: string, data: any) => create(tableName, data);
export const updateConfigItem = (tableName: string, id: string, data: any) => update(tableName, id, data);
export const deleteConfigItem = (tableName: string, id: string) => remove(tableName, id);
