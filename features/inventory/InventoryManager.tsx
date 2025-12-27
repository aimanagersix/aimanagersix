import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Equipment, Brand, EquipmentType, Collaborator, SoftwareLicense, Assignment, defaultTooltipConfig, ModuleKey, PermissionAction, LicenseAssignment, ConfigItem, ProcurementRequest, EquipmentStatus } from '../../types';
import * as dataService from '../../services/dataService';
import EquipmentDashboard from '../../components/EquipmentDashboard';
import { LicenseDashboard } from '../../components/LicenseDashboard';
import ProcurementDashboard from '../../components/ProcurementDashboard';
import AddEquipmentModal from '../../components/AddEquipmentModal';
import AddEquipmentKitModal from '../../components/AddEquipmentKitModal';
import AssignEquipmentModal from '../../components/AssignEquipmentModal';
import AssignMultipleEquipmentModal from '../../components/AssignMultipleEquipmentModal';
import EquipmentHistoryModal from '../../components/EquipmentHistoryModal';
import AddLicenseModal from '../../components/AddLicenseModal';
import AddProcurementModal from '../../components/AddProcurementModal';
import ProcurementDetailModal from '../../components/ProcurementDetailModal';
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

const InventoryManager: React.FC<InventoryManagerProps> = ({ activeTab, appData, checkPermission, refreshData: refreshGlobalData, dashboardFilter, setDashboardFilter, setReportType, currentUser, onViewItem }) => {
    const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
    const [totalEquipment, setTotalEquipment] = useState(0);
    const [equipmentLoading, setEquipmentLoading] = useState(false);
    const [equipmentPage, setEquipmentPage] = useState(1);
    const [equipmentPageSize, setEquipmentPageSize] = useState(20);
    const [equipmentSort, setEquipmentSort] = useState<{ key: string, direction: 'ascending' | 'descending' }>({ key: 'creation_date', direction: 'descending' });
    
    const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
    const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
    const [importData, setImportData] = useState<Partial<Equipment> | null>(null);
    
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [equipmentToAssign, setEquipmentToAssign] = useState<Equipment | null>(null);
    const [detailEquipment, setDetailEquipment] = useState<Equipment | null>(null);
    const [showAddLicenseModal, setShowAddLicenseModal] = useState(false);
    const [licenseToEdit, setLicenseToEdit] = useState<SoftwareLicense | null>(null);
    
    const [showAddProcurementModal, setShowAddProcurementModal] = useState(false);
    const [showProcurementDetailModal, setShowProcurementDetailModal] = useState(false);
    const [procurementToEdit, setProcurementToEdit] = useState<ProcurementRequest | null>(null);
    const [detailProcurement, setDetailProcurement] = useState<ProcurementRequest | null>(null);

    const [showReceiveAssetsModal, setShowReceiveAssetsModal] = useState(false);
    const [procurementToReceive, setProcurementToReceive] = useState<ProcurementRequest | null>(null);

    const userTooltipConfig = currentUser?.preferences?.tooltip_config || defaultTooltipConfig;

    const fetchEquipment = useCallback(async () => {
        if (!currentUser) return;
        setEquipmentLoading(true);
        try {
            const isAdmin = checkPermission('equipment', 'view');
            const { data, total } = await dataService.fetchEquipmentPaginated({ page: equipmentPage, pageSize: equipmentPageSize, filters: dashboardFilter || {}, sort: equipmentSort, userId: currentUser.id, isAdmin: isAdmin });
            setEquipmentData(data);
            setTotalEquipment(total);
        } catch (error) { console.error(error); }
        finally { setEquipmentLoading(false); }
    }, [equipmentPage, equipmentPageSize, dashboardFilter, equipmentSort, currentUser, checkPermission]);

    useEffect(() => { if (activeTab === 'equipment.inventory') fetchEquipment(); }, [activeTab, equipmentPage, equipmentPageSize, equipmentSort, dashboardFilter, fetchEquipment]);

    const handleSaveEquipment = async (data: any, assignment: any, licenseIds: any) => {
        let eqId;
        if (equipmentToEdit) { await dataService.updateEquipment(equipmentToEdit.id, data); eqId = equipmentToEdit.id; }
        else { const res = await dataService.addEquipment(data); eqId = res.id; }
        if (assignment) await dataService.addAssignment({ ...assignment, equipment_id: eqId });
        if (licenseIds && licenseIds.length > 0) await dataService.syncLicenseAssignments(eqId, licenseIds);
        fetchEquipment(); refreshGlobalData(); setShowAddEquipmentModal(false);
        setImportData(null);
    };

    const handleImportAgent = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const normalized: Partial<Equipment> = {
                    serial_number: json.serialNumber || json.serial_number,
                    description: json.description,
                    nome_na_rede: json.nomeNaRede || json.nome_na_rede,
                    os_version: json.os_version || json.osVersion,
                    last_inventory_scan: json.scan_date || new Date().toISOString().split('T')[0],
                    status: EquipmentStatus.Stock
                };
                
                setImportData(normalized);
                setEquipmentToEdit(null);
                setShowAddEquipmentModal(true);
            } catch (err) {
                alert("Erro ao ler ficheiro JSON do Agente.");
            }
        };
        reader.readAsText(file);
    };
    
    return (
        <>
            {activeTab === 'equipment.inventory' && (
                <EquipmentDashboard 
                    equipment={equipmentData} totalItems={totalEquipment} loading={equipmentLoading} page={equipmentPage} pageSize={equipmentPageSize} 
                    sort={equipmentSort} onPageChange={setEquipmentPage} onPageSizeChange={setEquipmentPageSize} onSortChange={setEquipmentSort} 
                    onFilterChange={setDashboardFilter} brands={appData.brands} equipmentTypes={appData.equipmentTypes} 
                    brandMap={new Map(appData.brands.map((b: Brand) => [b.id, b.name]))} 
                    equipmentTypeMap={new Map(appData.equipmentTypes.map((t: EquipmentType) => [t.id, t.name]))} 
                    assignedEquipmentIds={new Set(appData.assignments.filter((a: Assignment) => !a.return_date).map((a: Assignment) => a.equipment_id))} 
                    assignments={appData.assignments} collaborators={appData.collaborators} entidades={appData.entidades} instituicoes={appData.instituicoes} 
                    initialFilter={dashboardFilter} onClearInitialFilter={() => setDashboardFilter(null)} 
                    onAssign={checkPermission('equipment', 'edit') ? (eq: Equipment) => { setEquipmentToAssign(eq); setShowAssignModal(true); } : undefined} 
                    onUnassign={checkPermission('equipment', 'edit') ? async (id: string) => { await dataService.addAssignment({ equipment_id: id, return_date: new Date().toISOString().split('T')[0] }); fetchEquipment(); } : undefined} 
                    onUpdateStatus={checkPermission('equipment', 'edit') ? async (id: string, status: EquipmentStatus) => { await dataService.updateEquipment(id, { status }); fetchEquipment(); } : undefined} 
                    onShowHistory={(eq: Equipment) => { setDetailEquipment(eq); }} 
                    onEdit={checkPermission('equipment', 'edit') ? (eq: Equipment) => { setEquipmentToEdit(eq); setImportData(null); setShowAddEquipmentModal(true); } : undefined} 
                    onDelete={checkPermission('equipment', 'delete') ? async (id: string) => { await dataService.deleteEquipment(id); fetchEquipment(); refreshGlobalData(); } : undefined} 
                    onCreate={checkPermission('equipment', 'create') ? () => { setEquipmentToEdit(null); setImportData(null); setShowAddEquipmentModal(true); } : undefined} 
                    onImportAgent={handleImportAgent}
                    businessServices={appData.businessServices} serviceDependencies={appData.serviceDependencies} tickets={appData.tickets} ticketActivities={appData.ticketActivities} 
                    softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments} vulnerabilities={appData.vulnerabilities} suppliers={appData.suppliers} 
                    procurementRequests={appData.procurementRequests} tooltipConfig={userTooltipConfig} onViewItem={onViewItem} 
                    accountingCategories={appData.configAccountingCategories} conservationStates={appData.configConservationStates} 
                />
            )}

            {activeTab === 'licensing' && (
                <LicenseDashboard licenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments} equipmentData={appData.equipment} collaborators={appData.collaborators} onEdit={checkPermission('licensing', 'edit') ? (l: SoftwareLicense) => { setLicenseToEdit(l); setShowAddLicenseModal(true); } : undefined} onDelete={checkPermission('licensing', 'delete') ? async (id: string) => { if (window.confirm("Apagar?")) { await dataService.deleteLicense(id); refreshGlobalData(); } } : undefined} onCreate={checkPermission('licensing', 'create') ? () => { setLicenseToEdit(null); setShowAddLicenseModal(true); } : undefined} onToggleStatus={checkPermission('licensing', 'edit') ? async (id: string) => { const lic = appData.softwareLicenses.find((l: SoftwareLicense) => l.id === id); if (lic) await dataService.updateLicense(id, { status: lic.status === 'Ativo' ? 'Inativo' : 'Ativo' }); refreshGlobalData(); } : undefined} />
            )}
            
            {activeTab === 'equipment.procurement' && (
                <ProcurementDashboard 
                    requests={appData.procurementRequests} collaborators={appData.collaborators} suppliers={appData.suppliers} currentUser={currentUser} 
                    onCreate={checkPermission('procurement', 'create') ? () => { setProcurementToEdit(null); setShowAddProcurementModal(true); } : undefined} 
                    onEdit={checkPermission('procurement', 'edit') ? (req: ProcurementRequest) => { setDetailProcurement(req); setShowProcurementDetailModal(true); } : undefined} 
                    onReceive={checkPermission('equipment', 'create') ? (req: ProcurementRequest) => { setProcurementToReceive(req); setShowReceiveAssetsModal(true); } : undefined} 
                    onDelete={checkPermission('procurement', 'delete') ? async (id: string) => { if (window.confirm("Apagar?")) { await dataService.deleteProcurement(id); refreshGlobalData(); } } : undefined} 
                    canApprove={checkPermission('procurement', 'delete')} 
                />
            )}

            {showAddEquipmentModal && (
                <AddEquipmentModal 
                    onClose={() => { setShowAddEquipmentModal(false); setImportData(null); }} 
                    onSave={handleSaveEquipment} brands={appData.brands} equipmentTypes={appData.equipmentTypes} 
                    equipmentToEdit={equipmentToEdit} initialData={importData}
                    onSaveBrand={dataService.addBrand} onSaveEquipmentType={dataService.addEquipmentType} onOpenKitModal={()=>{}} 
                    suppliers={appData.suppliers} softwareLicenses={appData.softwareLicenses} entidades={appData.entidades} 
                    collaborators={appData.collaborators} statusOptions={appData.configEquipmentStatuses} 
                    licenseAssignments={appData.licenseAssignments} onOpenHistory={(eq: Equipment) => setDetailEquipment(eq)} 
                    onManageLicenses={(eq: Equipment) => setDetailEquipment(eq)} onOpenAssign={(eq: Equipment) => { setEquipmentToAssign(eq); setShowAssignModal(true); }} 
                    accountingCategories={appData.configAccountingCategories} conservationStates={appData.configConservationStates} 
                    cpuOptions={appData.configCpus} ramOptions={appData.configRamSizes} storageOptions={appData.configStorageTypes} 
                />
            )}
            {showAssignModal && equipmentToAssign && <AssignEquipmentModal equipment={equipmentToAssign} brandMap={new Map(appData.brands.map((b: Brand) => [b.id, b.name]))} equipmentTypeMap={new Map(appData.equipmentTypes.map((t: EquipmentType) => [t.id, t.name]))} escolasDepartamentos={appData.entidades} instituicoes={appData.instituicoes} collaborators={appData.collaborators} onClose={() => setShowAssignModal(false)} onAssign={async (a) => { await dataService.addAssignment(a); fetchEquipment(); refreshGlobalData(); }} />}
            {detailEquipment && <EquipmentHistoryModal equipment={detailEquipment} assignments={appData.assignments} collaborators={appData.collaborators} escolasDepartamentos={appData.entidades} tickets={appData.tickets} ticketActivities={appData.ticketActivities} onClose={() => setDetailEquipment(null)} onEdit={(eq) => { setDetailEquipment(null); setEquipmentToEdit(eq); setShowAddEquipmentModal(true); }} businessServices={appData.businessServices} serviceDependencies={appData.serviceDependencies} softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments} vulnerabilities={appData.vulnerabilities} suppliers={appData.suppliers} onViewItem={onViewItem} accountingCategories={appData.configAccountingCategories} conservationStates={appData.configConservationStates} />}
            {showAddLicenseModal && <AddLicenseModal onClose={() => setShowAddLicenseModal(false)} onSave={async (lic: any) => { if (licenseToEdit) await dataService.updateLicense(licenseToEdit.id, lic); else await dataService.addLicense(lic); refreshGlobalData(); }} licenseToEdit={licenseToEdit} suppliers={appData.suppliers} categories={appData.softwareCategories} />}
            {showAddProcurementModal && (
                <AddProcurementModal 
                    onClose={() => setShowAddProcurementModal(false)} 
                    onSave={async (req: any) => { 
                        if (procurementToEdit) await dataService.updateProcurement(procurementToEdit.id, req); 
                        else await dataService.addProcurement(req); 
                        refreshGlobalData(); 
                    }} 
                    procurementToEdit={procurementToEdit} 
                    currentUser={currentUser} 
                    collaborators={appData.collaborators} 
                    suppliers={appData.suppliers} 
                    equipmentTypes={appData.equipmentTypes} 
                    softwareCategories={appData.softwareCategories} 
                    softwareProducts={appData.softwareProducts}
                />
            )}
            {showProcurementDetailModal && detailProcurement && (
                <ProcurementDetailModal 
                    procurement={detailProcurement} collaborators={appData.collaborators} suppliers={appData.suppliers} 
                    onClose={() => setShowProcurementDetailModal(false)} 
                    onEdit={() => { setShowProcurementDetailModal(false); setProcurementToEdit(detailProcurement); setShowAddProcurementModal(true); }} 
                    brandMap={new Map(appData.brands.map((b:Brand)=>[b.id,b.name]))} equipmentTypeMap={new Map(appData.equipmentTypes.map((t:EquipmentType)=>[t.id,t.name]))}
                />
            )}
            {showReceiveAssetsModal && procurementToReceive && <ReceiveAssetsModal onClose={() => setShowReceiveAssetsModal(false)} request={procurementToReceive} brands={appData.brands} types={appData.equipmentTypes} onSave={async (assets: any[]) => { if (procurementToReceive.resource_type === 'Software') await dataService.addMultipleLicenses(assets); else await dataService.addMultipleEquipment(assets); await dataService.updateProcurement(procurementToReceive.id, { status: 'Concluído' }); fetchEquipment(); refreshGlobalData(); }} />}
        </>
    );
};

export default InventoryManager;