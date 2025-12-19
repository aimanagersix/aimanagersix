
import { getSupabase } from './supabaseClient';
import { DbPolicy, DbTrigger, DbFunction, DiagnosticResult } from '../types';

const sb = () => getSupabase();

const cleanPayload = (data: any) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === '') cleaned[key] = null;
    });
    return cleaned;
};

export const addConfigItem = async (table: string, item: any) => {
    const { data, error } = await sb().from(table).insert(cleanPayload(item)).select().single();
    if (error) throw error;
    return data;
};

export const updateConfigItem = async (table: string, id: string, updates: any) => {
    const { data, error } = await sb().from(table).update(cleanPayload(updates)).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deleteConfigItem = async (table: string, id: string) => {
    const { error } = await sb().from(table).delete().eq('id', id);
    if (error) throw error;
};

export const getGlobalSetting = async (key: string): Promise<string | null> => {
    try {
        const { data, error } = await sb().from('global_settings').select('setting_value').eq('setting_key', key).maybeSingle();
        if (error) return null;
        return data?.setting_value || null;
    } catch (e) { return null; }
};

export const updateGlobalSetting = async (key: string, value: string) => {
    const { error } = await sb().from('global_settings').upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });
    if (error) throw error;
};

export const getAutomationRules = async () => { const { data } = await sb().from('automation_rules').select('*'); return data || []; };
export const addAutomationRule = async (rule: any) => { await sb().from('automation_rules').insert(cleanPayload(rule)); };
export const updateAutomationRule = async (id: string, updates: any) => { await sb().from('automation_rules').update(cleanPayload(updates)).eq('id', id); };
export const deleteAutomationRule = async (id: string) => { await sb().from('automation_rules').delete().eq('id', id); };
export const fetchDbPolicies = async (): Promise<DbPolicy[]> => { const { data } = await sb().rpc('get_db_policies'); return data || []; };
export const fetchDbTriggers = async (): Promise<DbTrigger[]> => { const { data } = await sb().rpc('get_db_triggers'); return data || []; };
export const fetchDbFunctions = async (): Promise<DbFunction[]> => { const { data } = await sb().rpc('get_db_functions'); return data || []; };
export const runSystemDiagnostics = async (): Promise<DiagnosticResult[]> => { const results: DiagnosticResult[] = []; try { await sb().from('equipment').select('id').limit(1); results.push({ module: 'Database Connectivity', status: 'Success', message: 'Successfully reached Supabase.' }); } catch (e: any) { results.push({ module: 'Database Connectivity', status: 'Failure', message: e.message }); } return results; };
export const snoozeNotification = (id: string) => { const existing = localStorage.getItem('snoozed_notifications'); let snoozed = existing ? JSON.parse(existing) : []; const until = new Date(); until.setDate(until.getDate() + 7); snoozed.push({ id, until: until.toISOString() }); localStorage.setItem('snoozed_notifications', JSON.stringify(snoozed)); };

export const getCustomRoles = async () => { const { data } = await sb().from('config_custom_roles').select('*'); return data || []; };
export const addCustomRole = async (role: any) => { await sb().from('config_custom_roles').insert(cleanPayload(role)); };
export const updateCustomRole = async (id: string, updates: any) => { await sb().from('config_custom_roles').update(cleanPayload(updates)).eq('id', id); };
