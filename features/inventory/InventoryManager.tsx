
import React, { useState } from 'react';
import { 
    Equipment, Brand, EquipmentType, Collaborator, 
    SoftwareLicense, Assignment, 
    defaultTooltipConfig, ModuleKey, PermissionAction, LicenseAssignment, ConfigItem, ProcurementRequest
} from '../../types';
import * as dataService from '../../services/dataService';

// Components
import EquipmentDashboard from '../../components/EquipmentDashboard';
import { LicenseDashboard } from '../../components/LicenseDashboard';
import ProcurementDashboard from '../../components/ProcurementDashboard';

// Modals
import AddEquipmentModal from '../../components/AddEquipmentModal';
import AddEquipmentKitModal from '../../components/AddEquipmentKitModal';
import AssignEquipmentModal from '../../components/AssignEquipmentModal';
import AssignMultipleEquipmentModal from '../../components/AssignMultipleEquipmentModal';
import EquipmentHistoryModal from '../../components/EquipmentHistoryModal';
import AddLicenseModal from '../../components/AddLicenseModal';
import AddProcurementModal from '../../components/AddProcurementModal';
import ReceiveAssetsModal from '../../components/ReceiveAssetsModal';

interface InventoryManagerProps {
    activeTab: string;
    appData: any;
    checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
    refreshData: () => void;
    dashboardFilter: any;
    setDashboardFilter: (filter: any) => void;
    setReportType: (type: string) => void;
    currentUser: Collaborator | null;
    onViewItem: (tab: string, filter: any) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ 
    activeTab, appData, checkPermission, refreshData, 
    dashboardFilter, setDashboardFilter, setReportType, currentUser,
    onViewItem
}) => {
    
    // Local State for Inventory Modals
    const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
    const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
    const [showKitModal, setShowKitModal] = useState(false);
    const [kitInitialData, setKitInitialData] = useState<Partial<Equipment> | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [equipmentToAssign, setEquipmentToAssign] = useState<Equipment | null>(null);
    const [showAssignMultipleModal, setShowAssignMultipleModal] = useState(false);
    const [equipmentListToAssign, setEquipmentListToAssign] = useState<Equipment[]>([]);
    const [detailEquipment, setDetailEquipment] = useState<Equipment | null>(null);
    const [showAddLicenseModal, setShowAddLicenseModal] = useState(false);
    const [licenseToEdit, setLicenseToEdit] = useState<SoftwareLicense | null>(null);
    
    // Procurement Modals
    const [showAddProcurementModal, setShowAddProcurementModal] = useState(false);
    const [procurementToEdit, setProcurementToEdit] = useState<ProcurementRequest | null>(null);
    const [showReceiveAssetsModal, setShowReceiveAssetsModal] = useState(false);
    const [procurementToReceive, setProcurementToReceive] = useState<ProcurementRequest | null>(null);

    const userTooltipConfig = currentUser?.preferences?.tooltipConfig || defaultTooltipConfig;

    // Handlers
    const handleAssign = async (assignment: any) => {
        await dataService.addAssignment(assignment);
        refreshData();
    };

    const handleSaveEquipment = async (data: any, assignment: any, licenseIds: any) => {
        let eqId;
        if (equipmentToEdit) {
            await dataService.updateEquipment(equipmentToEdit.id, data);
            eqId = equipmentToEdit.id;
        } else {
            const res = await dataService.addEquipment(data);
            eqId = res.id;
        }
        if (assignment) await dataService.addAssignment({ ...assignment, equipmentId: eqId });
        if (licenseIds && licenseIds.length > 0) await dataService.syncLicenseAssignments(eqId, licenseIds);
        refreshData();
        setShowAddEquipmentModal(false);
    };
    
    const canApproveProcurement = checkPermission('procurement', 'delete');

    return (
        <>
            {/* --- DASHBOARDS --- */}
            {activeTab === 'equipment.inventory' && (
                <EquipmentDashboard 
                    equipment={appData.equipment} 
                    brands={appData.brands} 
                    equipmentTypes={appData.equipmentTypes}
                    brandMap={new Map(appData.brands.map((b: Brand) => [b.id, b.name]))}
                    equipmentTypeMap={new Map(appData.equipmentTypes.map((t: EquipmentType) => [t.id, t.name]))}
                    assignedEquipmentIds={new Set(appData.assignments.filter((a: Assignment) => !a.returnDate).map((a: Assignment) => a.equipmentId))}
                    assignments={appData.assignments}
                    collaborators={appData.collaborators}
                    entidades={appData.entidades}
                    instituicoes={appData.instituicoes}
                    initialFilter={dashboardFilter}
                    onClearInitialFilter={() => setDashboardFilter(null)}
                    onAssign={checkPermission('equipment', 'edit') ? (eq) => { setEquipmentToAssign(eq); setShowAssignModal(true); } : undefined}
                    onAssignMultiple={checkPermission('equipment', 'edit') ? (eqs) => { setEquipmentListToAssign(eqs); setShowAssignMultipleModal(true); } : undefined}
                    onUnassign={checkPermission('equipment', 'edit') ? async (id) => {
                        if(window.confirm("Deseja desassociar este equipamento? O estado passará para 'Stock'.")) {
                            await dataService.addAssignment({ equipmentId: id, returnDate: new Date().toISOString().split('T')[0] });
                            refreshData();
                        }
                    } : undefined}
                    onUpdateStatus={checkPermission('equipment', 'edit') ? async (id, status) => {
                        await dataService.updateEquipment(id, { status });
                        refreshData();
                    } : undefined}
                    onShowHistory={(eq) => { setDetailEquipment(eq); }} 
                    onEdit={checkPermission('equipment', 'edit') ? (eq) => { setEquipmentToEdit(eq); setShowAddEquipmentModal(true); } : undefined}
                    onCreate={checkPermission('equipment', 'create') ? () => { setEquipmentToEdit(null); setShowAddEquipmentModal(true); } : undefined}
                    onGenerateReport={checkPermission('reports', 'view') ? () => setReportType('equipment') : undefined}
                    onManageKeys={checkPermission('licensing', 'edit') ? (eq) => { setDetailEquipment(eq); } : undefined}
                    businessServices={appData.businessServices}
                    serviceDependencies={appData.serviceDependencies}
                    tickets={appData.tickets}
                    ticketActivities={appData.ticketActivities}
                    softwareLicenses={appData.softwareLicenses}
                    licenseAssignments={appData.licenseAssignments}
                    vulnerabilities={appData.vulnerabilities}
                    suppliers={appData.suppliers}
                    procurementRequests={appData.procurementRequests}
                    tooltipConfig={userTooltipConfig}
                    onViewItem={onViewItem}
                />
            )}

            {activeTab === 'licensing' && (
                <LicenseDashboard 
                    licenses={appData.softwareLicenses}
                    licenseAssignments={appData.licenseAssignments}
                    equipmentData={appData.equipment}
                    assignments={appData.assignments}
                    collaborators={appData.collaborators}
                    brandMap={new Map(appData.brands.map((b: Brand) => [b.id, b.name]))}
                    equipmentTypeMap={new Map(appData.equipmentTypes.map((t: EquipmentType) => [t.id, t.name]))}
                    onEdit={checkPermission('licensing', 'edit') ? (l) => { setLicenseToEdit(l); setShowAddLicenseModal(true); } : undefined}
                    onDelete={checkPermission('licensing', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteLicense(id); refreshData(); } } : undefined}
                    onCreate={checkPermission('licensing', 'create') ? () => { setLicenseToEdit(null); setShowAddLicenseModal(true); } : undefined}
                    onGenerateReport={() => setReportType('licensing')}
                    initialFilter={dashboardFilter}
                    onClearInitialFilter={() => setDashboardFilter(null)}
                    onToggleStatus={checkPermission('licensing', 'edit') ? async (id) => {
                        const lic = appData.softwareLicenses.find((l: SoftwareLicense) => l.id === id);
                        if (lic) await dataService.updateLicense(id, { status: lic.status === 'Ativo' ? 'Inativo' : 'Ativo' });
                        refreshData();
                    } : undefined}
                    businessServices={appData.businessServices}
                    serviceDependencies={appData.serviceDependencies}
                    softwareCategories={appData.softwareCategories}
                />
            )}
            
            {activeTab === 'equipment.procurement' && (
                <ProcurementDashboard 
                    requests={appData.procurementRequests.filter((r: any) => !dashboardFilter || (dashboardFilter.title && r.title === dashboardFilter.title))}
                    collaborators={appData.collaborators}
                    suppliers={appData.suppliers}
                    currentUser={currentUser}
                    onCreate={checkPermission('procurement', 'create') ? () => { setProcurementToEdit(null); setShowAddProcurementModal(true); } : undefined}
                    onEdit={checkPermission('procurement', 'edit') ? (req) => { setProcurementToEdit(req); setShowAddProcurementModal(true); } : undefined}
                    onReceive={checkPermission('equipment', 'create') ? (req) => { setProcurementToReceive(req); setShowReceiveAssetsModal(true); } : undefined}
                    onDelete={checkPermission('procurement', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteProcurement(id); refreshData(); } } : undefined}
                    canApprove={canApproveProcurement}
                />
            )}

            {/* --- MODALS --- */}
            {showAddEquipmentModal && (
                <AddEquipmentModal
                    onClose={() => setShowAddEquipmentModal(false)}
                    onSave={handleSaveEquipment}
                    brands={appData.brands}
                    equipmentTypes={appData.equipmentTypes}
                    equipmentToEdit={equipmentToEdit}
                    onSaveBrand={dataService.addBrand}
                    onSaveEquipmentType={dataService.addEquipmentType}
                    onOpenKitModal={(data) => { setKitInitialData(data); setShowAddEquipmentModal(false); setShowKitModal(true); }}
                    suppliers={appData.suppliers}
                    softwareLicenses={appData.softwareLicenses}
                    entidades={appData.entidades}
                    collaborators={appData.collaborators}
                    statusOptions={appData.configEquipmentStatuses}
                    licenseAssignments={appData.licenseAssignments}
                    onOpenHistory={(eq) => { setDetailEquipment(eq); }}
                    onManageLicenses={(eq) => { setDetailEquipment(eq); }} 
                    onOpenAssign={(eq) => { setEquipmentToAssign(eq); setShowAssignModal(true); }}
                />
            )}

            {showAssignModal && equipmentToAssign && (
                <AssignEquipmentModal
                    equipment={equipmentToAssign}
                    brandMap={new Map(appData.brands.map((b: Brand) => [b.id, b.name]))}
                    equipmentTypeMap={new Map(appData.equipmentTypes.map((t: EquipmentType) => [t.id, t.name]))}
                    escolasDepartamentos={appData.entidades}
                    instituicoes={appData.instituicoes}
                    collaborators={appData.collaborators}
                    onClose={() => setShowAssignModal(false)}
                    onAssign={handleAssign}
                />
            )}

            {detailEquipment && (
                 <EquipmentHistoryModal 
                    equipment={detailEquipment}
                    assignments={appData.assignments}
                    collaborators={appData.collaborators}
                    escolasDepartamentos={appData.entidades}
                    tickets={appData.tickets}
                    ticketActivities={appData.ticketActivities}
                    onClose={() => setDetailEquipment(null)}
                    onEdit={(eq) => { setDetailEquipment(null); setEquipmentToEdit(eq); setShowAddEquipmentModal(true); }}
                    businessServices={appData.businessServices}
                    serviceDependencies={appData.serviceDependencies}
                    softwareLicenses={appData.softwareLicenses}
                    licenseAssignments={appData.licenseAssignments}
                    vulnerabilities={appData.vulnerabilities}
                    suppliers={appData.suppliers}
                    procurementRequests={appData.procurementRequests}
                    onViewItem={onViewItem}
                 />
            )}

            {showKitModal && (
                <AddEquipmentKitModal
                    onClose={() => setShowKitModal(false)}
                    onSaveKit={async (items) => {
                        await dataService.addMultipleEquipment(items);
                        refreshData();
                    }}
                    brands={appData.brands}
                    equipmentTypes={appData.equipmentTypes}
                    initialData={kitInitialData}
                    onSaveEquipmentType={dataService.addEquipmentType}
                    equipment={appData.equipment}
                />
            )}

            {showAssignMultipleModal && (
                <AssignMultipleEquipmentModal
                    equipmentList={equipmentListToAssign}
                    brandMap={new Map(appData.brands.map((b: Brand) => [b.id, b.name]))}
                    equipmentTypeMap={new Map(appData.equipmentTypes.map((t: EquipmentType) => [t.id, t.name]))}
                    escolasDepartamentos={appData.entidades}
                    collaborators={appData.collaborators}
                    onClose={() => setShowAssignMultipleModal(false)}
                    onAssign={async (assignment) => {
                        for (const eq of equipmentListToAssign) {
                            await dataService.addAssignment({ ...assignment, equipmentId: eq.id });
                        }
                        refreshData();
                    }}
                />
            )}

            {showAddLicenseModal && (
                <AddLicenseModal 
                    onClose={() => setShowAddLicenseModal(false)}
                    onSave={async (lic) => {
                        if (licenseToEdit) await dataService.updateLicense(licenseToEdit.id, lic);
                        else await dataService.addLicense(lic);
                        refreshData();
                    }}
                    licenseToEdit={licenseToEdit}
                    suppliers={appData.suppliers}
                    categories={appData.softwareCategories}
                />
            )}
            
            {showAddProcurementModal && (
                <AddProcurementModal 
                    onClose={() => setShowAddProcurementModal(false)}
                    onSave={async (req) => {
                        if (procurementToEdit) await dataService.updateProcurement(procurementToEdit.id, req);
                        else await dataService.addProcurement(req);
                        refreshData();
                    }}
                    procurementToEdit={procurementToEdit}
                    currentUser={currentUser}
                    collaborators={appData.collaborators}
                    suppliers={appData.suppliers}
                    equipmentTypes={appData.equipmentTypes}
                    softwareCategories={appData.softwareCategories}
                />
            )}
            
            {showReceiveAssetsModal && procurementToReceive && (
                <ReceiveAssetsModal 
                    onClose={() => setShowReceiveAssetsModal(false)}
                    request={procurementToReceive}
                    brands={appData.brands}
                    types={appData.equipmentTypes}
                    onSave={async (assets) => {
                        await dataService.addMultipleEquipment(assets);
                        await dataService.updateProcurement(procurementToReceive.id, { status: 'Concluído' });
                        refreshData();
                    }}
                />
            )}
        </>
    );
};

export default InventoryManager;
