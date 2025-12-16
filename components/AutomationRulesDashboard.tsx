
import React, { useState, useEffect } from 'react';
import { AutomationRule } from '../types';
import * as dataService from '../services/dataService';
import { FaBolt, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSync } from 'react-icons/fa';
import AddAutomationRuleModal from './AddAutomationRuleModal';

const AutomationRulesDashboard: React.FC = () => {
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [ruleToEdit, setRuleToEdit] = useState<AutomationRule | null>(null);

    const loadRules = async () => {
        setLoading(true);
        try {
            const data = await dataService.getAutomationRules();
            setRules(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRules();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Tem a certeza que deseja apagar esta regra?")) return;
        try {
            await dataService.deleteAutomationRule(id);
            loadRules();
        } catch (e) {
            alert("Erro ao apagar regra.");
        }
    };

    const handleToggleActive = async (rule: AutomationRule) => {
        try {
            await dataService.updateAutomationRule(rule.id, { is_active: !rule.is_active });
            loadRules();
        } catch (e) {
            alert("Erro ao atualizar estado.");
        }
    };

    return (
        <div className="h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FaBolt className="text-yellow-400" /> Regras de Automação
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Defina fluxos de trabalho automáticos (Se... Então...) para tickets e equipamentos.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadRules} className="bg-gray-700 text-white p-2 rounded hover:bg-gray-600"><FaSync/></button>
                    <button 
                        onClick={() => { setRuleToEdit(null); setShowAddModal(true); }}
                        className="bg-brand-primary text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-brand-secondary"
                    >
                        <FaPlus /> Nova Regra
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">A carregar regras...</div>
            ) : (
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {rules.length === 0 && <p className="text-center text-gray-500">Nenhuma regra definida.</p>}
                    
                    {rules.map(rule => (
                        <div key={rule.id} className={`bg-gray-800 border ${rule.is_active ? 'border-gray-600' : 'border-gray-700 opacity-60'} p-4 rounded-lg flex justify-between items-center group`}>
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${rule.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                                        {rule.is_active ? 'ATIVO' : 'PAUSA'}
                                    </span>
                                    <h3 className="font-bold text-white">{rule.name}</h3>
                                </div>
                                <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                                    <span className="bg-gray-900 px-2 rounded text-xs border border-gray-700">Quando: {rule.trigger_event}</span>
                                    <span>&rarr;</span>
                                    <span>{rule.conditions.length} Condições</span>
                                    <span>&rarr;</span>
                                    <span>{rule.actions.length} Ações</span>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleToggleActive(rule)}
                                    className="p-2 bg-gray-700 rounded hover:bg-gray-600 text-gray-300"
                                    title={rule.is_active ? "Desativar" : "Ativar"}
                                >
                                    {rule.is_active ? <FaTimes/> : <FaCheck/>}
                                </button>
                                <button 
                                    onClick={() => { setRuleToEdit(rule); setShowAddModal(true); }}
                                    className="p-2 bg-blue-600 rounded hover:bg-blue-500 text-white"
                                >
                                    <FaEdit/>
                                </button>
                                <button 
                                    onClick={() => handleDelete(rule.id)}
                                    className="p-2 bg-red-600 rounded hover:bg-red-500 text-white"
                                >
                                    <FaTrash/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAddModal && (
                <AddAutomationRuleModal 
                    onClose={() => setShowAddModal(false)}
                    onSave={async (ruleData) => {
                        if (ruleToEdit) {
                            await dataService.updateAutomationRule(ruleToEdit.id, ruleData);
                        } else {
                            await dataService.addAutomationRule(ruleData);
                        }
                        loadRules();
                    }}
                    ruleToEdit={ruleToEdit}
                />
            )}
        </div>
    );
};

export default AutomationRulesDashboard;
