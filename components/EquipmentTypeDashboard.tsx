import React, { useState, useMemo } from 'react';
import { EquipmentType, Equipment } from '../types';
import { EditIcon, DeleteIcon } from './common/Icons';
import Pagination from './common/Pagination';

interface EquipmentTypeDashboardProps {
  equipmentTypes: EquipmentType[];
  equipment: Equipment[];
  onEdit?: (eqType: EquipmentType) => void;
  onDelete?: (id: string) => void;
}

const EquipmentTypeDashboard: React.FC<EquipmentTypeDashboardProps> = ({ equipmentTypes, equipment, onEdit, onDelete }) => {
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    
    const equipmentCountByType = React.useMemo(() => {
        return equipment.reduce((acc, curr) => {
            acc[curr.typeId] = (acc[curr.typeId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [equipment]);

    const sortedTypes = useMemo(() => {
        return [...equipmentTypes].sort((a,b) => a.name.localeCompare(b.name));
    }, [equipmentTypes]);
    
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
        <h2 className="text-xl font-semibold text-white mb-4">Gerenciar Tipos de Equipamento</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
          <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Nome do Tipo</th>
              <th scope="col" className="px-6 py-3 text-center">Nº de Equipamentos</th>
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTypes.length > 0 ? paginatedTypes.map((type) => (
              <tr key={type.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                  {type.name}
                </td>
                <td className="px-6 py-4 text-center">{equipmentCountByType[type.id] || 0}</td>
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center gap-4">
                        {onEdit && (
                            <button onClick={() => onEdit(type)} className="text-blue-400 hover:text-blue-300" aria-label={`Editar ${type.name}`}>
                                <EditIcon />
                            </button>
                        )}
                        {onDelete && (
                            <button onClick={() => onDelete(type.id)} className="text-red-400 hover:text-red-300" aria-label={`Excluir ${type.name}`}>
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={3} className="text-center py-8 text-on-surface-dark-secondary">Nenhum tipo de equipamento encontrado.</td>
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

export default EquipmentTypeDashboard;
