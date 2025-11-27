
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Policy } from '../types';
import { FaSave, FaFileSignature, FaSpinner } from 'react-icons/fa';

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
        is_mandatory: true
    });
    const [incrementVersion, setIncrementVersion] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (policyToEdit) {
            setFormData(policyToEdit);
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
            const payload = { ...formData };
            
            // If editing and user chose to increment version, calculate new version string
            if (policyToEdit && incrementVersion) {
                const currentVer = parseFloat(policyToEdit.version);
                payload.version = (currentVer + 0.1).toFixed(1);
            }

            // Sanitize: Remove system fields that shouldn't be sent back to DB manually
            // (Supabase handles timestamps, and ID shouldn't change)
            const cleanPayload = { ...payload };
            delete (cleanPayload as any).id;
            delete (cleanPayload as any).created_at;
            delete (cleanPayload as any).updated_at;

            await onSave(policyToEdit ? { ...policyToEdit, ...cleanPayload } : cleanPayload as any);
            onClose();
        } catch (error: any) {
            console.error("Failed to save policy:", error);
            alert("Erro ao gravar política: " + (error.message || "Erro desconhecido."));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title={policyToEdit ? "Editar Política" : "Nova Política de Segurança"} onClose={onClose} maxWidth="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Título da Política</label>
                    <input 
                        type="text" 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                        placeholder="Ex: Política de Segurança da Informação"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Conteúdo (Texto ou URL para PDF)</label>
                    <textarea 
                        value={formData.content} 
                        onChange={e => setFormData({...formData, content: e.target.value})}
                        rows={10}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono text-sm"
                        placeholder="Cole aqui o texto da política ou um link para o documento..."
                        required
                    />
                </div>

                <div className="flex gap-6 pt-2">
                    <label className="flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData.is_active} 
                            onChange={e => setFormData({...formData, is_active: e.target.checked})}
                            className="rounded border-gray-500 bg-gray-700 text-brand-primary mr-2"
                        />
                        <span className="text-sm text-white">Ativa</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData.is_mandatory} 
                            onChange={e => setFormData({...formData, is_mandatory: e.target.checked})}
                            className="rounded border-gray-500 bg-gray-700 text-brand-primary mr-2"
                        />
                        <span className="text-sm text-white">Obrigatória (Bloqueia Login)</span>
                    </label>
                </div>

                {policyToEdit && (
                    <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded mt-2">
                        <label className="flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={incrementVersion} 
                                onChange={e => setIncrementVersion(e.target.checked)}
                                className="rounded border-gray-500 bg-gray-700 text-brand-primary mr-2"
                            />
                            <div>
                                <span className="block text-sm font-bold text-yellow-400">Incrementar Versão (Exigir nova aceitação)</span>
                                <span className="text-xs text-gray-400">
                                    Se marcado, a versão passará de {policyToEdit.version} para { (parseFloat(policyToEdit.version) + 0.1).toFixed(1) } e todos os utilizadores terão de aceitar novamente.
                                </span>
                            </div>
                        </label>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500" disabled={isSaving}>
                        Cancelar
                    </button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50">
                        {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                        {isSaving ? 'A Gravar...' : 'Guardar Política'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddPolicyModal;
