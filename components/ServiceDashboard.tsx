import React, { useState, useMemo } from 'react';
import { BusinessService, Collaborator, CriticalityLevel, ServiceStatus, ServiceDependency } from '../types';
// FIX: Replaced non-existent DeleteIcon with an alias for FaTrash
import { EditIcon, FaTrash as DeleteIcon, PlusIcon, FaSitemap, ReportIcon } from './common/Icons';
import Pagination from './common/Pagination';
import { FaShieldAlt, FaNetworkWired } from 'react-icons/fa';
import SortableHeader from './common/SortableHeader';

interface ServiceDashboardProps {
  services: BusinessService[];
  dependencies: ServiceDependency[];
  collaborators: Collaborator[];
  onEdit?: (service: BusinessService) => void;
  onDelete?: (id: string) => void;
  onManageDependencies?: (service: BusinessService) => void;
  onCreate?: () => void;
  onGenerateReport?: () => void;
}

const getCriticalityClass = (level: CriticalityLevel) => {
    switch (level) {
        case CriticalityLevel.Critical: return 'text-red-400 font-bold border-red-500/50 bg-red-500/10';
        case CriticalityLevel.High: return 'text-orange-400 font-semibold border-orange-500/50 bg-orange-500/10';
        case CriticalityLevel.Medium: return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
        default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
    }
};

const ServiceDashboard: React.FC<ServiceDashboardProps> = ({ services, dependencies, collaborators, onEdit, onDelete, onManageDependencies, onCreate, onGenerateReport }) => {
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [filterCriticality, setFilterCriticality] = useState<string>('');
    
    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
        key: 'criticality',
        direction: 'descending'
    });

    // FIX: Updated property names to snake_case
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);
    
    const dependencyCountMap = useMemo(() => {
        return dependencies.reduce((acc, dep) => {
            acc[dep.service_id] = (acc[dep.service_id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [dependencies]);

    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const filteredServices = useMemo(() => {
        let filtered = services.filter(s => 
            filterCriticality === '' || s.criticality === filterCriticality
        );

        // Sorting Logic
        filtered.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            // Priority for risk level sorting
            const priority: Record<string, number> = { 
                [CriticalityLevel.Critical]: 4, 
                [CriticalityLevel.High]: 3, 
                [CriticalityLevel.Medium]: 2, 
                [CriticalityLevel.Low]: 1 
            };

            switch (sortConfig.key) {
                case 'criticality':
                    valA = priority[a.criticality || 'Baixa'] || 0;
                    valB = priority[b.criticality || 'Baixa'] || 0;
                    break;
                case 'owner':
                    valA = a.owner_id ? (collaboratorMap.get(a.owner_id) || '') : '';
                    valB = b.owner_id ? (collaboratorMap.get(b.owner_id) || '') : '';
                    break;
                case 'dependencies':
                    valA = dependencyCountMap[a.id] || 0;
                    valB = dependencyCountMap[b.id] || 0;
                    break;
                case 'rto':
                    // Simple string sort for RTO as parsing "4h" vs "24h" is tricky without standard format
                    valA = a.rto_goal || '';
                    valB = b.rto_goal || '';
                    break;
                default:
                    valA = a[sortConfig.key as keyof BusinessService];
                    valB = b[sortConfig.key as keyof BusinessService];
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [services, filterCriticality, sortConfig, collaboratorMap, dependencyCountMap]);

    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
    const paginatedServices = useMemo(() => {
        return filteredServices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredServices, currentPage, itemsPerPage]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FaNetworkWired className="text-brand-secondary"/> 
                        Análise de Impacto no Negócio (BIA)
                    </h2>
                    <p className="text-sm text-on-surface-dark-secondary mt-1">
                        Gerencie os serviços críticos da organização e mapeie as dependências de TI (NIS2).
                    </p>
                </div>
                <div className="flex items-center gap-4">
                     <select
                        value={filterCriticality}
                        onChange={(e) => setFilterCriticality(e.target.value)}
                        className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                    >
                        <option value="">Todas as Criticidades</option>
                        {Object.values(CriticalityLevel).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                     {onGenerateReport && (
                     <button
                        onClick={onGenerateReport}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors border border-gray-600"
                    >
                        <ReportIcon />
                        Relatório BIA
                    </button>
                    )}
                    {onCreate && (
                    <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors">
                        <PlusIcon /> Novo Serviço
                    </button>
                    )}
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <SortableHeader label="Nome do Serviço" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Criticidade" sortKey="criticality" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <SortableHeader label="RTO Alvo" sortKey="rto" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <SortableHeader label="Dono do Serviço" sortKey="owner" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Dependências" sortKey="dependencies" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <th scope="col" className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedServices.length > 0 ? paginatedServices.map((service) => (
                            <tr key={service.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium text-on-surface-dark">
                                    {service.name}
                                    {service.description && <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{service.description}</p>}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 text-xs rounded border ${getCriticalityClass(service.criticality)}`}>
                                        {service.criticality}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center font-mono text-white">
                                    {service.rto_goal || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    {service.owner_id ? collaboratorMap.get(service.owner_id) : <span className="text-gray-600 italic">Não atribuído</span>}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-gray-700 px-2 py-1 rounded-full text-xs text-white">
                                        {dependencyCountMap[service.id] || 0}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-xs ${service.status === ServiceStatus.Ativo ? 'text-green-400' : 'text-red-400'}`}>
                                        {service.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center items-center gap-4">
                                        {onManageDependencies && (
                                        <button 
                                            onClick={() => onManageDependencies(service)} 
                                            className="text-indigo-400 hover:text-indigo-300" 
                                            title="Mapear Dependências (Ativos)"
                                        >
                                            <FaSitemap />
                                        </button>
                                        )}
                                        {onEdit && (
                                        <button onClick={() => onEdit(service)} className="text-blue-400 hover:text-blue-300" title="Editar Serviço">
                                            <EditIcon />
                                        </button>
                                        )}
                                        {onDelete && (
                                        <button onClick={() => onDelete(service.id)} className="text-red-400 hover:text-red-300" title="Excluir Serviço">
                                            <DeleteIcon />
                                        </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-on-surface-dark-secondary">
                                    Nenhum serviço de negócio registado.
                                </td>
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
                onItemsPerPageChange={setItemsPerPage}
                totalItems={filteredServices.length}
            />
        </div>
    );
};

export default ServiceDashboard;