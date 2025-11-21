
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Supplier, CriticalityLevel } from '../types';
import { FaShieldAlt, FaGlobe } from 'react-icons/fa';
import { SearchIcon, SpinnerIcon } from './common/Icons';

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
    const [isFetchingVies, setIsFetchingVies] = useState(false);

    useEffect(() => {
        if (supplierToEdit) {
            setFormData({ ...supplierToEdit });
        }
    }, [supplierToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = "O nome do fornecedor é obrigatório.";
        if (!formData.nif?.trim()) newErrors.nif = "O NIF é obrigatório.";
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
        
        // Limpar erro do campo ao digitar
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleFetchVies = async () => {
        if (!formData.nif?.trim()) {
            setErrors(prev => ({ ...prev, nif: "Insira um NIF para pesquisar." }));
            return;
        }

        setIsFetchingVies(true);
        setErrors(prev => {
            const newErr = { ...prev };
            delete newErr.nif;
            return newErr;
        });

        try {
            // Normalização do NIF
            let input = formData.nif.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            let countryCode = 'PT'; // Default Portugal
            let vatNumber = input;

            // Detetar prefixo de país (ex: PT501..., ES123...)
            const countryMatch = input.match(/^([A-Z]{2})(.+)$/);
            if (countryMatch) {
                countryCode = countryMatch[1];
                vatNumber = countryMatch[2];
            }

            // Validação básica de formato antes de chamar API
            if (vatNumber.length < 2) {
                setErrors(prev => ({ ...prev, nif: "Formato de NIF inválido." }));
                setIsFetchingVies(false);
                return;
            }

            let success = false;
            let resultData: any = null;

            // 1. TENTATIVA PRINCIPAL: ViesAPI.eu (Credenciais Fornecidas)
            try {
                const id = 'oRj4r9WYBXhh';
                const key = 'KwXUigqU31Xy';
                const auth = btoa(`${id}:${key}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

                const response = await fetch(`https://viesapi.eu/api/v1/get/euvat/${countryCode}${vatNumber}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Accept': 'application/json'
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    // A API viesapi.eu retorna 'valid' (boolean)
                    if (data && data.valid) {
                        resultData = {
                            name: data.traderName || data.name,
                            address: data.traderAddress || data.address
                        };
                        success = true;
                    } else if (data && data.valid === false) {
                        // Se a API responder explicitamente que é inválido, paramos aqui
                        setErrors(prev => ({ ...prev, nif: `O NIF ${input} não é válido no sistema VIES.` }));
                        setIsFetchingVies(false);
                        return;
                    }
                }
            } catch (e) {
                console.warn("ViesAPI.eu falhou ou timed out, a tentar proxies públicos...", e);
            }

            // 2. FALLBACK: Proxies Públicos (Redundância para o serviço público da UE)
            if (!success) {
                const targetUrl = `https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number/${countryCode}/${vatNumber}`;
                
                const proxies = [
                    {
                        name: 'allorigins-raw',
                        url: (target: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
                        isWrapper: false
                    },
                    {
                        name: 'corsproxy',
                        url: (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
                        isWrapper: false
                    }
                ];

                // Tenta os proxies sequencialmente
                for (const proxy of proxies) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout por proxy

                        const response = await fetch(proxy.url(targetUrl), { 
                            signal: controller.signal,
                            headers: { 'Accept': 'application/json' }
                        });
                        clearTimeout(timeoutId);

                        if (response.ok) {
                            const text = await response.text();
                            let json;
                            try {
                                json = JSON.parse(text);
                            } catch (e) { continue; }

                            const data = proxy.isWrapper && json.contents ? JSON.parse(json.contents) : json;

                            if (data && (data.isValid || data.valid)) {
                                resultData = {
                                    name: data.name,
                                    address: data.address
                                };
                                success = true;
                                break; 
                            }
                        }
                    } catch (err) {
                        console.warn(`Falha no proxy ${proxy.name}`, err);
                    }
                }
            }

            if (success && resultData) {
                setFormData(prev => ({
                    ...prev,
                    name: resultData.name || prev.name,
                    nif: input,
                    notes: (prev.notes ? prev.notes + '\n\n' : '') + (resultData.address ? `Endereço (VIES): ${resultData.address}` : '')
                }));
                // Limpar erro se houver sucesso
                setErrors(prev => {
                    const newErr = { ...prev };
                    delete newErr.nif;
                    return newErr;
                });
            } else {
                throw new Error("Todos os métodos de consulta falharam");
            }

        } catch (e) {
            console.error("Erro VIES:", e);
            // Definir a mensagem de erro específica solicitada no campo NIF
            setErrors(prev => ({
                ...prev,
                nif: "Não foi possível obter dados do VIES automaticamente (Erro de rede ou serviço indisponível). Por favor, preencha os dados manualmente."
            }));
        } finally {
            setIsFetchingVies(false);
        }
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
                        <label htmlFor="nif" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">NIF / VAT Number <span className="text-red-400">*</span></label>
                        <div className="flex">
                            <input 
                                type="text" 
                                name="nif" 
                                id="nif" 
                                value={formData.nif} 
                                onChange={handleChange} 
                                placeholder="Ex: 501234567"
                                className={`flex-grow bg-gray-700 border text-white rounded-l-md p-2 ${errors.nif ? 'border-red-500' : 'border-gray-600'}`}
                            />
                            <button 
                                type="button" 
                                onClick={handleFetchVies}
                                disabled={isFetchingVies || !formData.nif}
                                className="bg-gray-600 px-3 rounded-r-md hover:bg-gray-500 text-white transition-colors border-t border-b border-r border-gray-600 flex items-center justify-center min-w-[3rem]"
                                title="Pesquisar no VIES (Europa)"
                            >
                                {isFetchingVies ? <SpinnerIcon /> : <SearchIcon />}
                            </button>
                        </div>
                        {errors.nif && <p className="text-red-400 text-xs italic mt-1">{errors.nif}</p>}
                        <p className="text-[10px] text-gray-500 mt-1">Clique na lupa para preencher Nome e Endereço automaticamente.</p>
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome da Empresa <span className="text-red-400">*</span></label>
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
                    <label htmlFor="notes" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Notas Adicionais / Endereço</label>
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
