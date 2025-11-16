import React, { useState, useMemo } from 'react';
import { Brand, Equipment } from '../types';
import { EditIcon, DeleteIcon } from './common/Icons';
import Pagination from './common/Pagination';

interface BrandDashboardProps {
  brands: Brand[];
  equipment: Equipment[];
  onEdit?: (brand: Brand) => void;
  onDelete?: (id: string) => void;
}

const BrandDashboard: React.FC<BrandDashboardProps> = ({ brands, equipment, onEdit, onDelete }) => {
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const equipmentCountByBrand = React.useMemo(() => {
        return equipment.reduce((acc, curr) => {
            acc[curr.brandId] = (acc[curr.brandId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [equipment]);
    
    const sortedBrands = useMemo(() => {
        return [...brands].sort((a,b) => a.name.localeCompare(b.name));
    }, [brands]);

    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(sortedBrands.length / itemsPerPage);
    const paginatedBrands = useMemo(() => {
        return sortedBrands.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [sortedBrands, currentPage, itemsPerPage]);

  return (
    <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Gerenciar Marcas</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
          <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Nome da Marca</th>
              <th scope="col" className="px-6 py-3 text-center">Nº de Equipamentos</th>
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBrands.length > 0 ? paginatedBrands.map((brand) => (
              <tr key={brand.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                  {brand.name}
                </td>
                <td className="px-6 py-4 text-center">{equipmentCountByBrand[brand.id] || 0}</td>
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center gap-4">
                        {onEdit && (
                            <button onClick={() => onEdit(brand)} className="text-blue-400 hover:text-blue-300" aria-label={`Editar ${brand.name}`}>
                                <EditIcon />
                            </button>
                        )}
                        {onDelete && (
                            <button onClick={() => onDelete(brand.id)} className="text-red-400 hover:text-red-300" aria-label={`Excluir ${brand.name}`}>
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={3} className="text-center py-8 text-on-surface-dark-secondary">Nenhuma marca encontrada.</td>
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
            totalItems={sortedBrands.length}
        />
    </div>
  );
};

export default BrandDashboard;
