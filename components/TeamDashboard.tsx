import React, { useMemo } from 'react';
import { Team, TeamMember, Collaborator, Ticket } from '../types';
import { EditIcon, DeleteIcon } from './common/Icons';
import { FaUsers } from 'react-icons/fa';

interface TeamDashboardProps {
    teams: Team[];
    teamMembers: TeamMember[];
    collaborators: Collaborator[];
    tickets: Ticket[];
    onEdit: (team: Team) => void;
    onDelete: (id: string) => void;
    onManageMembers: (team: Team) => void;
}

const TeamDashboard: React.FC<TeamDashboardProps> = ({ teams, teamMembers, collaborators, tickets, onEdit, onDelete, onManageMembers }) => {
    
    const memberCountByTeam = useMemo(() => {
        return teamMembers.reduce((acc, member) => {
            acc[member.team_id] = (acc[member.team_id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [teamMembers]);

    const ticketCountByTeam = useMemo(() => {
        return tickets.reduce((acc, ticket) => {
            // FIX: Corrected property name from `teamId` to `team_id` to match the Ticket interface.
            if (ticket.team_id) {
                acc[ticket.team_id] = (acc[ticket.team_id] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [tickets]);

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
                        {sortedTeams.length > 0 ? sortedTeams.map((team) => (
                            <tr key={team.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">{team.name}</td>
                                <td className="px-6 py-4">{team.description || '—'}</td>
                                <td className="px-6 py-4 text-center">{memberCountByTeam[team.id] || 0}</td>
                                <td className="px-6 py-4 text-center">{ticketCountByTeam[team.id] || 0}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center items-center gap-4">
                                        <button onClick={() => onManageMembers(team)} className="text-green-400 hover:text-green-300" title="Gerir Membros">
                                            <FaUsers />
                                        </button>
                                        <button onClick={() => onEdit(team)} className="text-blue-400 hover:text-blue-300" title="Editar Equipa">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDelete(team.id)} className="text-red-400 hover:text-red-300" title="Excluir Equipa">
                                            <DeleteIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
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
