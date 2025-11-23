import React, { useState, useEffect } from 'react';
import { ResourceContact, ContactRole } from '../../types';
import { FaPlus, FaUserTie, FaEnvelope, FaPhone, FaTrash, FaCog } from 'react-icons/fa';
import * as dataService from '../../services/dataService';
import ManageContactRolesModal from '../ManageContactRolesModal';

interface ContactListProps {
    contacts: ResourceContact[];
    onChange: (contacts: ResourceContact[]) => void;
    resourceType: 'supplier' | 'entidade' | 'instituicao';
}

export const ContactList: React.FC<ContactListProps> = ({ contacts, onChange, resourceType }) => {
    const [newContact, setNewContact] = useState<Partial<ResourceContact>>({
        name: '',
        role: 'Técnico',
        email: '',
        phone: ''
    });
    const [roles, setRoles] = useState<string[]>([]);
    const [showManageRoles, setShowManageRoles] = useState(false);

    const loadRoles = async () => {
        try {
            const data = await dataService.fetchAllData();
            if (data.contactRoles && data.contactRoles.length > 0) {
                setRoles(data.contactRoles.map((r: any) => r.name).sort());
            } else {
                // Fallback defaults if empty
                setRoles(['Técnico', 'Comercial', 'Financeiro', 'DPO/CISO', 'Diretor', 'Secretaria']);
            }
        } catch (e) {
            console.error("Failed to load contact roles", e);
        }
    };

    useEffect(() => {
        loadRoles();
    }, []);

    const handleAddContact = () => {
        if (!newContact.name?.trim()) {
            alert("O nome é obrigatório.");
            return;
        }

        const contact: ResourceContact = {
            id: crypto.randomUUID(),
            resource_type: resourceType,
            resource_id: '', // Will be set on save of parent
            name: newContact.name || '',
            role: newContact.role || 'Técnico',
            email: newContact.email || '',
            phone: newContact.phone || ''
        };

        onChange([...contacts, contact]);
        setNewContact({ name: '', role: roles[0] || 'Técnico', email: '', phone: '' });
    };

    const handleRemoveContact = (index: number) => {
        onChange(contacts.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4 p-1">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2"><FaPlus /> Adicionar Contacto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Nome</label>
                        <input 
                            type="text" 
                            value={newContact.name}
                            onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                            placeholder="Ex: João Silva"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Papel / Função</label>
                        <div className="flex gap-2">
                            <select 
                                value={newContact.role}
                                onChange={(e) => setNewContact({...newContact, role: e.target.value})}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                            >
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <button 
                                type="button" 
                                onClick={() => setShowManageRoles(true)}
                                className="bg-gray-600 text-white px-2 rounded hover:bg-gray-500"
                                title="Gerir Funções (Adicionar/Editar)"
                            >
                                <FaCog />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Email</label>
                        <input 
                            type="email" 
                            value={newContact.email}
                            onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                            placeholder="email@exemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Telefone</label>
                        <input 
                            type="text" 
                            value={newContact.phone}
                            onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                            placeholder="+351..."
                        />
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={handleAddContact}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded flex items-center justify-center gap-2 transition-colors"
                >
                    <FaUserTie /> Adicionar Pessoa
                </button>
            </div>

            <div>
                <h4 className="text-white font-bold mb-3 border-b border-gray-700 pb-1">Lista de Contactos ({contacts.length})</h4>
                <div className="space-y-2">
                    {contacts.map((contact, idx) => (
                        <div key={idx} className="bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white text-sm flex items-center gap-2">
                                    <FaUserTie className="text-gray-400"/> {contact.name} 
                                    <span className="text-xs font-normal bg-gray-700 px-2 rounded text-gray-300">{contact.role}</span>
                                </p>
                                <div className="text-xs text-gray-400 flex gap-3 mt-1">
                                    {contact.email && <span className="flex items-center gap-1"><FaEnvelope className="h-3 w-3"/> {contact.email}</span>}
                                    {contact.phone && <span className="flex items-center gap-1"><FaPhone className="h-3 w-3"/> {contact.phone}</span>}
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => handleRemoveContact(idx)}
                                className="text-red-400 hover:text-red-300 p-2"
                            >
                                <FaTrash className="h-4 w-4"/>
                            </button>
                        </div>
                    ))}
                    {contacts.length === 0 && (
                        <p className="text-center text-gray-500 text-sm py-4 italic">Nenhum contacto adicional registado.</p>
                    )}
                </div>
            </div>

            {showManageRoles && (
                <ManageContactRolesModal 
                    onClose={() => setShowManageRoles(false)} 
                    onRolesUpdated={loadRoles} 
                />
            )}
        </div>
    );
};