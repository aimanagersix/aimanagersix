
import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Collaborator, Assignment, Equipment, Ticket, SoftwareLicense, LicenseAssignment, Brand, EquipmentType, ConfigItem } from '../types';
import { FaLaptop, FaTicketAlt, FaHistory, FaComment, FaEnvelope, FaPhone, FaMobileAlt, FaUserTag, FaEdit, FaKey, FaUserSlash, FaBoxOpen, FaPrint, FaExternalLinkAlt } from './common/Icons';
import OffboardingModal from './OffboardingModal';
import * as dataService from '../services/dataService';

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
    onConfirmOffboarding?: (collaboratorId: string, reasonId?: string) => Promise<void>;
    deactivationReasons?: ConfigItem[];
    onViewTicket?: (ticket: Ticket) => void;
    onViewEquipment?: (equipment: Equipment, allowEdit?: boolean) => void;
}

export const CollaboratorDetailModal: React.FC<CollaboratorDetailModalProps> = ({ 
    collaborator, assignments, equipment, tickets, brandMap, equipmentTypeMap, licenseAssignments, softwareLicenses, 
    onClose, onShowHistory, onStartChat, onEdit, onConfirmOffboarding, deactivationReasons = [],
    onViewTicket, onViewEquipment
}) => {
    const [activeTab, setActiveTab] = useState('active_assets');
    const [showOffboardingModal, setShowOffboardingModal] = useState(false);

    // Active Assets - Snake Case Check
    const activeAssignments = useMemo(() => {
        return assignments.filter(a => a.collaborator_id === collaborator.id && !a.return_date);
    }, [assignments, collaborator.id]);

    const assignedEquipment = useMemo(() => {
        const eqIds = new Set(activeAssignments.map(a => a.equipment_id));
        return equipment.filter(e => eqIds.has(e.id));
    }, [equipment, activeAssignments]);
    
    const activeLicenses = useMemo(() => {
        const equipmentIds = new Set(assignedEquipment.map(e => e.id));
        const licenseIds = new Set(
            licenseAssignments
                .filter(la => la.equipment_id && equipmentIds.has(la.equipment_id) && !la.return_date)
                .map(la => la.software_license_id)
        );
        return softwareLicenses.filter(lic => licenseIds.has(lic.id));
    }, [licenseAssignments, softwareLicenses, assignedEquipment]);

    const collaboratorTickets = useMemo(() => {
        return tickets.filter(t => t.collaborator_id === collaborator.id)
            .sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
    }, [tickets, collaborator.id]);

    return (
        <>
            <Modal title={`Ficha de: ${collaborator.full_name}`} onClose={onClose} maxWidth="max-w-5xl">
                <div className="flex flex-col h-[75vh]">
                    <div className="flex-shrink-0 flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 mb-4">
                        <div className="relative">
                            {collaborator.photo_url ? (
                                <img src={collaborator.photo_url} alt={collaborator.full_name} className="w-16 h-16 rounded-full object-cover"/>
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-2xl">
                                    {collaborator.full_name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-xl font-bold text-white">{collaborator.full_name}</h2>
                            <p className="text-sm text-gray-400">{collaborator.role}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300 mt-2">
                                <span className="flex items-center gap-1"><FaEnvelope className="text-gray-500"/>{collaborator.email}</span>
                                {collaborator.telemovel && <span className="flex items-center gap-1"><FaMobileAlt className="text-gray-500"/>{collaborator.telemovel}</span>}
                                {collaborator.numero_mecanografico && <span className="flex items-center gap-1"><FaUserTag className="text-gray-500"/> Mec: {collaborator.numero_mecanografico}</span>}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                                <button onClick={() => { onClose(); onEdit(collaborator); }} className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center gap-2"><FaEdit/> Editar</button>
                                <button onClick={() => { onClose(); onStartChat(collaborator); }} className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center gap-2"><FaComment/> Chat</button>
                            </div>
                            <span className={`block text-xs font-bold px-2 py-1 rounded ${collaborator.status === 'Ativo' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {collaborator.status}
                            </span>
                        </div>
                    </div>

                    <div className="flex border-b border-gray-700 mb-4 flex-shrink-0">
                        <button onClick={() => setActiveTab('active_assets')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'active_assets' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Ativos Atuais ({assignedEquipment.length})</button>
                        <button onClick={() => setActiveTab('tickets')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'tickets' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Histórico Tickets ({collaboratorTickets.length})</button>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        {activeTab === 'active_assets' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {assignedEquipment.map(eq => (
                                        <div key={eq.id} className="bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-center hover:bg-gray-700 cursor-pointer" onClick={() => onViewEquipment?.(eq, true)}>
                                            <div>
                                                <p className="font-bold text-white text-sm">{eq.description}</p>
                                                <p className="text-xs text-gray-400">S/N: {eq.serial_number}</p>
                                            </div>
                                            <FaExternalLinkAlt className="text-xs text-gray-500" />
                                        </div>
                                    ))}
                                    {assignedEquipment.length === 0 && <p className="text-gray-500 italic py-4">Sem equipamentos.</p>}
                                </div>
                            </div>
                        )}

                        {activeTab === 'tickets' && (
                             <div className="space-y-3">
                                {collaboratorTickets.map(t => (
                                    <div key={t.id} className="bg-gray-800 p-3 rounded border border-gray-700 hover:bg-gray-700 cursor-pointer" onClick={() => onViewTicket?.(t)}>
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-white text-sm">{t.title}</span>
                                            <span className="text-xs text-gray-400">{t.request_date}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${t.status === 'Finalizado' ? 'bg-green-900/30 text-green-300 border-green-500/30' : 'bg-blue-900/30 text-blue-300 border-blue-500/30'}`}>{t.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
};
