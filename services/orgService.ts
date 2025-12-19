
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

export const addInstituicao = async (inst: any) => { const { data, error } = await sb().from('instituicoes').insert(cleanPayload(inst)).select().single(); if (error) throw error; return data; };
export const updateInstituicao = async (id: string, updates: any) => { const { data, error } = await sb().from('instituicoes').update(cleanPayload(updates)).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteInstituicao = async (id: string) => { const { error } = await sb().from('instituicoes').delete().eq('id', id); if (error) throw error; };
export const addEntidade = async (ent: any) => { const { data, error } = await sb().from('entidades').insert(cleanPayload(ent)).select().single(); if (error) throw error; return data; };
export const updateEntidade = async (id: string, updates: any) => { const { data, error } = await sb().from('entidades').update(cleanPayload(updates)).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteEntidade = async (id: string) => { const { error } = await sb().from('entidades').delete().eq('id', id); if (error) throw error; };
export const addCollaborator = async (col: any, password?: string) => { const { data, error } = await sb().from('collaborators').insert(cleanPayload(col)).select().single(); if (error) throw error; return data; };
export const updateCollaborator = async (id: string, updates: any) => { const { data, error } = await sb().from('collaborators').update(cleanPayload(updates)).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteCollaborator = async (id: string) => { const { error } = await sb().from('collaborators').delete().eq('id', id); if (error) throw error; };
export const uploadCollaboratorPhoto = async (id: string, file: File) => { const filePath = `avatars/${id}-${file.name}`; const { error: uploadError } = await sb().storage.from('avatars').upload(filePath, file, { upsert: true }); if (uploadError) throw uploadError; const { data: { publicUrl } } = sb().storage.from('avatars').getPublicUrl(filePath); await updateCollaborator(id, { photoUrl: publicUrl }); return publicUrl; };
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

export const fetchLastAccessReviewDate = async () => { const { data } = await sb().from('audit_log').select('timestamp').eq('action', 'ACCESS_REVIEW').order('timestamp', { ascending: false }).limit(1).maybeSingle(); return data?.timestamp || null; };
export const fetchLastRiskAcknowledgement = async () => { const { data } = await sb().from('audit_log').select('timestamp, user_email').eq('action', 'RISK_ACKNOWLEDGE').order('timestamp', { ascending: false }).limit(1).maybeSingle(); return data || null; };
export const logAction = async (action: string, resourceType: string, details?: string, resourceId?: string) => { await sb().from('audit_log').insert({ action, resource_type: resourceType, details, resource_id: resourceId }); };
export const fetchAuditLogs = async () => { const { data } = await sb().from('audit_log').select('*').order('timestamp', { ascending: false }); return data || []; };
export const triggerBirthdayCron = async () => { const { error } = await sb().rpc('send_daily_birthday_emails'); if (error) throw error; };
export const syncResourceContacts = async (type: string, id: string, contacts: ResourceContact[]) => { await sb().from('resource_contacts').delete().eq('resource_type', type).eq('resource_id', id); if (contacts.length > 0) { const items = contacts.map(c => ({ ...c, resource_type: type, resource_id: id })); await sb().from('resource_contacts').insert(items); } };

// Fix: Add missing contact role and title CRUD functions
export const addContactRole = async (item: any) => { const { data, error } = await sb().from('contact_roles').insert(cleanPayload(item)).select().single(); if (error) throw error; return data; };
export const updateContactRole = async (id: string, updates: any) => { const { data, error } = await sb().from('contact_roles').update(cleanPayload(updates)).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteContactRole = async (id: string) => { const { error } = await sb().from('contact_roles').delete().eq('id', id); if (error) throw error; };
export const addContactTitle = async (item: any) => { const { data, error } = await sb().from('contact_titles').insert(cleanPayload(item)).select().single(); if (error) throw error; return data; };
export const updateContactTitle = async (id: string, updates: any) => { const { data, error } = await sb().from('contact_titles').update(cleanPayload(updates)).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteContactTitle = async (id: string) => { const { error } = await sb().from('contact_titles').delete().eq('id', id); if (error) throw error; };
