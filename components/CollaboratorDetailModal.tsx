


import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Collaborator, Assignment, Equipment, Ticket, SoftwareLicense, LicenseAssignment, Brand, EquipmentType, ConfigItem } from '../types';
import { FaLaptop, FaTicketAlt, FaHistory, FaComment, FaEnvelope, FaPhone, FaMobileAlt, FaUserTag, FaEdit, FaKey, FaUserSlash } from './common/Icons';
import OffboardingModal from './OffboardingModal';

interface CollaboratorDetailModalProps {
    collaborator: Collaborator;
    assignments: Assignment[];
    equipment: Equipment[];
    tickets: Ticket[];
    brandMap: Map<string, string>;
    equipmentTypeMap: Map<string, string>;
    licenseAssignments: LicenseAssignment[];
    softwareLicenses: SoftwareLicense[];
    onClose: () => void;
    onShowHistory: (collaborator: Collaborator) => void;
    onStartChat: (collaborator: Collaborator) => void;
    onEdit: (collaborator: Collaborator) => void;
    onAssignEquipment?: (collaboratorId: string, equipmentId: string) => Promise<void>;
    onUnassignEquipment?: (equipmentId: string) => Promise<void>;
    // FIX: Update onConfirmOffboarding to accept reasonId.
    onConfirmOffboarding?: (collaboratorId: string, reasonId?: string) => Promise<void>;
    deactivationReasons?: ConfigItem[];
}

