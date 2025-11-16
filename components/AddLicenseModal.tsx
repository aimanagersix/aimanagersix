import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { SoftwareLicense } from '../types';

interface AddLicenseModalProps {
    onClose: () => void;
    onSave: (license: Omit<SoftwareLicense, 'id'> | SoftwareLicense) => Promise<any>;
    licenseToEdit?: SoftwareLicense | null;
}

const AddLicenseModal: React.FC<AddLicenseModalProps> = ({ onClose, onSave, licenseToEdit }) => {
    const [formData, setFormData] = useState({
        productName: '',
        licenseKey: '',
        totalSeats: 1,
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        purchaseEmail: '',
        invoiceNumber: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (licenseToEdit) {
            setFormData({
                productName: licenseToEdit.productName,
                licenseKey: licenseToEdit.licenseKey,
                totalSeats: licenseToEdit.totalSeats,
                purchaseDate: licenseToEdit.purchaseDate || '',
                expiryDate: licenseToEdit.expiryDate || '',
                purchaseEmail: licenseToEdit.purchaseEmail || '',
                invoiceNumber: licenseToEdit.invoiceNumber || '',
            });
        }
    }, [licenseToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.productName.trim()) newErrors.productName = "O nome do produto é obrigatório.";
        if (!formData.licenseKey.trim()) newErrors.licenseKey = "A chave de licença é obrigatória.";
        if (formData.totalSeats < 1) newErrors.totalSeats = "O total deve ser pelo menos 1.";
        if (formData.purchaseEmail && !/\S+@\S+\.\S+/.test(formData.purchaseEmail)) {
            newErrors.purchaseEmail = "O formato do email é inválido.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
    };

    const handleSetExpiry = (years: number) => {
        if (!formData.purchaseDate) return;
        const purchase = new Date(formData.purchaseDate);
        purchase.setUTCFullYear(purchase.getUTCFullYear() + years);
        const expiry = purchase.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, expiryDate: expiry }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const dataToSave = {
            ...formData,
            purchaseDate: formData.purchaseDate || undefined,
            expiryDate: formData.expiryDate || undefined,
            purchaseEmail: formData.purchaseEmail || undefined,
            invoiceNumber: formData.invoiceNumber || undefined,
        };

        if (licenseToEdit) {
            onSave({ ...licenseToEdit, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
        onClose();
    };
    
    const modalTitle = licenseToEdit ? "Editar Licença" : "Adicionar Nova Licença";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome do Produto</label>
                    <input type="text" name="productName" id="productName" value={formData.productName} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.productName ? 'border-red-500' : 'border-gray-600'}`} />
                    {errors.productName && <p className="text-red-400 text-xs italic mt-1">{errors.productName}</p>}
                </div>
                 <div>
                    <label htmlFor="licenseKey" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Chave de Licença</label>
                    <input type="text" name="licenseKey" id="licenseKey" value={formData.licenseKey} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.licenseKey ? 'border-red-500' : 'border-gray-600'}`} />
                    {errors.licenseKey && <p className="text-red-400 text-xs italic mt-1">{errors.licenseKey}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="totalSeats" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Total de Ativações</label>
                        <input type="number" name="totalSeats" id="totalSeats" value={formData.totalSeats} onChange={handleChange} min="1" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.totalSeats ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.totalSeats && <p className="text-red-400 text-xs italic mt-1">{errors.totalSeats}</p>}
                    </div>
                     <div>
                        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número da Fatura (Opcional)</label>
                        <input type="text" name="invoiceNumber" id="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 border-gray-600`} />
                    </div>
                    <div>
                        <label htmlFor="purchaseEmail" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email Associado à Compra (Opcional)</label>
                        <input type="email" name="purchaseEmail" id="purchaseEmail" value={formData.purchaseEmail} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.purchaseEmail ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.purchaseEmail && <p className="text-red-400 text-xs italic mt-1">{errors.purchaseEmail}</p>}
                    </div>
                    <div>
                        <label htmlFor="purchaseDate" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data de Compra (Opcional)</label>
                        <input type="date" name="purchaseDate" id="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="expiryDate" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data de Expiração (Opcional)</label>
                        <div className="flex items-center gap-2">
                            <input type="date" name="expiryDate" id="expiryDate" value={formData.expiryDate} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            <button type="button" onClick={() => handleSetExpiry(1)} className="px-3 py-2 text-sm bg-gray-600 rounded-md hover:bg-gray-500 whitespace-nowrap">1 Ano</button>
                            <button type="button" onClick={() => handleSetExpiry(2)} className="px-3 py-2 text-sm bg-gray-600 rounded-md hover:bg-gray-500 whitespace-nowrap">2 Anos</button>
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

export default AddLicenseModal;