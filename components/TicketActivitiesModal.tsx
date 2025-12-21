
import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Ticket, TicketActivity, Collaborator, TicketStatus, Equipment, EquipmentType, Entidade, Assignment, SoftwareLicense, LicenseAssignment } from '../types';
import { PlusIcon, FaKey, FaLaptop } from './common/Icons';
import { FaSpinner } from 'react-icons/fa';
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
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);
    
    // Função de refresh local ultra-otimizada
    const fetchActivities = async () => {
        setIsLoadingActivities(true);
        try {
            const data = await dataService.getTicketActivities(ticket.id);
            setLocalActivities(data);
        } catch (e) { 
            console.error("Erro ao buscar atividades:", e);
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
            setError('A descrição é obrigatória.'); 
            return; 
        }
        
        setError('');
        setIsSaving(true);
        try {
            // 1. Gravar atividade
            await onAddActivity({ 
                description: newActivityDescription,
                equipment_id: ticket.equipment_id || undefined,
                software_license_id: ticket.software_license_id || undefined
            });

            // 2. Notificar Requerente via Chat (Sistema) - Formato Pente Fino [#ID] para links clicáveis
            if (currentUser?.id !== ticket.collaborator_id) {
                await dataService.addMessage({
                    sender_id: '00000000-0000-0000-0000-000000000000',
                    receiver_id: ticket.collaborator_id,
                    content: `🛠️ ATUALIZAÇÃO TÉCNICA: [#${ticket.id}] - Nova nota adicionada ao seu pedido pelo técnico ${currentUser?.full_name}.`,
                    timestamp: new Date().toISOString(),
                    read: false
                });
            }

            // 3. Limpar input e forçar refresh local imediato
            setNewActivityDescription('');
            await fetchActivities();
            
            // 4. Invalida cache global para garantir integridade
            dataService.invalidateLocalCache();
        } catch (e: any) { 
            console.error("Erro ao registar intervenção:", e);
            alert("Erro ao gravar: " + (e.message || "Verifique a ligação com a base de dados."));
        } finally { 
            setIsSaving(false); 
        }
    };

    const sortedActivities = useMemo(() => [...localActivities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [localActivities]);

    return (
        <Modal title={`Intervenções: #${ticket.id.substring(0,8)}`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6 mt-2">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="font-bold text-white mb-1">Resumo do Pedido:</h3>
                    <p className="text-on-surface-dark-secondary text-sm italic">"{ticket.description}"</p>
                </div>

                {ticket.status !== 'Finalizado' && ticket.status !== 'Cancelado' && (
                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="font-semibold text-on-surface-dark mb-2">Registar Nova Intervenção</h3>
                        <textarea 
                            value={newActivityDescription} 
                            onChange={(e) => setNewActivityDescription(e.target.value)} 
                            rows={3} 
                            disabled={isSaving}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-primary outline-none" 
                            placeholder="Descreva o trabalho realizado..."
                        ></textarea>
                        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                        <div className="flex justify-end mt-4">
                            <button 
                                onClick={handleAddActivity} 
                                disabled={isSaving || !newActivityDescription.trim()} 
                                className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary text-sm disabled:opacity-50 font-bold shadow-lg transition-all"
                            >
                                {isSaving ? <FaSpinner className="animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                                {isSaving ? 'A Gravar...' : 'Registar e Notificar'}
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="space-y-4">
                    <h3 className="font-semibold text-white border-b border-gray-700 pb-2 flex justify-between items-center">
                        Histórico de Intervenções
                        {isLoadingActivities && <FaSpinner className="animate-spin text-gray-500 text-xs" />}
                    </h3>
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {sortedActivities.length > 0 ? sortedActivities.map(activity => (
                            <div key={activity.id} className="p-3 bg-gray-900/30 rounded-lg border border-gray-700">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-bold text-brand-secondary text-sm">{collaboratorMap.get(activity.technician_id) || 'Sistema'}</p>
                                    <p className="text-[10px] text-gray-500 font-mono">{new Date(activity.date).toLocaleString()}</p>
                                </div>
                                <p className="text-sm text-on-surface-dark whitespace-pre-wrap">{activity.description}</p>
                            </div>
                        )) : !isLoadingActivities && <p className="text-sm text-gray-500 text-center py-4 italic border border-dashed border-gray-700 rounded-lg">Ainda não existem intervenções registadas.</p>}
                    </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">Fechar Janela</button>
                </div>
            </div>
        </Modal>
    );
};

export default TicketActivitiesModal;
