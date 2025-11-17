import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, Entidade, Collaborator, TicketStatus, Team } from '../types';
import { EditIcon, FaTasks } from './common/Icons';
import { FaPaperclip } from 'react-icons/fa';
import Pagination from './common/Pagination';

interface TicketDashboardProps {
  tickets: Ticket[];
  escolasDepartamentos: Entidade[];
  collaborators: Collaborator[];
  teams: Team[];
  initialFilter?: any;
  onClearInitialFilter?: () => void;
  onUpdateTicket?: (ticket: Ticket) => void;
  onEdit?: (ticket: Ticket) => void;
  onOpenCloseTicketModal?: (ticket: Ticket) => void;
  onGenerateReport?: () => void;
  onOpenActivities?: (ticket: Ticket) => void;
}

const getStatusClass = (status: TicketStatus) => {
    switch (status) {
        case TicketStatus.Requested: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case TicketStatus.InProgress: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case TicketStatus.Finished: return 'bg-green-500/20 text-green-400 border-green-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const TicketDashboard: React.FC<TicketDashboardProps> = ({ tickets, escolasDepartamentos: entidades, collaborators, teams, onUpdateTicket, onEdit, onOpenCloseTicketModal, initialFilter, onClearInitialFilter, onGenerateReport, onOpenActivities }) => {
    
    const [filters, setFilters] = useState<{ status: string | string[], teamId: string }>({ status: '', teamId: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    useEffect(() => {
        if (initialFilter) {
            setFilters(prev => ({ ...prev, status: initialFilter.status || '' }));
        } else {
            // Reset if initialFilter is cleared from parent
            setFilters(prev => ({ ...prev, status: '' }));
        }
        setCurrentPage(1); // Reset page on filter change
    }, [initialFilter]);
    
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({...prev, [name]: value}));
        onClearInitialFilter?.();
        setCurrentPage(1);
    };
    
    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };

    const filteredTickets = useMemo(() => {
        return [...tickets].sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
        .filter(ticket => {
            const teamMatch = !filters.teamId || ticket.teamId === filters.teamId;
            const statusMatch = (() => {
                if (!filters.status || (Array.isArray(filters.status) && filters.status.length === 0)) return true;
                if (Array.isArray(filters.status)) {
                    return filters.status.includes(ticket.status);
                }
                return ticket.status === filters.status;
            })();

            return teamMatch && statusMatch;
        });
    }, [tickets, filters]);

    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    const paginatedTickets = useMemo(() => {
        return filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredTickets, currentPage, itemsPerPage]);


    const handleStatusChange = (ticket: Ticket, newStatus: TicketStatus) => {
        if (!onUpdateTicket || !onOpenCloseTicketModal) return;

        if (newStatus === TicketStatus.Finished) {
            onOpenCloseTicketModal(ticket);
        } else if (newStatus === TicketStatus.Requested) {
            const updatedTicket: Ticket = {
                ...ticket,
                status: newStatus,
            };
            delete updatedTicket.finishDate;
            delete updatedTicket.technicianId;
            onUpdateTicket(updatedTicket);
        } else {
             const updatedTicket: Ticket = { ...ticket, status: newStatus };
             onUpdateTicket(updatedTicket);
        }
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-xl font-semibold text-white">Gerenciar Tickets de Suporte</h2>
                <div className="flex items-center gap-2">
                     <select
                        id="teamFilter"
                        name="teamId"
                        value={filters.teamId}
                        onChange={handleFilterChange}
                        className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                     >
                        <option value="">Todas as Equipas</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                     <select
                        id="statusFilter"
                        name="status"
                        value={Array.isArray(filters.status) ? '' : filters.status}
                        onChange={handleFilterChange}
                        className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                     >
                        <option value="">Todos os Estados</option>
                        {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                </div>
            </div>
        
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Entidade / Equipa</th>
                            <th scope="col" className="px-6 py-3">Colaborador</th>
                            <th scope="col" className="px-6 py-3">Descrição</th>
                            <th scope="col" className="px-6 py-3">Datas</th>
                            <th scope="col" className="px-6 py-3">Técnico</th>
                            <th scope="col" className="px-6 py-3">Estado</th>
                            <th scope="col" className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTickets.length > 0 ? paginatedTickets.map((ticket) => (
                        <tr key={ticket.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                            <td className="px-6 py-4">
                                <div>{entidadeMap.get(ticket.entidadeId) || 'N/A'}</div>
                                {ticket.teamId && <div className="text-xs text-brand-secondary mt-1">{teamMap.get(ticket.teamId)}</div>}
                            </td>
                            <td className="px-6 py-4">{collaboratorMap.get(ticket.collaboratorId) || 'N/A'}</td>
                            <td className="px-6 py-4 font-medium text-on-surface-dark max-w-xs truncate" title={ticket.description}>
                                {ticket.attachments && ticket.attachments.length > 0 && <FaPaperclip className="inline mr-2 text-on-surface-dark-secondary" title={`${ticket.attachments.length} anexo(s)`} />}
                                {ticket.description}
                            </td>
                            <td className="px-6 py-4">
                                <div>Pedido: {ticket.requestDate}</div>
                                {ticket.finishDate && <div className="text-xs">Fim: {ticket.finishDate}</div>}
                            </td>
                            <td className="px-6 py-4">{ticket.technicianId ? collaboratorMap.get(ticket.technicianId) : '—'}</td>
                            <td className="px-6 py-4">
                                 <select
                                    value={ticket.status}
                                    onChange={(e) => handleStatusChange(ticket, e.target.value as TicketStatus)}
                                    className={`px-2 py-1 rounded-md text-xs border bg-transparent ${getStatusClass(ticket.status)} focus:outline-none focus:ring-2 focus:ring-brand-secondary disabled:cursor-not-allowed disabled:opacity-70`}
                                    disabled={!onUpdateTicket}
                                >
                                    {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex justify-center items-center gap-4">
                                    {onOpenActivities && (
                                        <button
                                            onClick={() => onOpenActivities(ticket)}
                                            className="text-teal-400 hover:text-teal-300"
                                            title="Registar Intervenção / Ver Atividades"
                                        >
                                            <FaTasks className="h-5 w-5"/>
                                        </button>
                                    )}
                                    {onEdit && (
                                        <button onClick={() => onEdit(ticket)} className="text-blue-400 hover:text-blue-300" aria-label={`Editar ticket de ${collaboratorMap.get(ticket.collaboratorId)}`}>
                                            <EditIcon />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-on-surface-dark-secondary">Nenhum ticket encontrado com os filtros atuais.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                totalItems={filteredTickets.length}
            />
        </div>
    );
};

export default TicketDashboard;