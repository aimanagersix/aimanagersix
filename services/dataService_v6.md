
import { fetchOrganizationData, fetchCollaboratorsPaginated } from './orgService';
import { fetchInventoryData, fetchEquipmentPaginated } from './inventoryService';
import { fetchSupportData, fetchTicketsPaginated } from './supportService';
import { fetchComplianceData } from './complianceService';
import { MOCK_DATA_BUNDLE } from './mockData';

export * from './authService';
export * from './inventoryService';
export * from './supportService';
export * from './complianceService';
export * from './orgService';
export * from './configService';

const CACHE_KEY = 'aimanager_global_cache';
const CACHE_TIME_KEY = 'aimanager_cache_timestamp';
const CACHE_DURATION = 10 * 60 * 1000; 

const FORCE_MOCK = true; 

const getMockPersistedData = () => {
    const data = localStorage.getItem('aimanager_mock_db');
    if (data) return JSON.parse(data);
    localStorage.setItem('aimanager_mock_db', JSON.stringify(MOCK_DATA_BUNDLE));
    return MOCK_DATA_BUNDLE;
};

export const isUsingMock = () => FORCE_MOCK;

export const fetchAllData = async (forceRefresh = false) => {
    if (FORCE_MOCK) {
        return getMockPersistedData();
    }
    // ... lógica original de fetch ...
};
