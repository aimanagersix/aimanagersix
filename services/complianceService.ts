
import { getSupabase } from './supabaseClient';

const sb = () => getSupabase();

const cleanPayload = (data: any) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === '') cleaned[key] = null;
    });
    return cleaned;
};

export const fetchComplianceData = async () => {
    const results = await Promise.all([
        sb().from('business_services').select('*'),
        sb().from('service_dependencies').select('*'),
        sb().from('vulnerabilities').select('*'),
        sb().from('backup_executions').select('*'),
        sb().from('resilience_tests').select('*'),
        sb().from('security_trainings').select('*'),
        sb().from('policies').select('*'),
        sb().from('policy_acceptances').select('*'),
        sb().from('continuity_plans').select('*'),
        sb().from('config_training_types').select('*'),
        sb().from('config_criticality_levels').select('*'),
        sb().from('config_cia_ratings').select('*'),
        sb().from('config_service_statuses').select('*'),
        sb().from('config_backup_types').select('*'),
        sb().from('config_resilience_test_types').select('*')
    ]);
    return {
        businessServices: results[0].data || [], serviceDependencies: results[1].data || [], 
        vulnerabilities: results[2].data || [], backupExecutions: results[3].data || [], 
        resilienceTests: results[4].data || [], securityTrainings: results[5].data || [], 
        policies: results[6].data || [], policyAcceptances: results[7].data || [], 
        continuityPlans: results[8].data || [], configTrainingTypes: results[9].data || [],
        configCriticalityLevels: results[10].data || [],
        configCiaRatings: results[11].data || [],
        configServiceStatuses: results[12].data || [],
        configBackupTypes: results[13].data || [],
        configResilienceTestTypes: results[14].data || []
    };
};

export const addBusinessService = async (svc: any) => { const { data, error } = await sb().from('business_services').insert(cleanPayload(svc)).select().single(); if (error) throw error; return data; };
export const updateBusinessService = async (id: string, updates: any) => { const { data, error } = await sb().from('business_services').update(cleanPayload(updates)).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteBusinessService = async (id: string) => { const { error } = await sb().from('business_services').delete().eq('id', id); if (error) throw error; };
export const addServiceDependency = async (dep: any) => { const { error } = await sb().from('service_dependencies').insert(cleanPayload(dep)); if (error) throw error; };
export const deleteServiceDependency = async (id: string) => { const { error } = await sb().from('service_dependencies').delete().eq('id', id); if (error) throw error; };
export const addVulnerability = async (vuln: any) => { const { data, error } = await sb().from('vulnerabilities').insert(cleanPayload(vuln)).select().single(); if (error) throw error; return data; };
export const updateVulnerability = async (id: string, updates: any) => { const { data, error } = await sb().from('vulnerabilities').update(cleanPayload(updates)).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteVulnerability = async (id: string) => { const { error } = await sb().from('vulnerabilities').delete().eq('id', id); if (error) throw error; };
export const addBackupExecution = async (b: any) => { const { data, error } = await sb().from('backup_executions').insert(cleanPayload(b)).select().single(); if (error) throw error; return data; };
export const updateBackupExecution = async (id: string, updates: any) => { const { data, error } = await sb().from('backup_executions').update(cleanPayload(updates)).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteBackupExecution = async (id: string) => { const { error } = await sb().from('backup_executions').delete().eq('id', id); if (error) throw error; };
export const addResilienceTest = async (t: any) => { const { data, error } = await sb().from('resilience_tests').insert(cleanPayload(t)).select().single(); if (error) throw error; return data; };
export const updateResilienceTest = async (id: string, updates: any) => { const { data, error } = await sb().from('resilience_tests').update(cleanPayload(updates)).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteResilienceTest = async (id: string) => { const { error } = await sb().from('resilience_tests').delete().eq('id', id); if (error) throw error; };
export const addSecurityTraining = async (t: any) => { const { data, error } = await sb().from('security_trainings').insert(cleanPayload(t)).select().single(); if (error) throw error; return data; };
export const addPolicy = async (p: any) => { await sb().from('policies').insert(cleanPayload(p)); };
export const updatePolicy = async (id: string, updates: any) => { await sb().from('policies').update(cleanPayload(updates)).eq('id', id); };
export const deletePolicy = async (id: string) => { await sb().from('policies').delete().eq('id', id); };
