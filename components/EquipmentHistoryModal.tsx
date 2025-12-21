import React, { useMemo, useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Equipment, Assignment, Collaborator, Entidade, Ticket, TicketActivity, BusinessService, ServiceDependency, CriticalityLevel, SoftwareLicense, LicenseAssignment, Vulnerability, Supplier, ProcurementRequest, ConfigItem } from '../types';
import { FaShieldAlt, FaExclamationTriangle, FaKey, FaBug, FaGlobe, FaPhone, FaEnvelope, FaEuroSign, FaEdit, FaPlus, FaMapMarkerAlt, FaLaptop, FaTicketAlt, FaHistory, FaTools, FaPrint, FaLandmark, FaRobot } from 'react-icons/fa';
import ManageAssignedLicensesModal from './ManageAssignedLicensesModal';
import * as dataService from '../services/dataService';
import { getSupabase } from '../services/supabaseClient';

interface EquipmentHistoryModalProps {
    equipment: Equipment; 
    assignments: Assignment[];
    collaborators: Collaborator[];
    escolasDepartamentos: Entidade[];
    onClose: () => void;
    tickets: Ticket[];
    ticketActivities: TicketActivity[];
    businessServices?: BusinessService[];
    serviceDependencies?: ServiceDependency[];
    softwareLicenses?: SoftwareLicense[];
    licenseAssignments?: LicenseAssignment[];
    vulnerabilities?: Vulnerability[];
    suppliers?: Supplier[];
    procurementRequests?: ProcurementRequest[];
    onEdit?: (equipment: Equipment) => void;
    onViewItem?: (tab: string, filter: any) => void;
    accountingCategories?: ConfigItem[];
    conservationStates?: ConfigItem[];
}

const getCriticalityClass = (level: CriticalityLevel) => {
    switch (level) {
        case CriticalityLevel.Critical: return 'text-red-400 font-bold border-red-500/50 bg-red-500/10';
        case CriticalityLevel.High: return 'text-orange-400 font-semibold border-orange-500/50 bg-orange-500/10';
        case CriticalityLevel.Medium: return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
        default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
    }
};

