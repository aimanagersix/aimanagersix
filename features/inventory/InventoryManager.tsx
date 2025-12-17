
import React, { useState, useEffect, useCallback } from 'react';
import { 
    Equipment, Brand, EquipmentType, Collaborator, 
    SoftwareLicense, Assignment, 
    defaultTooltipConfig, ModuleKey, PermissionAction, LicenseAssignment, ConfigItem, ProcurementRequest, EquipmentStatus
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
    activeTab, appData, checkPermission, refreshData: refreshGlobalData, 
    dashboardFilter, setDashboardFilter, setReportType, currentUser,
    onViewItem
}) => {
    
    // Server-Side Data State for Equipment
    const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
    const [totalEquipment, setTotalEquipment] = useState(0);
    const [equipmentLoading, setEquipmentLoading] = useState(false);
    const [equipmentPage, setEquipmentPage] = useState(1);
    const [equipmentPageSize, setEquipmentPageSize] = useState(20);
    const [equipmentSort, setEquipmentSort] = useState<{ key: string, direction: 'ascending' | 'descending' }>({ key: 'creationDate', direction: 'descending' });
    
    // Local State for Inventory Modals
    const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
    const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
    const [equipmentInitialData, setEquipmentInitialData] = useState<Partial<Equipment> | null>(null); 
    
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

    // --- DATA FETCHING (SERVER SIDE) ---
    const fetchEquipment = useCallback(async () => {
        setEquipmentLoading(true);
        try {
            const { data, total } = await dataService.fetchEquipmentPaginated({
                page: equipmentPage,
                pageSize: equipmentPageSize,
                filters: dashboardFilter,
                sort: equipmentSort
            });
            setEquipmentData(data);
            setTotalEquipment(total);
        } catch (error) {
            console.error("Error fetching equipment:", error);
            // Fallback empty on error
            setEquipmentData([]);
            setTotalEquipment(0);
        } finally {
            setEquipmentLoading(false);
        }
    }, [equipmentPage, equipmentPageSize, dashboardFilter, equipmentSort]);

    // Initial Load & Refresh
    useEffect(() => {
        if (activeTab === 'equipment.inventory') {
            fetchEquipment();
        }
    }, [activeTab, fetchEquipment]);


    // Handlers
    const handleAssign = async (assignment: any) => {
        await dataService.addAssignment(assignment);
        fetchEquipment(); // Refresh local list
        refreshGlobalData(); // Refresh global counters if needed
    };
    
    // CLONE LOGIC
    const handleCloneEquipment = (sourceEq: Equipment) => {
        const cloneData: Partial<Equipment> = {
            ...sourceEq,
            id: undefined, 
            serialNumber: '', 
            inventoryNumber: '', 
            nomeNaRede: '', 
            macAddressWIFI: '',
            macAddressCabo: '',
            ip_address: '',
            embedded_license_key: '', // Reset license key on clone
            status: EquipmentStatus.Stock, 
            creationDate: undefined,
            modifiedDate: undefined,
        };
        
        setEquipmentToEdit(null); 
        setEquipmentInitialData(cloneData);
        setShowAddEquipmentModal(true);
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
        
        fetchEquipment(); // Refresh list
        refreshGlobalData(); // Refresh global
        setShowAddEquipmentModal(false);
    };
    
    // Handler for Importing Agent JSON
    const handleAgentImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (!json.serialNumber) throw new Error("JSON inválido: falta serialNumber.");
                
                // 1. Resolve Brand
                let brandId = '';
                const brandName = (json.brandName || 'Genérico').trim();
                const existingBrand = appData.brands.find((b: Brand) => b.name.toLowerCase() === brandName.toLowerCase());
                if (existingBrand) {
                    brandId = existingBrand.id;
                } else {
                    const newBrand = await dataService.addBrand({ name: brandName });
                    brandId = newBrand.id;
                }

                // 2. Resolve Type
                let typeId = '';
                const typeName = (json.typeName || 'Desktop').trim();
                const existingType = appData.equipmentTypes.find((t: EquipmentType) => t.name.toLowerCase() === typeName.toLowerCase());
                if (existingType) {
                    typeId = existingType.id;
                } else {
                    const newType = await dataService.addEquipmentType({ name: typeName });
                    typeId = newType.id;
                }

                // 3. Check if Equipment Exists
                const { data: existingCheck } = await dataService.fetchEquipmentPaginated({ page: 1, pageSize: 1, filters: { serialNumber: json.serialNumber } });
                const existingEq = existingCheck && existingCheck.length > 0 ? existingCheck[0] : null;

                const payload = {
                    serialNumber: json.serialNumber,
                    brandId: brandId,
                    typeId: typeId,
                    description: json.description || `${brandName} ${typeName}`,
                    nomeNaRede: json.nomeNaRede,
                    os_version: json.os_version,
                    cpu_info: json.cpu_info,
                    ram_size: json.ram_size,
                    macAddressWIFI: json.macAddressWIFI,
                    macAddressCabo: json.macAddressCabo,
                    disk_info: json.disk_info ? JSON.stringify(json.disk_info) : undefined,
                    embedded_license_key: json.embedded_license_key, 
                    manufacture_date: json.bios_date, // NEW: BIOS Date
                    last_security_update: json.last_patch_date, // NEW: Patch Date
                    last_inventory_scan: json.scan_date || new Date().toISOString().split('T')[0] 
                };

                if (existingEq) {
                     await dataService.updateEquipment(existingEq.id, payload);
                     alert(`Equipamento atualizado: ${json.serialNumber}`);
                } else {
                     await dataService.addEquipment({
                         ...payload,
                         status: EquipmentStatus.Stock,
                         purchaseDate: null, // Force null so it doesn't default to 'now'. System uses creationDate for intro date.
                         criticality: 'Baixa',
                         creationDate: new Date().toISOString(),
                         modifiedDate: new Date().toISOString()
                     });
                     alert(`Novo equipamento criado: ${json.serialNumber}`);
                }
                fetchEquipment();

            } catch (error: any) {
                console.error(error);
                alert(`Erro ao importar: ${error.message}`);
            }
        };
        reader.readAsText(file);
    };
    
    const canApproveProcurement = checkPermission('procurement', 'delete');

    // No longer trying to resolve inside the manager, passing lists to modal instead
    const resolvedDetailEquipment = detailEquipment;

    return (
        <>
            {/* --- DASHBOARDS --- */}
            {activeTab === 'equipment.inventory' && (
                <EquipmentDashboard 
                    equipment={equipmentData} 
                    totalItems={totalEquipment} 
                    loading={equipmentLoading}
                    page={equipmentPage}
                    pageSize={equipmentPageSize}
                    sort={equipmentSort}
                    onPageChange={setEquipmentPage}
                    onPageSizeChange={setEquipmentPageSize}
                    onSortChange={setEquipmentSort}
                    onFilterChange={setDashboardFilter} 
                    
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
                    onAssign={checkPermission('equipment', 'edit') ? (eq: Equipment) => { setEquipmentToAssign(eq); setShowAssignModal(true); } : undefined}
                    onAssignMultiple={checkPermission('equipment', 'edit') ? (eqs: Equipment[]) => { setEquipmentListToAssign(eqs); setShowAssignMultipleModal(true); } : undefined}
                    onUnassign={checkPermission('equipment', 'edit') ? async (id: string) => {
                        if(window.confirm("Deseja desassociar este equipamento? O estado passará para 'Stock'.")) {
                            await dataService.addAssignment({ equipmentId: id, returnDate: new Date().toISOString().split('T')[0] });
                            fetchEquipment();
                        }
                    } : undefined}
                    onUpdateStatus={checkPermission('equipment', 'edit') ? async (id: string, status: EquipmentStatus) => {
                        await dataService.updateEquipment(id, { status });
                        fetchEquipment();
                    } : undefined}
                    onShowHistory={(eq: Equipment) => { setDetailEquipment(eq); }} 
                    onEdit={checkPermission('equipment', 'edit') ? (eq: Equipment) => { setEquipmentToEdit(eq); setEquipmentInitialData(null); setShowAddEquipmentModal(true); } : undefined}
                    onDelete={checkPermission('equipment', 'delete') ? async (id: string) => { await dataService.deleteEquipment(id); fetchEquipment(); refreshGlobalData(); } : undefined} 
                    onClone={checkPermission('equipment', 'create') ? (eq: Equipment) => handleCloneEquipment(eq) : undefined}
                    onCreate={checkPermission('equipment', 'create') ? () => { setEquipmentToEdit(null); setEquipmentInitialData(null); setShowAddEquipmentModal(true); } : undefined}
                    onImportAgent={checkPermission('equipment', 'create') ? (e: React.ChangeEvent<HTMLInputElement>) => handleAgentImport(e) : undefined} 
                    onGenerateReport={checkPermission('reports', 'view') ? () => setReportType('equipment') : undefined}
                    onManageKeys={checkPermission('licensing', 'edit') ? (eq: Equipment) => { setDetailEquipment(eq); } : undefined}
                    businessServices={appData.businessServices}
                    serviceDependencies={appData.serviceDependencies}
                    tickets={appData.tickets}
                    ticketActivities={appData.ticketActivities}
                    softwareLicenses={appData.softwareLicenses}
                    licenseAssignments={appData.licenseAssignments}
                    /* FIX: Removed duplicate vulnerabilities prop */
                    vulnerabilities={appData.vulnerabilities}
                    suppliers={appData.suppliers}
                    procurementRequests={appData.procurementRequests}
                    tooltipConfig={userTooltipConfig}
                    onViewItem={onViewItem}
                    // PASS CONFIG PROPS
                    accountingCategories={appData.configAccountingCategories}
                    conservationStates={appData.configConservationStates}
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
                    onEdit={checkPermission('licensing', 'edit') ? (l: SoftwareLicense) => { setLicenseToEdit(l); setShowAddLicenseModal(true); } : undefined}
                    onDelete={checkPermission('licensing', 'delete') ? async (id: string) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteLicense(id); refreshGlobalData(); } } : undefined}
                    onCreate={checkPermission('licensing', 'create') ? () => { setLicenseToEdit(null); setShowAddLicenseModal(true); } : undefined}
                    onGenerateReport={() => setReportType('licensing')}
                    initialFilter={dashboardFilter}
                    onClearInitialFilter={() => setDashboardFilter(null)}
                    onToggleStatus={checkPermission('licensing', 'edit') ? async (id: string) => {
                        const lic = appData.softwareLicenses.find((l: SoftwareLicense) => l.id === id);
                        if (lic) await dataService.updateLicense(id, { status: lic.status === 'Ativo' ? 'Inativo' : 'Ativo' });
                        refreshGlobalData();
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
                    onEdit={checkPermission('procurement', 'edit') ? (req: ProcurementRequest) => { setProcurementToEdit(req); setShowAddProcurementModal(true); } : undefined}
                    onReceive={checkPermission('equipment', 'create') ? (req: ProcurementRequest) => { setProcurementToReceive(req); setShowReceiveAssetsModal(true); } : undefined}
                    onDelete={checkPermission('procurement', 'delete') ? async (id: string) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteProcurement(id); refreshGlobalData(); } } : undefined}
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
                    initialData={equipmentInitialData} 
                    onSaveBrand={dataService.addBrand}
                    onSaveEquipmentType={dataService.addEquipmentType}
                    onOpenKitModal={(data: Partial<Equipment>) => { setKitInitialData(data); setShowAddEquipmentModal(false); setShowKitModal(true); }}
                    suppliers={appData.suppliers}
                    softwareLicenses={appData.softwareLicenses}
                    entidades={appData.entidades}
                    collaborators={appData.collaborators}
                    statusOptions={appData.configEquipmentStatuses}
                    licenseAssignments={appData.licenseAssignments}
                    onOpenHistory={(eq: Equipment) => { setDetailEquipment(eq); }}
                    onManageLicenses={(eq: Equipment) => { setDetailEquipment(eq); }} 
                    onOpenAssign={(eq: Equipment) => { setEquipmentToAssign(eq); setShowAssignModal(true); }}
                    accountingCategories={appData.configAccountingCategories}
                    conservationStates={appData.configConservationStates}
                    cpuOptions={appData.configCpus}
                    ramOptions={appData.configRamSizes}
                    storageOptions={appData.configStorageTypes}
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
                    onEdit={(eq: Equipment) => { setDetailEquipment(null); setEquipmentToEdit(eq); setShowAddEquipmentModal(true); }}
                    businessServices={appData.businessServices}
                    serviceDependencies={appData.serviceDependencies}
                    softwareLicenses={appData.softwareLicenses}
                    licenseAssignments={appData.licenseAssignments}
                    vulnerabilities={appData.vulnerabilities}
                    suppliers={appData.suppliers}
                    procurementRequests={appData.procurementRequests}
                    onViewItem={onViewItem}
                    // PASS CONFIG LISTS FOR NAME RESOLUTION
                    accountingCategories={appData.configAccountingCategories}
                    conservationStates={appData.configConservationStates}
                 />
            )}

            {showKitModal && (
                <AddEquipmentKitModal
                    onClose={() => setShowKitModal(false)}
                    onSaveKit={async (items: any[]) => {
                        await dataService.addMultipleEquipment(items);
                        fetchEquipment(); // Refresh list
                        refreshGlobalData(); // Refresh global
                    }}
                    brands={appData.brands}
                    equipmentTypes={appData.equipmentTypes}
                    initialData={kitInitialData}
                    onSaveEquipmentType={dataService.addEquipmentType}
                    equipment={equipmentData} // Use current page data (mock, kit name logic might be less accurate but safe)
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
                    onAssign={async (assignment: any) => {
                        for (const eq of equipmentListToAssign) {
                            await dataService.addAssignment({ ...assignment, equipmentId: eq.id });
                        }
                        fetchEquipment();
                        refreshGlobalData();
                    }}
                />
            )}

            {/* Other modals (License, Procurement) use refreshGlobalData() as they affect smaller tables or derived stats */}
            {showAddLicenseModal && (
                <AddLicenseModal 
                    onClose={() => setShowAddLicenseModal(false)}
                    onSave={async (lic: any) => {
                        if (licenseToEdit) await dataService.updateLicense(licenseToEdit.id, lic);
                        else await dataService.addLicense(lic);
                        refreshGlobalData();
                    }}
                    licenseToEdit={licenseToEdit}
                    suppliers={appData.suppliers}
                    categories={appData.softwareCategories}
                />
            )}
            
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
                    cpuOptions={appData.configCpus}
                    ramOptions={appData.configRamSizes}
                    storageOptions={appData.configStorageTypes}
                />
            )}
            
            {showReceiveAssetsModal && procurementToReceive && (
                <ReceiveAssetsModal 
                    onClose={() => setShowReceiveAssetsModal(false)}
                    request={procurementToReceive}
                    brands={appData.brands}
                    types={appData.equipmentTypes}
                    onSave={async (assets: any[]) => {
                         if (procurementToReceive.resource_type === 'Software') {
                             await dataService.addMultipleLicenses(assets);
                         } else {
                             await dataService.addMultipleEquipment(assets);
                         }
                        
                        await dataService.updateProcurement(procurementToReceive.id, { status: 'Concluído' });
                        fetchEquipment(); // If hardware
                        refreshGlobalData();
                    }}
                />
            )}
        </>
    );
};

export default InventoryManager;
