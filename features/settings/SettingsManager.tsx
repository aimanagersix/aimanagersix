import React, { useState } from 'react';
import * as dataService from '../../services/dataService';
import AuxiliaryDataDashboard from '../../components/AuxiliaryDataDashboard';

// Modals
import AddBrandModal from '../../components/AddBrandModal';
import AddEquipmentTypeModal from '../../components/AddEquipmentTypeModal';
import AddCategoryModal from '../../components/AddCategoryModal';
import AddSecurityIncidentTypeModal from '../../components/AddSecurityIncidentTypeModal';

interface SettingsManagerProps {
    appData: any;
    refreshData: () => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ appData, refreshData }) => {
    // Modals State
    const [showAddBrandModal, setShowAddBrandModal] = useState(false);
    const [brandToEdit, setBrandToEdit] = useState<any>(null);
    
    const [showAddTypeModal, setShowAddTypeModal] = useState(false);
    const [typeToEdit, setTypeToEdit] = useState<any>(null);
    
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
    
    const [showAddIncidentTypeModal, setShowAddIncidentTypeModal] = useState(false);
    const [incidentTypeToEdit, setIncidentTypeToEdit] = useState<any>(null);

    return (
        <>
            <AuxiliaryDataDashboard 
                configTables={[
                    { tableName: 'config_equipment_statuses', label: 'Estados de Equipamento', data: appData.configEquipmentStatuses },
                    { tableName: 'contact_roles', label: 'Funções de Contacto', data: appData.contactRoles },
                    { tableName: 'contact_titles', label: 'Tratos (Honoríficos)', data: appData.contactTitles },
                    { tableName: 'config_criticality_levels', label: 'Níveis de Criticidade', data: appData.configCriticalityLevels },
                    { tableName: 'config_cia_ratings', label: 'Classificação CIA', data: appData.configCiaRatings },
                    { tableName: 'config_service_statuses', label: 'Estados de Serviço (BIA)', data: appData.configServiceStatuses },
                    { tableName: 'config_backup_types', label: 'Tipos de Backup', data: appData.configBackupTypes },
                    { tableName: 'config_training_types', label: 'Tipos de Formação', data: appData.configTrainingTypes },
                    { tableName: 'config_resilience_test_types', label: 'Tipos de Teste Resiliência', data: appData.configResilienceTestTypes },
                    { tableName: 'config_software_categories', label: 'Categorias de Software', data: appData.softwareCategories }
                ]}
                onRefresh={refreshData}
                brands={appData.brands} equipment={appData.equipment} onEditBrand={async (b) => { setBrandToEdit(b); setShowAddBrandModal(true); }} onDeleteBrand={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteBrand(id); refreshData(); } }} onCreateBrand={() => { setBrandToEdit(null); setShowAddBrandModal(true); }}
                equipmentTypes={appData.equipmentTypes} onEditType={async (t) => { setTypeToEdit(t); setShowAddTypeModal(true); }} onDeleteType={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteEquipmentType(id); refreshData(); } }} onCreateType={() => { setTypeToEdit(null); setShowAddTypeModal(true); }}
                ticketCategories={appData.ticketCategories} tickets={appData.tickets} teams={appData.teams} onEditCategory={async (c) => { setCategoryToEdit(c); setShowAddCategoryModal(true); }} onDeleteCategory={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteTicketCategory(id); refreshData(); } }} onToggleCategoryStatus={async (id) => { const cat = appData.ticketCategories.find((c:any) => c.id === id); if (cat) { await dataService.updateTicketCategory(id, { is_active: !cat.is_active }); refreshData(); } }} onCreateCategory={() => { setCategoryToEdit(null); setShowAddCategoryModal(true); }}
                securityIncidentTypes={appData.securityIncidentTypes} onEditIncidentType={async (t) => { setIncidentTypeToEdit(t); setShowAddIncidentTypeModal(true); }} onDeleteIncidentType={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteSecurityIncidentType(id); refreshData(); } }} onToggleIncidentTypeStatus={async (id) => { const t = appData.securityIncidentTypes.find((i:any) => i.id === id); if (t) { await dataService.updateSecurityIncidentType(id, { is_active: !t.is_active }); refreshData(); } }} onCreateIncidentType={() => { setIncidentTypeToEdit(null); setShowAddIncidentTypeModal(true); }}
                collaborators={appData.collaborators} softwareLicenses={appData.softwareLicenses} businessServices={appData.businessServices} backupExecutions={appData.backupExecutions} securityTrainings={appData.securityTrainings} resilienceTests={appData.resilienceTests} suppliers={appData.suppliers} entidades={appData.entidades} instituicoes={appData.instituicoes} vulnerabilities={appData.vulnerabilities}
            />

             {/* ... Modals ... */}
            {showAddBrandModal && (
                <AddBrandModal
                    onClose={() => setShowAddBrandModal(false)}
                    onSave={async (brand) => {
                        if (brandToEdit) await dataService.updateBrand(brandToEdit.id, brand);
                        else await dataService.addBrand(brand);
                        refreshData();
                    }}
                    brandToEdit={brandToEdit}
                    existingBrands={appData.brands}
                />
            )}
            {showAddTypeModal && (
                <AddEquipmentTypeModal
                    onClose={() => setShowAddTypeModal(false)}
                    onSave={async (type) => {
                        if (typeToEdit) await dataService.updateEquipmentType(typeToEdit.id, type);
                        else await dataService.addEquipmentType(type);
                        refreshData();
                    }}
                    typeToEdit={typeToEdit}
                    teams={appData.teams}
                    existingTypes={appData.equipmentTypes}
                />
            )}
             {showAddCategoryModal && (
                <AddCategoryModal
                    onClose={() => setShowAddCategoryModal(false)}
                    onSave={async (cat) => {
                        if (categoryToEdit) await dataService.updateTicketCategory(categoryToEdit.id, cat);
                        else await dataService.addTicketCategory(cat);
                        refreshData();
                    }}
                    categoryToEdit={categoryToEdit}
                    teams={appData.teams}
                />
            )}
            {showAddIncidentTypeModal && (
                <AddSecurityIncidentTypeModal
                    onClose={() => setShowAddIncidentTypeModal(false)}
                    onSave={async (type) => {
                        if (incidentTypeToEdit) await dataService.updateSecurityIncidentType(incidentTypeToEdit.id, type);
                        else await dataService.addSecurityIncidentType(type);
                        refreshData();
                    }}
                    typeToEdit={incidentTypeToEdit}
                />
            )}
        </>
    );
};

export default SettingsManager;