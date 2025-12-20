import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Entidade, Instituicao, EntidadeStatus } from '../types';
import { SpinnerIcon } from './common/Icons';

interface AddEntidadeModalProps {
    onClose: () => void;
    onSave: (entidade: any) => Promise<any>;
    entidadeToEdit?: Entidade | null;
    instituicoes: Instituicao[];
}

const AddEntidadeModal: React.FC<AddEntidadeModalProps> = ({ onClose, onSave, entidadeToEdit, instituicoes }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<any>({
        instituicao_id: instituicoes[0]?.id || '',
        codigo: '',
        name: '',
        email: '',
        responsavel: '',
        status: EntidadeStatus.Ativo
    });

    useEffect(() => {
        if (entidadeToEdit) setFormData({ ...entidadeToEdit });
    }, [entidadeToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } finally { setIsSaving(false); }
    };

    return (
        <Modal title={entidadeToEdit ? "Editar Entidade" : "Nova Entidade"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Instituição</label>
                        <select value={formData.instituicao_id} onChange={e => setFormData({...formData, instituicao_id: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2">
                            {instituicoes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Código</label>
                        <input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2" required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Nome Completo</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2" required />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Email de Contacto</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2" required />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-brand-primary text-white rounded flex items-center gap-2">
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : null} Salvar Entidade
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEntidadeModal;