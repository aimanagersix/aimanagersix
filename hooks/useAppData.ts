import { useState, useEffect, useCallback } from 'react';
import * as dataService from '../services/dataService';
import { getSupabase } from '../services/supabaseClient';
import { 
    Equipment, Brand, EquipmentType, Instituicao, Entidade, Collaborator, 
    Assignment, Ticket, TicketActivity, SoftwareLicense, LicenseAssignment, 
    Team, TeamMember, Message, CollaboratorHistory, TicketCategoryItem, 
    SecurityIncidentTypeItem, BusinessService, ServiceDependency, 
    Vulnerability, BackupExecution, ResilienceTest, SecurityTrainingRecord,
    Supplier, ConfigItem, CustomRole, Policy, PolicyAcceptance, ProcurementRequest, CalendarEvent, ContinuityPlan, SoftwareProduct
} from '../types';

export interface AppData {
    equipment: Equipment[];
    brands: Brand[];
    equipmentTypes: EquipmentType[];
    instituicoes: Instituicao[];
    entidades: Entidade[];
    collaborators: Collaborator[];
    assignments: Assignment[];
    tickets: Ticket[];
    ticketActivities: TicketActivity[];
    softwareLicenses: SoftwareLicense[];
    licenseAssignments: LicenseAssignment[];
    teams: Team[];
    teamMembers: TeamMember[];
    messages: Message[];
    collaboratorHistory: CollaboratorHistory[];
    ticketCategories: TicketCategoryItem[]; 
    securityIncidentTypes: SecurityIncidentTypeItem[]; 
    businessServices: BusinessService[];
    serviceDependencies: ServiceDependency[];
    vulnerabilities: Vulnerability[];
    suppliers: Supplier[];
    backupExecutions: BackupExecution[];
    resilienceTests: ResilienceTest[];
    securityTrainings: SecurityTrainingRecord[];
    customRoles: CustomRole[];
    softwareCategories: ConfigItem[];
    softwareProducts: SoftwareProduct[];
    configEquipmentStatuses: ConfigItem[];
    contactRoles: ConfigItem[];
    contactTitles: ConfigItem[];
    configCriticalityLevels: ConfigItem[];
    configCiaRatings: ConfigItem[];
    configServiceStatuses: ConfigItem[];
    configBackupTypes: ConfigItem[];
    configTrainingTypes: ConfigItem[];
    configResilienceTestTypes: ConfigItem[];
    configDecommissionReasons: ConfigItem[];
    configCollaboratorDeactivationReasons: ConfigItem[];
    configAccountingCategories: ConfigItem[];
    configConservationStates: ConfigItem[];
    configCpus: ConfigItem[];
    configRamSizes: ConfigItem[];
    configStorageTypes: ConfigItem[];
    configJobTitles: ConfigItem[]; 
    policies: Policy[];
    policyAcceptances: PolicyAcceptance[];
    procurementRequests: ProcurementRequest[];
    calendarEvents: CalendarEvent[];
    continuityPlans: ContinuityPlan[];
}

const initialData: AppData = {
    equipment: [], brands: [], equipmentTypes: [], instituicoes: [], entidades: [], 
    collaborators: [], assignments: [], tickets: [], ticketActivities: [], 
    softwareLicenses: [], licenseAssignments: [], teams: [], teamMembers: [], 
    messages: [], collaboratorHistory: [], ticketCategories: [], securityIncidentTypes: [], 
    businessServices: [], serviceDependencies: [], vulnerabilities: [], suppliers: [], 
    backupExecutions: [], resilienceTests: [], securityTrainings: [], customRoles: [], 
    softwareCategories: [], softwareProducts: [], configEquipmentStatuses: [], contactRoles: [], contactTitles: [], 
    configCriticalityLevels: [], configCiaRatings: [], configServiceStatuses: [], 
    configBackupTypes: [], configTrainingTypes: [], configResilienceTestTypes: [],
    configDecommissionReasons: [], configCollaboratorDeactivationReasons: [],
    configAccountingCategories: [], configConservationStates: [],
    configCpus: [], configRamSizes: [], configStorageTypes: [], configJobTitles: [],
    policies: [], policyAcceptances: [], procurementRequests: [], calendarEvents: [],
    continuityPlans: []
};

