import * as orgSvc from './orgService';
import * as invSvc from './inventoryService';
import * as suppSvc from './supportService';
import * as complSvc from './complianceService';

/**
 * BARREL EXPORT SERVICE - V22.0 (Supabase Only Engine)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO DE MODULOS (Freeze UI):
 * - PEDIDO 1, 2, 3, 4: BLOQUEIO TOTAL
 * -----------------------------------------------------------------------------
 * PEDIDO 9: REMOÇÃO TOTAL DE MOCKDATA E LOCALSTORAGE OVERRIDES.
 * A aplicação agora consome dados reais do projeto yyiwkrkuhlkqibhowdmq.
 * -----------------------------------------------------------------------------
 */

export * from './authService';
export * from './inventoryService';
export * from './supportService';
export * from './complianceService';
export * from './orgService';
export * from './configService';

const CACHE_KEY = 'aimanager_global_cache';
const CACHE_TIME_KEY = 'aimanager_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // Cache de leitura reduzido para 5 min

// --- PRODUCTION ENGINE ---
export const isUsingMock = () => false;

export const invalidateLocalCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
};

export const disconnectInfrastructure = () => {
    localStorage.removeItem('SUPABASE_URL');
    localStorage.removeItem('SUPABASE_ANON_KEY');
    localStorage.removeItem('aimanager_global_cache');
    localStorage.removeItem('aimanager_cache_timestamp');
    window.location.reload();
};

// --- DIRECT FETCHERS (SUPABASE ONLY) ---

export const fetchOrganizationData = async () => {
    return orgSvc.fetchOrganizationData();
};

export const fetchInventoryData = async () => {
    return invSvc.fetchInventoryData();
};

export const fetchSupportData = async () => {
    return suppSvc.fetchSupportData();
};

export const fetchComplianceData = async () => {
    return complSvc.fetchComplianceData();
};

/**
 * Agregador Global de Dados.
 * Consulta o Supabase e mantém uma cache temporária para performance.
 */
export const fetchAllData = async (forceRefresh = false) => {
    const now = Date.now();
    const lastCache = localStorage.getItem(CACHE_TIME_KEY);
    const cachedData = localStorage.getItem(CACHE_KEY);

    if (!forceRefresh && cachedData && lastCache && (now - parseInt(lastCache) < CACHE_DURATION)) {
        try { return JSON.parse(cachedData); } catch (e) { console.error(e); }
    }

    const results = await Promise.allSettled([
        orgSvc.fetchOrganizationData(), 
        invSvc.fetchInventoryData(), 
        suppSvc.fetchSupportData(), 
        complSvc.fetchComplianceData()
    ]);
    
    let merged: any = {};
    results.forEach(res => {
        if (res.status === 'fulfilled') merged = { ...merged, ...res.value };
    });

    localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
    localStorage.setItem(CACHE_TIME_KEY, now.toString());
    return merged;
};

// --- PAGINATION (PROD) ---

export const fetchCollaboratorsPaginated = async (params: any) => {
    return orgSvc.fetchCollaboratorsPaginated(params);
};

// --- WRITE OPERATIONS (PROD) ---

export const addCollaborator = async (col: any, password?: string) => {
    return orgSvc.addCollaborator(col, password);
};

export const updateCollaborator = async (id: string, updates: any) => {
    return orgSvc.updateCollaborator(id, updates);
};

export const deleteCollaborator = async (id: string) => {
    return orgSvc.deleteCollaborator(id);
};
