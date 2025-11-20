import React, { useState, useMemo } from 'react';
import { BusinessService, Collaborator, CriticalityLevel, ServiceStatus, ServiceDependency } from '../types';
import { EditIcon, DeleteIcon, PlusIcon, FaSitemap } from './common/Icons';
import Pagination from './common/Pagination';
import { FaShieldAlt, FaNetworkWired } from 'react-icons/fa';

interface ServiceDashboardProps {
  services: BusinessService[];
  dependencies: ServiceDependency[];
  collaborators: Collaborator[];
  onEdit: (service: BusinessService) => void;
  onDelete: (id: string) => void;
  onManageDependencies: (service: BusinessService) => void;
  onCreate: () => void;
}

const getCriticalityClass = (level: CriticalityLevel) => {
    switch (level) {
        case CriticalityLevel.Critical: return 'text-red-400 font-bold border-red-500/50 bg-red-500/10';
        case CriticalityLevel.High: return 'text-orange-400 font-semibold border-orange-500/50 bg-orange-500/10';
        case CriticalityLevel.Medium: return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
        default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
    }
};

const ServiceDashboard: React.FC<ServiceDashboardProps> = ({ services, dependencies, collaborators, onEdit, onDelete, onManageDependencies, onCreate }) => {
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [filterCriticality, setFilterCriticality] = useState<string>('');
    
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    
    const dependencyCountMap = useMemo(() => {
        return dependencies.reduce((acc, dep) => {
            acc[dep.service_id] = (acc[dep.service_id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [dependencies]);

    const filteredServices = useMemo(() => {
        return services.filter(s => 
            filterCriticality === '' || s.criticality === filterCriticality
        ).sort((a,b) => {
            // Sort by criticality priority
            const priority = { [CriticalityLevel.Critical]: 3, [CriticalityLevel.High]: 2, [CriticalityLevel.Medium]: 1, [CriticalityLevel.Low]: 0 };
            return priority[b.criticality] - priority[a.criticality];
        });
    }, [services, filterCriticality]);

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
                    <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors">
                        <PlusIcon /> Novo Serviço
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nome do Serviço</th>
                            <th scope="col" className="px-6 py-3 text-center">Criticidade</th>
                            <th scope="col" className="px-6 py-3 text-center">RTO Alvo</th>
                            <th scope="col" className="px-6 py-3">Dono do Serviço</th>
                            <th scope="col" className="px-6 py-3 text-center">Dependências</th>
                            <th scope="col" className="px-6 py-3 text-center">Status</th>
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
                                        <button 
                                            onClick={() => onManageDependencies(service)} 
                                            className="text-indigo-400 hover:text-indigo-300" 
                                            title="Mapear Dependências (Ativos)"
                                        >
                                            <FaSitemap />
                                        </button>
                                        <button onClick={() => onEdit(service)} className="text-blue-400 hover:text-blue-300" title="Editar Serviço">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDelete(service.id)} className="text-red-400 hover:text-red-300" title="Excluir Serviço">
                                            <DeleteIcon />
                                        </button>
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