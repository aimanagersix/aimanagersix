
import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, Entidade, Collaborator, TicketStatus, Team, Equipment, EquipmentType, TicketCategoryItem, SecurityIncidentTypeItem, Supplier, ModuleKey, PermissionAction, ConfigItem, Instituicao } from '../types';
import { EditIcon, FaTasks, FaShieldAlt, FaClock, FaExclamationTriangle, FaSkull, FaUserSecret, FaBug, FaNetworkWired, FaLock, FaFileContract, PlusIcon, FaLandmark, FaTruck, FaUsers, FaUserTie, FaSync, FaCalendarAlt } from './common/Icons';
import { FaPaperclip, FaChevronDown } from 'react-icons/fa';
import Pagination from './common/Pagination';
import * as dataService from '../services/dataService';
import SortableHeader from './common/SortableHeader';

interface TicketDashboardProps {
  tickets: Ticket[];
  escolasDepartamentos: Entidade[];
  instituicoes: Instituicao[];
  collaborators: Collaborator[];
  teams: Team[];
  suppliers?: Supplier[]; 
  equipment: Equipment[];
  categories: TicketCategoryItem[];
  configTicketStatuses?: ConfigItem[];
  onCreate?: () => void;
  onEdit?: (ticket: Ticket) => void;
  onUpdateTicket?: (ticket: Ticket) => void;
  onOpenActivities?: (ticket: Ticket) => void;
  onGenerateSecurityReport?: (ticket: Ticket) => void;
  onOpenCloseTicketModal?: (ticket: Ticket) => void;
  onFilterChange?: (filter: any) => void;
  checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
  
  // Server-Side Pagination & Sort Props
  totalItems?: number;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  sort?: { key: string, direction: 'ascending' | 'descending' };
  onSortChange?: (sort: { key: string, direction: 'ascending' | 'descending' }) => void;
}

const addBusinessDays = (startDate: Date, days: number) => {
    let result = new Date(startDate);
    let count = 0;
    while (count < days) {
        result.setDate(result.getDate() + 1);
        // 0 = Domingo, 6 = Sábado
        if (result.getDay() !== 0 && result.getDay() !== 6) count++;
    }
    return result;
};

const getBusinessDaysRemaining = (requestDateStr: string, slaDays: number) => {
    const requestDate = new Date(requestDateStr);
    const targetDate = addBusinessDays(requestDate, slaDays);
    const now = new Date();
    
    // Simplificado para dias inteiros
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
        daysRemaining: diffDays,
        targetDate: targetDate,
        isOverdue: diffTime < 0
    };
};

