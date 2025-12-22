import * as orgSvc from './orgService';
import * as invSvc from './inventoryService';
import * as suppSvc from './supportService';
import * as complSvc from './complianceService';
import { MOCK_DATA_BUNDLE } from './mockData';

/**
 * BARREL EXPORT SERVICE - V20.0 (Hybrid Engine Fix)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO DE MODULOS:
 * - PEDIDO 1, 2, 3, 4: BLOQUEIO TOTAL (NÃO ALTERAR)
 * -----------------------------------------------------------------------------
 * PEDIDO 5: Correção de consistência em modo Mock. 
 * As funções de escrita de colaboradores agora são intercetadas.
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
const CACHE_DURATION = 10 * 60 * 1000; 

// --- DYNAMIC ENGINE CONFIG ---
const FORCE_MOCK = !(process.env.SUPABASE_URL && process.env.SUPABASE_URL !== ''); 
const MOCK_DB_VERSION = '3.0.0'; 

export const isUsingMock = () => FORCE_MOCK;

export const getLocalDB = () => {
    const currentVersion = localStorage.getItem('aimanager_db_version');
    const data = localStorage.getItem('aimanager_mock_db');
    
    if (!data || currentVersion !== MOCK_DB_VERSION) {
        localStorage.setItem('aimanager_mock_db', JSON.stringify(MOCK_DATA_BUNDLE));
        localStorage.setItem('aimanager_db_version', MOCK_DB_VERSION);
        localStorage.removeItem('snoozed_notifications');
        return MOCK_DATA_BUNDLE;
    }
    
    return JSON.parse(data);
};

const saveLocalDB = (data: any) => {
    localStorage.setItem('aimanager_mock_db', JSON.stringify(data));
    localStorage.removeItem(CACHE_KEY);
};

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

// --- SPECIALIZED FETCHERS (HYBRID) ---

export const fetchOrganizationData = async () => {
    if (FORCE_MOCK) return getLocalDB();
    return orgSvc.fetchOrganizationData();
};

export const fetchInventoryData = async () => {
    if (FORCE_MOCK) return getLocalDB();
    return invSvc.fetchInventoryData();
};

export const fetchSupportData = async () => {
    if (FORCE_MOCK) return getLocalDB();
    return suppSvc.fetchSupportData();
};

export const fetchComplianceData = async () => {
    if (FORCE_MOCK) return getLocalDB();
    return complSvc.fetchComplianceData();
};

export const fetchAllData = async (forceRefresh = false) => {
    if (FORCE_MOCK) return getLocalDB();

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

// --- MOCKED PAGINATION INTERCEPTORS ---

export const fetchCollaboratorsPaginated = async (params: any) => {
    if (FORCE_MOCK) {
        const db = getLocalDB();
        const collabs = db.collaborators || [];
        return { data: collabs, total: collabs.length };
    }
    return orgSvc.fetchCollaboratorsPaginated(params);
};

// --- WRITE INTERCEPTORS (PEDIDO 5 FIX) ---

export const addCollaborator = async (col: any, password?: string) => {
    if (FORCE_MOCK) return mockAddRecord('collaborators', col);
    return orgSvc.addCollaborator(col, password);
};

export const updateCollaborator = async (id: string, updates: any) => {
    if (FORCE_MOCK) return mockUpdateRecord('collaborators', id, updates);
    return orgSvc.updateCollaborator(id, updates);
};

export const deleteCollaborator = async (id: string) => {
    if (FORCE_MOCK) return mockDeleteRecord('collaborators', id);
    return orgSvc.deleteCollaborator(id);
};

export const mockAddRecord = async (collection: string, record: any) => {
    if (!FORCE_MOCK) return null;
    const db = getLocalDB();
    const newRecord = { ...record, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    if (!db[collection]) db[collection] = [];
    db[collection].push(newRecord);
    saveLocalDB(db);
    return newRecord;
};

export const mockUpdateRecord = async (collection: string, id: string, updates: any) => {
    if (!FORCE_MOCK) return null;
    const db = getLocalDB();
    if (!db[collection]) return null;
    db[collection] = db[collection].map((item: any) => 
        item.id === id ? { ...item, ...updates, modified_date: new Date().toISOString() } : item
    );
    saveLocalDB(db);
    return { ...updates, id };
};

export const mockDeleteRecord = async (collection: string, id: string) => {
    if (!FORCE_MOCK) return null;
    const db = getLocalDB();
    if (!db[collection]) return null;
    db[collection] = db[collection].filter((item: any) => item.id !== id);
    saveLocalDB(db);
    return { success: true };
};