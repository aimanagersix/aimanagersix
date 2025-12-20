import { useState, useCallback, useEffect } from 'react';
import * as dataService from '../services/dataService';
import { Equipment, Brand, EquipmentType, Assignment, SoftwareLicense, LicenseAssignment, ProcurementRequest, ConfigItem, SoftwareProduct, JobTitle } from '../types';

export const useInventory = (isConfigured: boolean) => {
    const [data, setData] = useState({
        equipment: [] as Equipment[],
        brands: [] as Brand[],
        equipmentTypes: [] as EquipmentType[],
        assignments: [] as Assignment[],
        softwareLicenses: [] as SoftwareLicense[],
        licenseAssignments: [] as LicenseAssignment[],
        procurementRequests: [] as ProcurementRequest[],
        softwareCategories: [] as ConfigItem[],
        softwareProducts: [] as SoftwareProduct[],
        suppliers: [] as any[],
        configEquipmentStatuses: [] as ConfigItem[],
        configLicenseStatuses: [] as ConfigItem[],
        configCpus: [] as ConfigItem[],
        configRamSizes: [] as ConfigItem[],
        configStorageTypes: [] as ConfigItem[],
        configAccountingCategories: [] as ConfigItem[],
        configConservationStates: [] as ConfigItem[],
        configDecommissionReasons: [] as ConfigItem[],
        configJobTitles: [] as JobTitle[],
        configCollaboratorDeactivationReasons: [] as ConfigItem[]
    });
    const [isLoading, setIsLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!isConfigured) return;
        setIsLoading(true);
        try {
            const invData = await dataService.fetchInventoryData();
            setData(invData);
        } catch (error) {
            console.error("Failed to fetch inventory data", error);
        } finally {
            setIsLoading(false);
        }
    }, [isConfigured]);

    useEffect(() => {
        if (isConfigured) refresh();
    }, [isConfigured, refresh]);

    return { data, isLoading, refresh };
};