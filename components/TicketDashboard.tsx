
import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, Entidade, Collaborator, TicketStatus, Team, Equipment, EquipmentType, TicketCategory, TicketCategoryItem, SecurityIncidentTypeItem, Supplier } from '../types';
import { EditIcon, FaTasks, FaShieldAlt, FaClock, FaExclamationTriangle, FaSkull, FaUserSecret, FaBug, FaNetworkWired, FaLock, FaFileContract, PlusIcon, FaLandmark, FaTruck, FaUsers, FaCalendarAlt } from './common/Icons';
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
  totalItems?: number;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onFilterChange?: (filter: any) => void;
  sort?: { key: string, direction: 'ascending' | 'descending' };
  onSortChange?: (sort: { key: string, direction: 'ascending' | 'descending' }) => void;
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
    totalItems = 0, loading = false, page = 1, pageSize = 20, onPageChange, onPageSizeChange, onFilterChange,
    sort, onSortChange
}) => {
    const sortConfig = sort || { key: 'requestDate', direction: 'descending' };
    
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);
    const equipmentMap = useMemo(() => new Map(equipment.map(e => [e.id, e])), [equipment]);

    const handleSort = (key: string) => {
        if (!onSortChange) return;
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        onSortChange({ key, direction });
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white">Gestão de Tickets</h2>
                    <p className="text-xs text-gray-500 mt-1">Lista geral de pedidos e intervenções técnicas.</p>
                </div>
                <div className="flex items-center gap-2">
                    {onGenerateReport && <button onClick={onGenerateReport} className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm flex items-center gap-2"><FaFileContract/> Relatório</button>}
                    {onCreate && <button onClick={onCreate} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2 font-bold shadow-lg"><PlusIcon /> Abrir Ticket</button>}
                </div>
            </div>
        
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <SortableHeader label="Data Criação" sortKey="requestDate" currentSort={sortConfig} onSort={handleSort} />
                            <th className="px-6 py-3">Entidade / Dep.</th>
                            <th className="px-6 py-3">Equipa</th>
                            <SortableHeader label="Assunto / Solicitante" sortKey="title" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Técnico" sortKey="technician" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Estado" sortKey="status" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {tickets.length > 0 ? tickets.map((ticket) => {
                            const isRealSecurity = (ticket.category || '').toLowerCase().includes('segurança') || !!ticket.securityIncidentType;
                            const requesterName = ticket.requester_supplier_id ? supplierMap.get(ticket.requester_supplier_id) : (collaboratorMap.get(ticket.collaboratorId) || 'N/A');
                            return (
                                <tr key={ticket.id} className={`hover:bg-gray-800/50 cursor-pointer ${isRealSecurity ? 'bg-red-900/10' : ''}`} onClick={() => onOpenActivities?.(ticket)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-white font-medium">
                                            <FaCalendarAlt className="text-gray-500 text-xs"/>
                                            {new Date(ticket.requestDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{entidadeMap.get(ticket.entidadeId || '') || 'Geral'}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-800 border border-gray-600 px-2 py-1 rounded text-[10px] text-white uppercase font-bold">
                                            {ticket.team_id ? teamMap.get(ticket.team_id) : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-on-surface-dark max-w-xs">
                                        <div className="font-bold text-white truncate">{ticket.title}</div>
                                        <div className="text-[10px] text-gray-500 uppercase">{requesterName}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs">{ticket.technicianId ? collaboratorMap.get(ticket.technicianId) : <span className="text-gray-600 italic">Por atribuir</span>}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border ${getStatusClass(ticket.status)}`}>{ticket.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-center items-center gap-3">
                                            {onOpenActivities && <button onClick={() => onOpenActivities(ticket)} className="text-teal-400 hover:text-teal-300" title="Atividades"><FaTasks/></button>}
                                            {isRealSecurity && onGenerateSecurityReport && <button onClick={() => onGenerateSecurityReport(ticket)} className="text-red-400 hover:text-red-300" title="Relatório NIS2"><FaShieldAlt/></button>}
                                            {onEdit && <button onClick={() => onEdit(ticket)} className="text-blue-400 hover:text-blue-300" title="Editar"><EditIcon /></button>}
                                        </div>
                                    </td>
                                </tr>
                            )
                        }) : <tr><td colSpan={7} className="text-center py-10 text-gray-500 italic">Nenhum ticket encontrado.</td></tr>}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={page || 1} totalPages={Math.ceil((totalItems || 0) / (pageSize || 20))} onPageChange={(p) => onPageChange?.(p)} itemsPerPage={pageSize || 20} onItemsPerPageChange={(s) => onPageSizeChange?.(s)} totalItems={totalItems || 0} />
        </div>
    );
};

export default TicketDashboard;
