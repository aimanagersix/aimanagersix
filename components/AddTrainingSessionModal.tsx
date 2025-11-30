import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Collaborator, ConfigItem, TrainingType, Instituicao, Entidade } from '../types';
import { FaGraduationCap, FaUsers, FaSearch, FaCheck } from 'react-icons/fa';

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

const AddTrainingSessionModal: React.FC<AddTrainingSessionModalProps> = ({ onClose, onSave, collaborators, trainingTypes, instituicoes, entidades }) => {
    const [trainingType, setTrainingType] = useState('');
    const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [score, setScore] = useState(100);
    const [durationHours, setDurationHours] = useState<number | string>(1);
    const [selectedCollaborators, setSelectedCollaborators] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    // New filters
    const [filterInstituicao, setFilterInstituicao] = useState('');
    const [filterEntidade, setFilterEntidade] = useState('');

    const trainingOptions = useMemo(() => {
        if (trainingTypes && trainingTypes.length > 0) return trainingTypes.map(t => t.name);
        return Object.values(TrainingType);
    }, [trainingTypes]);

    // Set default training type
    useState(() => {
        if (trainingOptions.length > 0) setTrainingType(trainingOptions[0]);
    });

    const filteredEntidades = useMemo(() => {
        if (!filterInstituicao) return entidades;
        return entidades.filter(e => e.instituicaoId === filterInstituicao);
    }, [entidades, filterInstituicao]);

    useEffect(() => {
        setFilterEntidade('');
    }, [filterInstituicao]);


    const filteredCollaborators = useMemo(() => {
        let collabs = collaborators.filter(c => c.status === 'Ativo');

        if (filterEntidade) {
            collabs = collabs.filter(c => c.entidadeId === filterEntidade);
        } else if (filterInstituicao) {
            const entityIdsInInst = new Set(entidades.filter(e => e.instituicaoId === filterInstituicao).map(e => e.id));
            collabs = collabs.filter(c => c.entidadeId && entityIdsInInst.has(c.entidadeId));
        }
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            collabs = collabs.filter(c => 
                c.fullName.toLowerCase().includes(query) || 
                c.email.toLowerCase().includes(query)
            );
        }
        
        return collabs.sort((a,b) => a.fullName.localeCompare(b.fullName));
    }, [collaborators, searchQuery, filterInstituicao, filterEntidade, entidades]);

    const toggleCollaborator = (id: string) => {
        setSelectedCollaborators(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const toggleAll = () => {
        if (selectedCollaborators.size === filteredCollaborators.length) {
            setSelectedCollaborators(new Set());
        } else {
            const newSet = new Set<string>();
            filteredCollaborators.forEach(c => newSet.add(c.id));
            setSelectedCollaborators(newSet);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCollaborators.size === 0) {
            alert("Selecione pelo menos um colaborador.");
            return;
        }
        if (!trainingType) {
            alert("Selecione o tipo de formação.");
            return;
        }

        onSave({
            collaboratorIds: Array.from(selectedCollaborators),
            training_type: trainingType,
            completion_date: completionDate,
            notes,
            score,
            duration_hours: Number(durationHours) || 0
        });
        onClose();
    };

    return (
        <Modal title="Registar Sessão de Formação (Lote)" onClose={onClose} maxWidth="max-w-5xl">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 h-[70vh]">
                {/* Left: Session Details */}
                <div className="w-full md:w-1/3 space-y-4 border-r border-gray-700 pr-4 overflow-y-auto">
                    <div className="bg-green-900/20 p-4 rounded border border-green-500/30 text-sm text-green-200 mb-4">
                        <FaGraduationCap className="text-xl mb-2"/>
                        <p>Crie um registo de formação e atribua-o a múltiplos participantes de uma só vez.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Formação</label>
                        <select 
                            value={trainingType} 
                            onChange={(e) => setTrainingType(e.target.value)} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                            required
                        >
                            {trainingOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Data de Conclusão</label>
                        <input 
                            type="date" 
                            value={completionDate} 
                            onChange={(e) => setCompletionDate(e.target.value)} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                            required
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Score / Nota (%)</label>
                            <input 
                                type="number" 
                                value={score} 
                                onChange={(e) => setScore(parseInt(e.target.value))} 
                                min="0" max="100"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Duração (Horas)</label>
                            <input 
                                type="number" 
                                value={durationHours} 
                                onChange={(e) => setDurationHours(e.target.value)} 
                                min="0.5" step="0.5"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Notas / Observações</label>
                        <textarea 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)} 
                            rows={4} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                            placeholder="Detalhes da sessão..."
                        />
                    </div>
                </div>

                {/* Right: Participants Selection */}
                <div className="flex-1 flex flex-col">
                    <h3 className="font-bold text-white mb-2 flex justify-between items-center">
                        <span className="flex items-center gap-2"><FaUsers className="text-blue-400"/> Participantes</span>
                        <span className="text-xs bg-blue-900 px-2 py-1 rounded text-blue-200">{selectedCollaborators.size} selecionados</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                         <select 
                            value={filterInstituicao} 
                            onChange={(e) => setFilterInstituicao(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm"
                        >
                            <option value="">Todas as Instituições</option>
                            {instituicoes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                         <select 
                            value={filterEntidade} 
                            onChange={(e) => setFilterEntidade(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm"
                            disabled={!filterInstituicao}
                        >
                            <option value="">Todas as Entidades</option>
                            {filteredEntidades.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 mb-3">
                        <div className="relative flex-grow">
                            <FaSearch className="absolute left-3 top-2.5 text-gray-400 text-xs"/>
                            <input 
                                type="text" 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                placeholder="Filtrar por nome..." 
                                className="w-full bg-gray-800 border border-gray-600 text-white rounded-md pl-8 p-2 text-sm"
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={toggleAll} 
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 rounded transition-colors"
                        >
                            {selectedCollaborators.size === filteredCollaborators.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto bg-gray-900/30 border border-gray-700 rounded-lg p-2 space-y-1 custom-scrollbar">
                        {filteredCollaborators.map(col => (
                            <label 
                                key={col.id} 
                                className={`flex items-center p-2 rounded cursor-pointer transition-colors ${selectedCollaborators.has(col.id) ? 'bg-blue-900/30 border border-blue-500/30' : 'hover:bg-gray-800 border border-transparent'}`}
                            >
                                <input 
                                    type="checkbox" 
                                    checked={selectedCollaborators.has(col.id)} 
                                    onChange={() => toggleCollaborator(col.id)} 
                                    className="rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary mr-3"
                                />
                                <div className="flex-grow">
                                    <p className="text-sm text-white font-medium">{col.fullName}</p>
                                    <p className="text-xs text-gray-400">{col.email}</p>
                                </div>
                                {selectedCollaborators.has(col.id) && <FaCheck className="text-green-400 text-xs"/>}
                            </label>
                        ))}
                        {filteredCollaborators.length === 0 && <p className="text-center text-gray-500 py-4 text-sm">Nenhum colaborador encontrado.</p>}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-700 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 mr-2">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Registar Formação</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default AddTrainingSessionModal;