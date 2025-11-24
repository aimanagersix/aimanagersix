
import React, { useState, useEffect } from 'react';
import { ConfigItem, Brand, Equipment, EquipmentType, TicketCategoryItem, Ticket, Team, SecurityIncidentTypeItem, Collaborator, SoftwareLicense, BusinessService, BackupExecution, SecurityTrainingRecord, ResilienceTest, Supplier, Entidade, Instituicao, Vulnerability } from '../types';
import { PlusIcon, EditIcon, DeleteIcon } from './common/Icons';
import { FaCog, FaSave, FaTimes, FaTags, FaShapes, FaShieldAlt, FaTicketAlt, FaUsers, FaUserTag, FaList, FaServer, FaGraduationCap, FaLock, FaRobot, FaClock, FaImage } from 'react-icons/fa';
import * as dataService from '../services/dataService';

// Import existing dashboards for complex views
import BrandDashboard from './BrandDashboard';
import EquipmentTypeDashboard from './EquipmentTypeDashboard';
import CategoryDashboard from './CategoryDashboard';
import SecurityIncidentTypeDashboard from './SecurityIncidentTypeDashboard';

interface AuxiliaryDataDashboardProps {
    // Generic Config Data
    configTables: {
        tableName: string;
        label: string;
        data: ConfigItem[];
    }[];
    onRefresh: () => void;

    // Complex Data & Handlers
    brands: Brand[];
    equipment: Equipment[];
    equipmentTypes: EquipmentType[];
    ticketCategories: TicketCategoryItem[];
    tickets: Ticket[];
    teams: Team[];
    securityIncidentTypes: SecurityIncidentTypeItem[];

    // NEW PROPS for integrity checks
    collaborators: Collaborator[];
    softwareLicenses: SoftwareLicense[];
    businessServices: BusinessService[];
    backupExecutions: BackupExecution[];
    securityTrainings: SecurityTrainingRecord[];
    resilienceTests: ResilienceTest[];
    suppliers: Supplier[];
    entidades: Entidade[];
    instituicoes: Instituicao[];
    vulnerabilities: Vulnerability[];

    // Complex Handlers
    onEditBrand: (b: Brand) => void;
    onDeleteBrand: (id: string) => void;
    onCreateBrand: () => void;

    onEditType: (t: EquipmentType) => void;
    onDeleteType: (id: string) => void;
    onCreateType: () => void;

    onEditCategory: (c: TicketCategoryItem) => void;
    onDeleteCategory: (id: string) => void;
    onToggleCategoryStatus: (id: string) => void;
    onCreateCategory: () => void;

    onEditIncidentType: (t: SecurityIncidentTypeItem) => void;
    onDeleteIncidentType: (id: string) => void;
    onToggleIncidentTypeStatus: (id: string) => void;
    onCreateIncidentType: () => void;
}

type ViewType = 'generic' | 'brands' | 'equipment_types' | 'ticket_categories' | 'incident_types' | 'automation';

interface MenuItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    type: ViewType;
    targetTable?: string; // Use Table Name directly for reliability
}

