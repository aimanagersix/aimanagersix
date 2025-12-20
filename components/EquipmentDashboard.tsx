import React, { useState, useMemo, useEffect } from 'react';
import { Equipment, EquipmentStatus, EquipmentType, Brand, Assignment, Collaborator, Entidade, CriticalityLevel, BusinessService, ServiceDependency, SoftwareLicense, LicenseAssignment, Vulnerability, Supplier, TooltipConfig, defaultTooltipConfig, ConfigItem, Instituicao, ProcurementRequest } from '../types';
import { AssignIcon, ReportIcon, UnassignIcon, EditIcon, FaKey, PlusIcon, FaFileImport, XIcon, FaHistory, FaSort, FaSortUp, FaSortDown, FaRobot, FaCopy, FaTrash } from './common/Icons';
import Pagination from './common/Pagination';
import EquipmentHistoryModal from './EquipmentHistoryModal';
import * as dataService from '../services/dataService';
import SortableHeader from './common/SortableHeader';

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
  onAssignMultiple?: (equipment: Equipment[]) => void;
  onUnassign?: (equipmentId: string) => void;
  onUpdateStatus?: (id: string, status: EquipmentStatus) => void;
  onShowHistory: (equipment: Equipment) => void;
  onEdit?: (equipment: Equipment) => void;
  onDelete?: (id: string) => void; 
  onClone?: (equipment: Equipment) => void;
  onGenerateReport?: () => void;
  onManageKeys?: (equipment: Equipment) => void;
  onCreate?: () => void;
  onImportAgent?: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  businessServices?: BusinessService[];
  serviceDependencies?: ServiceDependency[];
  tickets?: any[];
  ticketActivities?: any[];
  softwareLicenses?: SoftwareLicense[];
  licenseAssignments?: LicenseAssignment[];
  vulnerabilities?: Vulnerability[];
  suppliers?: Supplier[];
  procurementRequests?: ProcurementRequest[];
  tooltipConfig?: TooltipConfig;
  onViewItem?: (tab: string, filter: any) => void;
  accountingCategories?: ConfigItem[];
  conservationStates?: ConfigItem[];
  totalItems?: number;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  sort?: { key: string, direction: 'ascending' | 'descending' };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSortChange?: (sort: { key: string, direction: 'ascending' | 'descending' }) => void;
  onFilterChange?: (filter: any) => void;
}

interface TooltipState {
    visible: boolean;
    content: React.ReactNode;
    x: number;
    y: number;
}

