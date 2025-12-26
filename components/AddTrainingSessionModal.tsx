import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Collaborator, ConfigItem, Instituicao, Entidade } from '../types';
import { FaGraduationCap, FaUsers, FaSearch, FaCheck, FaSpinner } from 'react-icons/fa';

interface AddTrainingSessionModalProps {
    onClose: () => void;
    onSave: (data: { 
        collaboratorIds: string[], 
        training_type: string, 
        completion_date: string, 
        notes?: string, 
        score: number,
        duration_hours?: number
    }) => void;
    collaborators: Collaborator[];
    trainingTypes: ConfigItem[];
    instituicoes: Instituicao[];
    entidades: Entidade[];
}

// Fixed: Completed the component implementation and added default export to resolve TS errors and import issues.
const AddTrainingSessionModal: React.FC<AddTrainingSessionModalProps> = ({ 
    onClose, 
    onSave, 
    collaborators, 
    trainingTypes, 
    instituicoes, 
    entidades 
}) => {
    const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [filterInstitutionId, setFilterInstitutionId] = useState('');
    const [filterEntidadeId, setFilterEntidadeId] = useState('');
    
    const [trainingType, setTrainingType] = useState(trainingTypes[0]?.name || 'Geral / Awareness');
    const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
    const [score, setScore] = useState(100);
    const [durationHours, setDurationHours] = useState(1);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const filteredCollaborators = useMemo(() => {
        return collaborators.filter(c => {
            const matchesSearch = c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 c.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesInst = !filterInstitutionId || c.instituicao_id === filterInstitutionId;
            const matchesEnt = !filterEntidadeId || c.entidade_id === filterEntidadeId;
            return matchesSearch && matchesInst && matchesEnt && c.status === 'Ativo';
        }).sort((a, b) => a.full_name.localeCompare(b.full_name));
    }, [collaborators, searchQuery, filterInstitutionId, filterEntidadeId]);

    const handleToggleCollaborator = (id: string) => {
        setSelectedCollaboratorIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAllFiltered = () => {
        setSelectedCollaboratorIds(prev => {
            const next = new Set(prev);
            filteredCollaborators.forEach(c => next.add(c.id));
            return next;
        });
    };

    const handleDeselectAllFiltered = () => {
        setSelectedCollaboratorIds(prev => {
            const next = new Set(prev);
            filteredCollaborators.forEach(c => next.delete(c.id));
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCollaboratorIds.size === 0) {
            alert("Selecione pelo menos um colaborador.");
            return;
        }
        setIsSaving(true);
        try {
            await onSave({
                collaboratorIds: Array.from(selectedCollaboratorIds),
                training_type: trainingType,
                completion_date: completionDate,
                score,
                duration_hours: durationHours,
                notes
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title="Registar Formação de Segurança" onClose={onClose} maxWidth="max-w-5xl">
            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Participantes selection panel */}
                    <div className="flex flex-col space-y-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <FaUsers className="text-brand-secondary" /> Selecionar Participantes ({selectedCollaboratorIds.size})
                        </h4>
                        
                        <div className="space-y-2 bg-gray-900/30 p-3 rounded-lg border border-gray-700">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-3 text-gray-500" />
                                <input 
                                    type="text" 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 pl-10 text-xs text-white" 
                                    placeholder="Pesquisar por nome ou email..." 
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <select 
                                    value={filterInstitutionId} 
                                    onChange={e => { setFilterInstitutionId(e.target.value); setFilterEntidadeId(''); }}
                                    className="bg-gray-800 border border-gray-700 rounded p-2 text-[10px] text-white"
                                >
                                    <option value="">Todas Instituições</option>
                                    {instituicoes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                                <select 
                                    value={filterEntidadeId} 
                                    onChange={e => setFilterEntidadeId(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded p-2 text-[10px] text-white"
                                    disabled={!filterInstitutionId}
                                >
                                    <option value="">Todas Entidades</option>
                                    {entidades.filter(e => !filterInstitutionId || e.instituicao_id === filterInstitutionId).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-between gap-2 mt-2">
                                <button type="button" onClick={handleSelectAllFiltered} className="text-[10px] text-blue-400 hover:text-white uppercase font-bold">Selecionar Visíveis</button>
                                <button type="button" onClick={handleDeselectAllFiltered} className="text-[10px] text-gray-500 hover:text-white uppercase font-bold">Limpar Visíveis</button>
                            </div>
                        </div>

                        <div className="border border-gray-700 rounded-lg overflow-hidden h-64 overflow-y-auto custom-scrollbar bg-black/20">
                            {filteredCollaborators.length > 0 ? filteredCollaborators.map(c => (
                                <label key={c.id} className={`flex items-center gap-3 p-2 border-b border-gray-800/50 cursor-pointer hover:bg-gray-800 transition-colors ${selectedCollaboratorIds.has(c.id) ? 'bg-brand-primary/10' : ''}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedCollaboratorIds.has(c.id)} 
                                        onChange={() => handleToggleCollaborator(c.id)} 
                                        className="rounded bg-gray-700 border-gray-600 text-brand-primary"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{c.full_name}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{c.email}</p>
                                    </div>
                                </label>
                            )) : <p className="text-center py-10 text-gray-600 text-xs italic">Nenhum colaborador encontrado.</p>}
                        </div>
                    </div>

                    {/* Session details panel */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <FaGraduationCap className="text-green-400" /> Detalhes da Sessão
                        </h4>
                        
                        <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Formação</label>
                                <select 
                                    value={trainingType} 
                                    onChange={e => setTrainingType(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white"
                                >
                                    {trainingTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                    {trainingTypes.length === 0 && (
                                        <>
                                            <option value="Geral / Awareness">Geral / Awareness</option>
                                            <option value="Phishing">Phishing</option>
                                            <option value="Técnica / SOC">Técnica / SOC</option>
                                            <option value="Privacidade / RGPD">Privacidade / RGPD</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Conclusão</label>
                                    <input 
                                        type="date" 
                                        value={completionDate} 
                                        onChange={e => setCompletionDate(e.target.value)} 
                                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duração (Horas)</label>
                                    <input 
                                        type="number" 
                                        min="0.5" 
                                        step="0.5" 
                                        value={durationHours} 
                                        onChange={e => setDurationHours(parseFloat(e.target.value))} 
                                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pontuação Média / Aproveitamento (%)</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={score} 
                                    onChange={e => setScore(parseInt(e.target.value))} 
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                />
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-gray-500 font-bold">0%</span>
                                    <span className="text-sm text-brand-secondary font-black">{score}%</span>
                                    <span className="text-[10px] text-gray-500 font-bold">100%</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Observações / Nome do Curso</label>
                                <textarea 
                                    value={notes} 
                                    onChange={e => setNotes(e.target.value)} 
                                    rows={3} 
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white focus:border-brand-primary outline-none" 
                                    placeholder="Ex: Formação presencial sobre segurança de passwords..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded font-bold hover:bg-gray-500 transition-colors">Cancelar</button>
                    <button 
                        type="submit" 
                        disabled={isSaving || selectedCollaboratorIds.size === 0} 
                        className="px-8 py-2 bg-brand-primary text-white rounded font-black uppercase tracking-widest hover:bg-brand-secondary flex items-center gap-2 shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <FaSpinner className="animate-spin" /> : <FaCheck />} 
                        Registar Formação
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddTrainingSessionModal;