import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Team } from '../types';
import { CheckIcon, SpinnerIcon, FaHistory, FaClock, FaUsers, FaExclamationTriangle } from './common/Icons';

interface AddTeamModalProps {
    onClose: () => void;
    onSave: (team: Omit<Team, 'id'> | Team) => Promise<void>;
    teamToEdit?: Team | null;
}

const AddTeamModal: React.FC<AddTeamModalProps> = ({ onClose, onSave, teamToEdit }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true,
        vacation_auto_reassign: false,
        sla_pause_on_absence: false
    });
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (teamToEdit) {
            setFormData({
                name: teamToEdit.name,
                description: teamToEdit.description || '',
                is_active: teamToEdit.is_active !== false,
                vacation_auto_reassign: !!teamToEdit.vacation_auto_reassign,
                sla_pause_on_absence: !!teamToEdit.sla_pause_on_absence
            });
        }
    }, [teamToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim() === '') {
            setError('O nome da equipa é obrigatório.');
            return;
        }
        setError('');
        setIsSaving(true);
        
        try {
            const dataToSave = {
                ...formData
            };

            if (teamToEdit) {
                await onSave({ ...teamToEdit, ...dataToSave });
            } else {
                await onSave(dataToSave as any);
            }
            onClose();
        } catch (err: any) {
            console.error("Failed to save team", err);
            setError(err.message || "Erro ao gravar equipa.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const modalTitle = teamToEdit ? "Editar Equipa" : "Adicionar Nova Equipa";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="name" className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Nome da Equipa</label>
                        <input 
                            type="text" 
                            name="name" 
                            id="name" 
                            value={formData.name} 
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className={`w-full bg-gray-700 border text-white rounded-md p-2 text-sm focus:border-brand-primary outline-none ${error ? 'border-red-500' : 'border-gray-600'}`}
                            placeholder="Ex: Suporte N1, Infraestrutura..."
                        />
                        {error && <p className="text-red-400 text-xs italic mt-1">{error}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
                        <textarea 
                            name="description" 
                            id="description" 
                            rows={2}
                            value={formData.description} 
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm outline-none"
                            placeholder="Finalidade da equipa..."
                        />
                    </div>
                </div>

                <div className="bg-blue-900/10 p-5 rounded-xl border border-blue-500/20 space-y-4">
                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                        <FaHistory /> Resiliência & SLA Dinâmico (Sugestão do Engenheiro)
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-3">
                        <label className="flex items-start gap-3 cursor-pointer group p-2 rounded hover:bg-white/5 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={formData.vacation_auto_reassign} 
                                onChange={e => setFormData({...formData, vacation_auto_reassign: e.target.checked})} 
                                className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-brand-primary focus:ring-brand-secondary"
                            />
                            <div>
                                <span className="block text-sm font-bold text-white group-hover:text-brand-secondary transition-colors">Reatribuição Automática por Ausência</span>
                                <span className="text-[10px] text-gray-400 leading-tight">Se um técnico estiver de férias/ausente, tickets atribuídos a ele voltam para a fila da equipa (ou Triagem) após 24h.</span>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer group p-2 rounded hover:bg-white/5 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={formData.sla_pause_on_absence} 
                                onChange={e => setFormData({...formData, sla_pause_on_absence: e.target.checked})} 
                                className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-brand-primary focus:ring-brand-secondary"
                            />
                            <div>
                                <span className="block text-sm font-bold text-white group-hover:text-brand-secondary transition-colors">Pausa de SLA em Ausências</span>
                                <span className="text-[10px] text-gray-400 leading-tight">O relógio do ticket "congela" durante as férias do técnico, não penalizando o tempo médio de resolução (MTTR).</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex items-center">
                    <input 
                        type="checkbox" 
                        checked={formData.is_active} 
                        onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-brand-primary"
                    />
                    <label className="ml-2 text-sm text-gray-400 font-bold uppercase tracking-widest text-[10px]">Equipa Ativa</label>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded font-bold text-sm hover:bg-gray-500 transition-colors">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-8 py-2 bg-brand-primary text-white rounded text-sm font-black uppercase tracking-widest hover:bg-brand-secondary shadow-lg transition-all">
                        {isSaving ? <SpinnerIcon className="h-4 w-4"/> : <CheckIcon className="h-4 w-4"/>}
                        {isSaving ? 'A Gravar...' : 'Salvar Equipa'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddTeamModal;