const getStatusClass = (status: string) => {
    switch (status) {
        case 'Operacional': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'Stock': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'Garantia': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'Abate': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'Empréstimo': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        case 'Retirado (Arquivo)': return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
        default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
};

const getCriticalityClass = (level?: CriticalityLevel) => {
    switch (level) {
        case CriticalityLevel.Critical: return 'bg-red-600 text-white border-red-700';
        case CriticalityLevel.High: return 'bg-orange-600 text-white border-orange-700';
        case CriticalityLevel.Medium: return 'bg-yellow-600 text-white border-yellow-700';
        case CriticalityLevel.Low: return 'bg-green-600 text-white border-green-700';
        default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
};

const getWarrantyStatus = (warrantyDate?: string): { text: string, className: string } => {
    if (!warrantyDate) return { text: 'N/A', className: 'text-on-surface-dark-secondary' };
    const endDate = new Date(warrantyDate);
    const today = new Date();
    endDate.setUTCHours(0, 0, 0, 0);
    today.setUTCHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setUTCDate(today.getUTCDate() + 30);
    if (endDate < today) return { text: warrantyDate, className: 'text-red-400 font-semibold' }; 
    if (endDate <= thirtyDaysFromNow) return { text: warrantyDate, className: 'text-yellow-400' }; 
    return { text: warrantyDate, className: 'text-on-surface-dark' }; 
};

const EquipmentDashboard: React.FC<EquipmentDashboardProps> = ({ 
    equipment, brands, equipmentTypes, brandMap, equipmentTypeMap, onAssign, onUnassign, onUpdateStatus, assignedEquipmentIds, onShowHistory, onEdit, onDelete, onClone, onAssignMultiple, initialFilter, onClearInitialFilter, assignments, collaborators, entidades, onGenerateReport, onManageKeys, onCreate, onImportAgent,
    businessServices, serviceDependencies, tickets = [], ticketActivities = [], tooltipConfig = defaultTooltipConfig, softwareLicenses, licenseAssignments, vulnerabilities, suppliers, procurementRequests, onViewItem,
    accountingCategories = [], conservationStates = [],
    totalItems = 0, loading = false, page = 1, pageSize = 20, sort, onPageChange, onPageSizeChange, onSortChange, onFilterChange
}) => {
    const [filters, setFilters] = useState({ 
        brandId: '', 
        typeId: '', 
        status: '', 
        description: '', 
        serial_number: '', 
        nome_na_rede: '', 
        collaborator_id: '',
        criticality: '',
        creationDateFrom: '',
        creationDateTo: '',
        warrantyDateFrom: '',
        warrantyDateTo: ''
    });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const [detailEquipment, setDetailEquipment] = useState<Equipment | null>(null);
    const [statusColors, setStatusColors] = useState<Record<string, string>>({});
    const [statusOptions, setStatusOptions] = useState<string[]>(Object.values(EquipmentStatus));

    useEffect(() => {
        const loadConfig = async () => {
            const data = await dataService.fetchAllData();
            const colors: Record<string, string> = {};
            const dynamicStatuses: string[] = [];
            data.configEquipmentStatuses.forEach((s: ConfigItem) => {
                if (s.color) colors[s.name] = s.color;
                dynamicStatuses.push(s.name);
            });
            setStatusColors(colors);
            if (dynamicStatuses.length > 0) {
                const merged = Array.from(new Set([...Object.values(EquipmentStatus), ...dynamicStatuses]));
                setStatusOptions(merged);
            }
        };
        loadConfig();
    }, []);
    
    useEffect(() => {
        if (initialFilter) setFilters(prev => ({ ...prev, ...initialFilter }));
    }, [initialFilter]);
    
    // FIX: Updated property names to snake_case
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const activeAssignmentsMap = useMemo(() => {
        const map = new Map<string, Assignment>();
        // FIX: Updated property names to snake_case
        assignments.filter(a => !a.return_date).forEach(a => map.set(a.equipment_id, a));
        return map;
    }, [assignments]);
    
    const equipmentDependencies = useMemo(() => {
        const deps = new Set<string>();
        // FIX: Updated property names to snake_case
        serviceDependencies?.forEach(d => { if (d.equipment_id) deps.add(d.equipment_id); });
        tickets?.forEach(t => { if (t.equipment_id && t.status !== 'Finalizado' && t.status !== 'Cancelado') deps.add(t.equipment_id); });
        licenseAssignments?.forEach(la => { if (la.equipment_id && !la.return_date) deps.add(la.equipment_id); });
        equipment.forEach(e => { if (e.parent_equipment_id) deps.add(e.parent_equipment_id); });
        return deps;
    }, [serviceDependencies, tickets, licenseAssignments, equipment]);
    
    const equipmentCriticalityMap = useMemo(() => {
        const map = new Map<string, CriticalityLevel>();
        if (serviceDependencies && businessServices) {
            serviceDependencies.forEach(dep => {
                if (dep.equipment_id) {
                    const service = businessServices.find(s => s.id === dep.service_id);
                    if (service) map.set(dep.equipment_id, service.criticality);
                }
            });
        }
        return map;
    }, [serviceDependencies, businessServices]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        if (onFilterChange) onFilterChange(newFilters);
        if (onPageChange) onPageChange(1);
    };

    const clearFilters = () => {
        const blank = { 
            brandId: '', 
            typeId: '', 
            status: '', 
            description: '', 
            serial_number: '', 
            nome_na_rede: '', 
            collaborator_id: '', 
            criticality: '',
            creationDateFrom: '',
            creationDateTo: '',
            warrantyDateFrom: '',
            warrantyDateTo: ''
        };
        setFilters(blank);
        if (onFilterChange) onFilterChange(blank);
        onClearInitialFilter();
        if (onPageChange) onPageChange(1);
    };

    const requestSort = (key: string) => {
        if (!onSortChange) return;
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sort && sort.key === key && sort.direction === 'ascending') direction = 'descending';
        onSortChange({ key, direction });
    };

    const handleSelect = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const stockIds = equipment.filter(e => e.status === EquipmentStatus.Stock).map(e => e.id);
            setSelectedIds(new Set(stockIds));
        } else setSelectedIds(new Set());
    };

    const handleStatusChange = async (item: Equipment, newStatus: EquipmentStatus) => {
        if (!onUpdateStatus || !onAssign || !onUnassign) return;
        
        if (newStatus === 'Abate' || newStatus === 'Retirado (Arquivo)') {
            alert(`Para colocar em "${newStatus}", utilize o botão Editar (lápis) para selecionar obrigatoriamente o Motivo de Saída.`);
            return;
        }

        const isCurrentlyAssigned = assignedEquipmentIds.has(item.id);
        
        // 1. Se mudar para Operacional e NÃO estiver atribuído, abre modal de atribuição
        if (newStatus === EquipmentStatus.Operacional && !isCurrentlyAssigned) {
            onAssign(item);
            return;
        }

        // 2. Se mudar para Stock e ESTIVER atribuído, força a desassociação automática (Requisito 2)
        if (newStatus === EquipmentStatus.Stock && isCurrentlyAssigned) {
            if (confirm(`Ao mudar para 'Stock', o equipamento será automaticamente desassociado do atual detentor. Deseja continuar?`)) {
                await onUnassign(item.id);
            } else {
                return; // Cancela a mudança
            }
        }

        onUpdateStatus(item.id, newStatus);
    };

    const handleAssignSelected = () => {
        if (onAssignMultiple) {
            const selectedEquipment = equipment.filter(e => selectedIds.has(e.id));
            onAssignMultiple(selectedEquipment);
        }
    };

    const handleMouseOver = (item: Equipment, assignedTo: string, event: React.MouseEvent) => {
        const cfg = { ...defaultTooltipConfig, ...tooltipConfig };
        const content = (
            <div className="text-xs leading-tight space-y-1">
                {/* FIX: Updated property names to snake_case */}
                {cfg.show_nome_na_rede && <p><strong className="text-on-surface-dark-secondary">Nome na Rede:</strong> <span className="text-white">{item.nome_na_rede || 'N/A'}</span></p>}
                {cfg.show_assigned_to && <p><strong className="text-on-surface-dark-secondary">Atribuído a:</strong> <span className="text-white">{assignedTo || 'Stock'}</span></p>}
                {/* FIX: Updated property names to snake_case */}
                {cfg.show_serial_number && <p><strong className="text-on-surface-dark-secondary">Nº Série:</strong> <span className="text-white">{item.serial_number || 'N/A'}</span></p>}
                {/* FIX: Updated property names to snake_case */}
                {item.is_loan && <p className="text-purple-400 font-bold">Equipamento de Empréstimo</p>}
            </div>
        );
        setTooltip({ visible: true, content: content, x: event.clientX, y: event.clientY });
    };

    const handleMouseMove = (event: React.MouseEvent) => {
        if (tooltip?.visible) setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
    };

    const handleMouseLeave = () => setTooltip(null);

  return (
    <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-xl font-semibold text-white">Inventário de Equipamentos</h2>
             <div className="flex items-center gap-2">
                {onImportAgent && onCreate && (
                     <label className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors cursor-pointer shadow-lg">
                        <FaRobot /> Importar JSON Agente
                        <input type="file" accept=".json" className="hidden" onChange={onImportAgent} onClick={(e) => (e.target as HTMLInputElement).value = ''} />
                    </label>
                )}
                {onGenerateReport && (
                    <button onClick={onGenerateReport} className="flex items-center gap-2 px-3 py-2 text-sm bg-brand-secondary text-white rounded-md hover:bg-brand-primary transition-colors">
                        <ReportIcon /> Relatório
                    </button>
                )}
                {onAssignMultiple && selectedIds.size > 0 && (
                    <button onClick={handleAssignSelected} className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                        <AssignIcon /> Atribuir Selecionados ({selectedIds.size})
                    </button>
                )}
                {onCreate && (
                    <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors">
                        <PlusIcon /> Adicionar
                    </button>
                )}
            </div>
        </div>

        {/* --- FILTROS AVANÇADOS --- */}
        <div className="space-y-4 mb-6 bg-gray-900/40 p-4 rounded-lg border border-gray-700/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <input type="text" name="serial_number" value={filters.serial_number} onChange={handleFilterChange} placeholder="Filtrar por Nº Série..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm" />
                <input type="text" name="description" value={filters.description} onChange={handleFilterChange} placeholder="Filtrar por Descrição..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm" />
                <select name="brandId" value={filters.brandId} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                    <option value="">Todas as Marcas</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                 <select name="typeId" value={filters.typeId} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                    <option value="">Todos os Tipos</option>
                    {equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                    <option value="">Todos os Estados</option>
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select name="criticality" value={filters.criticality} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                    <option value="">Todas as Criticidades</option>
                    {Object.values(CriticalityLevel).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {/* FIX: Updated property names to snake_case */}
                <select name="collaborator_id" value={filters.collaborator_id} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                    <option value="">Atribuído a (Qualquer)</option>
                    {collaborators.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
                <div className="flex gap-2">
                    <button onClick={clearFilters} className="flex-1 px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">Limpar Tudo</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold text-gray-500">Intervalo de Inserção</label>
                    <div className="flex items-center gap-2">
                        <input type="date" name="creationDateFrom" value={filters.creationDateFrom} onChange={handleFilterChange} className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-xs" />
                        <span className="text-gray-600 text-xs">até</span>
                        <input type="date" name="creationDateTo" value={filters.creationDateTo} onChange={handleFilterChange} className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-xs" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold text-gray-500">Intervalo de Garantia</label>
                    <div className="flex items-center gap-2">
                        <input type="date" name="warrantyDateFrom" value={filters.warrantyDateFrom} onChange={handleFilterChange} className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-xs" />
                        <span className="text-gray-600 text-xs">até</span>
                        <input type="date" name="warrantyDateTo" value={filters.warrantyDateTo} onChange={handleFilterChange} className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-xs" />
                    </div>
                </div>
            </div>
        </div>
      
      <div className="overflow-x-auto min-h-[400px]">
        {loading ? (
             <div className="flex justify-center items-center h-64 text-gray-400">A carregar dados...</div>
        ) : (
            <table className="w-full text-sm text-left text-on-surface-dark-secondary">
            <thead className="text-xs text-on-surface-dark-secondary bg-gray-700/50">
                <tr>
                <th scope="col" className="px-4 py-3 w-12">
                    <input type="checkbox" className="rounded bg-gray-700 text-brand-secondary" onChange={handleSelectAll} />
                </th>
                <SortableHeader label="Equipamento" sortKey="description" currentSort={sort || { key: 'creation_date', direction: 'descending' }} onSort={requestSort} />
                {/* FIX: Updated property names to snake_case */}
                <SortableHeader label="Nº Série" sortKey="serial_number" currentSort={sort || { key: 'creation_date', direction: 'descending' }} onSort={requestSort} />
                <th scope="col" className="px-6 py-3">Atribuído a</th>
                <SortableHeader label="Criticidade" sortKey="criticality" currentSort={sort || { key: 'creation_date', direction: 'descending' }} onSort={requestSort} />
                {/* FIX: Updated property names to snake_case */}
                <SortableHeader label="Garantia" sortKey="warranty_end_date" currentSort={sort || { key: 'creation_date', direction: 'descending' }} onSort={requestSort} />
                <SortableHeader label="Estado" sortKey="status" currentSort={sort || { key: 'creation_date', direction: 'descending' }} onSort={requestSort} />
                <th scope="col" className="px-6 py-3 text-center">Ações</th>
                </tr>
            </thead>
            <tbody>
                {equipment.length > 0 ? equipment.map((item) => {
                    const assignment = activeAssignmentsMap.get(item.id);
                    let assignedTo = '';
                    if (assignment) {
                        // FIX: Updated property names to snake_case
                        if (assignment.collaborator_id) assignedTo = collaboratorMap.get(assignment.collaborator_id) || 'Colaborador';
                        else if (assignment.entidade_id) assignedTo = entidadeMap.get(assignment.entidade_id) || 'Entidade';
                    }
                    // FIX: Updated property names to snake_case
                    const warrantyInfo = getWarrantyStatus(item.warranty_end_date);
                    const isAssigned = assignedEquipmentIds.has(item.id);
                    const linkedServiceCriticality = equipmentCriticalityMap.get(item.id);
                    const customColor = statusColors[item.status];
                    const statusStyle = customColor ? { backgroundColor: `${customColor}33`, color: customColor, borderColor: `${customColor}66` } : undefined;
                    const hasDeps = equipmentDependencies.has(item.id);
                    const canDelete = onDelete && !isAssigned && !hasDeps;

                    return (
                    <tr 
                        key={item.id} 
                        className={`border-b border-gray-700 ${selectedIds.has(item.id) ? 'bg-brand-primary/10' : 'bg-surface-dark hover:bg-gray-800/50'} cursor-pointer`}
                        onMouseOver={(e) => handleMouseOver(item, assignedTo, e)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => setDetailEquipment(item)}
                    >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="rounded bg-gray-700 text-brand-secondary" checked={selectedIds.has(item.id)} onChange={() => handleSelect(item.id)} disabled={item.status !== EquipmentStatus.Stock} />
                        </td>
                        <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                            <div className="flex items-center gap-2">
                                {item.description}
                                {linkedServiceCriticality && <span className="flex h-2 w-2 relative" title="Crítico"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                                {/* FIX: Updated property names to snake_case */}
                                {item.is_loan && <span className="text-[10px] bg-purple-900/30 text-purple-300 px-1 rounded border border-purple-500/30">LOAN</span>}
                            </div>
                            {/* FIX: Updated property names to snake_case */}
                            <div className="text-xs text-on-surface-dark-secondary">{brandMap.get(item.brand_id) || ''} / {equipmentTypeMap.get(item.type_id) || ''}</div>
                        </td>
                        {/* FIX: Updated property names to snake_case */}
                        <td className="px-6 py-4">{item.serial_number}</td>
                        <td className="px-6 py-4">{assignedTo}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full border ${getCriticalityClass(item.criticality || CriticalityLevel.Low)}`}>{item.criticality || 'Baixa'}</span>
                        </td>
                        <td className="px-6 py-4"><span className={warrantyInfo.className}>{warrantyInfo.text}</span></td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                             <select value={item.status} onChange={(e) => handleStatusChange(item, e.target.value as EquipmentStatus)} className={`px-2 py-1 rounded-md text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-brand-secondary cursor-pointer ${customColor ? 'border-transparent' : getStatusClass(item.status)}`} style={statusStyle ? statusStyle : (customColor ? {} : { backgroundColor: '#1f2937', color: '#e5e7eb', borderColor: '#4b5563' })} disabled={!onUpdateStatus}>
                                {statusOptions.map(s => <option key={s} value={s} className="bg-gray-800 text-white">{s}</option>)}
                            </select>
                        </td>
                        <td className="px-6 py-4 text-center">
                            <div className="flex justify-center items-center gap-3">
                                {isAssigned ? (
                                    <button onClick={(e) => { e.stopPropagation(); if(window.confirm("Desassociar?")) onUnassign && onUnassign(item.id); }} className="text-red-400 hover:text-red-300" title="Desassociar"><UnassignIcon /></button>
                                ) : (
                                    <button onClick={(e) => { e.stopPropagation(); onAssign && onAssign(item); }} className="text-green-400 hover:text-green-300" title="Atribuir"><AssignIcon /></button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); onShowHistory(item); }} className="text-teal-400 hover:text-teal-300" title="Histórico"><FaHistory /></button>
                                {onManageKeys && (
                                    <button onClick={(e) => { e.stopPropagation(); onManageKeys(item); }} className="text-yellow-400 hover:text-yellow-300" title="Gerir Licenças"><FaKey /></button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); onEdit && onEdit(item); }} className="text-blue-400 hover:text-blue-300" title="Editar"><EditIcon /></button>
                                <button onClick={(e) => { e.stopPropagation(); onClone && onClone(item); }} className="text-indigo-400 hover:text-indigo-300" title="Clonar"><FaCopy /></button>
                                {onDelete && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if(confirm("Deseja apagar este equipamento?")) onDelete(item.id); }} 
                                        className={`${canDelete ? 'text-red-400 hover:text-red-300' : 'text-gray-600 opacity-30 cursor-not-allowed'}`} 
                                        disabled={!canDelete}
                                        title={canDelete ? "Eliminar" : "Impossível eliminar: Existem registos associados"}
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                    )
                }) : (
                    <tr><td colSpan={9} className="text-center py-8 text-on-surface-dark-secondary">Nenhum equipamento encontrado.</td></tr>
                )}
            </tbody>
            </table>
        )}
        {tooltip?.visible && (
            <div style={{ position: 'fixed', top: tooltip.y + 15, left: tooltip.x + 15, pointerEvents: 'none' }} className="bg-gray-900 text-white text-sm rounded-md shadow-lg p-3 z-50 border border-gray-700 max-w-sm">
                {tooltip.content}
            </div>
        )}
      </div>
       <Pagination currentPage={page || 1} totalPages={Math.ceil((totalItems || 0) / (pageSize || 20))} onPageChange={(p) => onPageChange && onPageChange(p)} itemsPerPage={pageSize || 20} onItemsPerPageChange={(s) => onPageSizeChange && onPageSizeChange(s)} totalItems={totalItems || 0} />
        {detailEquipment && (
            <EquipmentHistoryModal 
                equipment={detailEquipment} assignments={assignments} collaborators={collaborators} escolasDepartamentos={entidades} tickets={tickets} ticketActivities={ticketActivities} onClose={() => setDetailEquipment(null)} onEdit={(eq) => { setDetailEquipment(null); if (onEdit) { onEdit(eq); } }}
                businessServices={businessServices} serviceDependencies={serviceDependencies} softwareLicenses={softwareLicenses} licenseAssignments={licenseAssignments} vulnerabilities={vulnerabilities} suppliers={suppliers} procurementRequests={procurementRequests} onViewItem={onViewItem} accountingCategories={accountingCategories} conservationStates={conservationStates}
            />
        )}
    </div>
  );
};

export default EquipmentDashboard;