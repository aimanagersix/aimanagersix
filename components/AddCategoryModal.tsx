
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { TicketCategoryItem } from '../types';

interface AddCategoryModalProps {
    onClose: () => void;
    onSave: (category: Omit<TicketCategoryItem, 'id'> | TicketCategoryItem) => void;
    categoryToEdit?: TicketCategoryItem | null;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ onClose, onSave, categoryToEdit }) => {
    const [formData, setFormData] = useState({
        name: '',
        is_active: true
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (categoryToEdit) {
            setFormData({
                name: categoryToEdit.name,
                is_active: categoryToEdit.is_active
            });
        }
    }, [categoryToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim() === '') {
            setError('O nome da categoria é obrigatório.');
            return;
        }
        setError('');
        
        if (categoryToEdit) {
            onSave({ ...categoryToEdit, ...formData });
        } else {
            onSave(formData);
        }
        onClose();
    };
    
    const modalTitle = categoryToEdit ? "Editar Categoria" : "Adicionar Nova Categoria";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome da Categoria</label>
                    <input 
                        type="text" 
                        name="name" 
                        id="name" 
                        value={formData.name} 
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                        className={`w-full bg-gray-700 border text-white rounded-md p-2 ${error ? 'border-red-500' : 'border-gray-600'}`} 
                    />
                    {error && <p className="text-red-400 text-xs italic mt-1">{error}</p>}
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

export default AddCategoryModal;
