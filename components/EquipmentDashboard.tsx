import React, { useState, useMemo } from 'react';
import { Equipment, EquipmentStatus, EquipmentType, Brand, Assignment, Collaborator, Entidade, CriticalityLevel, BusinessService, ServiceDependency, SoftwareLicense, LicenseAssignment, Vulnerability, Supplier, TooltipConfig, defaultTooltipConfig, ConfigItem, Instituicao, ProcurementRequest, Ticket, TicketActivity } from '../types';
/* Added missing imports: FaRobot, FaPrint, FaBoxOpen */
import { AssignIcon, UnassignIcon, EditIcon, PlusIcon, FaHistory, FaSort, FaSortUp, FaSortDown, FaTrash, FaCopy, FaCheck, FaTimes, FaFilter, FaSync, FaRobot, FaPrint, FaBoxOpen } from './common/Icons';
import { FaClone, FaRegCheckSquare, FaRegSquare, FaCheckSquare, FaEllipsisV } from 'react-icons/fa';
import Pagination from './common/Pagination';

interface EquipmentDashboardProps {
  equipment: Equipment[];
  brands: Brand[];
  equipmentTypes: EquipmentType[];
  brandMap: Map<string, string>;
  equipmentTypeMap: Map<string, string>;
  assignedEquipmentIds: Set<string>;
  assignments: Assignment[];
  collaborators: Collaborator[];
  entidades: Entidade[];
  instituicoes?: Instituicao[];
  initialFilter: any;
  onClearInitialFilter: () => void;
  onAssign?: (equipment: Equipment) => void;
  onAssignMultiple?: (equipmentList: Equipment[]) => void;
  onUnassign?: (equipmentId: string) => void;
  onUpdateStatus?: (id: string, status: EquipmentStatus) => void;
  onShowHistory: (equipment: Equipment) => void;
  onEdit?: (equipment: Equipment) => void;
  onDelete?: (id: string) => void;
  onClone?: (equipment: Equipment) => void;
  onCreate?: () => void;
  onGenerateReport?: () => void;
  onImportAgent?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onManageKeys?: (equipment: Equipment) => void;
  totalItems?: number;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSortChange?: (sort: { key: string, direction: 'ascending' | 'descending' }) => void;
  sort?: { key: string, direction: 'ascending' | 'descending' };
  onFilterChange?: (filter: any) => void;
  /* Fixed: Added missing optional properties passed from InventoryManager */
  businessServices?: BusinessService[];
  serviceDependencies?: ServiceDependency[];
  tickets?: Ticket[];
  ticketActivities?: TicketActivity[];
  softwareLicenses?: SoftwareLicense[];
  licenseAssignments?: LicenseAssignment[];
  vulnerabilities?: Vulnerability[];
  suppliers?: Supplier[];
  procurementRequests?: ProcurementRequest[];
  tooltipConfig?: TooltipConfig;
  onViewItem?: (tab: string, filter: any) => void;
  accountingCategories?: ConfigItem[];
  conservationStates?: ConfigItem[];
}

