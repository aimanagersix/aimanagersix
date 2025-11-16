import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Brand } from '../types';

interface AddBrandModalProps {
    onClose: () => void;
    onSave: (brand: Omit<Brand, 'id'> | Brand) => Promise<any>;
    brandToEdit?: Brand | null;
}

const AddBrandModal: React.FC<AddBrandModalProps> = ({ onClose, onSave, brandToEdit }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (brandToEdit) {
            setName(brandToEdit.name);
        }
    }, [brandToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() === '') {
            setError('O nome da marca é obrigatório.');
            return;
        }
        setError('');
        if (brandToEdit) {
            onSave({ ...brandToEdit, name });
        } else {
            onSave({ name });
        }
        onClose();
    };
    
    const modalTitle = brandToEdit ? "Editar Marca" : "Adicionar Nova Marca";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome da Marca</label>
                    <input 
                        type="text" 
                        name="name" 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className={`w-full bg-gray-700 border text-white rounded-md p-2 ${error ? 'border-red-500' : 'border-gray-600'}`}
                    />
                     {error && <p className="text-red-400 text-xs italic mt-1">{error}</p>}
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddBrandModal;