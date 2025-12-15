
import React, { useState, useMemo, useEffect } from 'react';
import { Collaborator, Entidade, Equipment, Assignment, CollaboratorStatus, Ticket, TicketActivity, TeamMember, CollaboratorHistory, Message, TooltipConfig, defaultTooltipConfig, UserRole, Instituicao, ConfigItem } from '../types';
import { EditIcon, FaTrash as DeleteIcon, CheckIcon, XIcon, ReportIcon, FaComment, SearchIcon, PlusIcon } from './common/Icons';
import { FaHistory, FaToggleOn, FaToggleOff, FaPlaneArrival, FaPhone, FaEnvelope, FaIdCard } from 'react-icons/fa';
import Pagination from './common/Pagination';

interface CollaboratorDashboardProps {
  collaborators: Collaborator[];
  escolasDepartamentos: Entidade[];
  instituicoes: Instituicao[]; 
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
  onToggleStatus?: (collaborator: Collaborator) => void;
  onCreate?: () => void;
  tooltipConfig?: TooltipConfig;
  onAssignEquipment?: (collaboratorId: string, equipmentId: string) => Promise<void>;
  onUnassignEquipment?: (equipmentId: string) => Promise<void>;
  deactivationReasons?: ConfigItem[];
  jobTitles?: ConfigItem[];

  // Server-Side Pagination Props
  totalItems?: number;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onFilterChange?: (filter: any) => void;
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
            return 'bg-green-500/20 text-green-400 border border-green-500/30';
        case CollaboratorStatus.Inativo:
            return 'bg-red-500/20 text-red-400 border border-red-500/30';
        case CollaboratorStatus.Onboarding:
            return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
        default:
            return 'bg-gray-500/20 text-gray-400';
    }
};

const PROTECTED_EMAIL = 'josefsmoreira@outlook.com';

