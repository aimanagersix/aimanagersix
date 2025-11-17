import React from 'react';
import Modal from './common/Modal';
import { Equipment, SoftwareLicense, Ticket, Collaborator, Team } from '../types';
import { FaEye, FaBellSlash, FaTicketAlt } from './common/Icons';

interface NotificationsModalProps {
    onClose: () => void;
    expiringWarranties: Equipment[];
    expiringLicenses: SoftwareLicense[];
    teamTickets: Ticket[];
    collaborators: Collaborator[];
    teams: Team[];
    onViewItem: (tab: string, filter: any) => void;
    onSnooze: (id: string) => void;
}

const getExpiryStatus = (dateStr?: string): { text: string; className: string; daysRemaining: number | null } => {
    if (!dateStr) return { text: 'N/A', className: 'text-gray-400', daysRemaining: null };
    const expiryDate = new Date(dateStr);
    const today = new Date();
    expiryDate.setUTCHours(0, 0, 0, 0);
    today.setUTCHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { text: `Expirado há ${Math.abs(diffDays)} dia(s)`, className: 'text-red-400 font-semibold', daysRemaining: diffDays };
    }
    if (diffDays <= 30) {
        return { text: `Expira em ${diffDays} dia(s)`, className: 'text-yellow-400', daysRemaining: diffDays };
    }
    return { text: `Válido (${diffDays} dias restantes)`, className: 'text-green-400', daysRemaining: diffDays };
};

const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose, expiringWarranties, expiringLicenses, teamTickets, collaborators, teams, onViewItem, onSnooze }) => {
    
    const collaboratorMap = React.useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const teamMap = React.useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);

    const sortedWarranties = [...expiringWarranties].sort((a, b) => 
        (getExpiryStatus(a.warrantyEndDate).daysRemaining ?? Infinity) - (getExpiryStatus(b.warrantyEndDate).daysRemaining ?? Infinity)
    );

    const sortedLicenses = [...expiringLicenses].sort((a, b) =>
        (getExpiryStatus(a.expiryDate).daysRemaining ?? Infinity) - (getExpiryStatus(b.expiryDate).daysRemaining ?? Infinity)
    );
    
    const sortedTeamTickets = [...teamTickets].sort((a,b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime());

    return (
        <Modal title="Notificações" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6">
                 <section>
                    <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2"><FaTicketAlt className="text-yellow-400"/> Tickets Abertos da Equipa</h3>
                    {sortedTeamTickets.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                            {sortedTeamTickets.map(ticket => {
                                const requesterName = collaboratorMap.get(ticket.collaboratorId) || 'Desconhecido';
                                const teamName = ticket.teamId ? teamMap.get(ticket.teamId) : 'N/A';
                                return (
                                    <div key={ticket.id} className="flex items-center justify-between p-3 bg-surface-dark rounded-lg border border-gray-700">
                                        <div>
                                            <p className="font-semibold text-on-surface-dark">{ticket.description}</p>
                                            <p className="text-sm text-on-surface-dark-secondary">Pedido por: {requesterName} | Equipa: <span className="text-brand-secondary font-semibold">{teamName}</span></p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => onViewItem('tickets', { teamId: ticket.teamId })}
                                                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                                            >
                                                <FaEye /> Ver
                                            </button>
                                            <button 
                                                onClick={() => onSnooze(ticket.id)}
                                                className="p-2 text-xs text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                                                title="Ocultar permanentemente esta notificação"
                                            >
                                                <FaBellSlash />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-on-surface-dark-secondary text-sm">Não existem tickets abertos para as suas equipas.</p>
                    )}
                </section>
                <section>
                    <h3 className="text-xl font-semibold text-white mb-3">Garantias a Expirar ou Expiradas</h3>
                    {sortedWarranties.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                            {sortedWarranties.map(item => {
                                const status = getExpiryStatus(item.warrantyEndDate);
                                return (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-surface-dark rounded-lg border border-gray-700">
                                        <div>
                                            <p className="font-semibold text-on-surface-dark">{item.description}</p>
                                            <p className="text-sm text-on-surface-dark-secondary">S/N: {item.serialNumber} - <span className={status.className}>{status.text}</span></p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => onViewItem('equipment.inventory', { serialNumber: item.serialNumber })}
                                                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                                            >
                                                <FaEye /> Ver
                                            </button>
                                            <button 
                                                onClick={() => onSnooze(item.id)}
                                                className="p-2 text-xs text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                                                title="Ocultar permanentemente esta notificação"
                                            >
                                                <FaBellSlash />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-on-surface-dark-secondary text-sm">Nenhuma garantia a expirar nos próximos 30 dias.</p>
                    )}
                </section>

                <section>
                    <h3 className="text-xl font-semibold text-white mb-3">Licenças a Expirar ou Expiradas</h3>
                     {sortedLicenses.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                            {sortedLicenses.map(license => {
                                const status = getExpiryStatus(license.expiryDate);
                                return (
                                    <div key={license.id} className="flex items-center justify-between p-3 bg-surface-dark rounded-lg border border-gray-700">
                                        <div>
                                            <p className="font-semibold text-on-surface-dark">{license.productName}</p>
                                            <p className="text-sm text-on-surface-dark-secondary">Chave: {license.licenseKey} - <span className={status.className}>{status.text}</span></p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onViewItem('licensing', { licenseKey: license.licenseKey })}
                                                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                                            >
                                               <FaEye /> Ver
                                            </button>
                                            <button 
                                                onClick={() => onSnooze(license.id)}
                                                className="p-2 text-xs text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                                                title="Ocultar permanentemente esta notificação"
                                            >
                                                <FaBellSlash />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                         <p className="text-on-surface-dark-secondary text-sm">Nenhuma licença a expirar nos próximos 30 dias.</p>
                    )}
                </section>
            </div>
        </Modal>
    );
};

export default NotificationsModal;