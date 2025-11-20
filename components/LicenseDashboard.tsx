
import React, { useMemo, useState, useEffect } from 'react';
import { SoftwareLicense, LicenseAssignment, LicenseStatus, Equipment, Assignment, Collaborator, CriticalityLevel, BusinessService, ServiceDependency } from '../types';
import { EditIcon, DeleteIcon, ReportIcon } from './common/Icons';
import { FaToggleOn, FaToggleOff, FaChevronDown, FaChevronUp, FaLaptop, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import Pagination from './common/Pagination';

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
  // BIA Props
  businessServices?: BusinessService[];
  serviceDependencies?: ServiceDependency[];
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
        case CriticalityLevel.Low: return 'bg-gray-600 text-white border-gray-700';
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


const LicenseDashboard: React.FC<LicenseDashboardProps> = ({ 
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
    businessServices,
    serviceDependencies
}) => {
    
    const [filters, setFilters] = useState({ productName: '', licenseKey: '', status: '', invoiceNumber: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [expandedLicenseId, setExpandedLicenseId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>(null);


    useEffect(() => {
        if (initialFilter) {
            const blankFilters = { productName: '', licenseKey: '', status: '', invoiceNumber: '' };
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
    const activeAssignmentsMap = useMemo(() => {
        const map = new Map<string, Assignment>();
        assignments.filter(a => !a.returnDate).forEach(a => map.set(a.equipmentId, a));
        return map;
    }, [assignments]);

    const assignmentsByLicense = useMemo(() => {
        const map = new Map<string, { equipment: Equipment, user?: string }[]>();
        licenseAssignments.forEach(la => {
            const eq = equipmentMap.get(la.equipmentId);
            if (eq) {
                if (!map.has(la.softwareLicenseId)) {
                    map.set(la.softwareLicenseId, []);
                }
                const activeAssignment = activeAssignmentsMap.get(eq.id);
                const user = activeAssignment?.collaboratorId ? collaboratorMap.get(activeAssignment.collaboratorId) : undefined;
                map.get(la.softwareLicenseId)!.push({ equipment: eq, user });
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
                         // Use the service if found. If multiple services use the same license, the last one processed wins visually
                         // (In a more complex version, we'd check for the highest criticality)
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
        onClearInitialFilter?.();
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({ productName: '', licenseKey: '', status: '', invoiceNumber: '' });
        onClearInitialFilter?.();
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


    const processedLicenses = useMemo(() => {
        let filtered = licenses.filter(license => {
            const nameMatch = filters.productName === '' || license.productName.toLowerCase().includes(filters.productName.toLowerCase());
            const keyMatch = filters.licenseKey === '' || license.licenseKey.toLowerCase().includes(filters.licenseKey.toLowerCase());
            const invoiceMatch = filters.invoiceNumber === '' || (license.invoiceNumber && license.invoiceNumber.toLowerCase().includes(filters.invoiceNumber.toLowerCase()));

            const statusMatch = (() => {
                if (!filters.status) return true;
                if (filters.status === LicenseStatus.Ativo) return (license.status || LicenseStatus.Ativo) === LicenseStatus.Ativo;
                if (filters.status === LicenseStatus.Inativo) return license.status === LicenseStatus.Inativo;
                const usedSeats = usedSeatsMap.get(license.id) || 0;
                const availableSeats = license.totalSeats - usedSeats;
                if (filters.status === 'available' && availableSeats <= 0) return false;
                if (filters.status === 'in_use' && usedSeats === 0) return false;
                if (filters.status === 'depleted' && availableSeats > 0) return false;
                return true;
            })();
            
            return nameMatch && keyMatch && invoiceMatch && statusMatch;
        });

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'usage') {
                    const aUsed = usedSeatsMap.get(a.id) || 0;
                    const bUsed = usedSeatsMap.get(b.id) || 0;
                    aValue = a.totalSeats > 0 ? aUsed / a.totalSeats : 0;
                    bValue = b.totalSeats > 0 ? bUsed / b.totalSeats : 0;
                } else {
                    aValue = a[sortConfig.key as keyof SoftwareLicense] ?? '';
                    bValue = b[sortConfig.key as keyof SoftwareLicense] ?? '';
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
    }, [licenses, filters, usedSeatsMap, sortConfig]);

    const totalPages = Math.ceil(processedLicenses.length / itemsPerPage);
    const paginatedLicenses = useMemo(() => {
        return processedLicenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [processedLicenses, currentPage, itemsPerPage]);


    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-xl font-semibold text-white">Gerenciar Licenças de Software</h2>
                 {onGenerateReport && (
                    <button
                        onClick={onGenerateReport}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-brand-secondary text-white rounded-md hover:bg-brand-primary transition-colors"
                    >
                        <ReportIcon />
                        Gerar Relatório
                    </button>
                )}
            </div>

            <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input type="text" id="productNameFilter" name="productName" value={filters.productName} onChange={handleFilterChange} placeholder="Filtrar por Produto..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary" />
                    <input type="text" id="licenseKeyFilter" name="licenseKey" value={filters.licenseKey} onChange={handleFilterChange} placeholder="Filtrar por Chave..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary" />
                    <input type="text" id="invoiceNumberFilter" name="invoiceNumber" value={filters.invoiceNumber} onChange={handleFilterChange} placeholder="Filtrar por Nº Fatura..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary" />
                    <select id="statusFilter" name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary">
                        <option value="">Todos os Estados</option>
                        <option value={LicenseStatus.Ativo}>Ativo</option>
                        <option value={LicenseStatus.Inativo}>Inativo</option>
                        <option value="available">Com Vagas</option>
                        <option value="in_use">Em Uso</option>
                        <option value="depleted">Esgotado</option>
                    </select>
                </div>
                 <div className="flex justify-end">
                    <button onClick={clearFilters} className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">
                        Limpar Filtros
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-2 py-3 w-12"></th>
                            <SortableHeader sortKey="productName" title="Nome do Produto" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="licenseKey" title="Chave de Licença" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="criticality" title="Criticidade" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="status" title="Status" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="usage" title="Uso (Total/Uso/Disp)" sortConfig={sortConfig} requestSort={requestSort} className="text-center" />
                            <SortableHeader sortKey="purchaseDate" title="Datas" sortConfig={sortConfig} requestSort={requestSort} />
                            <th scope="col" className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedLicenses.length > 0 ? paginatedLicenses.map((license) => {
                            const usedSeats = usedSeatsMap.get(license.id) || 0;
                            const availableSeats = license.totalSeats - usedSeats;
                            const status = license.status || LicenseStatus.Ativo;
                            const assignedDetails = assignmentsByLicense.get(license.id) || [];
                            const isExpanded = expandedLicenseId === license.id;
                            const biaInfo = licenseCriticalityMap.get(license.id);
                            
                            // Logic to disable delete button
                            const isDeleteDisabled = usedSeats > 0;

                            return (
                                <React.Fragment key={license.id}>
                                    <tr className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                                        <td className="px-2 py-4">
                                            {usedSeats > 0 && (
                                                <button onClick={() => handleToggleExpand(license.id)} className="text-gray-400 hover:text-white" aria-label={isExpanded ? "Esconder detalhes" : "Mostrar detalhes"}>
                                                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                                            <div className="flex items-center">
                                                {license.productName}
                                                {biaInfo && (
                                                    <span className="flex h-2 w-2 relative ml-2" title={`Suporta serviço crítico: ${biaInfo.serviceName} (${biaInfo.level})`}>
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono">{license.licenseKey}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full border ${getCriticalityClass(license.criticality || CriticalityLevel.Low)}`}>
                                                {license.criticality || 'Baixa'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(status)}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-semibold text-white">{license.totalSeats}</span> / <span>{usedSeats}</span> / <span className={`font-bold ${availableSeats > 0 ? 'text-green-400' : 'text-red-400'}`}>{availableSeats}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {license.purchaseDate && <div>Compra: {license.purchaseDate}</div>}
                                            {license.expiryDate && <div className="text-yellow-400">Expira: {license.expiryDate}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-4">
                                                {onToggleStatus && (
                                                    <button 
                                                        onClick={() => onToggleStatus(license.id)} 
                                                        className={`text-xl ${status === LicenseStatus.Ativo ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
                                                        title={status === LicenseStatus.Ativo ? 'Inativar' : 'Ativar'}
                                                    >
                                                        {status === LicenseStatus.Ativo ? <FaToggleOn /> : <FaToggleOff />}
                                                    </button>
                                                )}
                                                {onEdit && (
                                                    <button onClick={() => onEdit(license)} className="text-blue-400 hover:text-blue-300" aria-label={`Editar ${license.productName}`}>
                                                        <EditIcon />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            if (!isDeleteDisabled) onDelete(license.id); 
                                                        }} 
                                                        className={isDeleteDisabled ? "text-gray-600 opacity-30 cursor-not-allowed" : "text-red-400 hover:text-red-300"}
                                                        disabled={isDeleteDisabled}
                                                        title={isDeleteDisabled ? "Impossível excluir: Existem licenças em uso" : `Excluir ${license.productName}`}
                                                        aria-label={isDeleteDisabled ? "Exclusão desabilitada" : `Excluir ${license.productName}`}
                                                    >
                                                        <DeleteIcon />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-gray-900/50">
                                            <td colSpan={8} className="p-4">
                                                <h4 className="text-sm font-semibold text-white mb-3">Atribuído a:</h4>
                                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                                    {assignedDetails.map(({ equipment: eq, user }, index) => (
                                                        <div key={index} className="flex items-center gap-4 p-3 bg-surface-dark rounded-md border border-gray-700">
                                                            <div className="flex-shrink-0">
                                                                <FaLaptop className="h-6 w-6 text-brand-secondary" />
                                                            </div>
                                                            <div className="flex-grow text-sm">
                                                                <p className="font-semibold text-on-surface-dark">{eq.description}</p>
                                                                <p className="text-xs text-on-surface-dark-secondary">
                                                                    {brandMap.get(eq.brandId)} / {equipmentTypeMap.get(eq.typeId)}
                                                                </p>
                                                                <p className="text-xs font-mono text-gray-400">S/N: {eq.serialNumber}</p>
                                                            </div>
                                                            <div className="flex-shrink-0 text-right text-xs">
                                                                <p className="text-on-surface-dark-secondary">Utilizador:</p>
                                                                <p className="font-semibold text-on-surface-dark">{user || 'À Localização'}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        }) : (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-on-surface-dark-secondary">Nenhuma licença de software encontrada.</td>
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
                totalItems={processedLicenses.length}
            />
        </div>
    );
};

export default LicenseDashboard;
