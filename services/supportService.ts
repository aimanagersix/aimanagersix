
import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

const cleanPayload = (data: any) => {
    const cleaned: any = {};
    const keyMap: Record<string, string> = {
        'requestDate': 'request_date',
        'finishDate': 'finish_date',
        'collaboratorId': 'collaborator_id',
        'technicianId': 'technician_id',
        'entidadeId': 'entidade_id',
        'teamId': 'team_id',
        'equipmentId': 'equipment_id',
        'securityIncidentType': 'security_incident_type',
        'impactCriticality': 'impact_criticality',
        'resolutionSummary': 'resolution_summary',
        'requesterSupplierId': 'requester_supplier_id',
        'ticketId': 'ticket_id',
        'startDate': 'start_date',
        'endDate': 'end_date',
        'isAllDay': 'is_all_day',
        'isPrivate': 'is_private',
        'createdBy': 'created_by',
        'reminderMinutes': 'reminder_minutes'
    };

    Object.keys(data).forEach(key => {
        const targetKey = keyMap[key] || key;
        const val = data[key];
        if (typeof val === 'string' && val.trim() === '') {
            cleaned[targetKey] = null;
        } else {
            cleaned[targetKey] = val === undefined ? null : val;
        }
    });
    return cleaned;
};

export const fetchSupportData = async () => {
    const results = await Promise.all([
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
        tickets: results[0].data || [], 
        ticketCategories: results[1].data || [], 
        securityIncidentTypes: results[2].data || [], 
        teams: results[3].data || [], 
        teamMembers: results[4].data || [], 
        calendarEvents: results[5].data || [],
        ticketActivities: results[6].data || [],
        messages: results[7].data || [],
        configTicketStatuses: results[8].data || []
    };
};

export const fetchTicketsPaginated = async (params: { 
    page: number, 
    pageSize: number, 
    filters?: any, 
    sort?: { key: string, direction: 'ascending' | 'descending' },
    userContext?: { id: string, role: string, teamIds: string[] }
}) => {
    let query = sb().from('tickets').select('*', { count: 'exact' });
    
    // RBAC: Construção do filtro de visibilidade
    if (params.userContext && params.userContext.role !== 'SuperAdmin' && params.userContext.role !== 'Admin') {
        const { id, teamIds } = params.userContext;
        const orParts = [`collaborator_id.eq.${id}`, `technician_id.eq.${id}`];
        
        if (teamIds && teamIds.length > 0) {
            orParts.push(`team_id.in.(${teamIds.join(',')})`);
        }
        query = query.or(orParts.join(','));
    }

    if (params.filters) {
        if (params.filters.status) {
            query = query.eq('status', params.filters.status);
        } else {
            // Pedido 1: Ocultar Finalizados e Cancelados por defeito se nenhum status for filtrado
            query = query.in('status', ['Pedido', 'Em progresso']);
        }
        if (params.filters.category) query = query.eq('category', params.filters.category);
        if (params.filters.title) query = query.ilike('title', `%${params.filters.title}%`);
    } else {
        // Fallback: mostrar apenas ativos se params.filters for undefined
        query = query.in('status', ['Pedido', 'Em progresso']);
    }

    // Pedido 1: Ordenação descendente por data, mas priorizando status "Pedido" e "Em progresso"
    // No PostgreSQL, como 'Pedido' > 'Em progresso' alfabeticamente, usamos DESC para o status primeiro
    const sortObj = params.sort || { key: 'request_date', direction: 'descending' };
    
    query = query
        .order('status', { ascending: false }) // 'Pedido' vem antes de 'Em progresso'
        .order(sortObj.key, { ascending: sortObj.direction === 'ascending' });
    
    const from = (params.page - 1) * params.pageSize;
    const { data, count, error } = await query.range(from, from + params.pageSize - 1);
    
    if (error) throw error;
    return { data: data || [], total: count || 0 };
};

export const addTicket = async (ticket: any) => { const { data } = await sb().from('tickets').insert(cleanPayload(ticket)).select().single(); return data; };
export const updateTicket = async (id: string, updates: any) => { await sb().from('tickets').update(cleanPayload(updates)).eq('id', id); };
export const getTicketActivities = async (ticketId: string) => { const { data } = await sb().from('ticket_activities').select('*').eq('ticket_id', ticketId); return data || []; };
export const addTicketActivity = async (activity: any) => { await sb().from('ticket_activities').insert(cleanPayload(activity)); };
export const addTicketCategory = async (cat: any) => { await sb().from('ticket_categories').insert(cleanPayload(cat)); };
export const updateTicketCategory = async (id: string, updates: any) => { await sb().from('ticket_categories').update(cleanPayload(updates)).eq('id', id); };
export const addSecurityIncidentType = async (type: any) => { await sb().from('security_incident_types').insert(cleanPayload(type)); };
export const updateSecurityIncidentType = async (id: string, updates: any) => { await sb().from('security_incident_types').update(cleanPayload(updates)).eq('id', id); };
export const addTeam = async (team: any) => { const { data } = await sb().from('teams').insert(cleanPayload(team)).select().single(); return data; };
export const updateTeam = async (id: string, updates: any) => { await sb().from('teams').update(cleanPayload(updates)).eq('id', id); };
export const deleteTeam = async (id: string) => { await sb().from('teams').delete().eq('id', id); };
export const syncTeamMembers = async (teamId: string, memberIds: string[]) => { 
    await sb().from('team_members').delete().eq('team_id', teamId); 
    if (memberIds.length > 0) { 
        const items = memberIds.map(id => ({ team_id: teamId, collaborator_id: id })); 
        await sb().from('team_members').insert(items); 
    } 
};
export const addMessage = async (msg: any) => { await sb().from('messages').insert(cleanPayload(msg)); };
export const markMessagesAsRead = async (senderId: string) => { await sb().from('messages').update({ read: true }).eq('sender_id', senderId); };
export const addCalendarEvent = async (event: any) => { const { data } = await sb().from('calendar_events').insert(cleanPayload(event)).select().single(); return data; };
export const updateCalendarEvent = async (id: string, updates: any) => { await sb().from('calendar_events').update(cleanPayload(updates)).eq('id', id); };
export const deleteCalendarEvent = async (id: string) => { await sb().from('calendar_events').delete().eq('id', id); };
