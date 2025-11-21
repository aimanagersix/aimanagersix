


import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Supplier, CriticalityLevel } from '../types';
import { FaShieldAlt, FaGlobe, FaCheck } from 'react-icons/fa';

interface AddSupplierModalProps {
    onClose: () => void;
    onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => Promise<any>;
    supplierToEdit?: Supplier | null;
}

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ onClose, onSave, supplierToEdit }) => {
    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        nif: '',
        website: '',
        notes: '',
        is_iso27001_certified: false,
        security_contact_email: '',
        risk_level: CriticalityLevel.Low
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (supplierToEdit) {
            setFormData({ ...supplierToEdit });
        }
    }, [supplierToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = "O nome do fornecedor é obrigatório.";
        if (formData.contact_email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
            newErrors.contact_email = "Email inválido.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const dataToSave: any = { ...formData };
        if (supplierToEdit) {
            onSave({ ...supplierToEdit, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
        onClose();
    };
    
    const modalTitle = supplierToEdit ? "Editar Fornecedor" : "Novo Fornecedor";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome da Empresa</label>
                        <input 
                            type="text" 
                            name="name" 
                            id="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.name ? 'border-red-500' : 'border-gray-600'}`}
                        />
                        {errors.name && <p className="text-red-400 text-xs italic mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="nif" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">NIF (Opcional)</label>
                        <input 
                            type="text" 
                            name="nif" 
                            id="nif" 
                            value={formData.nif} 
                            onChange={handleChange} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                        />
                    </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="contact_name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Pessoa de Contacto</label>
                        <input type="text" name="contact_name" value={formData.contact_name} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"/>
                    </div>
                    <div>
                        <label htmlFor="contact_email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email Geral</label>
                        <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.contact_email ? 'border-red-500' : 'border-gray-600'}`}/>
                        {errors.contact_email && <p className="text-red-400 text-xs italic mt-1">{errors.contact_email}</p>}
                    </div>
                    <div>
                        <label htmlFor="contact_phone" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telefone</label>
                        <input type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"/>
                    </div>
                </div>
                
                <div>
                    <label htmlFor="website" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Website</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaGlobe className="text-gray-400"/></div>
                        <input type="text" name="website" value={formData.website} onChange={handleChange} placeholder="https://..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md pl-10 p-2"/>
                    </div>
                </div>

                {/* Security & Risk Section */}
                <div className="border border-gray-700 bg-gray-800/30 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2 border-b border-gray-700 pb-2">
                        <FaShieldAlt className="text-brand-secondary"/>
                        Avaliação de Risco (Vendor Risk Management)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="risk_level" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nível de Risco do Fornecedor</label>
                            <select name="risk_level" id="risk_level" value={formData.risk_level} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                {Object.values(CriticalityLevel).map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Avalie o impacto caso este fornecedor falhe ou sofra um ataque.</p>
                        </div>
                        <div>
                            <label htmlFor="security_contact_email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email de Notificação de Segurança</label>
                            <input 
                                type="email" 
                                name="security_contact_email" 
                                value={formData.security_contact_email} 
                                onChange={handleChange} 
                                placeholder="security@vendor.com"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <div className="flex items-center p-3 bg-gray-900/50 rounded border border-gray-600">
                                <input
                                    type="checkbox"
                                    name="is_iso27001_certified"
                                    id="is_iso27001_certified"
                                    checked={formData.is_iso27001_certified}
                                    onChange={handleChange}
                                    className="h-5 w-5 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                                />
                                <label htmlFor="is_iso27001_certified" className="ml-3 block text-sm font-bold text-white">
                                    Possui Certificação ISO 27001 (Segurança da Informação)?
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Notas Adicionais</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"></textarea>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddSupplierModal;