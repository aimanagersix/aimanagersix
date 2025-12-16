
import React, { useState, useMemo } from 'react';
import { SecurityIncidentTypeItem, Ticket } from '../types';
import { EditIcon, FaTrash as DeleteIcon, PlusIcon } from './common/Icons';
import Pagination from './common/Pagination';
import { FaToggleOn, FaToggleOff, FaShieldAlt } from 'react-icons/fa';
import SortableHeader from './common/SortableHeader';

interface SecurityIncidentTypeDashboardProps {
  incidentTypes: SecurityIncidentTypeItem[];
  tickets: Ticket[];
  onEdit: (type: SecurityIncidentTypeItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onCreate: () => void;
}

const SecurityIncidentTypeDashboard: React.FC<SecurityIncidentTypeDashboardProps> = ({ incidentTypes, tickets, onEdit, onDelete, onToggleStatus, onCreate }) => {
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    
    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
        key: 'name',
        direction: 'ascending'
    });

    const ticketCountByType = React.useMemo(() => {
        return tickets.reduce((acc, curr) => {
            if (curr.securityIncidentType) {
                acc[curr.securityIncidentType] = (acc[curr.securityIncidentType] || 0) + 1;
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

    const sortedTypes = useMemo(() => {
        const sorted = [...incidentTypes];
        sorted.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (sortConfig.key) {
                case 'name':
                    valA = a.name;
                    valB = b.name;
                    break;
                case 'description':
                    valA = a.description || '';
                    valB = b.description || '';
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
    }, [incidentTypes, sortConfig]);
    
    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };
    
    const totalPages = Math.ceil(sortedTypes.length / itemsPerPage);
    const paginatedTypes = useMemo(() => {
        return sortedTypes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [sortedTypes, currentPage, itemsPerPage]);

  return (
    <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaShieldAlt className="text-red-500"/>
                Tipos de Ataque (Segurança)
            </h2>
            <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">
                 <PlusIcon /> Adicionar Tipo
             </button>
        </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
          <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
            <tr>
              <SortableHeader label="Nome do Tipo" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Descrição" sortKey="description" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} className="text-center" />
              <th scope="col" className="px-6 py-3 text-center">Incidentes Registados</th>
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTypes.length > 0 ? paginatedTypes.map((type) => {
                const count = ticketCountByType[type.name] || 0;
                const isDeleteDisabled = count > 0;
                
                return (
              <tr key={type.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                  {type.name}
                </td>
                <td className="px-6 py-4 max-w-xs truncate">
                    {type.description || '—'}
                </td>
                <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${type.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {type.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td className="px-6 py-4 text-center">{count}</td>
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center gap-4">
                        <button 
                            onClick={() => onToggleStatus(type.id)} 
                            className={`text-xl ${type.is_active ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
                            title={type.is_active ? 'Desativar' : 'Ativar'}
                        >
                            {type.is_active ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                        <button onClick={() => onEdit(type)} className="text-blue-400 hover:text-blue-300" aria-label={`Editar ${type.name}`}>
                            <EditIcon />
                        </button>
                         <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (!isDeleteDisabled) onDelete(type.id); 
                            }} 
                            className={isDeleteDisabled ? "text-gray-600 opacity-30 cursor-not-allowed" : "text-red-400 hover:text-red-300"}
                            disabled={isDeleteDisabled}
                            title={isDeleteDisabled ? "Impossível excluir: Existem incidentes associados" : `Excluir ${type.name}`}
                        >
                            <DeleteIcon />
                        </button>
                    </div>
                </td>
              </tr>
            )}) : (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-on-surface-dark-secondary">Nenhum tipo de incidente encontrado.</td>
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
            totalItems={sortedTypes.length}
        />
    </div>
  );
};

export default SecurityIncidentTypeDashboard;
