
import React, { useState, useMemo } from 'react';
import { EquipmentType, Equipment } from '../types';
import { EditIcon, FaTrash as DeleteIcon, PlusIcon, FaSync, FaExclamationTriangle, FaBug } from './common/Icons';
import Pagination from './common/Pagination';
import { getSupabase } from '../services/supabaseClient';

interface EquipmentTypeDashboardProps {
  equipmentTypes: EquipmentType[];
  equipment: Equipment[];
  onEdit?: (eqType: EquipmentType) => void;
  onDelete?: (id: string) => void;
  onCreate?: () => void;
}

const EquipmentTypeDashboard: React.FC<EquipmentTypeDashboardProps> = ({ equipmentTypes, equipment, onEdit, onDelete, onCreate }) => {
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Calculate counts safely with aggressive normalization
    const equipmentCountByType = React.useMemo(() => {
        const counts: Record<string, number> = {};
        
        if (Array.isArray(equipment)) {
            equipment.forEach(item => {
                if (item) {
                    // 1. Tentar encontrar a propriedade correta
                    let rawId = (item as any).typeId || (item as any).type_id || (item as any).typeid || (item as any).equipment_type_id;
                    
                    // 2. Se não encontrou, procurar chaves dinamicamente
                    if (!rawId) {
                        const keys = Object.keys(item);
                        const typeKey = keys.find(k => k.toLowerCase().includes('type') && k.toLowerCase().includes('id'));
                        if (typeKey) rawId = (item as any)[typeKey];
                    }

                    // 3. Normalizar e contar
                    if (rawId && typeof rawId === 'string') {
                         const cleanId = rawId.trim().toLowerCase();
                         counts[cleanId] = (counts[cleanId] || 0) + 1;
                    }
                }
            });
        }
        return counts;
    }, [equipment]);

    const sortedTypes = useMemo(() => {
        return [...equipmentTypes].sort((a,b) => a.name.localeCompare(b.name));
    }, [equipmentTypes]);
    
    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };
    
    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    const handleDiagnostic = async () => {
        // Diagnóstico Local (Props)
        let msg = "DIAGNÓSTICO LOCAL (Props do React):\n";
        msg += `Total Tipos Recebidos: ${equipmentTypes.length}\n`;
        msg += `Total Equipamentos Recebidos: ${equipment.length}\n`;
        
        if (equipment.length > 0) {
            const sample = equipment[0];
            msg += `\nESTRUTURA DA AMOSTRA (Equipamento):\n`;
            msg += JSON.stringify(sample, null, 2);
            
            // Teste de Cruzamento
            if (equipmentTypes.length > 0) {
                const testType = equipmentTypes[0];
                msg += `\n\nTESTE DE CRUZAMENTO:\n`;
                msg += `Procurando equipamentos para o Tipo: "${testType.name}" (ID: ${testType.id})\n`;
                
                // Manual check
                let matches = 0;
                equipment.forEach((eq: any) => {
                    const eqTypeId = eq.typeId || eq.type_id || eq.typeid;
                    if (String(eqTypeId).trim().toLowerCase() === String(testType.id).trim().toLowerCase()) {
                        matches++;
                    }
                });
                msg += `Encontrados manualmente neste teste: ${matches}`;
            }
        } else {
            msg += "\nATENÇÃO: A lista de equipamentos 'props.equipment' está vazia neste componente.";
        }

        alert(msg);
    };
    
    const totalPages = Math.ceil(sortedTypes.length / itemsPerPage);
    const paginatedTypes = useMemo(() => {
        return sortedTypes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [sortedTypes, currentPage, itemsPerPage]);

  return (
    <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-white">Gerir Tipos de Equipamento</h2>
                {equipment.length === 0 && (
                    <p className="text-xs text-yellow-500 mt-1 flex items-center gap-1">
                        <FaExclamationTriangle /> Atenção: A app carregou 0 equipamentos.
                    </p>
                )}
            </div>
            <div className="flex gap-2">
                 <button onClick={handleDiagnostic} className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-400 rounded-md hover:text-white transition-colors text-xs border border-gray-700" title="Verificar dados recebidos">
                    <FaBug /> Debug Props
                </button>
                <button onClick={handleRefresh} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm">
                    <FaSync className={isRefreshing ? "animate-spin" : ""} /> {isRefreshing ? 'A recarregar...' : 'Sincronizar'}
                </button>
                <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors">
                    <PlusIcon /> Adicionar
                </button>
            </div>
        </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
          <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Nome do Tipo</th>
              <th scope="col" className="px-6 py-3 text-center">Nº de Equipamentos</th>
              <th scope="col" className="px-6 py-3 text-center">Requer Backup?</th>
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTypes.length > 0 ? paginatedTypes.map((type) => {
                // Normalize type ID for lookup
                const lookupId = type.id.trim().toLowerCase();
                const count = equipmentCountByType[lookupId] || 0;
                
                const isDeleteDisabled = count > 0;
                // Robust check for backup flag
                const requiresBackup = (type as any).requiresBackupTest || (type as any).requires_backup_test || (type as any).requiresbackuptest;
                
                return (
              <tr key={type.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                  {type.name}
                </td>
                <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${count > 0 ? 'bg-blue-900 text-blue-200' : 'bg-gray-700 text-gray-400'}`}>
                        {count}
                    </span>
                </td>
                 <td className="px-6 py-4 text-center">
                    {requiresBackup ? (
                        <span className="text-green-400 font-bold text-xs bg-green-900/20 px-2 py-1 rounded border border-green-500/30">Sim</span>
                    ) : (
                        <span className="text-gray-500 text-xs">-</span>
                    )}
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center gap-4">
                        {onEdit && (
                            <button onClick={() => onEdit(type)} className="text-blue-400 hover:text-blue-300" aria-label={`Editar ${type.name}`}>
                                <EditIcon />
                            </button>
                        )}
                        {onDelete && (
                             <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (!isDeleteDisabled) onDelete(type.id); 
                                }} 
                                className={isDeleteDisabled ? "text-gray-600 opacity-30 cursor-not-allowed" : "text-red-400 hover:text-red-300"}
                                disabled={isDeleteDisabled}
                                title={isDeleteDisabled ? "Impossível excluir: Existem equipamentos associados" : `Excluir ${type.name}`}
                                aria-label={isDeleteDisabled ? "Exclusão desabilitada" : `Excluir ${type.name}`}
                            >
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                </td>
              </tr>
            )}) : (
                <tr>
                    <td colSpan={4} className="text-center py-8 text-on-surface-dark-secondary">Nenhum tipo de equipamento encontrado.</td>
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
