
import { fetchOrganizationData, fetchCollaboratorsPaginated } from './orgService';
import { fetchInventoryData, fetchEquipmentPaginated } from './inventoryService';
import { fetchSupportData, fetchTicketsPaginated } from './supportService';
import { fetchComplianceData } from './complianceService';

/**
 * Barrel Export Service - V5.0 (Egress Optimization)
 * Implementa cache local para tabelas de configuração que mudam pouco.
 */

export * from './authService';
export * from './inventoryService';
export * from './supportService';
export * from './complianceService';
export * from './orgService';
export * from './configService';

const CACHE_KEY = 'aimanager_global_cache';
const CACHE_TIME_KEY = 'aimanager_cache_timestamp';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos em milissegundos

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

    // Guardar no storage para reduzir Egress nos próximos refreshes
    localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
    localStorage.setItem(CACHE_TIME_KEY, now.toString());

    return merged;
};
