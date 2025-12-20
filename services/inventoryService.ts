import { getSupabase } from './supabaseClient';
import { Equipment } from '../types';

const sb = () => getSupabase();

const cleanPayload = (data: any) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === '') cleaned[key] = null;
    });
    return cleaned;
};

export const fetchInventoryData = async () => {
    const results = await Promise.all([
        sb().from('equipment').select('*'),
        sb().from('brands').select('*'),
        sb().from('equipment_types').select('*'),
        sb().from('assignments').select('*'),
        sb().from('software_licenses').select('*'),
        sb().from('license_assignments').select('*'),
        sb().from('procurement_requests').select('*'),
        sb().from('config_software_categories').select('*'),
        sb().from('config_software_products').select('*'),
        sb().from('suppliers').select('*'),
        sb().from('config_equipment_statuses').select('*'),
        sb().from('config_license_statuses').select('*'),
        sb().from('config_cpus').select('*'),
        sb().from('config_ram_sizes').select('*'),
        sb().from('config_storage_types').select('*'),
        sb().from('config_accounting_categories').select('*'),
        sb().from('config_conservation_states').select('*'),
        sb().from('config_decommission_reasons').select('*'),
        sb().from('config_job_titles').select('*'),
        sb().from('config_collaborator_deactivation_reasons').select('*')
    ]);
    return {
        equipment: results[0].data || [], 
        brands: results[1].data || [], 
        equipmentTypes: results[2].data || [], 
        assignments: results[3].data || [], 
        softwareLicenses: results[4].data || [], 
        licenseAssignments: results[5].data || [], 
        procurementRequests: results[6].data || [],
        softwareCategories: results[7].data || [], 
        softwareProducts: results[8].data || [],
        suppliers: results[9].data || [], 
        configEquipmentStatuses: results[10].data || [],
        configLicenseStatuses: results[11].data || [],
        configCpus: results[12].data || [], 
        configRamSizes: results[13].data || [], 
        configStorageTypes: results[14].data || [],
        configAccountingCategories: results[15].data || [], 
        configConservationStates: results[16].data || [],
        configDecommissionReasons: results[17].data || [],
        configJobTitles: results[18].data || [],
        configCollaboratorDeactivationReasons: results[19].data || []
    };
};

export const fetchEquipmentPaginated = async (params: { 
    page: number, 
    pageSize: number, 
    filters?: any, 
    sort?: { key: string, direction: 'ascending' | 'descending' }, 
    userId?: string, 
    isAdmin?: boolean 
}) => {
    let query = sb().from('equipment').select('*', { count: 'exact' });
    
    if (!params.isAdmin && params.userId) {
        const { data: userEq } = await sb().from('assignments')
            .select('equipment_id')
            .eq('collaborator_id', params.userId)
            .is('return_date', null);
            
        const eqIds = userEq?.map(a => a.equipment_id) || [];
        if (eqIds.length > 0) query = query.in('id', eqIds);
        else return { data: [], total: 0 };
    }

    if (params.filters) {
        if (params.filters.serial_number) query = query.ilike('serial_number', `%${params.filters.serial_number}%`);
        if (params.filters.description) query = query.ilike('description', `%${params.filters.description}%`);
        if (params.filters.brand_id) query = query.eq('brand_id', params.filters.brand_id);
        if (params.filters.type_id) query = query.eq('type_id', params.filters.type_id);
        if (params.filters.status) query = query.eq('status', params.filters.status);
    }

    const sortObj = params.sort || { key: 'creation_date', direction: 'descending' };
    query = query.order(sortObj.key, { ascending: sortObj.direction === 'ascending' });
    
    const from = (params.page - 1) * params.pageSize;
    const { data, count, error } = await query.range(from, from + params.pageSize - 1);
    
    if (error) throw error;
    return { data: data || [], total: count || 0 };
};

export const addEquipment = async (eq: any) => {
    const { data, error } = await sb().from('equipment').insert(cleanPayload(eq)).select().single();
    if (error) throw error;
    return data;
};

export const updateEquipment = async (id: string, updates: any) => {
    const { data, error } = await sb().from('equipment').update(cleanPayload(updates)).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const addAssignment = async (assignment: any) => {
    const { data, error } = await sb().from('assignments').insert(cleanPayload(assignment)).select().single();
    if (error) throw error;
    return data;
};

export const syncLicenseAssignments = async (equipmentId: string, licenseIds: string[]) => {
    const nowStr = new Date().toISOString().split('T')[0];
    await sb().from('license_assignments').update({ return_date: nowStr }).eq('equipment_id', equipmentId).is('return_date', null);
    
    if (licenseIds.length > 0) {
        const items = licenseIds.map(id => ({ equipment_id: equipmentId, software_license_id: id, assigned_date: nowStr }));
        await sb().from('license_assignments').insert(items);
    }
};

export const addMultipleEquipment = async (items: any[]) => { await sb().from('equipment').insert(items.map(cleanPayload)); };
export const deleteEquipment = async (id: string) => { await sb().from('equipment').delete().eq('id', id); };
export const addBrand = async (brand: any) => { const { data } = await sb().from('brands').insert(cleanPayload(brand)).select().single(); return data; };
export const updateBrand = async (id: string, updates: any) => { await sb().from('brands').update(cleanPayload(updates)).eq('id', id); };
export const deleteBrand = async (id: string) => { await sb().from('brands').delete().eq('id', id); };
export const addEquipmentType = async (type: any) => { const { data } = await sb().from('equipment_types').insert(cleanPayload(type)).select().single(); return data; };
export const updateEquipmentType = async (id: string, updates: any) => { await sb().from('equipment_types').update(cleanPayload(updates)).eq('id', id); };
export const deleteEquipmentType = async (id: string) => { await sb().from('equipment_types').delete().eq('id', id); };
export const addLicense = async (lic: any) => { const { data } = await sb().from('software_licenses').insert(cleanPayload(lic)).select().single(); return data; };
export const addMultipleLicenses = async (items: any[]) => { await sb().from('software_licenses').insert(items.map(cleanPayload)); };
export const updateLicense = async (id: string, updates: any) => { await sb().from('software_licenses').update(cleanPayload(updates)).eq('id', id); };
export const deleteLicense = async (id: string) => { await sb().from('software_licenses').delete().eq('id', id); };
export const addProcurement = async (p: any) => { const { data } = await sb().from('procurement_requests').insert(cleanPayload(p)).select().single(); return data; };
export const updateProcurement = async (id: string, updates: any) => { await sb().from('procurement_requests').update(cleanPayload(updates)).eq('id', id); };
export const deleteProcurement = async (id: string) => { await sb().from('procurement_requests').delete().eq('id', id); };
export const addSoftwareProduct = async (p: any) => { await sb().from('config_software_products').insert(cleanPayload(p)); };
export const updateSoftwareProduct = async (id: string, updates: any) => { await sb().from('config_software_products').update(cleanPayload(updates)).eq('id', id); };
export const deleteSoftwareProduct = async (id: string) => { await sb().from('config_software_products').delete().eq('id', id); };
export const addSupplier = async (sup: any) => { const { data } = await sb().from('suppliers').insert(cleanPayload(sup)).select().single(); return data; };
export const updateSupplier = async (id: string, updates: any) => { await sb().from('suppliers').update(cleanPayload(updates)).eq('id', id); };
export const deleteSupplier = async (id: string) => { await sb().from('suppliers').delete().eq('id', id); };
export const addJobTitle = async (item: any) => { const { data } = await sb().from('config_job_titles').insert(cleanPayload(item)).select().single(); return data; };