

import React, { useState, useMemo, useEffect } from 'react';
import { Equipment, EquipmentStatus, EquipmentType, Brand, Assignment, Collaborator, Entidade, CriticalityLevel } from '../types';
import { AssignIcon, ReportIcon, UnassignIcon, EditIcon, FaKey } from './common/Icons';
import { FaHistory, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { XIcon } from './common/Icons';
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
  initialFilter: any;
  onClearInitialFilter: () => void;
  onAssign?: (equipment: Equipment) => void;
  onAssignMultiple?: (equipment: Equipment[]) => void;
  onUnassign?: (equipmentId: string) => void;
  onUpdateStatus?: (id: string, status: EquipmentStatus) => void;
  onShowHistory: (equipment: Equipment) => void;
  onEdit?: (equipment: Equipment) => void;
  onGenerateReport?: () => void;
  onManageKeys?: (equipment: Equipment) => void;
}

interface TooltipState {
    visible: boolean;
    content: React.ReactNode;
    x: number;
    y: number;
}

type SortableKeys = keyof Equipment | 'brand' | 'type' | 'assignedTo';

const getStatusClass = (status: EquipmentStatus) => {
    switch (status) {
        case EquipmentStatus.Operational: return 'bg-green-500/20 text-green-400 border-green-500/30';
        case EquipmentStatus.Stock: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case EquipmentStatus.Warranty: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case EquipmentStatus.Decommissioned: return 'bg-red-500/20 text-red-400 border-red-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const getCriticalityClass = (level?: CriticalityLevel) => {
    switch (level) {
        case CriticalityLevel.Critical: return 'bg-red-600 text-white border-red-700';
        case CriticalityLevel.High: return 'bg-orange-600 text-white border-orange-700';
        case CriticalityLevel.Medium: return 'bg-yellow-600 text-white border-yellow-700';
        case CriticalityLevel.Low: return 'bg-gray-600 text-white border-gray-700';
        default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
};

const getWarrantyStatus = (warrantyDate?: string): { text: string, className: string } => {
    if (!warrantyDate) {
        return { text: 'N/A', className: 'text-on-surface-dark-secondary' };
    }

    const endDate = new Date(warrantyDate);
    const today = new Date();
    
    endDate.setUTCHours(0, 0, 0, 0);
    today.setUTCHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setUTCDate(today.getUTCDate() + 30);

    if (endDate < today) {
        return { text: warrantyDate, className: 'text-red-400 font-semibold' }; // Expired
    }
    if (endDate <= thirtyDaysFromNow) {
        return { text: warrantyDate, className: 'text-yellow-400' }; // Expiring soon
    }
    return { text: warrantyDate, className: 'text-on-surface-dark' }; // Active
};

const SortableHeader: React.FC<{
    sortKey: SortableKeys;
    title: string;
    sortConfig: { key: SortableKeys; direction: 'ascending' | 'descending' } | null;
    requestSort: (key: SortableKeys) => void;
}> = ({ sortKey, title, sortConfig, requestSort }) => {
    const isSorted = sortConfig?.key === sortKey;
    const direction = isSorted ? sortConfig.direction : undefined;

    return (
        <th scope="col" className="px-6 py-3">
            <button onClick={() => requestSort(sortKey)} className="flex items-center gap-2 uppercase font-bold text-xs hover:text-white">
                {title}
                {isSorted ? (direction === 'ascending' ? <FaSortUp /> : <FaSortDown />) : <FaSort className="opacity-50" />}
            </button>
        </th>
    );
};


const EquipmentDashboard: React.FC<EquipmentDashboardProps> = ({ equipment, brands, equipmentTypes, brandMap, equipmentTypeMap, onAssign, onUnassign, onUpdateStatus, assignedEquipmentIds, onShowHistory, onEdit, onAssignMultiple, initialFilter, onClearInitialFilter, assignments, collaborators, entidades, onGenerateReport, onManageKeys }) => {
    const [filters, setFilters] = useState({ brandId: '', typeId: '', status: '', creationDateFrom: '', creationDateTo: '', description: '', serialNumber: '', nomeNaRede: '', collaboratorId: '' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    useEffect(() => {
        if (initialFilter) {
            const blankFilters = { brandId: '', typeId: '', status: '', creationDateFrom: '', creationDateTo: '', description: '', serialNumber: '', nomeNaRede: '', collaboratorId: '' };
            setFilters({ ...blankFilters, ...initialFilter });
        }
    }, [initialFilter]);
    
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const activeAssignmentsMap = useMemo(() => {
        const map = new Map<string, Assignment>();
        assignments.filter(a => !a.returnDate).forEach(a => {
            map.set(a.equipmentId, a);
        });
        return map;
    }, [assignments]);


    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        if (name !== 'collaboratorId') {
            onClearInitialFilter();
        }
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({ brandId: '', typeId: '', status: '', creationDateFrom: '', creationDateTo: '', description: '', serialNumber: '', nomeNaRede: '', collaboratorId: '' });
        onClearInitialFilter();
        setCurrentPage(1);
    };
    
    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };

    const equipmentWithAssignmentInfo = useMemo(() => {
        return equipment.map(eq => {
            const assignment = activeAssignmentsMap.get(eq.id);
            let assignedTo = '';
            if (assignment) {
                if (assignment.collaboratorId) {
                    assignedTo = collaboratorMap.get(assignment.collaboratorId) || 'Colaborador desconhecido';
                } else {
                    assignedTo = `Entidade: ${entidadeMap.get(assignment.entidadeId) || 'desconhecida'}`;
                }
            }
            return { ...eq, assignedTo, assignment };
        });
    }, [equipment, activeAssignmentsMap, collaboratorMap, entidadeMap]);

    const filteredEquipment = useMemo(() => {
        let filtered = equipmentWithAssignmentInfo;

        if (initialFilter?.collaboratorId) {
            filtered = equipmentWithAssignmentInfo.filter(e => e.assignment?.collaboratorId === initialFilter.collaboratorId);
        }

        filtered = filtered.filter(item => {
            const brandMatch = filters.brandId === '' || item.brandId === filters.brandId;
            const typeMatch = filters.typeId === '' || item.typeId === filters.typeId;
            const statusMatch = filters.status === '' || item.status === filters.status;
            const serialNumberMatch = filters.serialNumber === '' || item.serialNumber.toLowerCase().includes(filters.serialNumber.toLowerCase());
            const descriptionMatch = filters.description === '' || item.description.toLowerCase().includes(filters.description.toLowerCase());
            const nomeNaRedeMatch = filters.nomeNaRede === '' || (item.nomeNaRede && item.nomeNaRede.toLowerCase().includes(filters.nomeNaRede.toLowerCase()));
            const collaboratorMatch = filters.collaboratorId === '' || item.assignment?.collaboratorId === filters.collaboratorId;


            const creationDate = item.creationDate ? new Date(item.creationDate) : null;
            if (creationDate) {
                creationDate.setUTCHours(0,0,0,0);
            }

            const fromDateMatch = !filters.creationDateFrom || (creationDate && creationDate >= new Date(filters.creationDateFrom));
            const toDateMatch = !filters.creationDateTo || (creationDate && creationDate <= new Date(filters.creationDateTo));

            return brandMatch && typeMatch && statusMatch && serialNumberMatch && descriptionMatch && fromDateMatch && toDateMatch && nomeNaRedeMatch && collaboratorMatch;
        });

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'brand') {
                    aValue = brandMap.get(a.brandId) || '';
                    bValue = brandMap.get(b.brandId) || '';
                } else if (sortConfig.key === 'type') {
                    aValue = equipmentTypeMap.get(a.typeId) || '';
                    bValue = equipmentTypeMap.get(b.typeId) || '';
                } else if (sortConfig.key === 'assignedTo') {
                    aValue = a.assignedTo || '';
                    bValue = b.assignedTo || '';
                } else {
                    aValue = a[sortConfig.key as keyof Equipment];
                    bValue = b[sortConfig.key as keyof Equipment];
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }


        return filtered;
    }, [equipmentWithAssignmentInfo, filters, sortConfig, initialFilter, brandMap, equipmentTypeMap]);
    
    const stockEquipment = useMemo(() => filteredEquipment.filter(item => item.status === EquipmentStatus.Stock), [filteredEquipment]);
    
    const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
    const paginatedEquipment = useMemo(() => {
        return filteredEquipment.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredEquipment, currentPage, itemsPerPage]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSelect = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allStockIds = stockEquipment.map(item => item.id);
            setSelectedIds(new Set(allStockIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleAssignSelected = () => {
        if (onAssignMultiple) {
            const selectedEquipment = equipment.filter(e => selectedIds.has(e.id));
            onAssignMultiple(selectedEquipment);
            setSelectedIds(new Set());
        }
    };


    const handleStatusChange = (item: Equipment, newStatus: EquipmentStatus) => {
        if (!onUpdateStatus || !onAssign) return;

        const isCurrentlyAssigned = assignedEquipmentIds.has(item.id);

        if (newStatus === EquipmentStatus.Operational && !isCurrentlyAssigned) {
            onAssign(item);
            return;
        }

        onUpdateStatus(item.id, newStatus);
    };

    const handleMouseOver = (item: Equipment, event: React.MouseEvent) => {
        const warrantyInfo = getWarrantyStatus(item.warrantyEndDate);
        const content = (
            <div className="space-y-1">
                <p><strong className="text-on-surface-dark-secondary">Nº Inventário:</strong> {item.inventoryNumber || 'N/A'}</p>
                <p><strong className="text-on-surface-dark-secondary">Nº Fatura:</strong> {item.invoiceNumber || 'N/A'}</p>
                <p><strong className="text-on-surface-dark-secondary">Nome na Rede:</strong> {item.nomeNaRede || 'N/A'}</p>
                 <p><strong className="text-on-surface-dark-secondary">MAC WIFI:</strong> {item.macAddressWIFI || 'N/A'}</p>
                 <p><strong className="text-on-surface-dark-secondary">MAC Cabo:</strong> {item.macAddressCabo || 'N/A'}</p>
                <p><strong className="text-on-surface-dark-secondary">Garantia até:</strong> <span className={warrantyInfo.className}>{warrantyInfo.text}</span></p>
                <p><strong className="text-on-surface-dark-secondary">Última Modificação:</strong> {item.modifiedDate}</p>
                <hr className="border-gray-600 my-2"/>
                <p className="font-bold text-white text-xs uppercase">Classificação NIS2</p>
                <p><strong className="text-on-surface-dark-secondary">Confidencialidade:</strong> {item.confidentiality || 'N/A'}</p>
                <p><strong className="text-on-surface-dark-secondary">Integridade:</strong> {item.integrity || 'N/A'}</p>
                <p><strong className="text-on-surface-dark-secondary">Disponibilidade:</strong> {item.availability || 'N/A'}</p>
            </div>
        );

        setTooltip({
            visible: true,
            content: content,
            x: event.clientX,
            y: event.clientY,
        });
    };

    const handleMouseMove = (event: React.MouseEvent) => {
        if (tooltip?.visible) {
            setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
        }
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const initialFilterCollaboratorName = useMemo(() => {
        if (!initialFilter?.collaboratorId) return null;
        return collaborators.find(c => c.id === initialFilter.collaboratorId)?.fullName;
    }, [initialFilter, collaborators]);


  return (
    <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Inventário de Equipamentos</h2>
             <div className="flex items-center gap-2">
                {onGenerateReport && (
                    <button
                        onClick={onGenerateReport}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-brand-secondary text-white rounded-md hover:bg-brand-primary transition-colors"
                    >
                        <ReportIcon />
                        Gerar Relatório
                    </button>
                )}
                {onAssignMultiple && selectedIds.size > 0 && (
                    <button
                        onClick={handleAssignSelected}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                        <AssignIcon />
                        Atribuir Selecionados ({selectedIds.size})
                    </button>
                )}
            </div>
        </div>

        {initialFilterCollaboratorName && (
            <div className="bg-brand-primary/20 border border-brand-secondary/50 text-brand-secondary text-sm rounded-lg p-3 mb-6 flex justify-between items-center">
                <span>
                    A mostrar equipamentos atribuídos a: <strong className="text-white">{initialFilterCollaboratorName}</strong>
                </span>
                <button onClick={onClearInitialFilter} className="flex items-center gap-1 hover:text-white">
                    <XIcon className="h-4 w-4" />
                    Limpar Filtro
                </button>
            </div>
        )}

        <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <input type="text" id="serialNumberFilter" name="serialNumber" value={filters.serialNumber} onChange={handleFilterChange} placeholder="Filtrar por Nº Série..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary" />
                <input type="text" id="descriptionFilter" name="description" value={filters.description} onChange={handleFilterChange} placeholder="Filtrar por Descrição..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary" />
                <select id="brandFilter" name="brandId" value={filters.brandId} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary" >
                    <option value="">Todas as Marcas</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                 <select id="typeFilter" name="typeId" value={filters.typeId} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary" >
                    <option value="">Todos os Tipos</option>
                    {equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select id="statusFilter" name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary" >
                    <option value="">Todos os Estados</option>
                    {Object.values(EquipmentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select name="collaboratorId" value={filters.collaboratorId} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary">
                    <option value="">Todos os Colaboradores</option>
                    {collaborators.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
                <input type="date" id="creationDateFromFilter" name="creationDateFrom" value={filters.creationDateFrom} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary" />
                <input type="date" id="creationDateToFilter" name="creationDateTo" value={filters.creationDateTo} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary" />
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
          <thead className="text-xs text-on-surface-dark-secondary bg-gray-700/50">
            <tr>
              <th scope="col" className="px-4 py-3 w-12">
                 <input
                        type="checkbox"
                        className="rounded border-gray-500 bg-gray-700 text-brand-secondary focus:ring-brand-secondary"
                        onChange={handleSelectAll}
                        checked={stockEquipment.length > 0 && selectedIds.size === stockEquipment.length}
                        disabled={stockEquipment.length === 0}
                    />
              </th>
              <SortableHeader sortKey="description" title="Equipamento" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="serialNumber" title="Nº Série" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="assignedTo" title="Atribuído a" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="criticality" title="Criticidade" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="warrantyEndDate" title="Fim da Garantia" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="status" title="Estado" sortConfig={sortConfig} requestSort={requestSort} />
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEquipment.length > 0 ? paginatedEquipment.map((item) => {
                const warrantyInfo = getWarrantyStatus(item.warrantyEndDate);
                const isAssigned = assignedEquipmentIds.has(item.id);
                const isSelectable = item.status === EquipmentStatus.Stock;

                return (
              <tr 
                key={item.id} 
                className={`border-b border-gray-700 ${selectedIds.has(item.id) ? 'bg-brand-primary/10' : 'bg-surface-dark hover:bg-gray-800/50'}`}
                onMouseOver={(e) => handleMouseOver(item, e)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <td className="px-4 py-4">
                     <input
                        type="checkbox"
                        className="rounded border-gray-500 bg-gray-700 text-brand-secondary focus:ring-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        checked={selectedIds.has(item.id)}
                        onChange={() => handleSelect(item.id)}
                        disabled={!isSelectable}
                    />
                </td>
                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                  <div>{item.description}</div>
                  <div className="text-xs text-on-surface-dark-secondary">{brandMap.get(item.brandId)} / {equipmentTypeMap.get(item.typeId)}</div>
                </td>
                <td className="px-6 py-4">{item.serialNumber}</td>
                <td className="px-6 py-4">{item.assignedTo}</td>
                 <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getCriticalityClass(item.criticality || CriticalityLevel.Low)}`}>
                        {item.criticality || 'Baixa'}
                    </span>
                </td>
                <td className="px-6 py-4">
                    <span className={warrantyInfo.className}>{warrantyInfo.text}</span>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item, e.target.value as EquipmentStatus)}
                    className={`px-2 py-1 rounded-md text-xs border bg-transparent ${getStatusClass(item.status)} focus:outline-none focus:ring-2 focus:ring-brand-secondary disabled:cursor-not-allowed disabled:opacity-70`}
                    disabled={!onUpdateStatus}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Object.values(EquipmentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center gap-4">
                        {isAssigned ? (
                            <button onClick={(e) => { e.stopPropagation(); onUnassign && onUnassign(item.id); }} className="text-red-400 hover:text-red-300" title="Desassociar Equipamento">
                                <UnassignIcon />
                            </button>
                        ) : (
                            <button onClick={(e) => { e.stopPropagation(); onAssign && onAssign(item); }} className="text-green-400 hover:text-green-300" title="Atribuir Equipamento">
                                <AssignIcon />
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onShowHistory(item); }} className="text-gray-400 hover:text-white" title="Histórico do Equipamento">
                            <FaHistory />
                        </button>
                        {onManageKeys && (
                            <button onClick={(e) => { e.stopPropagation(); onManageKeys(item); }} className="text-yellow-400 hover:text-yellow-300" title="Gerir Licenças de Software">
                                <FaKey />
                            </button>
                        )}
                        {onEdit && (
                            <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="text-blue-400 hover:text-blue-300" title="Editar Equipamento">
                                <EditIcon />
                            </button>
                        )}
                    </div>
                </td>
              </tr>
            )
            }) : (
                <tr>
                    <td colSpan={9} className="text-center py-8 text-on-surface-dark-secondary">Nenhum equipamento encontrado com os filtros atuais.</td>
                </tr>
            )}
          </tbody>
        </table>
        {tooltip?.visible && (
            <div
                style={{
                    position: 'fixed',
                    top: tooltip.y + 15,
                    left: tooltip.x + 15,
                    pointerEvents: 'none',
                }}
                className="bg-gray-900 text-white text-sm rounded-md shadow-lg p-3 z-50 border border-gray-700 max-w-sm"
                role="tooltip"
            >
                {tooltip.content}
            </div>
        )}
      </div>
       <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={filteredEquipment.length}
        />
    </div>
  );
};

export default EquipmentDashboard;