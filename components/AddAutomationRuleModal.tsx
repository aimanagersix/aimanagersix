
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { AutomationRule, RuleCondition, RuleAction, Team, Collaborator, TicketCategoryItem } from '../types';
import { FaPlus, FaTrash, FaSave, FaBolt, FaArrowRight } from 'react-icons/fa';
import * as dataService from '../services/dataService';

interface AddAutomationRuleModalProps {
    onClose: () => void;
    onSave: (rule: Omit<AutomationRule, 'id' | 'created_at'>) => Promise<void>;
    ruleToEdit?: AutomationRule | null;
}

const AddAutomationRuleModal: React.FC<AddAutomationRuleModalProps> = ({ onClose, onSave, ruleToEdit }) => {
    const [name, setName] = useState('');
    const [trigger, setTrigger] = useState<'TICKET_CREATED' | 'EQUIPMENT_CREATED'>('TICKET_CREATED');
    const [conditions, setConditions] = useState<RuleCondition[]>([]);
    const [actions, setActions] = useState<RuleAction[]>([]);
    const [priority, setPriority] = useState(0);
    const [isActive, setIsActive] = useState(true);

    // Helpers Data
    const [teams, setTeams] = useState<Team[]>([]);
    const [users, setUsers] = useState<Collaborator[]>([]);
    const [categories, setCategories] = useState<TicketCategoryItem[]>([]);

    useEffect(() => {
        if (ruleToEdit) {
            setName(ruleToEdit.name);
            setTrigger(ruleToEdit.trigger_event);
            setConditions(ruleToEdit.conditions || []);
            setActions(ruleToEdit.actions || []);
            setPriority(ruleToEdit.priority || 0);
            setIsActive(ruleToEdit.is_active);
        }
        
        // Load helpers
        const loadData = async () => {
            const d = await dataService.fetchAllData();
            setTeams(d.teams);
            setUsers(d.collaborators);
            setCategories(d.ticketCategories);
        };
        loadData();
    }, [ruleToEdit]);

    const addCondition = () => {
        setConditions([...conditions, { field: 'category', operator: 'equals', value: '' }]);
    };
    
    const removeCondition = (idx: number) => {
        setConditions(conditions.filter((_, i) => i !== idx));
    };

    const updateCondition = (idx: number, key: keyof RuleCondition, val: any) => {
        const newConds = [...conditions];
        newConds[idx] = { ...newConds[idx], [key]: val };
        setConditions(newConds);
    };

    const addAction = () => {
        setActions([...actions, { type: 'ASSIGN_TEAM', value: '' }]);
    };

    const removeAction = (idx: number) => {
        setActions(actions.filter((_, i) => i !== idx));
    };

    const updateAction = (idx: number, key: keyof RuleAction, val: any) => {
        const newActs = [...actions];
        newActs[idx] = { ...newActs[idx], [key]: val };
        setActions(newActs);
    };

    const handleSave = async () => {
        if (!name) return alert("Nome é obrigatório");
        if (actions.length === 0) return alert("Adicione pelo menos uma ação");

        await onSave({
            name,
            trigger_event: trigger,
            conditions,
            actions,
            priority,
            is_active: isActive,
            description: `Regra automática: ${trigger}`
        });
        onClose();
    };

    return (
        <Modal title={ruleToEdit ? "Editar Regra" : "Nova Regra de Automação"} onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6 h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* General Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 uppercase mb-1">Nome da Regra</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" placeholder="Ex: Atribuir Hardware ao João"/>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 uppercase mb-1">Gatilho (Quando?)</label>
                        <select value={trigger} onChange={e => setTrigger(e.target.value as any)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                            <option value="TICKET_CREATED">Ticket Criado</option>
                            <option value="EQUIPMENT_CREATED">Equipamento Criado</option>
                        </select>
                    </div>
                </div>

                {/* Conditions */}
                <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-white text-sm">SE (Condições - Todas devem ser verdadeiras)</h4>
                        <button onClick={addCondition} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded flex items-center gap-1"><FaPlus/> Adicionar</button>
                    </div>
                    {conditions.length === 0 && <p className="text-gray-500 text-xs italic">Sem condições (aplica-se sempre).</p>}
                    
                    {conditions.map((cond, idx) => (
                        <div key={idx} className="flex gap-2 mb-2 items-center">
                            <select value={cond.field} onChange={e => updateCondition(idx, 'field', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 text-sm w-1/3">
                                {trigger === 'TICKET_CREATED' ? (
                                    <>
                                        <option value="category">Categoria</option>
                                        <option value="title">Assunto</option>
                                        <option value="description">Descrição</option>
                                        <option value="priority">Prioridade</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="brandId">Marca (ID)</option>
                                        <option value="typeId">Tipo (ID)</option>
                                        <option value="description">Descrição</option>
                                    </>
                                )}
                            </select>
                            <select value={cond.operator} onChange={e => updateCondition(idx, 'operator', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 text-sm w-1/4">
                                <option value="equals">Igual a</option>
                                <option value="not_equals">Diferente de</option>
                                <option value="contains">Contém</option>
                                <option value="starts_with">Começa com</option>
                            </select>
                            
                            {/* Dynamic Value Input */}
                            {cond.field === 'category' && trigger === 'TICKET_CREATED' ? (
                                <select value={String(cond.value)} onChange={e => updateCondition(idx, 'value', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 text-sm flex-grow">
                                    <option value="">Selecione...</option>
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            ) : (
                                <input type="text" value={String(cond.value || '')} onChange={e => updateCondition(idx, 'value', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 text-sm flex-grow" placeholder="Valor..."/>
                            )}

                            <button onClick={() => removeCondition(idx)} className="text-red-400 hover:text-red-300 p-1"><FaTrash/></button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center">
                    <FaArrowRight className="text-gray-500 transform rotate-90 md:rotate-90"/>
                </div>

                {/* Actions */}
                <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-white text-sm">ENTÃO (Ações)</h4>
                        <button onClick={addAction} className="text-xs bg-brand-primary hover:bg-brand-secondary text-white px-2 py-1 rounded flex items-center gap-1"><FaPlus/> Adicionar</button>
                    </div>
                    {actions.map((act, idx) => (
                        <div key={idx} className="flex gap-2 mb-2 items-center">
                            <select value={act.type} onChange={e => updateAction(idx, 'type', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 text-sm w-1/3">
                                <option value="ASSIGN_TEAM">Atribuir Equipa</option>
                                <option value="ASSIGN_USER">Atribuir Técnico</option>
                                <option value="SET_PRIORITY">Definir Prioridade</option>
                                <option value="SET_STATUS">Mudar Estado</option>
                            </select>

                            {/* Dynamic Value Input based on Action Type */}
                            {act.type === 'ASSIGN_TEAM' ? (
                                <select value={act.value} onChange={e => updateAction(idx, 'value', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 text-sm flex-grow">
                                    <option value="">Selecione Equipa...</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            ) : act.type === 'ASSIGN_USER' ? (
                                <select value={act.value} onChange={e => updateAction(idx, 'value', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 text-sm flex-grow">
                                    <option value="">Selecione Técnico...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                                </select>
                            ) : (
                                <input type="text" value={act.value} onChange={e => updateAction(idx, 'value', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 text-sm flex-grow" placeholder="Valor..."/>
                            )}

                            <button onClick={() => removeAction(idx)} className="text-red-400 hover:text-red-300 p-1"><FaTrash/></button>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded bg-gray-700 border-gray-600 text-brand-primary"/>
                        Regra Ativa
                    </label>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary flex items-center gap-2"><FaSave/> Guardar Regra</button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AddAutomationRuleModal;
