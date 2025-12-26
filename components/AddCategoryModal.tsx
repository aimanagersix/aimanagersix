
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { TicketCategoryItem, Team } from '../types';
import { FaClock, FaExclamationTriangle, FaShieldAlt, FaCalendarAlt } from 'react-icons/fa';
import { SpinnerIcon } from './common/Icons';

interface AddCategoryModalProps {
    onClose: () => void;
    onSave: (category: Omit<TicketCategoryItem, 'id'> | TicketCategoryItem) => Promise<void>;
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
        sla_working_days: 0,
        is_security: false
    });
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (categoryToEdit) {
            setFormData({
                name: categoryToEdit.name,
                is_active: categoryToEdit.is_active,
                default_team_id: categoryToEdit.default_team_id || '',
                sla_warning_hours: categoryToEdit.sla_warning_hours || 0,
                sla_critical_hours: categoryToEdit.sla_critical_hours || 0,
                sla_working_days: categoryToEdit.sla_working_days || 0,
                is_security: categoryToEdit.is_security || false
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim()) {
            setError('O nome da categoria é obrigatório.');
            return;
        }
        
        setError('');
        setIsSaving(true);
        
        const dataToSave: any = {
            ...formData,
            default_team_id: formData.default_team_id || null,
            sla_warning_hours: formData.sla_warning_hours || 0,
            sla_critical_hours: formData.sla_critical_hours || 0,
            sla_working_days: formData.sla_working_days || 0,
            is_security: formData.is_security || false
        };

        try {
            if (categoryToEdit) {
                await onSave({ ...categoryToEdit, ...dataToSave });
            } else {
                await onSave(dataToSave);
            }
            onClose();
        } catch (err: any) {
            console.error("Erro ao salvar categoria:", err);
            setError(err.message || "Falha na base de dados. Verifique permissões RLS.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const modalTitle = categoryToEdit ? "Editar Categoria" : "Adicionar Nova Categoria";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-black text-gray-400 mb-1 uppercase tracking-widest text-[10px]">Nome da Categoria</label>
                    <input 
                        type="text" 
                        name="name" 
                        id="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        className={`w-full bg-gray-700 border text-white rounded p-2 text-sm focus:border-brand-primary outline-none ${error ? 'border-red-500' : 'border-gray-600'}`} 
                    />
                    {error && <p className="text-red-400 text-xs font-bold mt-1 bg-red-900/20 p-2 rounded flex items-center gap-2"><FaExclamationTriangle/> {error}</p>}
                </div>

                <div>
                    <label htmlFor="default_team_id" className="block text-sm font-black text-gray-400 mb-1 uppercase tracking-widest text-[10px]">Equipa Padrão (Auto-atribuição)</label>
                    <select
                        name="default_team_id"
                        id="default_team_id"
                        value={formData.default_team_id}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:border-brand-primary outline-none"
                    >
                        <option value="">Nenhuma (Manual)</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-red-900/20 p-3 rounded border border-red-500/30">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="is_security"
                            id="is_security"
                            checked={formData.is_security}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                        />
                        <span className="ml-2 block text-xs font-bold text-red-300 flex items-center gap-2 uppercase tracking-widest">
                            <FaShieldAlt /> É um Incidente de Segurança?
                        </span>
                    </label>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                    <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FaClock /> Definição de SLA (Prazos)
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                         <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="flex-1 w-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><FaCalendarAlt/> Previsão Resolução (Dias Úteis)</label>
                                <input type="number" name="sla_working_days" value={formData.sla_working_days} onChange={handleChange} min="0" className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:border-brand-primary outline-none" />
                            </div>
                            <div className="flex-1 w-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Alerta SLA (Horas)</label>
                                <input type="number" name="sla_warning_hours" value={formData.sla_warning_hours} onChange={handleChange} min="0" className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:border-brand-primary outline-none" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center">
                    <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-on-surface-dark-secondary">Ativo</label>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded font-bold hover:bg-gray-500 transition-colors">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-8 py-2 bg-brand-primary text-white rounded font-black uppercase tracking-widest hover:bg-brand-secondary transition-all flex items-center gap-2 shadow-lg disabled:opacity-50">
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : null}
                        {isSaving ? 'A gravar...' : 'Salvar Categoria'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCategoryModal;
