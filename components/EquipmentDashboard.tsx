
import React, { useState, useMemo, useEffect } from 'react';
import { Equipment, EquipmentStatus, EquipmentType, Brand, Assignment, Collaborator, Entidade, CriticalityLevel, BusinessService, ServiceDependency, SoftwareLicense, LicenseAssignment, Vulnerability, Supplier, TooltipConfig, defaultTooltipConfig, ConfigItem, Instituicao, ProcurementRequest, Ticket, TicketActivity } from '../types';
import { AssignIcon, ReportIcon, UnassignIcon, EditIcon, PlusIcon } from './common/Icons';
import { FaHistory, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import Pagination from './common/Pagination';
import * as dataService from '../services/dataService';

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
  onShowHistory: (equipment: Equipment) => void;
  onEdit?: (equipment: Equipment) => void;
  onDelete?: (id: string) => void;
  onClone?: (equipment: Equipment) => void;
  onCreate?: () => void;
  onImportAgent?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onManageKeys?: (equipment: Equipment) => void;
  /* FIX: Added onGenerateReport property to EquipmentDashboardProps */
  onGenerateReport?: () => void;
  onUpdateStatus?: (id: string, status: EquipmentStatus) => void;
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
  onFilterChange?: (filter: any) => void;
  onViewItem?: (tab: string, filter: any) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSortChange?: (sort: { key: string, direction: 'ascending' | 'descending' }) => void;
  totalItems?: number;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  sort?: { key: string, direction: 'ascending' | 'descending' };
  accountingCategories?: ConfigItem[];
  conservationStates?: ConfigItem[];
}

const getStatusClass = (status: string) => {
    switch (status) {
        case 'Operacional': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'Stock': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'Garantia': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'Abate': return 'bg-red-500/20 text-red-400 border-red-500/30';
        default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
};

const EquipmentDashboard: React.FC<EquipmentDashboardProps> = ({ 
    equipment, brandMap, equipmentTypeMap, onAssign, onUnassign, onUpdateStatus, assignedEquipmentIds, onShowHistory, onEdit, onDelete, onClone, onCreate,
    /* FIX: Added onGenerateReport to destructuring */
    onGenerateReport,
    totalItems = 0, loading = false, page = 1, pageSize = 20, sort, onPageChange, onPageSizeChange, onSortChange, onFilterChange
}) => {
    
    const handleSort = (key: string) => {
        if (!onSortChange) return;
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sort?.key === key && sort?.direction === 'ascending') direction = 'descending';
        onSortChange({ key, direction });
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-xl font-semibold text-white">Inventário de Equipamentos</h2>
                <div className="flex items-center gap-2">
                    /* FIX: Added Report button if onGenerateReport is provided */
                    {onGenerateReport && (
                        <button onClick={onGenerateReport} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors border border-gray-600">
                             <ReportIcon /> Relatório
                        </button>
                    )}
                    {onCreate && (
                        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-all font-bold">
                            <PlusIcon /> Adicionar Ativo
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-gray-400">A carregar inventário...</div>
                ) : (
                    <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                        <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('description')}>Equipamento</th>
                                <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('serialNumber')}>Nº Série</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {equipment.length > 0 ? equipment.map((item) => {
                                const isAssigned = assignedEquipmentIds.has(item.id);
                                return (
                                    <tr 
                                        key={item.id} 
                                        className="bg-surface-dark hover:bg-gray-800/50 cursor-pointer transition-colors"
                                        onClick={() => onShowHistory(item)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{item.description}</div>
                                            <div className="text-xs text-gray-500">{brandMap.get(item.brandId)} / {equipmentTypeMap.get(item.typeId)}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-400">{item.serialNumber}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-tighter ${getStatusClass(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-center items-center gap-3">
                                                {isAssigned ? (
                                                    <button onClick={() => onUnassign?.(item.id)} className="text-red-400" title="Desassociar"><UnassignIcon /></button>
                                                ) : (
                                                    <button onClick={() => onAssign?.(item)} className="text-green-400" title="Atribuir"><AssignIcon /></button>
                                                )}
                                                <button onClick={() => onEdit?.(item)} className="text-blue-400" title="Editar"><EditIcon /></button>
                                                <button onClick={() => onShowHistory(item)} className="text-gray-400" title="Histórico"><FaHistory /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={4} className="text-center py-8">Nenhum equipamento encontrado.</td></tr>
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
