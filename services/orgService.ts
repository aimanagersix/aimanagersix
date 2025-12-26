import { getSupabase } from './supabaseClient';
import { ResourceContact } from '../types';
import { adminProvisionUser } from './authService';

const sb = () => getSupabase();

const cleanPayload = (data: any) => {
    const cleaned = { ...data };
    delete cleaned.address; 
    delete cleaned.contacts;
    delete cleaned.preferences;
    delete cleaned.job_title_name;

    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === '' || cleaned[key] === undefined) cleaned[key] = null;
    });
    return cleaned;
};

export const fetchOrganizationData = async () => {
    const results = await Promise.all([
        sb().from('institutions').select('*').order('name'),
        sb().from('entities').select('*').order('name'),
        // Pedido 4: Filtrar Soft Delete
        sb().from('collaborators').select('*').is('deleted_at', null).order('full_name'),
        sb().from('config_custom_roles').select('*').order('name'),
        sb().from('contact_titles').select('*').order('name'),
        sb().from('contact_roles').select('*').order('name'),
        sb().from('collaborator_history').select('*').order('start_date', { ascending: false })
    ]);
    return { 
        instituicoes: results[0].data || [], 
        entidades: results[1].data || [], 
        collaborators: results[2].data || [], 
        customRoles: results[3].data || [], 
        contactTitles: results[4].data || [],
        contactRoles: results[5].data || [],
        collaboratorHistory: results[6].data || []
    };
};

export const addInstituicao = async (inst: any) => { 
    const { data, error } = await sb().from('institutions').insert(cleanPayload(inst)).select().single(); 
    if (error) throw error;
    return data; 
};

export const updateInstituicao = async (id: string, updates: any) => { 
    const { error } = await sb().from('institutions').update(cleanPayload(updates)).eq('id', id); 
    if (error) throw error;
};

export const deleteInstituicao = async (id: string) => { 
    const { error } = await sb().from('institutions').delete().eq('id', id); 
    if (error) throw error;
};

export const addEntidade = async (ent: any) => { 
    const { data, error } = await sb().from('entities').insert(cleanPayload(ent)).select().single(); 
    if (error) throw error;
    return data; 
};

export const updateEntidade = async (id: string, updates: any) => { 
    const { error } = await sb().from('entities').update(cleanPayload(updates)).eq('id', id); 
    if (error) throw error;
};

export const deleteEntidade = async (id: string) => { 
    const { error } = await sb().from('entities').delete().eq('id', id); 
    if (error) throw error;
};

/**
 * addCollaborator v2.8 - Auth-First Flow
 */
export const addCollaborator = async (col: any, password?: string) => { 
    const tempPass = password || "AIManager" + Math.floor(1000 + Math.random() * 9000) + "!";
    const authResult = await adminProvisionUser(crypto.randomUUID(), col.email, tempPass);
    if (!authResult.success || !authResult.user?.id) {
        throw new Error("Não foi possível criar a identidade digital (Auth) no servidor.");
    }
    const payload = { 
        ...cleanPayload(col),
        id: authResult.user.id 
    };
    const { data, error } = await sb().from('collaborators').insert(payload).select().single(); 
    if (error) throw error;
    return { ...data, temporaryPassword: tempPass }; 
};

export const updateCollaborator = async (id: string, updates: any) => { 
    const { error } = await sb().from('collaborators').update(cleanPayload(updates)).eq('id', id); 
    if (error) throw error;
};

// Pedido 4: Implementação de Soft Delete com Auditoria
export const deleteCollaborator = async (id: string, reason: string = 'Remoção Administrativa') => { 
    const { data: { user } } = await sb().auth.getUser();
    
    // 1. Marcar como removido logicamente
    const { error: softDelError } = await sb().from('collaborators').update({ 
        deleted_at: new Date().toISOString(),
        status: 'Inativo'
    }).eq('id', id); 
    
    if (softDelError) throw softDelError;

    // 2. Registar na tabela de auditoria de abate
    await sb().from('decommission_audit').insert({
        resource_type: 'collaborator',
        resource_id: id,
        reason: reason,
        deleted_by: user?.email || 'Sistema'
    });
};

