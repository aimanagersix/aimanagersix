
import { fetchOrganizationData } from './orgService';
import { fetchInventoryData } from './inventoryService';
import { fetchSupportData } from './supportService';
import { fetchComplianceData } from './complianceService';
import { MOCK_DATA_BUNDLE } from './mockData';

/**
 * Barrel Export Service - V9.0 (Clean Slate Mock Support)
 * Pedidos 1, 2 e 3: FECHADOS (Tickets, Mensagens, Notificações).
 * Pedido 4: MOCK ENGINE - Base de dados local vazia com apenas SuperAdmin e Canal Geral.
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

/**
 * Obtém a base de dados local. 
 * Se não existir, inicializa com o MOCK_DATA_BUNDLE (Clean Slate).
 */
const getLocalDB = () => {
    const data = localStorage.getItem('aimanager_mock_db');
    if (data) return JSON.parse(data);
    
    // Inicialização da primeira vez
    localStorage.setItem('aimanager_mock_db', JSON.stringify(MOCK_DATA_BUNDLE));
    return MOCK_DATA_BUNDLE;
};

const saveLocalDB = (data: any) => {
    localStorage.setItem('aimanager_mock_db', JSON.stringify(data));
    localStorage.removeItem(CACHE_KEY); // Força refresh da cache de leitura
};

export const invalidateLocalCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
};

// --- READ INTERCEPTOR ---
export const fetchAllData = async (forceRefresh = false) => {
    if (FORCE_MOCK) return getLocalDB();

    const now = Date.now();
    const lastCache = localStorage.getItem(CACHE_TIME_KEY);
    const cachedData = localStorage.getItem(CACHE_KEY);

    if (!forceRefresh && cachedData && lastCache && (now - parseInt(lastCache) < CACHE_DURATION)) {
        try { return JSON.parse(cachedData); } catch (e) { console.error(e); }
    }

    const results = await Promise.allSettled([
        fetchOrganizationData(), 
        fetchInventoryData(), 
        fetchSupportData(), 
        fetchComplianceData()
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
