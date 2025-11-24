



import React, { useState, useMemo } from 'react';
import { TicketCategoryItem, Ticket, Team } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from './common/Icons';
import Pagination from './common/Pagination';
import { FaToggleOn, FaToggleOff, FaUsers } from 'react-icons/fa';

interface CategoryDashboardProps {
  categories: TicketCategoryItem[];
  tickets: Ticket[];
  teams: Team[];
  onEdit: (category: TicketCategoryItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onCreate: () => void;
}

const CategoryDashboard: React.FC<CategoryDashboardProps> = ({ categories, tickets, teams, onEdit, onDelete, onToggleStatus, onCreate }) => {
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    
    const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);

    const ticketCountByCategory = React.useMemo(() => {
        return tickets.reduce((acc, curr) => {
            if (curr.category) {
                acc[curr.category] = (acc[curr.category] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [tickets]);

    const sortedCategories = useMemo(() => {
        return [...categories].sort((a,b) => a.name.localeCompare(b.name));
    }, [categories]);
    
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
            <h2 className="text-xl font-semibold text-white">Gerenciar Categorias de Tickets</h2>
            <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">
                 <PlusIcon /> Adicionar Categoria
             </button>
        </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
          <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Nome da Categoria</th>
              <th scope="col" className="px-6 py-3">Equipa Padrão</th>
              <th scope="col" className="px-6 py-3 text-center">Status</th>
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
                    <td colSpan={5} className="text-center py-8 text-on-surface-dark-secondary">Nenhuma categoria encontrada.</td>
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
