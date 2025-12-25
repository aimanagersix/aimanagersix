import React, { useMemo } from 'react';
import { 
    FaList, FaTicketAlt, FaKey, FaBroom, FaLandmark, FaLeaf, FaMicrochip, FaMemory, FaHdd, FaUserTie, FaUserTag, FaUserSlash, FaTags 
} from 'react-icons/fa';

// Components
import BrandDashboard from '../../components/BrandDashboard';
import EquipmentTypeDashboard from '../../components/EquipmentTypeDashboard';
import CategoryDashboard from '../../components/CategoryDashboard';
import SecurityIncidentTypeDashboard from '../../components/SecurityIncidentTypeDashboard';
import RoleManager from '../../components/RoleManager'; 
import AutomationRulesDashboard from '../../components/AutomationRulesDashboard';
import TeamDashboard from '../../components/TeamDashboard';
import BrandingTab from './BrandingTab';
import GeneralScansTab from './GeneralScansTab';
import ConnectionsTab from './ConnectionsTab';
import AgentsTab from './AgentsTab';
import WebhooksTab from './WebhooksTab';
import CronJobsTab from './CronJobsTab';
import SoftwareProductDashboard from './SoftwareProductDashboard';
import GenericConfigDashboard from './GenericConfigDashboard';

interface SettingsRouterProps {
    selectedMenuId: string;
    appData: any;
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSaveSettings: () => void;
    onRefresh: () => void;
    onSyncSophos: () => Promise<void>;
    isSyncingSophos: boolean;
    onShowDiagnostics: () => void;
    onEditBrand: (b: any) => void;
    onEditType: (t: any) => void;
    onEditCategory: (c: any) => void;
    onEditIncidentType: (i: any) => void;
    onEditTeam: (t: any) => void;
    onManageTeamMembers: (t: any) => void;
}

