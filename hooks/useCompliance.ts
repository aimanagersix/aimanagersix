
import { useState, useCallback, useEffect } from 'react';
import * as dataService from '../services/dataService';
import { BusinessService, ServiceDependency, Vulnerability, BackupExecution, ResilienceTest, SecurityTrainingRecord, Policy, PolicyAcceptance, ContinuityPlan, ConfigItem } from '../types';

export const useCompliance = (isConfigured: boolean) => {
    const [data, setData] = useState({
        businessServices: [] as BusinessService[],
        serviceDependencies: [] as ServiceDependency[],
        vulnerabilities: [] as Vulnerability[],
        backupExecutions: [] as BackupExecution[],
        resilienceTests: [] as ResilienceTest[],
        securityTrainings: [] as SecurityTrainingRecord[],
        policies: [] as Policy[],
        policyAcceptances: [] as PolicyAcceptance[],
        continuityPlans: [] as ContinuityPlan[],
        configTrainingTypes: [] as ConfigItem[],
        // Fix: Added missing properties to hook state
        configCriticalityLevels: [] as ConfigItem[],
        configCiaRatings: [] as ConfigItem[],
        configServiceStatuses: [] as ConfigItem[],
        configBackupTypes: [] as ConfigItem[],
        configResilienceTestTypes: [] as ConfigItem[]
    });
    const [isLoading, setIsLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!isConfigured) return;
        setIsLoading(true);
        try {
            const complianceData = await dataService.fetchComplianceData();
            setData(complianceData);
        } catch (error) {
            console.error("Failed to fetch compliance data", error);
        } finally {
            setIsLoading(false);
        }
    }, [isConfigured]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { data, isLoading, refresh };
};
