
import * as orgSvc from './orgService';
import * as invSvc from './inventoryService';
import * as suppSvc from './supportService';
import * as complSvc from './complianceService';
import { MOCK_DATA_BUNDLE } from './mockData';

/**
 * Barrel Export Service - V11.0 (Full Mock Interception)
 * Pedido 4: Resolve o problema do carregamento infinito intercetando as chamadas dos hooks atómicos.
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

// --- MOCK ENGINE CONFIG ---
const FORCE_MOCK = true; 
const MOCK_DB_VERSION = '3.0.0'; 

export const isUsingMock = () => FORCE_MOCK;

/**
 * Obtém a base de dados local de forma síncrona ou inicializa.
 */
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

// --- MOCKED SPECIALIZED FETCHERS (Para intercetar Hooks Atómicos) ---

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

// --- READ INTERCEPTOR (ALL) ---
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

// --- WRITE INTERCEPTORS ---

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
