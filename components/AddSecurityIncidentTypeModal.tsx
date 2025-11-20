
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { SecurityIncidentTypeItem } from '../types';

interface AddSecurityIncidentTypeModalProps {
    onClose: () => void;
    onSave: (type: Omit<SecurityIncidentTypeItem, 'id'> | SecurityIncidentTypeItem) => void;
    typeToEdit?: SecurityIncidentTypeItem | null;
}

const AddSecurityIncidentTypeModal: React.FC<AddSecurityIncidentTypeModalProps> = ({ onClose, onSave, typeToEdit }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (typeToEdit) {
            setFormData({
                name: typeToEdit.name,
                description: typeToEdit.description || '',
                is_active: typeToEdit.is_active,
            });
        }
    }, [typeToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim() === '') {
            setError('O nome do tipo de incidente é obrigatório.');
            return;
        }
        setError('');
        
        const dataToSave = {
            ...formData,
            description: formData.description || undefined
        };

        if (typeToEdit) {
            onSave({ ...typeToEdit, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
        onClose();
    };
    
    const modalTitle = typeToEdit ? "Editar Tipo de Incidente" : "Adicionar Tipo de Incidente";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome do Tipo</label>
                    <input 
                        type="text" 
                        name="name" 
                        id="name" 
                        value={formData.name} 
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                        className={`w-full bg-gray-700 border text-white rounded-md p-2 ${error ? 'border-red-500' : 'border-gray-600'}`} 
                        placeholder="Ex: Ransomware, Phishing..."
                    />
                    {error && <p className="text-red-400 text-xs italic mt-1">{error}</p>}
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Descrição (Opcional)</label>
                    <textarea
                        name="description"
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                        rows={3}
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
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

export default AddSecurityIncidentTypeModal;
