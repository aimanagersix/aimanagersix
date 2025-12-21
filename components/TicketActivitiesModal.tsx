
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
    
    const availableEquipment = useMemo(() => {
        const userId = ticket.collaborator_id;
        const entityId = ticket.entidade_id;
        
        return equipment.filter(e => {
            const currentAssignment = assignments.find(a => a.equipment_id === e.id && !a.return_date);
            return currentAssignment && (
                currentAssignment.collaborator_id === userId ||
                currentAssignment.entidade_id === entityId
            );
        });
    }, [equipment, assignments, ticket.entidade_id, ticket.collaborator_id]);

    const availableLicenses = useMemo(() => {
        const userId = ticket.collaborator_id;
        if (!userId) return [];
        
        const activeEqIds = new Set(
            assignments
                .filter(a => a.collaborator_id === userId && !a.return_date)
                .map(a => a.equipment_id)
        );
        
        const activeLicIds = new Set(
            licenseAssignments
                .filter(la => activeEqIds.has(la.equipment_id) && !la.return_date)
                .map(la => la.software_license_id)
        );
        
        return softwareLicenses.filter(lic => activeLicIds.has(lic.id));
    }, [softwareLicenses, licenseAssignments, assignments, ticket.collaborator_id]);

    useEffect(() => {
        if (ticket.equipment_id) {
            setAssetType('hardware');
            setSelectedEquipmentId(ticket.equipment_id);
        } else if (ticket.software_license_id) {
            setAssetType('software');
            setSelectedLicenseId(ticket.software_license_id);
        }
    }, [ticket]);

    const fetchActivities = async () => {
        setIsLoadingActivities(true);
        try {
            const data = await dataService.getTicketActivities(ticket.id);
            setLocalActivities(data);
        } catch (e) {
            console.error("Failed to load activities", e);
            setLocalActivities(activities);
        } finally {
            setIsLoadingActivities(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [ticket.id]);

    const handleAddActivity = async () => {
        if (newActivityDescription.trim() === '') {
            setError('A descrição da atividade é obrigatória.');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await onAddActivity({ 
                description: newActivityDescription,
                equipment_id: assetType === 'hardware' ? selectedEquipmentId : undefined,
                software_license_id: assetType === 'software' ? selectedLicenseId : undefined
            });

            if (localActivities.length === 0 && ticket.status === 'Pedido') {
                await dataService.updateTicket(ticket.id, { status: 'Em progresso' });
                await dataService.addMessage({
                    sender_id: currentUser?.id || '00000000-0000-0000-0000-000000000000',
                    receiver_id: ticket.collaborator_id,
                    content: `Nova resposta ao seu pedido #${ticket.id.substring(0,8)}: O estado foi alterado para "Em progresso".`,
                    timestamp: new Date().toISOString(),
                    read: false
                });
            }

            setNewActivityDescription('');
            await fetchActivities();
        } catch (e) {
            console.error("Erro ao adicionar atividade:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const requesterName = collaboratorMap.get(ticket.collaborator_id) || 'Desconhecido';
    const associatedEquipment = ticket.equipment_id ? equipmentMap.get(ticket.equipment_id) : null;
    const associatedLicense = ticket.software_license_id ? licenseMap.get(ticket.software_license_id) : null;
    const entidadeName = entidades.find(e => e.id === ticket.entidade_id)?.name || 'Entidade Desconhecida';
    
    const sortedActivities = useMemo(() => {
        return [...localActivities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [localActivities]);

    return (
        <Modal title={`Atividades do Ticket - ${requesterName}`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6 mt-2">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-grow">
                        <h3 className="font-bold text-white mb-1">Descrição do Pedido:</h3>
                        <p className="text-on-surface-dark-secondary text-sm italic">"{ticket.description}"</p>
                    </div>
                    <div className="min-w-[200px] border-l border-gray-700 pl-4 flex flex-col justify-center">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Ativo de Origem</p>
                        {associatedEquipment ? (
                             <div className="flex items-center gap-2 text-xs text-blue-400">
                                <FaLaptop /> <span>{associatedEquipment.description}</span>
                             </div>
                        ) : associatedLicense ? (
                            <div className="flex items-center gap-2 text-xs text-yellow-400">
                                <FaKey /> <span>{associatedLicense.product_name}</span>
                             </div>
                        ) : (
                            <span className="text-xs text-gray-500">Nenhum associado</span>
                        )}
                    </div>
                </div>

                {ticket.status !== TicketStatus.Finished && (
                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="font-semibold text-on-surface-dark mb-2">Registar Nova Intervenção</h3>
                        <div className="space-y-4">
                            <textarea
                                value={newActivityDescription}
                                onChange={(e) => setNewActivityDescription(e.target.value)}
                                rows={3}
                                placeholder={`Descreva o trabalho realizado...`}
                                className={`w-full bg-gray-700 border text-white rounded-md p-2 text-sm ${error ? 'border-red-500' : 'border-gray-600'}`}
                            ></textarea>
                            
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700 flex flex-col sm:flex-row gap-4 items-end">
                                <div className="w-full sm:w-1/3">
                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Tipo de Ativo</label>
                                    <select 
                                        value={assetType} 
                                        onChange={(e) => setAssetType(e.target.value as any)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded p-1.5 text-xs"
                                    >
                                        <option value="none">Não Específico</option>
                                        <option value="hardware">Hardware / Equipamento</option>
                                        <option value="software">Software / Licença</option>
                                    </select>
                                </div>

                                <div className="flex-grow w-full">
                                    {assetType === 'hardware' && (
                                        <>
                                            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Equipamento Intervencionado</label>
                                            <select
                                                value={selectedEquipmentId}
                                                onChange={(e) => setSelectedEquipmentId(e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-700 text-white rounded p-1.5 text-xs"
                                            >
                                                <option value="">-- Selecione --</option>
                                                {availableEquipment.map(eq => <option key={eq.id} value={eq.id}>{eq.description} (S/N: {eq.serial_number})</option>)}
                                            </select>
                                        </>
                                    )}
                                    {assetType === 'software' && (
                                        <>
                                            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Software Intervencionado</label>
                                            <select
                                                value={selectedLicenseId}
                                                onChange={(e) => setSelectedLicenseId(e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-700 text-white rounded p-1.5 text-xs"
                                            >
                                                <option value="">-- Selecione --</option>
                                                {availableLicenses.map(lic => <option key={lic.id} value={lic.id}>{lic.product_name}</option>)}
                                            </select>
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={handleAddActivity}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary text-sm disabled:opacity-50 whitespace-nowrap"
                                >
                                    {isSaving ? <FaSpinner className="animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                                    {isSaving ? 'A Gravar...' : 'Registar Resposta'}
                                </button>
                            </div>
                            {error && <p className="text-red-400 text-xs italic">{error}</p>}
                        </div>
                    </div>
                )}
                
                <div className="space-y-4">
                    <h3 className="font-semibold text-white border-b border-gray-700 pb-2">Histórico de Respostas e Diagnósticos</h3>
                    {isLoadingActivities ? (
                         <div className="flex justify-center items-center py-8"><FaSpinner className="animate-spin text-gray-500" /></div>
                    ) : sortedActivities.length > 0 ? (
                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {sortedActivities.map(activity => {
                                const actEq = activity.equipment_id ? equipmentMap.get(activity.equipment_id) : null;
                                const actLic = activity.software_license_id ? licenseMap.get(activity.software_license_id) : null;
                                return (
                                    <div key={activity.id} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 relative overflow-hidden">
                                        {/* Barra lateral de tipo de ativo */}
                                        {actEq && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" title="Intervenção em Hardware" />}
                                        {actLic && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500" title="Intervenção em Software" />}
                                        
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold text-brand-secondary text-sm">
                                                {collaboratorMap.get(activity.technician_id) || 'Técnico'}
                                            </p>
                                            <p className="text-[10px] text-gray-500">{new Date(activity.date).toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm text-on-surface-dark">{activity.description}</p>
                                        
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {actEq && (
                                                <span className="text-[10px] flex items-center gap-1 bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                                                    <FaLaptop size={8}/> {actEq.description}
                                                </span>
                                            )}
                                            {actLic && (
                                                <span className="text-[10px] flex items-center gap-1 bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/20">
                                                    <FaKey size={8}/> {actLic.product_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Sem registos técnicos.</p>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar Janela</button>
                </div>
            </div>
        </Modal>
    );
};

export default TicketActivitiesModal;
