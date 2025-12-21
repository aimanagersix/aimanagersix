
import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Ticket, TicketActivity, Collaborator, TicketStatus, Equipment, EquipmentType, Entidade, Assignment, SoftwareLicense, LicenseAssignment } from '../types';
import { PlusIcon, FaKey, FaLaptop, FaBoxOpen } from './common/Icons';
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
    const [assetType, setAssetType] = useState<'none' | 'hardware' | 'software'>('none');
    const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
    const [selectedLicenseId, setSelectedLicenseId] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);
    
    // Obter ativos do REQUERENTE do ticket para seleção rápida
    const requesterAssets = useMemo(() => {
        const userId = ticket.collaborator_id;
        if (!userId) return { equipment: [], licenses: [] };
        
        const activeAssignedEqIds = new Set(assignments.filter(a => a.collaborator_id === userId && !a.return_date).map(a => a.equipment_id));
        const userEq = equipment.filter(e => activeAssignedEqIds.has(e.id)).sort((a, b) => (a.description || '').localeCompare(b.description || ''));
        
        const activeEqIds = new Set(userEq.map(e => e.id));
        const activeLicIds = new Set(licenseAssignments.filter(la => activeEqIds.has(la.equipment_id) && !la.return_date).map(la => la.software_license_id));
        const userLic = softwareLicenses.filter(lic => activeLicIds.has(lic.id)).sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
        
        return { equipment: userEq, licenses: userLic };
    }, [ticket.collaborator_id, equipment, assignments, softwareLicenses, licenseAssignments]);

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
            // Gravar atividade com vínculo opcional
            await onAddActivity({ 
                description: newActivityDescription,
                equipment_id: assetType === 'hardware' ? selectedEquipmentId : undefined,
                software_license_id: assetType === 'software' ? selectedLicenseId : undefined
            });

            // Notificar Requerente via Chat (Sistema)
            if (currentUser?.id !== ticket.collaborator_id) {
                await dataService.addMessage({
                    sender_id: '00000000-0000-0000-0000-000000000000',
                    receiver_id: ticket.collaborator_id,
                    content: `🛠️ ATUALIZAÇÃO TÉCNICA: [#${ticket.id}] - Nova nota adicionada ao seu pedido pelo técnico ${currentUser?.full_name}.`,
                    timestamp: new Date().toISOString(),
                    read: false
                });
            }

            // Limpar inputs
            setNewActivityDescription('');
            setAssetType('none');
            setSelectedEquipmentId('');
            setSelectedLicenseId('');
            
            await fetchActivities();
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
                    <div className="border-t border-gray-700 pt-4 bg-gray-900/20 p-4 rounded-lg">
                        <h3 className="font-semibold text-on-surface-dark mb-2">Registar Nova Intervenção</h3>
                        <textarea 
                            value={newActivityDescription} 
                            onChange={(e) => setNewActivityDescription(e.target.value)} 
                            rows={3} 
                            disabled={isSaving}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-primary outline-none" 
                            placeholder="Descreva o trabalho realizado..."
                        ></textarea>
                        
                        {/* Secção de Vínculo de Ativos Migrada para Intervenção */}
                        <div className="mt-4 pt-4 border-t border-gray-700/50">
                            <label className="block text-[10px] font-black text-blue-400 uppercase mb-3 flex items-center gap-2">
                                <FaBoxOpen /> Vincular Ativo a esta Intervenção específica
                            </label>
                            <div className="flex gap-2 mb-3">
                                {['none', 'hardware', 'software'].map(t => (
                                    <button 
                                        key={t} 
                                        type="button" 
                                        onClick={() => setAssetType(t as any)} 
                                        className={`flex-1 py-1 text-[10px] rounded border transition-all ${assetType === t ? 'bg-blue-600 border-blue-400 text-white font-bold' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
                                    >
                                        {t === 'none' ? 'Nenhum' : t === 'hardware' ? 'HARDWARE' : 'SOFTWARE'}
                                    </button>
                                ))}
                            </div>
                            {assetType === 'hardware' && (
                                <select 
                                    value={selectedEquipmentId} 
                                    onChange={e => setSelectedEquipmentId(e.target.value)} 
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-xs animate-fade-in"
                                >
                                    <option value="">-- Selecione Equipamento do Requerente --</option>
                                    {requesterAssets.equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.description} (SN: {eq.serial_number})</option>)}
                                </select>
                            )}
                            {assetType === 'software' && (
                                <select 
                                    value={selectedLicenseId} 
                                    onChange={e => setSelectedLicenseId(e.target.value)} 
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-xs animate-fade-in"
                                >
                                    <option value="">-- Selecione Licença do Requerente --</option>
                                    {requesterAssets.licenses.map(lic => <option key={lic.id} value={lic.id}>{lic.product_name}</option>)}
                                </select>
                            )}
                        </div>

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
                        {sortedActivities.length > 0 ? sortedActivities.map(activity => {
                            const linkedEq = activity.equipment_id ? equipment.find(e => e.id === activity.equipment_id) : null;
                            const linkedLic = activity.software_license_id ? softwareLicenses.find(l => l.id === activity.software_license_id) : null;

                            return (
                                <div key={activity.id} className="p-3 bg-gray-900/30 rounded-lg border border-gray-700 relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-bold text-brand-secondary text-sm">{collaboratorMap.get(activity.technician_id) || 'Sistema'}</p>
                                        <p className="text-[10px] text-gray-500 font-mono">{new Date(activity.date).toLocaleString()}</p>
                                    </div>
                                    <p className="text-sm text-on-surface-dark whitespace-pre-wrap mb-2">{activity.description}</p>
                                    
                                    {(linkedEq || linkedLic) && (
                                        <div className="mt-2 pt-2 border-t border-gray-800 flex items-center gap-2">
                                            {linkedEq && (
                                                <span className="flex items-center gap-1.5 bg-blue-900/30 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                                    <FaLaptop /> {linkedEq.description}
                                                </span>
                                            )}
                                            {linkedLic && (
                                                <span className="flex items-center gap-1.5 bg-yellow-900/30 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                                    <FaKey /> {linkedLic.product_name}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        }) : !isLoadingActivities && <p className="text-sm text-gray-500 text-center py-4 italic border border-dashed border-gray-700 rounded-lg">Ainda não existem intervenções registadas.</p>}
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
