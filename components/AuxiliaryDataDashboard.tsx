
import React, { useState, useEffect } from 'react';
import { ConfigItem } from '../types';
import { PlusIcon, EditIcon, DeleteIcon, FaCheckCircle, FaTimesCircle } from './common/Icons';
import { FaCog, FaSave, FaTimes } from 'react-icons/fa';
import * as dataService from '../services/dataService';

interface AuxiliaryDataDashboardProps {
    configTables: {
        tableName: string;
        label: string;
        data: ConfigItem[];
    }[];
    onRefresh: () => void;
}

const AuxiliaryDataDashboard: React.FC<AuxiliaryDataDashboardProps> = ({ configTables, onRefresh }) => {
    const [selectedTableIndex, setSelectedTableIndex] = useState(0);
    const [newItemName, setNewItemName] = useState('');
    const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
    const [error, setError] = useState('');

    const currentTable = configTables[selectedTableIndex];

    const handleAdd = async () => {
        if (!newItemName.trim()) {
            setError('O nome é obrigatório.');
            return;
        }
        try {
            await dataService.addConfigItem(currentTable.tableName, { name: newItemName.trim() });
            setNewItemName('');
            setError('');
            onRefresh();
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Erro ao adicionar item.');
        }
    };

    const handleUpdate = async () => {
        if (!editingItem || !editingItem.name.trim()) return;
        try {
            await dataService.updateConfigItem(currentTable.tableName, editingItem.id, { name: editingItem.name.trim() });
            setEditingItem(null);
            setError('');
            onRefresh();
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Erro ao atualizar item.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem a certeza que deseja excluir este item? Se estiver em uso, poderá causar erros de visualização.")) return;
        try {
            await dataService.deleteConfigItem(currentTable.tableName, id);
            onRefresh();
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Erro ao excluir item. Verifique se está em uso.');
        }
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
                <FaCog className="text-2xl text-gray-400" />
                <div>
                    <h2 className="text-xl font-semibold text-white">Configurações de Sistema</h2>
                    <p className="text-sm text-on-surface-dark-secondary">Gerir listas auxiliares e tabelas de domínio.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
                    {configTables.map((table, index) => (
                        <button
                            key={table.tableName}
                            onClick={() => { setSelectedTableIndex(index); setError(''); setNewItemName(''); setEditingItem(null); }}
                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
                                selectedTableIndex === index 
                                ? 'bg-gray-800 text-white border-brand-primary' 
                                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-transparent'
                            }`}
                        >
                            {table.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="mb-4 flex gap-2">
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder={`Novo item para ${currentTable.label}...`}
                            className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button onClick={handleAdd} className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary flex items-center gap-2">
                            <PlusIcon className="h-4 w-4" /> Adicionar
                        </button>
                    </div>

                    {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm mb-4 border border-red-500/50">{error}</div>}

                    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Nome</th>
                                    <th className="px-4 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {currentTable.data.length > 0 ? (
                                    currentTable.data.sort((a,b) => a.name.localeCompare(b.name)).map(item => (
                                        <tr key={item.id} className="hover:bg-gray-700/50">
                                            <td className="px-4 py-3">
                                                {editingItem?.id === item.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingItem.name}
                                                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                        className="w-full bg-gray-600 border border-gray-500 text-white rounded p-1"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="text-white">{item.name}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {editingItem?.id === item.id ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={handleUpdate} className="text-green-400 hover:text-green-300"><FaSave /></button>
                                                        <button onClick={() => setEditingItem(null)} className="text-red-400 hover:text-red-300"><FaTimes /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setEditingItem(item)} className="text-blue-400 hover:text-blue-300"><EditIcon /></button>
                                                        <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300"><DeleteIcon /></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="p-4 text-center text-gray-500 italic">Nenhum item registado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuxiliaryDataDashboard;
