import { getSupabase } from './supabaseClient';
import { Equipment } from '../types';

const sb = () => getSupabase();

const cleanPayload = (data: any) => {
    const cleaned: any = {};
    const keyMap: Record<string, string> = {
        'serialNumber': 'serial_number',
        'inventoryNumber': 'inventory_number',
        'brandId': 'brand_id',
        'typeId': 'type_id',
        'purchaseDate': 'purchase_date',
        'warrantyEndDate': 'warranty_end_date',
        'invoiceNumber': 'invoice_number',
        'requisitionNumber': 'requisition_number',
        'acquisitionCost': 'acquisition_cost',
        'creationDate': 'creation_date',
        'modifiedDate': 'modified_date',
        'nomeNaRede': 'nome_na_rede',
        'macAddressWIFI': 'mac_address_wifi',
        'macAddressCabo': 'mac_address_cabo',
        'lastSecurityUpdate': 'last_security_update',
        'embeddedLicenseKey': 'embedded_license_key',
        'isLoan': 'is_loan',
        'parentEquipmentId': 'parent_equipment_id',
        'procurementRequestId': 'procurement_request_id',
        'accountingCategoryId': 'accounting_category_id',
        'conservationStateId': 'conservation_state_id',
        'decommissionReasonId': 'decommission_reason_id',
        'residualValue': 'residual_value',
        'lastInventoryScan': 'last_inventory_scan',
        'softwareLicenseId': 'software_license_id',
        'equipmentId': 'equipment_id',
        'assignedDate': 'assigned_date',
        'returnDate': 'return_date',
        'productName': 'product_name',
        'licenseKey': 'license_key',
        'totalSeats': 'total_seats',
        'expiryDate': 'expiry_date',
        'purchaseEmail': 'purchase_email',
        'unitCost': 'unit_cost',
        'isOem': 'is_oem',
        'categoryId': 'category_id',
        'supplier_id': 'supplier_id',
        'supplierId': 'supplier_id',
        'externalProviderId': 'external_provider_id',
        'defaultTeamId': 'default_team_id',
        'default_team_id': 'default_team_id',
        'wwanAddress': 'wwan_address',
        'bluetoothAddress': 'bluetooth_address',
        'usbThunderboltAddress': 'usb_thunderbolt_address',
        'ipAddress': 'ip_address',
        'ramSize': 'ram_size',
        'diskInfo': 'disk_info',
        'cpuInfo': 'cpu_info',
        'monitorInfo': 'monitor_info',
        'manufactureDate': 'manufacture_date',
        'criticality': 'criticality',
        'confidentiality': 'confidentiality',
        'integrity': 'integrity',
        'availability': 'availability',
        'contactName': 'contact_name',
        'contactEmail': 'contact_email',
        'contactPhone': 'contact_phone',
        'isoCertificateExpiry': 'iso_certificate_expiry',
        'securityContactEmail': 'security_contact_email',
        'riskLevel': 'risk_level',
        'addressLine': 'address_line',
        'postalCode': 'postal_code',
        'osVersion': 'os_version',
        'os_version': 'os_version',
        'firmwareVersion': 'firmware_version',
        'firmware_version': 'firmware_version',
        'encryptionStatus': 'encryption_status',
        'encryption_status': 'encryption_status',
        'expectedLifespanYears': 'expected_lifespan_years',
        'expected_lifespan_years': 'expected_lifespan_years',
        'installationLocation': 'installation_location',
        'installation_location': 'installation_location',
        'isActive': 'is_active',
        'is_active': 'is_active',
        'procurement_request_id': 'procurement_request_id'
    };

    // FIX: Adicionada a blacklist para chaves de relação Master-Detail para evitar erro de "coluna não encontrada" no insert
    const blackList = ['contacts', 'preferences', 'simulatedTicket', 'isSimulating', 'address', 'items', 'procurement_items']; 
    const numericFields = ['acquisition_cost', 'residual_value', 'unit_cost', 'total_seats', 'estimated_cost', 'quantity', 'expected_lifespan_years'];

    Object.keys(data).forEach(key => {
        if (blackList.includes(key)) return;

        const targetKey = keyMap[key] || key;
        const val = data[key];
        
        if (typeof val === 'string' && val.trim() === '') {
            cleaned[targetKey] = null;
        } else if (numericFields.includes(targetKey)) {
            const parsed = parseFloat(val);
            cleaned[targetKey] = isNaN(parsed) ? null : parsed;
        } else {
            cleaned[targetKey] = val === undefined ? null : val;
        }
    });
    return cleaned;
};

