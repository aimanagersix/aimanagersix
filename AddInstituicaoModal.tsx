import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Instituicao } from '../types';
import { SpinnerIcon, SearchIcon, CheckIcon } from './common/Icons';
import { FaGlobe, FaMagic } from 'react-icons/fa';

const NIF_API_KEY = '9393091ec69bd1564657157b9624809e';

const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const extractDomain = (url: string): string => {
    try {
        let domain = url.trim();
        if (!domain) return '';
        if (!domain.startsWith('http')) domain = 'https://' + domain;
        const hostname = new URL(domain).hostname;
        return hostname.replace(/^www\./, '');
    } catch { return ''; }
};

interface AddInstituicaoModalProps {
    onClose: () => void;
    onSave: (instituicao: Omit<Instituicao, 'id'> | Instituicao) => Promise<any>;
    instituicaoToEdit?: Instituicao | null;
}

const AddInstituicaoModal: React.FC<AddInstituicaoModalProps> = ({ onClose, onSave, instituicaoToEdit }) => {
    const [formData, setFormData] = useState<Partial<Instituicao>>({
        codigo: '',
        name: '',
        email: '',
        telefone: '',
        nif: '',
        website: '',
        address_line: '',
        postal_code: '',
        city: '',
        locality: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isFetchingNif, setIsFetchingNif] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [emailSuggestion, setEmailSuggestion] = useState('');

    useEffect(() => {
        if (instituicaoToEdit) {
            setFormData({
                ...instituicaoToEdit, 
                codigo: instituicaoToEdit.codigo,
                name: instituicaoToEdit.name,
                email: instituicaoToEdit.email,
                telefone: instituicaoToEdit.telefone,
                nif: instituicaoToEdit.nif || '',
                website: instituicaoToEdit.website || '',
                address_line: instituicaoToEdit.address_line || instituicaoToEdit.address || '',
                postal_code: instituicaoToEdit.postal_code || '',
                city: instituicaoToEdit.city || '',
                locality: instituicaoToEdit.locality || '',
            });
        }
    }, [instituicaoToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = "O nome da instituição é obrigatório.";
        if (!formData.codigo?.trim()) newErrors.codigo = "O código é obrigatório.";
        
        if (formData.email?.trim() && !isValidEmail(formData.email)) {
            newErrors.email = "Formato de email inválido.";
        }
        
        if (formData.nif?.trim()) {
             const cleanNif = formData.nif.replace(/\s/g, '');
             if (!/^\d{9}$/.test(cleanNif)) {
                 newErrors.nif = "O NIF deve ter exatamente 9 dígitos numéricos.";
             }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'email') {
            setEmailSuggestion('');
            if (value.endsWith('@') && formData.website) {
                const domain = extractDomain(formData.website);
                if (domain) setEmailSuggestion(domain);
            }
        }

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    const applyEmailSuggestion = () => {
        if (emailSuggestion) {
            setFormData(prev => ({ ...prev, email: (prev.email || '') + emailSuggestion }));
            setEmailSuggestion('');
        }
    };

    const handleFetchNifData = async () => {
        if (!formData.nif?.trim()) {
            setErrors(prev => ({ ...prev, nif: "Insira um NIF para pesquisar." }));
            return;
        }

        const nif = formData.nif.trim().replace(/[^0-9]/g, '');
        if (nif.length !== 9) {
             setErrors(prev => ({ ...prev, nif: "O NIF deve ter 9 dígitos." }));
             return;
        }

        setIsFetchingNif(true);
        try {
            const targetUrl = `https://www.nif.pt/?json=1&q=${nif}&key=${NIF_API_KEY}`;
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
            const response = await fetch(proxyUrl);
            
            if (response.ok) {
                const data = await response.json();
                if (data.result === 'success' && data.records && data.records[nif]) {
                    const record = data.records[nif];
                    setFormData(prev => ({
                        ...prev,
                        name: prev.name || record.title, 
                        nif: nif,
                        address_line: record.address,
                        postal_code: record.pc4 && record.pc3 ? `${record.pc4}-${record.pc3}` : prev.postal_code,
                        city: record.city,
                        locality: record.city, 
                        email: record.contacts?.email || prev.email,
                        telefone: record.contacts?.phone || prev.telefone,
                        website: record.website || prev.website
                    }));
                }
            }
        } catch (e) {
            console.error("Erro NIF.pt:", e);
        } finally {
            setIsFetchingNif(false);
        }
    };

    const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9-]/g, ''); 
        if (val.length > 4 && val.indexOf('-') === -1) val = val.slice(0, 4) + '-' + val.slice(4);
        if (val.length > 8) val = val.slice(0, 8);
        setFormData(prev => ({ ...prev, postal_code: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsSaving(true);
        const address = [formData.address_line, formData.postal_code, formData.city].filter(Boolean).join(', ');
        const dataToSave: any = { ...formData, address };

        try {
            await onSave(dataToSave);
            onClose();
        } catch (error: any) {
            console.error("Failed to save institution", error);
            alert(error.message || "Erro ao gravar instituição.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const modalTitle = instituicaoToEdit ? "Editar Instituição" : "Adicionar Nova Instituição";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="nif" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">NIF da Instituição</label>
                        <div className="flex">
                            <input 
                                type="text" 
                                name="nif" 
                                id="nif" 
                                value={formData.nif} 
                                onChange={handleChange} 
                                placeholder="NIF"
                                maxLength={9}
                                className={`flex-grow bg-gray-700 border text-white rounded-l p-2 ${errors.nif ? 'border-red-500' : 'border-gray-600'}`}
                            />
                            <button 
                                type="button" 
                                onClick={handleFetchNifData}
                                disabled={isFetchingNif || !formData.nif}
                                className="bg-gray-600 px-3 rounded-r hover:bg-gray-500 text-white transition-colors border-t border-b border-r border-gray-600 flex items-center justify-center min-w-[3rem]"
                            >
                                {isFetchingNif ? <SpinnerIcon /> : <SearchIcon />}
                            </button>
                        </div>
                        {errors.nif && <p className="text-red-400 text-xs italic mt-1">{errors.nif}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome da Instituição</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded p-2 ${errors.name ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.name && <p className="text-red-400 text-xs italic mt-1">{errors.name}</p>}
                    </div>
                </div>
                
                <div>
                    <label htmlFor="codigo" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Código (Identificador único)</label>
                    <input type="text" name="codigo" id="codigo" value={formData.codigo} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded p-2 ${errors.codigo ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.codigo && <p className="text-red-400 text-xs italic mt-1">{errors.codigo}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <label htmlFor="email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded p-2 ${errors.email ? 'border-red-500' : 'border-gray-600'}`} />
                        {emailSuggestion && (
                            <div 
                                className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 text-brand-secondary text-xs px-2 py-1 rounded cursor-pointer hover:bg-gray-700 z-10 flex items-center gap-1 shadow-lg"
                                onClick={applyEmailSuggestion}
                            >
                                <FaMagic /> Sugestão: {emailSuggestion}
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="telefone" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telefone</label>
                        <input type="tel" name="telefone" id="telefone" value={formData.telefone} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded p-2 border-gray-600`} placeholder="Ex: 210000000" />
                    </div>
                </div>
                
                <div className="bg-gray-900/30 p-4 rounded border border-gray-700 mt-2">
                    <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-widest">Morada e Localização</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Rua / Endereço</label>
                            <input type="text" name="address_line" value={formData.address_line} onChange={handleChange} placeholder="Rua Principal, 123" className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Código Postal</label>
                                <input type="text" name="postal_code" value={formData.postal_code} onChange={handlePostalCodeChange} placeholder="0000-000" className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Cidade</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Localidade</label>
                                <input type="text" name="locality" value={formData.locality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"/>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:opacity-50 flex items-center gap-2">
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                        Salvar
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddInstituicaoModal;