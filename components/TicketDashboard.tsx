
import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, Entidade, Collaborator, TicketStatus, Team, Equipment, EquipmentType, TicketCategory, TicketCategoryItem, SecurityIncidentType, Supplier } from '../types';
import { EditIcon, FaTasks, FaShieldAlt, FaClock, FaExclamationTriangle, FaSkull, FaUserSecret, FaBug, FaNetworkWired, FaLock, FaFileContract, PlusIcon, FaLandmark, FaTruck, FaUsers } from './common/Icons';
import { FaPaperclip } from 'react-icons/fa';
import Pagination from './common/Pagination';
import * as dataService from '../services/dataService';
import SortableHeader from './common/SortableHeader'; // Import shared component

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
}

const getStatusClass = (status: TicketStatus) => {
    switch (status) {
        case TicketStatus.Requested: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case TicketStatus.InProgress: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case TicketStatus.Finished: return 'bg-green-500/20 text-green-400 border-green-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const getNis2Countdown = (ticket: Ticket) => {
    if (ticket.status === TicketStatus.Finished) return null;
    
    // Check if category name contains "Segurança" or "Security"
    const catLower = (ticket.category || '').toLowerCase();
    const isSecurity = catLower.includes('segurança') || 
                       catLower.includes('security') ||
                       ticket.category === TicketCategory.SecurityIncident || 
                       !!ticket.securityIncidentType;

    if (!isSecurity) return null;

    const requestDate = new Date(ticket.requestDate);
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
    if (ticket.status === TicketStatus.Finished) {
        return null;
    }
    let warningLimit = category?.sla_warning_hours || 0;
    let criticalLimit = category?.sla_critical_hours || 0;
    
    // Default security SLA if not defined in DB but is security incident
    const catLower = (ticket.category || '').toLowerCase();
    const isSecurity = catLower.includes('segurança') || 
                       catLower.includes('security') ||
                       !!ticket.securityIncidentType;

    if (warningLimit === 0 && criticalLimit === 0 && isSecurity) {
        warningLimit = 24;
        criticalLimit = 72;
    }
    if (warningLimit === 0 && criticalLimit === 0) return null;

    const requestDate = new Date(ticket.requestDate);
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
    if (lowerType.includes('phishing') || lowerType.includes('engenharia')) return <FaUserSecret className="text-orange-500" title="Phishing" />;
    if (lowerType.includes('malware') || lowerType.includes('vírus')) return <FaBug className="text-yellow-500" title="Malware" />;
    if (lowerType.includes('ddos') || lowerType.includes('negação')) return <FaNetworkWired className="text-purple-500" title="DDoS" />;
    if (lowerType.includes('fuga') || lowerType.includes('leak')) return <FaLock className="text-red-400" title="Fuga de Dados" />;
    return <FaShieldAlt className="text-red-500" />;
};


const TicketDashboard: React.FC<TicketDashboardProps> = ({ 
    tickets, escolasDepartamentos: entidades, collaborators, teams, suppliers = [], equipment, 
    onUpdateTicket, onEdit, onOpenCloseTicketModal, initialFilter, onClearInitialFilter, 
    onGenerateReport, onOpenActivities, onGenerateSecurityReport, categories, onCreate,
    totalItems = 0, loading = false, page = 1, pageSize = 20, onPageChange, onPageSizeChange, onFilterChange
}) => {
    
    const [filters, setFilters] = useState<{ status: string, team_id: string, category: string, title: string }>({ status: '', team_id: '', category: '', title: '' });
    
    // Sort State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
        key: 'requestDate',
        direction: 'descending'
    });
    
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);
    const equipmentMap = useMemo(() => new Map(equipment.map(e => [e.id, e])), [equipment]);
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.name, c])), [categories]);
    
    const displayCategories = categories.length > 0 ? categories.map(c => c.name) : Object.values(TicketCategory);

    useEffect(() => {
        if (initialFilter) {
            setFilters(prev => ({
                ...prev,
                status: Array.isArray(initialFilter.status) ? '' : (initialFilter.status || ''),
                category: initialFilter.category || '',
                team_id: initialFilter.team_id || '',
                title: initialFilter.title || '' // FIX: Ensure title is synced
            }));
        }
    }, [initialFilter]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
        if (onClearInitialFilter) onClearInitialFilter();
        if (onPageChange) onPageChange(1);
    };
    
    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleStatusChange = (ticket: Ticket, newStatus: TicketStatus) => {
        if (!onUpdateTicket || !onOpenCloseTicketModal) return;
        if (newStatus === TicketStatus.Finished) {
            onOpenCloseTicketModal(ticket);
        } else if (newStatus === TicketStatus.Requested) {
            const updatedTicket: Ticket = { ...ticket, status: newStatus };
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
                <div>
                    <h2 className="text-xl font-semibold text-white">Gerir Tickets de Suporte</h2>
                    <p className="text-sm text-on-surface-dark-secondary mt-1">
                        <button onClick={onGenerateReport} className="hover:text-white hover:underline">
                            Ver Relatório Geral & Análise IA
                        </button>
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {onCreate && (
                        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors mr-2">
                            <PlusIcon /> Abrir Ticket
                        </button>
                    )}
                    
                    <input 
                        type="text" 
                        name="title" 
                        placeholder="Pesquisar assunto..." 
                        value={filters.title} 
                        onChange={handleFilterChange} 
                        className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                    />

                    <select id="categoryFilter" name="category" value={filters.category} onChange={handleFilterChange} className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary">
                        <option value="">Todas as Categorias</option>
                        {displayCategories.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                     <select id="team_idFilter" name="team_id" value={filters.team_id} onChange={handleFilterChange} className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary">
                        <option value="">Todas as Equipas</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                     <select id="statusFilter" name="status" value={filters.status} onChange={handleFilterChange} className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary">
                        <option value="">Todos os Estados</option>
                        {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                </div>
            </div>
        
            <div className="overflow-x-auto min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-gray-400">A carregar tickets...</div>
                ) : (
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3">Entidade</th>
                            <th className="px-6 py-3">Equipa</th>
                            <SortableHeader label="Categoria" sortKey="category" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Assunto" sortKey="title" currentSort={sortConfig} onSort={handleSort} />
                            <th className="px-6 py-3">SLA / Prazos</th>
                            <SortableHeader label="Técnico" sortKey="technician" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Estado" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.length > 0 ? tickets.map((ticket) => {
                            const associatedEquipment = ticket.equipmentId ? equipmentMap.get(ticket.equipmentId) : null;
                            const categoryObj = ticket.category ? categoryMap.get(ticket.category) : undefined;
                            const sla = getSLATimer(ticket, categoryObj);
                            const nis2Countdown = getNis2Countdown(ticket);
                            
                            // Check for security context
                            const catLower = (ticket.category || '').toLowerCase();
                            const isRealSecurity = catLower.includes('segurança') || 
                                                   catLower.includes('security') ||
                                                   !!ticket.securityIncidentType;
                            
                            const requesterName = ticket.requester_supplier_id 
                                ? supplierMap.get(ticket.requester_supplier_id) 
                                : (collaboratorMap.get(ticket.collaboratorId) || 'N/A');
                            const isSupplierRequester = !!ticket.requester_supplier_id;
                            
                            const teamName = ticket.team_id ? teamMap.get(ticket.team_id) : 'Geral';

                            return(
                            <tr 
                                key={ticket.id} 
                                className={`border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer ${isRealSecurity ? 'bg-red-900/10' : 'bg-surface-dark'}`}
                                onClick={() => onOpenActivities && onOpenActivities(ticket)}
                            >
                                <td className="px-6 py-4">
                                    <div>{entidadeMap.get(ticket.entidadeId || '') || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 bg-gray-800 border border-gray-600 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap">
                                        <FaUsers className="text-brand-secondary"/> {teamName}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {isRealSecurity && getSecurityIcon(ticket.securityIncidentType)}
                                        <span className={isRealSecurity ? 'text-red-300 font-medium' : ''}>
                                            {ticket.category || TicketCategory.TechnicalFault}
                                        </span>
                                    </div>
                                    {isRealSecurity && ticket.securityIncidentType && (
                                         <div className="mt-1"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-900/50 text-red-200 border border-red-700/50">{ticket.securityIncidentType}</span></div>
                                    )}
                                    {isRealSecurity && ticket.impactCriticality && (
                                        <div className="text-xs mt-1 text-gray-400">Impacto: <span className="text-white font-bold">{ticket.impactCriticality}</span></div>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-medium text-on-surface-dark max-w-xs" title={ticket.description}>
                                    <div className="font-bold mb-1 text-white">
                                        {ticket.attachments && ticket.attachments.length > 0 && <FaPaperclip className="inline mr-2 text-on-surface-dark-secondary" />}
                                        {ticket.title || '(Sem Assunto)'}
                                    </div>
                                    <div className="text-xs text-gray-300 mb-1 flex items-center gap-1">
                                        {isSupplierRequester ? <FaTruck className="text-yellow-500"/> : null}
                                        Solicitante: {requesterName}
                                    </div>
                                    <div className="text-on-surface-dark-secondary truncate text-xs">{ticket.description}</div>
                                    {associatedEquipment && (
                                        <div className="text-xs text-indigo-400 mt-1 truncate">Equip: {associatedEquipment.description} ({associatedEquipment.serialNumber})</div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">{new Date(ticket.requestDate).toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-2">
                                        {nis2Countdown && (<div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border ${nis2Countdown.className}`}><FaLandmark className="h-3 w-3"/>{nis2Countdown.text}</div>)}
                                        {sla ? (<div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border ${sla.className}`}>{sla.icon}<div className="flex flex-col"><span className="font-bold">{sla.label}</span><span>{sla.text}</span></div></div>) : (!nis2Countdown && <span className="text-gray-500 text-xs">Sem SLA</span>)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{ticket.technicianId ? collaboratorMap.get(ticket.technicianId) : '—'}</td>
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                     <select
                                        value={ticket.status}
                                        onChange={(e) => handleStatusChange(ticket, e.target.value as TicketStatus)}
                                        className={`px-2 py-1 rounded-md text-xs border bg-transparent ${getStatusClass(ticket.status)} focus:outline-none focus:ring-2 focus:ring-brand-secondary disabled:cursor-not-allowed disabled:opacity-70`}
                                        disabled={!onUpdateTicket}
                                    >
                                        {Object.values(TicketStatus).map(s => <option key={s} value={s} className="bg-gray-800 text-white">{s}</option>)}
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center items-center gap-4">
                                        {isRealSecurity && onGenerateSecurityReport && (
                                             <button onClick={(e) => { e.stopPropagation(); onGenerateSecurityReport(ticket); }} className="text-red-400 hover:text-red-300" title="Relatório NIS2"><FaFileContract className="h-5 w-5"/></button>
                                        )}
                                        {onOpenActivities && (
                                            <button onClick={(e) => { e.stopPropagation(); onOpenActivities(ticket); }} className="text-teal-400 hover:text-teal-300" title="Atividades"><FaTasks className="h-5 w-5"/></button>
                                        )}
                                        {onEdit && (
                                            <button onClick={(e) => { e.stopPropagation(); onEdit(ticket); }} className="text-blue-400 hover:text-blue-300"><EditIcon /></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}) : (
                            <tr><td colSpan={8} className="text-center py-8 text-on-surface-dark-secondary">Nenhum ticket encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
                )}
            </div>
            <Pagination
                currentPage={page || 1}
                totalPages={Math.ceil((totalItems || 0) / (pageSize || 20))}
                onPageChange={(p) => onPageChange && onPageChange(p)}
                itemsPerPage={pageSize || 20}
                onItemsPerPageChange={(s) => onPageSizeChange && onPageSizeChange(s)}
                totalItems={totalItems || 0}
            />
        </div>
    );
};

export default TicketDashboard;
