
import React, { useState, useMemo } from 'react';
import { Entidade, Instituicao, Collaborator, EntidadeStatus, Assignment, Ticket, CollaboratorHistory, Equipment, Brand, EquipmentType } from '../types';
import { EditIcon, FaTrash as DeleteIcon, SearchIcon, PlusIcon, FaPrint, FaFileImport } from './common/Icons';
import { FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Pagination from './common/Pagination';
import EntidadeDetailModal from './EntidadeDetailModal';
import InstituicaoDetailModal from './InstituicaoDetailModal';
import SortableHeader from './common/SortableHeader';

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
  onCreate?: () => void;
  // New Quick Actions
  onAddCollaborator?: (entidadeId: string) => void;
  onAssignEquipment?: (entidadeId: string) => void;
  onImport?: () => void;
  // Equipment Data for Detail Modal
  equipment?: Equipment[];
  brands?: Brand[];
  equipmentTypes?: EquipmentType[];
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

const EntidadeDashboard: React.FC<EntidadeDashboardProps> = ({ escolasDepartamentos: entidadesData, instituicoes, collaborators, assignments, tickets, collaboratorHistory, onEdit, onDelete, onToggleStatus, onCreate, onAddCollaborator, onAssignEquipment, onImport, equipment = [], brands = [], equipmentTypes = [] }) => {
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ instituicaoId: '', status: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [selectedEntidade, setSelectedEntidade] = useState<Entidade | null>(null);
    const [selectedInstitutionForDrillDown, setSelectedInstitutionForDrillDown] = useState<Instituicao | null>(null);
    
    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
        key: 'name',
        direction: 'ascending'
    });

    const instituicaoMap = useMemo(() => new Map(instituicoes.map(e => [e.id, e.name])), [instituicoes]);

    const collaboratorsByEntidade = React.useMemo(() => {
        return collaborators.reduce((acc, curr) => {
            if (curr.entidadeId) {
                acc[curr.entidadeId] = (acc[curr.entidadeId] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [collaborators]);
    
    const dependencyMap = useMemo(() => {
        const map = new Set<string>();
        
        // Check all assignments (history included)
        assignments.forEach(a => {
            if (a.entidadeId) map.add(a.entidadeId);
        });
        // Check tickets
        tickets.forEach(t => {
             if (t.entidadeId) map.add(t.entidadeId);
        });
        // Check collaborator history
        collaboratorHistory.forEach(ch => {
            if (ch.entidadeId) map.add(ch.entidadeId);
        });
        return map;
    }, [assignments, tickets, collaboratorHistory]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({ instituicaoId: '', status: '' });
        setSearchQuery('');
        setCurrentPage(1);
    };

    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };

    const filteredEntidades = useMemo(() => {
        const query = searchQuery.toLowerCase();
        let filtered = entidadesData.filter(entidade => {
            const searchMatch = query === '' || 
                (entidade.name && entidade.name.toLowerCase().includes(query)) ||
                (entidade.codigo && entidade.codigo.toLowerCase().includes(query)) ||
                (entidade.email && entidade.email.toLowerCase().includes(query));

            const instituicaoMatch = filters.instituicaoId === '' || entidade.instituicaoId === filters.instituicaoId;
            const statusMatch = filters.status === '' || entidade.status === filters.status;
            
            return searchMatch && instituicaoMatch && statusMatch;
        });

        // Sorting Logic
        filtered.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (sortConfig.key) {
                case 'instituicao':
                    valA = instituicaoMap.get(a.instituicaoId) || '';
                    valB = instituicaoMap.get(b.instituicaoId) || '';
                    break;
                case 'collaborators':
                    valA = collaboratorsByEntidade[a.id] || 0;
                    valB = collaboratorsByEntidade[b.id] || 0;
                    break;
                default:
                    valA = a[sortConfig.key as keyof Entidade];
                    valB = b[sortConfig.key as keyof Entidade];
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [entidadesData, filters, searchQuery, sortConfig, instituicaoMap, collaboratorsByEntidade]);

    const totalPages = Math.ceil(filteredEntidades.length / itemsPerPage);
    const paginatedEntidades = useMemo(() => {
        return filteredEntidades.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredEntidades, currentPage, itemsPerPage]);

    const handlePrintList = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const rows = filteredEntidades.map(ent => `
            <tr>
                <td>${ent.name}</td>
                <td>${ent.codigo}</td>
                <td>${instituicaoMap.get(ent.instituicaoId) || 'N/A'}</td>
                <td>${ent.responsavel || '-'}</td>
                <td>${ent.email}</td>
                <td>${ent.status}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Listagem de Entidades</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    h1 { color: #333; }
                </style>
            </head>
            <body>
                <h1>Listagem de Entidades</h1>
                <p>Data: ${new Date().toLocaleDateString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Código</th>
                            <th>Instituição</th>
                            <th>Responsável</th>
                            <th>Email</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleOpenInstitution = (inst: Instituicao) => {
        setSelectedEntidade(null);
        setSelectedInstitutionForDrillDown(inst);
    };

  return (
    <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h2 className="text-xl font-semibold text-white">Gestão de Entidades</h2>
            <div className="flex gap-2">
                <button onClick={handlePrintList} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">
                    <FaPrint /> Imprimir Listagem
                </button>
                {onImport && (
                    <button onClick={onImport} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors">
                        <FaFileImport /> Importar Excel
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            placeholder="Nome, código ou email..."
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
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Filtrar por Status</label>
                    <select
                        id="status"
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                    >
                        <option value="">Todos os Estados</option>
                        {Object.values(EntidadeStatus).map(s => <option key={s} value={s}>{s}</option>)}
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
              <SortableHeader label="Entidade (Código)" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Instituição" sortKey="instituicao" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Responsável" sortKey="responsavel" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Colaboradores" sortKey="collaborators" currentSort={sortConfig} onSort={handleSort} className="text-center" />
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEntidades.length > 0 ? paginatedEntidades.map((entidade) => {
                const collabCount = collaboratorsByEntidade[entidade.id] || 0;
                const isDeleteDisabled = collabCount > 0 || dependencyMap.has(entidade.id);
                
                let disabledReason = "";
                if (collabCount > 0) disabledReason = "Existem colaboradores associados";
                else if (dependencyMap.has(entidade.id)) disabledReason = "Existem registos associados (equipamentos, tickets ou histórico)";

                return (
              <tr 
                key={entidade.id} 
                className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer"
                onClick={() => setSelectedEntidade(entidade)}
              >
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
                                onClick={(e) => { e.stopPropagation(); onToggleStatus && onToggleStatus(entidade.id); }}
                                className={`text-xl ${entidade.status === EntidadeStatus.Ativo ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
                                title={entidade.status === EntidadeStatus.Ativo ? 'Inativar' : 'Ativar'}
                            >
                                {entidade.status === EntidadeStatus.Ativo ? <FaToggleOn /> : <FaToggleOff />}
                            </button>
                        )}
                        {onEdit && (
                            <button onClick={(e) => { e.stopPropagation(); onEdit(entidade); }} className="text-blue-400 hover:text-blue-300" aria-label={`Edit ${entidade.name}`}>
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

        {selectedEntidade && (
            <EntidadeDetailModal 
                entidade={selectedEntidade}
                instituicao={instituicoes.find(i => i.id === selectedEntidade.instituicaoId)}
                collaborators={collaborators}
                assignments={assignments}
                onClose={() => setSelectedEntidade(null)}
                onEdit={() => {
                    setSelectedEntidade(null);
                    if (onEdit) onEdit(selectedEntidade);
                }}
                onAddCollaborator={onAddCollaborator}
                onAssignEquipment={onAssignEquipment}
                onOpenInstitution={handleOpenInstitution}
                // Pass equipment data
                equipment={equipment}
                brands={brands}
                equipmentTypes={equipmentTypes}
            />
        )}

        {selectedInstitutionForDrillDown && (
            <InstituicaoDetailModal 
                instituicao={selectedInstitutionForDrillDown}
                entidades={entidadesData}
                collaborators={collaborators}
                onClose={() => setSelectedInstitutionForDrillDown(null)}
                onEdit={() => {
                    alert("Para editar esta instituição, navegue para o menu 'Instituições'.");
                }}
                onOpenEntity={(ent) => {
                    setSelectedInstitutionForDrillDown(null);
                    if (ent) setSelectedEntidade(ent);
                }}
                // Pass assignments and equipment for drilldown (though Institution Detail Modal needs to accept them too)
                assignments={assignments}
                equipment={equipment}
                brands={brands}
                equipmentTypes={equipmentTypes}
            />
        )}
    </div>
  );
};

export default EntidadeDashboard;
