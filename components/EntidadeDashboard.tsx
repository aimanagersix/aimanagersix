
import React, { useState, useMemo } from 'react';
import { Entidade, Instituicao, Collaborator, EntidadeStatus, Assignment, Ticket, CollaboratorHistory } from '../types';
import { EditIcon, DeleteIcon, SearchIcon } from './common/Icons';
import { FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Pagination from './common/Pagination';

interface EntidadeDashboardProps {
  escolasDepartamentos: Entidade[];
  instituicoes: Instituicao[];
  collaborators: Collaborator[];
  assignments: Assignment[];
  tickets: Ticket[];
  collaboratorHistory: CollaboratorHistory[];
  onEdit?: (entidade: Entidade) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
}

const getStatusClass = (status: EntidadeStatus) => {
    switch (status) {
        case EntidadeStatus.Ativo:
            return 'bg-green-500/20 text-green-400';
        case EntidadeStatus.Inativo:
            return 'bg-red-500/20 text-red-400';
        default:
            return 'bg-gray-500/20 text-gray-400';
    }
};

const EntidadeDashboard: React.FC<EntidadeDashboardProps> = ({ escolasDepartamentos: entidadesData, instituicoes, collaborators, assignments, tickets, collaboratorHistory, onEdit, onDelete, onToggleStatus }) => {
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ instituicaoId: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    
    const instituicaoMap = useMemo(() => new Map(instituicoes.map(e => [e.id, e.name])), [instituicoes]);

    const collaboratorsByEntidade = React.useMemo(() => {
        return collaborators.reduce((acc, curr) => {
            acc[curr.entidadeId] = (acc[curr.entidadeId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [collaborators]);
    
    const hasDependencies = useMemo(() => {
        const deps = new Set<string>();
        // Check all assignments (history included)
        assignments.forEach(a => {
            if (a.entidadeId) deps.add(a.entidadeId);
        });
        // Check tickets
        tickets.forEach(t => {
             if (t.entidadeId) deps.add(t.entidadeId);
        });
        // Check collaborator history
        collaboratorHistory.forEach(ch => {
            if (ch.entidadeId) deps.add(ch.entidadeId);
        });
        return deps;
    }, [assignments, tickets, collaboratorHistory]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({ instituicaoId: '' });
        setSearchQuery('');
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };

    const filteredEntidades = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return entidadesData.filter(entidade => {
            const searchMatch = query === '' || 
                entidade.name.toLowerCase().includes(query) ||
                entidade.codigo.toLowerCase().includes(query);

            const instituicaoMatch = filters.instituicaoId === '' || entidade.instituicaoId === filters.instituicaoId;
            return searchMatch && instituicaoMatch;
        }).sort((a,b) => a.name.localeCompare(b.name));
    }, [entidadesData, filters, searchQuery]);

    const totalPages = Math.ceil(filteredEntidades.length / itemsPerPage);
    const paginatedEntidades = useMemo(() => {
        return filteredEntidades.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredEntidades, currentPage, itemsPerPage]);

  return (
    <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Gerenciar Entidades</h2>

        <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="searchQuery" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Procurar</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="searchQuery"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Nome ou código da entidade..."
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 pl-10 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="instituicaoId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Filtrar por Instituição</label>
                    <select
                        id="instituicaoId"
                        name="instituicaoId"
                        value={filters.instituicaoId}
                        onChange={handleFilterChange}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                    >
                        <option value="">Todas as Instituições</option>
                        {instituicoes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
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
              <th scope="col" className="px-6 py-3">Entidade (Código)</th>
              <th scope="col" className="px-6 py-3">Instituição</th>
              <th scope="col" className="px-6 py-3">Responsável</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3 text-center">Colaboradores</th>
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEntidades.length > 0 ? paginatedEntidades.map((entidade) => {
                const collabCount = collaboratorsByEntidade[entidade.id] || 0;
                const isDeleteDisabled = collabCount > 0 || hasDependencies.has(entidade.id);
                
                let disabledReason = "";
                if (collabCount > 0) disabledReason = "Existem colaboradores associados";
                else if (hasDependencies.has(entidade.id)) disabledReason = "Existem registos associados (equipamentos, tickets ou histórico)";

                return (
              <tr key={entidade.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                  <div>{entidade.name}</div>
                  <div className="text-xs text-on-surface-dark-secondary">Código: {entidade.codigo}</div>
                </td>
                <td className="px-6 py-4">{instituicaoMap.get(entidade.instituicaoId) || 'N/A'}</td>
                <td className="px-6 py-4">{entidade.responsavel || 'N/A'}</td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(entidade.status)}`}>
                        {entidade.status}
                    </span>
                </td>
                <td className="px-6 py-4 text-center">{collabCount}</td>
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center gap-4">
                        {onToggleStatus && (
                            <button 
                                onClick={() => onToggleStatus && onToggleStatus(entidade.id)} 
                                className={`text-xl ${entidade.status === EntidadeStatus.Ativo ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
                                title={entidade.status === EntidadeStatus.Ativo ? 'Inativar' : 'Ativar'}
                            >
                                {entidade.status === EntidadeStatus.Ativo ? <FaToggleOn /> : <FaToggleOff />}
                            </button>
                        )}
                        {onEdit && (
                            <button onClick={() => onEdit(entidade)} className="text-blue-400 hover:text-blue-300" aria-label={`Edit ${entidade.name}`}>
                                <EditIcon />
                            </button>
                        )}
                        {onDelete && (
                             <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (!isDeleteDisabled) onDelete(entidade.id); 
                                }} 
                                className={isDeleteDisabled ? "text-gray-600 opacity-30 cursor-not-allowed" : "text-red-400 hover:text-red-300"}
                                disabled={isDeleteDisabled}
                                title={isDeleteDisabled ? `Impossível excluir: ${disabledReason}` : `Excluir ${entidade.name}`}
                                aria-label={isDeleteDisabled ? "Exclusão desabilitada" : `Excluir ${entidade.name}`}
                            >
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                </td>
              </tr>
            )}) : (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-on-surface-dark-secondary">Nenhuma entidade encontrada com os filtros atuais.</td>
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
            totalItems={filteredEntidades.length}
        />
    </div>
  );
};

export default EntidadeDashboard;
