import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

const cleanPayload = (data: any) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === '') cleaned[key] = null;
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
    
    if (params.userContext && params.userContext.role !== 'SuperAdmin' && params.userContext.role !== 'Admin') {
        const { id, teamIds } = params.userContext;
        if (teamIds && teamIds.length > 0) {
            query = query.or(`collaborator_id.eq.${id},team_id.in.(${teamIds.join(',')})`);
        } else {
            query = query.eq('collaborator_id', id);
        }
    }

    if (params.filters) {
        if (params.filters.status) query = query.eq('status', params.filters.status);
        if (params.filters.category) query = query.eq('category', params.filters.category);
        if (params.filters.team_id) query = query.eq('team_id', params.filters.team_id);
        if (params.filters.title) query = query.ilike('title', `%${params.filters.title}%`);
    }

    const sortObj = params.sort || { key: 'request_date', direction: 'descending' };
    query = query.order(sortObj.key, { ascending: sortObj.direction === 'ascending' });
    
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