const AuxiliaryDataDashboard: React.FC<AuxiliaryDataDashboardProps> = ({ 
    configTables, onRefresh,
    brands, equipment, onEditBrand, onDeleteBrand, onCreateBrand,
    equipmentTypes, onEditType, onDeleteType, onCreateType,
    ticketCategories, tickets, teams, onEditCategory, onDeleteCategory, onToggleCategoryStatus, onCreateCategory,
    securityIncidentTypes, onEditIncidentType, onDeleteIncidentType, onToggleIncidentTypeStatus, onCreateIncidentType,
    // Data for checks
    collaborators, softwareLicenses, businessServices, backupExecutions, securityTrainings, resilienceTests, suppliers, entidades, instituicoes, vulnerabilities
}) => {
    const [selectedMenuId, setSelectedMenuId] = useState<string>('brands'); // Default view
    
    // Generic Editor State
    const [newItemName, setNewItemName] = useState('');
    const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
    const [error, setError] = useState('');

    // Automation & Branding State
    const [scanFrequency, setScanFrequency] = useState('0');
    const [scanStartTime, setScanStartTime] = useState('02:00');
    const [lastScanDate, setLastScanDate] = useState('-');
    const [logoUrl, setLogoUrl] = useState('');

    // Define Menu Structure with explicit table names
    const menuStructure: { group: string, items: MenuItem[] }[] = [
        {
            group: "Inventário & Ativos",
            items: [
                { id: 'brands', label: 'Marcas (Fabricantes)', icon: <FaTags />, type: 'brands' },
                { id: 'equipment_types', label: 'Tipos de Equipamento', icon: <FaShapes />, type: 'equipment_types' },
                { id: 'status', label: 'Estados de Equipamento', icon: <FaList />, type: 'generic', targetTable: 'config_equipment_statuses' },
            ]
        },
        {
            group: "Suporte & Tickets",
            items: [
                { id: 'ticket_categories', label: 'Categorias de Tickets', icon: <FaTicketAlt />, type: 'ticket_categories' },
                { id: 'incident_types', label: 'Tipos de Incidente', icon: <FaShieldAlt />, type: 'incident_types' },
            ]
        },
        {
            group: "Pessoas & Contactos",
            items: [
                { id: 'contact_roles', label: 'Funções de Contacto', icon: <FaUserTag />, type: 'generic', targetTable: 'contact_roles' },
                { id: 'contact_titles', label: 'Tratos (Honoríficos)', icon: <FaUserTag />, type: 'generic', targetTable: 'contact_titles' },
                { id: 'user_roles', label: 'Perfis de Acesso (App)', icon: <FaUsers />, type: 'generic', targetTable: 'config_user_roles' },
            ]
        },
        {
            group: "NIS2 & Compliance",
            items: [
                { id: 'automation', label: 'Automação & Configuração Geral', icon: <FaRobot />, type: 'automation' },
                { id: 'criticality', label: 'Níveis de Criticidade', icon: <FaShieldAlt />, type: 'generic', targetTable: 'config_criticality_levels' },
                { id: 'cia_ratings', label: 'Classificação CIA', icon: <FaShieldAlt />, type: 'generic', targetTable: 'config_cia_ratings' },
                { id: 'service_status', label: 'Estados de Serviço (BIA)', icon: <FaServer />, type: 'generic', targetTable: 'config_service_statuses' },
                { id: 'backup_types', label: 'Tipos de Backup', icon: <FaServer />, type: 'generic', targetTable: 'config_backup_types' },
                { id: 'training_types', label: 'Tipos de Formação', icon: <FaGraduationCap />, type: 'generic', targetTable: 'config_training_types' },
                { id: 'resilience_types', label: 'Tipos de Teste Resiliência', icon: <FaShieldAlt />, type: 'generic', targetTable: 'config_resilience_test_types' },
            ]
        }
    ];

    // Load settings when automation view is selected
    useEffect(() => {
        if (selectedMenuId === 'automation') {
            const loadSettings = async () => {
                const freq = await dataService.getGlobalSetting('scan_frequency_days');
                const start = await dataService.getGlobalSetting('scan_start_time');
                const last = await dataService.getGlobalSetting('last_auto_scan');
                const logo = await dataService.getGlobalSetting('app_logo_url');
                
                if (freq) setScanFrequency(freq);
                if (start) setScanStartTime(start);
                if (last) setLastScanDate(new Date(last).toLocaleString());
                if (logo) setLogoUrl(logo);
            };
            loadSettings();
        }
    }, [selectedMenuId]);

    const handleSaveAutomation = async () => {
        await dataService.updateGlobalSetting('scan_frequency_days', scanFrequency);
        await dataService.updateGlobalSetting('scan_start_time', scanStartTime);
        await dataService.updateGlobalSetting('app_logo_url', logoUrl);
        alert("Configuração guardada.");
    };

    // Find current selection details
    const getCurrentSelection = () => {
        for (const group of menuStructure) {
            const found = group.items.find(i => i.id === selectedMenuId);
            if (found) return found;
        }
        return menuStructure[0].items[0];
    };

    const currentSelection = getCurrentSelection();
    const currentTableConfig = currentSelection.targetTable ? configTables.find(t => t.tableName === currentSelection.targetTable) : null;

    // Helper to check if item is in use
    const checkUsage = (tableName: string, item: ConfigItem): boolean => {
        const name = item.name;
        switch (tableName) {
            case 'config_equipment_statuses':
                return equipment.some(e => e.status === name);
            case 'config_user_roles':
                return collaborators.some(c => c.role === name);
            case 'config_criticality_levels':
                return equipment.some(e => e.criticality === name) || 
                       softwareLicenses.some(l => l.criticality === name) ||
                       businessServices.some(s => s.criticality === name) ||
                       vulnerabilities.some(v => v.severity === name);
            case 'config_cia_ratings':
                return equipment.some(e => e.confidentiality === name || e.integrity === name || e.availability === name) ||
                       softwareLicenses.some(l => l.confidentiality === name || l.integrity === name || l.availability === name);
            case 'config_service_statuses':
                return businessServices.some(s => s.status === name);
            case 'config_backup_types':
                return backupExecutions.some(b => b.type === name);
            case 'config_training_types':
                return securityTrainings.some(t => t.training_type === name);
            case 'config_resilience_test_types':
                return resilienceTests.some(t => t.test_type === name);
            case 'contact_titles': {
                if (collaborators.some(c => c.title === name)) return true;
                const allContacts = [
                    ...suppliers.flatMap(s => s.contacts || []),
                    ...entidades.flatMap(e => e.contacts || []),
                    ...instituicoes.flatMap(i => i.contacts || [])
                ];
                return allContacts.some(c => c.title === name);
            }
            case 'contact_roles': {
                const allContacts = [
                    ...suppliers.flatMap(s => s.contacts || []),
                    ...entidades.flatMap(e => e.contacts || []),
                    ...instituicoes.flatMap(i => i.contacts || [])
                ];
                return allContacts.some(c => c.role === name);
            }
            default:
                return false;
        }
    };

    // Generic Handlers
    const handleGenericAdd = async () => {
        if (currentSelection.type !== 'generic' || !currentTableConfig) return;
        
        if (!newItemName.trim()) {
            setError('O nome é obrigatório.');
            return;
        }
        try {
            await dataService.addConfigItem(currentTableConfig.tableName, { name: newItemName.trim() });
            setNewItemName('');
            setError('');
            onRefresh();
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Erro ao adicionar item. Verifique se a tabela existe na base de dados.');
        }
    };

    const handleGenericUpdate = async () => {
        if (currentSelection.type !== 'generic' || !currentTableConfig) return;

        if (!editingItem || !editingItem.name.trim()) return;
        try {
            await dataService.updateConfigItem(currentTableConfig.tableName, editingItem.id, { name: editingItem.name.trim() });
            setEditingItem(null);
            setError('');
            onRefresh();
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Erro ao atualizar item.');
        }
    };

    const handleGenericDelete = async (id: string) => {
        if (currentSelection.type !== 'generic' || !currentTableConfig) return;

        if (!confirm("Tem a certeza que deseja excluir este item?")) return;
        try {
            await dataService.deleteConfigItem(currentTableConfig.tableName, id);
            onRefresh();
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Erro ao excluir item.');
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
            {/* Sidebar Menu */}
            <div className="w-full lg:w-64 bg-surface-dark rounded-lg shadow-xl border border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
                <div className="p-4 border-b border-gray-700 bg-gray-900">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FaCog className="text-brand-secondary" />
                        Configurações
                    </h2>
                </div>
                <div className="overflow-y-auto flex-grow p-2 space-y-4 custom-scrollbar">
                    {menuStructure.map((group, gIdx) => (
                        <div key={gIdx}>
                            <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group.group}</h3>
                            <div className="space-y-1">
                                {group.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => { setSelectedMenuId(item.id); setError(''); setNewItemName(''); setEditingItem(null); }}
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
            <div className="flex-1 bg-surface-dark rounded-lg shadow-xl border border-gray-700 overflow-hidden flex flex-col">
                {/* Generic Table Editor */}
                {currentSelection.type === 'generic' && currentTableConfig && (
                    <div className="p-6 h-full flex flex-col">
                        <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                            Gerir: {currentSelection.label}
                        </h2>
                        
                        <div className="mb-4 flex gap-2">
                            <input
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder={`Novo item...`}
                                className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenericAdd()}
                            />
                            <button onClick={handleGenericAdd} className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary flex items-center gap-2">
                                <PlusIcon className="h-4 w-4" /> Adicionar
                            </button>
                        </div>

                        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm mb-4 border border-red-500/50">{error}</div>}

                        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex-grow overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-900 text-gray-400 uppercase text-xs sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Nome</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {currentTableConfig.data.length > 0 ? (
                                        currentTableConfig.data.sort((a,b) => a.name.localeCompare(b.name)).map(item => {
                                            const isUsed = checkUsage(currentTableConfig.tableName, item);
                                            
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-700/50">
                                                    <td className="px-4 py-3">
                                                        {editingItem?.id === item.id ? (
                                                            <input
                                                                type="text"
                                                                value={editingItem.name}
                                                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                                className="w-full bg-gray-600 border border-gray-500 text-white rounded p-1"
                                                                autoFocus
                                                                onKeyDown={(e) => e.key === 'Enter' && handleGenericUpdate()}
                                                            />
                                                        ) : (
                                                            <span className="text-white">{item.name}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {editingItem?.id === item.id ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={handleGenericUpdate} className="text-green-400 hover:text-green-300"><FaSave /></button>
                                                                <button onClick={() => setEditingItem(null)} className="text-red-400 hover:text-red-300"><FaTimes /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => setEditingItem(item)} className="text-blue-400 hover:text-blue-300"><EditIcon /></button>
                                                                <button 
                                                                    onClick={() => handleGenericDelete(item.id)} 
                                                                    className={isUsed ? "text-gray-600 cursor-not-allowed" : "text-red-400 hover:text-red-300"}
                                                                    disabled={isUsed}
                                                                    title={isUsed ? "Este item está a ser utilizado e não pode ser apagado." : "Excluir"}
                                                                >
                                                                    {isUsed ? <FaLock className="h-3 w-3"/> : <DeleteIcon />}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className="p-4 text-center text-gray-500 italic">Nenhum item registado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Complex Views */}
                {currentSelection.type === 'brands' && (
                    <div className="h-full overflow-y-auto">
                        <BrandDashboard brands={brands} equipment={equipment} onCreate={onCreateBrand} onEdit={onEditBrand} onDelete={onDeleteBrand} />
                    </div>
                )}
                {currentSelection.type === 'equipment_types' && (
                    <div className="h-full overflow-y-auto">
                        <EquipmentTypeDashboard equipmentTypes={equipmentTypes} equipment={equipment} onCreate={onCreateType} onEdit={onEditType} onDelete={onDeleteType} />
                    </div>
                )}
                {currentSelection.type === 'ticket_categories' && (
                    <div className="h-full overflow-y-auto">
                        <CategoryDashboard categories={ticketCategories} tickets={tickets} teams={teams} onCreate={onCreateCategory} onEdit={onEditCategory} onDelete={onDeleteCategory} onToggleStatus={onToggleCategoryStatus} />
                    </div>
                )}
                {currentSelection.type === 'incident_types' && (
                    <div className="h-full overflow-y-auto">
                        <SecurityIncidentTypeDashboard incidentTypes={securityIncidentTypes} tickets={tickets} onCreate={onCreateIncidentType} onEdit={onEditIncidentType} onDelete={onDeleteIncidentType} onToggleStatus={onToggleIncidentTypeStatus} />
                    </div>
                )}
                
                {/* Automation View */}
                {currentSelection.type === 'automation' && (
                    <div className="p-6 h-full overflow-y-auto">
                        <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                            <FaCog className="text-brand-secondary" /> Configuração Geral & Automação
                        </h2>
                        
                        <div className="space-y-6">
                            {/* Branding Section */}
                            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaImage className="text-blue-400"/> Personalização (Branding)</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Defina o logotipo da sua organização para aparecer nos cabeçalhos dos relatórios impressos.
                                </p>
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase mb-1">URL do Logotipo</label>
                                    <input 
                                        type="text" 
                                        value={logoUrl}
                                        onChange={(e) => setLogoUrl(e.target.value)}
                                        placeholder="https://exemplo.com/logo.png"
                                        className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm w-full"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">O URL deve ser acessível publicamente ou na rede local.</p>
                                </div>
                            </div>

                            {/* Automation Section */}
                            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaRobot className="text-purple-400"/> Auto Scan de Vulnerabilidades</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Define a frequência com que a IA analisa automaticamente o inventário de software e hardware em busca de CVEs (Vulnerabilidades Conhecidas).
                                    Se forem detetadas vulnerabilidades críticas, <strong>tickets são criados automaticamente</strong>.
                                </p>
                                
                                <div className="flex items-center gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase mb-1">Frequência</label>
                                        <select 
                                            value={scanFrequency}
                                            onChange={(e) => setScanFrequency(e.target.value)}
                                            className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm w-48"
                                        >
                                            <option value="0">Desativado</option>
                                            <option value="1">Diário (24h)</option>
                                            <option value="7">Semanal</option>
                                            <option value="30">Mensal</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase mb-1">Hora de Início</label>
                                        <input 
                                            type="time" 
                                            value={scanStartTime}
                                            onChange={(e) => setScanStartTime(e.target.value)}
                                            className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm w-32"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase mb-1">Última Execução</label>
                                        <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-800 p-2 rounded border border-gray-700 min-w-[150px]">
                                            <FaClock /> {lastScanDate}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button onClick={handleSaveAutomation} className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-secondary transition-colors flex items-center gap-2">
                                    <FaSave /> Guardar Configuração
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuxiliaryDataDashboard;
