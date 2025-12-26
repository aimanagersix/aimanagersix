import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Entidade, Instituicao, EntidadeStatus } from '../types';
import { SpinnerIcon, SearchIcon, CheckIcon } from './common/Icons';
import { FaGlobe, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaSearchLocation } from 'react-icons/fa';

const NIF_API_KEY = '9393091ec69bd1564657157b9624809e';

interface AddEntidadeModalProps {
    onClose: () => void;
    onSave: (entidade: any) => Promise<any>;
    entidadeToEdit?: Entidade | null;
    instituicoes: Instituicao[];
}

const AddEntidadeModal: React.FC<AddEntidadeModalProps> = ({ onClose, onSave, entidadeToEdit, instituicoes }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingNif, setIsFetchingNif] = useState(false);
    const [formData, setFormData] = useState<any>({
        instituicao_id: instituicoes[0]?.id || '',
        codigo: '',
        name: '',
        email: '',
        responsavel: '',
        status: EntidadeStatus.Ativo,
        telefone: '',
        telemovel: '',
        nif: '',
        website: '',
        address_line: '',
        postal_code: '',
        city: '',
        locality: ''
    });

    useEffect(() => {
        if (entidadeToEdit) setFormData({ ...entidadeToEdit });
    }, [entidadeToEdit]);

    const handleFetchNifData = async () => {
        if (!formData.nif?.trim()) {
            alert("Insira um NIF para pesquisar.");
            return;
        }

        const nif = formData.nif.trim().replace(/[^0-9]/g, '');
        if (nif.length !== 9) {
             alert("O NIF deve ter 9 dígitos.");
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
                    setFormData((prev: any) => ({
                        ...prev,
                        name: prev.name || record.title, 
                        address_line: record.address || prev.address_line,
                        postal_code: record.pc4 && record.pc3 ? `${record.pc4}-${record.pc3}` : prev.postal_code,
                        city: record.city || prev.city,
                        locality: record.city || prev.locality, 
                        email: record.contacts?.email || prev.email,
                        telefone: record.contacts?.phone || prev.telefone,
                        website: record.website || prev.website
                    }));
                } else {
                     alert("NIF não encontrado ou inválido.");
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
        setFormData((prev: any) => ({ ...prev, postal_code: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } finally { setIsSaving(false); }
    };

    return (
        <Modal title={entidadeToEdit ? "Editar Entidade / Local" : "Nova Entidade / Local"} onClose={onClose} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar p-1">
                
                <div className="bg-gray-800/20 p-6 rounded-xl border border-gray-700 space-y-4">
                    <h3 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><FaBuilding/> Identificação Estrutural</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">NIF da Entidade</label>
                            <div className="flex">
                                <input type="text" value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-l p-2 text-sm focus:border-brand-primary outline-none" placeholder="Lookup NIF..." />
                                <button type="button" onClick={handleFetchNifData} className="bg-gray-600 px-3 rounded-r border-t border-b border-r border-gray-600 hover:bg-gray-500 text-white transition-colors">
                                    {isFetchingNif ? <SpinnerIcon className="h-4 w-4"/> : <SearchIcon className="h-4 w-4"/>}
                                </button>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instituição Superior</label>
                            <select value={formData.instituicao_id} onChange={e => setFormData({...formData, instituicao_id: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:border-brand-primary outline-none">
                                {instituicoes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código Interno</label>
                            <input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:border-brand-primary outline-none" required placeholder="Ex: DEP-TI, LOJA-01..." />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo da Entidade</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:border-brand-primary outline-none" required placeholder="Ex: Departamento de Sistemas de Informação" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><FaEnvelope/> Contactos e Responsabilidade</h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Responsável</label>
                            <input type="text" value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:border-brand-primary outline-none" placeholder="Nome do Gestor..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Geral</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm focus:border-brand-primary outline-none" required placeholder="entidade@empresa.pt" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone Fixo</label>
                                <input type="text" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" placeholder="21xxxxxxx" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telemóvel</label>
                                <input type="text" value={formData.telemovel} onChange={e => setFormData({...formData, telemovel: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" placeholder="9xxxxxxxx" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><FaMapMarkerAlt/> Localização</h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Morada / Rua</label>
                            <input type="text" value={formData.address_line} onChange={e => setFormData({...formData, address_line: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" placeholder="Rua, Bloco, Piso..." />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código Postal</label>
                                <input type="text" value={formData.postal_code} onChange={handlePostalCodeChange} placeholder="0000-000" className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm outline-none focus:border-brand-primary" maxLength={8} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cidade</label>
                                <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Localidade / Freguesia</label>
                            <input type="text" value={formData.locality} onChange={e => setFormData({...formData, locality: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded font-bold hover:bg-gray-700">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-8 py-2 bg-brand-primary text-white rounded font-black uppercase tracking-widest hover:bg-brand-secondary flex items-center gap-2 shadow-xl">
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4"/>} 
                        {entidadeToEdit ? 'Guardar Alterações' : 'Criar Entidade'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEntidadeModal;