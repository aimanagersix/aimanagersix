
import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, Entidade, Collaborator, TicketStatus, Team, Equipment, EquipmentType, TicketCategoryItem, SecurityIncidentTypeItem, Supplier, ModuleKey, PermissionAction, ConfigItem } from '../types';
import { EditIcon, FaTasks, FaShieldAlt, FaClock, FaExclamationTriangle, FaSkull, FaUserSecret, FaBug, FaNetworkWired, FaLock, FaFileContract, PlusIcon, FaLandmark, FaTruck, FaUsers } from './common/Icons';
import { FaPaperclip, FaChevronDown } from 'react-icons/fa';
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

const getNis2Countdown = (ticket: Ticket) => {
    if (ticket.status === 'Finalizado') return null;
    
    const catLower = (ticket.category || '').toLowerCase();
    const isSecurity = catLower.includes('segurança') || catLower.includes('security') || !!ticket.security_incident_type;

    if (!isSecurity) return null;

    const requestDate = new Date(ticket.request_date);
    const now = new Date();
    const deadline24h = requestDate.getTime() + 24 * 60 * 60 * 1000;
    const diffMs = deadline24h - now.getTime();
    const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffMs < 0) {
        return {
            text: `NIS2 Expirado (+${Math.abs(hoursLeft)}h)`,
            className: 'bg-red-600 text-white font-bold border-red-800 animate-pulse'
        };
    } else if (hoursLeft < 4) {
        return {
            text: `NIS2: ${hoursLeft}h (Alerta)`,
            className: 'bg-red-900/50 text-red-300 border-red-500 font-bold animate-pulse'
        };
    } else {
        return {
            text: `NIS2: ${hoursLeft}h`,
            className: 'bg-blue-900/30 text-blue-300 border-blue-500/50'
        };
    }
};

