import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { EquipmentType } from '../types';

interface AddEquipmentTypeModalProps {
    onClose: () => void;
    onSave: (type: Omit<EquipmentType, 'id'> | EquipmentType) => Promise<any>;
    typeToEdit?: EquipmentType | null;
}

const AddEquipmentTypeModal: React.FC<AddEquipmentTypeModalProps> = ({ onClose, onSave, typeToEdit }) => {
    const [formData, setFormData] = useState({
        name: '',
        requiresNomeNaRede: false,
        requiresMacWIFI: false,
        requiresMacCabo: false,
        requiresInventoryNumber: false,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (typeToEdit) {
            setFormData({
                name: typeToEdit.name,
                requiresNomeNaRede: typeToEdit.requiresNomeNaRede || false,
                requiresMacWIFI: typeToEdit.requiresMacWIFI || false,
                requiresMacCabo: typeToEdit.requiresMacCabo || false,
                requiresInventoryNumber: typeToEdit.requiresInventoryNumber || false,
            });
        }
    }, [typeToEdit]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim() === '') {
            setError('O nome do tipo é obrigatório.');
            return;
        }
        setError('');
        
        if (typeToEdit) {
            onSave({ ...typeToEdit, ...formData });
        } else {
            onSave(formData);
        }
        onClose();
    };
    
    const modalTitle = typeToEdit ? "Editar Tipo de Equipamento" : "Adicionar Novo Tipo de Equipamento";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome do Tipo</label>
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
                <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-md font-medium text-on-surface-dark mb-2">Campos Adicionais do Equipamento</h3>
                     <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" name="requiresNomeNaRede" checked={formData.requiresNomeNaRede} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-on-surface-dark-secondary">Requer "Nome na Rede"</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" name="requiresMacWIFI" checked={formData.requiresMacWIFI} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-on-surface-dark-secondary">Requer "Endereço MAC WIFI"</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" name="requiresMacCabo" checked={formData.requiresMacCabo} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-on-surface-dark-secondary">Requer "Endereço MAC Cabo"</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" name="requiresInventoryNumber" checked={formData.requiresInventoryNumber} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-on-surface-dark-secondary">Requer "Número de Inventário"</span>
                        </label>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEquipmentTypeModal;
