

import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { TicketCategoryItem, Team } from '../types';
import { FaClock, FaExclamationTriangle } from 'react-icons/fa';

interface AddCategoryModalProps {
    onClose: () => void;
    onSave: (category: Omit<TicketCategoryItem, 'id'> | TicketCategoryItem) => void;
    categoryToEdit?: TicketCategoryItem | null;
    teams: Team[];
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ onClose, onSave, categoryToEdit, teams }) => {
    const [formData, setFormData] = useState<Partial<TicketCategoryItem>>({
        name: '',
        is_active: true,
        default_team_id: '',
        sla_warning_hours: 0,
        sla_critical_hours: 0,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (categoryToEdit) {
            setFormData({
                name: categoryToEdit.name,
                is_active: categoryToEdit.is_active,
                default_team_id: categoryToEdit.default_team_id || '',
                sla_warning_hours: categoryToEdit.sla_warning_hours || 0,
                sla_critical_hours: categoryToEdit.sla_critical_hours || 0,
            });
        }
    }, [categoryToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseInt(value) : (type === 'checkbox' ? (e.target as HTMLInputElement).checked : value) 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim()) {
            setError('O nome da categoria é obrigatório.');
            return;
        }
        setError('');
        
        const dataToSave: any = {
            ...formData,
            default_team_id: formData.default_team_id || undefined,
            sla_warning_hours: formData.sla_warning_hours || 0,
            sla_critical_hours: formData.sla_critical_hours || 0,
        };

        if (categoryToEdit) {
            onSave({ ...categoryToEdit, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
        onClose();
    };
    
    const modalTitle = categoryToEdit ? "Editar Categoria" : "Adicionar Nova Categoria";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome da Categoria</label>
                    <input 
                        type="text" 
                        name="name" 
                        id="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        className={`w-full bg-gray-700 border text-white rounded-md p-2 ${error ? 'border-red-500' : 'border-gray-600'}`} 
                    />
                    {error && <p className="text-red-400 text-xs italic mt-1">{error}</p>}
                </div>

                <div>
                    <label htmlFor="default_team_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Equipa Padrão (Auto-atribuição)</label>
                    <select
                        name="default_team_id"
                        id="default_team_id"
                        value={formData.default_team_id}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                    >
                        <option value="">Nenhuma (Manual)</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Tickets criados nesta categoria serão automaticamente encaminhados para esta equipa.</p>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <FaClock className="text-brand-secondary"/>
                        Definição de SLA (Prazos)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="sla_warning_hours" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Alerta (Horas)</label>
                            <input 
                                type="number" 
                                name="sla_warning_hours" 
                                id="sla_warning_hours" 
                                value={formData.sla_warning_hours} 
                                onChange={handleChange}
                                min="0"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm" 
                            />
                            <p className="text-[10px] text-gray-500 mt-1">0 para desativar. Ex: 24h</p>
                        </div>
                        <div>
                            <label htmlFor="sla_critical_hours" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Crítico (Horas)</label>
                            <input 
                                type="number" 
                                name="sla_critical_hours" 
                                id="sla_critical_hours" 
                                value={formData.sla_critical_hours} 
                                onChange={handleChange}
                                min="0"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm" 
                            />
                             <p className="text-[10px] text-gray-500 mt-1">Ex: 72h (Incidente Legal)</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        name="is_active"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-on-surface-dark-secondary">
                        Ativo
                    </label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCategoryModal;