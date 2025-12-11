import React, { useMemo, useState, useEffect } from 'react';
import { SoftwareLicense, LicenseAssignment, LicenseStatus, Equipment, Assignment, Collaborator, CriticalityLevel, BusinessService, ServiceDependency, SoftwareCategory } from '../types';
import { EditIcon, FaTrash as DeleteIcon, ReportIcon, PlusIcon, MailIcon, FaPrint } from './common/Icons';
import { FaToggleOn, FaToggleOff, FaChevronDown, FaChevronUp, FaLaptop, FaSort, FaSortUp, FaSortDown, FaTags } from 'react-icons/fa';
import Pagination from './common/Pagination';
import AddLicenseModal from './AddLicenseModal';
import * as dataService from '../services/dataService';


interface LicenseDashboardProps {
  licenses: SoftwareLicense[];
  licenseAssignments: LicenseAssignment[];
  equipmentData: Equipment[];
  assignments: Assignment[];
  collaborators: Collaborator[];
  brandMap: Map<string, string>;
  equipmentTypeMap: Map<string, string>;
  initialFilter?: any;
  onClearInitialFilter?: () => void;
  onEdit?: (license: SoftwareLicense) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onGenerateReport?: () => void;
  onCreate?: () => void;
  // BIA Props
  businessServices?: BusinessService[];
  serviceDependencies?: ServiceDependency[];
  softwareCategories?: SoftwareCategory[];
}

