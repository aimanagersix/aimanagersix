
import { 
    EquipmentStatus, CriticalityLevel, CollaboratorStatus, EntidadeStatus, 
    UserRole, Equipment, Brand, EquipmentType, Collaborator, Ticket, 
    SoftwareLicense, Team, TeamMember, Message, Instituicao, Entidade
} from '../types';

/**
 * CLEAN SLATE MOCK DATA - V2.0
 * Este ficheiro define o estado zero do sistema para desenvolvimento local offline.
 */

export const MOCK_INSTITUICOES: Instituicao[] = [
    { 
        id: 'inst-system-root', 
        name: 'Instituição Sede (Local)', 
        codigo: 'ROOT', 
        email: 'admin@aimanager.local', 
        telefone: '000000000', 
        is_active: true 
    }
];

export const MOCK_ENTIDADES: Entidade[] = [
    { 
        id: 'ent-system-admin', 
        instituicao_id: 'inst-system-root', 
        codigo: 'ADM-01', 
        name: 'Administração de Sistemas', 
        email: 'sysadmin@aimanager.local', 
        status: EntidadeStatus.Ativo 
    }
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
        entidade_id: 'ent-system-admin',
        instituicao_id: 'inst-system-root'
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
    teams: [
        { id: 'team-triagem', name: 'Triagem', description: 'Equipa base para análise inicial de tickets', is_active: true }
    ],
    teamMembers: [
        { id: 'tm-root', team_id: 'team-triagem', collaborator_id: 'user-superadmin' }
    ],
    messages: [
        {
            id: 'msg-welcome',
            sender_id: '00000000-0000-0000-0000-000000000000', // SYSTEM_SENDER_ID
            receiver_id: '00000000-0000-0000-0000-000000000000', // GENERAL_CHANNEL_ID
            content: '🚀 Bem-vindo ao AIManager. O sistema está a correr em Modo Offline (Mock). Comece por configurar as suas Marcas e Tipos de Ativo no menu de Definições.',
            timestamp: new Date().toISOString(),
            read: false
        }
    ],
    collaboratorHistory: [],
    ticketCategories: [
        { id: 'cat-default', name: 'Geral', is_active: true, is_security: false }
    ],
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
