
import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { ContinuityPlan, Collaborator, BusinessService } from '../types';
import { FaSave, FaFileContract, FaSpinner, FaUpload, FaFilePdf } from 'react-icons/fa';
import { getSupabase } from '../services/supabaseClient';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface AddContinuityPlanModalProps {
    onClose: () => void;
    onSave: (plan: Omit<ContinuityPlan, 'id' | 'created_at' | 'updated_at'> | ContinuityPlan) => Promise<void>;
    planToEdit?: ContinuityPlan | null;
    collaborators: Collaborator[];
    businessServices: BusinessService[];
}

const AddContinuityPlanModal: React.FC<AddContinuityPlanModalProps> = ({ onClose, onSave, planToEdit, collaborators, businessServices }) => {
    const [formData, setFormData] = useState<Partial<ContinuityPlan>>({
        title: '',
        type: 'BCP',
        description: '',
        service_id: '',
        last_review_date: new Date().toISOString().split('T')[0],
        next_review_date: '',
        owner_id: ''
    });
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (planToEdit) {
            setFormData(planToEdit);
        }
    }, [planToEdit]);
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.size > MAX_FILE_SIZE) {
            alert("Ficheiro excede o limite de 10MB.");
            return;
        }
        
        setFile(selectedFile);
        setIsUploading(true);
        try {
            const supabase = getSupabase();
            const filePath = `continuity_plans/${crypto.randomUUID()}-${selectedFile.name}`;
            
            const { error: uploadError } = await supabase.storage
                .from('avatars') // Utilizando bucket existente para simplificar
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            
            setFormData(prev => ({ ...prev, document_url: publicUrl, document_name: selectedFile.name }));
        } catch (error: any) {
            console.error("Upload error:", error);
            alert("Erro ao carregar o ficheiro: " + error.message);
            setFile(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title?.trim()) {
            alert("O título do plano é obrigatório.");
            return;
        }
        
        setIsSaving(true);
        try {
            const dataToSave = { ...formData };
            // Limpeza de UUIDs vazios para evitar erro de cast no Postgres
            if (!dataToSave.owner_id) delete (dataToSave as any).owner_id;
            if (!dataToSave.service_id) delete (dataToSave as any).service_id;
            
            await onSave(dataToSave as any);
            onClose();
        } catch (error: any) {
            console.error("Save error:", error);
            alert("Erro ao guardar plano: " + (error.message || "Erro de integridade."));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title={planToEdit ? "Editar Plano" : "Novo Plano de Continuidade"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Título</label>
                        <input 
                            type="text" 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" 
                            placeholder="Ex: Plano de Recuperação de Desastres (DRP)"
                            required 
                        />
                    </div>
                     <div>
                        <label className="block text-sm text-gray-400 mb-1">Tipo de Plano</label>
                        <select 
                            value={formData.type} 
                            onChange={e => setFormData({...formData, type: e.target.value as any})} 
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                        >
                            <option value="BCP">BCP (Continuidade de Negócio)</option>
                            <option value="DRP">DRP (Recuperação de Desastres)</option>
                            <option value="Crise">Plano de Crise</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Serviço Associado (BIA)</label>
                    <select 
                        value={formData.service_id || ''} 
                        onChange={e => setFormData({...formData, service_id: e.target.value})} 
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                    >
                        <option value="">Nenhum (Plano Geral)</option>
                        {businessServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Descrição / Notas</label>
                    <textarea 
                        value={formData.description || ''} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        rows={3} 
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm"
                        placeholder="Breve descrição dos objetivos do plano..."
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Última Revisão</label>
                        <input 
                            type="date" 
                            value={formData.last_review_date} 
                            onChange={e => setFormData({...formData, last_review_date: e.target.value})} 
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" 
                            required 
                        />
                    </div>
                     <div>
                        <label className="block text-sm text-gray-400 mb-1">Próxima Revisão</label>
                        <input 
                            type="date" 
                            value={formData.next_review_date || ''} 
                            onChange={e => setFormData({...formData, next_review_date: e.target.value})} 
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" 
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Responsável (Owner)</label>
                    <select 
                        value={formData.owner_id || ''} 
                        onChange={e => setFormData({...formData, owner_id: e.target.value})} 
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" 
                        required
                    >
                        <option value="" disabled>Selecione um responsável...</option>
                        {collaborators.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </select>
                </div>

                <div className="pt-2">
                    <label className="block text-sm text-gray-400 mb-1">Documento do Plano (PDF)</label>
                    <div className="flex items-center gap-4 bg-gray-800/50 p-3 rounded border border-gray-700">
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isUploading} 
                            className="flex-shrink-0 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isUploading ? <FaSpinner className="animate-spin"/> : <FaUpload />} Carregar PDF
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept=".pdf" 
                        />
                        {formData.document_name ? (
                            <div className="flex items-center gap-2 text-blue-400 text-sm truncate">
                                <FaFilePdf />
                                <span className="truncate">{formData.document_name}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-gray-500">Nenhum ficheiro selecionado (Max 10MB)</span>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-700 mt-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        disabled={isSaving || isUploading}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="px-6 py-2 bg-brand-primary text-white rounded font-bold hover:bg-brand-secondary transition-all flex items-center gap-2 disabled:opacity-50"
                        disabled={isSaving || isUploading}
                    >
                        {isSaving ? <FaSpinner className="animate-spin"/> : <FaSave />} 
                        {isSaving ? 'A Gravar...' : 'Salvar Plano'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddContinuityPlanModal;
