
import React, { useState, useMemo } from 'react';
import { Ticket, Entidade, Collaborator, TicketStatus, Team, Equipment, EquipmentType, TicketCategoryItem, SecurityIncidentTypeItem, Supplier, ConfigItem } from '../types';
import { EditIcon, FaTasks, FaShieldAlt, FaClock, FaExclamationTriangle, FaList, FaThLarge, FaCalendarAlt, PlusIcon, FaFileContract, FaSearch, FaSync, FaLandmark } from './common/Icons';
import Pagination from './common/Pagination';
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
  totalItems?: number;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onFilterChange?: (filter: any) => void;
  sort?: { key: string, direction: 'ascending' | 'descending' };
  onSortChange?: (sort: { key: string, direction: 'ascending' | 'descending' }) => void;
  statusOptions?: ConfigItem[];
}

const TicketDashboard: React.FC<TicketDashboardProps> = ({ 
    tickets, escolasDepartamentos: entidades, collaborators, teams, suppliers = [], equipment, 
    onEdit, initialFilter, onClearInitialFilter, 
    onGenerateReport, onOpenActivities, onGenerateSecurityReport, categories, onCreate,
    totalItems = 0, loading = false, page = 1, pageSize = 20, onPageChange, onPageSizeChange, onSortChange, sort,
    statusOptions = [],
    onFilterChange
}) => {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [localFilters, setLocalFilters] = useState({
        status: initialFilter?.status || '',
        category: initialFilter?.category || '',
        team_id: initialFilter?.team_id || '',
        title: initialFilter?.title || ''
    });

    const sortConfig = sort || { key: 'requestDate', direction: 'descending' };
    
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.name, c])), [categories]);

    const handleLocalFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...localFilters, [name]: value };
        setLocalFilters(newFilters);
        if (onFilterChange) onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const blank = { status: '', category: '', team_id: '', title: '' };
        setLocalFilters(blank);
        if (onFilterChange) onFilterChange(blank);
        if (onClearInitialFilter) onClearInitialFilter();
    };

    const isSecurityIncident = (ticket: Ticket) => {
        const catObj = categoryMap.get(ticket.category);
        return catObj?.is_security || (ticket.category || '').toLowerCase().includes('segurança');
    };

    const getSLAStatus = (ticket: Ticket) => {
        if (ticket.status === 'Finalizado' || ticket.status === 'Cancelado') return { label: ticket.status, color: 'text-gray-500 bg-gray-500/10 border-gray-700' };
        
        const cat = categoryMap.get(ticket.category);
        if (!cat || (!cat.sla_warning_hours && !cat.sla_critical_hours)) return { label: ticket.status, color: 'text-blue-400 bg-blue-400/10 border-blue-500/30' };

        const start = new Date(ticket.requestDate).getTime();
        const now = new Date().getTime();
        const hoursElapsed = (now - start) / (1000 * 3600);

        if (cat.sla_critical_hours && hoursElapsed > cat.sla_critical_hours) {
            return { label: 'Crítico (SLA)', color: 'text-red-500 bg-red-500/20 border-red-500/50 font-black animate-pulse' };
        }
        if (cat.sla_warning_hours && hoursElapsed > cat.sla_warning_hours) {
            return { label: 'Atrasado (SLA)', color: 'text-yellow-500 bg-yellow-500/20 border-yellow-500/50 font-bold' };
        }
        return { label: ticket.status, color: 'text-green-400 bg-green-400/10 border-green-500/30 font-medium' };
    };

    const handleSort = (key: string) => {
        if (!onSortChange) return;
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        onSortChange({ key, direction });
    };

    const TicketCard = ({ ticket }: { ticket: Ticket }) => {
        const sla = getSLAStatus(ticket);
        const requesterName = ticket.requester_supplier_id ? supplierMap.get(ticket.requester_supplier_id) : (collaboratorMap.get(ticket.collaboratorId) || 'N/A');
        const isSecurity = isSecurityIncident(ticket);

        return (
            <div 
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-2xl flex flex-col h-full ${isSecurity ? 'bg-red-900/10 border-red-500/40' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                onClick={() => onOpenActivities?.(ticket)}
            >
                <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-tighter ${sla.color}`}>
                        {sla.label}
                    </span>
                    <div className="flex gap-2">
                        {isSecurity && <FaShieldAlt className="text-red-500 animate-pulse" title="Incidente de Segurança" />}
                        <span className="text-[10px] text-gray-500">#{ticket.id.substring(0,4)}</span>
                    </div>
                </div>
                <h3 className="font-bold text-white text-sm line-clamp-2 mb-2">{ticket.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-3 mb-4 h-12 italic">{ticket.description}</p>
                
                <div className="mt-auto pt-3 border-t border-gray-700 flex justify-between items-center">
                    <div className="min-w-0">
                        <p className="text-[10px] text-gray-500 uppercase truncate">{requesterName}</p>
                        <p className="text-[9px] text-brand-secondary font-bold">{ticket.team_id ? teamMap.get(ticket.team_id) : 'Pendente'}</p>
                    </div>
                    <div className="flex gap-1">
                        {isSecurity && onGenerateSecurityReport && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onGenerateSecurityReport(ticket); }} 
                                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-md"
                                title="Notificação Regulatória NIS2"
                            >
                                <FaLandmark size={14} />
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onEdit?.(ticket); }} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-md"><EditIcon /></button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white">Gestão de Tickets</h2>
                    <p className="text-xs text-gray-500 mt-1">SLA e Atendimento Técnico</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-700">
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            title="Vista em Lista"
                        >
                            <FaList />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')} 
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            title="Vista em Grelha"
                        >
                            <FaThLarge />
                        </button>
                    </div>
                    <button onClick={onGenerateReport} className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm flex items-center gap-2"><FaFileContract/> Relatório</button>
                    {onCreate && <button onClick={onCreate} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2 font-bold shadow-lg"><PlusIcon /> Abrir Ticket</button>}
                </div>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-900/40 p-4 rounded-lg border border-gray-700/50">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-500 text-xs" />
                    <input 
                        type="text" 
                        name="title" 
                        placeholder="Pesquisar assunto..." 
                        value={localFilters.title}
                        onChange={handleLocalFilterChange}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 pl-8 text-xs focus:border-brand-secondary outline-none"
                    />
                </div>
                <select 
                    name="status" 
                    value={localFilters.status} 
                    onChange={handleLocalFilterChange}
                    className="bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs focus:border-brand-secondary outline-none"
                >
                    <option value="">Todos os Estados</option>
                    {statusOptions.length > 0 ? statusOptions.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>) : (
                        <>
                            <option value="Pedido">Pedido</option>
                            <option value="Em progresso">Em progresso</option>
                            <option value="Finalizado">Finalizado</option>
                            <option value="Cancelado">Cancelado</option>
                        </>
                    )}
                </select>
                <select 
                    name="category" 
                    value={localFilters.category} 
                    onChange={handleLocalFilterChange}
                    className="bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs focus:border-brand-secondary outline-none"
                >
                    <option value="">Todas as Categorias</option>
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
                <div className="flex gap-2">
                    <select 
                        name="team_id" 
                        value={localFilters.team_id} 
                        onChange={handleLocalFilterChange}
                        className="flex-grow bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs focus:border-brand-secondary outline-none"
                    >
                        <option value="">Todas as Equipas</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button onClick={clearFilters} className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded" title="Limpar Filtros"><FaSync /></button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div></div>
            ) : (
                viewMode === 'list' ? (
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                            <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                                <tr>
                                    <SortableHeader label="SLA / Data" sortKey="requestDate" currentSort={sortConfig} onSort={handleSort} />
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3">Equipa</th>
                                    <SortableHeader label="Assunto / Solicitante" sortKey="title" currentSort={sortConfig} onSort={handleSort} />
                                    <SortableHeader label="Técnico" sortKey="technician" currentSort={sortConfig} onSort={handleSort} />
                                    <th className="px-6 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {tickets.length > 0 ? tickets.map((ticket) => {
                                    const sla = getSLAStatus(ticket);
                                    const requesterName = ticket.requester_supplier_id ? supplierMap.get(ticket.requester_supplier_id) : (collaboratorMap.get(ticket.collaboratorId) || 'N/A');
                                    const isSecurity = isSecurityIncident(ticket);
                                    
                                    return (
                                        <tr key={ticket.id} className={`hover:bg-gray-800/50 cursor-pointer ${isSecurity ? 'bg-red-900/5 border-l-4 border-l-red-600' : ''}`} onClick={() => onOpenActivities?.(ticket)}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-white font-bold text-xs"><FaCalendarAlt className="text-gray-500"/> {new Date(ticket.requestDate).toLocaleDateString()}</div>
                                                <div className="text-[9px] text-gray-500 mt-0.5">#{ticket.id.substring(0,8)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`text-[10px] px-2 py-0.5 rounded border inline-block font-bold uppercase tracking-wider ${sla.color}`}>{sla.label}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-gray-800 border border-gray-600 px-2 py-1 rounded text-[10px] text-white uppercase font-bold">
                                                    {ticket.team_id ? teamMap.get(ticket.team_id) : 'Pendente'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <div className="font-bold text-white truncate flex items-center gap-2">
                                                    {ticket.title}
                                                    {isSecurity && <FaShieldAlt className="text-red-500 text-xs shrink-0" />}
                                                </div>
                                                <div className="text-[10px] text-gray-500 uppercase">{requesterName}</div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">{ticket.technicianId ? collaboratorMap.get(ticket.technicianId) : <span className="text-gray-600 italic">Por atribuir</span>}</td>
                                            <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-center items-center gap-3">
                                                    {isSecurity && onGenerateSecurityReport && (
                                                        <button 
                                                            onClick={() => onGenerateSecurityReport(ticket)} 
                                                            className="text-red-400 hover:text-red-300" 
                                                            title="Notificação Regulatória NIS2"
                                                        >
                                                            <FaLandmark />
                                                        </button>
                                                    )}
                                                    <button onClick={() => onOpenActivities?.(ticket)} className="text-teal-400 hover:text-teal-300" title="Atividades"><FaTasks/></button>
                                                    <button onClick={() => onEdit?.(ticket)} className="text-blue-400 hover:text-blue-300" title="Editar"><EditIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : <tr><td colSpan={6} className="text-center py-10 text-gray-500 italic">Nenhum ticket encontrado.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                        {tickets.length > 0 ? tickets.map(ticket => (
                            <TicketCard key={ticket.id} ticket={ticket} />
                        )) : <div className="col-span-full text-center py-20 text-gray-500">Nenhum ticket encontrado.</div>}
                    </div>
                )
            )}
            <Pagination currentPage={page || 1} totalPages={Math.ceil((totalItems || 0) / (pageSize || 20))} onPageChange={(p) => onPageChange?.(p)} itemsPerPage={pageSize || 20} onItemsPerPageChange={(s) => onPageSizeChange?.(s)} totalItems={totalItems || 0} />
        </div>
    );
};

export default TicketDashboard;
