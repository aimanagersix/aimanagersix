
import React, { useMemo, useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Equipment, Assignment, Collaborator, Entidade, Ticket, TicketActivity, BusinessService, ServiceDependency, CriticalityLevel, SoftwareLicense, LicenseAssignment, Vulnerability, Supplier, ConfigItem } from '../types';
import { FaShieldAlt, FaExclamationTriangle, FaKey, FaBug, FaGlobe, FaPhone, FaEnvelope, FaEuroSign, FaEdit, FaPlus, FaMapMarkerAlt, FaLaptop, FaTicketAlt, FaHistory, FaTools, FaPrint, FaLandmark, FaRobot } from 'react-icons/fa';
import ManageAssignedLicensesModal from './ManageAssignedLicensesModal';
import * as dataService from '../services/dataService';
import { getSupabase } from '../services/supabaseClient';

interface EquipmentDetailModalProps {
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
    onEdit?: (equipment: Equipment) => void;
    // New Config Props
    accountingCategories?: ConfigItem[];
    conservationStates?: ConfigItem[];
    onViewItem?: (tab: string, filter: any) => void;
}

const getCriticalityClass = (level: CriticalityLevel) => {
    switch (level) {
        case CriticalityLevel.Critical: return 'text-red-400 font-bold border-red-500/50 bg-red-500/10';
        case CriticalityLevel.High: return 'text-orange-400 font-semibold border-orange-500/50 bg-orange-500/10';
        case CriticalityLevel.Medium: return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
        default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
    }
};

