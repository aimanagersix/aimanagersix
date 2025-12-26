
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { SecurityIncidentTypeItem } from '../types';
import { FaShieldAlt, FaInfoCircle, FaSave } from 'react-icons/fa';
import { SpinnerIcon } from './common/Icons';

interface AddSecurityIncidentTypeModalProps {
    onClose: () => void;
    onSave: (type: Omit<SecurityIncidentTypeItem, 'id'> | SecurityIncidentTypeItem) => Promise<void>;
    typeToEdit?: SecurityIncidentTypeItem | null;
}

const AddSecurityIncidentTypeModal: React.FC<AddSecurityIncidentTypeModalProps> = ({ onClose, onSave, typeToEdit }) => {
    const [formData, setFormData] = useState<Partial<SecurityIncidentTypeItem>>({
        name: '',
        description: '',
        is_active: true,
    });
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (typeToEdit) {
            setFormData({
                name: typeToEdit.name,
                description: typeToEdit.description || '',
                is_active: typeToEdit.is_active !== false,
            });
        }
    }, [typeToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim()) {
            setError('O nome do tipo de incidente é obrigatório.');
            return;
        }
        
        setError('');
        setIsSaving(true);
        
        try {
            const dataToSave = {
                ...formData,
                name: formData.name.trim(),
                description: formData.description?.trim() || null
            };

            if (typeToEdit) {
                await onSave({ ...typeToEdit, ...dataToSave } as SecurityIncidentTypeItem);
            } else {
                await onSave(dataToSave as Omit<SecurityIncidentTypeItem, 'id'>);
            }
            onClose();
        } catch (err: any) {
            console.error("Erro ao guardar tipo de incidente:", err);
            setError(err.message || "Falha ao comunicar com a base de dados.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const modalTitle = typeToEdit ? "Editar Tipo de Incidente" : "Novo Tipo de Incidente NIS2";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg flex items-start gap-3">
                    <FaInfoCircle className="text-blue-400 mt-1 flex-shrink-0" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Defina categorias específicas para incidentes de segurança. Isto facilita a extração de métricas de conformidade e o reporte automatizado de incidentes significativos.
                    </p>
                </div>

                <div>
                    <label htmlFor="name" className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Nome do Tipo / Ameaça</label>
                    <div className="relative">
                        <FaShieldAlt className="absolute left-3 top-3 text-gray-600" />
                        <input 
                            type="text" 
                            name="name" 
                            id="name" 
                            value={formData.name} 
                            onChange={(e) => { setFormData(prev => ({ ...prev, name: e.target.value })); setError(''); }} 
                            className={`w-full bg-gray-700 border ${error ? 'border-red-500' : 'border-gray-600'} text-white rounded-md p-2 pl-10 text-sm focus:border-brand-primary outline-none transition-colors`} 
                            placeholder="Ex: Ransomware, Phishing, DDoS..."
                            autoFocus
                        />
                    </div>
                    {error && <p className="text-red-400 text-[10px] font-bold mt-1 uppercase">{error}</p>}
                </div>

                <div>
                    <label htmlFor="description" className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Descrição Técnica (Opcional)</label>
                    <textarea
                        name="description"
                        id="description"
                        value={formData.description || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm outline-none focus:border-brand-primary transition-colors min-h-[100px]"
                        placeholder="Descreva brevemente o impacto ou as características deste tipo de incidente..."
                    />
                </div>

                <div className="flex items-center group cursor-pointer">
                    <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-brand-primary focus:ring-brand-secondary cursor-pointer"
                    />
                    <label htmlFor="is_active" className="ml-3 block text-sm font-bold text-gray-400 group-hover:text-white transition-colors cursor-pointer">
                        Estado Ativo
                    </label>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-6 py-2 bg-gray-600 text-white rounded font-bold text-sm hover:bg-gray-500 transition-colors"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="px-8 py-2 bg-brand-primary text-white rounded font-black uppercase tracking-widest hover:bg-brand-secondary transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : <FaSave />} 
                        {isSaving ? 'A Gravar...' : 'Salvar Tipo'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddSecurityIncidentTypeModal;
