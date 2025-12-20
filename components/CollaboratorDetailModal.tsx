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
    onAssignEquipment?: (collaboratorId: string, equipmentId: string) => Promise<void>;
    onUnassignEquipment?: (equipmentId: string) => Promise<void>;
    onConfirmOffboarding?: (collaboratorId: string, reasonId?: string) => Promise<void>;
    deactivationReasons?: ConfigItem[];
    // Drill-down handlers
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

    // Active Assets
    const activeAssignments = useMemo(() => {
        // FIX: Updated property names to snake_case
        return assignments.filter(a => a.collaborator_id === collaborator.id && !a.return_date);
    }, [assignments, collaborator.id]);

    const assignedEquipment = useMemo(() => {
        // FIX: Updated property names to snake_case
        const eqIds = new Set(activeAssignments.map(a => a.equipment_id));
        return equipment.filter(e => eqIds.has(e.id));
    }, [equipment, activeAssignments]);
    
    const activeLicenses = useMemo(() => {
        const equipmentIds = new Set(assignedEquipment.map(e => e.id));
        // FIX: Updated property names to snake_case
        const licenseIds = new Set(
            licenseAssignments
                .filter(la => la.equipment_id && equipmentIds.has(la.equipment_id) && !la.return_date)
                .map(la => la.software_license_id)
        );
        return softwareLicenses.filter(lic => licenseIds.has(lic.id));
    }, [licenseAssignments, softwareLicenses, assignedEquipment]);


    // History (Returned Assets)
    const returnedAssignments = useMemo(() => {
        // FIX: Updated property names to snake_case
        return assignments
            .filter(a => a.collaborator_id === collaborator.id && a.return_date)
            .sort((a, b) => new Date(b.return_date!).getTime() - new Date(a.return_date!).getTime());
    }, [assignments, collaborator.id]);

    const returnedEquipmentHistory = useMemo(() => {
        return returnedAssignments.map(a => {
            // FIX: Updated property names to snake_case
            const eq = equipment.find(e => e.id === a.equipment_id);
            return {
                ...eq,
                assignmentStart: a.assigned_date,
                assignmentEnd: a.return_date
            };
        });
    }, [returnedAssignments, equipment]);


    // Tickets
    const collaboratorTickets = useMemo(() => {
        // FIX: Updated property names to snake_case
        return tickets.filter(t => t.collaborator_id === collaborator.id)
            .sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
    }, [tickets, collaborator.id]);

    const handleOffboardClick = () => {
        if (onConfirmOffboarding) {
            setShowOffboardingModal(true);
        }
    };

    const handlePrint = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

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
                footerHtml = `<div class="footer"><p><strong>${inst.name}</strong> | ${[inst.address_line, inst.postal_code, inst.city].filter(Boolean).join(', ')} | NIF: ${inst.nif}</p></div>`;
            }
        }

        const equipmentRows = assignedEquipment.map(eq => `
            <tr>
                <td>${eq.description}</td>
                <td>${brandMap.get(eq.brand_id) || ''} ${equipmentTypeMap.get(eq.type_id) || ''}</td>
                <td>${eq.serial_number}</td>
                <td>${activeAssignments.find(a => a.equipment_id === eq.id)?.assigned_date}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Ficha de Colaborador - ${collaborator.full_name}</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #333; }
                    h1 { border-bottom: 2px solid #0D47A1; padding-bottom: 10px; color: #0D47A1; }
                    .section { margin-bottom: 20px; }
                    .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
                    .value { font-size: 16px; margin-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    h3 { margin-top: 0; color: #444; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    .footer { position: fixed; bottom: 10px; width: 100%; text-align: center; font-size: 9pt; color: #666; }
                </style>
            </head>
            <body>
                ${logoHtml}
                <h1>${collaborator.full_name}</h1>
                <div class="section">
                    <div class="label">Nº Mecanográfico</div>
                    <div class="value">${collaborator.numero_mecanografico}</div>
                    <div class="label">Email</div>
                    <div class="value">${collaborator.email}</div>
                    <div class="label">Telefone</div>
                    <div class="value">${collaborator.telemovel || collaborator.telefone_interno || '-'}</div>
                    <div class="label">Função</div>
                    <div class="value">${collaborator.role}</div>
                </div>
                
                ${assignedEquipment.length > 0 ? `
                <div class="section">
                    <h3>Equipamentos Atribuídos</h3>
                    <table>
                        <thead>
                            <tr><th>Descrição</th><th>Marca/Tipo</th><th>Nº Série</th><th>Data Atribuição</th></tr>
                        </thead>
                        <tbody>
                            ${equipmentRows}
                        </tbody>
                    </table>
                    <p style="font-size: 10px; margin-top: 10px;">Declaro que recebi os equipamentos acima listados em bom estado de conservação.</p>
                    <br/><br/>
                    <div style="border-top: 1px solid #000; width: 200px; text-align: center; font-size: 12px;">Assinatura do Colaborador</div>
                </div>` : '<div class="section"><p>Sem equipamentos atribuídos.</p></div>'}

                ${footerHtml}
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };
    
    return (
        <>
            <Modal title={`Detalhes de: ${collaborator.full_name}`} onClose={onClose} maxWidth="max-w-5xl">
                <div className="flex flex-col h-[75vh]">
                    {/* Header */}
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
                                {collaborator.telefone_interno && <span className="flex items-center gap-1"><FaPhone className="text-gray-500"/> Ext: {collaborator.telefone_interno}</span>}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                                <button onClick={handlePrint} className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center gap-2"><FaPrint/> Imprimir</button>
                                <button onClick={() => { onClose(); onEdit(collaborator); }} className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center gap-2"><FaEdit/> Editar</button>
                                <button onClick={() => { onClose(); onStartChat(collaborator); }} className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center gap-2"><FaComment/> Chat</button>
                            </div>
                             {onConfirmOffboarding && collaborator.status === 'Ativo' && (
                                <button onClick={handleOffboardClick} className="px-3 py-2 text-sm bg-red-800 hover:bg-red-700 text-white rounded-md flex items-center gap-2"><FaUserSlash/> Inativar (Offboarding)</button>
                             )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-700 mb-4 flex-shrink-0">
                        <button onClick={() => setActiveTab('active_assets')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'active_assets' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Ativos Atuais</button>
                        <button onClick={() => setActiveTab('history_assets')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'history_assets' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Histórico (Devolvidos)</button>
                        <button onClick={() => setActiveTab('tickets')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'tickets' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Tickets ({collaboratorTickets.length})</button>
                    </div>

                    {/* Content */}
                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        
                        {/* Active Assets Tab */}
                        {activeTab === 'active_assets' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><FaLaptop className="text-blue-400"/> Equipamentos em Posse ({assignedEquipment.length})</h3>
                                    {assignedEquipment.length > 0 ? (
                                        <div className="space-y-2">
                                            {assignedEquipment.map(eq => (
                                                <div 
                                                    key={eq.id} 
                                                    className={`bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-center transition-colors ${onViewEquipment ? 'hover:bg-gray-700 cursor-pointer group' : ''}`}
                                                    onClick={() => onViewEquipment && onViewEquipment(eq, true)} 
                                                    title={onViewEquipment ? "Clique para ver detalhes do equipamento" : ""}
                                                >
                                                    <div>
                                                        <p className="font-bold text-white flex items-center gap-2">
                                                            {eq.description}
                                                            {onViewEquipment && <FaExternalLinkAlt className="opacity-0 group-hover:opacity-100 text-brand-secondary text-xs transition-opacity" />}
                                                        </p>
                                                        {/* FIX: Updated property names to snake_case */}
                                                        <p className="text-xs text-gray-400">S/N: {eq.serial_number} | Marca: {brandMap.get(eq.brand_id)}</p>
                                                    </div>
                                                    <div className="text-right text-xs text-gray-500">
                                                        {/* FIX: Updated property names to snake_case */}
                                                        Desde: {activeAssignments.find(a => a.equipment_id === eq.id)?.assigned_date}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-center text-gray-500 py-4 bg-gray-900/30 rounded border border-dashed border-gray-700">Nenhum equipamento atribuído.</p>}
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><FaKey className="text-yellow-400"/> Software em Uso ({activeLicenses.length})</h3>
                                    {activeLicenses.length > 0 ? (
                                        <div className="space-y-2">
                                            {activeLicenses.map(lic => (
                                                <div key={lic.id} className="bg-gray-800 p-3 rounded border border-gray-700">
                                                    {/* FIX: Updated property names to snake_case */}
                                                    <p className="font-bold text-white">{lic.product_name}</p>
                                                    <p className="text-xs text-gray-400 font-mono">{lic.license_key}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-center text-gray-500 py-4 bg-gray-900/30 rounded border border-dashed border-gray-700">Nenhuma licença atribuída.</p>}
                                </div>
                            </div>
                        )}

                        {/* History Assets Tab */}
                        {activeTab === 'history_assets' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><FaHistory className="text-gray-400"/> Equipamentos Devolvidos</h3>
                                {returnedEquipmentHistory.length > 0 ? (
                                     <table className="w-full text-xs text-left bg-gray-900/30 border border-gray-700 rounded">
                                        <thead className="bg-gray-800 text-gray-400 uppercase font-medium">
                                            <tr>
                                                <th className="p-3">Equipamento</th>
                                                <th className="p-3">S/N</th>
                                                <th className="p-3">Início</th>
                                                <th className="p-3">Devolução</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {returnedEquipmentHistory.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-800/50">
                                                    <td className="p-3 text-white">{item.description || 'Equipamento Apagado'}</td>
                                                    {/* FIX: Updated property names to snake_case */}
                                                    <td className="p-3 text-gray-400">{item.serial_number}</td>
                                                    <td className="p-3 text-gray-400">{item.assignmentStart}</td>
                                                    <td className="p-3 text-gray-400">{item.assignmentEnd}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <p className="text-center text-gray-500 py-4">Sem histórico de devoluções.</p>}
                            </div>
                        )}

                        {/* Tickets Tab */}
                        {activeTab === 'tickets' && (
                             <div>
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><FaTicketAlt className="text-purple-400"/> Histórico de Suporte</h3>
                                {collaboratorTickets.length > 0 ? (
                                    <div className="space-y-2">
                                        {collaboratorTickets.map(t => (
                                            <div 
                                                key={t.id} 
                                                className={`bg-gray-800 p-3 rounded border border-gray-700 transition-colors ${onViewTicket ? 'hover:bg-gray-700 cursor-pointer group' : ''}`}
                                                onClick={() => onViewTicket && onViewTicket(t)}
                                                title={onViewTicket ? "Clique para abrir o ticket" : ""}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-white text-sm flex items-center gap-2">
                                                            {t.title}
                                                            {onViewTicket && <FaExternalLinkAlt className="opacity-0 group-hover:opacity-100 text-brand-secondary text-xs transition-opacity" />}
                                                        </p>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded border ${t.status === 'Finalizado' ? 'bg-green-900/30 text-green-300 border-green-500/30' : 'bg-blue-900/30 text-blue-300 border-blue-500/30'}`}>
                                                            {t.status}
                                                        </span>
                                                    </div>
                                                    {/* FIX: Updated property names to snake_case */}
                                                    <span className="text-xs text-gray-400">{new Date(t.request_date).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-300 mt-2 line-clamp-2">{t.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-center text-gray-500 py-4">Nenhum ticket registado.</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-gray-700 flex-shrink-0">
                        <button onClick={() => { onClose(); onShowHistory(collaborator); }} className="text-sm text-gray-400 hover:text-white flex items-center gap-2"><FaBoxOpen/> Ver Histórico Funcional (Entidades)</button>
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