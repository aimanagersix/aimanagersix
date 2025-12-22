
import { useState, useCallback, useEffect } from 'react';
import * as dataService from '../services/dataService';
import { Instituicao, Entidade, Collaborator, CustomRole, ContactTitle, ContactRole, CollaboratorHistory } from '../types';

export const useOrganization = (isConfigured: boolean) => {
    const [data, setData] = useState({
        instituicoes: [] as Instituicao[],
        entidades: [] as Entidade[],
        collaborators: [] as Collaborator[],
        customRoles: [] as CustomRole[],
        contactTitles: [] as ContactTitle[],
        contactRoles: [] as ContactRole[],
        collaboratorHistory: [] as CollaboratorHistory[]
    });
    const [isLoading, setIsLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!isConfigured) return;
        setIsLoading(true);
        try {
            const orgData = await dataService.fetchOrganizationData();
            // Fallback para quando o service retorna apenas uma parte do bundle
            if (dataService.isUsingMock()) {
                setData(orgData);
            } else {
                setData(prev => ({ ...prev, ...orgData }));
            }
        } catch (error) {
            console.error("Failed to fetch organization data", error);
        } finally {
            setIsLoading(false);
        }
    }, [isConfigured]);

    useEffect(() => {
        if (isConfigured) refresh();
    }, [isConfigured, refresh]);

    return { data, isLoading, refresh };
};
