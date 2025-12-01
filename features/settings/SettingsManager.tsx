import React, { useState, useEffect } from 'react';
import * as dataService from '../../services/dataService';
import { FaHeartbeat, FaTags, FaShapes, FaList, FaShieldAlt, FaTicketAlt, FaUserTag, FaServer, FaGraduationCap, FaLock, FaIdCard, FaPalette } from 'react-icons/fa';

// Components
import BrandDashboard from '../../components/BrandDashboard';
import EquipmentTypeDashboard from '../../components/EquipmentTypeDashboard';
import CategoryDashboard from '../../components/CategoryDashboard';
import SecurityIncidentTypeDashboard from '../../components/SecurityIncidentTypeDashboard';
import RoleManager from '../../components/RoleManager'; 
import SystemDiagnosticsModal from '../../components/SystemDiagnosticsModal';
import AddBrandModal from '../../components/AddBrandModal';
import AddEquipmentTypeModal from '../../components/AddEquipmentTypeModal';
import AddCategoryModal from '../../components/AddCategoryModal';
import AddSecurityIncidentTypeModal from '../../components/AddSecurityIncidentTypeModal';
import BrandingTab from '../../components/settings/BrandingTab'; // NEW

interface SettingsManagerProps {
    appData: any;
    refreshData: () => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ appData, refreshData }) => {
    const [selectedMenuId, setSelectedMenuId] = useState<string>('brands'); 
    
    // Generic Editor State
    const [newItemName, setNewItemName] = useState('');
    const [newItemColor, setNewItemColor] = useState('#3b82f6'); 
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [error, setError] = useState('');
    
    // Modals State
    const [showAddBrandModal, setShowAddBrandModal] = useState(false);
    const [brandToEdit, setBrandToEdit] = useState<any>(null);
    const [showAddTypeModal, setShowAddTypeModal] = useState(false);
    const [typeToEdit, setTypeToEdit] = useState<any>(null);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
    const [showAddIncidentTypeModal, setShowAddIncidentTypeModal] = useState(false);
    const [incidentTypeToEdit, setIncidentTypeToEdit] = useState<any>(null);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    
    // Branding State
    const [brandingSettings, setBrandingSettings] = useState({
        app_logo_base64: '',
        app_logo_size: 80,
        app_logo_alignment: 'center',
        report_footer_institution_id: ''
    });

    useEffect(() => {
        const loadSettings = async () => {
            const logo = await dataService.getGlobalSetting('app_logo_base64') || '';
            const size = await dataService.getGlobalSetting('app_logo_size') || '80';
            const align = await dataService.getGlobalSetting('app_logo_alignment') || 'center';
            const footerId = await dataService.getGlobalSetting('report_footer_institution_id') || '';
            setBrandingSettings({
                app_logo_base64: logo,
                app_logo_size: parseInt(size),
                app_logo_alignment: align,
                report_footer_institution_id: footerId
            });
        };
        if(selectedMenuId === 'branding') {
            loadSettings();
        }
    }, [selectedMenuId]);
    
    const handleBrandingChange = (key: string, value: any) => {
        setBrandingSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveBranding = async () => {
        try {
            await dataService.updateGlobalSetting('app_logo_base64', brandingSettings.app_logo_base64);
            await dataService.updateGlobalSetting('app_logo_size', String(brandingSettings.app_logo_size));
            await dataService.updateGlobalSetting('app_logo_alignment', brandingSettings.app_logo_alignment);
            await dataService.updateGlobalSetting('report_footer_institution_id', brandingSettings.report_footer_institution_id);
            alert("Configurações de branding guardadas.");
        } catch(e) {
            alert("Erro ao guardar as configurações.");
        }
    };


    const menuStructure: { group: string, items: MenuItem[] }[] = [
        {
            group: "Personalização",
            items: [
                { id: 'branding', label: 'Branding (Relatórios)', icon: <FaPalette /> }
            ]
        },
        {
            group: "Inventário & Ativos",
            items: [
                { id: 'brands', label: 'Marcas (Fabricantes)', icon: <FaTags /> },
                { id: 'equipment_types', label: 'Tipos de Equipamento', icon: <FaShapes /> },
                // Generic items will render from here
            ]
        },
        // ... more groups can be added ...
    ];

    const currentSelectionLabel = menuStructure.flatMap(g => g.items).find(i => i.id === selectedMenuId)?.label || 'Configurações';
    
    return (
        <>
            <div className="flex justify-end mb-4">
                <button 
                    onClick={() => setShowDiagnostics(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md transition-colors border border-gray-600"
                >
                    <FaHeartbeat className="text-red-400" /> Diagnóstico de Sistema
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
                {/* Sidebar Menu */}
                <div className="w-full lg:w-64 bg-surface-dark rounded-lg shadow-xl border border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
                    <div className="overflow-y-auto flex-grow p-2 space-y-4 custom-scrollbar">
                        {menuStructure.map((group, gIdx) => (
                            <div key={gIdx}>
                                <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group.group}</h3>
                                <div className="space-y-1">
                                    {group.items.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedMenuId(item.id)}
                                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md flex items-center gap-3 transition-colors ${
                                                selectedMenuId === item.id
                                                ? 'bg-brand-primary text-white shadow-md'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-surface-dark rounded-lg shadow-xl border border-gray-700 overflow-hidden flex flex-col" key={selectedMenuId}>
                    
                    {selectedMenuId === 'branding' && (
                        <div className="h-full overflow-y-auto p-6">
                             <BrandingTab 
                                settings={brandingSettings}
                                onSettingsChange={handleBrandingChange}
                                onSave={handleSaveBranding}
                                instituicoes={appData.instituicoes}
                             />
                        </div>
                    )}

                    {selectedMenuId === 'brands' && (
                        <div className="h-full overflow-y-auto">
                            <BrandDashboard brands={appData.brands} equipment={appData.equipment} onCreate={() => { setBrandToEdit(null); setShowAddBrandModal(true); }} onEdit={(b) => { setBrandToEdit(b); setShowAddBrandModal(true); }} onDelete={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteBrand(id); refreshData(); } }} />
                        </div>
                    )}
                    {selectedMenuId === 'equipment_types' && (
                        <div className="h-full overflow-y-auto">
                            <EquipmentTypeDashboard equipmentTypes={appData.equipmentTypes} equipment={appData.equipment} onCreate={() => { setTypeToEdit(null); setShowAddTypeModal(true); }} onEdit={(t) => { setTypeToEdit(t); setShowAddTypeModal(true); }} onDelete={async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteEquipmentType(id); refreshData(); } }} />
                        </div>
                    )}

                </div>
            </div>

            {/* Modals */}
            {showDiagnostics && <SystemDiagnosticsModal onClose={() => setShowDiagnostics(false)} />}
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
        </>
    );
};

export default SettingsManager;