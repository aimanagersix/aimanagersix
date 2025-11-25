
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Entidade, Instituicao, EntidadeStatus, ResourceContact } from '../types';
import { SpinnerIcon, SearchIcon, CheckIcon } from './common/Icons';
import { ContactList } from './common/ContactList';
import * as dataService from '../services/dataService';

const NIF_API_KEY = '9393091ec69bd1564657157b9624809e';

const isPortuguesePhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true; // Optional fields are valid if empty
    const cleaned = phone.replace(/[\s-()]/g, '').replace(/^\+351/, '');
    const regex = /^(2\d{8}|9[1236]\d{7})$/;
    return regex.test(cleaned);
};

interface AddEntidadeModalProps {
    onClose: () => void;
    onSave: (entidade: Omit<Entidade, 'id'> | Entidade) => Promise<any>;
    entidadeToEdit?: Entidade | null;
    instituicoes: Instituicao[];
}

const AddEntidadeModal: React.FC<AddEntidadeModalProps> = ({ onClose, onSave, entidadeToEdit, instituicoes }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'contacts'>('general');
    const [formData, setFormData] = useState<Partial<Entidade>>({
        instituicaoId: instituicoes[0]?.id || '',
        codigo: '',
        name: '',
        description: '',
        email: '',
        nif: '',
        responsavel: '',
        telefone: '',
        telemovel: '',
        telefoneInterno: '',
        status: EntidadeStatus.Ativo,
        address_line: '',
        postal_code: '',
        city: '',
        locality: '',
        contacts: []
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isFetchingCP, setIsFetchingCP] = useState(false);
    const [isFetchingNif, setIsFetchingNif] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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
                responsavel: entidadeToEdit.responsavel || '',
                telefone: entidadeToEdit.telefone || '',
                telemovel: entidadeToEdit.telemovel || '',
                telefoneInterno: entidadeToEdit.telefoneInterno || '',
                status: entidadeToEdit.status || EntidadeStatus.Ativo,
                address_line: entidadeToEdit.address_line || entidadeToEdit.address || '',
                postal_code: entidadeToEdit.postal_code || '',
                city: entidadeToEdit.city || '',
                locality: entidadeToEdit.locality || '',
                contacts: entidadeToEdit.contacts ? [...entidadeToEdit.contacts] : [] // Deep copy
            });
        }
    }, [entidadeToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = "O nome é obrigatório.";
        if (!formData.codigo?.trim()) newErrors.codigo = "O código é obrigatório.";
        if (!formData.instituicaoId) newErrors.instituicaoId = "A instituição é obrigatória.";
        
        if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email inválido.";
        }
        
        if (formData.telefone?.trim() && !isPortuguesePhoneNumber(formData.telefone)) {
            newErrors.telefone = "Telefone inválido.";
        }
        if (formData.telemovel?.trim() && !isPortuguesePhoneNumber(formData.telemovel)) {
            newErrors.telemovel = "Telemóvel inválido.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
        if (!formData.nif?.trim()) return;
        const nif = formData.nif.trim().replace(/[^0-9]/g, '');
        if (nif.length !== 9) return;

        setIsFetchingNif(true);
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
                }
            }
        } catch (e) {
            console.error("Erro NIF:", e);
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

    const handleContactsChange = (contacts: ResourceContact[]) => {
        setFormData(prev => ({ ...prev, contacts }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsSaving(true);
        setSuccessMessage('');

        const address = [formData.address_line, formData.postal_code, formData.city].filter(Boolean).join(', ');
        const dataToSave: any = { ...formData, address };
        const contacts = dataToSave.contacts;
        delete dataToSave.contacts;

        try {
            let result;
            if (entidadeToEdit) {
                // Merge old data with new, but explicitly remove contacts to prevent SQL error
                const payload = { ...entidadeToEdit, ...dataToSave };
                delete payload.contacts;
                result = await onSave(payload);
            } else {
                result = await onSave(dataToSave);
            }

            if (result) {
                if (result.id && contacts) {
                    try {
                        await dataService.syncResourceContacts('entidade', result.id, contacts);
                    } catch (contactError: any) {
                        console.error("Error saving contacts:", contactError);
                    }
                }
                setSuccessMessage('Dados guardados com sucesso!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (e) {
            console.error(e);
            alert("Erro ao gravar entidade.");
        } finally {
            setIsSaving(false);
        }
    };

    const modalTitle = entidadeToEdit ? "Editar Entidade" : "Adicionar Nova Entidade";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <div className="flex border-b border-gray-700 mb-4">
                <button 
                    onClick={() => setActiveTab('general')} 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Dados Gerais
                </button>
                <button 
                    onClick={() => setActiveTab('contacts')} 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'contacts' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Contactos Adicionais
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'general' && (
                    <>
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
                                        className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-l-md p-2"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleFetchNifData}
                                        disabled={isFetchingNif}
                                        className="bg-gray-600 px-3 rounded-r-md hover:bg-gray-500 text-white border-t border-b border-r border-gray-600"
                                    >
                                        {isFetchingNif ? <SpinnerIcon /> : <SearchIcon />}
                                    </button>
                                </div>
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
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email</label>
                                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.email ? 'border-red-500' : 'border-gray-600'}`} />
                                {errors.email && <p className="text-red-400 text-xs italic mt-1">{errors.email}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="telefone" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telefone</label>
                                <input type="tel" name="telefone" id="telefone" value={formData.telefone} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.telefone ? 'border-red-500' : 'border-gray-600'}`} />
                                {errors.telefone && <p className="text-red-400 text-xs italic mt-1">{errors.telefone}</p>}
                            </div>
                            <div>
                                <label htmlFor="telemovel" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telemóvel</label>
                                <input type="tel" name="telemovel" id="telemovel" value={formData.telemovel} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.telemovel ? 'border-red-500' : 'border-gray-600'}`} />
                                {errors.telemovel && <p className="text-red-400 text-xs italic mt-1">{errors.telemovel}</p>}
                            </div>
                            <div>
                                <label htmlFor="telefoneInterno" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Extensão</label>
                                <input type="text" name="telefoneInterno" id="telefoneInterno" value={formData.telefoneInterno} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            </div>
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
                                        <label htmlFor="city" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Cidade</label>
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
                    </>
                )}

                {activeTab === 'contacts' && (
                    <ContactList 
                        contacts={formData.contacts || []} 
                        onChange={handleContactsChange} 
                        resourceType="entidade"
                    />
                )}

                {successMessage && (
                    <div className="p-3 bg-green-500/20 text-green-300 rounded border border-green-500/50 text-center font-medium animate-fade-in">
                        {successMessage}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
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
