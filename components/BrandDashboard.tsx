






import React, { useState, useMemo } from 'react';
import { Brand, Equipment, CriticalityLevel } from '../types';
import { EditIcon, DeleteIcon, PlusIcon, FaShieldAlt, FaCheckCircle, FaTimesCircle } from './common/Icons';
import Pagination from './common/Pagination';

interface BrandDashboardProps {
  brands: Brand[];
  equipment: Equipment[];
  onEdit: (brand: Brand) => void;
  onDelete?: (id: string) => void;
  onCreate: () => void;
}

const getRiskClass = (level?: CriticalityLevel) => {
    switch (level) {
        case CriticalityLevel.Critical: return 'bg-red-600 text-white border-red-700';
        case CriticalityLevel.High: return 'bg-orange-600 text-white border-orange-700';
        case CriticalityLevel.Medium: return 'bg-yellow-600 text-white border-yellow-700';
        case CriticalityLevel.Low: return 'bg-green-600 text-white border-green-700';
        default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
};

const BrandDashboard: React.FC<BrandDashboardProps> = ({ brands, equipment, onEdit, onDelete, onCreate }) => {
    
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
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FaShieldAlt className="text-brand-secondary"/>
                    Gerenciar Marcas (Fabricantes)
                </h2>
                <p className="text-sm text-on-surface-dark-secondary mt-1">
                    Classifique o risco de segurança dos fabricantes de hardware e software.
                </p>
            </div>
            <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors">
                <PlusIcon /> Adicionar
            </button>
        </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
          <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Nome da Marca</th>
              <th scope="col" className="px-6 py-3 text-center">Risco</th>
              <th scope="col" className="px-6 py-3 text-center">ISO 27001</th>
              <th scope="col" className="px-6 py-3">Contacto Segurança</th>
              <th scope="col" className="px-6 py-3 text-center">Nº de Equipamentos</th>
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBrands.length > 0 ? paginatedBrands.map((brand) => {
                const isDeleteDisabled = (equipmentCountByBrand[brand.id] || 0) > 0;
                return (
              <tr key={brand.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                  {brand.name}
                </td>
                <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs rounded border font-bold ${getRiskClass(brand.risk_level)}`}>
                        {brand.risk_level || 'Baixa'}
                    </span>
                </td>
                <td className="px-6 py-4 text-center">
                    {brand.is_iso27001_certified ? (
                        <FaCheckCircle className="text-green-500 h-5 w-5 mx-auto" title="Certificado ISO 27001"/>
                    ) : (
                        <FaTimesCircle className="text-gray-600 h-5 w-5 mx-auto" title="Não Certificado"/>
                    )}
                </td>
                <td className="px-6 py-4 text-xs font-mono text-gray-400">
                    {brand.security_contact_email || '—'}
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
                             <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (!isDeleteDisabled) onDelete(brand.id); 
                                }} 
                                className={isDeleteDisabled ? "text-gray-600 opacity-30 cursor-not-allowed" : "text-red-400 hover:text-red-300"}
                                disabled={isDeleteDisabled}
                                title={isDeleteDisabled ? "Impossível excluir: Existem equipamentos associados" : `Excluir ${brand.name}`}
                                aria-label={isDeleteDisabled ? "Exclusão desabilitada" : `Excluir ${brand.name}`}
                            >
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                </td>
              </tr>
            )}) : (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-on-surface-dark-secondary">Nenhuma marca encontrada.</td>
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
