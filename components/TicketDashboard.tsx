import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, Entidade, Collaborator, Team, Equipment, EquipmentType, TicketCategoryItem, TicketStatus, CriticalityLevel } from '../types';
import { FaPlus, FaFilter, FaSearch, FaExclamationTriangle, FaCheck, FaTimes, FaEdit, FaTrash, FaEye, FaCommentDots, FaShieldAlt, FaUsers } from 'react-icons/fa';
import { EditIcon, ReportIcon } from './common/Icons';
import Pagination from './common/Pagination';

interface TicketDashboardProps {
    tickets: Ticket[];
    totalItems: number;
    loading: boolean;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onFilterChange: (filter: any) => void;

    escolasDepartamentos: Entidade[];
    collaborators: Collaborator[];
    teams: Team[];
    equipment: Equipment[];
    equipmentTypes: EquipmentType[];
    categories: TicketCategoryItem[];
    initialFilter?: any;
    onClearInitialFilter: () => void;
    onEdit?: (ticket: Ticket) => void;
    onCreate?: () => void;
    onOpenCloseTicketModal?: (ticket: Ticket) => void;
    onUpdateTicket?: (ticket: Ticket) => void;
    onGenerateReport?: () => void;
    onOpenActivities?: (ticket: Ticket) => void;
    onGenerateSecurityReport?: (ticket: Ticket) => void;
}

const TicketDashboard: React.FC<TicketDashboardProps> = ({
    tickets, totalItems, loading, page, pageSize, onPageChange, onPageSizeChange, onFilterChange,
    escolasDepartamentos, collaborators, teams, equipment, equipmentTypes, categories,
    initialFilter, onClearInitialFilter, onEdit, onCreate, onOpenCloseTicketModal, onUpdateTicket,
    onGenerateReport, onOpenActivities, onGenerateSecurityReport
}) => {
    // Local filter state
    const [filters, setFilters] = useState({ title: '', status: '', category: '', team_id: '' });

    useEffect(() => {
        if (initialFilter) {
            setFilters(prev => ({ ...prev, ...initialFilter }));
        }
    }, [initialFilter]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
        onPageChange(1);
    };

    const handleClearFilters = () => {
        const emptyFilters = { title: '', status: '', category: '', team_id: '' };
        setFilters(emptyFilters);
        onFilterChange(emptyFilters);
        onClearInitialFilter();
        onPageChange(1);
    };

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const entidadeMap = useMemo(() => new Map(escolasDepartamentos.map(e => [e.id, e.name])), [escolasDepartamentos]);
    const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Pedido': return 'bg-yellow-500/20 text-yellow-400';
            case 'Em progresso': return 'bg-blue-500/20 text-blue-400';
            case 'Finalizado': return 'bg-green-500/20 text-green-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FaFilter className="text-brand-secondary"/> Tickets de Suporte
                </h2>
                <div className="flex gap-2">
                    {onGenerateReport && (
                        <button onClick={onGenerateReport} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">
                            <ReportIcon /> Relatório
                        </button>
                    )}
                    {onCreate && (
                        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors shadow-lg">
                            <FaPlus /> Novo Ticket
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-gray-900/30 p-4 rounded-lg border border-gray-700">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        name="title"
                        value={filters.title}
                        onChange={handleFilterChange}
                        placeholder="Pesquisar por assunto..."
                        className="w-full bg-gray-800 border border-gray-600 text-white rounded-md pl-9 p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                    />
                </div>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm">
                    <option value="">Todos os Estados</option>
                    {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select name="category" value={filters.category} onChange={handleFilterChange} className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm">
                    <option value="">Todas as Categorias</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <div className="flex gap-2">
                    <select name="team_id" value={filters.team_id} onChange={handleFilterChange} className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm flex-grow">
                        <option value="">Todas as Equipas</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button onClick={handleClearFilters} className="text-gray-400 hover:text-white p-2" title="Limpar Filtros"><FaTimes/></button>
                </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3">Assunto / ID</th>
                            <th className="px-6 py-3">Entidade</th>
                            <th className="px-6 py-3">Equipa</th>
                            <th className="px-6 py-3">Requerente</th>
                            <th className="px-6 py-3 text-center">Estado</th>
                            <th className="px-6 py-3 text-center">Prioridade</th>
                            <th className="px-6 py-3">Data</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan={8} className="text-center py-8">A carregar...</td></tr>
                        ) : tickets.length > 0 ? tickets.map(ticket => {
                            const isSecurity = ticket.category === 'Incidente de Segurança' || ticket.securityIncidentType;
                            const isCritical = ticket.impactCriticality === CriticalityLevel.Critical || ticket.impactCriticality === CriticalityLevel.High;
                            const teamName = teamMap.get(ticket.team_id || '') || 'Geral';
                            const requesterName = collaboratorMap.get(ticket.collaboratorId) || 'Desconhecido';
                            
                            return (
                                <tr 
                                    key={ticket.id} 
                                    className={`border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer ${isSecurity ? 'bg-red-900/10' : 'bg-surface-dark'}`}
                                    onClick={() => onOpenActivities && onOpenActivities(ticket)}
                                >
                                    <td className="px-6 py-4 font-medium">
                                        <div className="text-white">{ticket.title}</div>
                                        <div className="text-xs text-gray-500">#{ticket.id.substring(0, 8)}</div>
                                        {isSecurity && <span className="text-[10px] text-red-400 flex items-center gap-1 mt-1"><FaShieldAlt/> Segurança</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>{entidadeMap.get(ticket.entidadeId || '') || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1 bg-gray-800 border border-gray-600 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap">
                                            <FaUsers className="text-brand-secondary"/> {teamName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{requesterName}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusClass(ticket.status)}`}>{ticket.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {isSecurity && isCritical && <FaExclamationTriangle className="text-red-500 mx-auto" title="Crítico" />}
                                    </td>
                                    <td className="px-6 py-4 text-xs">{new Date(ticket.requestDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-center gap-2">
                                            {onOpenActivities && (
                                                <button onClick={() => onOpenActivities(ticket)} className="text-gray-400 hover:text-white" title="Ver Atividades"><FaCommentDots /></button>
                                            )}
                                            {onEdit && (
                                                <button onClick={() => onEdit(ticket)} className="text-blue-400 hover:text-blue-300" title="Editar"><EditIcon /></button>
                                            )}
                                            {onOpenCloseTicketModal && ticket.status !== 'Finalizado' && (
                                                <button onClick={() => onOpenCloseTicketModal(ticket)} className="text-green-400 hover:text-green-300" title="Finalizar"><FaCheck /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan={8} className="text-center py-8 text-gray-500">Nenhum ticket encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={page}
                totalPages={Math.ceil(totalItems / pageSize)}
                onPageChange={onPageChange}
                itemsPerPage={pageSize}
                onItemsPerPageChange={onPageSizeChange}
                totalItems={totalItems}
            />
        </div>
    );
};

export default TicketDashboard;