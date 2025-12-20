
import React, { useState, useMemo } from 'react';
import { Policy, PolicyAcceptance, Collaborator } from '../types';
import { FaFileSignature, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaUsers } from 'react-icons/fa';
import Pagination from './common/Pagination';
import SortableHeader from './common/SortableHeader';

interface PolicyDashboardProps {
    policies: Policy[];
    acceptances: PolicyAcceptance[];
    collaborators: Collaborator[];
    onCreate?: () => void;
    onEdit?: (policy: Policy) => void;
    onDelete?: (id: string) => void;
}

const PolicyDashboard: React.FC<PolicyDashboardProps> = ({ policies, acceptances, collaborators, onCreate, onEdit, onDelete }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
        key: 'updated_at',
        direction: 'descending'
    });

    // Stats calculation
    // Fix: canLogin to can_login
    const totalUsers = collaborators.filter(c => c.can_login && c.status === 'Ativo').length;
    
    const getAcceptanceRate = (policyId: string, version: string) => {
        const count = acceptances.filter(a => a.policy_id === policyId && a.version === version).length;
        return Math.round((count / Math.max(totalUsers, 1)) * 100);
    };

    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedPolicies = useMemo(() => {
        const sorted = [...policies];
        sorted.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (sortConfig.key) {
                case 'title':
                    valA = a.title;
                    valB = b.title;
                    break;
                case 'version':
                    valA = parseFloat(a.version);
                    valB = parseFloat(b.version);
                    break;
                case 'status':
                    valA = a.is_active ? 1 : 0;
                    valB = b.is_active ? 1 : 0;
                    break;
                case 'acceptance_rate':
                    valA = getAcceptanceRate(a.id, a.version);
                    valB = getAcceptanceRate(b.id, b.version);
                    break;
                case 'updated_at':
                    valA = new Date(a.updated_at).getTime();
                    valB = new Date(b.updated_at).getTime();
                    break;
                default:
                    return 0;
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [policies, sortConfig, acceptances, totalUsers]);

    const totalPages = Math.ceil(sortedPolicies.length / itemsPerPage);
    const paginatedPolicies = useMemo(() => {
        return sortedPolicies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [sortedPolicies, currentPage, itemsPerPage]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FaFileSignature className="text-yellow-400"/> 
                        Políticas de Segurança (Governance)
                    </h2>
                    <p className="text-sm text-on-surface-dark-secondary mt-1">
                        Definição e controlo de aceitação das políticas de segurança da organização.
                    </p>
                </div>
                {onCreate && (
                    <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors shadow-lg">
                        <FaPlus /> Nova Política
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <SortableHeader label="Título da Política" sortKey="title" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Versão Atual" sortKey="version" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <SortableHeader label="Estado" sortKey="status" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <SortableHeader label="Taxa de Aceitação" sortKey="acceptance_rate" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <SortableHeader label="Última Atualização" sortKey="updated_at" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPolicies.length > 0 ? paginatedPolicies.map(policy => {
                            const acceptanceRate = getAcceptanceRate(policy.id, policy.version);
                            return (
                                <tr key={policy.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                                    <td className="px-6 py-4 font-medium text-white">
                                        {policy.title}
                                        {policy.is_mandatory && <span className="ml-2 text-xs bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30">Obrigatória</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">v{policy.version}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-xs rounded-full ${policy.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                            {policy.is_active ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-24 bg-gray-700 rounded-full h-2.5">
                                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${acceptanceRate}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold">{acceptanceRate}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-xs">
                                        {new Date(policy.updated_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-3">
                                            {onEdit && (
                                                <button onClick={() => onEdit(policy)} className="text-blue-400 hover:text-blue-300" title="Editar">
                                                    <FaEdit />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button onClick={() => onDelete(policy.id)} className="text-red-400 hover:text-red-300" title="Apagar">
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500">Nenhuma política definida.</td>
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
                totalItems={sortedPolicies.length}
            />
        </div>
    );
};

export default PolicyDashboard;
