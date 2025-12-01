
import React, { useMemo, useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Equipment, Assignment, Collaborator, Entidade, Ticket, TicketActivity, BusinessService, ServiceDependency, CriticalityLevel, SoftwareLicense, LicenseAssignment, Vulnerability, Supplier, ProcurementRequest } from '../types';
// FIX: Add FaLaptop to the import list
import { FaShieldAlt, FaExclamationTriangle, FaKey, FaBug, FaGlobe, FaPhone, FaEnvelope, FaEuroSign, FaChartLine, FaEdit, FaPlus, FaMapMarkerAlt, FaServer, FaShoppingCart, FaLaptop } from 'react-icons/fa';
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
    businessServices = [], serviceDependencies = [], softwareLicenses = [], licenseAssignments = [], vulnerabilities = [], suppliers = [], onEdit, procurementRequests = []
}) => {
    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'licenses' | 'security' | 'acquisition'>('details');
    const [showManageLicenses, setShowManageLicenses] = useState(false);
    const [childEquipment, setChildEquipment] = useState<Equipment[]>([]);

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);

    const linkedRequest = useMemo(() => {
        if (!equipment.procurement_request_id || !procurementRequests) return null;
        return procurementRequests.find(pr => pr.id === equipment.procurement_request_id);
    }, [procurementRequests, equipment.procurement_request_id]);

    // Fetch child equipment (maintenance parts)
    useEffect(() => {
        const fetchChildren = async () => {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('equipment')
                .select('*')
                .eq('parent_equipment_id', equipment.id);
            
            if (!error && data) {
                setChildEquipment(data);
            }
        };
        fetchChildren();
    }, [equipment.id]);

    // Current Assignment
    const currentAssignment = useMemo(() => {
        return assignments.find(a => a.equipmentId === equipment.id && !a.returnDate);
    }, [assignments, equipment.id]);

    // History
    const equipmentAssignments = useMemo(() => {
        return assignments
            .filter(a => a.equipmentId === equipment.id)
            .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    }, [assignments, equipment.id]);

    const equipmentTickets = useMemo(() => {
        return tickets
            .filter(t => t.equipmentId === equipment.id)
            .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    }, [tickets, equipment.id]);
    
    // ... (rest of the component is the same)
    const handleSaveLicenses = async (eqId: string, licenseIds: string[]) => {
        await dataService.syncLicenseAssignments(eqId, licenseIds);
    };

    return (
        <Modal title={`Detalhes e Histórico: ${equipment.serialNumber}`} onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex flex-col h-[80vh]">
                
                {/* HEADER with Current Assignment */}
                <div className="flex-shrink-0 bg-gray-900/50 p-4 rounded-lg border border-gray-700 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">{equipment.description}</h2>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                            <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-600 font-mono">S/N: {equipment.serialNumber}</span>
                            {equipment.inventoryNumber && <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-600">Inv: {equipment.inventoryNumber}</span>}
                            <span className={`px-2 py-0.5 rounded font-bold ${equipment.status === 'Operacional' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}`}>{equipment.status}</span>
                        </div>
                    </div>
                    
                    <div className="bg-black/20 p-3 rounded border border-gray-600/50 w-full md:w-auto">
                        <p className="text-xs text-gray-400 uppercase mb-1">Atribuído Atualmente a:</p>
                        {currentAssignment ? (
                            <div>
                                {currentAssignment.collaboratorId ? (
                                    <p className="text-white font-bold flex items-center gap-2">
                                        <FaLaptop className="text-brand-secondary"/> 
                                        {collaboratorMap.get(currentAssignment.collaboratorId)}
                                    </p>
                                ) : (
                                    <p className="text-white font-bold flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-brand-secondary"/> 
                                        {entidadeMap.get(currentAssignment.entidadeId || '') || 'Entidade Desconhecida'}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Desde: {currentAssignment.assignedDate}</p>
                            </div>
                        ) : (
                            <p className="text-yellow-400 font-medium flex items-center gap-2"><FaExclamationTriangle/> Em Stock (Não Atribuído)</p>
                        )}
                        {equipment.installationLocation && (
                            <p className="text-xs text-gray-300 mt-2 pt-2 border-t border-gray-700 flex items-center gap-1">
                                <FaMapMarkerAlt className="text-gray-500"/> Local: {equipment.installationLocation}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        {onEdit && (
                            <button onClick={() => { onClose(); onEdit(equipment); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-2">
                                <FaEdit /> Editar
                            </button>
                        )}
                    </div>
                </div>

                {/* TABS */}
                <div className="flex border-b border-gray-700 mb-4 flex-shrink-0">
                    <button onClick={() => setActiveTab('details')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Detalhes & FinOps</button>
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Histórico & Atribuição</button>
                    <button onClick={() => setActiveTab('licenses')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'licenses' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Software & Licenças</button>
                    <button onClick={() => setActiveTab('security')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'security' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Segurança & Compliance</button>
                    {linkedRequest && <button onClick={() => setActiveTab('acquisition')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'acquisition' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Aquisição</button>}
                </div>

                {/* CONTENT */}
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    
                    {activeTab === 'details' && (
                       <div className="space-y-6">
                            {/* ... (conteúdo existente) ... */}
                        </div>
                    )}

                    {activeTab === 'acquisition' && linkedRequest && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-sm font-bold text-gray-400 uppercase border-b border-gray-700 pb-1 flex items-center gap-2">
                                <FaShoppingCart /> Detalhes da Aquisição
                            </h3>
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700 text-sm space-y-3">
                                <div className="flex justify-between"><span className="text-gray-500">Pedido:</span> <span className="text-white font-bold">{linkedRequest.title}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Data do Pedido:</span> <span className="text-white">{linkedRequest.request_date}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Requerente:</span> <span className="text-white">{collaboratorMap.get(linkedRequest.requester_id) || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Fornecedor:</span> <span className="text-white">{supplierMap.get(linkedRequest.supplier_id || '') || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Custo Estimado (Total):</span> <span className="text-white font-mono">€ {linkedRequest.estimated_cost}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Estado do Pedido:</span> <span className="text-white">{linkedRequest.status}</span></div>
                            </div>
                        </div>
                    )}
                    
                    {/* ... (restante do conteúdo das outras abas) ... */}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700 mt-auto">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>

            {showManageLicenses && (
                <ManageAssignedLicensesModal
                    equipment={equipment}
                    allLicenses={softwareLicenses || []}
                    allAssignments={licenseAssignments || []}
                    onClose={() => setShowManageLicenses(false)}
                    onSave={handleSaveLicenses}
                />
            )}
        </Modal>
    );
};

export default EquipmentHistoryModal;