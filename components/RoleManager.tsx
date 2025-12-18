
import React, { useState, useEffect } from 'react';
import { CustomRole, ModuleKey, PermissionAction } from '../types';
import * as dataService from '../services/dataService';
import { FaShieldAlt, FaSave, FaPlus, FaTrash, FaCheck, FaTimes, FaLock, FaUserShield } from 'react-icons/fa';

interface PermissionItem {
    key: ModuleKey;
    label: string;
}

interface PermissionGroup {
    label: string;
    items: PermissionItem[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        label: 'Acesso Pessoal (Self-Service)',
        items: [
            { key: 'my_area', label: 'A Minha Área (Meus Ativos/Formações)' },
        ]
    },
    {
        label: 'Configuração: Dashboard Widgets',
        items: [
            { key: 'widget_alerts', label: 'Alertas de Segurança' },
            { key: 'widget_kpi_cards', label: 'Cartões KPI (Contagens)' },
            { key: 'widget_inventory_charts', label: 'Gráficos de Inventário' },
            { key: 'widget_financial', label: 'Dados Financeiros (Custos)' },
            { key: 'widget_operational_charts', label: 'Gráficos Operacionais' },
            { key: 'widget_activity', label: 'Histórico de Atividade' },
        ]
    },
    {
        label: 'Módulos Operacionais',
        items: [
            { key: 'equipment', label: 'Gestão de Equipamentos' },
            { key: 'licensing', label: 'Gestão de Licenciamento' },
            { key: 'tickets', label: 'Service Desk (Tickets)' },
            { key: 'organization', label: 'Estrutura Organizacional' },
            { key: 'suppliers', label: 'Gestão de Fornecedores' },
            { key: 'procurement', label: 'Aquisições / Compras' },
            { key: 'reports', label: 'Relatórios e BI' },
            { key: 'dashboard_smart', label: 'Dashboard C-Level' },
        ]
    },
    {
        label: 'Módulos Compliance (NIS2/DORA)',
        items: [
            { key: 'compliance_bia', label: 'Análise de Impacto (BIA)' },
            { key: 'compliance_security', label: 'Vulnerabilidades (CVE)' },
            { key: 'compliance_backups', label: 'Controlo de Backups' },
            { key: 'compliance_resilience', label: 'Testes de Resiliência' },
            { key: 'compliance_training', label: 'Registo de Formações' },
            { key: 'compliance_policies', label: 'Políticas de Segurança' },
            { key: 'compliance_continuity', label: 'Planos de Continuidade' },
        ]
    },
    {
        label: 'Administração e Tabelas Auxiliares',
        items: [
            { key: 'settings', label: 'Configurações Globais' },
            { key: 'config_custom_roles', label: 'Gestão de Perfis (RBAC)' },
            { key: 'config_automation', label: 'Regras de Automação' },
            { key: 'brands', label: 'Tabela de Marcas' },
            { key: 'equipment_types', label: 'Tipos de Equipamento' },
        ]
    }
];

interface RoleManagerProps {
    roles: CustomRole[];
    onRefresh: () => void;
}

