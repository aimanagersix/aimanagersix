import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { BusinessService, Collaborator, CriticalityLevel, ServiceStatus, Supplier } from '../types';
import { SpinnerIcon } from './common/Icons';

interface AddServiceModalProps {
    onClose: () => void;
    onSave: (service: Omit<BusinessService, 'id'> | BusinessService) => Promise<any>;
    serviceToEdit?: BusinessService | null;
    collaborators: Collaborator[];
    suppliers?: Supplier[];
}

const AddServiceModal: React.FC<AddServiceModalProps> = ({ onClose, onSave, serviceToEdit, collaborators, suppliers = [] }) => {
    const [formData, setFormData] = useState<Partial<BusinessService>>({
        name: '',
        description: '',
        criticality: CriticalityLevel.Medium,
        rto_goal: '',
        owner_id: '',
        status: ServiceStatus.Ativo,
        external_provider_id: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (serviceToEdit) {
            setFormData({ ...serviceToEdit, external_provider_id: serviceToEdit.external_provider_id || '' });
        }
    }, [serviceToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = "O nome do serviço é obrigatório.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsSaving(true);

        try {
            const dataToSave: any = { ...formData };
            if (!dataToSave.owner_id) delete dataToSave.owner_id;
            if (!dataToSave.rto_goal) delete dataToSave.rto_goal;
            if (!dataToSave.external_provider_id) delete dataToSave.external_provider_id;

            if (serviceToEdit) {
                await onSave({ ...serviceToEdit, ...dataToSave });
            } else {
                await onSave(dataToSave);
            }
            onClose();
        } catch (error: any) {
            console.error("Error saving service:", error);
            alert(`Erro ao gravar serviço: ${error.message || "Verifique os campos."}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const modalTitle = serviceToEdit ? "Editar Serviço de Negócio" : "Novo Serviço de Negócio";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome do Serviço</label>
                    <input 
                        type="text" 
                        name="name" 
                        id="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        placeholder="Ex: Servidor de Email, CRM, Website..."
                        className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.name ? 'border-red-500' : 'border-gray-600'}`}
                    />
                    {errors.name && <p className="text-red-400 text-xs italic mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="criticality" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Criticidade</label>
                        <select name="criticality" value={formData.criticality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                            {Object.values(CriticalityLevel).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                        </select>
                    </div>
                    <div>
                         <label htmlFor="rto_goal" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Objetivo RTO (Tempo Recuperação)</label>
                         <input type="text" name="rto_goal" value={formData.rto_goal} onChange={handleChange} placeholder="Ex: 4h, 24h..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"/>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="owner_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Dono do Serviço (Owner)</label>
                        <select name="owner_id" value={formData.owner_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                            <option value="">Selecione um responsável...</option>
                            {/* FIX: Updated property names to snake_case */}
                            {collaborators.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="external_provider_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Fornecedor Externo (Outsourcing)</label>
                        <select name="external_provider_id" value={formData.external_provider_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                            <option value="">Nenhum (Interno)</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Estado</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                        {Object.values(ServiceStatus).map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Descrição</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"></textarea>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500" disabled={isSaving}>Cancelar</button>
                    <button 
                        type="submit" 
                        className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50"
                        disabled={isSaving}
                    >
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : null}
                        {isSaving ? 'A Gravar...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddServiceModal;