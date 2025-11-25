import React, { useMemo, useState } from 'react';
import Modal from './common/Modal';
import { Equipment, Assignment, Collaborator, Entidade, Ticket, TicketActivity, BusinessService, ServiceDependency, CriticalityLevel, SoftwareLicense, LicenseAssignment, Vulnerability, Supplier } from '../types';
import { FaShieldAlt, FaExclamationTriangle, FaKey, FaBug, FaGlobe, FaPhone, FaEnvelope, FaEuroSign, FaChartLine, FaEdit, FaPlus, FaMapMarkerAlt } from 'react-icons/fa';
import ManageAssignedLicensesModal from './ManageAssignedLicensesModal';
import * as dataService from '../services/dataService';

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
    businessServices = [], serviceDependencies = [], softwareLicenses = [], licenseAssignments = [], vulnerabilities = [], suppliers = [], onEdit
}) => {
    const [showManageLicenses, setShowManageLicenses] = useState(false);

    // Memoize maps for efficient lookups
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);

    // Filter and sort the assignments for the current equipment
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

    const equipmentActivities = useMemo(() => {
        const equipmentTicketIds = new Set(equipmentTickets.map(t => t.id));
        return ticketActivities
            .filter(ta => ta.equipmentId === equipment.id || (ta.ticketId && equipmentTicketIds.has(ta.ticketId)))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [ticketActivities, equipmentTickets, equipment.id]);

    const impactedServices = useMemo(() => {
        // Find services that depend directly on this equipment
        const relevantDependencies = serviceDependencies.filter(d => d.equipment_id === equipment.id);
        const serviceIds = new Set(relevantDependencies.map(d => d.service_id));
        
        return businessServices
            .filter(s => serviceIds.has(s.id))
            .sort((a, b) => {
                const priority = { [CriticalityLevel.Critical]: 3, [CriticalityLevel.High]: 2, [CriticalityLevel.Medium]: 1, [CriticalityLevel.Low]: 0 };
                return priority[b.criticality] - priority[a.criticality];
            });
    }, [businessServices, serviceDependencies, equipment.id]);
    
    const installedSoftware = useMemo(() => {
        const assigned = licenseAssignments.filter(la => la.equipmentId === equipment.id);
        return assigned.map(la => softwareLicenses.find(l => l.id === la.softwareLicenseId)).filter(Boolean) as SoftwareLicense[];
    }, [licenseAssignments, softwareLicenses, equipment.id]);

    const potentialVulnerabilities = useMemo(() => {
        const searchText = [
            equipment.description,
            equipment.brandId, // Assuming brand names are unique enough if mapped, but let's stick to description
            ...installedSoftware.map(s => s.productName)
        ].join(' ').toLowerCase();

        return vulnerabilities.filter(v => {
            if (!v.affected_software) return false;
            const terms = v.affected_software.toLowerCase().split(',').map(t => t.trim());
            return terms.some(term => searchText.includes(term));
        });
    }, [vulnerabilities, equipment, installedSoftware]);
    
    const equipmentSupplier = useMemo(() => {
        if (!equipment.supplier_id) return null;
        return suppliers.find(s => s.id === equipment.supplier_id);
    }, [equipment.supplier_id, suppliers]);

    const getStatusText = (assignment: Assignment) => {
        return assignment.returnDate ? 'Concluída' : 'Ativa';
    };
    
    const isPatchOutdated = useMemo(() => {
        if (!equipment.last_security_update) return false;
        const lastUpdate = new Date(equipment.last_security_update);
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return lastUpdate < ninetyDaysAgo;
    }, [equipment.last_security_update]);

    // --- FinOps Calculations ---
    const finOpsData = useMemo(() => {
        const purchaseDate = equipment.purchaseDate ? new Date(equipment.purchaseDate) : new Date();
        const acquisitionCost = equipment.acquisitionCost || 0;
        const lifespanYears = equipment.expectedLifespanYears || 4;
        const ageInYears = (new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        
        // Linear Depreciation
        const annualDepreciation = acquisitionCost / lifespanYears;
        const accumulatedDepreciation = Math.min(annualDepreciation * ageInYears, acquisitionCost);
        const currentValue = Math.max(acquisitionCost - accumulatedDepreciation, 0);
        
        // TCO Components
        const softwareCost = installedSoftware.reduce((acc, lic) => acc + (lic.unitCost || 0), 0);
        // Estimate Support Cost: 40€ per hour/activity
        const supportCost = equipmentActivities.length * 40; 
        
        const tco = acquisitionCost + softwareCost + supportCost;

        return {
            currentValue,
            accumulatedDepreciation,
            tco,
            softwareCost,
            supportCost
        };
    }, [equipment, installedSoftware, equipmentActivities]);

    const handleSaveLicenses = async (eqId: string, licenseIds: string[]) => {
        // Just save, don't close or reload. The modal stays open for more additions.
        await dataService.syncLicenseAssignments(eqId, licenseIds);
    };

    return (
        <Modal title={`Histórico do Equipamento: ${equipment.serialNumber}`} onClose={onClose} maxWidth="max-w-5xl">
            <div className="space-y-6">
                 {/* Top Bar with Details and Edit Button */}
                 <div className="bg-gray-900/50 p-3 rounded-lg text-sm flex justify-between items-center border border-gray-700">
                    <div className="grid grid-cols-3 gap-x-4 text-gray-300">
                        <p><span className="font-semibold text-on-surface-dark-secondary">Nº Inventário:</span> {equipment.inventoryNumber || 'N/A'}</p>
                        <p><span className="font-semibold text-on-surface-dark-secondary">Nº Fatura:</span> {equipment.invoiceNumber || 'N/A'}</p>
                        {equipment.installationLocation && (
                            <p className="flex items-center gap-1 text-brand-secondary font-semibold">
                                <FaMapMarkerAlt /> {equipment.installationLocation}
                            </p>
                        )}
                    </div>
                    {onEdit && (
                        <button 
                            onClick={() => { onClose(); onEdit(equipment); }} 
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-lg font-semibold"
                        >
                            <FaEdit /> Editar Dados
                        </button>
                    )}
                </div>

                {/* Security & Patching Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-700 bg-gray-800/30 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2 border-b border-gray-700 pb-2">
                            <FaShieldAlt className="text-brand-secondary"/>
                            Postura de Segurança
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Versão do SO:</span>
                                <span className="text-white font-mono">{equipment.os_version || 'Não especificada'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Último Patch:</span>
                                <span className={`font-mono ${isPatchOutdated ? 'text-red-400 font-bold' : 'text-green-400'}`}>
                                    {equipment.last_security_update || 'N/A'}
                                </span>
                            </div>
                            {isPatchOutdated && (
                                <p className="text-xs text-red-400 mt-2 bg-red-900/20 p-2 rounded border border-red-500/30">
                                    <FaExclamationTriangle className="inline mr-1"/>
                                    Atenção: Sistema desatualizado há mais de 90 dias. Risco elevado.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="border border-gray-700 bg-gray-800/30 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <FaKey className="text-yellow-500"/>
                                Software Instalado
                            </h3>
                            <button 
                                onClick={() => setShowManageLicenses(true)}
                                className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-500 flex items-center gap-1"
                            >
                                <FaPlus className="h-3 w-3"/> Gerir
                            </button>
                        </div>
                        
                        {installedSoftware.length > 0 ? (
                            <ul className="space-y-1 text-sm max-h-32 overflow-y-auto">
                                {installedSoftware.map(sw => (
                                    <li key={sw.id} className="flex justify-between text-gray-300">
                                        <span>{sw.productName}</span>
                                        <span className="text-xs text-gray-500 bg-gray-900 px-1 rounded">{sw.licenseKey.substring(0, 8)}...</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Nenhuma licença associada.</p>
                        )}
                        
                        {equipment.embedded_license_key && (
                            <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
                                <span className="font-bold text-blue-300">Chave OEM (BIOS):</span> {equipment.embedded_license_key}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* FinOps Section */}
                <div className="border border-green-500/30 bg-green-900/10 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2 border-b border-green-500/30 pb-2">
                        <FaEuroSign />
                        Análise Financeira (FinOps) & TCO
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Investimento Inicial</p>
                            <p className="text-xl font-bold text-white mt-1">€ {equipment.acquisitionCost?.toFixed(2) || '0.00'}</p>
                            <p className="text-xs text-gray-500 mt-1">Compra: {equipment.purchaseDate}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Valor Atual (Depreciado)</p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-xl font-bold text-white">€ {finOpsData.currentValue.toFixed(2)}</p>
                                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">Vida útil: {equipment.expectedLifespanYears} anos</span>
                            </div>
                            <div className="w-full bg-gray-700 h-1.5 mt-2 rounded-full">
                                <div 
                                    className="bg-green-500 h-1.5 rounded-full" 
                                    style={{ width: `${(finOpsData.currentValue / (equipment.acquisitionCost || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Total Cost of Ownership (TCO)</p>
                            <p className="text-xl font-bold text-white mt-1">€ {finOpsData.tco.toFixed(2)}</p>
                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                <p>+ Licenças: € {finOpsData.softwareCost.toFixed(2)}</p>
                                <p>+ Suporte (Est.): € {finOpsData.supportCost.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Supplier Section */}
                {equipmentSupplier && (
                    <div className="border border-gray-700 bg-gray-800/30 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2 border-b border-gray-700 pb-2">
                            <FaShieldAlt className="text-blue-400"/>
                            Fornecedor & Risco
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-semibold text-white text-base">{equipmentSupplier.name}</p>
                                {equipmentSupplier.website && <p className="text-xs text-blue-300 mt-1"><FaGlobe className="inline mr-1"/> {equipmentSupplier.website}</p>}
                                <div className="mt-2 space-y-1 text-gray-400">
                                    {equipmentSupplier.contact_email && <p><FaEnvelope className="inline mr-1"/> {equipmentSupplier.contact_email}</p>}
                                    {equipmentSupplier.contact_phone && <p><FaPhone className="inline mr-1"/> {equipmentSupplier.contact_phone}</p>}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="mb-2">
                                    <span className="text-gray-400 text-xs block mb-1">Nível de Risco:</span>
                                    <span className={`px-2 py-1 text-xs rounded border ${getCriticalityClass(equipmentSupplier.risk_level)}`}>
                                        {equipmentSupplier.risk_level}
                                    </span>
                                </div>
                                {equipmentSupplier.is_iso27001_certified && (
                                    <span className="text-xs bg-green-900/30 text-green-400 border border-green-500/30 px-2 py-1 rounded">
                                        Certificado ISO 27001
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Potential Vulnerabilities (Automated Correlation) */}
                {potentialVulnerabilities.length > 0 && (
                    <div className="border border-red-500/30 bg-red-900/10 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
                            <FaBug />
                            Vulnerabilidades Potenciais (CVEs Detetados)
                        </h3>
                        <p className="text-xs text-gray-400 mb-2">Baseado na correspondência automática com o software instalado e descrição do ativo.</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {potentialVulnerabilities.map(vuln => (
                                <div key={vuln.id} className="flex justify-between items-start bg-surface-dark p-2 rounded border border-red-900/50">
                                    <div>
                                        <div className="font-bold text-white text-sm">{vuln.cve_id}</div>
                                        <div className="text-xs text-gray-400">{vuln.description.substring(0, 100)}...</div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded border whitespace-nowrap ${getCriticalityClass(vuln.severity)}`}>
                                        {vuln.severity}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Impact Analysis Section (BIA) */}
                {impactedServices.length > 0 && (
                    <div className="border border-orange-500/30 bg-orange-900/10 rounded-lg p-4">
                         <h3 className="text-lg font-bold text-orange-400 mb-2 flex items-center gap-2">
                            <FaExclamationTriangle />
                            Impacto no Negócio (Serviços Dependentes)
                        </h3>
                        <p className="text-sm text-on-surface-dark-secondary mb-3">
                            Atenção: A falha ou manutenção deste equipamento afetará os seguintes serviços:
                        </p>
                        <div className="space-y-2">
                            {impactedServices.map(service => (
                                <div key={service.id} className="flex justify-between items-center bg-surface-dark p-2 rounded border border-gray-700">
                                    <div>
                                        <p className="font-semibold text-white">{service.name}</p>
                                        <p className="text-xs text-gray-400">RTO Alvo: {service.rto_goal || 'N/A'}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded border ${getCriticalityClass(service.criticality)}`}>
                                        {service.criticality}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Histórico de Atribuições</h3>
                {equipmentAssignments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                            <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Colaborador</th>
                                    <th scope="col" className="px-6 py-3">Entidade</th>
                                    <th scope="col" className="px-6 py-3">Data de Atribuição</th>
                                    <th scope="col" className="px-6 py-3">Data de Fim</th>
                                    <th scope="col" className="px-6 py-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipmentAssignments.map(assignment => (
                                    <tr key={assignment.id} className="bg-surface-dark border-b border-gray-700">
                                        <td className="px-6 py-4 font-medium text-on-surface-dark">{assignment.collaboratorId ? collaboratorMap.get(assignment.collaboratorId) : 'Atribuído à Localização'}</td>
                                        <td className="px-6 py-4">{entidadeMap.get(assignment.entidadeId) || 'N/A'}</td>
                                        <td className="px-6 py-4">{assignment.assignedDate}</td>
                                        <td className="px-6 py-4">{assignment.returnDate || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                assignment.returnDate 
                                                ? 'bg-gray-500/30 text-gray-300' 
                                                : 'bg-green-500/30 text-green-300'
                                            }`}>
                                                {getStatusText(assignment)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center py-4 text-gray-500 text-sm">Este equipamento não tem histórico de atribuições.</p>
                )}
                
                <h3 className="text-lg font-semibold text-white pt-2 border-b border-gray-700 pb-2">Histórico de Suporte</h3>
                {equipmentTickets.length > 0 ? (
                    <div className="overflow-x-auto max-h-48">
                         <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                            <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Data Pedido</th>
                                    <th scope="col" className="px-6 py-3">Descrição</th>
                                    <th scope="col" className="px-6 py-3">Estado</th>
                                </tr>
                            </thead>
                             <tbody>
                                {equipmentTickets.map(ticket => (
                                    <tr key={ticket.id} className="bg-surface-dark border-b border-gray-700">
                                        <td className="px-6 py-4">{ticket.requestDate}</td>
                                        <td className="px-6 py-4 truncate max-w-xs">{ticket.description}</td>
                                        <td className="px-6 py-4">{ticket.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                     <p className="text-center py-4 text-gray-500 text-sm">Este equipamento não tem histórico de tickets.</p>
                )}
                {equipmentActivities.length > 0 && (
                    <div className="overflow-y-auto max-h-48 space-y-2 mt-4">
                        <p className="text-sm font-medium text-on-surface-dark-secondary p-2 bg-gray-800 rounded">Detalhe das Atividades</p>
                        {equipmentActivities.map(activity => (
                             <div key={activity.id} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-semibold text-brand-secondary text-sm">
                                        {collaboratorMap.get(activity.technicianId) || 'Técnico Desconhecido'}
                                    </p>
                                    <p className="text-xs text-on-surface-dark-secondary">
                                        {new Date(activity.date).toLocaleString()}
                                    </p>
                                </div>
                                <p className="text-sm text-on-surface-dark">{activity.description}</p>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>
            {showManageLicenses && (
                <ManageAssignedLicensesModal
                    equipment={equipment}
                    allLicenses={softwareLicenses || []}
                    allAssignments={licenseAssignments || []}
                    onClose={() => { 
                        setShowManageLicenses(false);
                        window.location.reload(); // Refresh data when closing license manager
                    }}
                    onSave={handleSaveLicenses}
                />
            )}
        </Modal>
    );
};

export default EquipmentHistoryModal;