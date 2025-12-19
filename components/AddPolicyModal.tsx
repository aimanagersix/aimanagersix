
import React, { useState, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { Policy, Instituicao, Entidade } from '../types';
import { FaSave, FaFileSignature, FaSpinner, FaGlobe, FaBuilding } from 'react-icons/fa';
import * as dataService from '../services/dataService';

interface AddPolicyModalProps {
    onClose: () => void;
    onSave: (policy: Omit<Policy, 'id' | 'created_at' | 'updated_at'> | Policy) => Promise<void>;
    policyToEdit?: Policy | null;
}

const AddPolicyModal: React.FC<AddPolicyModalProps> = ({ onClose, onSave, policyToEdit }) => {
    const [formData, setFormData] = useState<Partial<Policy>>({
        title: '',
        content: '',
        version: '1.0',
        is_active: true,
        is_mandatory: true,
        target_type: 'Global',
        target_instituicao_ids: [],
        target_entidade_ids: []
    });
    const [incrementVersion, setIncrementVersion] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [entidades, setEntidades] = useState<Entidade[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const data = await dataService.fetchAllData();
            setInstituicoes(data.instituicoes);
            setEntidades(data.entidades);
        };
        loadData();
        
        if (policyToEdit) {
            setFormData({
                ...policyToEdit,
                target_type: policyToEdit.target_type || 'Global',
                target_instituicao_ids: policyToEdit.target_instituicao_ids || [],
                target_entidade_ids: policyToEdit.target_entidade_ids || []
            });
        }
    }, [policyToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title?.trim() || !formData.content?.trim()) {
            alert("Título e Conteúdo são obrigatórios.");
            return;
        }

        setIsSaving(true);
        try {
            const payload: any = { 
                title: formData.title,
                content: formData.content,
                version: formData.version,
                is_active: !!formData.is_active,
                is_mandatory: !!formData.is_mandatory,
                target_type: formData.target_type,
                target_instituicao_ids: formData.target_instituicao_ids,
                target_entidade_ids: formData.target_entidade_ids
            };

            if (policyToEdit && incrementVersion) {
                const currentVer = parseFloat(policyToEdit.version);
                payload.version = (currentVer + 0.1).toFixed(1);
            }

            await onSave(policyToEdit ? { ...policyToEdit, ...payload } : payload);
            onClose();
        } catch (error: any) {
            console.error("Failed to save policy:", error);
            alert("Erro ao gravar política: " + (error.message || "Erro desconhecido."));
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTargetId = (field: 'target_instituicao_ids' | 'target_entidade_ids', id: string) => {
        setFormData(prev => {
            const current = (prev[field] as string[]) || [];
            if (current.includes(id)) return { ...prev, [field]: current.filter(x => x !== id) };
            return { ...prev, [field]: [...current, id] };
        });
    };

    return (
        <Modal title={policyToEdit ? "Editar Política" : "Nova Política de Segurança"} onClose={onClose} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Título da Política</label>
                        <input 
                            type="text" 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                            placeholder="Ex: Política de Uso de Equipamentos Móveis"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Âmbito de Aplicação (Target)</label>
                        <select 
                            value={formData.target_type} 
                            onChange={e => setFormData({...formData, target_type: e.target.value as any})}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                        >
                            <option value="Global">Global (Todos os Colaboradores)</option>
                            <option value="Instituicao">Instituições Específicas</option>
                            <option value="Entidade">Entidades Específicas</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Estado & Rigor</label>
                        <div className="flex gap-4 p-2 bg-gray-800 rounded border border-gray-700">
                             <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded border-gray-500 bg-gray-700 text-brand-primary mr-2"/>
                                <span className="text-sm text-white">Ativa</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={formData.is_mandatory} onChange={e => setFormData({...formData, is_mandatory: e.target.checked})} className="rounded border-gray-500 bg-gray-700 text-brand-primary mr-2"/>
                                <span className="text-sm text-white">Obrigatória</span>
                            </label>
                        </div>
                    </div>
                </div>

                {formData.target_type === 'Instituicao' && (
                    <div className="p-4 bg-gray-900/50 rounded border border-gray-700 animate-fade-in">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Selecionar Instituições Alvo</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {instituicoes.map(inst => (
                                <label key={inst.id} className={`flex items-center p-2 rounded cursor-pointer border ${formData.target_instituicao_ids?.includes(inst.id) ? 'bg-brand-primary/20 border-brand-primary' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}>
                                    <input type="checkbox" checked={formData.target_instituicao_ids?.includes(inst.id)} onChange={() => toggleTargetId('target_instituicao_ids', inst.id)} className="hidden"/>
                                    <span className="text-xs text-white">{inst.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {formData.target_type === 'Entidade' && (
                    <div className="p-4 bg-gray-900/50 rounded border border-gray-700 animate-fade-in">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Selecionar Entidades / Departamentos Alvo</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {entidades.map(ent => (
                                <label key={ent.id} className={`flex items-center p-2 rounded cursor-pointer border ${formData.target_entidade_ids?.includes(ent.id) ? 'bg-brand-primary/20 border-brand-primary' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}>
                                    <input type="checkbox" checked={formData.target_entidade_ids?.includes(ent.id)} onChange={() => toggleTargetId('target_entidade_ids', ent.id)} className="hidden"/>
                                    <span className="text-xs text-white">{ent.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Conteúdo da Política</label>
                    <textarea 
                        value={formData.content} 
                        onChange={e => setFormData({...formData, content: e.target.value})}
                        rows={12}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono text-sm"
                        placeholder="Insira o texto legal ou link para o documento PDF..."
                        required
                    />
                </div>

                {policyToEdit && (
                    <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={incrementVersion} onChange={e => setIncrementVersion(e.target.checked)} className="rounded border-gray-500 bg-gray-700 text-brand-primary mr-2"/>
                            <div>
                                <span className="block text-sm font-bold text-yellow-400">Novo Major Release (Forçar Releitura)</span>
                                <span className="text-[10px] text-gray-400">Incremente a versão para invalidar aceitações anteriores.</span>
                            </div>
                        </label>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500" disabled={isSaving}>Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50 font-bold">
                        {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />} Salvar Política
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddPolicyModal;
