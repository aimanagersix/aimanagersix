
import React, { useMemo } from 'react';
import Modal from './common/Modal';
import { Equipment, Assignment, Collaborator, Entidade, Ticket, TicketActivity } from '../types';

interface EquipmentHistoryModalProps {
    equipment: Equipment;
    assignments: Assignment[];
    collaborators: Collaborator[];
    escolasDepartamentos: Entidade[];
    onClose: () => void;
    tickets: Ticket[];
    ticketActivities: TicketActivity[];
}

const EquipmentHistoryModal: React.FC<EquipmentHistoryModalProps> = ({ equipment, assignments, collaborators, escolasDepartamentos: entidades, onClose, tickets, ticketActivities }) => {
    // Memoize maps for efficient lookups
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);

    // Filter and sort the assignments for the current equipment
    const equipmentAssignments = useMemo(() => {
        return assignments
            .filter(a => a.equipmentId === equipment.id)
            .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    }, [assignments, equipment.id]);

    const equipmentTickets = useMemo(() => {
        return tickets
            .filter(t => t.equipmentId === equipment.id)
            .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    }, [tickets, equipment.id]);

    const equipmentActivities = useMemo(() => {
        const equipmentTicketIds = new Set(equipmentTickets.map(t => t.id));
        return ticketActivities
            .filter(ta => ta.equipmentId === equipment.id || (ta.ticketId && equipmentTicketIds.has(ta.ticketId)))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [ticketActivities, equipmentTickets, equipment.id]);

    const getStatusText = (assignment: Assignment) => {
        return assignment.returnDate ? 'Concluída' : 'Ativa';
    };

    return (
        <Modal title={`Histórico do Equipamento: ${equipment.serialNumber}`} onClose={onClose}>
            <div className="space-y-4">
                 <div className="bg-gray-900/50 p-3 rounded-lg text-sm grid grid-cols-2 gap-x-4">
                    <p><span className="font-semibold text-on-surface-dark-secondary">Nº Inventário:</span> {equipment.inventoryNumber || 'N/A'}</p>
                    <p><span className="font-semibold text-on-surface-dark-secondary">Nº Fatura:</span> {equipment.invoiceNumber || 'N/A'}</p>
                </div>
                {equipmentAssignments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                            <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Colaborador</th>
                                    <th scope="col" className="px-6 py-3">Entidade</th>
                                    <th scope="col" className="px-6 py-3">Data de Atribuição</th>
                                    <th scope="col" className="px-6 py-3">Data de Fim</th>
                                    <th scope="col" className="px-6 py-3">Estado da Atribuição</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipmentAssignments.map(assignment => (
                                    <tr key={assignment.id} className="bg-surface-dark border-b border-gray-700">
                                        <td className="px-6 py-4 font-medium text-on-surface-dark">{assignment.collaboratorId ? collaboratorMap.get(assignment.collaboratorId) : 'Atribuído à Localização'}</td>
                                        <td className="px-6 py-4">{entidadeMap.get(assignment.entidadeId) || 'N/A'}</td>
                                        <td className="px-6 py-4">{assignment.assignedDate}</td>
                                        <td className="px-6 py-4">{assignment.returnDate || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                assignment.returnDate 
                                                ? 'bg-gray-500/30 text-gray-300' 
                                                : 'bg-green-500/30 text-green-300'
                                            }`}>
                                                {getStatusText(assignment)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center py-4">Este equipamento não tem histórico de atribuições.</p>
                )}
                <h3 className="text-lg font-semibold text-white pt-4 border-t border-gray-700">Histórico de Suporte</h3>
                {equipmentTickets.length > 0 ? (
                    <div className="overflow-x-auto max-h-48">
                         <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                            <caption className="caption-top text-left text-sm font-medium text-on-surface-dark-secondary p-2">Tickets Associados</caption>
                            <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Data Pedido</th>
                                    <th scope="col" className="px-6 py-3">Descrição</th>
                                    <th scope="col" className="px-6 py-3">Estado</th>
                                </tr>
                            </thead>
                             <tbody>
                                {equipmentTickets.map(ticket => (
                                    <tr key={ticket.id} className="bg-surface-dark border-b border-gray-700">
                                        <td className="px-6 py-4">{ticket.requestDate}</td>
                                        <td className="px-6 py-4">{ticket.description}</td>
                                        <td className="px-6 py-4">{ticket.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                     <p className="text-center py-4">Este equipamento não tem histórico de tickets.</p>
                )}
                {equipmentActivities.length > 0 && (
                    <div className="overflow-y-auto max-h-48 space-y-2 mt-4">
                        <p className="text-sm font-medium text-on-surface-dark-secondary p-2">Atividades de Suporte</p>
                        {equipmentActivities.map(activity => (
                             <div key={activity.id} className="p-3 bg-gray-900/50 rounded-lg">
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
                )}
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default EquipmentHistoryModal;