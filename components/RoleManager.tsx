import React, { useState, useEffect } from 'react';
import { CustomRole, ModuleKey, PermissionAction } from '../types';
import * as dataService from '../services/dataService';
import { FaShieldAlt, FaSave, FaPlus, FaTrash, FaCheck, FaTimes, FaLock, FaUserShield, FaCheckDouble, FaSpinner, FaUserCheck, FaUserTie, FaComments, FaBullhorn, FaBell, FaExclamationTriangle } from 'react-icons/fa';

/**
 * RoleManager V2.0 (Full Permission Tree & SB Sync)
 * -----------------------------------------------------------------------------
 * NOTA: Este componente gere os perfis personalizados na tabela config_custom_roles.
 * A estrutura de permissões segue a "Árvore Enterprise" com controlo granular.
 * -----------------------------------------------------------------------------
 */

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
        label: 'Dashboard & Supervisão (C-Level)',
        items: [
            { key: 'dashboard_smart', label: 'Dashboard: Visão Gestão (NIS2 Art. 20º)', isSimpleAccess: true },
            { key: 'widget_kpi_cards', label: 'KPIs: Cartões de Sumário Executivo', isSimpleAccess: true },
            { key: 'widget_financial', label: 'FinOps: Visão de Custos e CAPEX', isSimpleAccess: true },
            { key: 'widget_alerts', label: 'Alertas: Alertas Críticos NIS2', isSimpleAccess: true },
            { key: 'widget_inventory_charts', label: 'Gráficos: Distribuição de Ativos', isSimpleAccess: true },
            { key: 'widget_operational_charts', label: 'Gráficos: Performance Suporte', isSimpleAccess: true },
            { key: 'widget_activity', label: 'Atividade: Log em Tempo Real', isSimpleAccess: true },
        ]
    },
    {
        label: 'Área Pessoal & Self-Service',
        items: [
            { key: 'my_area', label: 'Acesso: Menu "A Minha Área"', isSimpleAccess: true },
        ]
    },
    {
        label: 'Notificações Visuais (Badge Superior)',
        items: [
            { key: 'notif_tickets', label: 'Alerta: Tickets Pendentes (Sino)', isSimpleAccess: true },
            { key: 'notif_licenses', label: 'Alerta: Licenças Críticas (Sino)', isSimpleAccess: true },
            { key: 'notif_warranties', label: 'Alerta: Garantias a Expirar (Sino)', isSimpleAccess: true },
        ]
    },
    {
        label: 'Receção de Mensagens (Chat Automático)',
        items: [
            { key: 'msg_tickets', label: 'Receber: Notificações de Tickets no Chat', isSimpleAccess: true },
            { key: 'msg_licenses', label: 'Receber: Notificações de Licenças no Chat', isSimpleAccess: true },
            { key: 'msg_warranties', label: 'Receber: Notificações de Garantias no Chat', isSimpleAccess: true },
        ]
    },
    {
        label: 'Gestão de Ativos (Inventário)',
        items: [
            { key: 'equipment', label: 'Módulo: Equipamentos', supportsOwn: true },
            { key: 'equipment_view_full', label: 'Acesso: Ficha Técnica Completa', isSimpleAccess: true },
            { key: 'licensing', label: 'Módulo: Licenciamento de Software', supportsOwn: true },
            { key: 'procurement', label: 'Módulo: Aquisições e Compras' },
        ]
    },
    {
        label: 'Suporte & Incidentes (Ticketing)',
        items: [
            { key: 'tickets', label: 'Tickets: Suporte Operacional', supportsOwn: true },
            { key: 'tickets_security', label: 'Tickets: Incidentes de Segurança (NIS2)', supportsOwn: true },
        ]
    },
    {
        label: 'Estrutura Organizacional',
        items: [
            { key: 'org_institutions', label: 'Organização: Instituições' },
            { key: 'org_entities', label: 'Organização: Entidades/Locais' },
            { key: 'org_collaborators', label: 'Recursos Humanos: Colaboradores' },
            { key: 'org_suppliers', label: 'Compliance: Gestão de Fornecedores' },
            { key: 'organization', label: 'Gestão de Equipas Técnicas' },
        ]
    },
    {
        label: 'Compliance, BIA & Continuidade',
        items: [
            { key: 'compliance_bia', label: 'NIS2: Impacto no Negócio (BIA)' },
            { key: 'compliance_security', label: 'NIS2: Gestão de Vulnerabilidades' },
            { key: 'compliance_backups', label: 'NIS2: Registo de Backups' },
            { key: 'compliance_resilience', label: 'NIS2: Testes de Resiliência', supportsOwn: true },
            { key: 'compliance_training', label: 'NIS2: Formação e Consciencialização', supportsOwn: true },
            { key: 'compliance_policies', label: 'NIS2: Políticas e Governança', supportsOwn: true },
        ]
    },
    {
        label: 'Configuração Avançada (Tabelas Base)',
        items: [
            { key: 'ticket_categories', label: 'Config: Categorias de Tickets e SLAs' },
            { key: 'security_incident_types', label: 'Config: Tipos de Incidente NIS2' },
            { key: 'brands', label: 'Config: Marcas e Fabricantes' },
            { key: 'equipment_types', label: 'Config: Tipos de Equipamento' },
            { key: 'config_equipment_statuses', label: 'Config: Estados de Ativo' },
            { key: 'config_job_titles', label: 'Config: Cargos Profissionais' },
            { key: 'config_software_products', label: 'Config: Catálogo de Software' },
            { key: 'settings', label: 'Config: Definições Globais e APIs' },
            { key: 'config_custom_roles', label: 'Segurança: Gestão de Perfis (RBAC)' },
            { key: 'config_automation', label: 'Sistema: Regras de Automação' },
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
    const [error, setError] = useState<string | null>(null);

    const selectedRole = roles.find(r => r.id === selectedRoleId);
    const isSuperAdminRole = selectedRole?.name === 'SuperAdmin';

    useEffect(() => {
        if (selectedRole) {
            setEditingPermissions(selectedRole.permissions || {});
            setError(null);
        } else {
            setEditingPermissions({});
        }
    }, [selectedRole]);

    const handleTogglePermission = (moduleKey: string, action: PermissionAction) => {
        if (isSuperAdminRole) return;
        setEditingPermissions(prev => {
            const modulePerms = { ...(prev[moduleKey] || {}) };
            modulePerms[action] = !modulePerms[action];
            return { ...prev, [moduleKey]: modulePerms };
        });
    };

    const handleSelectAllGroup = (groupItems: PermissionItem[]) => {
        if (isSuperAdminRole) return;
        setEditingPermissions(prev => {
            const next = { ...prev };
            groupItems.forEach(item => {
                next[item.key] = {
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
        setError(null);
        try {
            await dataService.updateCustomRole(selectedRoleId, { 
                permissions: editingPermissions 
            });
            onRefresh();
            alert("Permissões gravadas na base de dados com sucesso.");
        } catch (e: any) {
            console.error(e);
            setError("Erro ao gravar no Supabase: Verifique se a tabela 'config_custom_roles' existe e tem políticas RLS.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddRole = async () => {
        if (!newRoleName.trim()) return;
        setIsSaving(true);
        try {
            await dataService.addCustomRole({ 
                name: newRoleName.trim(), 
                permissions: {} 
            });
            setNewRoleName('');
            setShowNewRoleInput(false);
            onRefresh();
        } catch (e: any) {
            alert("Erro ao criar perfil. Verifique se o nome já existe.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-[75vh] gap-6 p-6">
            {/* Sidebar de Perfis */}
            <div className="w-full md:w-64 bg-gray-900/50 rounded-lg border border-gray-700 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <h3 className="font-bold text-white text-[10px] uppercase tracking-widest">Perfis (Roles)</h3>
                    <button 
                        onClick={() => setShowNewRoleInput(true)}
                        className="p-1.5 bg-brand-primary text-white rounded hover:bg-brand-secondary transition-colors"
                        title="Criar Novo Perfil"
                    >
                        <FaPlus size={10} />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {showNewRoleInput && (
                        <div className="p-3 bg-gray-950 rounded mb-2 space-y-2 border border-brand-primary/50 animate-fade-in">
                            <input 
                                type="text" 
                                value={newRoleName}
                                onChange={e => setNewRoleName(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-white outline-none focus:border-brand-primary"
                                placeholder="Nome do Perfil..."
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleAddRole()}
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowNewRoleInput(false)} className="text-[10px] text-gray-500 hover:text-white uppercase font-bold">Cancelar</button>
                                <button onClick={handleAddRole} className="px-2 py-1 text-[10px] bg-brand-primary text-white rounded font-bold">Criar</button>
                            </div>
                        </div>
                    )}
                    {roles.length > 0 ? roles.map(role => (
                        <button 
                            key={role.id} 
                            onClick={() => setSelectedRoleId(role.id)} 
                            className={`w-full text-left px-4 py-2.5 rounded-md text-sm transition-all flex items-center justify-between group ${selectedRoleId === role.id ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <span className="truncate">{role.name}</span>
                            {role.name === 'SuperAdmin' && <FaLock className="text-[10px] opacity-50"/>}
                        </button>
                    )) : <p className="text-center py-4 text-gray-600 text-xs italic">Nenhum perfil criado.</p>}
                </div>
            </div>

            {/* Painel de Permissões */}
            <div className="flex-1 bg-gray-900/50 rounded-lg border border-gray-700 flex flex-col overflow-hidden">
                {!selectedRoleId ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-600 text-center p-10">
                        <FaUserShield className="text-5xl mb-4 opacity-10" />
                        <p className="italic">Selecione um perfil na lista lateral para gerir as permissões de acesso.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-primary/20 rounded text-brand-secondary">
                                    <FaUserShield size={16} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base">{selectedRole?.name}</h3>
                                    <p className="text-[10px] text-gray-500 uppercase font-black">Editor de Privilégios</p>
                                </div>
                            </div>
                            
                            {!isSuperAdminRole ? (
                                <button 
                                    onClick={handleSavePermissions} 
                                    disabled={isSaving} 
                                    className="bg-brand-primary text-white px-6 py-2 rounded-md text-xs flex items-center gap-2 hover:bg-brand-secondary transition-all shadow-xl font-black uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />} Gravar Permissões
                                </button>
                            ) : (
                                <span className="text-[10px] bg-red-900/30 text-red-400 px-3 py-1 rounded-full border border-red-500/30 font-black flex items-center gap-2">
                                    <FaLock /> PERFIL PROTEGIDO (HARD-CODED)
                                </span>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 bg-red-900/20 border-b border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                                <FaExclamationTriangle className="animate-pulse" /> {error}
                            </div>
                        )}

                        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-gray-950/20">
                            <div className={isSuperAdminRole ? 'opacity-30 pointer-events-none grayscale' : 'animate-fade-in'}>
                                {PERMISSION_GROUPS.map((group, gIdx) => (
                                    <div key={gIdx} className="mb-10 last:mb-0">
                                        <div className="flex justify-between items-center border-b border-gray-800 mb-5 pb-2">
                                            <h4 className="text-[11px] font-black text-brand-secondary uppercase tracking-[0.2em]">{group.label}</h4>
                                            <button 
                                                onClick={() => handleSelectAllGroup(group.items)}
                                                className="text-[9px] text-gray-600 hover:text-white uppercase font-black flex items-center gap-1.5 transition-colors"
                                            >
                                                <FaCheckDouble /> Selecionar Tudo
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {group.items.map(item => {
                                                const perms = editingPermissions[item.key] || {};
                                                return (
                                                    <div key={item.key} className={`p-4 rounded-lg border transition-all duration-300 ${perms.view ? 'bg-gray-800/40 border-brand-primary/30 shadow-inner' : 'bg-gray-900/20 border-gray-800 hover:border-gray-700'}`}>
                                                        <p className={`text-xs font-bold mb-3 transition-colors ${perms.view ? 'text-white' : 'text-gray-500'}`}>{item.label}</p>
                                                        
                                                        <div className="flex flex-col gap-2.5">
                                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${perms.view ? 'bg-brand-primary border-brand-primary' : 'bg-gray-950 border-gray-700 group-hover:border-gray-500'}`}>
                                                                    {perms.view && <FaCheck className="text-[8px] text-white" />}
                                                                </div>
                                                                <input type="checkbox" checked={!!perms.view} onChange={() => handleTogglePermission(item.key, 'view')} className="hidden" />
                                                                <span className={`text-[10px] uppercase font-black tracking-wider ${perms.view ? 'text-white' : 'text-gray-600'}`}>Acesso Visualização</span>
                                                            </label>

                                                            {item.supportsOwn && (
                                                                <label className="flex items-center gap-3 cursor-pointer group pl-7 border-l border-gray-800 ml-2">
                                                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${perms.view_own ? 'bg-blue-600 border-blue-600' : 'bg-gray-950 border-gray-700'}`}>
                                                                        {perms.view_own && <FaCheck className="text-[7px] text-white" />}
                                                                    </div>
                                                                    <input type="checkbox" checked={!!perms.view_own} onChange={() => handleTogglePermission(item.key, 'view_own')} className="hidden" />
                                                                    <span className={`text-[9px] uppercase font-bold tracking-wider ${perms.view_own ? 'text-blue-400' : 'text-gray-600'}`}>Apenas Dados Próprios</span>
                                                                </label>
                                                            )}

                                                            {!item.isSimpleAccess && (
                                                                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-800/50 mt-1">
                                                                    {(['create', 'edit', 'delete'] as PermissionAction[]).map(act => (
                                                                        <label key={act} className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${perms[act] ? 'bg-gray-700 text-white' : 'bg-gray-900/50 text-gray-700 hover:bg-gray-800'}`}>
                                                                            <input type="checkbox" checked={!!perms[act]} onChange={() => handleTogglePermission(item.key, act)} className="w-2.5 h-2.5 rounded border-gray-600 bg-gray-950 text-brand-primary" />
                                                                            <span className="text-[8px] uppercase font-black">{act}</span>
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