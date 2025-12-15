
import React, { useState } from 'react';
import { ConfigItem } from '../../types';
import * as dataService from '../../services/dataService';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaSync, FaExclamationCircle } from 'react-icons/fa';

interface GenericConfigDashboardProps {
    title: string;
    icon: React.ReactNode;
    items: ConfigItem[];
    tableName: string;
    onRefresh: () => void;
    colorField?: boolean;
}

const GenericConfigDashboard: React.FC<GenericConfigDashboardProps> = ({ title, icon, items, tableName, onRefresh, colorField = false }) => {
    
    const [newItemName, setNewItemName] = useState('');
    const [newItemColor, setNewItemColor] = useState('#3B82F6');
    const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        const name = (editingItem ? editingItem.name : newItemName).trim();
        if (!name) {
            setError('O nome não pode ser vazio.');
            return;
        }

        // Validate duplicate name (case insensitive)
        const isDuplicate = (items || []).some(
            (item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== editingItem?.id
        );

        if (isDuplicate) {
            setError('Já existe um item com este nome.');
            return;
        }
        
        setError('');
        setIsSaving(true);
        try {
            if (editingItem) {
                await dataService.updateConfigItem(tableName, editingItem.id, { name: editingItem.name, color: editingItem.color });
                setEditingItem(null);
            } else {
                await dataService.addConfigItem(tableName, { name: newItemName, color: colorField ? newItemColor : undefined });
                setNewItemName('');
            }
            onRefresh();
        } catch (e: any) {
            console.error("Save error:", e);
            setError("Erro ao gravar. Verifique as permissões (RLS) no menu Configuração BD.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if(confirm("Tem a certeza?")) {
            try {
                await dataService.deleteConfigItem(tableName, id);
                onRefresh();
            } catch (e: any) {
                alert(`Erro ao apagar: ${e.message}. Verifique se este item está a ser utilizado.`);
            }
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">{icon} {title}</h2>
                <button onClick={onRefresh} className="text-sm text-brand-secondary hover:text-white flex items-center gap-1">
                    <FaSync className={isSaving ? "animate-spin" : ""} /> Atualizar
                </button>
            </div>
            
            {/* Input Area - Always visible at top */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase">{editingItem ? 'Editar Item' : 'Criar Novo Item'}</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={editingItem ? editingItem.name : newItemName}
                        onChange={(e) => {
                            editingItem ? setEditingItem({ ...editingItem, name: e.target.value }) : setNewItemName(e.target.value);
                            if (error) setError('');
                        }}
                        placeholder="Nome do item..."
                        className={`flex-grow bg-gray-700 border rounded-md p-2 text-sm text-white ${error ? 'border-red-500' : 'border-gray-600'}`}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                    {colorField && (
                         <div className="flex items-center gap-2 bg-gray-700 px-2 rounded border border-gray-600">
                             <span className="text-xs text-gray-400">Cor:</span>
                             <input
                                type="color"
                                value={editingItem ? (editingItem.color || '#3B82F6') : newItemColor}
                                onChange={(e) => editingItem ? setEditingItem({ ...editingItem, color: e.target.value }) : setNewItemColor(e.target.value)}
                                className="bg-transparent border-none w-8 h-8 p-0 cursor-pointer"
                            />
                        </div>
                    )}
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving} 
                        className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary disabled:opacity-50 flex items-center justify-center gap-2 min-w-[100px]"
                    >
                        {editingItem ? <><FaSave /> Guardar</> : <><FaPlus /> Adicionar</>}
                    </button>
                    {editingItem && (
                        <button onClick={() => { setEditingItem(null); setError(''); }} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500">
                            <FaTimes />
                        </button>
                    )}
                </div>
                {error && <p className="text-red-400 text-xs mt-2 bg-red-900/20 p-2 rounded flex items-center gap-2"><FaExclamationCircle/> {error}</p>}
            </div>

            <div className="flex-1 overflow-x-auto border border-gray-700 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="p-3">Nome</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {(items || []).length > 0 ? (
                            items.map(item => (
                                <tr key={item.id} className="hover:bg-gray-800/50">
                                    <td className="p-3 flex items-center gap-3">
                                        {colorField && <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: item.color || 'transparent', border: '1px solid #4B5563' }}></div>}
                                        <span className="text-white font-medium">{item.name}</span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => { setEditingItem(item); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-blue-400 hover:text-blue-300" title="Editar">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300" title="Apagar">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={2} className="p-8 text-center text-gray-500">
                                    <p className="mb-2">A lista está vazia.</p>
                                    <p className="text-xs">Utilize o formulário acima para adicionar novos itens.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GenericConfigDashboard;
