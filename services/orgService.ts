
import { getSupabase } from './supabaseClient';
import { ResourceContact } from '../types';

const sb = () => getSupabase();

const cleanPayload = (data: any) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === '') cleaned[key] = null;
    });
    return cleaned;
};

export const fetchOrganizationData = async () => {
    const results = await Promise.all([
        sb().from('instituicoes').select('*'),
        sb().from('entidades').select('*'),
        sb().from('collaborators').select('*'),
        sb().from('config_custom_roles').select('*'),
        sb().from('contact_titles').select('*'),
        sb().from('contact_roles').select('*'),
        sb().from('collaborator_history').select('*')
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

export const addInstituicao = async (inst: any) => { const { data } = await sb().from('instituicoes').insert(cleanPayload(inst)).select().single(); return data; };
export const updateInstituicao = async (id: string, updates: any) => { await sb().from('instituicoes').update(cleanPayload(updates)).eq('id', id); };
export const deleteInstituicao = async (id: string) => { await sb().from('instituicoes').delete().eq('id', id); };
export const addEntidade = async (ent: any) => { const { data } = await sb().from('entidades').insert(cleanPayload(ent)).select().single(); return data; };
export const updateEntidade = async (id: string, updates: any) => { await sb().from('entidades').update(cleanPayload(updates)).eq('id', id); };
export const deleteEntidade = async (id: string) => { await sb().from('entidades').delete().eq('id', id); };
export const addCollaborator = async (col: any, password?: string) => { const { data } = await sb().from('collaborators').insert(cleanPayload(col)).select().single(); return data; };
export const updateCollaborator = async (id: string, updates: any) => { await sb().from('collaborators').update(cleanPayload(updates)).eq('id', id); };
export const deleteCollaborator = async (id: string) => { await sb().from('collaborators').delete().eq('id', id); };

export const uploadCollaboratorPhoto = async (id: string, file: File) => { 
    const filePath = `avatars/${id}-${file.name}`; 
    await sb().storage.from('avatars').upload(filePath, file, { upsert: true }); 
    const { data: { publicUrl } } = sb().storage.from('avatars').getPublicUrl(filePath); 
    await sb().from('collaborators').update({ photo_url: publicUrl }).eq('id', id); 
    return publicUrl; 
};

export const fetchCollaboratorsPaginated = async (params: { page: number, pageSize: number, filters?: any, sort?: { key: string, direction: 'ascending' | 'descending' } }) => {
    let query = sb().from('collaborators').select('*', { count: 'exact' });
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

export const addContactRole = async (item: any) => { const { data } = await sb().from('contact_roles').insert(cleanPayload(item)).select().single(); return data; };
export const updateContactRole = async (id: string, updates: any) => { await sb().from('contact_roles').update(cleanPayload(updates)).eq('id', id); };
export const deleteContactRole = async (id: string) => { await sb().from('contact_roles').delete().eq('id', id); };
export const addContactTitle = async (item: any) => { const { data } = await sb().from('contact_titles').insert(cleanPayload(item)).select().single(); return data; };
export const updateContactTitle = async (id: string, updates: any) => { await sb().from('contact_titles').update(cleanPayload(updates)).eq('id', id); };
export const deleteContactTitle = async (id: string) => { await sb().from('contact_titles').delete().eq('id', id); };
