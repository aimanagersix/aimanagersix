import { useState, useEffect, useCallback } from 'react';
import * as dataService from '../services/dataService';
import { getSupabase, SUPABASE_CONFIG } from '../services/supabaseClient';
import { 
    Equipment, Brand, EquipmentType, Instituicao, Entidade, Collaborator, 
    Assignment, Ticket, TicketActivity, SoftwareLicense, LicenseAssignment, 
    Team, TeamMember, Message, CollaboratorHistory, TicketCategoryItem, 
    SecurityIncidentTypeItem, BusinessService, ServiceDependency, 
    Vulnerability, BackupExecution, ResilienceTest, SecurityTrainingRecord,
    Supplier, ConfigItem, CustomRole, Policy, PolicyAcceptance, ProcurementRequest, CalendarEvent, ContinuityPlan
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
    policies: Policy[];
    policyAcceptances: PolicyAcceptance[];
    procurementRequests: ProcurementRequest[];
    calendarEvents: CalendarEvent[];
    continuityPlans: ContinuityPlan[]; // NEW
}

const initialData: AppData = {
    equipment: [], brands: [], equipmentTypes: [], instituicoes: [], entidades: [], 
    collaborators: [], assignments: [], tickets: [], ticketActivities: [], 
    softwareLicenses: [], licenseAssignments: [], teams: [], teamMembers: [], 
    messages: [], collaboratorHistory: [], ticketCategories: [], securityIncidentTypes: [], 
    businessServices: [], serviceDependencies: [], vulnerabilities: [], suppliers: [], 
    backupExecutions: [], resilienceTests: [], securityTrainings: [], customRoles: [], 
    softwareCategories: [], configEquipmentStatuses: [], contactRoles: [], contactTitles: [], 
    configCriticalityLevels: [], configCiaRatings: [], configServiceStatuses: [], 
    configBackupTypes: [], configTrainingTypes: [], configResilienceTestTypes: [],
    configDecommissionReasons: [],
    policies: [], policyAcceptances: [], procurementRequests: [], calendarEvents: [],
    continuityPlans: [] // NEW
};

export const useAppData = () => {
    // --- Authentication & Setup State ---
    const [isConfigured, setIsConfigured] = useState<boolean>(() => {
        // Check LocalStorage OR Process Env OR Hardcoded Defaults
        const url = localStorage.getItem('SUPABASE_URL') || process.env.SUPABASE_URL || SUPABASE_CONFIG.url;
        const key = localStorage.getItem('SUPABASE_ANON_KEY') || process.env.SUPABASE_ANON_KEY || SUPABASE_CONFIG.key;
        return !!(url && key);
    });
    
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [appData, setAppData] = useState<AppData>(initialData);
    const [isLoading, setIsLoading] = useState(true); // Start true to block rendering until check is done

    // --- Data Loading ---
    const loadData = useCallback(async () => {
        if (!isConfigured) return;
        try {
            const data = await dataService.fetchAllData();
            setAppData({
                equipment: data.equipment,
                brands: data.brands,
                equipmentTypes: data.equipmentTypes,
                instituicoes: data.instituicoes,
                entidades: data.entidades,
                collaborators: data.collaborators,
                assignments: data.assignments,
                tickets: data.tickets,
                ticketActivities: data.ticketActivities,
                softwareLicenses: data.softwareLicenses,
                licenseAssignments: data.licenseAssignments,
                teams: data.teams,
                teamMembers: data.teamMembers,
                messages: data.messages,
                collaboratorHistory: data.collaboratorHistory,
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
                softwareCategories: data.configSoftwareCategories,
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
                policies: data.policies,
                policyAcceptances: data.policyAcceptances,
                procurementRequests: data.procurementRequests,
                calendarEvents: data.calendarEvents,
                continuityPlans: data.continuityPlans // NEW
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
                    const { data: { session } } = await supabase.auth.getSession();
                    
                    if (session) {
                        // Fetch data first to ensure we have the collaborator list to match the user
                        await loadData();
                        const freshData = await dataService.fetchAllData();
                        const user = freshData.collaborators.find((c: Collaborator) => c.email === session.user.email);
                        if (user) {
                            setCurrentUser(user);
                        }
                    }
                }
            } catch (e) {
                // Only set false if hardcoded fallback also failed
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
            // loadData(); // Already loaded in initial check
            const interval = setInterval(loadData, 30000); // Poll every 30s
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