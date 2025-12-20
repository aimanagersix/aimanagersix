
import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { ContinuityPlan, Collaborator, BusinessService } from '../types';
import { FaSave, FaFileContract, FaSpinner, FaUpload, FaFilePdf } from 'react-icons/fa';
import { getSupabase } from '../services/supabaseClient';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface AddContinuityPlanModalProps {
    onClose: () => void;
    onSave: (plan: Omit<ContinuityPlan, 'id'> | ContinuityPlan) => Promise<void>;
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
                .from('avatars') // Using 'avatars' bucket for simplicity, ideally 'documents'
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
        setIsSaving(true);
        try {
            const dataToSave = { ...formData };
            if (!dataToSave.owner_id) delete dataToSave.owner_id;
            if (!dataToSave.service_id) delete dataToSave.service_id;
            
            await onSave(dataToSave as any);
            onClose();
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title={planToEdit ? "Editar Plano" : "Novo Plano de Continuidade"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Título</label>
                        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" required />
                    </div>
                     <div>
                        <label className="block text-sm text-gray-400 mb-1">Tipo de Plano</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                            <option value="BCP">BCP (Continuidade de Negócio)</option>
                            <option value="DRP">DRP (Recuperação de Desastres)</option>
                            <option value="Crise">Plano de Crise</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Serviço Associado (BIA)</label>
                    <select value={formData.service_id} onChange={e => setFormData({...formData, service_id: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                        <option value="">Nenhum (Plano Geral)</option>
                        {businessServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"></textarea>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Última Revisão</label>
                        <input type="date" value={formData.last_review_date} onChange={e => setFormData({...formData, last_review_date: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" required />
                    </div>
                     <div>
                        <label className="block text-sm text-gray-400 mb-1">Próxima Revisão</label>
                        <input type="date" value={formData.next_review_date || ''} onChange={e => setFormData({...formData, next_review_date: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Responsável (Owner)</label>
                    <select value={formData.owner_id} onChange={e => setFormData({...formData, owner_id: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" required>
                        <option value="" disabled>Selecione...</option>
                        {/* Fix: fullName to full_name */}
                        {collaborators.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">Documento do Plano (PDF)</label>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex-shrink-0 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 flex items-center gap-2">
                            {isUploading ? <FaSpinner className="animate-spin"/> : <FaUpload />} Carregar
                        </button>
                        <