export const CollaboratorDetailModal: React.FC<CollaboratorDetailModalProps> = ({ 
    collaborator, assignments, equipment, tickets, brandMap, equipmentTypeMap, licenseAssignments, softwareLicenses, 
    onClose, onShowHistory, onStartChat, onEdit, onConfirmOffboarding, deactivationReasons = []
}) => {
    const [activeTab, setActiveTab] = useState('equipment');
    const [showOffboardingModal, setShowOffboardingModal] = useState(false);

    const collaboratorAssignments = useMemo(() => {
        return assignments.filter(a => a.collaboratorId === collaborator.id && !a.returnDate);
    }, [assignments, collaborator.id]);

    const assignedEquipment = useMemo(() => {
        const eqIds = new Set(collaboratorAssignments.map(a => a.equipmentId));
        return equipment.filter(e => eqIds.has(e.id));
    }, [equipment, collaboratorAssignments]);

    const assignedLicenses = useMemo(() => {
        const equipmentIds = new Set(assignedEquipment.map(e => e.id));
        const licenseIds = new Set(
            licenseAssignments
                .filter(la => equipmentIds.has(la.equipmentId) && !la.returnDate)
                .map(la => la.softwareLicenseId)
        );
        return softwareLicenses.filter(lic => licenseIds.has(lic.id));
    }, [licenseAssignments, softwareLicenses, assignedEquipment]);

    const collaboratorTickets = useMemo(() => {
        return tickets.filter(t => t.collaboratorId === collaborator.id)
            .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    }, [tickets, collaborator.id]);

    const handleOffboardClick = () => {
        if (onConfirmOffboarding) {
            setShowOffboardingModal(true);
        }
    };
    
    return (
        <>
            <Modal title={`Detalhes de: ${collaborator.fullName}`} onClose={onClose} maxWidth="max-w-4xl">
                <div className="flex flex-col h-[70vh]">
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 mb-4">
                        <div className="relative">
                            {collaborator.photoUrl ? (
                                <img src={collaborator.photoUrl} alt={collaborator.fullName} className="w-16 h-16 rounded-full object-cover"/>
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-2xl">
                                    {collaborator.fullName.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-xl font-bold text-white">{collaborator.fullName}</h2>
                            <p className="text-sm text-gray-400">{collaborator.role}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300 mt-2">
                                <span className="flex items-center gap-1"><FaEnvelope className="text-gray-500"/>{collaborator.email}</span>
                                {collaborator.telemovel && <span className="flex items-center gap-1"><FaMobileAlt className="text-gray-500"/>{collaborator.telemovel}</span>}
                                {collaborator.telefoneInterno && <span className="flex items-center gap-1"><FaPhone className="text-gray-500"/> Ext: {collaborator.telefoneInterno}</span>}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                                <button onClick={() => { onClose(); onEdit(collaborator); }} className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center gap-2"><FaEdit/> Editar</button>
                                <button onClick={() => { onClose(); onStartChat(collaborator); }} className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center gap-2"><FaComment/> Chat</button>
                            </div>
                             {onConfirmOffboarding && (
                                <button onClick={handleOffboardClick} className="px-3 py-2 text-sm bg-red-800 hover:bg-red-700 text-white rounded-md flex items-center gap-2"><FaUserSlash/> Inativar (Offboarding)</button>
                             )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-700 mb-4 flex-shrink-0">
                        <button onClick={() => setActiveTab('equipment')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'equipment' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Equipamentos ({assignedEquipment.length})</button>
                        <button onClick={() => setActiveTab('licenses')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'licenses' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Licenças ({assignedLicenses.length})</button>
                        <button onClick={() => setActiveTab('tickets')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'tickets' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Tickets ({collaboratorTickets.length})</button>
                    </div>

                    {/* Content */}
                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        {activeTab === 'equipment' && (
                            <div>
                                {assignedEquipment.length > 0 ? (
                                    <div className="space-y-2">
                                        {assignedEquipment.map(eq => (
                                            <div key={eq.id} className="bg-gray-800 p-3 rounded border border-gray-700">
                                                <p className="font-bold text-white">{eq.description}</p>
                                                <p className="text-xs text-gray-400">S/N: {eq.serialNumber} | Marca: {brandMap.get(eq.brandId)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-center text-gray-500 py-4">Nenhum equipamento atribuído.</p>}
                            </div>
                        )}

                        {activeTab === 'licenses' && (
                            <div>
                                {assignedLicenses.length > 0 ? (
                                    <div className="space-y-2">
                                        {assignedLicenses.map(lic => (
                                            <div key={lic.id} className="bg-gray-800 p-3 rounded border border-gray-700">
                                                <p className="font-bold text-white">{lic.productName}</p>
                                                <p className="text-xs text-gray-400 font-mono">{lic.licenseKey}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-center text-gray-500 py-4">Nenhuma licença em uso.</p>}
                            </div>
                        )}

                        {activeTab === 'tickets' && (
                             <div>
                                {collaboratorTickets.length > 0 ? (
                                    <div className="space-y-2">
                                        {collaboratorTickets.map(t => (
                                            <div key={t.id} className="bg-gray-800 p-3 rounded border border-gray-700">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-white text-sm">{t.title}</p>
                                                    <span className="text-xs text-gray-400">{new Date(t.requestDate).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-300 mt-1 line-clamp-2">{t.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-center text-gray-500 py-4">Nenhum ticket registado.</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-gray-700 flex-shrink-0">
                        <button onClick={() => { onClose(); onShowHistory(collaborator); }} className="text-sm text-gray-400 hover:text-white flex items-center gap-2"><FaHistory/> Ver Histórico de Entidades</button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                    </div>
                </div>
            </Modal>
            {showOffboardingModal && onConfirmOffboarding && (
                <OffboardingModal
                    collaborator={collaborator}
                    assignments={assignments}
                    licenseAssignments={licenseAssignments}
                    equipment={equipment}
                    softwareLicenses={softwareLicenses}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    deactivationReasons={deactivationReasons}
                    onClose={() => setShowOffboardingModal(false)}
                    onConfirm={async (id, reasonId) => {
                        await onConfirmOffboarding(id, reasonId);
                        setShowOffboardingModal(false);
                        onClose(); // Close parent modal too
                    }}
                />
            )}
        </>
    );
};