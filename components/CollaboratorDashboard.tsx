import React, { useState, useMemo } from 'react';
import { Collaborator, Entidade, Equipment, Assignment, CollaboratorStatus } from '../types';
import { EditIcon, DeleteIcon, CheckIcon, XIcon, ReportIcon, FaComment, SearchIcon } from './common/Icons';
import { FaHistory, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Pagination from './common/Pagination';

interface CollaboratorDashboardProps {
  collaborators: Collaborator[];
  escolasDepartamentos: Entidade[];
  equipment: Equipment[];
  assignments: Assignment[];
  currentUser: Collaborator | null;
  onEdit?: (collaborator: Collaborator) => void;
  onDelete?: (id: string) => void;
  onShowHistory?: (collaborator: Collaborator) => void;
  onShowDetails?: (collaborator: Collaborator) => void;
  onGenerateReport?: () => void;
  onStartChat?: (collaborator: Collaborator) => void;
  onToggleStatus?: (id: string) => void;
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

const CollaboratorDashboard: React.FC<CollaboratorDashboardProps> = ({ collaborators, escolasDepartamentos: entidades, onEdit, onDelete, onShowHistory, onShowDetails, equipment, assignments, onGenerateReport, onStartChat, currentUser, onToggleStatus }) => {
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ entidadeId: '', status: '' });
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

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilters({ entidadeId: '', status: '' });
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
            return searchMatch && entidadeMatch && statusMatch;
        });
    }, [collaborators, filters, searchQuery]);
    
    const totalPages = Math.ceil(filteredCollaborators.length / itemsPerPage);
    const paginatedCollaborators = useMemo(() => {
        return filteredCollaborators.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredCollaborators, currentPage, itemsPerPage]);

    const handleMouseOver = (collaboratorId: string, event: React.MouseEvent) => {
        const assignedEquipment = equipmentByCollaborator.get(collaboratorId);
        if (!assignedEquipment || assignedEquipment.length === 0) return;
        
        const content = (
            <div>
                <p className="font-bold text-white mb-2">Equipamentos Atribuídos:</p>
                <ul className="list-disc list-inside space-y-1">
                    {assignedEquipment.map((eq, index) => <li key={index}>{eq}</li>)}
                </ul>
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
             {onGenerateReport && (
                <button
                    onClick={onGenerateReport}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-brand-secondary text-white rounded-md hover:bg-brand-primary transition-colors"
                >
                    <ReportIcon />
                    Gerar Relatório
                </button>
            )}
        </div>

        <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
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

                return (
              <tr 
                key={col.id} 
                className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer"
                onMouseOver={(e) => handleMouseOver(col.id, e)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => onShowDetails && onShowDetails(col)}
              >
                <td className="px-6 py-4">{col.numeroMecanografico}</td>
                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span>{col.fullName}</span>
                  </div>
                  {equipmentCount > 0 && (
                    <div className="text-xs text-brand-secondary mt-1">
                        {equipmentCount} equipamento(s) atribuído(s)
                    </div>
                  )}
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
                        {onShowHistory && (
                            <button onClick={(e) => { e.stopPropagation(); onShowHistory(col); }} className="text-gray-400 hover:text-white" aria-label={`Histórico de ${col.fullName}`}>
                                <FaHistory className="h-5 w-5"/>
                            </button>
                        )}
                        {onEdit && (
                            <button onClick={(e) => { e.stopPropagation(); onEdit(col); }} className="text-blue-400 hover:text-blue-300" aria-label={`Edit ${col.fullName}`}>
                                <EditIcon />
                            </button>
                        )}
                        {onDelete && (
                            <button onClick={(e) => { e.stopPropagation(); onDelete(col.id); }} className="text-red-400 hover:text-red-300" aria-label={`Delete ${col.fullName}`}>
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
