
import React, { useState } from 'react';
import { SoftwareProduct, ConfigItem } from '../../types';
import * as dataService from '../../services/dataService';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaCompactDisc } from 'react-icons/fa';

interface SoftwareProductDashboardProps {
    products: SoftwareProduct[];
    categories: ConfigItem[];
    onRefresh: () => void;
}

const SoftwareProductDashboard: React.FC<SoftwareProductDashboardProps> = ({ products, categories, onRefresh }) => {
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategoryId, setNewItemCategoryId] = useState('');
    const [editingItem, setEditingItem] = useState<SoftwareProduct | null>(null);
    const [error, setError] = useState('');

    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    const handleSave = async () => {
        const name = (editingItem ? editingItem.name : newItemName).trim();
        const categoryId = editingItem ? editingItem.category_id : newItemCategoryId;

        if (!name) {
            setError('O nome não pode ser vazio.');
            return;
        }
        if (!categoryId) {
            setError('A categoria é obrigatória.');
            return;
        }

        // Validate duplicate name
        const isDuplicate = products.some(
            (item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== editingItem?.id
        );

        if (isDuplicate) {
            setError('Já existe um produto com este nome.');
            return;
        }
        
        setError('');

        try {
            if (editingItem) {
                await dataService.updateSoftwareProduct(editingItem.id, { name, category_id: categoryId });
                setEditingItem(null);
            } else {
                await dataService.addSoftwareProduct({ name, category_id: categoryId });
                setNewItemName('');
                setNewItemCategoryId('');
            }
            onRefresh();
        } catch (e: any) {
            console.error(e);
            alert("Erro ao guardar.");
        }
    };

    const handleDelete = async (id: string) => {
        if(confirm("Tem a certeza?")) {
            try {
                await dataService.deleteSoftwareProduct(id);
                onRefresh();
            } catch (e: any) {
                alert(`Erro ao apagar: ${e.message}. Verifique se este produto está a ser utilizado.`);
            }
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><FaCompactDisc /> Produtos de Software (Standard)</h2>
            
            <div className="flex gap-2 mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 flex-wrap">
                <input
                    type="text"
                    value={editingItem ? editingItem.name : newItemName}
                    onChange={(e) => {
                        editingItem ? setEditingItem({ ...editingItem, name: e.target.value }) : setNewItemName(e.target.value);
                        setError('');
                    }}
                    placeholder="Nome do produto (ex: Windows 11 Pro)..."
                    className={`flex-grow bg-gray-700 border rounded-md p-2 text-sm text-white min-w-[200px] ${error ? 'border-red-500' : 'border-gray-600'}`}
                />
                <select 
                    value={editingItem ? editingItem.category_id : newItemCategoryId}
                    onChange={(e) => {
                         editingItem ? setEditingItem({ ...editingItem, category_id: e.target.value }) : setNewItemCategoryId(e.target.value);
                         setError('');
                    }}
                    className="bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white min-w-[150px]"
                >
                    <option value="">-- Categoria --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <button onClick={handleSave} className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary">
                    {editingItem ? <FaSave /> : <FaPlus />}
                </button>
                {editingItem && <button onClick={() => setEditingItem(null)} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500"><FaTimes /></button>}
            </div>
            {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

            <div className="flex-grow overflow-y-auto custom-scrollbar border border-gray-700 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-xs sticky top-0">
                        <tr>
                            <th className="p-3">Produto</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(products || []).map(item => (
                            <tr key={item.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                                <td className="p-3 text-white">{item.name}</td>
                                <td className="p-3 text-gray-400">{categoryMap.get(item.category_id) || 'Sem Categoria'}</td>
                                <td className="p-3 w-32 text-right">
                                    <button onClick={() => setEditingItem(item)} className="text-blue-400 hover:text-blue-300 mr-4"><FaEdit /></button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300"><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr><td colSpan={3} className="p-4 text-center text-gray-500">Nenhum produto definido.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SoftwareProductDashboard;
