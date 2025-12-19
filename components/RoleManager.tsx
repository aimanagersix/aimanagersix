
import React, { useState, useEffect } from 'react';
import { CustomRole, ModuleKey, PermissionAction } from '../types';
import * as dataService from '../services/dataService';
import { FaShieldAlt, FaSave, FaPlus, FaTrash, FaCheck, FaTimes, FaLock, FaUserShield, FaCheckDouble, FaSpinner, FaUserCheck, FaUserTie } from 'react-icons/fa';

interface PermissionItem {
    key: ModuleKey;
    label: string;
    supportsOwn?: boolean;
    isSimpleAccess?: boolean;
}

interface PermissionGroup {
    label: string;
    items: PermissionItem[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        label: 'Área Pessoal & Dashboard',
        items: [
            { key: 'my_area', label: 'Minha Área', isSimpleAccess: true },
            { key: 'widget_alerts', label: 'Dashboard: Alertas Segurança', isSimpleAccess: true },
            { key: 'widget_kpi_cards', label: 'Dashboard: Cartões KPI Principais', isSimpleAccess: true },
            { key: 'widget_inventory_charts', label: 'Dashboard: Gráficos Inventário', isSimpleAccess: true },
            { key: 'widget_financial', label: 'Dashboard: Visão Financeira', isSimpleAccess: true },
            { key: 'widget_operational_charts', label: 'Dashboard: Gráficos Operacionais', isSimpleAccess: true },
            { key: 'widget_activity', label: 'Dashboard: Atividade Recente', isSimpleAccess: true },
            { key: 'dashboard_smart', label: 'Dashboard: C-Level / Gestão', isSimpleAccess: true },
        ]
    },
    {
        label: 'Módulos Operacionais',
        items: [
            { key: 'equipment', label: 'Equipamentos', supportsOwn: true },
            { key: 'licensing', label: 'Licenciamento', supportsOwn: true },
            { key: 'tickets', label: 'Suporte (Tickets)', supportsOwn: true },
            { key: 'organization', label: 'Estrutura e RH' },
            { key: 'suppliers', label: 'Fornecedores' },
            { key: 'procurement', label: 'Aquisições' },
        ]
    },
    {
        label: 'Compliance (NIS2)',
        items: [
            { key: 'compliance_bia', label: 'Impacto (BIA)' },
            { key: 'compliance_security', label: 'Vulnerabilidades' },
            { key: 'compliance_backups', label: 'Backups', supportsOwn: true },
            { key: 'compliance_resilience', label: 'Resiliência', supportsOwn: true },
            { key: 'compliance_training', label: 'Formações', supportsOwn: true },
            { key: 'compliance_policies', label: 'Políticas', supportsOwn: true },
        ]
    },
    {
        label: 'Tabelas Auxiliares (Configuração)',
        items: [
            { key: 'brands', label: 'Marcas' },
            { key: 'equipment_types', label: 'Tipos de Ativo' },
            { key: 'config_equipment_statuses', label: 'Estados de Ativo' },
            { key: 'config_cpus', label: 'CPUs' },
            { key: 'config_ram_sizes', label: 'RAM' },
            { key: 'config_storage_types', label: 'Discos' },
            { key: 'config_software_categories', label: 'Categorias Software' },
            { key: 'config_software_products', label: 'Produtos Software' },
            { key: 'config_job_titles', label: 'Cargos Profissionais' },
            { key: 'config_accounting_categories', label: 'Classificador CIBE' },
            { key: 'config_conservation_states', label: 'Estados Conservação' },
            { key: 'config_decommission_reasons', label: 'Motivos de Saída' },
            { key: 'config_training_types', label: 'Tipos de Formação' },
            { key: 'ticket_categories', label: 'Categorias Ticket' },
            { key: 'security_incident_types', label: 'Tipos Incid. Segurança' },
        ]
    },
    {
        label: 'Administração Avançada',
        items: [
            { key: 'settings', label: 'Configurações de Sistema' },
            { key: 'config_custom_roles', label: 'Perfis (RBAC)' },
            { key: 'config_automation', label: 'Automação' },
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
    const [showNewRoleInput, setShowNewRoleInput] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    const selectedRole = roles.find(r => r.id === selectedRoleId);
    const isSuperAdminRole = selectedRole?.name === 'SuperAdmin';

    useEffect(() => {
        if (selectedRole) setEditingPermissions(selectedRole.permissions || {});
        else setEditingPermissions({});
    }, [selectedRole]);

    const handleTogglePermission = (moduleKey: string, action: PermissionAction) => {
        if (isSuperAdminRole) return;
        setEditingPermissions(prev => {
            const modulePerms = prev[moduleKey] || {};
            return { ...prev, [moduleKey]: { ...modulePerms, [action]: !modulePerms[action] } };
        });
    };

    const handleSelectAllGroup = (groupItems: PermissionItem[]) => {
        if (isSuperAdminRole) return;
        setEditingPermissions(prev => {
            const next = { ...prev };
            groupItems.forEach(item => {
                const current = next[item.key] || {};
                next[item.key] = {
                    ...current,
                    view: true,
                    ...(item.supportsOwn ? { view_own: true } : {}),
                    ...(!item.isSimpleAccess ? { create: true, edit: true, delete: true } : {})
                };
            });
            return next;
        });
    };

    const handleSavePermissions = async () => {
        if (!selectedRoleId || isSuperAdminRole) return;
        setIsSaving(true);
        try {
            await dataService.updateCustomRole(selectedRoleId, { permissions: editingPermissions });
            onRefresh();
            alert("Permissões atualizadas com sucesso.");
        } catch (e) {
            alert("Erro ao gravar permissões.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddRole = async () => {
        if (!newRoleName.trim()) return;
        try {
            await dataService.addCustomRole({ name: newRoleName.trim(), permissions: {} });
            setNewRoleName('');
            setShowNewRoleInput(false);
            onRefresh();
        } catch (e) {
            alert("Erro ao criar perfil.");
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 p-6">
            <div className="w-full md:w-64 bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-white text-xs uppercase">Perfis de Acesso</h3>
                    <button 
                        onClick={() => setShowNewRoleInput(true)}
                        className="p-1.5 bg-brand-primary text-white rounded hover:bg-brand-secondary transition-colors"
                        title="Adicionar Perfil"
                    >
                        <FaPlus size={12} />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-1">
                    {showNewRoleInput && (
                        <div className="p-2 bg-gray-900 rounded mb-2 space-y-2 border border-brand-primary/50">
                            <input 
                                type="text" 
                                value={newRoleName}
                                onChange={e => setNewRoleName(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-1 text-xs text-white"
                                placeholder="Nome do Perfil..."
                                autoFocus
                            />
                            <div className="flex justify-end gap-1">
                                <button onClick={() => setShowNewRoleInput(false)} className="px-2 py-1 text-[10px] text-gray-400">Cancelar</button>
                                <button onClick={handleAddRole} className="px-2 py-1 text-[10px] bg-brand-primary text-white rounded">Criar</button>
                            </div>
                        </div>
                    )}
                    {roles.map(role => (
                        <button key={role.id} onClick={() => setSelectedRoleId(role.id)} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedRoleId === role.id ? 'bg-brand-primary text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                            {role.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 flex flex-col overflow-hidden">
                {!selectedRoleId ? (
                    <div className="flex-grow flex items-center justify-center text-gray-500 italic">Selecione um perfil para gerir permissões.</div>
                ) : (
                    <>
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <FaUserShield className="text-brand-secondary" /> {selectedRole?.name}
                            </h3>
                            {!isSuperAdminRole && (
                                <button onClick={handleSavePermissions} disabled={isSaving} className="bg-brand-primary text-white px-4 py-1.5 rounded text-xs flex items-center gap-2 hover:bg-brand-secondary transition-colors">
                                    {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />} Guardar Tudo
                                </button>
                            )}
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                            <div className={isSuperAdminRole ? 'opacity-50 pointer-events-none' : ''}>
                                {PERMISSION_GROUPS.map(group => (
                                    <div key={group.label} className="mb-8">
                                        <div className="flex justify-between items-center border-b border-gray-700 mb-3 pb-1">
                                            <h4 className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest">{group.label}</h4>
                                            <button 
                                                onClick={() => handleSelectAllGroup(group.items)}
                                                className="text-[9px] text-gray-500 hover:text-white uppercase font-black flex items-center gap-1"
                                            >
                                                <FaCheckDouble /> Selecionar Grupo
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {group.items.map(item => {
                                                const perms = editingPermissions[item.key] || {};
                                                return (
                                                    <div key={item.key} className="bg-gray-900/50 p-3 rounded border border-gray-700 hover:border-gray-600 transition-colors">
                                                        <p className="text-xs font-bold text-white mb-2">{item.label}</p>
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input type="checkbox" checked={!!perms.view} onChange={() => handleTogglePermission(item.key, 'view')} className="rounded border-gray-600 bg-gray-800 text-brand-primary" />
                                                                <span className="text-[10px] text-gray-300">Acesso Total</span>
                                                            </label>
                                                            {item.supportsOwn && (
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input type="checkbox" checked={!!perms.view_own} onChange={() => handleTogglePermission(item.key, 'view_own')} className="rounded border-gray-600 bg-gray-800 text-blue-500" />
                                                                    <span className="text-[10px] text-blue-400 font-bold">Ver Próprios</span>
                                                                </label>
                                                            )}
                                                            {!item.isSimpleAccess && (
                                                                <div className="flex gap-2 border-t border-gray-700 pt-1.5 mt-1">
                                                                    {['create', 'edit', 'delete'].map(act => (
                                                                        <label key={act} className="flex items-center gap-1">
                                                                            <input type="checkbox" checked={!!perms[act]} onChange={() => handleTogglePermission(item.key, act as any)} className="w-2.5 h-2.5 rounded" />
                                                                            <span className="text-[8px] text-gray-500 uppercase">{act}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
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