const RoleManager: React.FC<RoleManagerProps> = ({ roles, onRefresh }) => {
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [editingPermissions, setEditingPermissions] = useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [showNewRoleInput, setShowNewRoleInput] = useState(false);

    const selectedRole = roles.find(r => r.id === selectedRoleId);

    useEffect(() => {
        if (selectedRole) {
            setEditingPermissions(selectedRole.permissions || {});
        } else {
            setEditingPermissions({});
        }
    }, [selectedRole]);

    const handleTogglePermission = (moduleKey: string, action: PermissionAction) => {
        setEditingPermissions(prev => {
            const modulePerms = prev[moduleKey] || {};
            return {
                ...prev,
                [moduleKey]: {
                    ...modulePerms,
                    [action]: !modulePerms[action]
                }
            };
        });
    };

    const handleSavePermissions = async () => {
        if (!selectedRoleId) return;
        setIsSaving(true);
        try {
            await dataService.updateCustomRole(selectedRoleId, { permissions: editingPermissions });
            onRefresh();
            alert("Permissões atualizadas com sucesso.");
        } catch (e) {
            console.error(e);
            alert("Erro ao gravar permissões.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) return;
        try {
            await dataService.addCustomRole({ 
                name: newRoleName.trim(), 
                description: 'Perfil personalizado',
                permissions: {} 
            });
            setNewRoleName('');
            setShowNewRoleInput(false);
            onRefresh();
        } catch (e) {
            console.error(e);
            alert("Erro ao criar perfil.");
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 p-6">
            {/* Sidebar: Role List */}
            <div className="w-full md:w-64 bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">Perfis de Acesso</h3>
                    <button 
                        onClick={() => setShowNewRoleInput(true)} 
                        className="p-1.5 bg-brand-primary text-white rounded hover:bg-brand-secondary"
                    >
                        <FaPlus size={12} />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-2 space-y-1">
                    {showNewRoleInput && (
                        <div className="p-2 bg-gray-700 rounded mb-2">
                            <input 
                                type="text" 
                                value={newRoleName}
                                onChange={e => setNewRoleName(e.target.value)}
                                className="w-full bg-gray-900 text-white text-xs p-1.5 rounded mb-2 outline-none border border-brand-primary"
                                placeholder="Nome do perfil..."
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button onClick={handleCreateRole} className="flex-1 bg-green-600 text-white text-[10px] py-1 rounded">OK</button>
                                <button onClick={() => setShowNewRoleInput(false)} className="flex-1 bg-gray-600 text-white text-[10px] py-1 rounded">X</button>
                            </div>
                        </div>
                    )}
                    
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRoleId(role.id)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedRoleId === role.id ? 'bg-brand-primary text-white font-bold' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                        >
                            {role.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main: Permissions Grid */}
            <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 flex flex-col overflow-hidden">
                {!selectedRoleId ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-500 space-y-4">
                        <FaUserShield size={48} className="opacity-20" />
                        <p>Selecione um perfil à esquerda para gerir as suas permissões.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-white">{selectedRole?.name}</h3>
                                <p className="text-xs text-gray-400">Configure o acesso granular para cada módulo.</p>
                            </div>
                            <button 
                                onClick={handleSavePermissions}
                                disabled={isSaving}
                                className="bg-brand-primary hover:bg-brand-secondary text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-bold disabled:opacity-50"
                            >
                                {isSaving ? <FaLock className="animate-spin" /> : <FaSave />}
                                Guardar Alterações
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                            <div className="space-y-8">
                                {PERMISSION_GROUPS.map(group => (
                                    <div key={group.label} className="space-y-3">
                                        <h4 className="text-xs font-black text-brand-secondary uppercase tracking-widest border-b border-gray-700 pb-1">
                                            {group.label}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {group.items.map(item => {
                                                const perms = editingPermissions[item.key] || {};
                                                return (
                                                    <div key={item.key} className="bg-gray-900/50 p-3 rounded border border-gray-700">
                                                        <p className="text-sm font-bold text-white mb-3">{item.label}</p>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                            {(['view', 'create', 'edit', 'delete'] as PermissionAction[]).map(action => (
                                                                <label key={action} className="flex items-center gap-2 cursor-pointer group">
                                                                    <input 
                                                                        type="checkbox"
                                                                        checked={!!perms[action]}
                                                                        onChange={() => handleTogglePermission(item.key, action)}
                                                                        className="rounded border-gray-600 bg-gray-800 text-brand-primary focus:ring-brand-primary"
                                                                    />
                                                                    <span className={`text-[10px] uppercase font-bold ${perms[action] ? 'text-green-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                                                        {action === 'view' ? 'Ver' : action === 'create' ? 'Criar' : action === 'edit' ? 'Edit' : 'Del'}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RoleManager;
