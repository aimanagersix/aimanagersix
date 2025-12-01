
import React, { useState, useMemo } from 'react';
import { ContinuityPlan, Collaborator, BusinessService } from '../types';
import { FaFileContract, FaPlus, FaFilter, FaCheckCircle, FaExclamationTriangle, FaClock, FaEdit, FaTrash } from './common/Icons';
import Pagination from './common/Pagination';

interface ContinuityPlanDashboardProps {
    plans: ContinuityPlan[];
    collaborators: Collaborator[];
    businessServices: BusinessService[];
    onCreate?: () => void;
    onEdit?: (plan: ContinuityPlan) => void;
    onDelete?: (id: string) => void;
}

const getReviewStatus = (dateStr?: string) => {
    if (!dateStr) return { text: 'N/A', className: 'text-gray-500' };
    const reviewDate = new Date(dateStr);
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(today.getDate() + 30);

    if (reviewDate < today) return { text: `Expirado (${dateStr})`, className: 'text-red-400 font-bold' };
    if (reviewDate <= thirtyDays) return { text: `Próximo (${dateStr})`, className: 'text-yellow-400' };
    return { text: dateStr, className: 'text-green-400' };
};

const ContinuityPlanDashboard: React.FC<ContinuityPlanDashboardProps> = ({ plans, collaborators, businessServices, onCreate, onEdit, onDelete }) => {
    const [filterType, setFilterType] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Maps for performance
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const serviceMap = useMemo(() => new Map(businessServices.map(s => [s.id, s.name])), [businessServices]);

    const filteredPlans = useMemo(() => {
        return plans.filter(p => 
            filterType === '' || p.type === filterType
        ).sort((a, b) => new Date(b.last_review_date).getTime() - new Date(a.last_review_date).getTime());
    }, [plans, filterType]);

    const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
    const paginatedPlans = useMemo(() => {
        return filteredPlans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredPlans, currentPage, itemsPerPage]);


    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FaFileContract className="text-yellow-500"/> 
                        Planos de Continuidade (BCP/DRP)
                    </h2>
                    <p className="text-sm text-on-surface-dark-secondary mt-1">
                        Gestão de planos de continuidade de negócio e recuperação de desastres.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                    >
                        <option value="">Todos os Tipos</option>
                        <option value="BCP">BCP</option>
                        <option value="DRP">DRP</option>
                        <option value="Crise">Plano de Crise</option>
                    </select>
                    {onCreate && (
                    <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors shadow-lg">
                        <FaPlus /> Novo Plano
                    </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3">Título do Plano</th>
                            <th className="px-6 py-3 text-center">Tipo</th>
                            <th className="px-6 py-3">Serviço Associado</th>
                            <th className="px-6 py-3">Responsável</th>
                            <th className="px-6 py-3">Última Revisão</th>
                            <th className="px-6 py-3">Próxima Revisão</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPlans.length > 0 ? paginatedPlans.map(plan => {
                            const reviewStatus = getReviewStatus(plan.next_review_date);
                            return (
                            <tr key={plan.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium text-white">
                                    {plan.title}
                                    {plan.document_url && <a href={plan.document_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-400 hover:underline text-xs">(Ver Doc)</a>}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs border border-gray-600">{plan.type}</span>
                                </td>
                                <td className="px-6 py-4">{plan.service_id ? serviceMap.get(plan.service_id) : '-'}</td>
                                <td className="px-6 py-4">{collaboratorMap.get(plan.owner_id) || 'N/A'}</td>
                                <td className="px-6 py-4">{new Date(plan.last_review_date).toLocaleDateString()}</td>
                                <td className={`px-6 py-4 ${reviewStatus.className}`}>{reviewStatus.text}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-3">
                                        {onEdit && (
                                            <button onClick={() => onEdit(plan)} className="text-blue-400 hover:text-blue-300" title="Editar">
                                                <FaEdit />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button onClick={() => onDelete(plan.id)} className="text-red-400 hover:text-red-300" title="Excluir">
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}) : (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">Nenhum plano de continuidade registado.</td>
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
                onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                totalItems={filteredPlans.length}
            />
        </div>
    );
};

export default ContinuityPlanDashboard;
