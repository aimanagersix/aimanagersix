
import { fetchOrganizationData, fetchCollaboratorsPaginated } from './orgService';
import { fetchInventoryData, fetchEquipmentPaginated } from './inventoryService';
import { fetchSupportData, fetchTicketsPaginated } from './supportService';
import { fetchComplianceData } from './complianceService';

/**
 * Barrel Export Service - V6.0 (Reactive Cache Optimization)
 */

export * from './authService';
export * from './inventoryService';
export * from './supportService';
export * from './complianceService';
export * from './orgService';
export * from './configService';

const CACHE_KEY = 'aimanager_global_cache';
const CACHE_TIME_KEY = 'aimanager_cache_timestamp';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos padrão

// Invalida o cache local para forçar refresh na próxima chamada
export const invalidateLocalCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
};

// Helper para carregamento massivo inicial e refresh global com CACHE
export const fetchAllData = async (forceRefresh = false) => {
    const now = Date.now();
    const lastCache = localStorage.getItem(CACHE_TIME_KEY);
    const cachedData = localStorage.getItem(CACHE_KEY);

    // Se não for forçado e o cache for válido, retorna cache
    if (!forceRefresh && cachedData && lastCache && (now - parseInt(lastCache) < CACHE_DURATION)) {
        try {
            return JSON.parse(cachedData);
        } catch (e) {
            console.error("Erro ao ler cache, forçando refresh", e);
        }
    }

    // Caso contrário, faz os pedidos ao servidor
    const results = await Promise.allSettled([
        fetchOrganizationData(), 
        fetchInventoryData(), 
        fetchSupportData(), 
        fetchComplianceData()
    ]);
    
    let merged: any = {};
    results.forEach(res => {
        if (res.status === 'fulfilled') {
            merged = { ...merged, ...res.value };
        }
    });

    // Guardar no storage
    localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
    localStorage.setItem(CACHE_TIME_KEY, now.toString());

    return merged;
};