const SettingsRouter: React.FC<SettingsRouterProps> = ({ 
    selectedMenuId, appData, settings, onSettingsChange, onSaveSettings, onRefresh, onSyncSophos, isSyncingSophos, onShowDiagnostics,
    onEditBrand, onEditType, onEditCategory, onEditIncidentType, onEditTeam, onManageTeamMembers
}) => {
    
    const safeData = (arr: any) => Array.isArray(arr) ? arr : [];

    const simpleConfigTables = useMemo(() => ({
        'config_equipment_statuses': { label: 'Estados de Equipamento', icon: <FaList/>, data: safeData(appData.configEquipmentStatuses), colorField: true },
        'config_ticket_statuses': { label: 'Estados de Tickets', icon: <FaList/>, data: safeData(appData.configTicketStatuses), colorField: true },
        'config_license_statuses': { label: 'Estados de Licenças', icon: <FaKey/>, data: safeData(appData.configLicenseStatuses), colorField: true },
        'config_decommission_reasons': { label: 'Motivos de Abate', icon: <FaBroom/>, data: safeData(appData.configDecommissionReasons) },
        'config_accounting_categories': { label: 'Classificador CIBE / SNC-AP', icon: <FaLandmark/>, data: safeData(appData.configAccountingCategories) },
        'config_conservation_states': { label: 'Estados de Conservação', icon: <FaLeaf/>, data: safeData(appData.configConservationStates), colorField: true },
        'config_cpus': { label: 'Tipos de Processador', icon: <FaMicrochip/>, data: safeData(appData.configCpus) },
        'config_ram_sizes': { label: 'Tamanhos de Memória RAM', icon: <FaMemory/>, data: safeData(appData.configRamSizes) },
        'config_storage_types': { label: 'Tipos de Disco / Armazenamento', icon: <FaHdd/>, data: safeData(appData.configStorageTypes) },
        'config_job_titles': { label: 'Cargos / Funções Profissionais', icon: <FaUserTie/>, data: safeData(appData.configJobTitles) },
        'config_software_categories': { label: 'Categorias de Software', icon: <FaTags/>, data: safeData(appData.softwareCategories) },
        'config_collaborator_deactivation_reasons': { label: 'Motivos de Saída (RH)', icon: <FaUserSlash/>, data: safeData(appData.configCollaboratorDeactivationReasons) },
        'contact_roles': { label: 'Papéis de Contacto Externo', icon: <FaUserTag/>, data: safeData(appData.contactRoles) },
        'contact_titles': { label: 'Tratos Honoríficos', icon: <FaUserTag/>, data: safeData(appData.contactTitles) },
    }), [appData]);

    if (simpleConfigTables[selectedMenuId as keyof typeof simpleConfigTables]) {
        const cfg = (simpleConfigTables as any)[selectedMenuId];
        return <GenericConfigDashboard title={cfg.label} icon={cfg.icon} items={cfg.data} tableName={selectedMenuId} onRefresh={onRefresh} colorField={cfg.colorField} />;
    }

    switch (selectedMenuId) {
        case 'general': return <GeneralScansTab settings={settings} onSettingsChange={onSettingsChange} onSave={onSaveSettings} instituicoes={appData.instituicoes} />;
        case 'roles': return <RoleManager roles={safeData(appData.customRoles)} onRefresh={onRefresh} />;
        case 'teams': return (
            <TeamDashboard 
                teams={appData.teams} teamMembers={appData.teamMembers} collaborators={appData.collaborators}
                tickets={appData.tickets} equipmentTypes={appData.equipmentTypes}
                onEdit={onEditTeam} onManageMembers={onManageTeamMembers}
                onCreate={() => onEditTeam(null)}
                onDelete={async (id) => { if (confirm("Excluir?")) { /* delete logic implemented via dataService elsewhere */ } }}
            />
        );
        case 'config_automation': return <AutomationRulesDashboard />;
        case 'brands': return <BrandDashboard brands={safeData(appData.brands)} equipment={safeData(appData.equipment)} onCreate={() => onEditBrand(null)} onEdit={onEditBrand} />;
        case 'equipment_types': return <EquipmentTypeDashboard equipmentTypes={safeData(appData.equipmentTypes)} equipment={safeData(appData.equipment)} onCreate={() => onEditType(null)} onEdit={onEditType} />;
        case 'ticket_categories': return <CategoryDashboard categories={safeData(appData.ticketCategories)} tickets={safeData(appData.tickets)} teams={safeData(appData.teams)} onCreate={() => onEditCategory(null)} onEdit={onEditCategory} onToggleStatus={()=>{}} onDelete={()=>{}} />;
        case 'security_incident_types': return <SecurityIncidentTypeDashboard incidentTypes={safeData(appData.securityIncidentTypes)} tickets={safeData(appData.tickets)} onCreate={() => onEditIncidentType(null)} onEdit={onEditIncidentType} onToggleStatus={()=>{}} onDelete={()=>{}} />;
        case 'config_software_products': return <SoftwareProductDashboard products={safeData(appData.softwareProducts)} categories={safeData(appData.softwareCategories)} onRefresh={onRefresh} />;
        case 'connections': return <ConnectionsTab settings={settings} onSettingsChange={onSettingsChange} onSave={onSaveSettings} />;
        case 'cronjobs': return <CronJobsTab settings={settings} onSettingsChange={onSettingsChange} onSave={onSaveSettings} onTest={()=>{}} onCopy={(t)=>navigator.clipboard.writeText(t)} onSyncSophos={onSyncSophos} isSyncingSophos={isSyncingSophos} />;
        case 'branding': return <BrandingTab settings={settings} onSettingsChange={onSettingsChange} onSave={onSaveSettings} instituicoes={appData.instituicoes} />;
        case 'agents': return <AgentsTab />;
        case 'webhooks': return <WebhooksTab settings={settings} onSettingsChange={onSettingsChange} onSimulate={()=>{}} />;
        case 'diagnostics': return <div className="p-6 text-center"><button onClick={onShowDiagnostics} className="bg-brand-primary text-white px-6 py-3 rounded-lg font-bold">Abrir Sistema de Diagnóstico</button></div>;
        default: return <div className="p-10 text-center text-gray-500">Selecione uma opção no menu à esquerda.</div>;
    }
};

export default SettingsRouter;