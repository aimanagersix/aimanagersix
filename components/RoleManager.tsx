
import React, { useState, useEffect } from 'react';
import { CustomRole, PermissionMatrix, ModuleKey, PermissionAction } from '../types';
import { FaPlus, FaCheck, FaTimes, FaLock, FaInfoCircle, FaChevronDown, FaChevronRight, FaFingerprint, FaShieldAlt } from 'react-icons/fa';
import { EditIcon, FaTrash as DeleteIcon, FaSave, FaTrash } from './common/Icons';
import * as dataService from '../services/dataService';

interface RoleManagerProps {
    roles: CustomRole[];
    onRefresh: () => void;
}

interface PermissionGroup {
    label: string;
    items: { key: ModuleKey; label: string }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        label: 'Configuração: Dashboard Widgets',
        items: [
            { key: 'widget_alerts', label: 'Alertas de Segurança' },
            { key: 'widget_kpi_cards', label: 'Cartões KPI (Topo)' },
            { key: 'widget_inventory_charts', label: 'Gráficos de Inventário' },
            { key: 'widget_financial', label: 'Resumo Financeiro' },
            { key: 'widget_operational_charts', label: 'Gráficos Operacionais (Idade/Tickets)' },
            { key: 'widget_activity', label: 'Atividade Recente' },
        ]
    },
    {
        label: 'Módulos Principais',
        items: [
            { key: 'equipment', label: 'Inventário de Equipamentos' },
            { key: 'licensing', label: 'Licenciamento de Software' },
            { key: 'tickets', label: 'Suporte & Tickets' },
            { key: 'organization', label: 'Organização (RH/Entidades)' },
            { key: 'suppliers', label: 'Fornecedores' },
            { key: 'procurement', label: 'Aquisições (Procurement)' },
            { key: 'reports', label: 'Relatórios' },
            { key: 'settings', label: 'Configurações (Geral)' },
            { key: 'dashboard_smart', label: 'Dashboard (C-Level)' },
        ]
    },
    {
        label: 'Módulos de Compliance (NIS2/DORA)',
        items: [
            { key: 'compliance_bia', label: 'BIA (Serviços de Negócio)' },
            { key: 'compliance_security', label: 'Segurança (Vulnerabilidades/CVE)' },
            { key: 'compliance_backups', label: 'Backups & Restauros' },
            { key: 'compliance_resilience', label: 'Testes de Resiliência' },
            { key: 'compliance_training', label: 'Formação & Consciencialização' },
            { key: 'compliance_policies', label: 'Políticas & Governance' },
            { key: 'compliance_continuity', label: 'Planos de Continuidade' },
        ]
    },
    {
        label: 'Tabelas de Configuração (Equipamentos)',
        items: [
            { key: 'brands', label: 'Marcas' },
            { key: 'equipment_types', label: 'Tipos de Equipamento' },
            { key: 'config_equipment_statuses', label: 'Estados de Equipamento' },
            { key: 'config_decommission_reasons', label: 'Motivos de Saída/Abate' },
            { key: 'config_conservation_states', label: 'Estados de Conservação' },
            { key: 'config_accounting_categories', label: 'Classificador CIBE/Legal' },
            { key: 'config_cpus', label: 'CPUs' },
            { key: 'config_ram_sizes', label: 'Tamanhos RAM' },
            { key: 'config_storage_types', label: 'Tipos de Disco' },
        ]
    },
    {
        label: 'Tabelas de Configuração (Software)',
        items: [
            { key: 'config_software_categories', label: 'Categorias de Software' },
            { key: 'config_software_products', label: 'Produtos de Software' },
        ]
    },
    {
        label: 'Tabelas de Configuração (Suporte & RH)',
        items: [
            { key: 'ticket_categories', label: 'Categorias de Tickets' },
            { key: 'security_incident_types', label: 'Tipos de Incidente de Segurança' },
            { key: 'config_job_titles', label: 'Cargos e Funções' },
            { key: 'config_collaborator_deactivation_reasons', label: 'Motivos de Inativação' },
            { key: 'contact_roles', label: 'Papéis de Contacto' },
            { key: 'contact_titles', label: 'Tratos Honoríficos' },
            { key: 'config_custom_roles', label: 'Perfis de Acesso (RBAC)' },
            { key: 'config_automation', label: 'Regras de Automação' },
        ]
    }
];

const ACTIONS: { key: PermissionAction; label: string }[] = [
    { key: 'view', label: 'Ver' },
    { key: 'create', label: 'Criar' },
    { key: 'edit', label: 'Editar' },
    { key: 'manage', label: 'Gerir' },
    { key: 'delete', label: 'Apagar' },
];

