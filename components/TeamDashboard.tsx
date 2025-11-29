
import React, { useMemo, useState } from 'react';
import { Team, TeamMember, Collaborator, Ticket, EquipmentType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from './common/Icons';
import { FaUsers, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import TeamDetailModal from './TeamDetailModal';

interface TeamDashboardProps {
    teams: Team[];
    teamMembers: TeamMember[];
    collaborators: Collaborator[];
    tickets: Ticket[];
    equipmentTypes: EquipmentType[];
    onEdit?: (team: Team) => void;
    onDelete?: (id: string) => void;
    onManageMembers?: (team: Team) => void;
    onCreate?: () => void;
    onToggleStatus?: (id: string) => void;
}

const TeamDashboard: React.FC<TeamDashboardProps> = ({ teams, teamMembers, collaborators, tickets, equipmentTypes, onEdit, onDelete, onManageMembers, onCreate, onToggleStatus }) => {
    
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('');

    const memberCountByTeam = useMemo(() => {
        return teamMembers.reduce((acc, member) => {
            acc[member.team_id] = (acc[member.team_id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [teamMembers]);

    const ticketCountByTeam = useMemo(() => {
        return tickets.reduce((acc, ticket) => {
            if (ticket.team_id) {
                acc[ticket.team_id] = (acc[ticket.team_id] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [tickets]);

    const equipmentTypeCountByTeam = useMemo(() => {
        return equipmentTypes.reduce((acc, type) => {
            if (type.default_team_id) {
                acc[type.default_team_id] = (acc[type.default_team_id] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [equipmentTypes]);

    const sortedTeams = useMemo(() => {
        return teams.filter(t => 
            filterStatus === '' || 
            (filterStatus === 'active' ? t.is_active !== false : t.is_active === false)
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [teams, filterStatus]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Gerir Equipas de Suporte</h2>
                <div className="flex gap-4 items-center">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                    >
                        <option value="">Todos os Estados</option>
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                    </select>
                    {onCreate && (
                        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors">
                            <PlusIcon /> Adicionar
                        </button>
                    )}
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nome da Equipa</th>
                            <th scope="col" className="px-6 py-3">Descrição</th>
                            <th scope="col" className="px-6 py-3 text-center">Status</th>
                            <th scope="col" className="px-6 py-3 text-center">Nº de Membros</th>
                            <th scope="col" className="px-6 py-3 text-center">Nº de Tickets</th>
                            <th scope="col" className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTeams.length > 0 ? sortedTeams.map((team) => {
                            const memberCount = memberCountByTeam[team.id] || 0;
                            const ticketCount = ticketCountByTeam[team.id] || 0;
                            const eqTypeCount = equipmentTypeCountByTeam[team.id] || 0;
                            const isActive = team.is_active !== false;

                            const isDeleteDisabled = memberCount > 0 || ticketCount > 0 || eqTypeCount > 0;

                            let disabledReason = "";
                            if (memberCount > 0) disabledReason = "Existem membros na equipa";
                            else if (ticketCount > 0) disabledReason = "Existem tickets atribuídos";
                            else if (eqTypeCount > 0) disabledReason = "Está associada a tipos de equipamento";

                            return (
                            <tr 
                                key={team.id} 
                                className={`border-b border-gray-700 cursor-pointer ${isActive ? 'bg-surface-dark hover:bg-gray-800/50' : 'bg-gray-800/50 opacity-70'}`}
                                onClick={() => setSelectedTeam(team)}
                            >
                                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">{team.name}</td>
                                <td className="px-6 py-4">{team.description || '—'}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 text-xs rounded-full ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">{memberCount}</td>
                                <td className="px-6 py-4 text-center">{ticketCount}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center items-center gap-4">
                                        {onToggleStatus && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onToggleStatus(team.id); }}
                                                className={`text-xl ${isActive ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
                                                title={isActive ? 'Inativar' : 'Ativar'}
                                            >
                                                {isActive ? <FaToggleOn /> : <FaToggleOff />}
                                            </button>
                                        )}
                                        {onManageMembers && (
                                            <button onClick={(e) => { e.stopPropagation(); onManageMembers(team); }} className="text-green-400 hover:text-green-300" title="Gerir Membros">
                                                <FaUsers />
                                            </button>
                                        )}
                                        {onEdit && (
                                            <button onClick={(e) => { e.stopPropagation(); onEdit(team); }} className="text-blue-400 hover:text-blue-300" title="Editar Equipa">
                                                <EditIcon />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (!isDeleteDisabled) onDelete(team.id); 
                                                }} 
                                                className={isDeleteDisabled ? "text-gray-600 opacity-30 cursor-not-allowed" : "text-red-400 hover:text-red-300"}
                                                disabled={isDeleteDisabled}
                                                title={isDeleteDisabled ? `Impossível excluir: ${disabledReason}` : `Excluir ${team.name}`}
                                                aria-label={isDeleteDisabled ? "Exclusão desabilitada" : `Excluir ${team.name}`}
                                            >
                                                <DeleteIcon />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}) : (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-on-surface-dark-secondary">Nenhuma equipa encontrada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedTeam && (
                <TeamDetailModal
                    team={selectedTeam}
                    teamMembers={teamMembers}
                    collaborators={collaborators}
                    onClose={() => setSelectedTeam(null)}
                    onEdit={() => {
                        setSelectedTeam(null);
                        if (onEdit) onEdit(selectedTeam);
                    }}
                />
            )}
        </div>
    );
};

export default TeamDashboard;
