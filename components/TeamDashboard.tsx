
import React, { useMemo } from 'react';
import { Team, TeamMember, Collaborator, Ticket, EquipmentType } from '../types';
import { EditIcon, DeleteIcon } from './common/Icons';
import { FaUsers } from 'react-icons/fa';

interface TeamDashboardProps {
    teams: Team[];
    teamMembers: TeamMember[];
    collaborators: Collaborator[];
    tickets: Ticket[];
    equipmentTypes: EquipmentType[];
    onEdit: (team: Team) => void;
    onDelete: (id: string) => void;
    onManageMembers: (team: Team) => void;
}

const TeamDashboard: React.FC<TeamDashboardProps> = ({ teams, teamMembers, collaborators, tickets, equipmentTypes, onEdit, onDelete, onManageMembers }) => {
    
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
        return [...teams].sort((a, b) => a.name.localeCompare(b.name));
    }, [teams]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Gerir Equipas de Suporte</h2>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nome da Equipa</th>
                            <th scope="col" className="px-6 py-3">Descrição</th>
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

                            const isDeleteDisabled = memberCount > 0 || ticketCount > 0 || eqTypeCount > 0;

                            let disabledReason = "";
                            if (memberCount > 0) disabledReason = "Existem membros na equipa";
                            else if (ticketCount > 0) disabledReason = "Existem tickets atribuídos";
                            else if (eqTypeCount > 0) disabledReason = "Está associada a tipos de equipamento";

                            return (
                            <tr key={team.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">{team.name}</td>
                                <td className="px-6 py-4">{team.description || '—'}</td>
                                <td className="px-6 py-4 text-center">{memberCount}</td>
                                <td className="px-6 py-4 text-center">{ticketCount}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center items-center gap-4">
                                        <button onClick={() => onManageMembers(team)} className="text-green-400 hover:text-green-300" title="Gerir Membros">
                                            <FaUsers />
                                        </button>
                                        <button onClick={() => onEdit(team)} className="text-blue-400 hover:text-blue-300" title="Editar Equipa">
                                            <EditIcon />
                                        </button>
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
                                    </div>
                                </td>
                            </tr>
                        )}) : (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-on-surface-dark-secondary">Nenhuma equipa encontrada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeamDashboard;
