
import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, Entidade, Collaborator, TicketStatus, Team, Equipment, EquipmentType, TicketCategory, TicketCategoryItem, SecurityIncidentType, Supplier } from '../types';
import { EditIcon, FaTasks, FaShieldAlt, FaClock, FaExclamationTriangle, FaSkull, FaUserSecret, FaBug, FaNetworkWired, FaLock, FaFileContract, PlusIcon, FaLandmark, FaTruck, FaUsers } from './common/Icons';
import { FaPaperclip } from 'react-icons/fa';
import Pagination from './common/Pagination';
import * as dataService from '../services/dataService';
import SortableHeader from './common/SortableHeader';

interface TicketDashboardProps {
  tickets: Ticket[];
  escolasDepartamentos: Entidade[];
  collaborators: Collaborator[];
  teams: Team[];
  suppliers?: Supplier[]; 
  equipment: Equipment[];
  equipmentTypes: EquipmentType[];
  initialFilter?: any;
  onClearInitialFilter?: () => void;
  onUpdateTicket?: (ticket: Ticket) => void;
  onEdit?: (ticket: Ticket) => void;
  onOpenCloseTicketModal?: (ticket: Ticket) => void;
  onGenerateReport?: () => void;
  onOpenActivities?: (ticket: Ticket) => void;
  onGenerateSecurityReport?: (ticket: Ticket) => void;
  categories: TicketCategoryItem[];
  onCreate?: () => void;
  
  // Server-Side Pagination Props
  totalItems?: number;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onFilterChange?: (filter: any) => void;
  onSortChange?: (sort: { key: string, direction: 'ascending' | 'descending' }) => void;
  sort?: { key: string, direction: 'ascending' | 'descending' };
}

const getStatusClass = (status: TicketStatus) => {
    switch (status) {
        case TicketStatus.Requested: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case TicketStatus.InProgress: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case TicketStatus.Finished: return 'bg-green-500/20 text-green-400 border-green-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const TicketDashboard: React.FC<TicketDashboardProps> = ({ 
    tickets, escolasDepartamentos: entidades, collaborators, teams, suppliers = [], equipment, 
    onUpdateTicket, onEdit, onOpenCloseTicketModal, initialFilter, onClearInitialFilter, 
    onGenerateReport, onOpenActivities, onGenerateSecurityReport, categories, onCreate,
    totalItems = 0, loading = false, page = 1, pageSize = 20, onPageChange, onPageSizeChange, onFilterChange, onSortChange, sort
}) => {
    
    const [filters, setFilters] = useState<{ status: string | string[], team_id: string, category: string, title: string }>({ status: '', team_id: '', category: '', title: '' });
    
    const entidadMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);
    
    useEffect(() => {
        if (initialFilter) {
            setFilters(prev => ({
                ...prev,
                status: initialFilter.status || '',
                category: initialFilter.category || '',
                team_id: initialFilter.team_id || '',
                title: initialFilter.title || ''
            }));
        }
    }, [initialFilter]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        if (onFilterChange) onFilterChange(newFilters);
        if (onPageChange) onPageChange(1);
    };
    
    const handleSort = (key: string) => {
        if (!onSortChange) return;
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sort?.key === key && sort?.direction === 'ascending') direction = 'descending';
        onSortChange({ key, direction });
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-xl font-semibold text-white">Gestão de Tickets</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    {onCreate && (
                        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary mr-2"><PlusIcon /> Abrir Ticket</button>
                    )}
                    <input type="text" name="title" placeholder="Pesquisar..." value={filters.title as string} onChange={handleFilterChange} className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary" />
                    <select name="status" value={Array.isArray(filters.status) ? 'OPEN' : filters.status} onChange={handleFilterChange} className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                        <option value="">Todos</option>
                        <option value="OPEN">Abertos (Pedido + Progresso)</option>
                        {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
        
            <div className="overflow-x-auto min-h-[400px]">
                {loading ? <div className="p-20 text-center text-gray-500">A carregar tickets...</div> : (
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3">Entidade</th>
                            <SortableHeader label="Assunto" sortKey="title" currentSort={sort || {key:'', direction:'ascending'}} onSort={handleSort} />
                            <SortableHeader label="Data" sortKey="requestDate" currentSort={sort || {key:'', direction:'ascending'}} onSort={handleSort} />
                            <th className="px-6 py-3">Equipa</th>
                            <SortableHeader label="Estado" sortKey="status" currentSort={sort || {key:'', direction:'ascending'}} onSort={handleSort} />
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.length > 0 ? tickets.map((ticket) => (
                            <tr key={ticket.id} className="border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer" onClick={() => onOpenActivities && onOpenActivities(ticket)}>
                                <td className="px-6 py-4">{entidadMap.get(ticket.entidadeId || '') || 'N/A'}</td>
                                <td className="px-6 py-4 font-bold text-white max-w-xs truncate">{ticket.title}</td>
                                <td className="px-6 py-4">{new Date(ticket.requestDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{teamMap.get(ticket.team_id || '') || '—'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs border ${getStatusClass(ticket.status)}`}>{ticket.status}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-3">
                                        {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(ticket); }} className="text-blue-400 hover:text-blue-300"><EditIcon /></button>}
                                    </div>
                                </td>
                            </tr>
                        )) : <tr><td colSpan={6} className="text-center py-8">Nenhum ticket encontrado.</td></tr>}
                    </tbody>
                </table>
                )}
            </div>
            <Pagination currentPage={page} totalPages={Math.ceil((totalItems || 0) / (pageSize || 20))} onPageChange={onPageChange!} itemsPerPage={pageSize} onItemsPerPageChange={onPageSizeChange!} totalItems={totalItems || 0} />
        </div>
    );
};

export default TicketDashboard;