const RoleManager: React.FC<RoleManagerProps> = ({ roles, onRefresh }) => {
    const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedPermissions, setEditedPermissions] = useState<PermissionMatrix>({});
    const [requiresMfa, setRequiresMfa] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [showNewRoleInput, setShowNewRoleInput] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!selectedRole && roles.length > 0) {
            setSelectedRole(roles[0]);
        }
    }, [roles, selectedRole]);

    useEffect(() => {
        if (selectedRole) {
            setEditedPermissions(JSON.parse(JSON.stringify(selectedRole.permissions || {})));
            setRequiresMfa(selectedRole.requires_mfa || false);
        }
    }, [selectedRole]);

    const toggleGroup = (label: string) => {
        setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const handlePermissionChange = (module: ModuleKey, action: PermissionAction, value: boolean) => {
        setEditedPermissions(prev => ({
            ...prev,
            [module]: {
                ...(prev[module] || { view: false, create: false, edit: false, manage: false, delete: false }),
                [action]: value
            }
        }));
    };
    
    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        try {
            await dataService.updateCustomRole(selectedRole.id, { permissions: editedPermissions, requires_mfa: requiresMfa });
            alert("Permissões atualizadas com sucesso!");
            setIsEditing(false);
            onRefresh();
        } catch (e) {
            console.error(e);
            alert("Erro ao guardar permissões.");
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) return;
        try {
            await dataService.addCustomRole({
                name: newRoleName.trim(),
                permissions: {},
                is_system: false
            });
            setNewRoleName('');
            setShowNewRoleInput(false);
            onRefresh();
        } catch (e: any) {
            alert("Erro ao criar perfil: " + e.message);
        }
    };

    return (
        <div className="flex flex-col md:flex-row bg-surface-dark text-white min-h-[600px]">
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col bg-gray-900/50 flex-shrink-0">
                <div className="p-4 border-b border-gray-700">
                    <h3 className="font-bold flex items-center gap-2"><FaShieldAlt className="text-purple-500"/> Perfis de Acesso</h3>
                </div>
                <div className="p-2 space-y-1 overflow-y-auto">
                    {roles.map(role => (
                        <div 
                            key={role.id}
                            onClick={() => { setSelectedRole(role); setIsEditing(false); }}
                            className={`flex justify-between items-center p-3 rounded cursor-pointer transition-colors ${selectedRole?.id === role.id ? 'bg-brand-primary text-white' : 'hover:bg-gray-800 text-gray-400'}`}
                        >
                            <span className="font-medium text-sm">{role.name}</span>
                            {role.is_system && <FaLock className="h-3 w-3 opacity-50" />}
                        </div>
                    ))}
                </div>
                <div className="p-3 border-t border-gray-700 mt-auto">
                    {!showNewRoleInput ? (
                        <button onClick={() => setShowNewRoleInput(true)} className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 p-2 rounded text-sm text-gray-300 border border-gray-600">
                            <FaPlus /> Novo Perfil
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 text-sm" placeholder="Nome..." autoFocus />
                            <button onClick={handleCreateRole} className="bg-green-600 p-2 rounded text-white"><FaCheck/></button>
                            <button onClick={() => setShowNewRoleInput(false)} className="bg-red-600 p-2 rounded text-white"><FaTimes/></button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedRole ? (
                    <>
                        <div className="p-6 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center bg-surface-dark gap-4">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    {selectedRole.name}
                                    {selectedRole.is_system && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Sistema</span>}
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">Configure o acesso aos módulos.</p>
                            </div>
                            <div className="flex gap-3">
                                {isEditing ? (
                                    <>
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Cancelar</button>
                                        <button onClick={handleSavePermissions} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 flex items-center gap-2">
                                            <FaSave /> Guardar
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary flex items-center gap-2">
                                        <EditIcon /> Editar Permissões
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-6 pb-10">
                                {PERMISSION_GROUPS.map((group, gIdx) => (
                                    <div key={gIdx} className="border border-gray-700 rounded-lg overflow-hidden">
                                        <div className="bg-gray-800 p-3 flex justify-between items-center cursor-pointer" onClick={() => toggleGroup(group.label)}>
                                            <h4 className="font-bold text-gray-300 text-sm uppercase tracking-wider">{group.label}</h4>
                                            {collapsedGroups[group.label] ? <FaChevronRight className="text-gray-500"/> : <FaChevronDown className="text-gray-500"/>}
                                        </div>
                                        
                                        {!collapsedGroups[group.label] && (
                                            <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse bg-gray-900/30">
                                                <thead>
                                                    <tr>
                                                        <th className="p-3 border-b border-gray-700 text-gray-500 font-medium text-xs w-1/3">Módulo</th>
                                                        {ACTIONS.map(action => (
                                                            <th key={action.key} className="p-3 border-b border-gray-700 text-gray-500 font-medium text-xs text-center">{action.label}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.items.map(item => (
                                                        <tr key={item.key} className="hover:bg-gray-800/50 border-b border-gray-800 last:border-0">
                                                            <td className="p-3 text-sm font-medium text-gray-300 pl-4">{item.label}</td>
                                                            {ACTIONS.map(action => (
                                                                <td key={action.key} className="p-3 text-center">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={editedPermissions[item.key]?.[action.key] || false}
                                                                        onChange={(e) => handlePermissionChange(item.key, action.key, e.target.checked)}
                                                                        disabled={!isEditing}
                                                                        className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-brand-primary focus:ring-brand-secondary disabled:opacity-30"
                                                                    />
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">Selecione um perfil.</div>
                )}
            </div>
        </div>
    );
};

export default RoleManager;
