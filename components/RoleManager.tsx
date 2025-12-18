
import React, { useState, useEffect } from 'react';
import { CustomRole, ModuleKey, PermissionAction } from '../types';
import * as dataService from '../services/dataService';
import { FaShieldAlt, FaSave, FaPlus, FaTrash, FaCheck, FaTimes, FaLock, FaUserShield, FaCheckDouble, FaSpinner, FaUserCheck, FaUserTie } from 'react-icons/fa';

interface PermissionItem {
    key: ModuleKey;
    label: string;
    supportsOwn?: boolean;
    isSimpleAccess?: boolean; // Nova flag para permissões tipo ON/OFF
}

interface PermissionGroup {
    label: string;
    items: PermissionItem[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        label: 'Área Pessoal (Self-Service)',
        items: [
            { key: 'my_area', label: 'Acesso à Minha Área (Dashboard Pessoal)', isSimpleAccess: true },
        ]
    },
    {
        label: 'Painéis de Controlo (Dashboards)',
        items: [
            { key: 'widget_alerts', label: 'Alertas de Segurança NIS2', isSimpleAccess: true },
            { key: 'widget_kpi_cards', label: 'Métricas Globais (Contagens)', isSimpleAccess: true },
            { key: 'widget_inventory_charts', label: 'Gráficos de Inventário', isSimpleAccess: true },
            { key: 'widget_financial', label: 'Dados Financeiros (Custos)', isSimpleAccess: true },
            { key: 'dashboard_smart', label: 'Dashboard Executivo (C-Level)', isSimpleAccess: true },
        ]
    },
    {
        label: 'Módulos de Gestão',
        items: [
            { key: 'equipment', label: 'Equipamentos', supportsOwn: true },
            { key: 'licensing', label: 'Licenciamento', supportsOwn: true },
            { key: 'tickets', label: 'Service Desk (Tickets)', supportsOwn: true },
            { key: 'organization', label: 'Estrutura e RH' },
            { key: 'suppliers', label: 'Fornecedores' },
            { key: 'procurement', label: 'Aquisições' },
            { key: 'reports', label: 'Relatórios e BI' },
        ]
    },
    {
        label: 'Compliance (NIS2/DORA)',
        items: [
            { key: 'compliance_bia', label: 'Análise de Impacto (BIA)' },
            { key: 'compliance_security', label: 'Vulnerabilidades (CVE)' },
            { key: 'compliance_backups', label: 'Controlo de Backups', supportsOwn: true },
            { key: 'compliance_resilience', label: 'Testes de Resiliência' },
            { key: 'compliance_training', label: 'Formações de Segurança', supportsOwn: true },
            { key: 'compliance_policies', label: 'Políticas e Governança', supportsOwn: true },
        ]
    },
    {
        label: 'Administração',
        items: [
            { key: 'settings', label: 'Configurações de Sistema' },
            { key: 'config_custom_roles', label: 'Perfis de Acesso (RBAC)' },
            { key: 'config_automation', label: 'Regras de Automação' },
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
    const isSuperAdminRole = selectedRole?.name === 'SuperAdmin';

    useEffect(() => {
        if (selectedRole) {
            setEditingPermissions(selectedRole.permissions || {});
        } else {
            setEditingPermissions({});
        }
    }, [selectedRole]);

    const handleTogglePermission = (moduleKey: string, action: PermissionAction) => {
        if (isSuperAdminRole) return;
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

    const handleSelectAll = () => {
        if (isSuperAdminRole) return;
        const allPerms: Record<string, any> = {};
        PERMISSION_GROUPS.forEach(group => {
            group.items.forEach(item => {
                allPerms[item.key] = { view: true, create: true, edit: true, delete: true, view_own: true };
            });
        });
        setEditingPermissions(allPerms);
    };

    const handleSavePermissions = async () => {
        if (!selectedRoleId || isSuperAdminRole) return;
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

    const handleDeleteRole = async (id: string, name: string) => {
        if (name === 'SuperAdmin' || name === 'Admin') {
            alert("Perfis de sistema não podem ser removidos.");
            return;
        }
        if (!confirm(`Apagar perfil "${name}"?`)) return;
        try {
            await dataService.deleteConfigItem('config_custom_roles', id);
            setSelectedRoleId(null);
            onRefresh();
        } catch (e) {
            alert("Erro ao apagar perfil.");
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 p-6">
            <div className="w-full md:w-64 bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-white text-xs uppercase tracking-widest">Perfis</h3>
                    <button onClick={() => setShowNewRoleInput(true)} className="p-1.5 bg-brand-primary text-white rounded hover:bg-brand-secondary"><FaPlus size={10} /></button>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {showNewRoleInput && (
                        <div className="p-2 bg-gray-700 rounded mb-2 border border-brand-primary">
                            <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="w-full bg-gray-900 text-white text-xs p-1.5 rounded mb-2" placeholder="Nome..." autoFocus />
                            <div className="flex gap-2">
                                <button onClick={handleCreateRole} className="flex-1 bg-green-600 text-white text-[10px] py-1 rounded font-bold">OK</button>
                                <button onClick={() => setShowNewRoleInput(false)} className="flex-1 bg-gray-600 text-white text-[10px] py-1 rounded">X</button>
                            </div>
                        </div>
                    )}
                    {roles.map(role => (
                        <div key={role.id} className="group relative">
                            <button onClick={() => setSelectedRoleId(role.id)} className={`w-full text-left px-3 py-2.5 rounded text-sm transition-colors flex justify-between items-center ${selectedRoleId === role.id ? 'bg-brand-primary text-white font-bold' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                                <span className="truncate pr-4">{role.name}</span>
                                {role.name === 'SuperAdmin' && <FaLock className="text-[10px] opacity-50" />}
                            </button>
                            {role.name !== 'SuperAdmin' && role.name !== 'Admin' && (
                                <button onClick={() => handleDeleteRole(role.id, role.name)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-red-400 hover:bg-red-900/30 rounded opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash size={10} /></button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 flex flex-col overflow-hidden">
                {!selectedRoleId ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-500 space-y-4">
                        <FaUserShield size={48} className="opacity-10" />
                        <p>Selecione um perfil para gerir permissões.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">{selectedRole?.name}</h3>
                                <p className="text-xs text-gray-400">Configure o acesso granular para este perfil.</p>
                            </div>
                            {!isSuperAdminRole && (
                                <div className="flex gap-2">
                                    <button onClick={handleSelectAll} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">Selecionar Tudo</button>
                                    <button onClick={handleSavePermissions} disabled={isSaving} className="bg-brand-primary hover:bg-brand-secondary text-white px-4 py-1.5 rounded text-xs font-bold disabled:opacity-50 transition-all shadow-lg flex items-center gap-2">
                                        {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />} Guardar
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                            <div className={`space-y-8 ${isSuperAdminRole ? 'opacity-40 pointer-events-none' : ''}`}>
                                {PERMISSION_GROUPS.map(group => (
                                    <div key={group.label} className="space-y-3">
                                        <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-widest border-b border-gray-700 pb-1">{group.label}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {group.items.map(item => {
                                                const perms = editingPermissions[item.key] || {};
                                                return (
                                                    <div key={item.key} className="bg-gray-900/50 p-3 rounded border border-gray-700">
                                                        <p className="text-sm font-bold text-white mb-3">{item.label}</p>
                                                        <div className="flex flex-col gap-2">
                                                            {item.isSimpleAccess ? (
                                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                                    <input type="checkbox" checked={!!perms.view} onChange={() => handleTogglePermission(item.key, 'view')} className="rounded border-gray-600 bg-gray-800 text-brand-primary" />
                                                                    <span className={`text-[10px] uppercase font-bold ${perms.view ? 'text-green-400' : 'text-gray-500'}`}>Acesso Permitido</span>
                                                                </label>
                                                            ) : (
                                                                <>
                                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                                        <input type="checkbox" checked={!!perms.view} onChange={() => handleTogglePermission(item.key, 'view')} className="rounded border-gray-600 bg-gray-800 text-brand-primary" />
                                                                        <span className={`text-[10px] uppercase font-bold ${perms.view ? 'text-green-400' : 'text-gray-500'}`}>Ver Global (Tudo)</span>
                                                                    </label>
                                                                    {item.supportsOwn && (
                                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                                            <input type="checkbox" checked={!!perms.view_own} onChange={() => handleTogglePermission(item.key, 'view_own')} className="rounded border-gray-600 bg-gray-800 text-blue-500" />
                                                                            <span className={`text-[10px] uppercase font-bold flex items-center gap-1 ${perms.view_own ? 'text-blue-400' : 'text-gray-500'}`}><FaUserCheck className="text-[10px]"/> Ver Próprios</span>
                                                                        </label>
                                                                    )}
                                                                    <div className="grid grid-cols-3 gap-1 mt-1 border-t border-gray-700 pt-2">
                                                                        {['create', 'edit', 'delete'].map(action => (
                                                                             <label key={action} className="flex flex-col items-center gap-1 cursor-pointer">
                                                                                <input type="checkbox" checked={!!perms[action]} onChange={() => handleTogglePermission(item.key, action as any)} className="rounded border-gray-600 bg-gray-800 text-brand-primary" />
                                                                                <span className="text-[8px] uppercase text-gray-500">{action === 'create' ? 'CRIAR' : action === 'edit' ? 'EDIT' : 'DEL'}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
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
