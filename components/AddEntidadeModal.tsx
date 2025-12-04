
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Entidade, Instituicao, EntidadeStatus } from '../types';
import { SpinnerIcon, SearchIcon, CheckIcon } from './common/Icons';
import { FaGlobe, FaMagic } from 'react-icons/fa';
import * as dataService from '../services/dataService';

const NIF_API_KEY = '9393091ec69bd1564657157b9624809e';

const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true; 
    const cleaned = phone.replace(/[\s-()]/g, '').replace(/^\+351/, '');
    const regex = /^(2\d{8}|9[1236]\d{7})$/;
    return regex.test(cleaned);
};

// Extract domain from website URL
const extractDomain = (url: string): string => {
    try {
        let domain = url.trim();
        if (!domain) return '';
        if (!domain.startsWith('http')) domain = 'https://' + domain;
        const hostname = new URL(domain).hostname;
        return hostname.replace(/^www\./, '');
    } catch { return ''; }
};

interface AddEntidadeModalProps {
    onClose: () => void;
    onSave: (entidade: Omit<Entidade, 'id'> | Entidade) => Promise<any>;
    entidadeToEdit?: Entidade | null;
    instituicoes: Instituicao[];
}

const AddEntidadeModal: React.FC<AddEntidadeModalProps> = ({ onClose, onSave, entidadeToEdit, instituicoes }) => {
    const [formData, setFormData] = useState<Partial<Entidade>>({
        instituicaoId: instituicoes[0]?.id || '',
        codigo: '',
        name: '',
        description: '',
        email: '',
        nif: '',
        website: '',
        responsavel: '',
        telefone: '',
        telemovel: '',
        telefoneInterno: '',
        status: EntidadeStatus.Ativo,
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
    const [emailSuggestion, setEmailSuggestion] = useState('');

    useEffect(() => {
        if (entidadeToEdit) {
            setFormData({
                ...entidadeToEdit,
                instituicaoId: entidadeToEdit.instituicaoId,
                codigo: entidadeToEdit.codigo,
                name: entidadeToEdit.name,
                description: entidadeToEdit.description,
                email: entidadeToEdit.email,
                nif: entidadeToEdit.nif || '',
                website: entidadeToEdit.website || '',
                responsavel: entidadeToEdit.responsavel || '',
                telefone: entidadeToEdit.telefone || '',
                telemovel: entidadeToEdit.telemovel || '',
                telefoneInterno: entidadeToEdit.telefoneInterno || '',
                status: entidadeToEdit.status || EntidadeStatus.Ativo,
                address_line: entidadeToEdit.address_line || entidadeToEdit.address || '',
                postal_code: entidadeToEdit.postal_code || '',
                city: entidadeToEdit.city || '',
                locality: entidadeToEdit.locality || '',
            });
        }
    }, [entidadeToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = "O nome é obrigatório.";
        if (!formData.codigo?.trim()) newErrors.codigo = "O código é obrigatório.";
        if (!formData.instituicaoId) newErrors.instituicaoId = "A instituição é obrigatória.";
        
        if (formData.email?.trim() && !isValidEmail(formData.email)) {
            newErrors.email = "Formato de email inválido.";
        }
        
        if (formData.telefone?.trim() && !isValidPhoneNumber(formData.telefone)) {
            newErrors.telefone = "Telefone inválido (9 dígitos, iniciar com 2 ou 9).";
        }
        if (formData.telemovel?.trim() && !isValidPhoneNumber(formData.telemovel)) {
            newErrors.telemovel = "Telemóvel inválido (9 dígitos, iniciar com 9).";
        }

        if (formData.nif?.trim()) {
             const cleanNif = formData.nif.replace(/\s/g, '');
             if (!/^\d{9}$/.test(cleanNif)) {
                 newErrors.nif = "O NIF deve ter exatamente 9 dígitos numéricos.";
             }
        }
        
        if (formData.website?.trim()) {
            if (!/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(formData.website)) {
                newErrors.website = "Formato de website inválido.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Smart Email Suggestion
        if (name === 'email') {
            setEmailSuggestion('');
            if (value.endsWith('@') && formData.website) {
                const domain = extractDomain(formData.website);
                if (domain) {
                    setEmailSuggestion(domain);
                }
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
        setErrors(prev => {
            const newErr = { ...prev };
            delete newErr.nif;
            return newErr;
        });

        try {
            // Use AllOrigins as a more stable proxy
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
                } else {
                     setErrors(prev => ({ ...prev, nif: "NIF não encontrado ou inválido." }));
                }
            }
        } catch (e) {
            console.error("Erro NIF:", e);
            setErrors(prev => ({ ...prev, nif: "Erro na consulta do NIF. Tente preencher manualmente." }));
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
        const address = [formData.address_line, formData.postal_code, formData.city].filter(Boolean).join(', ');
        const dataToSave: any = { ...formData, address };
        delete dataToSave.contacts;

        try {
            await onSave(dataToSave);
            onClose();
        } catch (error: any) {
            console.error("Failed to save entity", error);
            
            let msg = "Erro desconhecido ao gravar entidade.";
            
            // Check for Supabase/Postgres error codes
            if (error.code) {
                switch (error.code) {
                    case '23505': // Unique violation
                        msg = "Erro: Já existe uma entidade com este Código ou NIF.";
                        break;
                    case '42501': // RLS / Permission denied
                        msg = "Permissão negada: O seu utilizador não tem permissão para criar/editar entidades. Contacte o SuperAdmin.";
                        break;
                    case '42P01': // Table not found
                        msg = "Erro de Sistema: A tabela 'entidades' não existe. Execute o script de configuração de BD.";
                        break;
                    case '42703': // Column not found (e.g., audit trigger issue)
                        msg = "Erro de Estrutura de BD: Uma coluna necessária (ex: user_email) está em falta. Execute o script de Atualização de BD.";
                        break;
                    default:
                        msg = `Erro de Base de Dados (${error.code}): ${error.message}`;
                }
            } else if (error.message) {
                msg = `Erro: ${error.message}`;
            }

            alert(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const modalTitle = entidadeToEdit ? "Editar Entidade" : "Adicionar Nova Entidade";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="instituicaoId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Instituição</label>
                        <select 
                            name="instituicaoId" 
                            id="instituicaoId" 
                            value={formData.instituicaoId} 
                            onChange={handleChange} 
                            className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.instituicaoId ? 'border-red-500' : 'border-gray-600'}`}
                        >
                            {instituicoes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                        {errors.instituicaoId && <p className="text-red-400 text-xs italic mt-1">{errors.instituicaoId}</p>}
                    </div>
                    <div>
                        <label htmlFor="nif" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">NIF (Opcional)</label>
                        <div className="flex">
                            <input 
                                type="text" 
                                name="nif" 
                                id="nif" 
                                value={formData.nif} 
                                onChange={handleChange} 
                                maxLength={9}
                                className={`flex-grow bg-gray-700 border text-white rounded-l-md p-2 ${errors.nif ? 'border-red-500' : 'border-gray-600'}`}
                            />
                            <button 
                                type="button" 
                                onClick={handleFetchNifData}
                                disabled={isFetchingNif || !formData.nif}
                                className="bg-gray-600 px-3 rounded-r-md hover:bg-gray-500 text-white transition-colors border-t border-b border-r border-gray-600 flex items-center justify-center min-w-[3rem]"
                            >
                                {isFetchingNif ? <SpinnerIcon /> : <SearchIcon />}
                            </button>
                        </div>
                        {errors.nif && <p className="text-red-400 text-xs italic mt-1">{errors.nif}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="codigo" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Código</label>
                        <input type="text" name="codigo" id="codigo" value={formData.codigo} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.codigo ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.codigo && <p className="text-red-400 text-xs italic mt-1">{errors.codigo}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.name ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.name && <p className="text-red-400 text-xs italic mt-1">{errors.name}</p>}
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Descrição</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={2} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="responsavel" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Responsável</label>
                        <input type="text" name="responsavel" id="responsavel" value={formData.responsavel} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                    </div>
                    <div className="relative">
                        <label htmlFor="email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.email ? 'border-red-500' : 'border-gray-600'}`} />
                        {emailSuggestion && (
                            <div 
                                className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 text-brand-secondary text-xs px-2 py-1 rounded cursor-pointer hover:bg-gray-700 z-10 flex items-center gap-1 shadow-lg"
                                onClick={applyEmailSuggestion}
                            >
                                <FaMagic /> Sugestão: {emailSuggestion}
                            </div>
                        )}
                        {errors.email && <p className="text-red-400 text-xs italic mt-1">{errors.email}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="telefone" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telefone</label>
                        <input type="tel" name="telefone" id="telefone" value={formData.telefone} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.telefone ? 'border-red-500' : 'border-gray-600'}`} placeholder="Ex: 210000000" />
                        {errors.telefone && <p className="text-red-400 text-xs italic mt-1">{errors.telefone}</p>}
                    </div>
                    <div>
                        <label htmlFor="telemovel" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telemóvel</label>
                        <input type="tel" name="telemovel" id="telemovel" value={formData.telemovel} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.telemovel ? 'border-red-500' : 'border-gray-600'}`} placeholder="Ex: 910000000" />
                        {errors.telemovel && <p className="text-red-400 text-xs italic mt-1">{errors.telemovel}</p>}
                    </div>
                    <div>
                        <label htmlFor="telefoneInterno" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Extensão</label>
                        <input type="text" name="telefoneInterno" id="telefoneInterno" value={formData.telefoneInterno} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                    </div>
                </div>
                
                <div>
                    <label htmlFor="website" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Website</label>
                    <div className="flex items-center">
                        <FaGlobe className="text-gray-400 mr-2" />
                        <input type="text" name="website" id="website" value={formData.website} onChange={handleChange} placeholder="www.entidade.pt" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.website ? 'border-red-500' : 'border-gray-600'}`} />
                    </div>
                    {errors.website && <p className="text-red-400 text-xs italic mt-1">{errors.website}</p>}
                </div>

                <div className="bg-gray-900/30 p-3 rounded-lg border border-gray-700">
                    <h4 className="text-sm font-semibold text-white mb-2">Morada</h4>
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="address_line" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Endereço</label>
                            <input type="text" name="address_line" value={formData.address_line} onChange={handleChange} placeholder="Rua..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"/>
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

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Status</label>
                    <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                        {Object.values(EntidadeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {successMessage && (
                    <div className="p-3 bg-green-500/20 text-green-300 rounded border border-green-500/50 text-center font-medium animate-fade-in">
                        {successMessage}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar / Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 flex items-center gap-2">
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : successMessage ? <CheckIcon className="h-4 w-4"/> : null}
                        {isSaving ? 'A Gravar...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEntidadeModal;
