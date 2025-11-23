import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { ContactTitle } from '../types';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import * as dataService from '../services/dataService';

interface ManageContactTitlesModalProps {
    onClose: () => void;
    onTitlesUpdated: () => void;
}

const ManageContactTitlesModal: React.FC<ManageContactTitlesModalProps> = ({ onClose, onTitlesUpdated }) => {
    const [titles, setTitles] = useState<ContactTitle[]>([]);
    const [newTitleName, setNewTitleName] = useState('');
    const [editingTitle, setEditingTitle] = useState<ContactTitle | null>(null);
    const [loading, setLoading] = useState(true);

    const loadTitles = async () => {
        setLoading(true);
        try {
            const data = await dataService.fetchAllData();
            setTitles(data.contactTitles || []);
        } catch (e) {
            console.error("Error loading titles:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTitles();
    }, []);

    const handleAdd = async () => {
        if (!newTitleName.trim()) return;
        try {
            await dataService.addContactTitle({ name: newTitleName.trim() });
            setNewTitleName('');
            await loadTitles();
            onTitlesUpdated();
        } catch (e) {
            console.error("Error adding title:", e);
            alert("Erro ao adicionar trato.");
        }
    };

    const handleUpdate = async () => {
        if (!editingTitle || !editingTitle.name.trim()) return;
        try {
            await dataService.updateContactTitle(editingTitle.id, { name: editingTitle.name.trim() });
            setEditingTitle(null);
            await loadTitles();
            onTitlesUpdated();
        } catch (e) {
            console.error("Error updating title:", e);
            alert("Erro ao atualizar trato.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem a certeza que deseja excluir este trato?")) return;
        try {
            await dataService.deleteContactTitle(id);
            await loadTitles();
            onTitlesUpdated();
        } catch (e) {
            console.error("Error deleting title:", e);
            alert("Erro ao excluir trato. Verifique se está em uso.");
        }
    };

    return (
        <Modal title="Gerir Tratos (Honoríficos)" onClose={onClose} maxWidth="max-w-lg">
            <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newTitleName} 
                        onChange={(e) => setNewTitleName(e.target.value)} 
                        placeholder="Novo trato (ex: Prof. Dr.)" 
                        className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button 
                        onClick={handleAdd} 
                        disabled={!newTitleName.trim()}
                        className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary disabled:opacity-50"
                    >
                        <FaPlus />
                    </button>
                </div>

                <div className="bg-gray-900/30 border border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">A carregar...</div>
                    ) : (
                        titles.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-2">Nome</th>
                                        <th className="px-4 py-2 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {titles.map(title => (
                                        <tr key={title.id} className="hover:bg-gray-800/50">
                                            <td className="px-4 py-2">
                                                {editingTitle?.id === title.id ? (
                                                    <input 
                                                        type="text" 
                                                        value={editingTitle.name} 
                                                        onChange={(e) => setEditingTitle({...editingTitle, name: e.target.value})} 
                                                        className="w-full bg-gray-600 border border-gray-500 text-white rounded p-1"
                                                        autoFocus
                                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                                    />
                                                ) : (
                                                    <span className="text-white">{title.name}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {editingTitle?.id === title.id ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={handleUpdate} className="text-green-400 hover:text-green-300"><FaSave /></button>
                                                        <button onClick={() => setEditingTitle(null)} className="text-red-400 hover:text-red-300"><FaTimes /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setEditingTitle(title)} className="text-blue-400 hover:text-blue-300"><FaEdit /></button>
                                                        <button onClick={() => handleDelete(title.id)} className="text-red-400 hover:text-red-300"><FaTrash /></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-4 text-center text-gray-500">Nenhum trato definido.</div>
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

export default ManageContactTitlesModal;