const CollaboratorDashboard: React.FC<CollaboratorDashboardProps> = ({ 
    collaborators, 
    escolasDepartamentos: entidades, 
    instituicoes,
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
    tooltipConfig = defaultTooltipConfig,
    onAssignEquipment,
    onUnassignEquipment,
    deactivationReasons,
    jobTitles = [],
    totalItems = 0, loading = false, page = 1, pageSize = 20, onPageChange, onPageSizeChange, onFilterChange
}) => {
    
    // Local filter state to sync with inputs
    const [filters, setFilters] = useState({ query: '', entidadeId: '', status: '', role: '' });
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    
    const entidadeMap = React.useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const instituicaoMap = React.useMemo(() => new Map(instituicoes.map(i => [i.id, i.name])), [instituicoes]);
    const equipmentMap = useMemo(() => new Map(equipment.map(e => [e.id, `${e.description} (SN: ${e.serialNumber})`])), [equipment]);
    const jobTitleMap = useMemo(() => new Map(jobTitles.map(j => [j.id, j.name])), [jobTitles]);

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

    const dependencyMap = useMemo(() => {
        const map = new Map<string, string[]>();
        const addDependency = (id: string, reason: string) => {
             if (!map.has(id)) map.set(id, []);
             if (!map.get(id)!.includes(reason)) map.get(id)!.push(reason);
        };
        assignments.forEach(a => { if (a.collaboratorId) addDependency(a.collaboratorId, 'Atribuições'); });
        tickets.forEach(t => { if (t.collaboratorId) addDependency(t.collaboratorId, 'Tickets'); if (t.technicianId) addDependency(t.technicianId, 'Tickets'); });
        return map;
    }, [assignments, tickets]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        
        if (onFilterChange) onFilterChange(newFilters);
        if (onPageChange) onPageChange(1);
    };

    const clearFilters = () => {
        const blank = { query: '', entidadeId: '', status: '', role: '' };
        setFilters(blank);
        if (onFilterChange) onFilterChange(blank);
        if (onPageChange) onPageChange(1);
    };

    const handleMouseOver = (col: Collaborator, event: React.MouseEvent) => {
        if (window.innerWidth < 768) return; // Disable tooltip on mobile
        const assignedEquipment = equipmentByCollaborator.get(col.id) || [];
        const cfg = { ...defaultTooltipConfig, ...tooltipConfig };
        const entityName = col.entidadeId ? entidadeMap.get(col.entidadeId) : col.instituicaoId ? instituicaoMap.get(col.instituicaoId) : 'Global / N/A';
        const displayJob = col.job_title_name || (col.job_title_id ? jobTitleMap.get(col.job_title_id) : col.role);

        const content = (
            <div className="text-xs leading-tight space-y-1">
                {cfg.showCollabName && <p className="font-bold text-white">{col.fullName}</p>}
                {cfg.showCollabJob && <p><strong className="text-gray-400">Função:</strong> <span className="text-white">{displayJob}</span></p>}
                {cfg.showCollabEntity && <p><strong className="text-gray-400">Associação:</strong> <span className="text-white">{entityName}</span></p>}
                {cfg.showCollabContact && (
                    <div>
                        <p><strong className="text-gray-400">Email:</strong> <span className="text-white">{col.email}</span></p>
                        {col.telemovel && <p><strong className="text-gray-400">Móvel:</strong> <span className="text-white">{col.telemovel}</span></p>}
                    </div>
                )}
                {assignedEquipment.length > 0 && (
                    <div className="mt-2 border-t border-gray-700 pt-1">
                        <p className="font-bold text-brand-secondary mb-1">Equipamentos ({assignedEquipment.length}):</p>
                        <ul className="list-disc list-inside space-y-0.5 max-h-20 overflow-hidden text-gray-300">
                            {assignedEquipment.slice(0, 3).map((eq, index) => <li key={index} className="truncate">{eq}</li>)}
                            {assignedEquipment.length > 3 && <li>... mais {assignedEquipment.length - 3}</li>}
                        </ul>
                    </div>
                )}
            </div>
        );
        setTooltip({ visible: true, content: content, x: event.clientX, y: event.clientY });
    };

    const handleMouseMove = (event: React.MouseEvent) => {
        if (tooltip?.visible) setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
    };

    const handleMouseLeave = () => setTooltip(null);
    
    const getAssociationText = (col: Collaborator) => {
        if (col.entidadeId) return entidadeMap.get(col.entidadeId) || 'Entidade N/A';
        if (col.instituicaoId) return `${instituicaoMap.get(col.instituicaoId)} (Instituição)`;
        if (col.role === UserRole.SuperAdmin) return 'Acesso Global';
        return 'Sem Associação';
    };

  return (
    <div className="bg-surface-dark p-4 md:p-6 rounded-lg shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-semibold text-white">Gestão de Colaboradores</h2>
             <div className="flex items-center gap-2 w-full sm:w-auto">
                {onGenerateReport && (
                    <button onClick={onGenerateReport} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm bg-brand-secondary text-white rounded-md hover:bg-brand-primary transition-colors">
                        <ReportIcon className="w-4 h-4" /> <span className="hidden sm:inline">Relatório</span>
                    </button>
                )}
                {onCreate && (
                    <button onClick={onCreate} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors">
                        <PlusIcon className="w-4 h-4" /> Adicionar
                    </button>
                )}
            </div>
        </div>

        {/* Filters - Mobile Optimized */}
        <div className="space-y-4 mb-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Pesquisar</label>
                    <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <SearchIcon className="h-4 w-4 text-gray-500" />
                        </div>
                        <input
                            type="text"
                            name="query"
                            value={filters.query}
                            onChange={handleFilterChange}
                            placeholder="Nome, email, mec..."
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 pl-9 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Entidade</label>
                    <select
                        name="entidadeId"
                        value={filters.entidadeId}
                        onChange={handleFilterChange}
                        className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm"
                    >
                        <option value="">Todas</option>
                        {entidades.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Perfil</label>
                        <select
                            name="role"
                            value={filters.role}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm"
                        >
                            <option value="">Todos</option>
                            {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                         <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm"
                        >
                            <option value="">Todos</option>
                            {Object.values(CollaboratorStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex items-end">
                    <button onClick={clearFilters} className="w-full px-4 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors border border-gray-600">
                        Limpar
                    </button>
                </div>
            </div>
        </div>
      
      {loading ? (
             <div className="flex justify-center items-center h-64 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-secondary"></div>
                    <span className="text-sm">A carregar colaboradores...</span>
                </div>
             </div>
      ) : (
        <>
        {/* MOBILE VIEW (CARDS) */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
            {collaborators.length > 0 ? collaborators.map((col) => {
                const equipmentCount = (equipmentByCollaborator.get(col.id) || []).length;
                const dependencies = dependencyMap.get(col.id) || [];
                const isSuperAdmin = col.role === UserRole.SuperAdmin;
                const isProtectedUser = col.email === PROTECTED_EMAIL;
                const isDeleteDisabled = dependencies.length > 0 || isSuperAdmin || currentUser?.id === col.id || isProtectedUser;
                const resolvedJobTitle = col.job_title_name || (col.job_title_id ? jobTitleMap.get(col.job_title_id) : null);

                return (
                    <div key={col.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-md flex flex-col gap-3">
                        {/* Header: Photo + Name + Status */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {col.photoUrl ? (
                                    <img src={col.photoUrl} alt={col.fullName} className="h-10 w-10 rounded-full object-cover border border-gray-600 flex-shrink-0" />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-sm flex-shrink-0">{col.fullName.charAt(0)}</div>
                                )}
                                <div className="min-w-0">
                                    <h3 className="font-bold text-white text-base truncate">{col.fullName}</h3>
                                    <p className="text-xs text-brand-secondary truncate">{resolvedJobTitle || col.role}</p>
                                </div>
                            </div>
                            <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] rounded-full font-bold uppercase ${getStatusClass(col.status)}`}>
                                {col.status === 'Ativo' ? 'ATV' : col.status === 'Inativo' ? 'INA' : 'ONB'}
                            </span>
                        </div>
                        
                        {/* Details Block */}
                        <div className="text-xs text-gray-300 bg-gray-900/40 p-2 rounded border border-gray-700/50 space-y-1.5">
                            <div className="flex items-center gap-2 truncate">
                                <FaEnvelope className="text-gray-500 w-3"/> <span className="truncate">{col.email}</span>
                            </div>
                            {(col.telemovel || col.telefoneInterno) && (
                                <div className="flex items-center gap-2">
                                    <FaPhone className="text-gray-500 w-3"/> <span>{col.telemovel || col.telefoneInterno}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 truncate">
                                <span className="text-gray-500 w-3 text-center">•</span> {getAssociationText(col)}
                            </div>
                            {equipmentCount > 0 && (
                                <div className="pt-1 border-t border-gray-700/50 text-blue-300 font-medium">
                                    {equipmentCount} equipamentos atribuídos
                                </div>
                            )}
                        </div>

                        {/* Actions Grid */}
                        <div className="grid grid-cols-4 gap-2 pt-1">
                            <button 
                                onClick={() => onShowDetails && onShowDetails(col)}
                                className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-700 bg-gray-700/30 text-teal-400"
                            >
                                <ReportIcon className="h-4 w-4 mb-1"/> <span className="text-[9px]">Ver</span>
                            </button>
                            <button 
                                onClick={() => onEdit && onEdit(col)}
                                className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-700 bg-gray-700/30 text-blue-400"
                            >
                                <EditIcon className="h-4 w-4 mb-1"/> <span className="text-[9px]">Edit</span>
                            </button>
                            {onToggleStatus && !isSuperAdmin && !isProtectedUser && (
                                <button 
                                    onClick={() => onToggleStatus(col)}
                                    className={`flex flex-col items-center justify-center p-2 rounded hover:bg-gray-700 bg-gray-700/30 ${col.status === CollaboratorStatus.Ativo ? 'text-green-400' : 'text-gray-500'}`}
                                >
                                    {col.status === CollaboratorStatus.Ativo ? <FaToggleOn className="h-4 w-4 mb-1"/> : <FaToggleOff className="h-4 w-4 mb-1"/>} 
                                    <span className="text-[9px]">Status</span>
                                </button>
                            )}
                             {onDelete && !isSuperAdmin && (
                                <button 
                                    onClick={() => { if (!isDeleteDisabled) onDelete(col.id); }} 
                                    className={`flex flex-col items-center justify-center p-2 rounded hover:bg-gray-700 bg-gray-700/30 ${isDeleteDisabled ? "text-gray-600 opacity-50" : "text-red-400"}`}
                                    disabled={isDeleteDisabled}
                                >
                                    <DeleteIcon className="h-4 w-4 mb-1"/> <span className="text-[9px]">Del</span>
                                </button>
                            )}
                        </div>
                    </div>
                );
            }) : (
                 <div className="text-center py-8 text-on-surface-dark-secondary bg-gray-800 rounded-lg border border-gray-700 border-dashed">
                    Nenhum colaborador encontrado.
                </div>
            )}
        </div>

        {/* DESKTOP VIEW (TABLE) */}
        <div className="hidden md:block overflow-x-auto min-h-[400px]">
        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
          <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Nº Mec.</th>
              <th scope="col" className="px-6 py-3">Nome Completo / Equipamentos</th>
              <th scope="col" className="px-6 py-3">Contactos</th>
              <th scope="col" className="px-6 py-3">Cargo / Perfil</th>
              <th scope="col" className="px-6 py-3">Associação</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3 text-center">Acesso</th>
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {collaborators.length > 0 ? collaborators.map((col) => {
                 const assignedEquipment = equipmentByCollaborator.get(col.id) || [];
                 const equipmentCount = assignedEquipment.length;
                 const dependencies = dependencyMap.get(col.id) || [];
                 
                 const isSuperAdmin = col.role === UserRole.SuperAdmin;
                 const isCurrentUser = currentUser?.id === col.id;
                 const isOnboarding = col.status === CollaboratorStatus.Onboarding;
                 const isProtectedUser = col.email === PROTECTED_EMAIL; 
                 
                 const isDeleteDisabled = dependencies.length > 0 || isSuperAdmin || isCurrentUser || isProtectedUser;
                 
                 let deleteTooltip = `Excluir ${col.fullName}`;
                 if (isProtectedUser) deleteTooltip = "Utilizador Protegido pelo Sistema (Raiz)";
                 else if (isSuperAdmin) deleteTooltip = "Impossível excluir perfil SuperAdmin";
                 else if (isCurrentUser) deleteTooltip = "Não pode apagar o seu próprio utilizador";
                 else if (dependencies.length > 0) deleteTooltip = `Impossível excluir: Associado a registos (Tickets, Atribuições)`;
                 
                 const resolvedJobTitle = col.job_title_name || (col.job_title_id ? jobTitleMap.get(col.job_title_id) : null);

                return (
              <tr 
                key={col.id} 
                className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer transition-colors"
                onMouseOver={(e) => handleMouseOver(col, e)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => onShowDetails ? onShowDetails(col) : (onEdit && onEdit(col))}
              >
                <td className="px-6 py-4 font-mono text-xs">{col.numeroMecanografico}</td>
                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {col.photoUrl ? (
                        <img src={col.photoUrl} alt={col.fullName} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white flex-shrink-0">{col.fullName.charAt(0)}</div>
                    )}
                    <div>
                        <span className="text-white font-semibold">{col.fullName}</span>
                        {isOnboarding && <span className="ml-2 text-[10px] uppercase bg-blue-900/50 text-blue-300 px-1 rounded border border-blue-500/30 flex items-center w-fit gap-1 mt-0.5"><FaPlaneArrival/> Novo</span>}
                        {equipmentCount > 0 && <div className="text-xs text-brand-secondary mt-1 font-normal">{equipmentCount} equipamento(s) atribuído(s)</div>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                    <div className="text-white">{col.email}</div>
                    {col.telefoneInterno && <div className="text-xs text-gray-400">Int: {col.telefoneInterno}</div>}
                    {col.telemovel && <div className="text-xs text-gray-400">Móvel: {col.telemovel}</div>}
                </td>
                <td className="px-6 py-4">
                    <div className="font-semibold text-white text-sm">{resolvedJobTitle || <span className="text-gray-500 text-xs italic">Sem Cargo</span>}</div>
                    <div className="text-xs text-brand-secondary">{col.role}</div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-300">{getAssociationText(col)}</td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase tracking-wider ${getStatusClass(col.status)}`}>{col.status}</span>
                </td>
                <td className="px-6 py-4 text-center">
                    {col.canLogin ? (
                        <span className="inline-flex items-center justify-center p-1.5 bg-green-500/20 rounded-full" title="Acesso permitido"><CheckIcon className="h-4 w-4 text-green-400" /></span>
                    ) : (
                        <span className="inline-flex items-center justify-center p-1.5 bg-red-500/20 rounded-full" title="Acesso negado"><XIcon className="h-4 w-4 text-red-400" /></span>
                    )}
                </td>
                <td className="px-6 py-4 text-center">
                     <div className="flex justify-center items-center gap-3">
                        {onToggleStatus && !isSuperAdmin && !isProtectedUser && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleStatus(col); }}
                                className={`text-lg p-1 rounded hover:bg-gray-700 ${col.status === CollaboratorStatus.Ativo ? 'text-green-400' : 'text-gray-500'}`}
                                title={col.status === CollaboratorStatus.Ativo ? 'Inativar' : 'Ativar'}
                            >
                                {col.status === CollaboratorStatus.Ativo ? <FaToggleOn /> : <FaToggleOff />}
                            </button>
                        )}
                        {onStartChat && currentUser && currentUser.id !== col.id && (
                             <button onClick={(e) => { e.stopPropagation(); onStartChat(col); }} className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700" title="Mensagem"><FaComment className="h-4 w-4"/></button>
                        )}
                        {onShowDetails && ( 
                            <button onClick={(e) => { e.stopPropagation(); onShowDetails(col); }} className="text-teal-400 hover:text-teal-300 p-1 rounded hover:bg-gray-700" title="Ficha Completa"><ReportIcon className="h-5 w-5"/></button>
                        )}
                        {onEdit && (
                            <button onClick={(e) => { e.stopPropagation(); onEdit(col); }} className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-700" title="Editar"><EditIcon /></button>
                        )}
                        {onDelete && !isSuperAdmin && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); if (!isDeleteDisabled) onDelete(col.id); }} 
                                className={`p-1 rounded hover:bg-gray-700 ${isDeleteDisabled ? "text-gray-600 opacity-30 cursor-not-allowed" : "text-red-400 hover:text-red-300"}`}
                                disabled={isDeleteDisabled}
                                title={deleteTooltip}
                            >
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                </td>
              </tr>
            )
            }) : (
                <tr><td colSpan={8} className="text-center py-8 text-on-surface-dark-secondary">Nenhum colaborador encontrado com os filtros atuais.</td></tr>
            )}
          </tbody>
        </table>
        </div>
        </>
        )}
        
        {tooltip?.visible && (
            <div style={{ position: 'fixed', top: tooltip.y + 15, left: tooltip.x + 15, pointerEvents: 'none' }} className="bg-gray-900 text-white text-sm rounded-md shadow-lg p-3 z-50 border border-gray-700 max-w-sm hidden md:block" role="tooltip">
                {tooltip.content}
            </div>
        )}
       
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

export default CollaboratorDashboard;
