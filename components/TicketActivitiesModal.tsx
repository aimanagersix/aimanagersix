
import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Ticket, TicketActivity, Collaborator, TicketStatus, Equipment, EquipmentType, Entidade, Assignment, SoftwareLicense, LicenseAssignment } from '../types';
import { PlusIcon, FaPrint, FaKey, FaLaptop } from './common/Icons';
import { FaDownload, FaSpinner } from 'react-icons/fa';
import * as dataService from '../services/dataService';

interface TicketActivitiesModalProps {
    ticket: Ticket;
    activities: TicketActivity[];
    collaborators: Collaborator[];
    currentUser: Collaborator | null;
    equipment: Equipment[];
    equipmentTypes: EquipmentType[];
    entidades: Entidade[];
    onClose: () => void;
    onAddActivity: (activity: { description: string, equipment_id?: string, software_license_id?: string }) => Promise<void>;
    assignments: Assignment[];
    softwareLicenses?: SoftwareLicense[];
    licenseAssignments?: LicenseAssignment[];
}

const TicketActivitiesModal: React.FC<TicketActivitiesModalProps> = ({ 
    ticket, activities, collaborators, currentUser, equipment, equipmentTypes, entidades, onClose, onAddActivity, assignments,
    softwareLicenses = [], licenseAssignments = []
}) => {
    const [localActivities, setLocalActivities] = useState<TicketActivity[]>([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);
    const [newActivityDescription, setNewActivityDescription] = useState('');
    const [assetType, setAssetType] = useState<'none' | 'hardware' | 'software'>('none');
    const [selectedEquipmentId, setSelectedEquipmentId] = useState(ticket.equipment_id || '');
    const [selectedLicenseId, setSelectedLicenseId] = useState(ticket.software_license_id || '');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);
    const equipmentMap = useMemo(() => new Map(equipment.map(e => [e.id, e])), [equipment]);
    const licenseMap = useMemo(() => new Map(softwareLicenses.map(l => [l.id, l])), [softwareLicenses]);
    
    const fetchActivities = async () => {
        setIsLoadingActivities(true);
        try {
            const data = await dataService.getTicketActivities(ticket.id);
            setLocalActivities(data);
        } catch (e) { setLocalActivities(activities); }
        finally { setIsLoadingActivities(false); }
    };

    useEffect(() => { fetchActivities(); }, [ticket.id]);

    const handleAddActivity = async () => {
        if (newActivityDescription.trim() === '') { setError('A descrição é obrigatória.'); return; }
        setError('');
        setIsSaving(true);
        try {
            await onAddActivity({ 
                description: newActivityDescription,
                equipment_id: assetType === 'hardware' ? selectedEquipmentId : undefined,
                software_license_id: assetType === 'software' ? selectedLicenseId : undefined
            });

            // Pedido 3: Notificar Requerente
            await dataService.addMessage({
                sender_id: '00000000-0000-0000-0000-000000000000',
                receiver_id: ticket.collaborator_id,
                content: `🛠️ ATUALIZAÇÃO TÉCNICA: [#${ticket.id.substring(0,8)}] - Uma nova nota foi adicionada ao seu pedido: "${newActivityDescription.substring(0, 50)}..."`,
                timestamp: new Date().toISOString(),
                read: false
            });

            setNewActivityDescription('');
            await fetchActivities();
        } catch (e) { console.error(e); }
        finally { setIsSaving(false); }
    };

    const sortedActivities = useMemo(() => [...localActivities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [localActivities]);

    return (
        <Modal title={`Atividades do Ticket - ${collaboratorMap.get(ticket.collaborator_id)}`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6 mt-2">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-grow">
                        <h3 className="font-bold text-white mb-1">Descrição do Pedido:</h3>
                        <p className="text-on-surface-dark-secondary text-sm italic">"{ticket.description}"</p>
                    </div>
                </div>

                {ticket.status !== TicketStatus.Finished && (
                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="font-semibold text-on-surface-dark mb-2">Registar Nova Intervenção</h3>
                        <textarea value={newActivityDescription} onChange={(e) => setNewActivityDescription(e.target.value)} rows={3} className="w-full bg-gray-700 border text-white rounded-md p-2 text-sm" placeholder="Descreva o trabalho realizado..."></textarea>
                        <div className="flex justify-end mt-4">
                            <button onClick={handleAddActivity} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary text-sm disabled:opacity-50">
                                {isSaving ? <FaSpinner className="animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                                {isSaving ? 'A Gravar...' : 'Registar Resposta e Notificar'}
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="space-y-4">
                    <h3 className="font-semibold text-white border-b border-gray-700 pb-2">Histórico de Respostas</h3>
                    {isLoadingActivities ? (
                         <div className="flex justify-center items-center py-8"><FaSpinner className="animate-spin text-gray-500" /></div>
                    ) : sortedActivities.length > 0 ? (
                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {sortedActivities.map(activity => (
                                <div key={activity.id} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-semibold text-brand-secondary text-sm">{collaboratorMap.get(activity.technician_id) || 'Técnico'}</p>
                                        <p className="text-[10px] text-gray-500">{new Date(activity.date).toLocaleString()}</p>
                                    </div>
                                    <p className="text-sm text-on-surface-dark">{activity.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-gray-500 text-center py-4">Sem registos técnicos.</p>}
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-700"><button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar Janela</button></div>
            </div>
        </Modal>
    );
};

export default TicketActivitiesModal;
