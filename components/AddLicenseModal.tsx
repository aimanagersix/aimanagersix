import React, { useState, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { SoftwareLicense, LicenseStatus, CriticalityLevel, CIARating, Supplier, SoftwareCategory, SoftwareProduct } from '../types';
import { FaShieldAlt, FaEuroSign, FaTags, FaCompactDisc } from 'react-icons/fa';
import { getSupabase } from '../services/supabaseClient';

interface AddLicenseModalProps {
    onClose: () => void;
    onSave: (license: Omit<SoftwareLicense, 'id'> | SoftwareLicense) => Promise<any>;
    licenseToEdit?: SoftwareLicense | null;
    suppliers?: Supplier[];
    categories?: SoftwareCategory[];
}

const AddLicenseModal: React.FC<AddLicenseModalProps> = ({ onClose, onSave, licenseToEdit, suppliers = [], categories = [] }) => {
    // FIX: Updated property names to snake_case to match types.ts
    const [formData, setFormData] = useState<Partial<SoftwareLicense>>({
        product_name: '',
        license_key: '',
        total_seats: 1,
        purchase_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        purchase_email: '',
        invoice_number: '',
        status: LicenseStatus.Ativo,
        criticality: CriticalityLevel.Low,
        supplier_id: '',
        unit_cost: 0,
        is_oem: false,
        category_id: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Software Products from DB
    const [products, setProducts] = useState<SoftwareProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>('');

    useEffect(() => {
        const loadProducts = async () => {
            const supabase = getSupabase();
            const { data } = await supabase.from('config_software_products').select('*');
            if (data) setProducts(data);
        };
        loadProducts();
    }, []);

    useEffect(() => {
        if (licenseToEdit) {
            // FIX: Updated property names to snake_case
            setFormData({
                product_name: licenseToEdit.product_name,
                license_key: licenseToEdit.license_key,
                total_seats: licenseToEdit.total_seats,
                purchase_date: licenseToEdit.purchase_date || '',
                expiry_date: licenseToEdit.expiry_date || '',
                purchase_email: licenseToEdit.purchase_email || '',
                invoice_number: licenseToEdit.invoice_number || '',
                status: licenseToEdit.status || LicenseStatus.Ativo,
                criticality: licenseToEdit.criticality || CriticalityLevel.Low,
                supplier_id: licenseToEdit.supplier_id || '',
                unit_cost: licenseToEdit.unit_cost || 0,
                is_oem: licenseToEdit.is_oem || false,
                category_id: licenseToEdit.category_id || ''
            });
        }
    }, [licenseToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        // FIX: Updated property names to snake_case
        if (!formData.product_name?.trim()) newErrors.product_name = "O nome do produto é obrigatório.";
        if (!formData.license_key?.trim()) newErrors.license_key = "A chave de licença (ou identificador) é obrigatória.";
        
        // Total seats required only if NOT OEM
        if (!formData.is_oem && (formData.total_seats || 0) < 1) {
            newErrors.total_seats = "O total deve ser pelo menos 1.";
        }
        
        if (formData.purchase_email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.purchase_email)) {
            newErrors.purchase_email = "O formato do email é inválido.";
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
    
    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const prodId = e.target.value;
        setSelectedProduct(prodId);
        const prod = products.find(p => p.id === prodId);
        if (prod) {
            // FIX: Updated property names to snake_case
            setFormData(prev => ({
                ...prev,
                product_name: prod.name,
                category_id: prod.category_id
            }));
        }
    };

    const handleSetExpiry = (years: number) => {
        // FIX: Updated property names to snake_case
        if (!formData.purchase_date) return;
        const purchase = new Date(formData.purchase_date);
        purchase.setUTCFullYear(purchase.getUTCFullYear() + years);
        const expiry = purchase.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, expiry_date: expiry }));
    };

    const handleSetLifetime = () => {
        // FIX: Updated property names to snake_case
        setFormData(prev => ({ ...prev, expiry_date: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        // FIX: Updated property names to snake_case
        const dataToSave = {
            ...formData,
            product_name: formData.product_name!,
            license_key: formData.license_key!,
            total_seats: formData.is_oem ? 0 : formData.total_seats!,
            status: formData.status!,
            purchase_date: formData.purchase_date || undefined,
            expiry_date: formData.expiry_date || undefined,
            purchase_email: formData.purchase_email || undefined,
            invoice_number: formData.invoice_number || undefined,
            supplier_id: formData.supplier_id || undefined,
            unit_cost: formData.unit_cost || 0,
            is_oem: formData.is_oem || false,
            category_id: formData.category_id || undefined
        };

        if (licenseToEdit) {
            onSave({ ...licenseToEdit, ...dataToSave } as SoftwareLicense);
        } else {
            onSave(dataToSave as Omit<SoftwareLicense, 'id'>);
        }
        onClose();
    };
    
    const modalTitle = licenseToEdit ? "Editar Licença" : "Adicionar Nova Licença";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-900/30 p-3 rounded border border-gray-700 mb-2">
                     <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-2">
                        <FaCompactDisc/> Produto Standard (Opcional)
                    </label>
                    <select 
                        value={selectedProduct} 
                        onChange={handleProductChange} 
                        className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm"
                    >
                        <option value="">-- Selecione da lista ou digite abaixo --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div>
                    <label htmlFor="product_name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome do Produto</label>
                    <input type="text" name="product_name" id="product_name" value={formData.product_name} onChange={handleChange} placeholder="Ex: Windows 11 Pro OEM, Adobe CC..." className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.product_name ? 'border-red-500' : 'border-gray-600'}`} />
                    {errors.product_name && <p className="text-red-400 text-xs italic mt-1">{errors.product_name}</p>}
                </div>
                 <div>
                    <label htmlFor="license_key" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Chave de Licença / Identificador</label>
                    <input type="text" name="license_key" id="license_key" value={formData.license_key} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.license_key ? 'border-red-500' : 'border-gray-600'}`} />
                    {errors.license_key && <p className="text-red-400 text-xs italic mt-1">{errors.license_key}</p>}
                </div>
                
                {/* Category Dropdown */}
                <div>
                    <label htmlFor="category_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1 flex items-center gap-2">
                        <FaTags className="text-gray-400"/> Categoria de Software
                    </label>
                    <select 
                        name="category_id" 
                        id="category_id" 
                        value={formData.category_id} 
                        onChange={handleChange} 
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                    >
                        <option value="">-- Selecione --</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
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
                            <label htmlFor="total_seats" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Total de Ativações Compradas</label>
                            <input type="number" name="total_seats" id="total_seats" value={formData.total_seats} onChange={handleChange} min="1" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.total_seats ? 'border-red-500' : 'border-gray-600'}`} />
                            {errors.total_seats && <p className="text-red-400 text-xs italic mt-1">{errors.total_seats}</p>}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="invoice_number" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número da Fatura (Opcional)</label>
                        <input type="text" name="invoice_number" id="invoice_number" value={formData.invoice_number} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 border-gray-600`} />
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
                        <label htmlFor="purchase_email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email Associado à Compra (Opcional)</label>
                        <input type="email" name="purchase_email" id="purchase_email" value={formData.purchase_email} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.purchase_email ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.purchase_email && <p className="text-red-400 text-xs italic mt-1">{errors.purchase_email}</p>}
                    </div>
                    <div>
                        <label htmlFor="purchase_date" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data de Compra (Opcional)</label>
                        <input type="date" name="purchase_date" id="purchase_date" value={formData.purchase_date} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="expiry_date" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data de Expiração (Opcional)</label>
                        <div className="flex items-center gap-2">
                            <input type="date" name="expiry_date" id="expiry_date" value={formData.expiry_date} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
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
                        <label htmlFor="unit_cost" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Custo Unitário (€)</label>
                        <input 
                            type="number" 
                            name="unit_cost" 
                            id="unit_cost" 
                            value={formData.unit_cost} 
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