import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Ticket, TicketActivity, Collaborator, TicketStatus } from '../types';
import { PlusIcon } from './common/Icons';
import { FaDownload } from 'react-icons/fa';

interface TicketActivitiesModalProps {
    ticket: Ticket;
    activities: TicketActivity[];
    collaborators: Collaborator[];
    currentUser: Collaborator | null;
    onClose: () => void;
    onAddActivity: (activity: { description: string }) => void;
}

const TicketActivitiesModal: React.FC<TicketActivitiesModalProps> = ({ ticket, activities, collaborators, currentUser, onClose, onAddActivity }) => {
    const [newActivityDescription, setNewActivityDescription] = useState('');
    const [error, setError] = useState('');

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);

    const handleAddActivity = () => {
        if (newActivityDescription.trim() === '') {
            setError('A descrição da atividade é obrigatória.');
            return;
        }
        setError('');
        onAddActivity({ description: newActivityDescription });
        setNewActivityDescription('');
    };

    const requesterName = collaboratorMap.get(ticket.collaboratorId) || 'Desconhecido';
    const sortedActivities = useMemo(() => {
        return [...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activities]);

    return (
        <Modal title={`Atividades do Ticket - ${requesterName}`} onClose={onClose}>
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-on-surface-dark mb-1">Descrição do Pedido:</h3>
                    <p className="p-3 bg-gray-900/50 rounded-md text-on-surface-dark-secondary text-sm">{ticket.description}</p>
                </div>

                {ticket.attachments && ticket.attachments.length > 0 && (
                     <div>
                        <h3 className="font-semibold text-on-surface-dark mb-2">Anexos:</h3>
                        <div className="space-y-2">
                            {ticket.attachments.map((att, index) => (
                                <a
                                    key={index}
                                    href={att.dataUrl}
                                    download={att.name}
                                    className="flex items-center gap-3 p-2 bg-surface-dark rounded-md border border-gray-700 hover:bg-gray-800/50 transition-colors"
                                >
                                    <FaDownload className="text-brand-secondary h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm text-on-surface-dark-secondary truncate">{att.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                
                {ticket.status !== TicketStatus.Finished && (
                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="font-semibold text-on-surface-dark mb-2">Registar Nova Intervenção</h3>
                        <div className="space-y-2">
                            <textarea
                                value={newActivityDescription}
                                onChange={(e) => setNewActivityDescription(e.target.value)}
                                rows={3}
                                placeholder={`Descreva o trabalho realizado por ${currentUser?.fullName}...`}
                                className={`w-full bg-gray-700 border text-white rounded-md p-2 text-sm ${error ? 'border-red-500' : 'border-gray-600'}`}
                            ></textarea>
                            {error && <p className="text-red-400 text-xs italic">{error}</p>}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleAddActivity}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary text-sm"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Adicionar Registo
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <div>
                    <h3 className="font-semibold text-on-surface-dark mb-2">Histórico de Intervenções</h3>
                    {sortedActivities.length > 0 ? (
                        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                            {sortedActivities.map(activity => (
                                <div key={activity.id} className="p-3 bg-surface-dark rounded-lg border border-gray-700">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-semibold text-brand-secondary text-sm">
                                            {collaboratorMap.get(activity.technicianId) || 'Técnico Desconhecido'}
                                        </p>
                                        <p className="text-xs text-on-surface-dark-secondary">
                                            {new Date(activity.date).toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="text-sm text-on-surface-dark">{activity.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-on-surface-dark-secondary text-center py-4">Ainda não foram registadas intervenções para este ticket.</p>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default TicketActivitiesModal;