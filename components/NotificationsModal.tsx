
import React, { useMemo } from 'react';
import Modal from './common/Modal';
import { Equipment, SoftwareLicense, Ticket, Collaborator, Team, LicenseAssignment } from '../types';
import { FaEye, FaBellSlash, FaTicketAlt, FaExclamationTriangle, FaShieldAlt } from './common/Icons';

interface NotificationsModalProps {
    onClose: () => void;
    expiringWarranties: Equipment[];
    expiringLicenses: SoftwareLicense[];
    teamTickets: Ticket[];
    collaborators: Collaborator[];
    teams: Team[];
    onViewItem: (tab: string, filter: any) => void;
    onSnooze: (id: string) => void;
    currentUser: Collaborator | null;
    licenseAssignments: LicenseAssignment[];
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

const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose, expiringWarranties, expiringLicenses, teamTickets, collaborators, teams, onViewItem, onSnooze, currentUser, licenseAssignments }) => {
    
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);

    const usedSeatsMap = useMemo(() => {
         return licenseAssignments.reduce((acc, a) => {
             acc.set(a.softwareLicenseId, (acc.get(a.softwareLicenseId) || 0) + 1);
             return acc;
        }, new Map<string, number>());
    }, [licenseAssignments]);

    const sortedWarranties = [...expiringWarranties].sort((a, b) => 
        (getExpiryStatus(a.warrantyEndDate).daysRemaining ?? Infinity) - (getExpiryStatus(b.warrantyEndDate).daysRemaining ?? Infinity)
    );

    const sortedLicenses = [...expiringLicenses].sort((a, b) => {
        const aDate = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
        const bDate = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
        return aDate - bDate;
    });
    
    const sortedTeamTickets = [...teamTickets].sort((a,b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime());

    return (
        <Modal title="Centro de Notificações" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6">
                 <section>
                    <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2"><FaTicketAlt className="text-brand-secondary"/> Tickets Pendentes</h3>
                    {sortedTeamTickets.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                            {sortedTeamTickets.map(ticket => {
                                const requesterName = collaboratorMap.get(ticket.collaboratorId) || 'Desconhecido';
                                const teamName = ticket.team_id ? teamMap.get(ticket.team_id) : 'Geral';
                                const isAssignedToMe = currentUser && ticket.technicianId === currentUser.id;
                                
                                return (
                                    <div key={ticket.id} className={`flex items-center justify-between p-3 rounded-lg border ${isAssignedToMe ? 'bg-brand-primary/10 border-brand-primary/50' : 'bg-surface-dark border-gray-700'}`}>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {isAssignedToMe && <span className="text-xs bg-brand-primary text-white px-2 py-0.5 rounded-full">Atribuído a mim</span>}
                                                {!ticket.technicianId && <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">Não Atribuído</span>}
                                                <p className="font-semibold text-on-surface-dark">{ticket.description}</p>
                                            </div>
                                            <p className="text-sm text-on-surface-dark-secondary mt-1">Pedido por: {requesterName} | Equipa: <span className="text-brand-secondary font-semibold">{teamName}</span></p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    onViewItem('tickets', { status: ticket.status });
                                                    onClose();
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                                            >
                                                <FaEye /> Ver
                                            </button>
                                            <button 
                                                onClick={() => onSnooze(ticket.id)}
                                                className="p-2 text-xs text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                                                title="Ocultar esta notificação"
                                            >
                                                <FaBellSlash />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-on-surface-dark-secondary text-sm">Não existem tickets que requeiram a sua atenção imediata.</p>
                    )}
                </section>

                <section>
                    <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2"><FaExclamationTriangle className="text-orange-400"/> Licenças (Expiração / Esgotadas)</h3>
                     {sortedLicenses.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                            {sortedLicenses.map(license => {
                                const status = getExpiryStatus(license.expiryDate);
                                const used = usedSeatsMap.get(license.id) || 0;
                                const available = license.totalSeats - used;
                                const isDepleted = available <= 0;

                                return (
                                    <div key={license.id} className="flex items-center justify-between p-3 bg-surface-dark rounded-lg border border-gray-700">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-on-surface-dark">{license.productName}</p>
                                                {isDepleted && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">ESGOTADA</span>}
                                            </div>
                                            <p className="text-sm text-on-surface-dark-secondary">
                                                Chave: <span className="font-mono text-xs">{license.licenseKey}</span>
                                                <span className="mx-2">|</span>
                                                Validade: <span className={status.className}>{status.text}</span>
                                                <span className="mx-2">|</span>
                                                Vagas: <span className={isDepleted ? "text-red-400 font-bold" : "text-green-400"}>{available}</span> / {license.totalSeats}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    onViewItem('licensing', { licenseKey: license.licenseKey });
                                                    onClose();
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                                            >
                                               <FaEye /> Ver
                                            </button>
                                            <button 
                                                onClick={() => onSnooze(license.id)}
                                                className="p-2 text-xs text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                                                title="Ocultar esta notificação"
                                            >
                                                <FaBellSlash />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                         <p className="text-on-surface-dark-secondary text-sm">Nenhuma licença crítica (a expirar ou esgotada).</p>
                    )}
                </section>

                <section>
                    <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2"><FaShieldAlt className="text-yellow-400"/> Garantias a Expirar</h3>
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
                                                onClick={() => {
                                                    onViewItem('equipment.inventory', { serialNumber: item.serialNumber });
                                                    onClose();
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                                            >
                                                <FaEye /> Ver
                                            </button>
                                            <button 
                                                onClick={() => onSnooze(item.id)}
                                                className="p-2 text-xs text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                                                title="Ocultar esta notificação"
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
            </div>
        </Modal>
    );
};

export default NotificationsModal;