const getStatusClass = (status: string) => {
    switch (status) {
        case 'Operacional': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'Stock': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'Garantia': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'Abate': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'Aquisição': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
};

const EquipmentDashboard: React.FC<EquipmentDashboardProps> = ({ 
    equipment, brandMap, equipmentTypeMap, onAssign, onUnassign, onUpdateStatus, assignedEquipmentIds, onShowHistory, onEdit, onDelete, onClone, onCreate, onAssignMultiple, onGenerateReport, onImportAgent,
    totalItems = 0, loading = false, page = 1, pageSize = 20, sort, onPageChange, onPageSizeChange, onSortChange, onFilterChange
}) => {
    
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showStatusDropdownId, setShowStatusDropdownId] = useState<string | null>(null);

    const handleSort = (key: string) => {
        if (!onSortChange) return;
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sort?.key === key && sort?.direction === 'ascending') direction = 'descending';
        onSortChange({ key, direction });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === equipment.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(equipment.map(e => e.id)));
        }
    };

    const toggleSelectItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const handleBulkAssign = () => {
        if (onAssignMultiple) {
            const selectedEquipment = equipment.filter(e => selectedIds.has(e.id));
            onAssignMultiple(selectedEquipment);
        }
    };

    const handleBulkStatus = async (status: EquipmentStatus) => {
        if (onUpdateStatus) {
            for (const id of Array.from(selectedIds)) {
                await onUpdateStatus(id, status);
            }
            setSelectedIds(new Set());
        }
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl relative">
            {/* Header com Ações */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-white">Inventário de Ativos</h2>
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 bg-brand-primary/20 px-4 py-2 rounded-full border border-brand-primary animate-fade-in">
                            <span className="text-xs font-bold text-brand-secondary">{selectedIds.size} selecionados</span>
                            <div className="h-4 w-px bg-gray-700 mx-2"></div>
                            <button onClick={handleBulkAssign} className="text-xs font-bold text-white hover:text-brand-secondary flex items-center gap-1">
                                <AssignIcon className="w-3 h-3"/> Atribuir em Lote
                            </button>
                            <div className="relative group">
                                <button className="text-xs font-bold text-white hover:text-brand-secondary flex items-center gap-1">
                                    <FaSync className="w-3 h-3"/> Mudar Estado
                                </button>
                                <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-gray-800 border border-gray-700 rounded shadow-xl z-50 py-1 min-w-[120px]">
                                    {Object.values(EquipmentStatus).map(s => (
                                        <button key={s} onClick={() => handleBulkStatus(s)} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white">{s}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {onImportAgent && (
                        <label className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 cursor-pointer border border-gray-700">
                            <FaRobot className="text-purple-400" /> Importar Agente
                            <input type="file" className="hidden" onChange={onImportAgent} accept=".json" />
                        </label>
                    )}
                    {onGenerateReport && (
                        <button onClick={onGenerateReport} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 border border-gray-700">
                             <FaPrint /> Relatórios
                        </button>
                    )}
                    {onCreate && (
                        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-all font-bold shadow-lg">
                            <PlusIcon /> Adicionar Ativo
                        </button>
                    )}
                </div>
            </div>

            {/* Tabela de Ativos */}
            <div className="overflow-x-auto min-h-[500px]">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 text-gray-500 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-secondary"></div>
                        <span>A carregar inventário...</span>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                        <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-800/80 sticky top-0 z-20">
                            <tr>
                                <th className="px-4 py-4 w-10">
                                    <button onClick={toggleSelectAll} className="text-lg text-gray-500 hover:text-brand-secondary">
                                        {selectedIds.size === equipment.length && equipment.length > 0 ? <FaCheckSquare className="text-brand-secondary"/> : <FaRegSquare />}
                                    </button>
                                </th>
                                <th className="px-6 py-4 cursor-pointer group" onClick={() => handleSort('description')}>
                                    <div className="flex items-center gap-2">
                                        Equipamento / Marca
                                        <FaSort className="opacity-0 group-hover:opacity-50" />
                                    </div>
                                </th>
                                <th className="px-6 py-4">Informação Técnica</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {equipment.length > 0 ? equipment.map((item) => {
                                const isAssigned = assignedEquipmentIds.has(item.id);
                                const isSelected = selectedIds.has(item.id);
                                
                                return (
                                    <tr 
                                        key={item.id} 
                                        className={`group transition-all ${isSelected ? 'bg-brand-primary/10' : 'bg-surface-dark hover:bg-gray-800/40 cursor-pointer'}`}
                                        onClick={() => onShowHistory(item)}
                                    >
                                        <td className="px-4 py-4" onClick={(e) => toggleSelectItem(item.id, e)}>
                                            <button className="text-lg text-gray-600 hover:text-brand-secondary">
                                                {isSelected ? <FaCheckSquare className="text-brand-secondary"/> : <FaRegSquare />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white group-hover:text-brand-secondary transition-colors">{item.description}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <span className="bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 font-mono">{item.serialNumber}</span>
                                                <span>{brandMap.get(item.brandId)} / {equipmentTypeMap.get(item.typeId)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] space-y-0.5 text-gray-400">
                                                {item.ip_address && <div className="flex gap-2"><span>IP:</span> <span className="text-blue-300 font-mono">{item.ip_address}</span></div>}
                                                {item.macAddressWIFI && <div className="flex gap-2"><span>WIFI:</span> <span className="font-mono">{item.macAddressWIFI}</span></div>}
                                                {item.nomeNaRede && <div className="flex gap-2"><span>HOST:</span> <span className="text-white">{item.nomeNaRede}</span></div>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="relative inline-block">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setShowStatusDropdownId(showStatusDropdownId === item.id ? null : item.id); }}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-tighter shadow-sm transition-transform hover:scale-105 ${getStatusClass(item.status)}`}
                                                >
                                                    {item.status}
                                                </button>
                                                {showStatusDropdownId === item.id && (
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-gray-900 border border-gray-700 rounded shadow-2xl z-30 py-1 min-w-[120px] animate-fade-in">
                                                        {Object.values(EquipmentStatus).map(s => (
                                                            <button 
                                                                key={s} 
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    onUpdateStatus?.(item.id, s); 
                                                                    setShowStatusDropdownId(null); 
                                                                }} 
                                                                className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-brand-primary hover:text-white"
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isAssigned ? (
                                                    <button onClick={() => onUnassign?.(item.id)} className="p-2 bg-red-900/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition-all" title="Desassociar"><UnassignIcon className="w-4 h-4"/></button>
                                                ) : (
                                                    <button onClick={() => onAssign?.(item)} className="p-2 bg-green-900/20 text-green-400 rounded hover:bg-green-600 hover:text-white transition-all" title="Atribuir"><AssignIcon className="w-4 h-4"/></button>
                                                )}
                                                <button onClick={() => onEdit?.(item)} className="p-2 bg-blue-900/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all" title="Editar"><EditIcon className="w-4 h-4"/></button>
                                                <button onClick={() => onClone?.(item)} className="p-2 bg-purple-900/20 text-purple-400 rounded hover:bg-purple-600 hover:text-white transition-all" title="Clonar Ativo"><FaClone className="w-4 h-4"/></button>
                                                <button onClick={() => onShowHistory(item)} className="p-2 bg-gray-800 text-gray-400 rounded hover:bg-gray-600 hover:text-white transition-all" title="Histórico Completo"><FaHistory className="w-4 h-4"/></button>
                                                {onDelete && (
                                                    <button onClick={() => onDelete(item.id)} className="p-2 bg-red-900/20 text-red-500 rounded hover:bg-red-600 hover:text-white transition-all" title="Eliminar"><FaTrash className="w-4 h-4"/></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={5} className="text-center py-20 text-gray-500 italic">
                                    <FaBoxOpen className="text-5xl mx-auto mb-4 opacity-10" />
                                    Nenhum equipamento encontrado.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
            <Pagination currentPage={page || 1} totalPages={Math.ceil((totalItems || 0) / (pageSize || 20))} onPageChange={onPageChange!} itemsPerPage={pageSize || 20} onItemsPerPageChange={onPageSizeChange!} totalItems={totalItems || 0} />
        </div>
    );
};

export default EquipmentDashboard;