export const uploadCollaboratorPhoto = async (id: string, file: File) => { 
    const filePath = `avatars/${id}-${file.name}`; 
    const { error: uploadError } = await sb().storage.from('avatars').upload(filePath, file, { upsert: true }); 
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = sb().storage.from('avatars').getPublicUrl(filePath); 
    const { error: updateError } = await sb().from('collaborators').update({ photo_url: publicUrl }).eq('id', id); 
    if (updateError) throw updateError;
    return publicUrl; 
};

export const fetchCollaboratorsPaginated = async (params: { page: number, pageSize: number, filters?: any, sort?: { key: string, direction: 'ascending' | 'descending' } }) => {
    // Pedido 4: Ocultar itens removidos logicamente
    let query = sb().from('collaborators').select('*', { count: 'exact' }).is('deleted_at', null);
    if (params.filters) {
        if (params.filters.query) query = query.or(`full_name.ilike.%${params.filters.query}%,email.ilike.%${params.filters.query}%,numero_mecanografico.ilike.%${params.filters.query}%`);
        if (params.filters.entidade_id) query = query.eq('entidade_id', params.filters.entidade_id);
        if (params.filters.status) query = query.eq('status', params.filters.status);
        if (params.filters.role) query = query.eq('role', params.filters.role);
    }
    const sortObj = params.sort || { key: 'full_name', direction: 'ascending' };
    query = query.order(sortObj.key, { ascending: sortObj.direction === 'ascending' });
    const from = (params.page - 1) * params.pageSize;
    const { data, count, error } = await query.range(from, from + params.pageSize - 1);
    if (error) throw error;
    return { data: data || [], total: count || 0 };
};

export const fetchLastAccessReviewDate = async () => { const { data } = await sb().from('audit_log').select('timestamp').eq('action', 'ACCESS_REVIEW').order('timestamp', { ascending: false }).limit(1).maybeSingle(); return data?.timestamp || null; };
export const fetchLastRiskAcknowledgement = async () => { const { data } = await sb().from('audit_log').select('timestamp, user_email').eq('action', 'RISK_ACKNOWLEDGE').order('timestamp', { ascending: false }).limit(1).maybeSingle(); return data || null; };
export const logAction = async (action: string, resourceType: string, details?: string, resourceId?: string) => { await sb().from('audit_log').insert({ action, resource_type: resourceType, details, resource_id: resourceId }); };
export const fetchAuditLogs = async () => { const { data } = await sb().from('audit_log').select('*').order('timestamp', { ascending: false }); return data || []; };
export const triggerBirthdayCron = async () => { await sb().rpc('send_daily_birthday_emails'); };
export const syncResourceContacts = async (type: string, id: string, contacts: ResourceContact[]) => { 
    await sb().from('resource_contacts').delete().eq('resource_type', type).eq('resource_id', id); 
    if (contacts.length > 0) { 
        const items = contacts.map(c => ({ ...c, resource_type: type, resource_id: id })); 
        await sb().from('resource_contacts').insert(items); 
    } 
};

export const addContactRole = async (item: any) => { const { data, error } = await sb().from('contact_roles').insert(cleanPayload(item)).select().single(); if (error) throw error; return data; };
export const updateContactRole = async (id: string, updates: any) => { const { error } = await sb().from('contact_roles').update(cleanPayload(updates)).eq('id', id); if (error) throw error; };
export const deleteContactRole = async (id: string) => { const { error } = await sb().from('contact_roles').delete().eq('id', id); if (error) throw error; };
export const addContactTitle = async (item: any) => { const { data, error } = await sb().from('contact_titles').insert(cleanPayload(item)).select().single(); if (error) throw error; return data; };
export const updateContactTitle = async (id: string, updates: any) => { const { error } = await sb().from('contact_titles').update(cleanPayload(updates)).eq('id', id); if (error) throw error; };
export const deleteContactTitle = async (id: string) => { const { error } = await sb().from('contact_titles').delete().eq('id', id); if (error) throw error; };