const EquipmentHistoryModal: React.FC<EquipmentHistoryModalProps> = ({ 
    equipment, assignments, collaborators, escolasDepartamentos: entidades, onClose, tickets, ticketActivities,
    businessServices = [], serviceDependencies = [], softwareLicenses = [], licenseAssignments = [], vulnerabilities = [], suppliers = [], onEdit, procurementRequests = [], onViewItem,
    accountingCategories = [], conservationStates = []
}) => {
    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'licenses' | 'security' | 'acquisition'>('details');
    const [showManageLicenses, setShowManageLicenses] = useState(false);
    const [childEquipment, setChildEquipment] = useState<Equipment[]>([]);
    
    // FIX: Updated property names to snake_case to match types.ts
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);

    const linkedRequest = useMemo(() => {
        if (!equipment.procurement_request_id || !procurementRequests) return null;
        return procurementRequests.find(pr => pr.id === equipment.procurement_request_id);
    }, [procurementRequests, equipment.procurement_request_id]);

    useEffect(() => {
        const fetchChildren = async () => {
            const supabase = getSupabase();
            const { data } = await supabase.from('equipment').select('*').eq('parent_equipment_id', equipment.id);
            if (data) setChildEquipment(data);
        };
        fetchChildren();
    }, [equipment.id]);

    const currentAssignment = useMemo(() => {
        // FIX: Updated property names to snake_case
        return assignments.find(a => a.equipment_id === equipment.id && !a.return_date);
    }, [assignments, equipment.id]);

    const equipmentAssignments = useMemo(() => {
        // FIX: Updated property names to snake_case
        return assignments
            .filter(a => a.equipment_id === equipment.id)
            .sort((a, b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime());
    }, [assignments, equipment.id]);

    const equipmentTickets = useMemo(() => {
        // FIX: Updated property names to snake_case
        return tickets
            .filter(t => t.equipment_id === equipment.id)
            .sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
    }, [tickets, equipment.id]);
    
    const { activeLicenses, historyLicenses } = useMemo(() => {
        // FIX: Updated property names to snake_case
        const allAssignments = licenseAssignments.filter(la => la.equipment_id === equipment.id);
        const activeMap = new Map<string, { license: SoftwareLicense, assignedDate: string }>();
        const history: { license: SoftwareLicense, assignedDate: string, returnDate: string }[] = [];

        allAssignments.forEach(la => {
            const lic = softwareLicenses.find(l => l.id === la.software_license_id);
            if (lic) {
                if (!la.return_date) {
                    if (!activeMap.has(lic.id)) activeMap.set(lic.id, { license: lic, assignedDate: la.assigned_date });
                } else {
                    history.push({ license: lic, assignedDate: la.assigned_date, returnDate: la.return_date });
                }
            }
        });
        
        history.sort((a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime());
        return { activeLicenses: Array.from(activeMap.values()), historyLicenses: history };
    }, [licenseAssignments, softwareLicenses, equipment.id]);

    const isPatchOutdated = useMemo(() => {
        if (!equipment.last_security_update) return false;
        const lastUpdate = new Date(equipment.last_security_update);
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return lastUpdate < ninetyDaysAgo;
    }, [equipment.last_security_update]);

    const maintenanceCost = useMemo(() => childEquipment.reduce((sum, part) => sum + (part.acquisition_cost || 0), 0), [childEquipment]);
    const totalTCO = (equipment.acquisition_cost || 0) + maintenanceCost;

    const accountingName = useMemo(() => {
        if (!equipment.accounting_category_id) return 'N/A';
        return accountingCategories.find(c => c.id === equipment.accounting_category_id)?.name || equipment.accounting_category_id;
    }, [equipment.accounting_category_id, accountingCategories]);

    const conservationName = useMemo(() => {
        if (!equipment.conservation_state_id) return 'N/A';
        return conservationStates.find(c => c.id === equipment.conservation_state_id)?.name || equipment.conservation_state_id;
    }, [equipment.conservation_state_id, conservationStates]);

    // FIX: Added handleSaveLicenses function
    const handleSaveLicenses = async (eqId: string, licenseIds: string[]) => {
        await dataService.syncLicenseAssignments(eqId, licenseIds);
    };

    return (
        <Modal title={`Ficha Técnica: ${equipment.serial_number}`} onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex flex-col h-[80vh]">
                <div className="flex-shrink-0 bg-gray-900/50 p-4 rounded-lg border border-gray-700 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">{equipment.description}</h2>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                            <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-600 font-mono">S/N: {equipment.serial_number}</span>
                            {equipment.inventory_number && <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-600">Inv: {equipment.inventory_number}</span>}
                            <span className={`px-2 py-0.5 rounded font-bold ${equipment.status === 'Operacional' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}`}>{equipment.status}</span>
                        </div>
                    </div>
                    
                    <div className="bg-black/20 p-3 rounded border border-gray-600/50 w-full md:w-auto">
                        <p className="text-xs text-gray-400 uppercase mb-1">Atribuído a:</p>
                        {currentAssignment ? (
                            <div>
                                {currentAssignment.collaborator_id ? (
                                    <p className="text-white font-bold flex items-center gap-2"><FaLaptop className="text-brand-secondary"/> {collaboratorMap.get(currentAssignment.collaborator_id)}</p>
                                ) : (
                                    <p className="text-white font-bold flex items-center gap-2"><FaMapMarkerAlt className="text-brand-secondary"/> {entidadeMap.get(currentAssignment.entidade_id || '') || 'Localização'}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Desde: {currentAssignment.assigned_date}</p>
                            </div>
                        ) : (
                            <p className="text-yellow-400 font-medium flex items-center gap-2"><FaExclamationTriangle/> Em Stock</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        {onEdit && (
                            <button onClick={() => { onClose(); onEdit(equipment); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-2 justify-center">
                                <FaEdit /> Editar Ativo
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex border-b border-gray-700 mb-4 flex-shrink-0">
                    <button onClick={() => setActiveTab('details')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Detalhes & FinOps</button>
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Histórico</button>
                    <button onClick={() => setActiveTab('licenses')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'licenses' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Software</button>
                    <button onClick={() => setActiveTab('security')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'security' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Segurança</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    {activeTab === 'details' && (
                       <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase border-b border-gray-700 pb-1">Técnico</h3>
                                    <div className="text-sm space-y-2">
                                        <div className="flex justify-between"><span className="text-gray-500">Nome na Rede:</span> <span className="text-white">{equipment.nome_na_rede || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">MAC (WiFi):</span> <span className="text-white font-mono">{equipment.mac_address_wifi || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">MAC (Cabo):</span> <span className="text-white font-mono">{equipment.mac_address_cabo || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">SO:</span> <span className="text-white">{equipment.os_version || '-'}</span></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase border-b border-gray-700 pb-1">Financeiro</h3>
                                    <div className="text-sm space-y-2">
                                        <div className="flex justify-between"><span className="text-gray-500">Compra:</span> <span className="text-white">{equipment.purchase_date || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Garantia:</span> <span className="text-white">{equipment.warranty_end_date || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Fatura:</span> <span className="text-white">{equipment.invoice_number || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Custo:</span> <span className="text-white font-bold">€ {equipment.acquisition_cost || 0}</span></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-gray-700 pb-2"><FaLandmark className="text-yellow-500"/> Contabilidade</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                    <div><span className="block text-xs text-gray-500 uppercase">CIBE</span><span className="font-bold text-white">{accountingName}</span></div>
                                    <div><span className="block text-xs text-gray-500 uppercase">Estado</span><span className="font-bold text-white">{conservationName}</span></div>
                                    <div><span className="block text-xs text-gray-500 uppercase">Residual</span><span className="font-mono text-white">€ {equipment.residual_value || 0}</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            <div><h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><FaHistory/> Atribuições</h3> {equipmentAssignments.length > 0 ? <table className="w-full text-xs text-left"><thead className="bg-gray-800 text-gray-400 uppercase"><tr><th className="p-2">Detentor</th><th className="p-2">Início</th><th className="p-2">Fim</th></tr></thead><tbody className="divide-y divide-gray-700">{equipmentAssignments.map(a => <tr key={a.id}><td className="p-2 text-white">{a.collaborator_id ? collaboratorMap.get(a.collaborator_id) : entidadeMap.get(a.entidade_id || '')}</td><td className="p-2 text-gray-300">{a.assigned_date}</td><td className="p-2 text-gray-300">{a.return_date || <span className="text-green-400">Atual</span>}</td></tr>)}</tbody></table> : <p className="text-sm text-gray-500 italic">Sem histórico.</p>}</div>
                        </div>
                    )}
                    
                    {activeTab === 'licenses' && (
                        <div className="space-y-6">
                            <div><div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold text-white flex items-center gap-2"><FaKey className="text-yellow-500"/> Software Ativo</h3>{onEdit && <button onClick={() => setShowManageLicenses(true)} className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded flex items-center gap-2"><FaPlus/> Gerir</button>}</div>{activeLicenses.length > 0 ? <div className="space-y-2">{activeLicenses.map(({ license: sw, assignedDate }) => <div key={sw.id} className="bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-center"><div><p className="font-bold text-white text-sm">{sw.product_name}</p><p className="text-xs text-gray-400 font-mono">{sw.license_key}</p></div><div className="text-right text-xs text-gray-500">Desde: {assignedDate}</div></div>)}</div> : <p className="text-center py-4 bg-gray-900/20 rounded border border-dashed border-gray-700 text-gray-500 text-sm">Nenhuma licença.</p>}</div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg"><h3 className="font-bold text-white mb-3 flex items-center gap-2"><FaShieldAlt className="text-red-400"/> Postura NIS2</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500 block mb-1">SO</span><span className="text-white bg-gray-900 px-2 py-1 rounded border border-gray-600">{equipment.os_version || 'N/A'}</span></div><div><span className="text-gray-500 block mb-1">Patch</span><span className={`bg-gray-900 px-2 py-1 rounded border border-gray-600 ${isPatchOutdated ? 'text-red-400 font-bold' : 'text-green-400'}`}>{equipment.last_security_update || 'N/A'}</span></div></div></div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700 mt-auto">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>

            {showManageLicenses && (
                <ManageAssignedLicensesModal equipment={equipment} allLicenses={softwareLicenses || []} allAssignments={licenseAssignments || []} onClose={() => setShowManageLicenses(false)} onSave={handleSaveLicenses} />
            )}
        </Modal>
    );
};

export default EquipmentHistoryModal;