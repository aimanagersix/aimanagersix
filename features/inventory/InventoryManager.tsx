import React, { useState } from 'react';
import { 
    Equipment, Brand, EquipmentType, Collaborator, 
    SoftwareLicense, Assignment, ConfigItem, 
    defaultTooltipConfig, ModuleKey, PermissionAction
} from '../../types';
import * as dataService from '../../services/dataService';

// Components
import EquipmentDashboard from '../../components/EquipmentDashboard';
import LicenseDashboard from '../../components/LicenseDashboard';

// Modals
import AddEquipmentModal from '../../components/AddEquipmentModal';
import AddEquipmentKitModal from '../../components/AddEquipmentKitModal';
import AssignEquipmentModal from '../../components/AssignEquipmentModal';
import AssignMultipleEquipmentModal from '../../components/AssignMultipleEquipmentModal';
import EquipmentDetailModal from '../../components/EquipmentDetailModal';
import AddLicenseModal from '../../components/AddLicenseModal';

interface InventoryManagerProps {
    activeTab: string;
    appData: any; // Passing the full data object for ease of access
    checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
    refreshData: () => void;
    dashboardFilter: any;
    setDashboardFilter: (filter: any) => void;
    setReportType: (type: string) => void;
    currentUser: Collaborator | null;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ 
    activeTab, appData, checkPermission, refreshData, 
    dashboardFilter, setDashboardFilter, setReportType, currentUser 
}) => {
    
    // --- Local State for Inventory Modals ---
    // This state was previously in App.tsx, now it's isolated here.
    const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
    const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
    
    const [showKitModal, setShowKitModal] = useState(false);
    const [kitInitialData, setKitInitialData] = useState<Partial<Equipment> | null>(null);
    
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [equipmentToAssign, setEquipmentToAssign] = useState<Equipment | null>(null);
    
    const [showAssignMultipleModal, setShowAssignMultipleModal] = useState(false);
    const [equipmentListToAssign, setEquipmentListToAssign] = useState<Equipment[]>([]);
    
    const [showEquipmentDetailModal, setShowEquipmentDetailModal] = useState(false);
    const [detailEquipment, setDetailEquipment] = useState<Equipment | null>(null);

    const [showAddLicenseModal, setShowAddLicenseModal] = useState(false);
    const [licenseToEdit, setLicenseToEdit] = useState<SoftwareLicense | null>(null);

    const userTooltipConfig = currentUser?.preferences?.tooltipConfig || defaultTooltipConfig;

    // --- Handlers ---

    const handleAssign = async (assignment: any) => {
        await dataService.addAssignment(assignment);
        refreshData();
    };

    const handleAssignMultiple = async (assignment: any) => {
        for (const eq of equipmentListToAssign) {
            await dataService.addAssignment({ ...assignment, equipmentId: eq.id });
        }
        refreshData();
        setShowAssignMultipleModal(false);
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
                        await dataService.addAssignment({ equipmentId: id, returnDate: new Date().toISOString().split('T')[0] });
                        refreshData();
                    } : undefined}
                    onUpdateStatus={checkPermission('equipment', 'edit') ? async (id, status) => {
                        await dataService.updateEquipment(id, { status });
                        refreshData();
                    } : undefined}
                    onShowHistory={(eq) => { setDetailEquipment(eq); setShowEquipmentDetailModal(true); }} 
                    onEdit={checkPermission('equipment', 'edit') ? (eq) => { setEquipmentToEdit(eq); setShowAddEquipmentModal(true); } : undefined}
                    onCreate={checkPermission('equipment', 'create') ? () => { setEquipmentToEdit(null); setShowAddEquipmentModal(true); } : undefined}
                    onGenerateReport={checkPermission('reports', 'view') ? () => setReportType('equipment') : undefined}
                    onManageKeys={checkPermission('licensing', 'edit') ? (eq) => { setDetailEquipment(eq); setShowEquipmentDetailModal(true); } : undefined}
                    businessServices={appData.businessServices}
                    serviceDependencies={appData.serviceDependencies}
                    tickets={appData.tickets}
                    ticketActivities={appData.ticketActivities}
                    softwareLicenses={appData.softwareLicenses}
                    licenseAssignments={appData.licenseAssignments}
                    vulnerabilities={appData.vulnerabilities}
                    suppliers={appData.suppliers}
                    tooltipConfig={userTooltipConfig}
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
                    businessServices={appData.businessServices}
                    serviceDependencies={appData.serviceDependencies}
                    softwareCategories={appData.softwareCategories}
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
                    onOpenHistory={(eq) => { setDetailEquipment(eq); setShowEquipmentDetailModal(true); }}
                    onManageLicenses={(eq) => { setDetailEquipment(eq); setShowEquipmentDetailModal(true); }} 
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

            {(showEquipmentDetailModal || detailEquipment) && (
                 <EquipmentDetailModal 
                    equipment={detailEquipment!}
                    assignments={appData.assignments}
                    collaborators={appData.collaborators}
                    escolasDepartamentos={appData.entidades}
                    tickets={appData.tickets}
                    ticketActivities={appData.ticketActivities}
                    onClose={() => { setDetailEquipment(null); setShowEquipmentDetailModal(false); }}
                    onEdit={(eq) => { setDetailEquipment(null); setShowEquipmentDetailModal(false); setEquipmentToEdit(eq); setShowAddEquipmentModal(true); }}
                    businessServices={appData.businessServices}
                    serviceDependencies={appData.serviceDependencies}
                    softwareLicenses={appData.softwareLicenses}
                    licenseAssignments={appData.licenseAssignments}
                    vulnerabilities={appData.vulnerabilities}
                    suppliers={appData.suppliers}
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
        </>
    );
};

export default InventoryManager;