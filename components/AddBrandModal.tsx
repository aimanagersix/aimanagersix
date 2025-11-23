
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Brand, CriticalityLevel } from '../types';
import { FaShieldAlt } from 'react-icons/fa';

interface AddBrandModalProps {
    onClose: () => void;
    onSave: (brand: Omit<Brand, 'id'> | Brand) => Promise<any>;
    brandToEdit?: Brand | null;
    existingBrands?: Brand[];
}

const AddBrandModal: React.FC<AddBrandModalProps> = ({ onClose, onSave, brandToEdit, existingBrands = [] }) => {
    const [formData, setFormData] = useState<Partial<Brand>>({
        name: '',
        risk_level: CriticalityLevel.Low,
        is_iso27001_certified: false,
        security_contact_email: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (brandToEdit) {
            setFormData({
                name: brandToEdit.name,
                risk_level: brandToEdit.risk_level || CriticalityLevel.Low,
                is_iso27001_certified: brandToEdit.is_iso27001_certified || false,
                security_contact_email: brandToEdit.security_contact_email || ''
            });
        }
    }, [brandToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
        }));
        setError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = formData.name?.trim();
        
        if (!name) {
            setError('O nome da marca é obrigatório.');
            return;
        }

        // Check duplicates (case insensitive)
        const isDuplicate = existingBrands.some(b => 
            b.name.toLowerCase() === name.toLowerCase() && 
            (!brandToEdit || b.id !== brandToEdit.id)
        );

        if (isDuplicate) {
            setError('Já existe uma marca com este nome.');
            return;
        }
        
        const dataToSave = { ...formData, name };

        if (brandToEdit) {
            onSave({ ...brandToEdit, ...dataToSave } as Brand);
        } else {
            onSave(dataToSave as Omit<Brand, 'id'>);
        }
        onClose();
    };
    
    const modalTitle = brandToEdit ? "Editar Marca" : "Adicionar Nova Marca";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome da Marca</label>
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

                {/* Security & Risk Section */}
                <div className="border border-gray-700 bg-gray-800/30 p-4 rounded-lg mt-4">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-gray-700 pb-2">
                        <FaShieldAlt className="text-brand-secondary"/>
                        Risco de Segurança (Fabricante)
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="risk_level" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Nível de Risco</label>
                            <select name="risk_level" id="risk_level" value={formData.risk_level} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                                {Object.values(CriticalityLevel).map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label htmlFor="security_contact_email" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Email de Segurança (PSIRT)</label>
                            <input 
                                type="email" 
                                name="security_contact_email" 
                                value={formData.security_contact_email} 
                                onChange={handleChange} 
                                placeholder="security@vendor.com"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm font-mono"
                            />
                        </div>

                        <div className="flex items-center pt-2">
                            <input
                                type="checkbox"
                                name="is_iso27001_certified"
                                id="is_iso27001_certified"
                                checked={formData.is_iso27001_certified}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                            />
                            <label htmlFor="is_iso27001_certified" className="ml-2 block text-sm font-bold text-white">
                                Fabricante com Certificação ISO 27001
                            </label>
                        </div>
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

export default AddBrandModal;