const getStatusClass = (status?: LicenseStatus) => {
    switch (status) {
        case LicenseStatus.Ativo: return 'bg-green-500/20 text-green-400';
        case LicenseStatus.Inativo: return 'bg-gray-500/20 text-gray-400';
        default: return 'bg-gray-500/20 text-gray-400';
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

type SortableKeys = 'productName' | 'licenseKey' | 'status' | 'usage' | 'purchaseDate' | 'expiryDate' | 'criticality';

const SortableHeader: React.FC<{
    sortKey: SortableKeys;
    title: string;
    sortConfig: { key: SortableKeys; direction: 'ascending' | 'descending' } | null;
    requestSort: (key: SortableKeys) => void;
    className?: string;
}> = ({ sortKey, title, sortConfig, requestSort, className }) => {
    const isSorted = sortConfig?.key === sortKey;
    const direction = isSorted ? sortConfig.direction : undefined;

    return (
        <th scope="col" className={`px-6 py-3 ${className || ''}`}>
            <button onClick={() => requestSort(sortKey)} className="flex items-center gap-2 uppercase font-bold text-xs hover:text-white">
                {title}
                {isSorted ? (direction === 'ascending' ? <FaSortUp /> : <FaSortDown />) : <FaSort className="opacity-50" />}
            </button>
        </th>
    );
};


export const LicenseDashboard: React.FC<LicenseDashboardProps> = ({ 
    licenses, 
    licenseAssignments, 
    equipmentData,
    assignments,
    collaborators,
    brandMap,
    equipmentTypeMap,
    onEdit, 
    onDelete, 
    onGenerateReport, 
    initialFilter, 
    onClearInitialFilter, 
    onToggleStatus,
    onCreate,
    businessServices,
    serviceDependencies,
    softwareCategories = []
}) => {
    
    const [filters, setFilters] = useState({ productName: '', licenseKey: '', status: '', invoiceNumber: '', categoryId: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [expandedLicenseId, setExpandedLicenseId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>(null);


    useEffect(() => {
        if (initialFilter) {
            const blankFilters = { productName: '', licenseKey: '', status: '', invoiceNumber: '', categoryId: '' };
            setFilters({ ...blankFilters, ...initialFilter });
        }
        setCurrentPage(1);
    }, [initialFilter]);

    const usedSeatsMap = useMemo(() => {
        return licenseAssignments.reduce((acc, assignment) => {
            acc.set(assignment.softwareLicenseId, (acc.get(assignment.softwareLicenseId) || 0) + 1);
            return acc;
        }, new Map<string, number>());
    }, [licenseAssignments]);
    
    const equipmentMap = useMemo(() => new Map(equipmentData.map(e => [e.id, e])), [equipmentData]);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const categoryMap = useMemo(() => new Map(softwareCategories.map(c => [c.id, c.name])), [softwareCategories]);

    const activeAssignmentsMap = useMemo(() => {
        const map = new Map<string, Assignment>();
        assignments.filter(a => !a.returnDate).forEach(a => map.set(a.equipmentId, a));
        return map;
    }, [assignments]);

    const assignmentsByLicense = useMemo(() => {
        const map = new Map<string, { equipment: Equipment, user?: string }[]>();
        // Track equipment IDs already added per license to avoid visual duplicates
        const addedEquipmentPerLicense = new Map<string, Set<string>>();

        licenseAssignments.forEach(la => {
            if (la.returnDate) return; // Skip non-active

            const eq = equipmentMap.get(la.equipmentId);
            if (eq) {
                if (!map.has(la.softwareLicenseId)) {
                    map.set(la.softwareLicenseId, []);
                    addedEquipmentPerLicense.set(la.softwareLicenseId, new Set());
                }
                
                const alreadyAdded = addedEquipmentPerLicense.get(la.softwareLicenseId)?.has(eq.id);
                if (!alreadyAdded) {
                    const activeAssignment = activeAssignmentsMap.get(eq.id);
                    const user = activeAssignment?.collaboratorId ? collaboratorMap.get(activeAssignment.collaboratorId) : undefined;
                    
                    map.get(la.softwareLicenseId)!.push({ equipment: eq, user });
                    addedEquipmentPerLicense.get(la.softwareLicenseId)!.add(eq.id);
                }
            }
        });
        return map;
    }, [licenseAssignments, equipmentMap, activeAssignmentsMap, collaboratorMap]);
    
    // Map licenses to critical services (BIA)
    const licenseCriticalityMap = useMemo(() => {
        const map = new Map<string, { level: CriticalityLevel, serviceName: string }>();
        if (serviceDependencies && businessServices) {
            serviceDependencies.forEach(dep => {
                if (dep.software_license_id) {
                    const service = businessServices.find(s => s.id === dep.service_id);
                    if (service) {
                         map.set(dep.software_license_id, { level: service.criticality, serviceName: service.name });
                    }
                }
            });
        }
        return map;
    }, [serviceDependencies, businessServices]);

    const handleToggleExpand = (licenseId: string) => {
        setExpandedLicenseId(prev => (prev === licenseId ? null : licenseId));
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        if (onClearInitialFilter) onClearInitialFilter();
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({ productName: '', licenseKey: '', status: '', invoiceNumber: '', categoryId: '' });
        if (onClearInitialFilter) onClearInitialFilter();
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };
    
    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const filteredLicenses = useMemo(() => {
        let items = licenses.filter(l => {
            const matchName = filters.productName === '' || l.productName.toLowerCase().includes(filters.productName.toLowerCase());
            const matchKey = filters.licenseKey === '' || l.licenseKey.toLowerCase().includes(filters.licenseKey.toLowerCase());
            const matchStatus = filters.status === '' || l.status === filters.status;
            const matchCategory = filters.categoryId === '' || l.category_id === filters.categoryId;
            return matchName && matchKey && matchStatus && matchCategory;
        });

        if (sortConfig) {
            items.sort((a, b) => {
                if (sortConfig.key === 'usage') {
                    const usageA = (usedSeatsMap.get(a.id) || 0) / (a.is_oem ? 1 : a.totalSeats);
                    const usageB = (usedSeatsMap.get(b.id) || 0) / (b.is_oem ? 1 : b.totalSeats);
                    return sortConfig.direction === 'ascending' ? usageA - usageB : usageB - usageA;
                }
                
                const valA = a[sortConfig.key as keyof SoftwareLicense];
                const valB = b[sortConfig.key as keyof SoftwareLicense];
                
                if (valA === undefined && valB === undefined) return 0;
                if (valA === undefined) return 1;
                if (valB === undefined) return -1;
                
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return items;
    }, [licenses, filters, sortConfig, usedSeatsMap]);

    const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage);
    const paginatedLicenses = useMemo(() => {
        return filteredLicenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredLicenses, currentPage, itemsPerPage]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FaTags className="text-yellow-500" />
                        Gestão de Licenças de Software
                    </h2>
                </div>
                <div className="flex gap-2">
                    {onGenerateReport && (
                        <button onClick={onGenerateReport} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors border border-gray-600">
                            <ReportIcon /> Relatório
                        </button>
                    )}
                    {onCreate && (
                        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors shadow-lg">
                            <PlusIcon /> Adicionar Licença
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
                <input
                    type="text"
                    name="productName"
                    value={filters.productName}
                    onChange={handleFilterChange}
                    placeholder="Filtrar por Produto..."
                    className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm flex-grow min-w-[200px]"
                />
                <input
                    type="text"
                    name="licenseKey"
                    value={filters.licenseKey}
                    onChange={handleFilterChange}
                    placeholder="Filtrar por Chave..."
                    className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm flex-grow min-w-[200px]"
                />
                <select
                    name="categoryId"
                    value={filters.categoryId}
                    onChange={handleFilterChange}
                    className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm w-40"
                >
                    <option value="">Todas as Categorias</option>
                    {softwareCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm w-32"
                >
                    <option value="">Todos os Estados</option>
                    {Object.values(LicenseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={clearFilters} className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500">
                    Limpar
                </button>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3 w-10"></th>
                            <SortableHeader sortKey="productName" title="Produto" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="licenseKey" title="Chave" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="usage" title="Uso" sortConfig={sortConfig} requestSort={requestSort} className="text-center" />
                            <SortableHeader sortKey="status" title="Estado" sortConfig={sortConfig} requestSort={requestSort} className="text-center" />
                            <SortableHeader sortKey="expiryDate" title="Validade" sortConfig={sortConfig} requestSort={requestSort} />
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedLicenses.length > 0 ? paginatedLicenses.map(license => {
                            const used = usedSeatsMap.get(license.id) || 0;
                            const isExpanded = expandedLicenseId === license.id;
                            const categoryName = categoryMap.get(license.category_id || '');
                            
                            return (
                                <React.Fragment key={license.id}>
                                    <tr className={`border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer ${isExpanded ? 'bg-gray-800/80' : ''}`} onClick={() => handleToggleExpand(license.id)}>
                                        <td className="px-4 py-4 text-center">
                                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            <div>{license.productName}</div>
                                            {categoryName && <div className="text-xs text-gray-400 mt-1">{categoryName}</div>}
                                            {license.is_oem && <span className="text-[10px] bg-purple-900 text-purple-200 px-1 rounded border border-purple-500 ml-2">OEM</span>}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{license.licenseKey}</td>
                                        <td className="px-6 py-4 text-center">
                                            {license.is_oem ? (
                                                <span className="text-blue-400 font-bold">{used} (Ilimitado)</span>
                                            ) : (
                                                <span className={`${used >= license.totalSeats ? 'text-red-400 font-bold' : 'text-green-400'}`}>
                                                    {used} / {license.totalSeats}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(license.status as LicenseStatus)}`}>
                                                {license.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {license.expiryDate || <span className="text-green-500">Vitalícia</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-3">
                                                {onToggleStatus && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onToggleStatus(license.id); }} 
                                                        className={`text-lg ${license.status === 'Ativo' ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
                                                    >
                                                        {license.status === 'Ativo' ? <FaToggleOn /> : <FaToggleOff />}
                                                    </button>
                                                )}
                                                {onEdit && (
                                                    <button onClick={(e) => { e.stopPropagation(); onEdit(license); }} className="text-blue-400 hover:text-blue-300"><EditIcon /></button>
                                                )}
                                                {onDelete && (
                                                    <button onClick={(e) => { e.stopPropagation(); onDelete(license.id); }} className="text-red-400 hover:text-red-300"><DeleteIcon /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-gray-900/30 border-b border-gray-700">
                                            <td colSpan={7} className="p-4">
                                                <div className="pl-12">
                                                    <h4 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2"><FaLaptop /> Equipamentos Associados ({assignmentsByLicense.get(license.id)?.length || 0})</h4>
                                                    {(assignmentsByLicense.get(license.id) || []).length > 0 ? (
                                                        <ul className="space-y-1 text-sm text-gray-300 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                                            {(assignmentsByLicense.get(license.id) || []).map((assign, idx) => (
                                                                <li key={idx} className="flex justify-between items-center bg-gray-800 p-2 rounded border border-gray-700">
                                                                    <span>{assign.equipment.description} <span className="text-gray-500 text-xs">({assign.equipment.serialNumber})</span></span>
                                                                    <span className="text-xs text-brand-secondary">{assign.user || 'Sem Utilizador'}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-gray-500 text-xs italic">Nenhum equipamento a utilizar esta licença.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        }) : (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">Nenhuma licença encontrada.</td>
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
                totalItems={filteredLicenses.length}
            />
        </div>
    );
};