export const fetchInventoryData = async () => {
    const results = await Promise.all([
        sb().from('equipment').select('*').is('deleted_at', null),
        sb().from('brands').select('*'),
        sb().from('equipment_types').select('*'),
        sb().from('assignments').select('*'),
        sb().from('software_licenses').select('*'),
        sb().from('license_assignments').select('*'),
        sb().from('procurement_requests').select('*, procurement_items(*)'),
        sb().from('config_software_categories').select('*'),
        sb().from('config_software_products').select('*'),
        sb().from('suppliers').select('*').order('name'),
        sb().from('config_equipment_statuses').select('*'),
        sb().from('config_ticket_statuses').select('*'),
        sb().from('config_license_statuses').select('*'),
        sb().from('config_cpus').select('*'),
        sb().from('config_ram_sizes').select('*'),
        sb().from('config_storage_types').select('*'),
        sb().from('config_accounting_categories').select('*'),
        sb().from('config_conservation_states').select('*'),
        sb().from('config_decommission_reasons').select('*'),
        sb().from('config_job_titles').select('*'),
        sb().from('config_collaborator_deactivation_reasons').select('*'),
        sb().from('config_holiday_types').select('*'),
        sb().from('resource_contacts').select('*').eq('resource_type', 'supplier')
    ]);
    
    const rawSuppliers = results[9].data || [];
    const supplierContacts = results[22].data || [];
    
    const hydratedSuppliers = rawSuppliers.map((s: any) => ({
        ...s,
        contacts: supplierContacts.filter((c: any) => c.resource_id === s.id)
    }));
    
    return {
        equipment: results[0].data || [], 
        brands: results[1].data || [], 
        equipmentTypes: results[2].data || [], 
        assignments: results[3].data || [], 
        softwareLicenses: results[4].data || [], 
        licenseAssignments: results[5].data || [], 
        // Normalização de retorno do Master-Detail
        procurementRequests: (results[6].data || []).map((p: any) => ({
            ...p,
            items: p.procurement_items || []
        })),
        softwareCategories: results[7].data || [], 
        softwareProducts: results[8].data || [],
        suppliers: hydratedSuppliers, 
        configEquipmentStatuses: results[10].data || [],
        configTicketStatuses: results[11].data || [],
        configLicenseStatuses: results[12].data || [],
        configCpus: results[13].data || [], 
        configRamSizes: results[14].data || [], 
        configStorageTypes: results[15].data || [],
        configAccountingCategories: results[16].data || [], 
        configConservationStates: results[17].data || [],
        configDecommissionReasons: results[18].data || [],
        configJobTitles: results[19].data || [],
        configCollaboratorDeactivationReasons: results[20].data || [],
        configHolidayTypes: results[21].data || []
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
    let query = sb().from('equipment').select('*', { count: 'exact' }).is('deleted_at', null);
    if (!params.isAdmin && params.userId) {
        const { data: userEq } = await sb().from('assignments').select('equipment_id').eq('collaborator_id', params.userId).is('return_date', null);
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

export const updateAssignment = async (id: string, updates: any) => {
    const { data, error } = await sb().from('assignments').update(cleanPayload(updates)).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const updateLicenseAssignment = async (id: string, updates: any) => {
    const { data, error } = await sb().from('license_assignments').update(cleanPayload(updates)).eq('id', id).select().single();
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

export const addMultipleEquipment = async (items: any[]) => { 
    if (!items || items.length === 0) return;
    const { error } = await sb().from('equipment').insert(items.map(cleanPayload)); 
    if (error) throw error;
};

export const deleteEquipment = async (id: string, reason: string = 'Abate Administrativo') => { 
    const { data: { user } } = await sb().auth.getUser();

    const { error: softDelError } = await sb().from('equipment').update({ 
        deleted_at: new Date().toISOString(),
        status: 'Retirado (Arquivo)'
    }).eq('id', id); 
    
    if (softDelError) throw softDelError;

    await sb().from('decommission_audit').insert({
        resource_type: 'equipment',
        resource_id: id,
        reason: reason,
        deleted_by: user?.email || 'Sistema'
    });
};

export const addBrand = async (brand: any) => { 
    const { data, error } = await sb().from('brands').insert(cleanPayload(brand)).select().single(); 
    if (error) throw error;
    return data; 
};
export const updateBrand = async (id: string, updates: any) => { 
    const { error } = await sb().from('brands').update(cleanPayload(updates)).eq('id', id); 
    if (error) throw error;
};
export const deleteBrand = async (id: string) => { 
    const { error } = await sb().from('brands').delete().eq('id', id); 
    if (error) throw error;
};
export const addEquipmentType = async (type: any) => { 
    const { data, error } = await sb().from('equipment_types').insert(cleanPayload(type)).select().single(); 
    if (error) throw error;
    return data; 
};
export const updateEquipmentType = async (id: string, updates: any) => { 
    const { error } = await sb().from('equipment_types').update(cleanPayload(updates)).eq('id', id); 
    if (error) throw error;
};
export const deleteEquipmentType = async (id: string) => { 
    const { error } = await sb().from('equipment_types').delete().eq('id', id); 
    if (error) throw error;
};
export const addLicense = async (lic: any) => { 
    const { data, error } = await sb().from('software_licenses').insert(cleanPayload(lic)).select().single(); 
    if (error) throw error;
    return data; 
};
export const addMultipleLicenses = async (items: any[]) => { 
    if (!items || items.length === 0) return;
    const { error } = await sb().from('software_licenses').insert(items.map(cleanPayload)); 
    if (error) throw error;
};
export const updateLicense = async (id: string, updates: any) => { 
    const { error } = await sb().from('software_licenses').update(cleanPayload(updates)).eq('id', id); 
    if (error) throw error;
};
export const deleteLicense = async (id: string) => { 
    const { error } = await sb().from('software_licenses').delete().eq('id', id); 
    if (error) throw error;
};

/**
 * SERVIÇO DE AQUISIÇÕES MASTER-DETAIL v2.0
 */
export const addProcurement = async (p: any) => { 
    const items = p.items || [];
    const payload = cleanPayload(p);
    
    const { data: proc, error: procErr } = await sb().from('procurement_requests').insert(payload).select().single(); 
    if (procErr) throw procErr;

    if (items.length > 0) {
        const itemPayloads = items.map((i: any) => ({ ...cleanPayload(i), procurement_id: proc.id }));
        const { error: itemsErr } = await sb().from('procurement_items').insert(itemPayloads);
        if (itemsErr) throw itemsErr;
    }
    return proc; 
};

export const updateProcurement = async (id: string, updates: any) => { 
    const items = updates.items || [];
    const payload = cleanPayload(updates);
    
    const { error: procErr } = await sb().from('procurement_requests').update(payload).eq('id', id); 
    if (procErr) throw procErr;

    // Sincronização Master-Detail simplificada: Apagar e Reinserir
    const { error: delErr } = await sb().from('procurement_items').delete().eq('procurement_id', id);
    if (delErr) throw delErr;

    if (items.length > 0) {
        const itemPayloads = items.map((i: any) => ({ ...cleanPayload(i), procurement_id: id }));
        const { error: itemsErr } = await sb().from('procurement_items').insert(itemPayloads);
        if (itemsErr) throw itemsErr;
    }
};

export const deleteProcurement = async (id: string) => { 
    const { error } = await sb().from('procurement_requests').delete().eq('id', id); 
    if (error) throw error;
};
export const addSoftwareProduct = async (p: any) => { 
    const { error } = await sb().from('config_software_products').insert(cleanPayload(p)); 
    if (error) throw error;
};
export const updateSoftwareProduct = async (id: string, updates: any) => { 
    const { error } = await sb().from('config_software_products').update(cleanPayload(updates)).eq('id', id); 
    if (error) throw error;
};
export const deleteSoftwareProduct = async (id: string) => { 
    const { error } = await sb().from('config_software_products').delete().eq('id', id); 
    if (error) throw error;
};
export const addSupplier = async (sup: any) => { 
    const { data, error } = await sb().from('suppliers').insert(cleanPayload(sup)).select().single(); 
    if (error) throw error;
    return data; 
};
export const updateSupplier = async (id: string, updates: any) => { 
    const { error } = await sb().from('suppliers').update(cleanPayload(updates)).eq('id', id); 
    if (error) throw error;
};
export const deleteSupplier = async (id: string) => { 
    const { error } = await sb().from('suppliers').delete().eq('id', id); 
    if (error) throw error;
};
export const addJobTitle = async (item: any) => { 
    const { data, error } = await sb().from('config_job_titles').insert(cleanPayload(item)).select().single(); 
    if (error) throw error;
    return data; 
};