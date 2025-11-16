import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Ticket, Collaborator } from '../types';

interface CloseTicketModalProps {
    ticket: Ticket;
    collaborators: Collaborator[];
    onClose: () => void;
    onConfirm: (technicianId: string) => void;
}

const CloseTicketModal: React.FC<CloseTicketModalProps> = ({ ticket, collaborators, onClose, onConfirm }) => {
    const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(collaborators[0]?.id || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTechnicianId) {
            alert("Por favor, selecione o técnico que resolveu o ticket.");
            return;
        }
        onConfirm(selectedTechnicianId);
    };

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const requesterName = collaboratorMap.get(ticket.collaboratorId);

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
                            <option key={collaborator.id} value={collaborator.id}>{collaborator.fullName}</option>
                        ))}
                    </select>
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