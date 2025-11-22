




import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, Entidade, Collaborator, TicketStatus, Team, Equipment, EquipmentType, TicketCategory, TicketCategoryItem, SecurityIncidentType } from '../types';
import { EditIcon, FaTasks, FaShieldAlt, FaClock, FaExclamationTriangle, FaSkull, FaUserSecret, FaBug, FaNetworkWired, FaLock, FaFileContract, PlusIcon } from './common/Icons';
import { FaPaperclip } from 'react-icons/fa';
import Pagination from './common/Pagination';

interface TicketDashboardProps {
  tickets: Ticket[];
  escolasDepartamentos: Entidade[];
  collaborators: Collaborator[];
  teams: Team[];
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
  onCreate?: () => void; // Added onCreate prop
}

const getStatusClass = (status: TicketStatus) => {
    switch (status) {
        case TicketStatus.Requested: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case TicketStatus.InProgress: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case TicketStatus.Finished: return 'bg-green-500/20 text-green-400 border-green-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

// Helper to calculate deadlines based on Category SLA
const getSLATimer = (ticket: Ticket, category?: TicketCategoryItem) => {
    if (ticket.status === TicketStatus.Finished) {
        return null;
    }
    
    // If no custom SLA is defined, default to 0 (no timer) or special logic for Security Incident Enum fallback
    let warningLimit = category?.sla_warning_hours || 0;
    let criticalLimit = category?.sla_critical_hours || 0;

    // Fallback for hardcoded legacy 'Incidente de Segurança' if not in DB yet
    if (warningLimit === 0 && criticalLimit === 0 && (ticket.category === 'Incidente de Segurança' || ticket.category === TicketCategory.SecurityIncident)) {
        warningLimit = 24;
        criticalLimit = 72;
    }

    if (warningLimit === 0 && criticalLimit === 0) return null;

    const requestDate = new Date(ticket.requestDate);
    const now = new Date();
    const elapsedHours = (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60);

    // Warning Zone
    if (warningLimit > 0 && elapsedHours < warningLimit) {
        const hoursLeft = Math.ceil(warningLimit - elapsedHours);
        return {
            label: 'Alerta',
            text: `${hoursLeft}h restantes`,
            className: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
            icon: <FaClock className="animate-pulse" />
        };
    }
    // Critical Zone
    if (criticalLimit > 0 && elapsedHours < criticalLimit) {
        const hoursLeft = Math.ceil(criticalLimit - elapsedHours);
        return {
            label: 'Prazo Final',
            text: `${hoursLeft}h restantes`,
            className: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
            icon: <FaExclamationTriangle />
        };
    }
    
    // Overdue
    if (criticalLimit > 0) {
        return {
            label: 'SLA Excedido',
            text: `+${Math.floor(elapsedHours - criticalLimit)}h atraso`,
            className: 'text-red-500 border-red-500/50 bg-red-500/20 font-bold',
            icon: <FaShieldAlt />
        };
    }

    return null;
};

// Helper to get icon for security incident type (Flexible matching for dynamic DB strings)
const getSecurityIcon = (type?: string) => {
    if (!type) return <FaShieldAlt className="text-red-500" />;
    
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('ransomware')) return <FaSkull className="text-red-500" title="Ransomware" />;
    if (lowerType.includes('phishing') || lowerType.includes('engenharia')) return <FaUserSecret className="text-orange-500" title="Phishing" />;
    if (lowerType.includes('malware') || lowerType.includes('vírus') || lowerType.includes('virus')) return <FaBug className="text-yellow-500" title="Malware" />;
    if (lowerType.includes('ddos') || lowerType.includes('negação')) return <FaNetworkWired className="text-purple-500" title="DDoS" />;
    if (lowerType.includes('fuga') || lowerType.includes('leak')) return <FaLock className="text-red-400" title="Fuga de Dados" />;
    
    return <FaShieldAlt className="text-red-500" />;
};


const TicketDashboard: React.FC<TicketDashboardProps> = ({ tickets, escolasDepartamentos: entidades, collaborators, teams, equipment, onUpdateTicket, onEdit, onOpenCloseTicketModal, initialFilter, onClearInitialFilter, onGenerateReport, onOpenActivities, onGenerateSecurityReport, categories, onCreate }) => {
    
    const [filters, setFilters] = useState<{ status: string | string[], team_id: string, category: string }>({ status: '', team_id: '', category: '' });
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
    const equipmentMap = useMemo(() => new Map(equipment.map(e => [e.id, e])), [equipment]);
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.name, c])), [categories]);
    
    // Fallback if categories empty
    const displayCategories = categories.length > 0 ? categories.map(c => c.name) : Object.values(TicketCategory);

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
            const teamMatch = !filters.team_id || ticket.team_id === filters.team_id;
            const categoryMatch = !filters.category || ticket.category === filters.category;
            const statusMatch = (() => {
                if (!filters.status || (Array.isArray(filters.status) && filters.status.length === 0)) return true;
                if (Array.isArray(filters.status)) {
                    return filters.status.includes(ticket.status);
                }
                return ticket.status === filters.status;
            })();

            return teamMatch && statusMatch && categoryMatch;
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
                <div>
                    <h2 className="text-xl font-semibold text-white">Gerenciar Tickets de Suporte</h2>
                    <p className="text-sm text-on-surface-dark-secondary mt-1">
                        <button onClick={onGenerateReport} className="hover:text-white hover:underline">
                            Ver Relatório Geral & Análise IA
                        </button>
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Create Button added here */}
                    {onCreate && (
                        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors mr-2">
                            <PlusIcon /> Abrir Ticket
                        </button>
                    )}
                    
                    <select
                        id="categoryFilter"
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                        className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                     >
                        <option value="">Todas as Categorias</option>
                        {displayCategories.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                     <select
                        id="team_idFilter"
                        name="team_id"
                        value={filters.team_id}
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
                            <th scope="col" className="px-6 py-3">Categoria</th>
                            <th scope="col" className="px-6 py-3">Assunto / Descrição</th>
                            <th scope="col" className="px-6 py-3">SLA / Prazos</th>
                            <th scope="col" className="px-6 py-3">Técnico</th>
                            <th scope="col" className="px-6 py-3">Estado</th>
                            <th scope="col" className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTickets.length > 0 ? paginatedTickets.map((ticket) => {
                            const associatedEquipment = ticket.equipmentId ? equipmentMap.get(ticket.equipmentId) : null;
                            const categoryObj = ticket.category ? categoryMap.get(ticket.category) : undefined;
                            const sla = getSLATimer(ticket, categoryObj);
                            const isSecurity = ticket.category === TicketCategory.SecurityIncident || ticket.category === 'Incidente de Segurança' || (categoryObj && (categoryObj.sla_warning_hours > 0 || categoryObj.sla_critical_hours > 0));
                            const isRealSecurity = ticket.category === TicketCategory.SecurityIncident || ticket.category === 'Incidente de Segurança';

                            return(
                            <tr key={ticket.id} className={`border-b border-gray-700 hover:bg-gray-800/50 ${isRealSecurity ? 'bg-red-900/10' : 'bg-surface-dark'}`}>
                                <td className="px-6 py-4">
                                    <div>{entidadeMap.get(ticket.entidadeId) || 'N/A'}</div>
                                    {ticket.team_id && <div className="text-xs text-brand-secondary mt-1">{teamMap.get(ticket.team_id)}</div>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {isRealSecurity && getSecurityIcon(ticket.securityIncidentType)}
                                        <span className={isRealSecurity ? 'text-red-300 font-medium' : ''}>
                                            {ticket.category || TicketCategory.TechnicalFault}
                                        </span>
                                    </div>
                                    {isRealSecurity && ticket.securityIncidentType && (
                                         <div className="mt-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-900/50 text-red-200 border border-red-700/50">
                                                {ticket.securityIncidentType}
                                            </span>
                                        </div>
                                    )}
                                    {isRealSecurity && ticket.impactCriticality && (
                                        <div className="text-xs mt-1 text-gray-400">Impacto: <span className="text-white font-bold">{ticket.impactCriticality}</span></div>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-medium text-on-surface-dark max-w-xs" title={ticket.description}>
                                    <div className="font-bold mb-1 text-white">
                                        {ticket.attachments && ticket.attachments.length > 0 && <FaPaperclip className="inline mr-2 text-on-surface-dark-secondary" title={`${ticket.attachments.length} anexo(s)`} />}
                                        {ticket.title || '(Sem Assunto)'}
                                    </div>
                                    <div className="text-on-surface-dark-secondary truncate text-xs">
                                        {ticket.description}
                                    </div>
                                    {associatedEquipment && (
                                        <div className="text-xs text-indigo-400 mt-1 truncate">
                                            Equip: {associatedEquipment.description} (S/N: {associatedEquipment.serialNumber})
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">{new Date(ticket.requestDate).toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {sla ? (
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border ${sla.className}`}>
                                            {sla.icon}
                                            <div className="flex flex-col">
                                                <span className="font-bold">{sla.label}</span>
                                                <span>{sla.text}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 text-xs">Sem SLA definido</span>
                                    )}
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
                                        {isRealSecurity && onGenerateSecurityReport && (
                                             <button
                                                onClick={() => onGenerateSecurityReport(ticket)}
                                                className="text-red-400 hover:text-red-300"
                                                title="Relatório de Notificação Oficial (NIS2)"
                                            >
                                                <FaFileContract className="h-5 w-5"/>
                                            </button>
                                        )}
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
                        )}) : (
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