export const useAppData = () => {
    // --- Authentication & Setup State ---
    const [isConfigured, setIsConfigured] = useState<boolean>(() => {
        // 1. Vite Direct
        // @ts-ignore
        const viteUrl = import.meta.env.VITE_SUPABASE_URL;
        // @ts-ignore
        const viteKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (viteUrl && viteKey) return true;

        // 2. Process Env (via define in vite.config.ts)
        // @ts-ignore
        const processUrl = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : null;
        // @ts-ignore
        const processKey = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : null;

        if (processUrl && processKey) return true;

        // 3. LocalStorage
        const storageUrl = localStorage.getItem('SUPABASE_URL');
        const storageKey = localStorage.getItem('SUPABASE_ANON_KEY');
        
        return !!(storageUrl && storageKey);
    });
    
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [appData, setAppData] = useState<AppData>(initialData);
    const [isLoading, setIsLoading] = useState(true);

    // --- Data Loading ---
    const loadData = useCallback(async () => {
        if (!isConfigured) return;
        try {
            // Note: Heavy tables like 'equipment' and 'tickets' are now fetched empty here
            // They are loaded on demand via server-side pagination in their respective Managers.
            const data = await dataService.fetchAllData();
            
            setAppData({
                equipment: [], 
                brands: data.brands,
                equipmentTypes: data.equipmentTypes,
                instituicoes: data.instituicoes,
                entidades: data.entidades,
                collaborators: data.collaborators,
                assignments: data.assignments, 
                tickets: data.tickets, 
                ticketActivities: [], 
                softwareLicenses: data.softwareLicenses,
                licenseAssignments: data.licenseAssignments,
                teams: data.teams,
                teamMembers: data.teamMembers,
                messages: data.messages,
                collaboratorHistory: [], 
                ticketCategories: data.ticketCategories,
                securityIncidentTypes: data.securityIncidentTypes,
                businessServices: data.businessServices,
                serviceDependencies: data.serviceDependencies,
                vulnerabilities: data.vulnerabilities,
                suppliers: data.suppliers,
                backupExecutions: data.backupExecutions,
                resilienceTests: data.resilienceTests,
                securityTrainings: data.securityTrainings,
                customRoles: data.configCustomRoles,
                softwareCategories: data.softwareCategories,
                softwareProducts: data.softwareProducts,
                configEquipmentStatuses: data.configEquipmentStatuses,
                contactRoles: data.contactRoles,
                contactTitles: data.contactTitles,
                configCriticalityLevels: data.configCriticalityLevels,
                configCiaRatings: data.configCiaRatings,
                configServiceStatuses: data.configServiceStatuses,
                configBackupTypes: data.configBackupTypes,
                configTrainingTypes: data.configTrainingTypes,
                configResilienceTestTypes: data.configResilienceTestTypes,
                configDecommissionReasons: data.configDecommissionReasons,
                configCollaboratorDeactivationReasons: data.configCollaboratorDeactivationReasons,
                configAccountingCategories: data.configAccountingCategories,
                configConservationStates: data.configConservationStates,
                configCpus: data.configCpus,
                configRamSizes: data.configRamSizes,
                configStorageTypes: data.configStorageTypes,
                configJobTitles: data.configJobTitles,
                policies: data.policies,
                policyAcceptances: data.policyAcceptances,
                procurementRequests: data.procurementRequests,
                calendarEvents: data.calendarEvents,
                continuityPlans: data.continuityPlans
            });
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    }, [isConfigured]);

    // --- Initial Check & Polling ---
    useEffect(() => {
        const checkConfig = async () => {
             setIsLoading(true);
             try {
                if (isConfigured) {
                    const supabase = getSupabase();
                    const { data: { session } } = await (supabase.auth as any).getSession();
                    
                    if (session) {
                        await loadData();
                        const freshData = await dataService.fetchAllData();
                        const user = freshData.collaborators.find((c: Collaborator) => c.email === session.user.email);
                        if (user) {
                            setCurrentUser(user);
                        }
                    }
                }
            } catch (e) {
                // If getSupabase fails, it throws error, so we catch it here and show setup screen
                setIsConfigured(false);
                console.error("Config check failed", e);
            } finally {
                setIsLoading(false);
            }
        };
        checkConfig();
    }, [isConfigured, loadData]);

    useEffect(() => {
        if (isConfigured && currentUser) {
            const interval = setInterval(loadData, 60000); 
            return () => clearInterval(interval);
        }
    }, [isConfigured, currentUser, loadData]);

    return {
        isConfigured,
        setIsConfigured,
        currentUser,
        setCurrentUser,
        appData,
        refreshData: loadData,
        isLoading
    };
};