
import { 
    EquipmentStatus, CriticalityLevel, CollaboratorStatus, EntidadeStatus, 
    UserRole, Equipment, Brand, EquipmentType, Collaborator, Ticket, 
    SoftwareLicense, Team, TeamMember, Message, Instituicao, Entidade
} from '../types';

export const MOCK_INSTITUICOES: Instituicao[] = [
    { id: 'inst-1', name: 'Sede Global AIManager', codigo: 'HQ', email: 'hq@aimanager.local', telefone: '210000000', is_active: true }
];

export const MOCK_ENTIDADES: Entidade[] = [
    { id: 'ent-1', instituicao_id: 'inst-1', codigo: 'TI-01', name: 'Departamento de TI', email: 'ti@aimanager.local', status: EntidadeStatus.Ativo }
];

export const MOCK_COLLABORATORS: Collaborator[] = [
    { 
        id: 'user-1', 
        full_name: 'José Moreira (Mock)', 
        email: 'josefsmoreira@outlook.com', 
        role: UserRole.SuperAdmin, 
        status: CollaboratorStatus.Ativo, 
        can_login: true, 
        receives_notifications: true,
        entidade_id: 'ent-1'
    }
];

export const MOCK_DATA_BUNDLE = {
    instituicoes: MOCK_INSTITUICOES,
    entidades: MOCK_ENTIDADES,
    brands: [],
    equipmentTypes: [],
    collaborators: MOCK_COLLABORATORS,
    equipment: [],
    tickets: [],
    assignments: [],
    softwareLicenses: [],
    licenseAssignments: [],
    teams: [{ id: 'team-1', name: 'Triagem', is_active: true }],
    teamMembers: [{ id: 'tm-1', team_id: 'team-1', collaborator_id: 'user-1' }],
    messages: [],
    // ... restante vazio
};
