
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Instituicao } from '../types';
import { SpinnerIcon, SearchIcon, CheckIcon } from './common/Icons';

const NIF_API_KEY = '9393091ec69bd1564657157b9624809e';

const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true; // Optional
    // Remove spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s-()]/g, '').replace(/^\+351/, '');
    // Portugal: Landline starts with 2, Mobile starts with 9. Length 9.
    const regex = /^(2\d{8}|9[1236]\d{7})$/;
    return regex.test(cleaned);
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
        address_line: '',
        postal_code: '',
        city: '',
        locality: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isFetchingCP, setIsFetchingCP] = useState(false);
    const [isFetchingNif, setIsFetchingNif] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (instituicaoToEdit) {
            setFormData({
                ...instituicaoToEdit, 
                codigo: instituicaoToEdit.codigo,
                name: instituicaoToEdit.name,
                email: instituicaoToEdit.email,
                telefone: instituicaoToEdit.telefone,
                nif: instituicaoToEdit.nif || '',
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
            newErrors.email = "Formato de email inválido (ex: geral@empresa.com).";
        }
        
        if (formData.telefone?.trim() && !isValidPhoneNumber(formData.telefone)) {
            newErrors.telefone = "Número inválido. Deve ter 9 dígitos (começado por 2 ou 9).";
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
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
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
        setErrors(prev => {
            const newErr = { ...prev };
            delete newErr.nif;
            return newErr;
        });

        try {
            const response = await fetch(`https://corsproxy.io/?https://www.nif.pt/?json=1&q=${nif}&key=${NIF_API_KEY}`);
            
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
                    }));
                } else {
                     setErrors(prev => ({ ...prev, nif: "NIF não encontrado ou inválido." }));
                }
            } else {
                 setErrors(prev => ({ ...prev, nif: "Erro ao comunicar com o serviço de validação." }));
            }

        } catch (e) {
            console.error("Erro NIF.pt:", e);
            setErrors(prev => ({ ...prev, nif: "Erro na consulta do NIF." }));
        } finally {
            setIsFetchingNif(false);
        }
    };

    const handlePostalCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        val = val.replace(/[^0-9-]/g, ''); 
        if (val.length > 4 && val.indexOf('-') === -1) {
            val = val.slice(0, 4) + '-' + val.slice(4);
        }
        if (val.length > 8) val = val.slice(0, 8);

        setFormData(prev => ({ ...prev, postal_code: val }));

        if (/^\d{4}-\d{3}$/.test(val)) {
            setIsFetchingCP(true);
            try {
                const res = await fetch(`https://json.geoapi.pt/cp/${val}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.Concelho) {
                        let loc = '';
                        if (data.Freguesia) loc = data.Freguesia;
                        else if (data.part && data.part.length > 0) loc = data.part[0];

                        setFormData(prev => ({
                            ...prev,
                            city: data.Concelho,
                            locality: loc
                        }));
                    }
                }
            } catch (err) {
                console.warn("Erro CP:", err);
            } finally {
                setIsFetchingCP(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsSaving(true);
        setSuccessMessage('');

        const address = [formData.address_line, formData.postal_code, formData.city].filter(Boolean).join(', ');
        
        // Clean up contacts if they exist in type but we don't use them anymore here
        const dataToSave: any = { ...formData, address };
        delete dataToSave.contacts;

        try {
            let result;
            if (instituicaoToEdit) {
                result = await onSave({ ...instituicaoToEdit, ...dataToSave });
            } else {
                result = await onSave(dataToSave);
            }

            if (result) {
                setSuccessMessage('Dados guardados com sucesso!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (e) {
            console.error("Failed to save institution", e);
            alert("Erro ao gravar instituição.");
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
                        <label htmlFor="nif" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">NIF (Opcional)</label>
                        <div className="flex">
                            <input 
                                type="text" 
                                name="nif" 
                                id="nif" 
                                value={formData.nif} 
                                onChange={handleChange} 
                                placeholder="NIF"
                                maxLength={9}
                                className={`flex-grow bg-gray-700 border text-white rounded-l-md p-2 ${errors.nif ? 'border-red-500' : 'border-gray-600'}`}
                            />
                            <button 
                                type="button" 
                                onClick={handleFetchNifData}
                                disabled={isFetchingNif || !formData.nif}
                                className="bg-gray-600 px-3 rounded-r-md hover:bg-gray-500 text-white transition-colors border-t border-b border-r border-gray-600 flex items-center justify-center min-w-[3rem]"
                                title="Preencher dados via NIF"
                            >
                                {isFetchingNif ? <SpinnerIcon /> : <SearchIcon />}
                            </button>
                        </div>
                        {errors.nif && <p className="text-red-400 text-xs italic mt-1">{errors.nif}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome da Instituição</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.name ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.name && <p className="text-red-400 text-xs italic mt-1">{errors.name}</p>}
                    </div>
                </div>
                
                <div>
                    <label htmlFor="codigo" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Código</label>
                    <input type="text" name="codigo" id="codigo" value={formData.codigo} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.codigo ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.codigo && <p className="text-red-400 text-xs italic mt-1">{errors.codigo}</p>}
                </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.email ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.email && <p className="text-red-400 text-xs italic mt-1">{errors.email}</p>}
                    </div>
                        <div>
                        <label htmlFor="telefone" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telefone</label>
                        <input type="tel" name="telefone" id="telefone" value={formData.telefone} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.telefone ? 'border-red-500' : 'border-gray-600'}`} placeholder="Ex: 210000000" />
                        {errors.telefone && <p className="text-red-400 text-xs italic mt-1">{errors.telefone}</p>}
                    </div>
                </div>

                <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700 mt-2">
                    <h4 className="text-sm font-semibold text-white mb-3 border-b border-gray-700 pb-1">Morada da Instituição</h4>
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="address_line" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Endereço</label>
                            <input type="text" name="address_line" value={formData.address_line} onChange={handleChange} placeholder="Rua Principal, 123" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label htmlFor="postal_code" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Código Postal</label>
                                <div className="relative">
                                    <input type="text" name="postal_code" value={formData.postal_code} onChange={handlePostalCodeChange} placeholder="0000-000" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"/>
                                    {isFetchingCP && <div className="absolute right-2 top-2"><SpinnerIcon className="h-4 w-4"/></div>}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Cidade / Concelho</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"/>
                            </div>
                            <div>
                                <label htmlFor="locality" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Localidade</label>
                                <input type="text" name="locality" value={formData.locality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"/>
                            </div>
                        </div>
                    </div>
                </div>

                {successMessage && (
                    <div className="p-3 bg-green-500/20 text-green-300 rounded border border-green-500/50 text-center font-medium animate-fade-in">
                        {successMessage}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar / Cancelar</button>
                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50">
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : successMessage ? <CheckIcon className="h-4 w-4" /> : null}
                        {isSaving ? 'A Gravar...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddInstituicaoModal;
