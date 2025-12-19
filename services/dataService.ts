
import { fetchOrganizationData, fetchCollaboratorsPaginated } from './orgService';
import { fetchInventoryData, fetchEquipmentPaginated } from './inventoryService';
import { fetchSupportData, fetchTicketsPaginated } from './supportService';
import { fetchComplianceData } from './complianceService';

/**
 * Barrel Export Service
 * Este ficheiro centraliza todas as chamadas de dados para manter compatibilidade
 * com as importações existentes nos componentes (Freeze UI / Zero Refactoring).
 */

export * from './authService';
export * from './inventoryService';
export * from './supportService';
export * from './complianceService';
export * from './orgService';
export * from './configService';

// Helper para carregamento massivo (usado no App.tsx e hooks)
export const fetchAllData = async () => {
    const results = await Promise.allSettled([
        fetchOrganizationData(), 
        fetchInventoryData(), 
        fetchSupportData(), 
        fetchComplianceData()
    ]);
    
    // Merge de resultados bem-sucedidos
    let merged = {};
    results.forEach(res => {
        if (res.status === 'fulfilled') {
            merged = { ...merged, ...res.value };
        }
    });
    return merged as any;
};