const getSLATimer = (ticket: Ticket, category?: TicketCategoryItem) => {
    if (ticket.status === 'Finalizado') return null;
    
    let warningLimit = category?.sla_warning_hours || 0;
    let criticalLimit = category?.sla_critical_hours || 0;
    
    const catLower = (ticket.category || '').toLowerCase();
    const isSecurity = catLower.includes('segurança') || !!ticket.security_incident_type;

    if (warningLimit === 0 && criticalLimit === 0 && isSecurity) {
        warningLimit = 24;
        criticalLimit = 72;
    }
    
    if (warningLimit === 0 && criticalLimit === 0) return null;

    const requestDate = new Date(ticket.request_date);
    const now = new Date();
    const elapsedHours = (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60);

    if (warningLimit > 0 && elapsedHours < warningLimit) {
        const hoursLeft = Math.ceil(warningLimit - elapsedHours);
        return { label: 'Alerta', text: `${hoursLeft}h restantes`, className: 'text-orange-400 border-orange-500/30 bg-orange-500/10', icon: <FaClock className="animate-pulse" /> };
    }
    if (criticalLimit > 0 && elapsedHours < criticalLimit) {
        const hoursLeft = Math.ceil(criticalLimit - elapsedHours);
        return { label: 'Prazo Final', text: `${hoursLeft}h restantes`, className: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', icon: <FaExclamationTriangle /> };
    }
    if (criticalLimit > 0) {
        return { label: 'SLA Excedido', text: `+${Math.floor(elapsedHours - criticalLimit)}h atraso`, className: 'text-red-500 border-red-500/50 bg-red-500/20 font-bold', icon: <FaShieldAlt /> };
    }
    return null;
};

const getSecurityIcon = (type?: string) => {
    if (!type) return <FaShieldAlt className="text-red-500" />;
    const lowerType = type.toLowerCase();
    if (lowerType.includes('ransomware')) return <FaSkull className="text-red-500" title="Ransomware" />;
    if (lowerType.includes('phishing')) return <FaUserSecret className="text-orange-500" title="Phishing" />;
    if (lowerType.includes('malware') || lowerType.includes('vírus')) return <FaBug className="text-yellow-500" title="Malware" />;
    if (lowerType.includes('ddos')) return <FaNetworkWired className="text-purple-500" title="DDoS" />;
    if (lowerType.includes('fuga') || lowerType.includes('leak')) return <FaLock className="text-red-400" title="Fuga de Dados" />;
    return <FaShieldAlt className="text-red-500" />;
};

const TicketDashboard: React.FC<TicketDashboardProps> = ({ 
    tickets, escolasDepartamentos: entidades, collaborators, teams, suppliers = [], equipment, categories, configTicketStatuses = [],
    onCreate, onEdit, onUpdateTicket, onOpenActivities, onGenerateSecurityReport, onOpenCloseTicketModal,
    totalItems = 0, loading = false, page = 1, pageSize = 20, onPageChange, onPageSizeChange, onFilterChange,
    sort, onSortChange, checkPermission
}) => {
    const [filters, setFilters] = useState({ status: '', team_id: '', category: '', title: '' });
    
    // Pedido 1: Garantir ordenação decrescente por data de criação por defeito
    const sortConfig = sort || { key: 'request_date', direction: 'descending' };
    
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c])), [collaborators]);
    const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);
    const equipmentMap = useMemo(() => new Map(equipment.map(e => [e.id, e])), [equipment]);
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.name, c])), [categories]);
    const statusConfigMap = useMemo(() => new Map(configTicketStatuses.map(s => [s.name, s])), [configTicketStatuses]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        if (onFilterChange) onFilterChange(newFilters);
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
        const config = statusConfigMap.get(status);
        if (config?.color) {
            return {
                backgroundColor: `${config.color}25`, // Fundo sutil
                color: config.color,
                borderColor: `${config.color}40`
            };
        }
        // Fallback robusto para evitar Badges brancos
        switch (status) {
            case 'Pedido': return { backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', borderColor: 'rgba(234, 179, 8, 0.3)' };
            case 'Em progresso': return { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)' };
            case 'Finalizado': return { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.3)' };
            case 'Cancelado': return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' };
            default: return { backgroundColor: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', borderColor: 'rgba(156, 163, 175, 0.3)' };
        }
    };

    const handleQuickStatusChange = (ticket: Ticket, newStatus: string) => {
        if (!onUpdateTicket) return;
        if (newStatus === 'Finalizado' && onOpenCloseTicketModal) {
            onOpenCloseTicketModal(ticket);
        } else {
            onUpdateTicket({ ...ticket, status: newStatus });
        }
    };

    const canEdit = checkPermission('tickets', 'edit');

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
                    
                    <div className="flex bg-gray-800 rounded-md border border-gray-700 overflow-hidden">
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
                                <SortableHeader label="Data de Criação" sortKey="request_date" currentSort={sortConfig} onSort={handleSortRequest} />
                                <th className="px-6 py-3">Entidade / Local</th>
                                <th className="px-6 py-3">Equipa</th>
                                <SortableHeader label="Categoria" sortKey="category" currentSort={sortConfig} onSort={handleSortRequest} />
                                <SortableHeader label="Assunto / Detalhes" sortKey="title" currentSort={sortConfig} onSort={handleSortRequest} />
                                <th className="px-6 py-3">SLA / NIS2</th>
                                <th className="px-6 py-3">Técnico</th>
                                <SortableHeader label="Estado" sortKey="status" currentSort={sortConfig} onSort={handleSortRequest} />
                                <th className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {tickets.length > 0 ? tickets.map((ticket) => {
                                const requesterObj = ticket.collaborator_id ? collaboratorMap.get(ticket.collaborator_id) : undefined;
                                const requesterName = ticket.requester_supplier_id ? supplierMap.get(ticket.requester_supplier_id) : requesterObj?.full_name;
                                
                                // Pedido 1: Resolver Entidade/Local (Ticket ou Colaborador)
                                const resolvedEntidadeId = ticket.entidade_id || requesterObj?.entidade_id;
                                const entidadeName = (resolvedEntidadeId && entidadeMap.has(resolvedEntidadeId)) ? entidadeMap.get(resolvedEntidadeId) : '—';

                                const categoryObj = ticket.category ? categoryMap.get(ticket.category) : undefined;
                                const sla = getSLATimer(ticket, categoryObj);
                                const nis2 = getNis2Countdown(ticket);
                                const isSecurity = (ticket.category || '').toLowerCase().includes('segurança') || !!ticket.security_incident_type;
                                
                                const statusStyle = getStatusStyle(ticket.status);

                                return (
                                    <tr key={ticket.id} className={`hover:bg-gray-800/40 transition-colors cursor-pointer ${isSecurity ? 'bg-red-900/10' : ''}`} onClick={() => onOpenActivities?.(ticket)}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-mono text-xs text-white">{new Date(ticket.request_date).toLocaleDateString()}</div>
                                            <div className="text-[10px] text-gray-500">{new Date(ticket.request_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{entidadeName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 bg-gray-900/50 border border-gray-700 px-2 py-1 rounded text-[10px] text-brand-secondary font-bold uppercase whitespace-nowrap">
                                                <FaUsers /> {ticket.team_id ? teamMap.get(ticket.team_id) : 'Pendente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {isSecurity && getSecurityIcon(ticket.security_incident_type)}
                                                <span className={isSecurity ? 'text-red-400 font-bold' : 'text-gray-300'}>{ticket.category}</span>
                                            </div>
                                            {ticket.security_incident_type && <div className="text-[9px] text-red-300/70 uppercase mt-1">{ticket.security_incident_type}</div>}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="font-bold text-white mb-0.5">
                                                {ticket.attachments && ticket.attachments.length > 0 && <FaPaperclip className="inline mr-1 text-gray-500" />}
                                                {ticket.title}
                                            </div>
                                            <div className="text-[10px] text-gray-400 flex items-center gap-1 mb-1">
                                                {ticket.requester_supplier_id && <FaTruck className="text-yellow-500"/>} {requesterName}
                                            </div>
                                            <div className="text-[11px] text-gray-500 line-clamp-1">{ticket.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                {nis2 && <div className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 ${nis2.className}`}><FaLandmark/>{nis2.text}</div>}
                                                {sla ? (
                                                    <div className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 ${sla.className}`}>
                                                        {sla.icon} <span className="font-bold">{sla.label}:</span> {sla.text}
                                                    </div>
                                                ) : (!nis2 && <span className="text-gray-600 text-[10px]">Sem SLA ativo</span>)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                                            {ticket.technician_id ? collaboratorMap.get(ticket.technician_id)?.full_name : <span className="italic">Não Atribuído</span>}
                                        </td>
                                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                            {canEdit ? (
                                                <select 
                                                    value={ticket.status} 
                                                    onChange={(e) => handleQuickStatusChange(ticket, e.target.value)}
                                                    style={statusStyle}
                                                    className={`px-2 py-1 rounded text-[10px] font-black uppercase border focus:outline-none transition-all cursor-pointer`}
                                                >
                                                    {configTicketStatuses.length > 0 ? (
                                                        configTicketStatuses.map(st => <option key={st.id} value={st.name} className="bg-gray-800 text-white">{st.name}</option>)
                                                    ) : (
                                                        <>
                                                            <option value="Pedido">Pedido</option>
                                                            <option value="Em progresso">Em progresso</option>
                                                            <option value="Finalizado">Finalizado</option>
                                                            <option value="Cancelado">Cancelado</option>
                                                        </>
                                                    )}
                                                </select>
                                            ) : (
                                                <span 
                                                    style={statusStyle}
                                                    className={`px-2 py-1 rounded text-[10px] font-black uppercase border`}
                                                >
                                                    {ticket.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                                            <div className="flex justify-center gap-3">
                                                {isSecurity && onGenerateSecurityReport && (
                                                    <button onClick={() => onGenerateSecurityReport(ticket)} className="text-red-400 hover:text-red-300" title="Relatório NIS2"><FaFileContract/></button>
                                                )}
                                                <button onClick={() => onOpenActivities?.(ticket)} className="text-teal-400 hover:text-teal-300" title="Ver Atividade"><FaTasks/></button>
                                                {onEdit && canEdit && <button onClick={() => onEdit(ticket)} className="text-blue-400 hover:text-blue-300"><EditIcon /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={9} className="text-center py-20 text-gray-500 italic">Nenhum ticket encontrado com os filtros atuais.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <Pagination 
                currentPage={page || 1} 
                totalPages={Math.ceil((totalItems || 0) / (pageSize || 20))} 
                onPageChange={(p) => onPageChange?.(p)} 
                itemsPerPage={pageSize || 20} 
                onItemsPerPageChange={(s) => onPageSizeChange?.(s)} 
                totalItems={totalItems || 0} 
            />
        </div>
    );
};

export default TicketDashboard;
