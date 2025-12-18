
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
            { key: 'widget_alerts', label: 'Alertas Segurança', isSimpleAccess: true },
            { key: 'widget_kpi_cards', label: 'KPIs Globais', isSimpleAccess: true },
            { key: 'dashboard_smart', label: 'C-Level / Gestão', isSimpleAccess: true },
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
            { key: 'compliance_training', label: 'Formações', supportsOwn: true },
            { key: 'compliance_policies', label: 'Políticas', supportsOwn: true },
        ]
    },
    {
        label: 'Tabelas Auxiliares (Configuração)',
        items: [
            { key: 'brands', label: 'Marcas' },
            { key: 'equipment_types', label: 'Tipos de Ativo' },
            { key: 'ticket_categories', label: 'Categorias Ticket' },
            { key: 'config_job_titles', label: 'Cargos Profissionais' },
            { key: 'config_accounting_categories', label: 'Classificador CIBE' },
            { key: 'config_equipment_statuses', label: 'Estados de Ativo' },
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
    const [newRoleName, setNewRoleName] = useState('');
    const [showNewRoleInput, setShowNewRoleInput] = useState(false);

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

    const handleSavePermissions = async () => {
        if (!selectedRoleId || isSuperAdminRole) return;
        setIsSaving(true);
        try {
            await dataService.updateCustomRole(selectedRoleId, { permissions: editingPermissions });
            onRefresh();
            alert("Permissões atualizadas.");
        } catch (e) {
            alert("Erro ao gravar.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 p-6">
            <div className="w-full md:w-64 bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-white text-xs uppercase">Perfis</h3>
                    <button onClick={() => setShowNewRoleInput(true)} className="p-1.5 bg-brand-primary text-white rounded"><FaPlus size={10} /></button>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-1">
                    {roles.map(role => (
                        <button key={role.id} onClick={() => setSelectedRoleId(role.id)} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedRoleId === role.id ? 'bg-brand-primary text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                            {role.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 flex flex-col overflow-hidden">
                {!selectedRoleId ? (
                    <div className="flex-grow flex items-center justify-center text-gray-500">Selecione um perfil.</div>
                ) : (
                    <>
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                            <h3 className="font-bold text-white">{selectedRole?.name}</h3>
                            {!isSuperAdminRole && (
                                <button onClick={handleSavePermissions} disabled={isSaving} className="bg-brand-primary text-white px-4 py-1.5 rounded text-xs flex items-center gap-2">
                                    {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />} Guardar
                                </button>
                            )}
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                            <div className={isSuperAdminRole ? 'opacity-50 pointer-events-none' : ''}>
                                {PERMISSION_GROUPS.map(group => (
                                    <div key={group.label} className="mb-6">
                                        <h4 className="text-[10px] font-bold text-brand-secondary uppercase border-b border-gray-700 mb-3">{group.label}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {group.items.map(item => {
                                                const perms = editingPermissions[item.key] || {};
                                                return (
                                                    <div key={item.key} className="bg-gray-900/50 p-2 rounded border border-gray-700">
                                                        <p className="text-xs font-bold text-white mb-2">{item.label}</p>
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input type="checkbox" checked={!!perms.view} onChange={() => handleTogglePermission(item.key, 'view')} className="rounded border-gray-600 bg-gray-800 text-brand-primary" />
                                                                <span className="text-[10px] text-gray-300">Acesso/Ver Tudo</span>
                                                            </label>
                                                            {item.supportsOwn && (
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input type="checkbox" checked={!!perms.view_own} onChange={() => handleTogglePermission(item.key, 'view_own')} className="rounded border-gray-600 bg-gray-800 text-blue-500" />
                                                                    <span className="text-[10px] text-blue-400">Ver Próprios</span>
                                                                </label>
                                                            )}
                                                            {!item.isSimpleAccess && (
                                                                <div className="flex gap-2 border-t border-gray-700 pt-1 mt-1">
                                                                    {['create', 'edit', 'delete'].map(act => (
                                                                        <label key={act} className="flex items-center gap-1">
                                                                            <input type="checkbox" checked={!!perms[act]} onChange={() => handleTogglePermission(item.key, act as any)} className="w-3 h-3 rounded" />
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
