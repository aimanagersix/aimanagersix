
import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Ticket, TicketActivity, Collaborator, TicketStatus, Equipment, EquipmentType, Entidade, Assignment } from '../types';
import { PlusIcon, FaPrint } from './common/Icons';
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
    onAddActivity: (activity: { description: string, equipmentId?: string }) => Promise<void>;
    assignments: Assignment[];
}

const TicketActivitiesModal: React.FC<TicketActivitiesModalProps> = ({ ticket, activities, collaborators, currentUser, equipment, equipmentTypes, entidades, onClose, onAddActivity, assignments }) => {
    // Local state for activities to ensure immediate updates without full app refresh dependence
    const [localActivities, setLocalActivities] = useState<TicketActivity[]>([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);

    const [newActivityDescription, setNewActivityDescription] = useState('');
    const [selectedEquipmentId, setSelectedEquipmentId] = useState(ticket.equipmentId || '');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const equipmentMap = useMemo(() => new Map(equipment.map(e => [e.id, e])), [equipment]);
    
    const availableEquipment = useMemo(() => {
        const entity = entidades.find(e => e.id === ticket.entidadeId);
        if (!entity) return [];
        return equipment.filter(e => {
            const currentAssignment = assignments.find(a => a.equipmentId === e.id && !a.returnDate);
            return currentAssignment && (
                currentAssignment.collaboratorId === ticket.collaboratorId ||
                currentAssignment.entidadeId === ticket.entidadeId
            );
        });
    }, [equipment, assignments, ticket.entidadeId, ticket.collaboratorId, entidades]);

    // Fetch activities on mount and update local state
    const fetchActivities = async () => {
        setIsLoadingActivities(true);
        try {
            const data = await dataService.getTicketActivities(ticket.id);
            setLocalActivities(data);
        } catch (e) {
            console.error("Failed to load activities", e);
            // Fallback to props if fetch fails
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
                equipmentId: selectedEquipmentId || undefined,
            });
            setNewActivityDescription('');
            // Immediately reload activities to show the new one
            await fetchActivities();
        } catch (e) {
            console.error("Erro ao adicionar atividade:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const requesterName = collaboratorMap.get(ticket.collaboratorId) || 'Desconhecido';
    const associatedEquipment = ticket.equipmentId ? equipmentMap.get(ticket.equipmentId) : null;
    const entidadeName = entidades.find(e => e.id === ticket.entidadeId)?.name || 'Entidade Desconhecida';
    
    // Use localActivities instead of props
    const sortedActivities = useMemo(() => {
        return [...localActivities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [localActivities]);

    const handlePrint = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Por favor, permita pop-ups para imprimir.");
            return;
        }

        const [logoBase64, sizeStr, align, footerId] = await Promise.all([
            dataService.getGlobalSetting('app_logo_base64'),
            dataService.getGlobalSetting('app_logo_size'),
            dataService.getGlobalSetting('app_logo_alignment'),
            dataService.getGlobalSetting('report_footer_institution_id')
        ]);
        const logoSize = sizeStr ? parseInt(sizeStr) : 80;

        const logoHtml = logoBase64 ? `<div style="display: flex; justify-content: ${align || 'center'}; margin-bottom: 20px;"><img src="${logoBase64}" alt="Logótipo" style="max-height: ${logoSize}px;" /></div>` : '';

        let footerHtml = '';
        if (footerId) {
            const allData = await dataService.fetchAllData();
            const inst = allData.instituicoes.find((i: any) => i.id === footerId);
            if (inst) {
                footerHtml = `
                    <div class="footer">
                        <p><strong>${inst.name}</strong></p>
                        <p>${[inst.address_line, inst.postal_code, inst.city].filter(Boolean).join(', ')}</p>
                        <p>Tel: ${inst.telefone} | Email: ${inst.email} | NIF: ${inst.nif}</p>
                    </div>
                `;
            }
        }


        const activitiesHtml = sortedActivities.map(act => `
            <div class="activity-item">
                <div class="activity-header">
                    <span class="technician">${collaboratorMap.get(act.technicianId) || 'Técnico'}</span>
                    <span class="date">${new Date(act.date).toLocaleString()}</span>
                </div>
                <div class="description">${act.description}</div>
                ${act.equipmentId ? `<div class="equipment-ref">Equipamento: ${equipmentMap.get(act.equipmentId)?.description} (${equipmentMap.get(act.equipmentId)?.serialNumber})</div>` : ''}
            </div>
        `).join('');

        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ficha de Ticket #${ticket.id.substring(0, 8)}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
                    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; font-size: 24px; }
                    .header-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background-color: #f9f9f9; pading: 20px; border-radius: 8px; border: 1px solid #ddd; padding: 15px;}
                    .info-group { margin-bottom: 10px; }
                    .label { font-weight: bold; color: #555; display: block; font-size: 12px; text-transform: uppercase; }
                    .value { font-size: 16px; }
                    .section-title { font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    .description-box { padding: 15px; background-color: #fff; border: 1px solid #ccc; border-radius: 4px; min-height: 80px; white-space: pre-wrap; }
                    .activity-item { border-left: 3px solid #0D47A1; padding-left: 15px; margin-bottom: 20px; }
                    .activity-header { font-size: 12px; color: #777; margin-bottom: 5px; }
                    .technician { font-weight: bold; color: #0D47A1; margin-right: 10px; }
                    .equipment-ref { font-size: 12px; color: #666; font-style: italic; margin-top: 5px; }
                    .footer { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; text-align: center; color: #777; }
                    .footer p { margin: 2px 0; }
                    .signature-box { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
                    .signature-line { border-top: 1px solid #333; padding-top: 5px; text-align: center; font-size: 14px; }
                    
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                ${logoHtml}
                <h1>Ficha de Intervenção Técnica</h1>
                
                <div class="header-info">
                    <div>
                        <div class="info-group">
                            <span class="label">Ticket ID</span>
                            <span class="value">#${ticket.id.substring(0, 8)}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Data do Pedido</span>
                            <span class="value">${new Date(ticket.requestDate).toLocaleString()}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Estado Atual</span>
                            <span class="value">${ticket.status}</span>
                        </div>
                    </div>
                    <div>
                        <div class="info-group">
                            <span class="label">Requerente</span>
                            <span class="value">${requesterName}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Entidade</span>
                            <span class="value">${entidadeName}</span>
                        </div>
                        ${associatedEquipment ? `
                        <div class="info-group">
                            <span class="label">Equipamento</span>
                            <span class="value">${associatedEquipment.description} (${associatedEquipment.serialNumber})</span>
                        </div>` : ''}
                    </div>
                </div>

                <div class="section-title">Descrição do Problema</div>
                <div class="description-box">${ticket.description}</div>

                ${sortedActivities.length > 0 ? `
                    <div class="section-title">Registo de Intervenções</div>
                    <div>${activitiesHtml}</div>
                ` : ''}

                <div class="signature-box">
                    <div>
                        <br><br><br>
                        <div class="signature-line">Assinatura do Técnico</div>
                    </div>
                    <div>
                        <br><br><br>
                        <div class="signature-line">Assinatura do Requerente (Confirmação)</div>
                    </div>
                </div>

                ${footerHtml}
                
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
    };

    return (
        <Modal title={`Atividades do Ticket - ${requesterName}`} onClose={onClose}>
            <div className="absolute top-5 right-16 no-print">
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                    title="Imprimir Ficha de Obra"
                >
                    <FaPrint /> Imprimir Ficha
                </button>
            </div>

            <div className="space-y-6 mt-2">
                <div>
                    <h3 className="font-semibold text-on-surface-dark mb-1">Descrição do Pedido:</h3>
                    <p className="p-3 bg-gray-900/50 rounded-md text-on-surface-dark-secondary text-sm">{ticket.description}</p>
                </div>

                {associatedEquipment && (
                     <div>
                        <h3 className="font-semibold text-on-surface-dark mb-1">Equipamento Intervencionado:</h3>
                        <p className="p-3 bg-gray-900/50 rounded-md text-on-surface-dark-secondary text-sm">
                            {associatedEquipment.description} (S/N: {associatedEquipment.serialNumber})
                        </p>
                    </div>
                )}

                {ticket.attachments && ticket.attachments.length > 0 && (
                     <div>
                        <h3 className="font-semibold text-on-surface-dark mb-2">Anexos:</h3>
                        <div className="space-y-2">
                            {ticket.attachments.map((att, index) => (
                                <a
                                    key={index}
                                    href={att.dataUrl}
                                    download={att.name}
                                    className="flex items-center gap-3 p-2 bg-surface-dark rounded-md border border-gray-700 hover:bg-gray-800/50 transition-colors"
                                >
                                    <FaDownload className="text-brand-secondary h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm text-on-surface-dark-secondary truncate">{att.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                
                {ticket.status !== TicketStatus.Finished && (
                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="font-semibold text-on-surface-dark mb-2">Registar Nova Intervenção</h3>
                        <div className="space-y-4">
                            <textarea
                                value={newActivityDescription}
                                onChange={(e) => setNewActivityDescription(e.target.value)}
                                rows={3}
                                placeholder={`Descreva o trabalho realizado por ${currentUser?.fullName}...`}
                                className={`w-full bg-gray-700 border text-white rounded-md p-2 text-sm ${error ? 'border-red-500' : 'border-gray-600'}`}
                            ></textarea>
                            {availableEquipment.length > 0 && (
                                <div>
                                    <label htmlFor="equipmentId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Equipamento Intervencionado (Opcional)</label>
                                    <select
                                        id="equipmentId"
                                        value={selectedEquipmentId}
                                        onChange={(e) => setSelectedEquipmentId(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                                    >
                                        <option value="">Nenhum específico</option>
                                        {availableEquipment.map(eq => (
                                            <option key={eq.id} value={eq.id}>{eq.description} (S/N: {eq.serialNumber})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {error && <p className="text-red-400 text-xs italic">{error}</p>}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleAddActivity}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary text-sm disabled:opacity-50"
                                >
                                    {isSaving ? <FaSpinner className="animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                                    {isSaving ? 'A Gravar...' : 'Adicionar Registo'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <div>
                    <h3 className="font-semibold text-on-surface-dark mb-2">Histórico de Intervenções</h3>
                    {isLoadingActivities ? (
                         <div className="flex justify-center items-center py-8">
                             <FaSpinner className="animate-spin text-gray-500" />
                         </div>
                    ) : sortedActivities.length > 0 ? (
                        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                            {sortedActivities.map(activity => {
                                const activityEquipment = activity.equipmentId ? equipmentMap.get(activity.equipmentId) : null;
                                return (
                                <div key={activity.id} className="p-3 bg-surface-dark rounded-lg border border-gray-700">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-semibold text-brand-secondary text-sm">
                                            {collaboratorMap.get(activity.technicianId) || 'Técnico Desconhecido'}
                                        </p>
                                        <p className="text-xs text-on-surface-dark-secondary">
                                            {new Date(activity.date).toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="text-sm text-on-surface-dark">{activity.description}</p>
                                    {activityEquipment && (
                                        <p className="text-xs text-indigo-400 mt-2 border-t border-gray-700/50 pt-2">
                                            <strong>Equipamento:</strong> {activityEquipment.description} (S/N: {activityEquipment.serialNumber})
                                        </p>
                                    )}
                                </div>
                            )})}
                        </div>
                    ) : (
                        <p className="text-sm text-on-surface-dark-secondary text-center py-4">Ainda não foram registadas intervenções para este ticket.</p>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default TicketActivitiesModal;
