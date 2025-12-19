
import React, { useMemo, useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Equipment, SoftwareLicense, Ticket, Collaborator, Team, LicenseAssignment } from '../types';
import { FaEye, FaBellSlash, FaTicketAlt, FaExclamationTriangle, FaShieldAlt, FaHistory, FaCheckCircle } from './common/Icons';
import * as dataService from '../services/dataService';

interface NotificationsModalProps {
    onClose: () => void;
    expiringWarranties: Equipment[];
    expiringLicenses: SoftwareLicense[];
    teamTickets: Ticket[];
    collaborators: Collaborator[];
    teams: Team[];
    onViewItem: (tab: string, filter: any) => void;
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

const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose, expiringWarranties, expiringLicenses, teamTickets, collaborators, teams, onViewItem, currentUser, licenseAssignments }) => {
    const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set());
    const [showSnoozed, setShowSnoozed] = useState(false);

    useEffect(() => {
        const snoozedRaw = localStorage.getItem('snoozed_notifications');
        if (snoozedRaw) {
            try {
                const snoozed = JSON.parse(snoozedRaw);
                const now = new Date().toISOString();
                const activeSnoozedIds = new Set<string>();
                
                if(Array.isArray(snoozed)) {
                    snoozed.forEach((item: { id: string; until: string }) => {
                        if (item.until > now) {
                            activeSnoozedIds.add(item.id);
                        }
                    });
                    setSnoozedIds(activeSnoozedIds);
                }
            } catch(e) {
                console.error("Error parsing snoozed notifications", e);
            }
        }
    }, []);

    const handleSnooze = (id: string) => {
        dataService.snoozeNotification(id);
        setSnoozedIds(prev => new Set(prev).add(id));
    };

    const handleUnSnooze = (id: string) => {
        const snoozedRaw = localStorage.getItem('snoozed_notifications');
        if (snoozedRaw) {
            const snoozed = JSON.parse(snoozedRaw);
            const filtered = snoozed.filter((item: any) => item.id !== id);
            localStorage.setItem('snoozed_notifications', JSON.stringify(filtered));
            setSnoozedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);

    const usedSeatsMap = useMemo(() => {
         return licenseAssignments.reduce((acc, a) => {
             acc.set(a.softwareLicenseId, (acc.get(a.softwareLicenseId) || 0) + 1);
             return acc;
        }, new Map<string, number>());
    }, [licenseAssignments]);

    const filterVisible = (items: any[]) => items.filter(item => showSnoozed || !snoozedIds.has(item.id));

    const sortedWarranties = useMemo(() => filterVisible(expiringWarranties).sort((a, b) => 
        (getExpiryStatus(a.warrantyEndDate).daysRemaining ?? Infinity) - (getExpiryStatus(b.warrantyEndDate).daysRemaining ?? Infinity)
    ), [expiringWarranties, snoozedIds, showSnoozed]);

    const sortedLicenses = useMemo(() => filterVisible(expiringLicenses).sort((a, b) => {
        const aDate = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
        const bDate = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
        return aDate - bDate;
    }), [expiringLicenses, snoozedIds, showSnoozed]);
    
    const sortedTeamTickets = useMemo(() => filterVisible(teamTickets).sort((a,b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()), [teamTickets, snoozedIds, showSnoozed]);

    const NotificationItem = ({ id, children, onView, isSnoozed }: { id: string, children: React.ReactNode, onView: () => void, isSnoozed: boolean }) => (
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isSnoozed ? 'bg-gray-900/30 border-gray-800 opacity-60 grayscale' : 'bg-surface-dark border-gray-700 hover:border-gray-600'}`}>
            <div className="flex-1 min-w-0 pr-4">
                {children}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={onView} className="p-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors" title="Ver Item">
                    <FaEye size={14} />
                </button>
                <button 
                    onClick={() => isSnoozed ? handleUnSnooze(id) : handleSnooze(id)}
                    className={`p-2 rounded-md transition-colors ${isSnoozed ? 'bg-green-900/20 text-green-400 hover:bg-green-900/40' : 'bg-gray-700 text-gray-400 hover:text-red-400'}`}
                    title={isSnoozed ? "Restaurar Notificação" : "Ocultar Temporariamente"}
                >
                    {isSnoozed ? <FaHistory size={14} /> : <FaBellSlash size={14} />}
                </button>
            </div>
        </div>
    );

    return (
        <Modal title="Centro de Notificações" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6">
                 {/* Tickets Section */}
                 <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FaTicketAlt className="text-brand-secondary"/> Tickets Pendentes
                    </h3>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {sortedTeamTickets.length > 0 ? sortedTeamTickets.map(ticket => {
                            const requesterName = collaboratorMap.get(ticket.collaboratorId) || 'Desconhecido';
                            const isSnoozed = snoozedIds.has(ticket.id);
                            return (
                                <NotificationItem key={ticket.id} id={ticket.id} isSnoozed={isSnoozed} onView={() => { onViewItem('tickets', { id: ticket.id }); onClose(); }}>
                                    <p className="font-semibold text-white truncate text-sm">{ticket.title || ticket.description}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Pedido por {requesterName} em {new Date(ticket.requestDate).toLocaleDateString()}</p>
                                </NotificationItem>
                            );
                        }) : <p className="text-gray-500 text-sm italic">Sem tickets pendentes.</p>}
                    </div>
                </section>

                {/* Licenses Section */}
                <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FaExclamationTriangle className="text-orange-400"/> Licenças Críticas
                    </h3>
                     <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {sortedLicenses.length > 0 ? sortedLicenses.map(license => {
                            const status = getExpiryStatus(license.expiryDate);
                            const used = usedSeatsMap.get(license.id) || 0;
                            const isSnoozed = snoozedIds.has(license.id);
                            return (
                                <NotificationItem key={license.id} id={license.id} isSnoozed={isSnoozed} onView={() => { onViewItem('licensing', { licenseKey: license.licenseKey }); onClose(); }}>
                                    <p className="font-semibold text-white text-sm">{license.productName}</p>
                                    <div className="flex flex-wrap gap-2 text-[10px] mt-1 uppercase font-bold">
                                        <span className={status.className}>{status.text}</span>
                                        <span className="text-gray-500">|</span>
                                        <span className={license.totalSeats - used <= 0 ? 'text-red-400' : 'text-gray-400'}>Ativações: {used}/{license.totalSeats}</span>
                                    </div>
                                </NotificationItem>
                            );
                        }) : <p className="text-gray-500 text-sm italic">Sem licenças críticas.</p>}
                    </div>
                </section>

                {/* Warranties Section */}
                <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FaShieldAlt className="text-yellow-400"/> Garantias a Expirar
                    </h3>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {sortedWarranties.length > 0 ? sortedWarranties.map(item => {
                            const status = getExpiryStatus(item.warrantyEndDate);
                            const isSnoozed = snoozedIds.has(item.id);
                            return (
                                <NotificationItem key={item.id} id={item.id} isSnoozed={isSnoozed} onView={() => { onViewItem('equipment.inventory', { serialNumber: item.serialNumber }); onClose(); }}>
                                    <p className="font-semibold text-white text-sm">{item.description}</p>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">S/N: {item.serialNumber} — <span className={status.className}>{status.text}</span></p>
                                </NotificationItem>
                            );
                        }) : <p className="text-gray-500 text-sm italic">Sem garantias a expirar.</p>}
                    </div>
                </section>

                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={showSnoozed} 
                            onChange={(e) => setShowSnoozed(e.target.checked)}
                            className="rounded bg-gray-700 border-gray-600 text-brand-primary"
                        />
                        <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">Mostrar Notificações Ocultas ({snoozedIds.size})</span>
                    </label>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default NotificationsModal;
