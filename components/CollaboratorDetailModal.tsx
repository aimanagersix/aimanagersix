
import React, { useMemo } from 'react';
import Modal from './common/Modal';
import { Collaborator, Assignment, Equipment, Ticket, CollaboratorStatus, TicketStatus } from '../types';
import { FaLaptop, FaTicketAlt, FaHistory, FaComment, FaEnvelope, FaPhone, FaMobileAlt, FaUserTag, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaEdit } from './common/Icons';

interface CollaboratorDetailModalProps {
    collaborator: Collaborator;
    assignments: Assignment[];
    equipment: Equipment[];
    tickets: Ticket[];
    brandMap: Map<string, string>;
    equipmentTypeMap: Map<string, string>;
    onClose: () => void;
    onShowHistory: (collaborator: Collaborator) => void;
    onStartChat: (collaborator: Collaborator) => void;
    onEdit: (collaborator: Collaborator) => void; // Added onEdit prop
}

const getStatusClass = (status: CollaboratorStatus) => {
    switch (status) {
        case CollaboratorStatus.Ativo: return 'bg-green-500/20 text-green-400';
        case CollaboratorStatus.Inativo: return 'bg-red-500/20 text-red-400';
        default: return 'bg-gray-500/20 text-gray-400';
    }
};

const getTicketStatusClass = (status: TicketStatus) => {
    switch (status) {
        case TicketStatus.Requested: return 'bg-yellow-500/20 text-yellow-400';
        case TicketStatus.InProgress: return 'bg-blue-500/20 text-blue-400';
        case TicketStatus.Finished: return 'bg-green-500/20 text-green-400';
        default: return 'bg-gray-500/20 text-gray-400';
    }
};

const CollaboratorDetailModal: React.FC<CollaboratorDetailModalProps> = ({
    collaborator,
    assignments,
    equipment,
    tickets,
    brandMap,
    equipmentTypeMap,
    onClose,
    onShowHistory,
    onStartChat,
    onEdit
}) => {
    const assignedEquipment = useMemo(() => {
        const collaboratorEquipmentIds = new Set(
            assignments
                .filter(a => a.collaboratorId === collaborator.id && !a.returnDate)
                .map(a => a.equipmentId)
        );
        return equipment.filter(e => collaboratorEquipmentIds.has(e.id));
    }, [assignments, equipment, collaborator.id]);

    const collaboratorTickets = useMemo(() => {
        return tickets
            .filter(t => t.collaboratorId === collaborator.id)
            .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    }, [tickets, collaborator.id]);

    const handleChatClick = () => {
        onStartChat(collaborator);
        onClose(); // Close this modal to show the chat widget
    };

    return (
        <Modal title={`Detalhes do Colaborador`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start gap-6 p-4 bg-gray-900/50 rounded-lg">
                    {collaborator.photoUrl ? (
                        <img src={collaborator.photoUrl} alt={collaborator.fullName} className="w-24 h-24 rounded-full object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-4xl flex-shrink-0">
                            {collaborator.fullName.charAt(0)}
                        </div>
                    )}
                    <div className="flex-grow">
                        <h2 className="text-2xl font-bold text-white">{collaborator.fullName}</h2>
                        <p className="text-on-surface-dark-secondary">{collaborator.numeroMecanografico}</p>
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                            <div className="flex items-center gap-2"><FaEnvelope className="text-gray-400" /> <a href={`mailto:${collaborator.email}`} className="hover:underline">{collaborator.email}</a></div>
                            {collaborator.telemovel && <div className="flex items-center gap-2"><FaMobileAlt className="text-gray-400" /> {collaborator.telemovel}</div>}
                            {collaborator.telefoneInterno && <div className="flex items-center gap-2"><FaPhone className="text-gray-400" /> Interno: {collaborator.telefoneInterno}</div>}
                            {collaborator.dateOfBirth && <div className="flex items-center gap-2"><FaCalendarAlt className="text-gray-400" /> {collaborator.dateOfBirth}</div>}
                            <div className="flex items-center gap-2"><FaUserTag className="text-gray-400" /> {collaborator.role}</div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${getStatusClass(collaborator.status)}`}>{collaborator.status}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                {collaborator.canLogin ? <FaCheckCircle className="text-green-400"/> : <FaTimesCircle className="text-red-400"/>}
                                {collaborator.canLogin ? "Pode fazer login" : "Não pode fazer login"}
                            </div>
                        </div>
                    </div>
                     <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => { onClose(); onEdit(collaborator); }} 
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors shadow-lg font-semibold"
                        >
                            <FaEdit /> Corrigir Dados
                        </button>
                        <button onClick={handleChatClick} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors">
                            <FaComment /> Enviar Mensagem
                        </button>
                        <button onClick={() => onShowHistory(collaborator)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">
                            <FaHistory /> Ver Histórico
                        </button>
                    </div>
                </div>

                {/* Assigned Equipment Section */}
                <section>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><FaLaptop /> Equipamentos Atribuídos ({assignedEquipment.length})</h3>
                    <div className="max-h-60 overflow-y-auto pr-2">
                        {assignedEquipment.length > 0 ? (
                            <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                                <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-4 py-2">Descrição</th>
                                        <th scope="col" className="px-4 py-2">Nº Série</th>
                                        <th scope="col" className="px-4 py-2">Nº Inventário</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignedEquipment.map(item => (
                                        <tr key={item.id} className="border-b border-gray-700">
                                            <td className="px-4 py-2 text-on-surface-dark">{item.description} <span className="text-xs">({brandMap.get(item.brandId)})</span></td>
                                            <td className="px-4 py-2 font-mono">{item.serialNumber}</td>
                                            <td className="px-4 py-2">{item.inventoryNumber || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center py-4 text-on-surface-dark-secondary">Nenhum equipamento atribuído a este colaborador.</p>
                        )}
                    </div>
                </section>
                
                {/* Tickets Section */}
                <section>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><FaTicketAlt /> Histórico de Tickets ({collaboratorTickets.length})</h3>
                    <div className="max-h-60 overflow-y-auto pr-2">
                        {collaboratorTickets.length > 0 ? (
                             <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                                <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-4 py-2">Data do Pedido</th>
                                        <th scope="col" className="px-4 py-2">Descrição</th>
                                        <th scope="col" className="px-4 py-2">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {collaboratorTickets.map(ticket => (
                                        <tr key={ticket.id} className="border-b border-gray-700">
                                            <td className="px-4 py-2">{ticket.requestDate}</td>
                                            <td className="px-4 py-2 text-on-surface-dark truncate max-w-sm" title={ticket.description}>{ticket.description}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${getTicketStatusClass(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center py-4 text-on-surface-dark-secondary">Nenhum ticket aberto por este colaborador.</p>
                        )}
                    </div>
                </section>
            </div>
        </Modal>
    );
};

export default CollaboratorDetailModal;
