import React, { useState, useMemo } from 'react';
import { Ticket, Entidade, Collaborator, TicketStatus, Team, Equipment, EquipmentType, TicketCategoryItem, SecurityIncidentTypeItem, Supplier, ConfigItem } from '../types';
import { FaTasks, FaShieldAlt, FaClock, FaList, FaThLarge, FaCalendarAlt, PlusIcon, FaFileContract, FaSearch, FaSync, FaLandmark, EditIcon } from './common/Icons';
import Pagination from './common/Pagination';
import SortableHeader from './common/SortableHeader';

interface TicketDashboardProps {
  tickets: Ticket[];
  escolasDepartamentos: Entidade[];
  collaborators: Collaborator[];
  teams: Team[];
  suppliers?: Supplier[]; 
  equipment: Equipment[];
  categories: TicketCategoryItem[];
  onCreate?: () => void;
  onEdit?: (ticket: Ticket) => void;
  onOpenActivities?: (ticket: Ticket) => void;
  onGenerateSecurityReport?: (ticket: Ticket) => void;
  onFilterChange?: (filter: any) => void;
  totalItems?: number;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  sort?: { key: string, direction: 'ascending' | 'descending' };
}

const TicketDashboard: React.FC<TicketDashboardProps> = ({ 
    tickets, collaborators, teams, onCreate, onEdit, onOpenActivities, onGenerateSecurityReport, categories,
    totalItems = 0, loading = false, page = 1, pageSize = 20, onPageChange, onPageSizeChange, onFilterChange, sort
}) => {
    const [localFilters, setLocalFilters] = useState({ status: '', category: '', title: '' });
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);
    const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...localFilters, [name]: value };
        setLocalFilters(newFilters);
        if (onFilterChange) onFilterChange(newFilters);
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-xl font-semibold text-white">Gestão de Suporte</h2><p className="text-xs text-gray-500">SLA e Incidentes NIS2</p></div>
                <button onClick={onCreate} className="px-4 py-2 bg-brand-primary text-white rounded-md font-bold shadow-lg flex items-center gap-2"><PlusIcon /> Abrir Ticket</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-900/40 p-4 rounded-lg border border-gray-700/50">
                <input type="text" name="title" placeholder="Pesquisar..." value={localFilters.title} onChange={handleFilterChange} className="bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs focus:border-brand-secondary outline-none"/>
                <select name="status" value={localFilters.status} onChange={handleFilterChange} className="bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs">
                    <option value="">Todos os Estados</option>
                    <option value="Pedido">Pedido</option>
                    <option value="Em progresso">Em progresso</option>
                    <option value="Finalizado">Finalizado</option>
                </select>
                <select name="category" value={localFilters.category} onChange={handleFilterChange} className="bg-gray-800 border border-gray-700 text-white rounded p-2 text-xs">
                    <option value="">Todas as Categorias</option>
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div></div>
            ) : (
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3">Data</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3">Assunto / Solicitante</th>
                                <th className="px-6 py-3">Técnico</th>
                                <th className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {tickets.map((ticket) => {
                                const isSecurity = (ticket.category || '').toLowerCase().includes('segurança') || !!ticket.security_incident_type;
                                return (
                                    <tr key={ticket.id} className={`hover:bg-gray-800/50 cursor-pointer ${isSecurity ? 'border-l-4 border-l-red-600' : ''}`} onClick={() => onOpenActivities?.(ticket)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">{new Date(ticket.request_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4"><span className={`text-[10px] px-2 py-0.5 rounded border ${ticket.status === 'Finalizado' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>{ticket.status}</span></td>
                                        <td className="px-6 py-4"><div className="font-bold text-white flex items-center gap-2">{ticket.title} {isSecurity && <FaShieldAlt className="text-red-500 text-xs" />}</div><div className="text-[10px] text-gray-500">{collaboratorMap.get(ticket.collaborator_id)}</div></td>
                                        <td className="px-6 py-4 text-xs text-gray-400">{collaboratorMap.get(ticket.technician_id!) || 'Pendente'}</td>
                                        <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                                            <div className="flex justify-center gap-3">
                                                {isSecurity && onGenerateSecurityReport && <button onClick={() => onGenerateSecurityReport(ticket)} className="text-red-400" title="NIS2 Report"><FaLandmark /></button>}
                                                <button onClick={() => onOpenActivities?.(ticket)} className="text-teal-400" title="Atividades"><FaTasks/></button>
                                                <button onClick={() => onEdit?.(ticket)} className="text-blue-400"><EditIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            <Pagination currentPage={page || 1} totalPages={Math.ceil((totalItems || 0) / (pageSize || 20))} onPageChange={(p) => onPageChange?.(p)} itemsPerPage={pageSize || 20} onItemsPerPageChange={(s) => onPageSizeChange?.(s)} totalItems={totalItems || 0} />
        </div>
    );
};

export default TicketDashboard;