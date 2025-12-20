import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Ticket, Collaborator, TicketActivity } from '../types';
import { FaMagic } from 'react-icons/fa';
import { FaSpinner } from './common/Icons';
import { generateTicketResolutionSummary } from '../services/geminiService';

interface CloseTicketModalProps {
    ticket: Ticket;
    collaborators: Collaborator[];
    onClose: () => void;
    onConfirm: (technicianId: string, resolutionSummary?: string) => void;
    activities?: TicketActivity[];
}

const CloseTicketModal: React.FC<CloseTicketModalProps> = ({ ticket, collaborators, onClose, onConfirm, activities = [] }) => {
    const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(collaborators[0]?.id || '');
    const [resolutionSummary, setResolutionSummary] = useState(ticket.resolution_summary || '');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTechnicianId) {
            alert("Por favor, selecione o técnico que resolveu o ticket.");
            return;
        }
        onConfirm(selectedTechnicianId, resolutionSummary);
    };

    const handleGenerateSummary = async () => {
        setIsGenerating(true);
        try {
            const activityTexts = activities.map(a => a.description);
            const summary = await generateTicketResolutionSummary(ticket.description, activityTexts);
            setResolutionSummary(summary);
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar resumo.");
        } finally {
            setIsGenerating(false);
        }
    };

    // FIX: full_name, collaborator_id
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);
    const requesterName = collaboratorMap.get(ticket.collaborator_id);

    return (
        <Modal title="Finalizar Ticket de Suporte" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <p className="text-on-surface-dark-secondary">Está a finalizar o ticket solicitado por <span className="font-semibold text-on-surface-dark">{requesterName}</span>.</p>
                    <p className="mt-2 p-3 bg-gray-900/50 rounded-md text-on-surface-dark">"{ticket.description}"</p>
                </div>
                <div>
                    <label htmlFor="technician" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Quem resolveu o ticket?</label>
                    <select
                        id="technician"
                        value={selectedTechnicianId}
                        onChange={(e) => setSelectedTechnicianId(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                        required
                    >
                        <option value="" disabled>Selecione um técnico</option>
                        {collaborators.map(collaborator => (
                            <option key={collaborator.id} value={collaborator.id}>{collaborator.full_name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="resolutionSummary" className="block text-sm font-medium text-on-surface-dark-secondary">Resumo da Resolução (KB)</label>
                        <button
                            type="button"
                            onClick={handleGenerateSummary}
                            disabled={isGenerating}
                            className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                            title="Gerar resumo automático baseado nas notas"
                        >
                            {isGenerating ? <FaSpinner className="animate-spin" /> : <FaMagic />}
                            {isGenerating ? 'A gerar...' : '✨ Gerar Resumo KB'}
                        </button>
                    </div>
                    <textarea
                        id="resolutionSummary"
                        value={resolutionSummary}
                        onChange={(e) => setResolutionSummary(e.target.value)}
                        rows={4}
                        placeholder="Descreva a solução aplicada para futura referência..."
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Este resumo será usado pela IA para sugerir soluções em tickets futuros.</p>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Confirmar e Finalizar</button>
                </div>
            </form>
        </Modal>
    );
};

export default CloseTicketModal;