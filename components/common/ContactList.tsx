
import React, { useState, useEffect } from 'react';
import { ResourceContact, ContactRole, ContactTitle } from '../../types';
import { FaPlus, FaUserTie, FaEnvelope, FaPhone, FaTrash, FaCog, FaEdit, FaSave, FaToggleOn, FaToggleOff, FaExclamationCircle } from 'react-icons/fa';
import * as dataService from '../../services/dataService';
import ManageContactRolesModal from '../ManageContactRolesModal';
import ManageContactTitlesModal from '../ManageContactTitlesModal';

interface ContactListProps {
    contacts: ResourceContact[];
    onChange: (contacts: ResourceContact[]) => void;
    resourceType: 'supplier' | 'entidade' | 'instituicao';
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone: string) => {
    if (!phone || phone.trim() === '') return true;
    const cleaned = phone.replace(/[\s-()]/g, '').replace(/^\+351/, '');
    return /^(9[1236]\d{7}|2\d{8})$/.test(cleaned);
};

export const ContactList: React.FC<ContactListProps> = ({ contacts, onChange, resourceType }) => {
    const [newContact, setNewContact] = useState<Partial<ResourceContact>>({
        title: '',
        name: '',
        role: 'Técnico',
        email: '',
        phone: '',
        is_active: true
    });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [titles, setTitles] = useState<string[]>([]);
    const [showManageRoles, setShowManageRoles] = useState(false);
    const [showManageTitles, setShowManageTitles] = useState(false);
    const [error, setError] = useState<string>('');

    const loadData = async () => {
        try {
            const data = await dataService.fetchAllData();
            if (data.contactRoles && data.contactRoles.length > 0) {
                setRoles(data.contactRoles.map((r: any) => r.name).sort());
            } else {
                setRoles(['Técnico', 'Comercial', 'Financeiro', 'DPO/CISO', 'Diretor', 'Secretaria']);
            }
            if (data.contactTitles && data.contactTitles.length > 0) {
                setTitles(data.contactTitles.map((t: any) => t.name).sort());
            } else {
                setTitles(['Sr.', 'Sra.', 'Dr.', 'Dra.', 'Eng.', 'Eng.ª']);
            }
        } catch (e) {
            console.error("Failed to load contact metadata", e);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setNewContact({ title: '', name: '', role: roles[0] || 'Técnico', email: '', phone: '', is_active: true });
        setEditingIndex(null);
        setError('');
    };

    const handleAddOrUpdateContact = () => {
        if (!newContact.name?.trim()) {
            setError("O nome é obrigatório.");
            return;
        }
        if (newContact.email && !isValidEmail(newContact.email)) {
            setError("Email inválido.");
            return;
        }
        if (newContact.phone && !isValidPhone(newContact.phone)) {
            setError("Telefone inválido (9 dígitos, iniciar com 2 ou 9).");
            return;
        }
        
        setError('');

        if (editingIndex !== null) {
            // Update existing
            const updatedContacts = [...contacts];
            updatedContacts[editingIndex] = {
                ...updatedContacts[editingIndex],
                title: newContact.title,
                name: newContact.name || '',
                role: newContact.role || 'Técnico',
                email: newContact.email || '',
                phone: newContact.phone || '',
                is_active: newContact.is_active
            };
            onChange(updatedContacts);
        } else {
            // Add new
            const contact: ResourceContact = {
                id: crypto.randomUUID(),
                resource_type: resourceType,
                resource_id: '', // Will be set on save of parent
                title: newContact.title,
                name: newContact.name || '',
                role: newContact.role || 'Técnico',
                email: newContact.email || '',
                phone: newContact.phone || '',
                is_active: true
            };
            onChange([...contacts, contact]);
        }
        resetForm();
    };

    const handleEditContact = (index: number) => {
        setEditingIndex(index);
        const contactToEdit = contacts[index];
        setNewContact({
            title: contactToEdit.title || '',
            name: contactToEdit.name || '',
            role: contactToEdit.role || '',
            email: contactToEdit.email || '',
            phone: contactToEdit.phone || '',
            is_active: contactToEdit.is_active !== false 
        });
        setError('');
    };

    const handleToggleStatus = (index: number) => {
        const updatedContacts = [...contacts];
        const currentStatus = updatedContacts[index].is_active !== false;
        updatedContacts[index].is_active = !currentStatus;
        onChange(updatedContacts);
    };

    const handleRemoveContact = (index: number) => {
        if (confirm("Tem a certeza que deseja remover este contacto?")) {
            onChange(contacts.filter((_, i) => i !== index));
            if (editingIndex === index) resetForm();
        }
    };

    return (
        <div className="space-y-4 p-1">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-bold flex items-center gap-2">
                        {editingIndex !== null ? <FaEdit className="text-blue-400" /> : <FaPlus className="text-green-400" />}
                        {editingIndex !== null ? 'Editar Contacto' : 'Adicionar Contacto'}
                    </h4>
                    {editingIndex !== null && (
                        <button type="button" onClick={resetForm} className="text-xs text-gray-400 hover:text-white underline">Cancelar Edição</button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Trato</label>
                        <div className="flex gap-2">
                            <select 
                                value={newContact.title || ''}
                                onChange={(e) => setNewContact({...newContact, title: e.target.value})}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                            >
                                <option value="">--</option>
                                {titles.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <button 
                                type="button" 
                                onClick={() => setShowManageTitles(true)}
                                className="bg-gray-600 text-white px-2 rounded hover:bg-gray-500"
                                title="Gerir Tratos"
                            >
                                <FaCog />
                            </button>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Nome</label>
                        <input 
                            type="text" 
                            value={newContact.name || ''}
                            onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                            placeholder="Ex: João Silva"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Papel / Função</label>
                        <div className="flex gap-2">
                            <select 
                                value={newContact.role || ''}
                                onChange={(e) => setNewContact({...newContact, role: e.target.value})}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                            >
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <button 
                                type="button" 
                                onClick={() => setShowManageRoles(true)}
                                className="bg-gray-600 text-white px-2 rounded hover:bg-gray-500"
                                title="Gerir Funções"
                            >
                                <FaCog />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Email</label>
                        <input 
                            type="email" 
                            value={newContact.email || ''}
                            onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                            placeholder="email@exemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Telefone</label>
                        <input 
                            type="text" 
                            value={newContact.phone || ''}
                            onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                            placeholder="Ex: 912345678"
                        />
                    </div>
                </div>
                
                {error && <div className="text-red-400 text-xs mb-3 flex items-center gap-2"><FaExclamationCircle/> {error}</div>}

                <button 
                    type="button" 
                    onClick={handleAddOrUpdateContact}
                    className={`w-full text-white py-2 rounded flex items-center justify-center gap-2 transition-colors ${editingIndex !== null ? 'bg-blue-600 hover:bg-blue-500' : 'bg-green-600 hover:bg-green-500'}`}
                >
                    {editingIndex !== null ? <><FaSave /> Atualizar Contacto</> : <><FaUserTie /> Adicionar Pessoa</>}
                </button>
            </div>

            <div>
                <h4 className="text-white font-bold mb-3 border-b border-gray-700 pb-1">Lista de Contactos ({contacts.length})</h4>
                <div className="space-y-2">
                    {contacts.map((contact, idx) => {
                        const isActive = contact.is_active !== false;
                        return (
                            <div key={idx} className={`p-3 rounded border flex justify-between items-center ${isActive ? 'bg-gray-800 border-gray-700' : 'bg-gray-800/50 border-gray-700 opacity-70'}`}>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className={`font-bold text-sm flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                            <FaUserTie className={isActive ? "text-gray-400" : "text-gray-600"}/> 
                                            {contact.title && <span className="font-normal">{contact.title}</span>}
                                            {contact.name} 
                                        </p>
                                        <span className="text-xs font-normal bg-gray-700 px-2 rounded text-gray-300">{contact.role}</span>
                                        {!isActive && <span className="text-[10px] uppercase bg-red-900/50 text-red-300 px-1 rounded">Inativo</span>}
                                    </div>
                                    <div className="text-xs text-gray-400 flex gap-3 mt-1">
                                        {contact.email && <span className="flex items-center gap-1"><FaEnvelope className="h-3 w-3"/> {contact.email}</span>}
                                        {contact.phone && <span className="flex items-center gap-1"><FaPhone className="h-3 w-3"/> {contact.phone}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => handleToggleStatus(idx)}
                                        className={`p-2 rounded-full hover:bg-gray-700 ${isActive ? 'text-green-400' : 'text-gray-500'}`}
                                        title={isActive ? "Colocar Inativo" : "Ativar"}
                                    >
                                        {isActive ? <FaToggleOn className="h-5 w-5"/> : <FaToggleOff className="h-5 w-5"/>}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handleEditContact(idx)}
                                        className="text-blue-400 hover:text-blue-300 p-2 hover:bg-gray-700 rounded-full"
                                        title="Editar"
                                    >
                                        <FaEdit className="h-4 w-4"/>
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveContact(idx)}
                                        className="text-red-400 hover:text-red-300 p-2 hover:bg-gray-700 rounded-full"
                                        title="Remover"
                                    >
                                        <FaTrash className="h-4 w-4"/>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {contacts.length === 0 && (
                        <p className="text-center text-gray-500 text-sm py-4 italic">Nenhum contacto adicional registado.</p>
                    )}
                </div>
            </div>

            {showManageRoles && (
                <ManageContactRolesModal 
                    onClose={() => setShowManageRoles(false)} 
                    onRolesUpdated={loadData} 
                />
            )}
            
            {showManageTitles && (
                <ManageContactTitlesModal 
                    onClose={() => setShowManageTitles(false)} 
                    onTitlesUpdated={loadData} 
                />
            )}
        </div>
    );
};
