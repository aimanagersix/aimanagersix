import React, { useState, useMemo } from 'react';
import { Collaborator, Entidade, Equipment, Assignment, CollaboratorStatus, Ticket, TicketActivity, TeamMember, CollaboratorHistory, Message, TooltipConfig, defaultTooltipConfig, UserRole } from '../types';
import { EditIcon, DeleteIcon, CheckIcon, XIcon, ReportIcon, FaComment, SearchIcon, PlusIcon } from './common/Icons';
import { FaHistory, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Pagination from './common/Pagination';

interface CollaboratorDashboardProps {
  collaborators: Collaborator[];
  escolasDepartamentos: Entidade[];
  equipment: Equipment[];
  assignments: Assignment[];
  tickets: Ticket[];
  ticketActivities: TicketActivity[];
  teamMembers: TeamMember[];
  collaboratorHistory: CollaboratorHistory[];
  messages: Message[];
  currentUser: Collaborator | null;
  onEdit?: (collaborator: Collaborator) => void;
  onDelete?: (id: string) => void;
  onShowHistory?: (collaborator: Collaborator) => void;
  onShowDetails?: (collaborator: Collaborator) => void;
  onGenerateReport?: () => void;
  onStartChat?: (collaborator: Collaborator) => void;
  onToggleStatus?: (id: string) => void;
  onCreate?: () => void;
  tooltipConfig?: TooltipConfig;
}

interface TooltipState {
    visible: boolean;
    content: React.ReactNode;
    x: number;
    y: number;
}

const getStatusClass = (status: CollaboratorStatus) => {
    switch (status) {
        case CollaboratorStatus.Ativo:
            return 'bg-green-500/20 text-green-400';
        case CollaboratorStatus.Inativo:
            return 'bg-red-500/20 text-red-400';
        default:
            return 'bg-gray-500/20 text-gray-400';
    }
};

const CollaboratorDashboard: React.FC<CollaboratorDashboardProps> = ({ 
    collaborators, 
    escolasDepartamentos: entidades, 
    onEdit, 
    onDelete, 
    onShowHistory, 
    onShowDetails, 
    equipment, 
    assignments, 
    tickets, 
    ticketActivities, 
    teamMembers, 
    collaboratorHistory,
    messages,
    onGenerateReport, 
    onStartChat, 
    currentUser, 
    onToggleStatus,
    onCreate,
    tooltipConfig = defaultTooltipConfig
}) => {
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ entidadeId: '', status: '', role: '' });
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const entidadeMap = React.useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);

    const equipmentMap = useMemo(() => new Map(equipment.map(e => [e.id, `${e.description} (SN: ${e.serialNumber})`])), [equipment]);

    const equipmentByCollaborator = useMemo(() => {
        const map = new Map<string, string[]>();
        const activeAssignments = assignments.filter(a => !a.returnDate);
        for (const assignment of activeAssignments) {
            const collaboratorId = assignment.collaboratorId;
            const equipmentDetails = equipmentMap.get(assignment.equipmentId);
            if (collaboratorId && equipmentDetails) {
                if (!map.has(collaboratorId)) {
                    map.set(collaboratorId, []);
                }
                map.get(collaboratorId)!.push(equipmentDetails);
            }
        }
        return map;
    }, [assignments, equipmentMap]);

    // Calculate dependencies for deletion logic
    const dependencyMap = useMemo(() => {
        const map = new Map<string, string[]>();
        
        const addDependency = (id: string, reason: string) => {
             if (!map.has(id)) map.set(id, []);
             if (!map.get(id)!.includes(reason)) map.get(id)!.push(reason);
        };

        // Check Assignments (All history, not just active)
        assignments.forEach(a => {
            if (a.collaboratorId) addDependency(a.collaboratorId, 'Atribuições de Equipamento');
        });

        // Check Tickets (Requester or Technician)
        tickets.forEach(t => {
            if (t.collaboratorId) addDependency(t.collaboratorId, 'Tickets (Requerente)');
            if (t.technicianId) addDependency(t.technicianId, 'Tickets (Técnico)');
        });

        // Check Activities
        ticketActivities.forEach(ta => {
            if (ta.technicianId) addDependency(ta.technicianId, 'Atividades de Suporte');
        });

        // Check Teams
        teamMembers.forEach(tm => {
            if (tm.collaborator_id) addDependency(tm.collaborator_id, 'Membro de Equipa');
        });

        // Check Collaborator History
        collaboratorHistory.forEach(ch => {
            if (ch.collaboratorId) addDependency(ch.collaboratorId, 'Histórico Funcional');
        });
        
        // Check Messages
        messages.forEach(m => {
            if (m.senderId) addDependency(m.senderId, 'Mensagens');
            if (m.receiverId) addDependency(m.receiverId, 'Mensagens');
        });

        return map;

    }, [assignments, tickets, ticketActivities, teamMembers, collaboratorHistory, messages]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilters({ entidadeId: '', status: '', role: '' });
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };

    const filteredCollaborators = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return collaborators.filter(col => {
            const searchMatch = query === '' ||
                col.fullName.toLowerCase().includes(query) ||
                col.email.toLowerCase().includes(query) ||
                col.numeroMecanografico.toLowerCase().includes(query);

            const entidadeMatch = filters.entidadeId === '' || col.entidadeId === filters.entidadeId;
            const statusMatch = filters.status === '' || col.status === filters.status;
            const roleMatch = filters.role === '' || col.role === filters.role;
            
            return searchMatch && entidadeMatch && statusMatch && roleMatch;
        }).sort((a,b) => a.fullName.localeCompare(b.fullName));
    }, [collaborators, filters, searchQuery]);
    
    const totalPages = Math.ceil(filteredCollaborators.length / itemsPerPage);
    const paginatedCollaborators = useMemo(() => {
        return filteredCollaborators.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredCollaborators, currentPage, itemsPerPage]);

    const handleMouseOver = (col: Collaborator, event: React.MouseEvent) => {
        const assignedEquipment = equipmentByCollaborator.get(col.id) || [];
        const cfg = tooltipConfig || defaultTooltipConfig;
        
        const content = (
            <div className="text-xs leading-tight space-y-1">
                {cfg.showCollabName && <p className="font-bold text-white">{col.fullName}</p>}
                {cfg.showCollabJob && <p><strong className="text-gray-400">Função:</strong> <span className="text-white">{col.role}</span></p>}
                {cfg.showCollabEntity && <p><strong className="text-gray-400">Entidade:</strong> <span className="text-white">{entidadeMap.get(col.entidadeId) || 'N/A'}</span></p>}
                {cfg.showCollabContact && (
                    <div>
                        <p><strong className="text-gray-400">Email:</strong> <span className="text-white">{col.email}</span></p>
                        {col.telemovel && <p><strong className="text-gray-400">Móvel:</strong> <span className="text-white">{col.telemovel}</span></p>}
                    </div>
                )}
                
                {assignedEquipment.length > 0 && (
                    <div className="mt-2 border-t border-gray-600 pt-1">
                        <p className="font-bold text-brand-secondary mb-1">Equipamentos ({assignedEquipment.length}):</p>
                        <ul className="list-disc list-inside space-y-0.5 max-h-20 overflow-hidden text-gray-300">
                            {assignedEquipment.slice(0, 3).map((eq, index) => <li key={index} className="truncate">{eq}</li>)}
                            {assignedEquipment.length > 3 && <li>... mais {assignedEquipment.length - 3}</li>}
                        </ul>
                    </div>
                )}
            </div>
        );

        setTooltip({
            visible: true,
            content: content,
            x: event.clientX,
            y: event.clientY,
        });
    };

    const handleMouseMove = (event: React.MouseEvent) => {
        if (tooltip?.visible) {
            setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
        }
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

  return (
    <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h2 className="text-xl font-semibold text-white">Gerenciar Colaboradores</h2>
             <div className="flex items-center gap-2">
                {onGenerateReport && (
                    <button
                        onClick={onGenerateReport}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-brand-secondary text-white rounded-md hover:bg-brand-primary transition-colors"
                    >
                        <ReportIcon />
                        Gerar Relatório
                    </button>
                )}
                {onCreate && (
                    <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors">
                        <PlusIcon /> Adicionar
                    </button>
                )}
            </div>
        </div>

        <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label htmlFor="searchQuery" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Procurar Colaborador</label>
                    <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="searchQuery"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Nome, email, nº mecanográfico..."
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 pl-10 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="entidadeFilter" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Filtrar por Entidade</label>
                    <select
                        id="entidadeFilter"
                        name="entidadeId"
                        value={filters.entidadeId}
                        onChange={handleFilterChange}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                    >
                        <option value="">Todas as Entidades</option>
                        {entidades.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="roleFilter" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Filtrar por Perfil</label>
                    <select
                        id="roleFilter"
                        name="role"
                        value={filters.role}
                        onChange={handleFilterChange}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                    >
                        <option value="">Todos os Perfis</option>
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="statusFilter" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Filtrar por Status</label>
                    <select
                        id="statusFilter"
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                    >
                        <option value="">Todos</option>
                        {Object.values(CollaboratorStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end">
                <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                >
                    Limpar Filtros
                </button>
            </div>
        </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
          <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Nº Mec.</th>
              <th scope="col" className="px-6 py-3">Nome Completo / Equipamentos</th>
              <th scope="col" className="px-6 py-3">Contactos</th>
              <th scope="col" className="px-6 py-3">Entidade</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Perfil</th>
              <th scope="col" className="px-6 py-3 text-center">Acesso</th>
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCollaborators.length > 0 ? paginatedCollaborators.map((col) => {
                 const assignedEquipment = equipmentByCollaborator.get(col.id) || [];
                 const equipmentCount = assignedEquipment.length;
                 const dependencies = dependencyMap.get(col.id) || [];
                 const isDeleteDisabled = dependencies.length > 0;
                 
                 let deleteTooltip = `Excluir ${col.fullName}`;
                 if (isDeleteDisabled) {
                     const uniqueDependencies = Array.from(new Set(dependencies));
                     // Limit displayed reasons to avoid huge tooltips
                     const displayedReasons = uniqueDependencies.slice(0, 3);
                     if (uniqueDependencies.length > 3) {
                         displayedReasons.push('...');
                     }
                     deleteTooltip = `Impossível excluir: Associado a ${displayedReasons.join(", ")}`;
                 }


                return (
              <tr 
                key={col.id} 
                className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer"
                onMouseOver={(e) => handleMouseOver(col, e)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => onShowDetails ? onShowDetails(col) : (onEdit && onEdit(col))}
              >
                <td className="px-6 py-4">{col.numeroMecanografico}</td>
                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {col.photoUrl ? (
                        <img src={col.photoUrl} alt={col.fullName} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white flex-shrink-0">{col.fullName.charAt(0)}</div>
                    )}
                    <div>
                        <span>{col.fullName}</span>
                        {equipmentCount > 0 && (
                            <div className="text-xs text-brand-secondary mt-1">
                                {equipmentCount} equipamento(s) atribuído(s)
                            </div>
                        )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                    <div>{col.email}</div>
                    {col.telefoneInterno && <div className="text-xs text-on-surface-dark-secondary">Interno: {col.telefoneInterno}</div>}
                    {col.telemovel && <div className="text-xs text-on-surface-dark-secondary">Móvel: {col.telemovel}</div>}
                </td>
                <td className="px-6 py-4">{entidadeMap.get(col.entidadeId) || 'N/A'}</td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(col.status)}`}>
                        {col.status}
                    </span>
                </td>
                <td className="px-6 py-4">{col.role}</td>
                <td className="px-6 py-4 text-center">
                    {col.canLogin ? (
                        <span className="inline-flex items-center justify-center p-1.5 bg-green-500/20 rounded-full" title="Acesso permitido">
                            <CheckIcon className="h-4 w-4 text-green-400" />
                        </span>
                    ) : (
                        <span className="inline-flex items-center justify-center p-1.5 bg-red-500/20 rounded-full" title="Acesso negado">
                            <XIcon className="h-4 w-4 text-red-400" />
                        </span>
                    )}
                </td>
                <td className="px-6 py-4 text-center">
                     <div className="flex justify-center items-center gap-4">
                        {onToggleStatus && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleStatus(col.id); }}
                                className={`text-xl ${col.status === CollaboratorStatus.Ativo ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
                                title={col.status === CollaboratorStatus.Ativo ? 'Inativar' : 'Ativar'}
                            >
                                {col.status === CollaboratorStatus.Ativo ? <FaToggleOn /> : <FaToggleOff />}
                            </button>
                        )}
                        {onStartChat && currentUser && currentUser.id !== col.id && (
                             <button onClick={(e) => { e.stopPropagation(); onStartChat(col); }} className="text-gray-400 hover:text-white" aria-label={`Mensagem para ${col.fullName}`}>
                                <FaComment className="h-5 w-5"/>
                            </button>
                        )}
                        {onShowDetails && ( 
                            <button onClick={(e) => { e.stopPropagation(); onShowDetails(col); }} className="text-teal-400 hover:text-teal-300" aria-label={`Ficha de ${col.fullName}`}>
                                <ReportIcon className="h-5 w-5"/>
                            </button>
                        )}
                        {onEdit && (
                            <button onClick={(e) => { e.stopPropagation(); onEdit(col); }} className="text-blue-400 hover:text-blue-300" aria-label={`Edit ${col.fullName}`}>
                                <EditIcon />
                            </button>
                        )}
                        {onDelete && (
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (!isDeleteDisabled) onDelete(col.id); 
                                }} 
                                className={isDeleteDisabled ? "text-gray-600 opacity-30 cursor-not-allowed" : "text-red-400 hover:text-red-300"}
                                disabled={isDeleteDisabled}
                                title={deleteTooltip}
                                aria-label={deleteTooltip}
                            >
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                </td>
              </tr>
            )
            }) : (
                <tr>
                    <td colSpan={8} className="text-center py-8 text-on-surface-dark-secondary">Nenhum colaborador encontrado com os filtros atuais.</td>
                </tr>
            )}
          </tbody>
        </table>
        {tooltip?.visible && (
            <div
                style={{
                    position: 'fixed',
                    top: tooltip.y + 15,
                    left: tooltip.x + 15,
                    pointerEvents: 'none',
                }}
                className="bg-gray-900 text-white text-sm rounded-md shadow-lg p-3 z-50 border border-gray-700 max-w-sm"
                role="tooltip"
            >
                {tooltip.content}
            </div>
        )}
      </div>
       <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={filteredCollaborators.length}
        />
    </div>
  );
};

export default CollaboratorDashboard;