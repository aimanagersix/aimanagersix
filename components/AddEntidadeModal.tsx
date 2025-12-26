import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Entidade, Instituicao, EntidadeStatus } from '../types';
import { SpinnerIcon, SearchIcon, CheckIcon } from './common/Icons';
import { FaGlobe, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaSearchLocation } from 'react-icons/fa';

interface AddEntidadeModalProps {
    onClose: () => void;
    onSave: (entidade: any) => Promise<any>;
    entidadeToEdit?: Entidade | null;
    instituicoes: Instituicao[];
}

const AddEntidadeModal: React.FC<AddEntidadeModalProps> = ({ onClose, onSave, entidadeToEdit, instituicoes }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingCP, setIsFetchingCP] = useState(false);
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

    // Função de mapeamento robusto para os campos do CP
    const mapCPData = (data: any) => {
        setFormData((prev: any) => ({
            ...prev,
            city: data.Concelho || data.concelho || prev.city,
            locality: data.Freguesia || data.freguesia || (data.part && data.part[0] ? data.part[0] : prev.locality),
            address_line: !prev.address_line?.trim() ? (data.Designacao || data.designacao || prev.address_line) : prev.address_line
        }));
    };

    const fetchCPData = async () => {
        const cp = formData.postal_code?.trim() || '';
        if (!/^\d{4}-\d{3}$/.test(cp)) {
            alert("Introduza o Código Postal no formato 0000-000.");
            return;
        }

        setIsFetchingCP(true);
        try {
            const response = await fetch(`https://json.geoapi.pt/cp/${cp}`);
            if (response.ok) {
                const data = await response.json();
                mapCPData(data);
            } else {
                alert("Código Postal não encontrado.");
            }
        } catch (e) {
            console.error("Erro ao consultar CP:", e);
            alert("Falha na ligação ao serviço de moradas.");
        } finally {
            setIsFetchingCP(false);
        }
    };

    const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9-]/g, ''); 
        if (val.length > 4 && val.indexOf('-') === -1) val = val.slice(0, 4) + '-' + val.slice(4);
        if (val.length > 8) val = val.slice(0, 8);
        setFormData((prev: any) => ({ ...prev, postal_code: val }));
    };

    // Disparo automático ao completar CP
    useEffect(() => {
        const cp = formData.postal_code || '';
        if (/^\d{4}-\d{3}$/.test(cp)) {
            const fetchAutoCP = async () => {
                setIsFetchingCP(true);
                try {
                    const response = await fetch(`https://json.geoapi.pt/cp/${cp}`);
                    if (response.ok) {
                        const data = await response.json();
                        mapCPData(data);
                    }
                } catch (e) {
                    console.error("Erro ao consultar CP automático:", e);
                } finally {
                    setIsFetchingCP(false);
                }
            };
            fetchAutoCP();
        }
    }, [formData.postal_code]);

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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instituição Superior</label>
                            <select value={formData.instituicao_id} onChange={e => setFormData({...formData, instituicao_id: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:border-brand-primary outline-none">
                                {instituicoes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                        </div>
                        <div>
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
                                <div className="relative">
                                    <input type="text" value={formData.postal_code} onChange={handlePostalCodeChange} placeholder="0000-000" className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm outline-none focus:border-brand-primary" maxLength={8} />
                                    <button 
                                        type="button" 
                                        onClick={fetchCPData} 
                                        className="absolute right-2 top-2 p-1 text-gray-500 hover:text-brand-secondary transition-colors"
                                        title="Pesquisar Morada"
                                    >
                                        <FaSearchLocation />
                                    </button>
                                    {isFetchingCP && <div className="absolute right-8 top-2"><SpinnerIcon className="h-4 w-4"/></div>}
                                </div>
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