







import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { SoftwareLicense, LicenseStatus, CriticalityLevel, CIARating, Supplier } from '../types';
import { FaShieldAlt, FaEuroSign } from 'react-icons/fa';

interface AddLicenseModalProps {
    onClose: () => void;
    onSave: (license: Omit<SoftwareLicense, 'id'> | SoftwareLicense) => Promise<any>;
    licenseToEdit?: SoftwareLicense | null;
    suppliers?: Supplier[];
}

const AddLicenseModal: React.FC<AddLicenseModalProps> = ({ onClose, onSave, licenseToEdit, suppliers = [] }) => {
    const [formData, setFormData] = useState<Partial<SoftwareLicense>>({
        productName: '',
        licenseKey: '',
        totalSeats: 1,
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        purchaseEmail: '',
        invoiceNumber: '',
        status: LicenseStatus.Ativo,
        criticality: CriticalityLevel.Low,
        confidentiality: CIARating.Low,
        integrity: CIARating.Low,
        availability: CIARating.Low,
        supplier_id: '',
        unitCost: 0,
        is_oem: false
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
                status: licenseToEdit.status || LicenseStatus.Ativo,
                criticality: licenseToEdit.criticality || CriticalityLevel.Low,
                confidentiality: licenseToEdit.confidentiality || CIARating.Low,
                integrity: licenseToEdit.integrity || CIARating.Low,
                availability: licenseToEdit.availability || CIARating.Low,
                supplier_id: licenseToEdit.supplier_id || '',
                unitCost: licenseToEdit.unitCost || 0,
                is_oem: licenseToEdit.is_oem || false
            });
        }
    }, [licenseToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.productName?.trim()) newErrors.productName = "O nome do produto é obrigatório.";
        if (!formData.licenseKey?.trim()) newErrors.licenseKey = "A chave de licença (ou identificador) é obrigatória.";
        
        // Total seats required only if NOT OEM
        if (!formData.is_oem && (formData.totalSeats || 0) < 1) {
            newErrors.totalSeats = "O total deve ser pelo menos 1.";
        }
        
        if (formData.purchaseEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.purchaseEmail)) {
            newErrors.purchaseEmail = "O formato do email é inválido.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value) 
        }));
    };

    const handleSetExpiry = (years: number) => {
        if (!formData.purchaseDate) return;
        const purchase = new Date(formData.purchaseDate);
        purchase.setUTCFullYear(purchase.getUTCFullYear() + years);
        const expiry = purchase.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, expiryDate: expiry }));
    };

    const handleSetLifetime = () => {
        setFormData(prev => ({ ...prev, expiryDate: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const dataToSave = {
            ...formData,
            productName: formData.productName!,
            licenseKey: formData.licenseKey!,
            // If OEM, totalSeats is 0 or ignored, but DB expects int usually. Let's set 1 as placeholder or 0 if allowed.
            // Logic says total activations updates automatically, so 0 or high number is fine.
            totalSeats: formData.is_oem ? 0 : formData.totalSeats!,
            status: formData.status!,
            purchaseDate: formData.purchaseDate || undefined,
            expiryDate: formData.expiryDate || undefined,
            purchaseEmail: formData.purchaseEmail || undefined,
            invoiceNumber: formData.invoiceNumber || undefined,
            supplier_id: formData.supplier_id || undefined,
            unitCost: formData.unitCost || 0,
            is_oem: formData.is_oem || false
        };

        if (licenseToEdit) {
            onSave({ ...licenseToEdit, ...dataToSave });
        } else {
            onSave(dataToSave as Omit<SoftwareLicense, 'id'>);
        }
        onClose();
    };
    
    const modalTitle = licenseToEdit ? "Editar Licença" : "Adicionar Nova Licença";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome do Produto</label>
                    <input type="text" name="productName" id="productName" value={formData.productName} onChange={handleChange} placeholder="Ex: Windows 11 Pro OEM, Adobe CC..." className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.productName ? 'border-red-500' : 'border-gray-600'}`} />
                    {errors.productName && <p className="text-red-400 text-xs italic mt-1">{errors.productName}</p>}
                </div>
                 <div>
                    <label htmlFor="licenseKey" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Chave de Licença / Identificador</label>
                    <input type="text" name="licenseKey" id="licenseKey" value={formData.licenseKey} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.licenseKey ? 'border-red-500' : 'border-gray-600'}`} />
                    {errors.licenseKey && <p className="text-red-400 text-xs italic mt-1">{errors.licenseKey}</p>}
                </div>
                
                {/* OEM Checkbox */}
                <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                    <label className="flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            name="is_oem" 
                            checked={formData.is_oem} 
                            onChange={handleChange} 
                            className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                        />
                        <span className="ml-2 text-white font-medium">Licença OEM / Ilimitada (Contagem Dinâmica)</span>
                    </label>
                    <p className="text-xs text-gray-400 mt-1 ml-6">
                        Se marcado, o número total de ativações será igual ao número de equipamentos onde esta licença for registada. Ideal para SOs OEM ou site licenses.
                    </p>
                </div>

                {!formData.is_oem && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <div>
                            <label htmlFor="totalSeats" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Total de Ativações Compradas</label>
                            <input type="number" name="totalSeats" id="totalSeats" value={formData.totalSeats} onChange={handleChange} min="1" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.totalSeats ? 'border-red-500' : 'border-gray-600'}`} />
                            {errors.totalSeats && <p className="text-red-400 text-xs italic mt-1">{errors.totalSeats}</p>}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número da Fatura (Opcional)</label>
                        <input type="text" name="invoiceNumber" id="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 border-gray-600`} />
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Status</label>
                        <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                            {Object.values(LicenseStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="supplier_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Fornecedor (Revendedor)</label>
                        <select 
                            name="supplier_id" 
                            id="supplier_id" 
                            value={formData.supplier_id} 
                            onChange={handleChange} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                        >
                            <option value="">-- Selecione Fornecedor --</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
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
                            <button type="button" onClick={handleSetLifetime} className="px-3 py-2 text-sm bg-gray-600 rounded-md hover:bg-gray-500 whitespace-nowrap">Vitalícia</button>
                        </div>
                    </div>
                </div>
                
                {/* FinOps Section */}
                <div className="border-t border-gray-600 pt-4 mt-4">
                    <h3 className="text-lg font-medium text-on-surface-dark mb-2 flex items-center gap-2">
                        <FaEuroSign className="text-green-400" />
                        Custos (FinOps)
                    </h3>
                    <div>
                        <label htmlFor="unitCost" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Custo Unitário (€)</label>
                        <input 
                            type="number" 
                            name="unitCost" 
                            id="unitCost" 
                            value={formData.unitCost} 
                            onChange={handleChange} 
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Preço por licença/utilizador para cálculo de TCO.</p>
                    </div>
                </div>

                {/* NIS2 Compliance Section */}
                <div className="border-t border-gray-600 pt-4 mt-4">
                     <h3 className="text-lg font-medium text-on-surface-dark mb-2 flex items-center gap-2">
                        <FaShieldAlt className="text-yellow-400" />
                        Classificação de Risco & Conformidade (NIS2)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="criticality" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nível de Criticidade</label>
                            <select name="criticality" id="criticality" value={formData.criticality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                {Object.values(CriticalityLevel).map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="confidentiality" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Confidencialidade</label>
                            <select name="confidentiality" id="confidentiality" value={formData.confidentiality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                {Object.values(CIARating).map(rating => (
                                    <option key={rating} value={rating}>{rating}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="integrity" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Integridade</label>
                            <select name="integrity" id="integrity" value={formData.integrity} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                {Object.values(CIARating).map(rating => (
                                    <option key={rating} value={rating}>{rating}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="availability" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Disponibilidade</label>
                            <select name="availability" id="availability" value={formData.availability} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                {Object.values(CIARating).map(rating => (
                                    <option key={rating} value={rating}>{rating}</option>
                                ))}
                            </select>
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