
import React, { useState, useMemo } from 'react';
import { ContinuityPlan, Collaborator, BusinessService } from '../types';
// FIX: Import FaEdit and FaTrash icons
import { FaFileContract, FaPlus, FaFilter, FaCheckCircle, FaExclamationTriangle, FaClock, FaEdit, FaTrash } from 'react-icons/fa';
import AddContinuityPlanModal from './AddContinuityPlanModal';
import * as dataService from '../services/dataService';

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
    const [showAddModal, setShowAddModal] = useState(false);
    const [planToEdit, setPlanToEdit] = useState<ContinuityPlan | null>(null);

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const serviceMap = useMemo(() => new Map(businessServices.map(s => [s.id, s.name])), [businessServices]);

    const filteredPlans = useMemo(() => {
        return plans.filter(p => filterType === '' || p.type === filterType)
            .sort((a, b) => new Date(a.last_review_date).getTime() - new Date(b.last_review_date).getTime());
    }, [plans, filterType]);

    const handleSavePlan = async (plan: any) => {
        try {
            if (planToEdit) {
                await dataService.updateContinuityPlan(planToEdit.id, plan);
            } else {
                await dataService.addContinuityPlan(plan);
            }
            window.location.reload(); 
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar o plano.");
        }
    };
    
    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FaFileContract className="text-blue-400"/> Gestão de Continuidade de Negócio
                    </h2>
                    <p className="text-sm text-on-surface-dark-secondary mt-1">
                        Repositório central de Planos de Continuidade (BCP) e Recuperação de Desastres (DRP).
                    </p>
                </div>
                {onCreate && (
                    <button onClick={() => { setPlanToEdit(null); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors shadow-lg">
                        <FaPlus /> Novo Plano
                    </button>
                )}
            </div>

            <div className="mb-6 flex gap-4">
                <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                >
                    <option value="">Todos os Tipos</option>
                    <option value="BCP">BCP (Business Continuity Plan)</option>
                    <option value="DRP">DRP (Disaster Recovery Plan)</option>
                    <option value="Crise">Plano de Crise</option>
                </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlans.length > 0 ? filteredPlans.map(plan => {
                    const reviewStatus = getReviewStatus(plan.next_review_date);
                    return (
                        <div key={plan.id} className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded font-bold">{plan.type}</span>
                                    <div className="flex gap-2">
                                        {onEdit && <button onClick={() => { setPlanToEdit(plan); setShowAddModal(true); }} className="text-blue-400 hover:text-blue-300"><FaEdit/></button>}
                                        {onDelete && <button onClick={() => onDelete(plan.id)} className="text-red-400 hover:text-red-300"><FaTrash/></button>}
                                    </div>
                                </div>
                                <h3 className="font-bold text-white">{plan.title}</h3>
                                {plan.service_id && <p className="text-xs text-brand-secondary">{serviceMap.get(plan.service_id)}</p>}
                                <p className="text-xs text-gray-400 mt-2">{plan.description}</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-700 text-xs">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-500">Responsável:</span>
                                    <span className="text-gray-300">{collaboratorMap.get(plan.owner_id) || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-500">Última Revisão:</span>
                                    <span className="text-gray-300">{plan.last_review_date}</span>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Próxima Revisão:</span>
                                    <span className={reviewStatus.className}>{reviewStatus.text}</span>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                     <div className="col-span-full text-center py-12 bg-gray-900/20 rounded-lg border border-dashed border-gray-700">
                        <FaFileContract className="mx-auto text-3xl mb-2 opacity-50 text-gray-500"/>
                        <p className="text-on-surface-dark-secondary">Nenhum plano de continuidade registado.</p>
                    </div>
                )}
            </div>

            {showAddModal && (
                <AddContinuityPlanModal 
                    onClose={() => setShowAddModal(false)}
                    onSave={handleSavePlan}
                    planToEdit={planToEdit}
                    collaborators={collaborators}
                    businessServices={businessServices}
                />
            )}
        </div>
    );
};

export default ContinuityPlanDashboard;
