
import { fetchOrganizationData, fetchCollaboratorsPaginated } from './orgService';
import { fetchInventoryData, fetchEquipmentPaginated } from './inventoryService';
import { fetchSupportData, fetchTicketsPaginated } from './supportService';
import { fetchComplianceData } from './complianceService';

/**
 * Barrel Export Service - V4.0
 * Centraliza todas as chamadas de dados para manter compatibilidade
 * com os componentes existentes (Freeze UI / Zero Refactoring).
 */

export * from './authService';
export * from './inventoryService';
export * from './supportService';
export * from './complianceService';
export * from './orgService';
export * from './configService';

// Helper para carregamento massivo inicial e refresh global
export const fetchAllData = async () => {
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
    return merged;
};
