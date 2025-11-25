
import React, { useState, useEffect } from 'react';
import { CustomRole, PermissionMatrix, ModuleKey, PermissionAction } from '../types';
import { FaPlus, FaTrash, FaSave, FaShieldAlt, FaCheck, FaTimes, FaLock, FaInfoCircle } from 'react-icons/fa';
import { EditIcon, DeleteIcon } from './common/Icons';
import * as dataService from '../services/dataService';

interface RoleManagerProps {
    roles: CustomRole[];
    onRefresh: () => void;
}

const MODULES: { key: ModuleKey; label: string }[] = [
    { key: 'inventory', label: 'Inventário (Equipamentos)' },
    { key: 'tickets', label: 'Suporte & Tickets' },
    { key: 'organization', label: 'Organização (RH/Entidades)' },
    { key: 'compliance', label: 'Compliance (NIS2/BIA)' },
    { key: 'settings', label: 'Configurações Gerais' },
];

const ACTIONS: { key: PermissionAction; label: string }[] = [
    { key: 'view', label: 'Ver / Consultar' },
    { key: 'create', label: 'Criar' },
    { key: 'edit', label: 'Editar' },
    { key: 'delete', label: 'Apagar' },
];

const defaultPermissions: PermissionMatrix = {
    inventory: { view: false, create: false, edit: false, delete: false },
    tickets: { view: false, create: false, edit: false, delete: false },
    organization: { view: false, create: false, edit: false, delete: false },
    compliance: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
};

const RoleManager: React.FC<RoleManagerProps> = ({ roles, onRefresh }) => {
    const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedPermissions, setEditedPermissions] = useState<PermissionMatrix>(defaultPermissions);
    const [newRoleName, setNewRoleName] = useState('');
    const [showNewRoleInput, setShowNewRoleInput] = useState(false);

    // Select first role on load if available
    useEffect(() => {
        if (!selectedRole && roles.length > 0) {
            setSelectedRole(roles[0]);
        }
    }, [roles, selectedRole]);

    useEffect(() => {
        if (selectedRole) {
            // Deep copy permissions to avoid reference issues
            setEditedPermissions(JSON.parse(JSON.stringify(selectedRole.permissions || defaultPermissions)));
        }
    }, [selectedRole]);

    const handlePermissionChange = (module: string, action: string, value: boolean) => {
        setEditedPermissions(prev => ({
            ...prev,
            [module]: {
                ...prev[module as ModuleKey],
                [action]: value
            }
        }));
    };
    
    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        try {
            await dataService.updateCustomRole(selectedRole.id, { permissions: editedPermissions });
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
            const newRole = await dataService.addCustomRole({
                name: newRoleName.trim(),
                permissions: defaultPermissions,
                is_system: false
            });
            setNewRoleName('');
            setShowNewRoleInput(false);
            onRefresh();
            // Select new role after refresh logic handled by effect or manually:
            // Note: parent refresh is async, so we rely on parent prop update
        } catch (e: any) {
            alert("Erro ao criar perfil: " + e.message);
        }
    };

    const handleDeleteRole = async (id: string) => {
        if (!confirm("Tem a certeza? Utilizadores com este perfil ficarão sem acesso.")) return;
        try {
            await dataService.deleteCustomRole(id);
            if (selectedRole?.id === id) setSelectedRole(null);
            onRefresh();
        } catch (e) {
            alert("Erro ao apagar perfil.");
        }
    };

    return (
        <div className="flex h-full bg-surface-dark text-white">
            {/* Sidebar List */}
            <div className="w-64 border-r border-gray-700 flex flex-col bg-gray-900/50">
                <div className="p-4 border-b border-gray-700">
                    <h3 className="font-bold flex items-center gap-2"><FaShieldAlt className="text-purple-500"/> Perfis de Acesso</h3>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-1">
                    {roles.map(role => (
                        <div 
                            key={role.id}
                            onClick={() => { setSelectedRole(role); setIsEditing(false); }}
                            className={`flex justify-between items-center p-3 rounded cursor-pointer transition-colors ${selectedRole?.id === role.id ? 'bg-brand-primary text-white' : 'hover:bg-gray-800 text-gray-400'}`}
                        >
                            <span className="font-medium text-sm">{role.name}</span>
                            {role.is_system && <FaLock className="h-3 w-3 opacity-50" title="Sistema (Não apagável)" />}
                        </div>
                    ))}
                </div>
                <div className="p-3 border-t border-gray-700">
                    {!showNewRoleInput ? (
                        <button 
                            onClick={() => setShowNewRoleInput(true)}
                            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 p-2 rounded text-sm text-gray-300 border border-gray-600"
                        >
                            <FaPlus /> Novo Perfil
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newRoleName} 
                                onChange={(e) => setNewRoleName(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded px-2 text-sm"
                                placeholder="Nome..."
                                autoFocus
                            />
                            <button onClick={handleCreateRole} className="bg-green-600 p-2 rounded text-white"><FaCheck/></button>
                            <button onClick={() => setShowNewRoleInput(false)} className="bg-red-600 p-2 rounded text-white"><FaTimes/></button>
                        </div>
                    )}
                </div>
            </div>

            {/* Permissions Matrix */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedRole ? (
                    <>
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-surface-dark">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    {selectedRole.name}
                                    {selectedRole.is_system && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-600">Sistema</span>}
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">Defina as permissões granulares para este perfil.</p>
                            </div>
                            <div className="flex gap-3">
                                {!selectedRole.is_system && (
                                    <button 
                                        onClick={() => handleDeleteRole(selectedRole.id)}
                                        className="px-4 py-2 bg-red-900/20 text-red-400 border border-red-500/30 rounded hover:bg-red-900/40 text-sm flex items-center gap-2"
                                    >
                                        <FaTrash /> Apagar Perfil
                                    </button>
                                )}
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

                        <div className="flex-grow overflow-y-auto p-6">
                             {!isEditing && (
                                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded flex items-center gap-2 text-sm text-blue-200">
                                    <FaInfoCircle /> 
                                    <span>Modo de Leitura. Clique em "Editar Permissões" para alterar.</span>
                                </div>
                            )}

                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-3 border-b border-gray-700 text-gray-400 font-medium uppercase text-xs w-1/3">Módulo</th>
                                        {ACTIONS.map(action => (
                                            <th key={action.key} className="p-3 border-b border-gray-700 text-gray-400 font-medium uppercase text-xs text-center">
                                                {action.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {MODULES.map(module => (
                                        <tr key={module.key} className="hover:bg-gray-800/30 border-b border-gray-800 last:border-0">
                                            <td className="p-4 font-medium text-gray-200">
                                                {module.label}
                                            </td>
                                            {ACTIONS.map(action => {
                                                const isChecked = editedPermissions[module.key]?.[action.key] || false;
                                                return (
                                                    <td key={action.key} className="p-4 text-center">
                                                        <label className={`inline-flex items-center justify-center w-6 h-6 rounded border ${isEditing ? 'cursor-pointer' : 'cursor-default opacity-80'} ${isChecked ? 'bg-green-600 border-green-500' : 'bg-gray-800 border-gray-600'}`}>
                                                            {isEditing ? (
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="hidden"
                                                                    checked={isChecked}
                                                                    onChange={(e) => handlePermissionChange(module.key, action.key, e.target.checked)}
                                                                />
                                                            ) : null}
                                                            {isChecked && <FaCheck className="text-white text-xs" />}
                                                        </label>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Selecione um perfil para gerir.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoleManager;
