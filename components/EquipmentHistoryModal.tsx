
import React, { useMemo, useState, useEffect, Suspense } from 'react';
import Modal from './common/Modal';
import { Equipment, Assignment, Collaborator, Entidade, Ticket, TicketActivity, BusinessService, ServiceDependency, CriticalityLevel, SoftwareLicense, LicenseAssignment, Vulnerability, Supplier, ProcurementRequest, ConfigItem } from '../types';
import { FaShieldAlt, FaExclamationTriangle, FaKey, FaBug, FaGlobe, FaPhone, FaEnvelope, FaEuroSign, FaChartLine, FaEdit, FaPlus, FaMapMarkerAlt, FaServer, FaShoppingCart, FaLaptop, FaTools, FaTicketAlt, FaHistory, FaRobot, FaLandmark, FaSpinner } from 'react-icons/fa';
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
    // Config Lists for Name Resolution
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
    
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);

    const linkedRequest = useMemo(() => {
        if (!equipment.procurement_request_id || !procurementRequests) return null;
        return procurementRequests.find(pr => pr.id === equipment.procurement_request_id);
    }, [procurementRequests, equipment.procurement_request_id]);

    // Fetch child equipment
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
        return assignments.find(a => (a.equipmentId === equipment.id || (a as any).equipment_id === equipment.id) && !a.returnDate);
    }, [assignments, equipment.id]);

    // History
    const equipmentAssignments = useMemo(() => {
        return assignments
            .filter(a => (a.equipmentId === equipment.id || (a as any).equipment_id === equipment.id))
            .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    }, [assignments, equipment.id]);

    const equipmentTickets = useMemo(() => {
        return tickets
            .filter(t => t.equipmentId === equipment.id)
            .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    }, [tickets, equipment.id]);
    
    // Split licenses into Active and History
    const { activeLicenses, historyLicenses } = useMemo(() => {
        const allAssignments = licenseAssignments.filter(la => (la.equipmentId === equipment.id || (la as any).equipment_id === equipment.id));
        const activeMap = new Map<string, { license: SoftwareLicense, assignedDate: string }>();
        const history: { license: SoftwareLicense, assignedDate: string, returnDate: string }[] = [];

        allAssignments.forEach(la => {
            const licId = la.softwareLicenseId || (la as any).software_license_id;
            const lic = softwareLicenses.find(l => l.id === licId);
            if (lic) {
                if (!la.returnDate) {
                    if (!activeMap.has(lic.id)) activeMap.set(lic.id, { license: lic, assignedDate: la.assignedDate });
                } else {
                    history.push({ license: lic, assignedDate: la.assignedDate, returnDate: la.returnDate });
                }
            }
        });
        
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

    const maintenanceCost = useMemo(() => childEquipment.reduce((sum, part) => sum + (part.acquisitionCost || 0), 0), [childEquipment]);
    const totalTCO = (equipment.acquisitionCost || 0) + maintenanceCost;

    const handleSaveLicenses = async (eqId: string, licenseIds: string[]) => {
        await dataService.syncLicenseAssignments(eqId, licenseIds);
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
        <>
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
                                {currentAssignment.collaboratorId || (currentAssignment as any).collaborator_id ? (
                                    <p className="text-white font-bold flex items-center gap-2">
                                        <FaLaptop className="text-brand-secondary"/> 
                                        {collaboratorMap.get(currentAssignment.collaboratorId || (currentAssignment as any).collaborator_id)}
                                    </p>
                                ) : (
                                    <p className="text-white font-bold flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-brand-secondary"/> 
                                        {entidadeMap.get(currentAssignment.entidadeId || (currentAssignment as any).entidade_id || '') || 'Entidade Desconhecida'}
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
                            <button onClick={() => { onClose(); onEdit(equipment); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-2 justify-center">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase border-b border-gray-700 pb-1">Informação Técnica</h3>
                                    <div className="text-sm space-y-2">
                                        <div className="flex justify-between"><span className="text-gray-500">Nome na Rede:</span> <span className="text-white">{equipment.nomeNaRede || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">MAC (WiFi):</span> <span className="text-white font-mono">{equipment.macAddressWIFI || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">MAC (Cabo):</span> <span className="text-white font-mono">{equipment.macAddressCabo || '-'}</span></div>
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
                                        <div className="flex justify-between"><span className="text-gray-500">Data Compra:</span> <span className="text-white">{equipment.purchaseDate || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Fim Garantia:</span> <span className="text-white">{equipment.warrantyEndDate || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Nº Fatura:</span> <span className="text-white">{equipment.invoiceNumber || '-'}</span></div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Nº Requisição:</span> 
                                            {linkedRequest && onViewItem ? (
                                                <button onClick={() => { onClose(); onViewItem('equipment.procurement', { title: linkedRequest.title }); }} className="text-brand-secondary hover:underline font-bold flex items-center gap-1">
                                                    {equipment.requisitionNumber || 'Ver Pedido'} <FaShoppingCart className="text-xs"/>
                                                </button>
                                            ) : (
                                                <span className="text-white">{equipment.requisitionNumber || '-'}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between"><span className="text-gray-500">Custo Aquisição:</span> <span className="text-white font-bold">€ {equipment.acquisitionCost || 0}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Inserido Em:</span> <span className="text-white text-xs">{new Date(equipment.creationDate).toLocaleDateString()}</span></div>
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
                                    <div className="bg-gray-900 p-3 rounded"><span className="block text-xs text-gray-500 uppercase">Compra</span><span className="text-lg font-bold text-white">€ {equipment.acquisitionCost || 0}</span></div>
                                    <div className="bg-gray-900 p-3 rounded"><span className="block text-xs text-gray-500 uppercase">Manutenção</span><span className="text-lg font-bold text-yellow-400">€ {maintenanceCost}</span></div>
                                    <div className="bg-gray-900 p-3 rounded border border-green-900"><span className="block text-xs text-green-500 uppercase font-bold">TCO</span><span className="text-xl font-bold text-green-400">€ {totalTCO}</span></div>
                                </div>
                                
                                {childEquipment.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><FaTools/> Peças Instaladas</h4>
                                        <table className="w-full text-xs text-left"><thead className="bg-gray-900 text-gray-500 uppercase"><tr><th className="p-2">Descrição</th><th className="p-2">Data</th><th className="p-2 text-right">Custo</th></tr></thead><tbody className="divide-y divide-gray-700">{childEquipment.map(c => <tr key={c.id}><td className="p-2 text-gray-300">{c.description}</td><td className="p-2">{c.purchaseDate}</td><td className="p-2 text-right font-mono text-white">€ {c.acquisitionCost || 0}</td></tr>)}</tbody></table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            <div><h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><FaHistory/> Histórico de Atribuições</h3> {equipmentAssignments.length > 0 ? <table className="w-full text-xs text-left"><thead className="bg-gray-800 text-gray-400 uppercase"><tr><th className="p-2">Quem/Onde</th><th className="p-2">Início</th><th className="p-2">Fim</th></tr></thead><tbody className="divide-y divide-gray-700">{equipmentAssignments.map(a => <tr key={a.id}><td className="p-2 text-white">{a.collaboratorId ? collaboratorMap.get(a.collaboratorId) : entidadeMap.get(a.entidadeId || '')}</td><td className="p-2 text-gray-300">{a.assignedDate}</td><td className="p-2 text-gray-300">{a.returnDate || <span className="text-green-400">Atual</span>}</td></tr>)}</tbody></table> : <p className="text-sm text-gray-500 italic">Sem histórico.</p>}</div>
                            <div><h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><FaTicketAlt/> Histórico de Tickets</h3> {equipmentTickets.length > 0 ? <div className="space-y-2">{equipmentTickets.map(t => <div key={t.id} className="bg-gray-800 p-2 rounded border border-gray-700 text-xs"><div className="flex justify-between mb-1"><span className="text-brand-secondary font-bold">{t.requestDate}</span><span className="text-gray-400">{t.status}</span></div><p className="text-white">{t.description}</p></div>)}</div> : <p className="text-sm text-gray-500 italic">Sem tickets registados.</p>}</div>
                        </div>
                    )}
                    
                    {activeTab === 'licenses' && (
                        <div className="space-y-6">
                            <div><div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold text-white flex items-center gap-2"><FaKey className="text-yellow-500"/> Software Instalado (Ativo)</h3>{onEdit && <button onClick={() => setShowManageLicenses(true)} className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded flex items-center gap-2"><FaPlus/> Gerir</button>}</div>{activeLicenses.length > 0 ? <div className="space-y-2">{activeLicenses.map(({ license: sw, assignedDate }) => <div key={sw.id} className="bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-center"><div><p className="font-bold text-white text-sm">{sw.productName}</p><p className="text-xs text-gray-400 font-mono">{sw.licenseKey}</p></div><div className="text-right"><span className={`text-xs px-2 py-1 rounded block mb-1 ${sw.status === 'Ativo' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{sw.status}</span><span className="text-xs text-gray-500">Desde: {assignedDate}</span></div></div>)}</div> : <p className="text-center py-4 bg-gray-900/20 rounded border border-dashed border-gray-700 text-gray-500 text-sm">Nenhuma licença associada.</p>}</div>
                            <div><h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><FaHistory/> Histórico de Software (Removido)</h3> {historyLicenses.length > 0 ? <table className="w-full text-xs text-left bg-gray-900/30 rounded border border-gray-700"><thead className="bg-gray-800 text-gray-400 uppercase"><tr><th className="p-2">Produto</th><th className="p-2">Instalação</th><th className="p-2">Remoção</th></tr></thead><tbody className="divide-y divide-gray-700">{historyLicenses.map(({ license, assignedDate, returnDate }, idx) => <tr key={idx}><td className="p-2 text-gray-300">{license.productName}</td><td className="p-2">{assignedDate}</td><td className="p-2">{returnDate}</td></tr>)}</tbody></table> : <p className="text-sm text-gray-500 italic">Sem histórico de licenças.</p>}</div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg"><h3 className="font-bold text-white mb-3 flex items-center gap-2"><FaShieldAlt className="text-red-400"/> Postura de Segurança</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500 block mb-1">Versão do SO</span><span className="text-white bg-gray-900 px-2 py-1 rounded border border-gray-600">{equipment.os_version || 'N/A'}</span></div><div><span className="text-gray-500 block mb-1">Último Patch</span><span className={`bg-gray-900 px-2 py-1 rounded border border-gray-600 ${isPatchOutdated ? 'text-red-400 font-bold' : 'text-green-400'}`}>{equipment.last_security_update || 'N/A'}</span></div></div>{isPatchOutdated && <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-200 flex items-center gap-2"><FaExclamationTriangle/> Sistema desatualizado.</div>}</div>
                            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg"><h3 className="font-bold text-white mb-3 flex items-center gap-2"><FaBug className="text-orange-400"/> Análise de Risco (C-I-A)</h3><div className="grid grid-cols-2 gap-4 text-center"><div className="bg-gray-900 p-2 rounded border border-gray-600"><span className="block text-xs text-gray-500 uppercase">Criticidade</span><span className={`font-bold text-sm ${getCriticalityClass(equipment.criticality || CriticalityLevel.Low).split(' ')[0]}`}>{equipment.criticality || 'Baixa'}</span></div><div className="bg-gray-900 p-2 rounded border border-gray-600"><span className="block text-xs text-gray-500 uppercase">Confidencialidade</span><span className="text-white font-bold text-sm">{equipment.confidentiality || 'Baixa'}</span></div></div></div>
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
        </>
    );
};

export default EquipmentHistoryModal;