const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({ 
    equipment, assignments, collaborators, escolasDepartamentos: entidades, onClose, tickets, ticketActivities,
    businessServices = [], serviceDependencies = [], softwareLicenses = [], licenseAssignments = [], vulnerabilities = [], suppliers = [], onEdit,
    accountingCategories = [], conservationStates = []
}) => {
    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'licenses' | 'security'>('details');
    const [showManageLicenses, setShowManageLicenses] = useState(false);
    const [childEquipment, setChildEquipment] = useState<Equipment[]>([]);

    // Fix: fullName to full_name
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);

    // Fetch child equipment
    useEffect(() => {
        const loadData = async () => {
            const supabase = getSupabase();
            // Children
            const { data: children } = await supabase.from('equipment').select('*').eq('parent_equipment_id', equipment.id);
            if (children) setChildEquipment(children);
        };
        loadData();
    }, [equipment.id]);

    // Current Assignment
    const currentAssignment = useMemo(() => {
        // Fix: equipmentId, returnDate to equipment_id, return_date
        return assignments.find(a => a.equipment_id === equipment.id && !a.return_date);
    }, [assignments, equipment.id]);

    // History
    const equipmentAssignments = useMemo(() => {
        // Fix: equipmentId, assignedDate to equipment_id, assigned_date
        return assignments
            .filter(a => a.equipment_id === equipment.id)
            .sort((a, b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime());
    }, [assignments, equipment.id]);

    const equipmentTickets = useMemo(() => {
        // Fix: equipmentId, requestDate to equipment_id, request_date
        return tickets
            .filter(t => t.equipment_id === equipment.id)
            .sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
    }, [tickets, equipment.id]);

    // Split licenses into Active and History
    const { activeLicenses, historyLicenses } = useMemo(() => {
        // Fix: equipmentId to equipment_id
        const allAssignments = licenseAssignments.filter(la => la.equipment_id === equipment.id);
        
        // Use a Map to prevent visual duplicates of ACTIVE licenses
        const activeMap = new Map<string, { license: SoftwareLicense, assignedDate: string }>();
        const history: { license: SoftwareLicense, assignedDate: string, returnDate: string }[] = [];

        allAssignments.forEach(la => {
            // Fix: softwareLicenseId to software_license_id
            const lic = softwareLicenses.find(l => l.id === la.software_license_id);
            if (lic) {
                // Fix: returnDate to return_date
                if (!la.return_date) {
                    if (!activeMap.has(lic.id)) {
                        // Fix: assignedDate to assigned_date
                         activeMap.set(lic.id, { license: lic, assignedDate: la.assigned_date });
                    }
                } else {
                    // Fix: assignedDate, returnDate to assigned_date, return_date
                    history.push({ license: lic, assignedDate: la.assigned_date, returnDate: la.return_date });
                }
            }
        });
        
        // Fix: returnDate to return_date
        history.sort((a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime());

        return { activeLicenses: Array.from(activeMap.values()), historyLicenses: history };
    }, [licenseAssignments, softwareLicenses, equipment.id]);

    const equipmentSupplier = useMemo(() => {
        if (!equipment.supplier_id) return null;
        return suppliers.find(s => s.id === equipment.supplier_id);
    }, [equipment.supplier_id, suppliers]);

    const isPatchOutdated = useMemo(() => {
        if (!equipment.last_security_update) return false;
        const lastUpdate = new Date(equipment.last_security_update);
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return lastUpdate < ninetyDaysAgo;
    }, [equipment.last_security_update]);

    // Calculate Maintenance Costs
    const maintenanceCost = useMemo(() => {
        // Fix: acquisitionCost to acquisition_cost
        return childEquipment.reduce((sum, part) => sum + (part.acquisition_cost || 0), 0);
    }, [childEquipment]);
    
    // Total TCO
    // Fix: acquisitionCost to acquisition_cost
    const totalTCO = (equipment.acquisition_cost || 0) + maintenanceCost;

    const handleSaveLicenses = async (eqId: string, licenseIds: string[]) => {
        await dataService.syncLicenseAssignments(eqId, licenseIds);
    };

    // Standard Print Handler
    const handleStandardPrint = () => {
         const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        const content = `
            <html>
            <head><title>Ficha de Equipamento</title><style>body { font-family: sans-serif; padding: 20px; }</style></head>
            <body>
                <h1>Ficha de Equipamento</h1>
                <p><strong>Descrição:</strong> ${equipment.description}</p>
                <!-- Fix: serialNumber to serial_number -->
                <p><strong>S/N:</strong> ${equipment.serial_number}</p>
                <p><strong>Marca:</strong> ${equipment.brand_id}</p>
                <p><strong>Data:</strong> ${new Date().toLocaleDateString()}</p>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
    };

    // Lookup Names
    const accountingName = useMemo(() => {
        if (!equipment.accounting_category_id) return 'N/A';
        return accountingCategories.find(c => c.id === equipment.accounting_category_id)?.name || equipment.accounting_category_id;
    }, [equipment.accounting_category_id, accountingCategories]);

    const conservationName = useMemo(() => {
        if (!equipment.conservation_state_id) return 'N/A';
        return conservationStates.find(c => c.id === equipment.conservation_state_id)?.name || equipment.conservation_state_id;
    }, [equipment.conservation_state_id, conservationStates]);


    return (
        <Modal title={`Detalhes: ${equipment.serial_number}`} onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex flex-col h-[80vh]">
                
                {/* HEADER with Current Assignment */}
                <div className="flex-shrink-0 bg-gray-900/50 p-4 rounded-lg border border-gray-700 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">{equipment.description}</h2>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                            {/* Fix: serialNumber to serial_number */}
                            <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-600 font-mono">S/N: {equipment.serial_number}</span>
                            {/* Fix: inventoryNumber to inventory_number */}
                            {equipment.inventory_number && <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-600">Inv: {equipment.inventory_number}</span>}
                            <span className={`px-2 py-0.5 rounded font-bold ${equipment.status === 'Operacional' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}`}>{equipment.status}</span>
                        </div>
                    </div>
                    
                    {/* Location / Assignment Block */}
                    <div className="bg-black/20 p-3 rounded border border-gray-600/50 w-full md:w-auto">
                        <p className="text-xs text-gray-400 uppercase mb-1">Atribuído Atualmente a:</p>
                        {currentAssignment ? (
                            <div>
                                {/* Fix: collaboratorId to collaborator_id */}
                                {currentAssignment.collaborator_id ? (
                                    <p className="text-white font-bold flex items-center gap-2">
                                        <FaLaptop className="text-brand-secondary"/> 
                                        {/* Fix: collaboratorId to collaborator_id */}
                                        {collaboratorMap.get(currentAssignment.collaborator_id)}
                                    </p>
                                ) : (
                                    <p className="text-white font-bold flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-brand-secondary"/> 
                                        {/* Fix: entidadeId to entidade_id */}
                                        {entidadeMap.get(currentAssignment.entidade_id || '') || 'Entidade Desconhecida'}
                                    </p>
                                )}
                                {/* Fix: assignedDate to assigned_date */}
                                <p className="text-xs text-gray-500 mt-1">Desde: {currentAssignment.assigned_date}</p>
                            </div>
                        ) : (
                            <p className="text-yellow-400 font-medium flex items-center gap-2"><FaExclamationTriangle/> Em Stock (Não Atribuído)</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                             <button onClick={handleStandardPrint} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center gap-2" title="Impressão Padrão">
                                <FaPrint /> Ficha
                            </button>
                        </div>
                        
                        {onEdit && (
                            <button onClick={() => { onClose(); onEdit(equipment); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center justify-center gap-2">
                                <FaEdit /> Editar Dados
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
                </div>

                {/* CONTENT */}
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase border-b border-gray-700 pb-1">Informação Técnica</h3>
                                    <div className="text-sm space-y-2">
                                        {/* Fix: nomeNaRede, macAddressWIFI, macAddressCabo to snake_case */}
                                        <div className="flex justify-between"><span className="text-gray-500">Nome na Rede:</span> <span className="text-white">{equipment.nome_na_rede || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">MAC Address (WiFi):</span> <span className="text-white font-mono">{equipment.mac_address_wifi || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">MAC Address (Cabo):</span> <span className="text-white font-mono">{equipment.mac_address_cabo || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Sistema Operativo:</span> <span className="text-white">{equipment.os_version || '-'}</span></div>
                                         {equipment.last_inventory_scan && (
                                            <div className="flex justify-between mt-2 pt-2 border-t border-gray-700">
                                                <span className="text-brand-secondary flex items-center gap-1"><FaRobot/> Último Inventário (Agente):</span> 
                                                <span className="text-white font-bold">{equipment.last_inventory_scan}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase border-b border-gray-700 pb-1">Compra & Garantia</h3>
                                    <div className="text-sm space-y-2">
                                        {/* Fix: purchaseDate, warrantyEndDate, invoiceNumber, requisitionNumber, acquisitionCost to snake_case */}
                                        <div className="flex justify-between"><span className="text-gray-500">Data Compra:</span> <span className="text-white">{equipment.purchase_date}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Fim Garantia:</span> <span className="text-white">{equipment.warranty_end_date || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Nº Fatura:</span> <span className="text-white">{equipment.invoice_number || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Nº Requisição:</span> <span className="text-white">{equipment.requisition_number || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Custo Aquisição:</span> <span className="text-white font-bold">€ {equipment.acquisition_cost || 0}</span></div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Legal/Accounting Data */}
                            <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                 <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-gray-700 pb-2">
                                    <FaLandmark className="text-yellow-500"/> Contabilidade & Inventário Legal
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="block text-xs text-gray-500 uppercase">Classificador (CIBE)</span>
                                        <span className="font-bold text-white">{accountingName}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 uppercase">Estado de Conservação</span>
                                        <span className={`font-bold text-white`}>
                                            {conservationName}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 uppercase">Valor Residual</span>
                                        <span className="font-mono text-white">€ {equipment.residual_value || 0}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-800/30 p-4 rounded border border-gray-700">
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-gray-700 pb-2">
                                    <FaEuroSign className="text-green-400"/> FinOps: TCO & Manutenção
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    {/* Fix: acquisitionCost to snake_case */}
                                    <div className="bg-gray-900 p-3 rounded"><span className="block text-xs text-gray-500 uppercase">Compra</span><span className="text-lg font-bold text-white">€ {equipment.acquisition_cost || 0}</span></div>
                                    <div className="bg-gray-900 p-3 rounded"><span className="block text-xs text-gray-500 uppercase">Manutenção</span><span className="text-lg font-bold text-yellow-400">€ {maintenanceCost}</span></div>
                                    {/* Fix: acquisitionCost to snake_case */}
                                    <div className="bg-gray-900 p-3 rounded border border-green-900"><span className="block text-xs text-green-500 uppercase font-bold">TCO</span><span className="text-xl font-bold text-green-400">€ {totalTCO}</span></div>
                                </div>
                                
                                {childEquipment.length > 0 ? (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><FaTools/> Peças Instaladas</h4>
                                        <table className="w-full text-xs text-left"><thead className="bg-gray-900 text-gray-500 uppercase"><tr><th className="p-2">Descrição</th><th className="p-2">Data</th><th className="p-2 text-right">Custo</th></tr></thead><tbody className="divide-y divide-gray-700">{childEquipment.map(c => <tr key={c.id}><td className="p-2 text-gray-300">{c.description}</td>{/* Fix: purchaseDate, acquisitionCost to snake_case */}<td className="p-2 text-gray-400">{c.purchase_date}</td><td className="p-2 text-right font-mono text-white">€ {c.acquisition_cost || 0}</td></tr>)}</tbody></table>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 italic">Nenhum componente ou manutenção registada.</p>
                                )}
                            </div>

                            {equipmentSupplier && (
                                <div className="bg-gray-800/30 p-3 rounded border border-gray-700">
                                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><FaGlobe className="text-blue-400"/> Fornecedor</h3>
                                    <div className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="font-semibold text-white">{equipmentSupplier.name}</p>
                                            <p className="text-xs text-gray-400">{equipmentSupplier.website}</p>
                                        </div>
                                        <div className="text-right">
                                            {equipmentSupplier.contact_email && <p className="text-gray-300"><FaEnvelope className="inline mr-1"/> {equipmentSupplier.contact_email}</p>}
                                            {equipmentSupplier.contact_phone && <p className="text-gray-300"><FaPhone className="inline mr-1"/> {equipmentSupplier.contact_phone}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            <div><h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><FaHistory/> Histórico de Atribuições</h3> {equipmentAssignments.length > 0 ? <table className="w-full text-xs text-left"><thead className="bg-gray-800 text-gray-400 uppercase"><tr><th className="p-2">Quem/Onde</th><th className="p-2">Início</th><th className="p-2">Fim</th></tr></thead><tbody className="divide-y divide-gray-700">{equipmentAssignments.map(a => <tr key={a.id}>{/* Fix: collaboratorId, entidadeId, assignedDate, returnDate to snake_case */}<td className="p-2 text-white">{a.collaborator_id ? collaboratorMap.get(a.collaborator_id) : entidadeMap.get(a.entidade_id || '')}</td><td className="p-2 text-gray-300">{a.assigned_date}</td><td className="p-2 text-gray-300">{a.return_date || <span className="text-green-400">Atual</span>}</td></tr>)}</tbody></table> : <p className="text-sm text-gray-500 italic">Sem histórico.</p>}</div>
                            {/* Fix: requestDate to request_date */}
                            <div><h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><FaTicketAlt/> Histórico de Tickets</h3> {equipmentTickets.length > 0 ? <div className="space-y-2">{equipmentTickets.map(t => <div key={t.id} className="bg-gray-800 p-2 rounded border border-gray-700 text-xs"><div className="flex justify-between mb-1"><span className="text-brand-secondary font-bold">{t.request_date}</span><span className="text-gray-400">{t.status}</span></div><p className="text-white">{t.description}</p></div>)}</div> : <p className="text-sm text-gray-500 italic">Sem tickets registados.</p>}</div>
                        </div>
                    )}
                     {activeTab === 'licenses' && (
                        <div className="space-y-6">
                            <div><div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold text-white flex items-center gap-2"><FaKey className="text-yellow-500"/> Software Instalado (Ativo)</h3>{onEdit && <button onClick={() => setShowManageLicenses(true)} className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded flex items-center gap-2"><FaPlus/> Gerir</button>}</div>{activeLicenses.length > 0 ? <div className="space-y-2">{activeLicenses.map(({ license: sw, assignedDate }) => <div key={sw.id} className="bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-center"><div>{/* Fix: productName, licenseKey to snake_case */}<p className="font-bold text-white text-sm">{sw.product_name}</p><p className="text-xs text-gray-400 font-mono">{sw.license_key}</p></div><div className="text-right"><span className={`text-xs px-2 py-1 rounded block mb-1 ${sw.status === 'Ativo' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{sw.status}</span><span className="text-xs text-gray-500">Desde: {assignedDate}</span></div></div>)}</div> : <p className="text-center py-4 bg-gray-900/20 rounded border border-dashed border-gray-700 text-gray-500 text-sm">Nenhuma licença associada.</p>}</div>
                            {/* Fix: productName to snake_case */}
                            <div><h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><FaHistory/> Histórico de Software (Removido)</h3> {historyLicenses.length > 0 ? <table className="w-full text-xs text-left bg-gray-900/30 rounded border border-gray-700"><thead className="bg-gray-800 text-gray-400 uppercase"><tr><th className="p-2">Produto</th><th className="p-2">Instalação</th><th className="p-2">Remoção</th></tr></thead><tbody className="divide-y divide-gray-700">{historyLicenses.map(({ license, assignedDate, returnDate }, idx) => <tr key={idx}><td className="p-2 text-gray-300">{license.product_name}</td><td className="p-2">{assignedDate}</td><td className="p-2">{returnDate}</td></tr>)}</tbody></table> : <p className="text-sm text-gray-500 italic">Sem histórico de licenças.</p>}</div>
                        </div>
                    )}
                     {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg"><h3 className="font-bold text-white mb-3 flex items-center gap-2"><FaShieldAlt className="text-red-400"/> Postura de Segurança</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500 block mb-1">Versão do SO</span><span className="text-white bg-gray-900 px-2 py-1 rounded border border-gray-600">{equipment.os_version || 'N/A'}</span></div><div><span className="text-gray-500 block mb-1">Último Patch</span><span className={`bg-gray-900 px-2 py-1 rounded border border-gray-600 ${isPatchOutdated ? 'text-red-400 font-bold' : 'text-green-400'}`}>{equipment.last_security_update || 'N/A'}</span></div></div>{isPatchOutdated && <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-200 flex items-center gap-2"><FaExclamationTriangle/> Sistema desatualizado.</div>}</div>
                            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg"><h3 className="font-bold text-white mb-3 flex items-center gap-2"><FaBug className="text-orange-400"/> Análise de Risco (C-I-A)</h3><div className="grid grid-cols-2 gap-4 text-center"><div className="bg-gray-900 p-2 rounded border border-gray-600"><span className="block text-xs text-gray-500 uppercase">Criticidade</span><span className={`font-bold text-sm ${getCriticalityClass(equipment.criticality || CriticalityLevel.Low).split(' ')[0]}`}>{equipment.criticality || 'Baixa'}</span></div><div className="bg-gray-900 p-2 rounded border border-gray-600"><span className="block text-xs text-gray-500 uppercase">Confidencialidade</span><span className="text-white font-bold text-sm">{equipment.confidentiality || 'Baixa'}</span></div></div></div>
                        </div>
                    )}
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
                    onClose={() => { 
                        setShowManageLicenses(false);
                    }}
                    onSave={handleSaveLicenses}
                />
            )}
        </Modal>
    );
};

export default EquipmentDetailModal;
