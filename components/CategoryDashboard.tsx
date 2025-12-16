
import React, { useState, useMemo } from 'react';
import { TicketCategoryItem, Ticket, Team } from '../types';
import { EditIcon, FaTrash as DeleteIcon, PlusIcon } from './common/Icons';
import Pagination from './common/Pagination';
import { FaToggleOn, FaToggleOff, FaUsers, FaShieldAlt } from 'react-icons/fa';
import SortableHeader from './common/SortableHeader';

interface CategoryDashboardProps {
  categories: TicketCategoryItem[];
  tickets: Ticket[];
  teams: Team[];
  onEdit: (category: TicketCategoryItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onCreate: () => void;
}

const CategoryDashboard: React.FC<CategoryDashboardProps> = ({ categories = [], tickets = [], teams = [], onEdit, onDelete, onToggleStatus, onCreate }) => {
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    
    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
        key: 'name',
        direction: 'ascending'
    });
    
    const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);

    const ticketCountByCategory = React.useMemo(() => {
        return tickets.reduce((acc, curr) => {
            if (curr.category) {
                acc[curr.category] = (acc[curr.category] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [tickets]);

    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedCategories = useMemo(() => {
        const sorted = [...(categories || [])];
        sorted.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (sortConfig.key) {
                case 'name':
                    valA = a.name;
                    valB = b.name;
                    break;
                case 'team':
                    valA = a.default_team_id ? (teamMap.get(a.default_team_id) || '') : '';
                    valB = b.default_team_id ? (teamMap.get(b.default_team_id) || '') : '';
                    break;
                case 'is_security':
                    valA = a.is_security ? 1 : 0;
                    valB = b.is_security ? 1 : 0;
                    break;
                 case 'status':
                    valA = a.is_active ? 1 : 0;
                    valB = b.is_active ? 1 : 0;
                    break;
                default:
                    return 0;
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [categories, sortConfig, teamMap]);
    
    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };
    
    const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
    const paginatedCategories = useMemo(() => {
        return sortedCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [sortedCategories, currentPage, itemsPerPage]);

  return (
    <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Categorias de Tickets</h2>
            <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">
                 <PlusIcon /> Adicionar Categoria
             </button>
        </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
          <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
            <tr>
              <SortableHeader label="Nome da Categoria" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Equipa Padrão" sortKey="team" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Tipo" sortKey="is_security" currentSort={sortConfig} onSort={handleSort} className="text-center" />
              <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} className="text-center" />
              <th scope="col" className="px-6 py-3 text-center">Nº de Tickets</th>
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCategories.length > 0 ? paginatedCategories.map((cat) => {
                const count = ticketCountByCategory[cat.name] || 0;
                const isDeleteDisabled = count > 0;
                const teamName = cat.default_team_id ? teamMap.get(cat.default_team_id) : null;
                
                return (
              <tr key={cat.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                  {cat.name}
                </td>
                <td className="px-6 py-4">
                    {teamName ? (
                        <div className="flex items-center gap-2 text-brand-secondary">
                            <FaUsers className="h-3 w-3" />
                            {teamName}
                        </div>
                    ) : (
                        <span className="text-gray-500 italic">Nenhuma</span>
                    )}
                </td>
                <td className="px-6 py-4 text-center">
                    {cat.is_security ? (
                         <span className="inline-flex items-center gap-1 bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs border border-red-500/30 font-bold" title="Incidente de Segurança">
                            <FaShieldAlt className="h-3 w-3" /> Segurança
                        </span>
                    ) : (
                        <span className="text-gray-500 text-xs">Padrão</span>
                    )}
                </td>
                <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${cat.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {cat.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td className="px-6 py-4 text-center">{count}</td>
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center gap-4">
                        <button 
                            onClick={() => onToggleStatus(cat.id)} 
                            className={`text-xl ${cat.is_active ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
                            title={cat.is_active ? 'Desativar' : 'Ativar'}
                        >
                            {cat.is_active ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                        <button onClick={() => onEdit(cat)} className="text-blue-400 hover:text-blue-300" aria-label={`Editar ${cat.name}`}>
                            <EditIcon />
                        </button>
                         <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (!isDeleteDisabled) onDelete(cat.id); 
                            }} 
                            className={isDeleteDisabled ? "text-gray-600 opacity-30 cursor-not-allowed" : "text-red-400 hover:text-red-300"}
                            disabled={isDeleteDisabled}
                            title={isDeleteDisabled ? "Impossível excluir: Existem tickets associados" : `Excluir ${cat.name}`}
                        >
                            <DeleteIcon />
                        </button>
                    </div>
                </td>
              </tr>
            )}) : (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-on-surface-dark-secondary">Nenhuma categoria encontrada.</td>
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
            totalItems={sortedCategories.length}
        />
    </div>
  );
};

export default CategoryDashboard;