const TicketDashboard: React.FC<TicketDashboardProps> = ({ 
    tickets, escolasDepartamentos: entidades, instituicoes, collaborators, teams, suppliers = [], equipment, categories, configTicketStatuses = [],
    onCreate, onEdit, onUpdateTicket, onOpenActivities, onGenerateSecurityReport, onOpenCloseTicketModal,
    totalItems = 0, loading = false, page = 1, pageSize = 20, onPageChange, onPageSizeChange, onFilterChange,
    sort, onSortChange, checkPermission
}) => {
    const canEdit = checkPermission('tickets', 'edit');
    const [filters, setFilters] = useState({ status: '', team_id: '', category: '', title: '' });
    const sortConfig = sort || { key: 'request_date', direction: 'descending' };
    
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const instituicaoMap = useMemo(() => new Map(instituicoes.map(i => [i.id, i.name])), [instituicoes]);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c])), [collaborators]);
    const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.name, c])), [categories]);
    const statusConfigMap = useMemo(() => new Map(configTicketStatuses.map(s => [s.name.toLowerCase(), s])), [configTicketStatuses]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        if (onFilterChange) onFilterChange(newFilters);
        if (onPageChange) onPageChange(1);
    };

    const handleResetFilters = () => {
        const empty = { status: '', team_id: '', category: '', title: '' };
        setFilters(empty);
        if (onFilterChange) onFilterChange(empty);
        if (onPageChange) onPageChange(1);
    };

    const handleSortRequest = (key: string) => {
        if (!onSortChange) return;
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        onSortChange({ key, direction });
    };

    const getStatusStyle = (status: string) => {
        const config = statusConfigMap.get(status.toLowerCase());
        if (config?.color) {
            return { backgroundColor: `${config.color}25`, color: config.color, borderColor: `${config.color}40` };
        }
        switch (status) {
            case 'Pedido': return { backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', borderColor: 'rgba(234, 179, 8, 0.3)' };
            case 'Em progresso': return { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)' };
            case 'Finalizado': return { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.3)' };
            case 'Cancelado': return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' };
            default: return { backgroundColor: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', borderColor: 'rgba(156, 163, 175, 0.3)' };
        }
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl animate-fade-in">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white">Suporte Técnico & NIS2</h2>
                    <p className="text-xs text-gray-500 mt-1">Gestão de incidentes e conformidade regulatória.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={onCreate} className="px-4 py-2 bg-brand-primary text-white rounded-md font-bold shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all">
                        <PlusIcon /> Abrir Ticket
                    </button>
                    
                    <div className="flex bg-gray-800 rounded-md border border-gray-700 overflow-hidden items-center">
                        <input type="text" name="title" placeholder="Pesquisar..." value={filters.title} onChange={handleFilterChange} className="bg-transparent text-white px-3 py-1.5 text-sm focus:outline-none w-40 md:w-64"/>
                        <select name="category" value={filters.category} onChange={handleFilterChange} className="bg-gray-700 text-gray-300 px-2 py-1.5 text-xs border-l border-gray-600 focus:outline-none">
                            <option value="">Categorias</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="bg-gray-700 text-gray-300 px-2 py-1.5 text-xs border-l border-gray-600 focus:outline-none">
                            <option value="">Estados Ativos</option>
                            <option value="Pedido">Pedido</option>
                            <option value="Em progresso">Em progresso</option>
                            <option value="Finalizado">Finalizado (Histórico)</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                        <button onClick={handleResetFilters} className="bg-gray-600 text-white px-3 py-1.5 hover:bg-gray-500 transition-colors border-l border-gray-600">
                            <FaSync className={(filters.title || filters.category || filters.status) ? "text-brand-secondary" : "opacity-30"} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto min-h-[450px]">
                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div></div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                            <tr>
                                <SortableHeader label="Criação" sortKey="request_date" currentSort={sortConfig} onSort={handleSortRequest} />
                                <th className="px-6 py-3">Entidade / Local</th>
                                <th className="px-6 py-3">Requerente</th>
                                <th className="px-6 py-3">Equipa</th>
                                <SortableHeader label="Categoria" sortKey="category" currentSort={sortConfig} onSort={handleSortRequest} />
                                <SortableHeader label="Assunto" sortKey="title" currentSort={sortConfig} onSort={handleSortRequest} />
                                <th className="px-6 py-3 text-center">Prazo (D. Úteis)</th>
                                <th className="px-6 py-3">Técnico</th>
                                <SortableHeader label="Estado" sortKey="status" currentSort={sortConfig} onSort={handleSortRequest} />
                                <th className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {tickets.length > 0 ? tickets.map((ticket) => {
                                const requesterObj = ticket.collaborator_id ? collaboratorMap.get(ticket.collaborator_id) : undefined;
                                const requesterName = ticket.requester_supplier_id ? supplierMap.get(ticket.requester_supplier_id) : requesterObj?.full_name;
                                
                                const resolvedEntidadeId = ticket.entidade_id || requesterObj?.entidade_id;
                                const locationName = resolvedEntidadeId ? (entidadeMap.get(resolvedEntidadeId) || '—') : '—';
                                
                                const categoryObj = ticket.category ? categoryMap.get(ticket.category) : undefined;
                                // Lógica de SLA
                                const slaInfo = (ticket.status === 'Pedido' || ticket.status === 'Em progresso') && categoryObj?.sla_working_days 
                                    ? getBusinessDaysRemaining(ticket.request_date, categoryObj.sla_working_days) 
                                    : null;

                                return (
                                    <tr key={ticket.id} className={`hover:bg-gray-800/40 transition-colors cursor-pointer ${slaInfo?.isOverdue ? 'bg-red-900/10' : ''}`} onClick={() => onOpenActivities?.(ticket)}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-mono text-xs text-white">{new Date(ticket.request_date).toLocaleDateString()}</div>
                                            <div className="text-[10px] text-gray-500">{new Date(ticket.request_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td className="px-6 py-4"><div className="font-medium text-white">{locationName}</div></td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-semibold flex items-center gap-2 whitespace-nowrap">
                                                {ticket.requester_supplier_id ? <FaTruck className="text-yellow-500" /> : <FaUserTie className="text-gray-400" />}
                                                {requesterName || 'Desconhecido'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 bg-gray-900/50 border border-gray-700 px-2 py-1 rounded text-[10px] text-brand-secondary font-bold uppercase whitespace-nowrap">
                                                <FaUsers /> {ticket.team_id ? teamMap.get(ticket.team_id) : 'Pendente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{ticket.category}</td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="font-bold text-white mb-0.5 truncate">
                                                {ticket.attachments && ticket.attachments.length > 0 && <FaPaperclip className="inline mr-1 text-brand-secondary" />}
                                                {ticket.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {slaInfo ? (
                                                <div className={`px-2 py-1 rounded text-xs font-black inline-flex items-center gap-1 border shadow-sm ${slaInfo.isOverdue ? 'bg-red-600 text-white border-red-800 animate-pulse' : 'bg-gray-800 text-brand-secondary border-gray-600'}`}>
                                                    <FaCalendarAlt /> {slaInfo.daysRemaining}d
                                                </div>
                                            ) : <span className="text-gray-600">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                                            {ticket.technician_id ? (collaboratorMap.get(ticket.technician_id)?.full_name || 'Técnico') : <span className="italic">Não Atribuído</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span style={getStatusStyle(ticket.status)} className="px-2 py-1 rounded text-[10px] font-black uppercase border">{ticket.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                                            <div className="flex justify-center gap-3">
                                                <button onClick={() => onOpenActivities?.(ticket)} className="text-teal-400 hover:text-teal-300" title="Ver Atividade"><FaTasks/></button>
                                                {onEdit && canEdit && <button onClick={() => onEdit(ticket)} className="text-blue-400 hover:text-blue-300"><EditIcon /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={10} className="text-center py-20 text-gray-500 italic">Nenhum ticket encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <Pagination currentPage={page || 1} totalPages={Math.ceil((totalItems || 0) / (pageSize || 20))} onPageChange={(p) => onPageChange?.(p)} itemsPerPage={pageSize || 20} onItemsPerPageChange={(s) => onPageSizeChange?.(s)} totalItems={totalItems || 0} />
        </div>
    );
};

export default TicketDashboard;
