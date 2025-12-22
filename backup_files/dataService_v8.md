
import { fetchOrganizationData } from './orgService';
import { fetchInventoryData } from './inventoryService';
import { fetchSupportData } from './supportService';
import { fetchComplianceData } from './complianceService';
import { MOCK_DATA_BUNDLE } from './mockData';

/**
 * Barrel Export Service - V8.0 (Full Mock Interceptor)
 * Pedidos 1, 2 e 3: FECHADOS.
 * Pedido 4: MOCK ENGINE - Ativado.
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

export const isUsingMock = () => FORCE_MOCK;

const getLocalDB = () => {
    const data = localStorage.getItem('aimanager_mock_db');
    if (data) return JSON.parse(data);
    localStorage.setItem('aimanager_mock_db', JSON.stringify(MOCK_DATA_BUNDLE));
    return MOCK_DATA_BUNDLE;
};

const saveLocalDB = (data: any) => {
    localStorage.setItem('aimanager_mock_db', JSON.stringify(data));
    localStorage.removeItem(CACHE_KEY);
};

export const invalidateLocalCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
};

export const fetchAllData = async (forceRefresh = false) => {
    if (FORCE_MOCK) return getLocalDB();
    // ... resto da lógica de fetch ...
    return {};
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
    return updates;
};

export const mockDeleteRecord = async (collection: string, id: string) => {
    if (!FORCE_MOCK) return null;
    const db = getLocalDB();
    if (!db[collection]) return null;
    db[collection] = db[collection].filter((item: any) => item.id !== id);
    saveLocalDB(db);
    return { success: true };
};
