
import { 
    EquipmentStatus, CriticalityLevel, CollaboratorStatus, EntidadeStatus, 
    UserRole, Equipment, Brand, EquipmentType, Collaborator, Ticket, 
    SoftwareLicense, Team, TeamMember, Message, Instituicao, Entidade
} from '../types';

/**
 * CLEAN SLATE MOCK DATA - V3.0 (Pedido 4 - Reset Total)
 * Wiped: Brands, Types, Equipment, Tickets, Messages (except system), Configs.
 * Kept: SuperAdmin (user-superadmin), Root Inst/Ent, Triagem Team.
 */

export const MOCK_INSTITUICOES: Instituicao[] = [
    { id: 'inst-root', name: 'Organização Root', codigo: 'ROOT', email: 'admin@local.aimanager', telefone: '000000000', is_active: true }
];

export const MOCK_ENTIDADES: Entidade[] = [
    { id: 'ent-root', instituicao_id: 'inst-root', codigo: 'ADM', name: 'Administração Geral', email: 'admin@local.aimanager', status: EntidadeStatus.Ativo }
];

export const MOCK_COLLABORATORS: Collaborator[] = [
    { 
        id: 'user-superadmin', 
        full_name: 'José Moreira (SuperAdmin)', 
        email: 'josefsmoreira@outlook.com', 
        role: UserRole.SuperAdmin, 
        status: CollaboratorStatus.Ativo, 
        can_login: true, 
        receives_notifications: true,
        entidade_id: 'ent-root',
        instituicao_id: 'inst-root'
    }
];

export const MOCK_DATA_BUNDLE = {
    instituicoes: MOCK_INSTITUICOES,
    entidades: MOCK_ENTIDADES,
    collaborators: MOCK_COLLABORATORS,
    brands: [],
    equipmentTypes: [],
    equipment: [],
    tickets: [],
    assignments: [],
    softwareLicenses: [],
    licenseAssignments: [],
    teams: [{ id: 'team-triagem', name: 'Triagem', is_active: true }],
    teamMembers: [{ id: 'tm-root', team_id: 'team-triagem', collaborator_id: 'user-superadmin' }],
    messages: [{
        id: 'msg-system-0',
        sender_id: '00000000-0000-0000-0000-000000000000',
        receiver_id: '00000000-0000-0000-0000-000000000000',
        content: '⚙️ Base de Dados Resetada. O sistema está pronto para nova configuração.',
        timestamp: new Date().toISOString(),
        read: false
    }],
    collaboratorHistory: [],
    ticketCategories: [],
    securityIncidentTypes: [],
    businessServices: [],
    serviceDependencies: [],
    vulnerabilities: [],
    suppliers: [],
    backupExecutions: [],
    resilienceTests: [],
    securityTrainings: [],
    customRoles: [],
    softwareCategories: [],
    softwareProducts: [],
    configEquipmentStatuses: [],
    configTicketStatuses: [],
    configLicenseStatuses: [],
    contactRoles: [],
    contactTitles: [],
    configCriticalityLevels: [],
    configCiaRatings: [],
    configServiceStatuses: [],
    configBackupTypes: [],
    configTrainingTypes: [],
    configResilienceTestTypes: [],
    configDecommissionReasons: [],
    configCollaboratorDeactivationReasons: [],
    configAccountingCategories: [],
    configConservationStates: [],
    configCpus: [],
    configRamSizes: [],
    configStorageTypes: [],
    configJobTitles: [],
    policies: [],
    policyAcceptances: [],
    procurementRequests: [],
    calendarEvents: [],
    continuityPlans: []
};
