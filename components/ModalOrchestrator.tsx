
import React from 'react';
import { 
    Collaborator, Equipment, Ticket, Policy, SoftwareLicense, SecurityTrainingRecord, 
    Brand, EquipmentType, Entidade, ModuleKey, PermissionAction, Assignment, LicenseAssignment, TicketActivity 
} from '../types';
import Modal from './common/Modal';
import EquipmentHistoryModal from './EquipmentHistoryModal';
import EquipmentSimpleModal from './EquipmentSimpleModal';
import TicketActivitiesModal from './TicketActivitiesModal';
import * as dataService from '../services/dataService';

interface ModalOrchestratorProps {
    currentUser: Collaborator;
    appData: any;
    checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
    refreshSupport: () => void;
    
    // State for Modals
    viewingTicket: Ticket | null;
    setViewingTicket: (t: Ticket | null) => void;
    viewingEquipment: Equipment | null;
    setViewingEquipment: (e: Equipment | null) => void;
    readingPolicy: Policy | null;
    setReadingPolicy: (p: Policy | null) => void;
    viewingLicense: SoftwareLicense | null;
    setViewingLicense: (l: SoftwareLicense | null) => void;
    viewingTraining: SecurityTrainingRecord | null;
    setViewingTraining: (t: SecurityTrainingRecord | null) => void;
    
    // Navigation triggers
    setActiveTab: (tab: string) => void;
    setDashboardFilter: (filter: any) => void;
}

const ModalOrchestrator: React.FC<ModalOrchestratorProps> = ({ 
    currentUser, appData, checkPermission, refreshSupport,
    viewingTicket, setViewingTicket, viewingEquipment, setViewingEquipment, 
    readingPolicy, setReadingPolicy, viewingLicense, setViewingLicense, 
    viewingTraining, setViewingTraining, setActiveTab, setDashboardFilter
}) => {
    
    if (viewingEquipment) {
        return checkPermission('equipment_view_full', 'view') ? (
            <EquipmentHistoryModal 
                equipment={viewingEquipment} assignments={appData.assignments} collaborators={appData.collaborators}
                escolasDepartamentos={appData.entidades} tickets={appData.tickets} ticketActivities={appData.ticketActivities}
                onClose={() => setViewingEquipment(null)} onViewItem={(t,f) => { setActiveTab(t); setDashboardFilter(f); }}
                businessServices={appData.businessServices} serviceDependencies={appData.serviceDependencies}
                softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments}
                vulnerabilities={appData.vulnerabilities} suppliers={appData.suppliers}
                accountingCategories={appData.configAccountingCategories} conservationStates={appData.configConservationStates}
                onEdit={checkPermission('equipment', 'edit') ? (eq) => { setViewingEquipment(null); setActiveTab('equipment.inventory'); setDashboardFilter({serialNumber: eq.serialNumber}); } : undefined}
            />
        ) : (
            <EquipmentSimpleModal
                equipment={viewingEquipment}
                assignment={appData.assignments.find((a: Assignment) => a.equipmentId === viewingEquipment.id && !a.returnDate)}
                brand={appData.brands.find((b: Brand) => b.id === viewingEquipment.brandId)}
                type={appData.equipmentTypes.find((t: EquipmentType) => t.id === viewingEquipment.typeId)}
                onClose={() => setViewingEquipment(null)}
            />
        );
    }

    if (viewingTicket) {
        return (
            <TicketActivitiesModal
                ticket={viewingTicket}
                activities={appData.ticketActivities}
                collaborators={appData.collaborators}
                currentUser={currentUser}
                equipment={appData.equipment}
                equipmentTypes={appData.equipmentTypes}
                entidades={appData.entidades}
                onClose={() => setViewingTicket(null)}
                onAddActivity={async (act) => {
                    await dataService.addTicketActivity({ ...act, ticketId: viewingTicket.id, technicianId: currentUser.id, date: new Date().toISOString() });
                    refreshSupport();
                }}
                assignments={appData.assignments}
            />
        );
    }

    if (viewingLicense) {
        return (
            <Modal title="Consulta de Licença" onClose={() => setViewingLicense(null)}>
                <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-2">{viewingLicense.productName}</h3>
                        <p className="text-sm text-gray-400 font-mono tracking-wider bg-black/30 p-2 rounded">{viewingLicense.licenseKey}</p>
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                            <div><span className="text-gray-500">Estado:</span> <span className="text-green-400 font-bold">{viewingLicense.status}</span></div>
                            <div><span className="text-gray-500">Expira em:</span> <span className="text-white">{viewingLicense.expiryDate || 'Vitalícia'}</span></div>
                            <div><span className="text-gray-500">Tipo:</span> <span className="text-white">{viewingLicense.is_oem ? 'OEM / Volume' : 'Retail'}</span></div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4"><button onClick={() => setViewingLicense(null)} className="bg-gray-600 text-white px-6 py-2 rounded">Fechar</button></div>
                </div>
            </Modal>
        );
    }

    if (viewingTraining) {
        return (
            <Modal title="Consulta de Formação" onClose={() => setViewingTraining(null)}>
                <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-2">{viewingTraining.training_type}</h3>
                        <p className="text-sm text-gray-300">{viewingTraining.notes || 'Sem observações registadas.'}</p>
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                            <div><span className="text-gray-500">Concluído em:</span> <span className="text-white">{new Date(viewingTraining.completion_date).toLocaleDateString()}</span></div>
                            <div><span className="text-gray-500">Pontuação:</span> <span className="text-green-400 font-bold">{viewingTraining.score}%</span></div>
                            <div><span className="text-gray-500">Duração:</span> <span className="text-white">{viewingTraining.duration_hours} Hora(s)</span></div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4"><button onClick={() => setViewingTraining(null)} className="bg-gray-600 text-white px-6 py-2 rounded">Fechar</button></div>
                </div>
            </Modal>
        );
    }

    if (readingPolicy) {
        return (
            <Modal title={`Consulta de Política: ${readingPolicy.title}`} onClose={() => setReadingPolicy(null)} maxWidth="max-w-4xl">
                 <div className="space-y-4">
                    <div className="bg-white text-black p-6 rounded shadow-inner min-h-[300px] overflow-y-auto whitespace-pre-wrap font-serif">
                        {readingPolicy.content}
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Versão: {readingPolicy.version}</span>
                        <span>Atualizada em: {new Date(readingPolicy.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-end pt-4"><button onClick={() => setReadingPolicy(null)} className="bg-gray-600 text-white px-6 py-2 rounded">Fechar</button></div>
                </div>
            </Modal>
        );
    }

    return null;
};

export default ModalOrchestrator;
