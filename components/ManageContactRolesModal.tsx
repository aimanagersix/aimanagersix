import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { ContactRole } from '../types';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import * as dataService from '../services/dataService';

interface ManageContactRolesModalProps {
    onClose: () => void;
    onRolesUpdated: () => void;
}

const ManageContactRolesModal: React.FC<ManageContactRolesModalProps> = ({ onClose, onRolesUpdated }) => {
    const [roles, setRoles] = useState<ContactRole[]>([]);
    const [newRoleName, setNewRoleName] = useState('');
    const [editingRole, setEditingRole] = useState<ContactRole | null>(null);
    const [loading, setLoading] = useState(true);

    const loadRoles = async () => {
        setLoading(true);
        try {
            const data = await dataService.fetchAllData();
            setRoles(data.contactRoles || []);
        } catch (e) {
            console.error("Error loading roles:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoles();
    }, []);

    const handleAdd = async () => {
        if (!newRoleName.trim()) return;
        try {
            await dataService.addContactRole({ name: newRoleName.trim() });
            setNewRoleName('');
            await loadRoles();
            onRolesUpdated();
        } catch (e) {
            console.error("Error adding role:", e);
            alert("Erro ao adicionar função.");
        }
    };

    const handleUpdate = async () => {
        if (!editingRole || !editingRole.name.trim()) return;
        try {
            await dataService.updateContactRole(editingRole.id, { name: editingRole.name.trim() });
            setEditingRole(null);
            await loadRoles();
            onRolesUpdated();
        } catch (e) {
            console.error("Error updating role:", e);
            alert("Erro ao atualizar função.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem a certeza que deseja excluir esta função?")) return;
        try {
            await dataService.deleteContactRole(id);
            await loadRoles();
            onRolesUpdated();
        } catch (e) {
            console.error("Error deleting role:", e);
            alert("Erro ao excluir função. Verifique se está em uso.");
        }
    };

    return (
        <Modal title="Gerir Funções/Papéis de Contacto" onClose={onClose} maxWidth="max-w-lg">
            <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newRoleName} 
                        onChange={(e) => setNewRoleName(e.target.value)} 
                        placeholder="Nova função (ex: Técnico Sénior)" 
                        className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button 
                        onClick={handleAdd} 
                        disabled={!newRoleName.trim()}
                        className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary disabled:opacity-50"
                    >
                        <FaPlus />
                    </button>
                </div>

                <div className="bg-gray-900/30 border border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">A carregar...</div>
                    ) : (
                        roles.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-2">Nome</th>
                                        <th className="px-4 py-2 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {roles.map(role => (
                                        <tr key={role.id} className="hover:bg-gray-800/50">
                                            <td className="px-4 py-2">
                                                {editingRole?.id === role.id ? (
                                                    <input 
                                                        type="text" 
                                                        value={editingRole.name} 
                                                        onChange={(e) => setEditingRole({...editingRole, name: e.target.value})} 
                                                        className="w-full bg-gray-600 border border-gray-500 text-white rounded p-1"
                                                        autoFocus
                                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                                    />
                                                ) : (
                                                    <span className="text-white">{role.name}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {editingRole?.id === role.id ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={handleUpdate} className="text-green-400 hover:text-green-300"><FaSave /></button>
                                                        <button onClick={() => setEditingRole(null)} className="text-red-400 hover:text-red-300"><FaTimes /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setEditingRole(role)} className="text-blue-400 hover:text-blue-300"><FaEdit /></button>
                                                        <button onClick={() => handleDelete(role.id)} className="text-red-400 hover:text-red-300"><FaTrash /></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-4 text-center text-gray-500">Nenhuma função definida.</div>
                        )
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default ManageContactRolesModal;