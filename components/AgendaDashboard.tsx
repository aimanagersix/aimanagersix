import React, { useState, useMemo, useEffect } from 'react';
import { FaAddressBook, FaSearch, FaUserTie, FaBuilding, FaIndustry, FaUniversity, FaPhone, FaEnvelope, FaFilter } from 'react-icons/fa';
import Pagination from './common/Pagination';
import { Collaborator, Supplier, Entidade, Instituicao, ResourceContact } from '../types';
import * as dataService from '../services/dataService';

interface AgendaItem {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    type: 'Colaborador' | 'Fornecedor' | 'Entidade' | 'Instituição';
    role?: string;
    organization: string;
}

const AgendaDashboard: React.FC = () => {
    const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await dataService.fetchAllData();
                const items: AgendaItem[] = [];

                // 1. Collaborators
                const entidadeMap = new Map(data.entidades.map((e: any) => [e.id, e.name]));
                data.collaborators.forEach((c: Collaborator) => {
                    items.push({
                        id: c.id,
                        name: c.fullName,
                        email: c.email,
                        phone: c.telemovel || c.telefoneInterno,
                        type: 'Colaborador',
                        role: c.role,
                        organization: c.entidadeId ? (entidadeMap.get(c.entidadeId) || 'Desconhecida') : '—'
                    });
                });

                // 2. Suppliers (Main & Contacts)
                data.suppliers.forEach((s: Supplier) => {
                    // Main Contact
                    if (s.contact_name) {
                        items.push({
                            id: s.id + '_main',
                            name: s.contact_name,
                            email: s.contact_email,
                            phone: s.contact_phone,
                            type: 'Fornecedor',
                            role: 'Contacto Geral',
                            organization: s.name
                        });
                    } else {
                         // If no contact person, list the company itself
                         items.push({
                            id: s.id,
                            name: s.name,
                            email: s.contact_email,
                            phone: s.contact_phone,
                            type: 'Fornecedor',
                            role: 'Empresa',
                            organization: s.name
                        });
                    }

                    // Extra Contacts
                    s.contacts?.forEach((c: ResourceContact) => {
                        items.push({
                            id: c.id,
                            name: c.name,
                            email: c.email,
                            phone: c.phone,
                            type: 'Fornecedor',
                            role: c.role,
                            organization: s.name
                        });
                    });
                });

                // 3. Entities (Main & Contacts)
                data.entidades.forEach((e: Entidade) => {
                    // Main Responsible
                    if (e.responsavel) {
                        items.push({
                            id: e.id + '_resp',
                            name: e.responsavel,
                            email: e.email,
                            phone: e.telemovel || e.telefone,
                            type: 'Entidade',
                            role: 'Responsável',
                            organization: e.name
                        });
                    }

                    // Extra Contacts
                    e.contacts?.forEach((c: ResourceContact) => {
                        items.push({
                            id: c.id,
                            name: c.name,
                            email: c.email,
                            phone: c.phone,
                            type: 'Entidade',
                            role: c.role,
                            organization: e.name
                        });
                    });
                });

                // 4. Institutions (Main & Contacts)
                data.instituicoes.forEach((i: Instituicao) => {
                     // Extra Contacts
                    i.contacts?.forEach((c: ResourceContact) => {
                        items.push({
                            id: c.id,
                            name: c.name,
                            email: c.email,
                            phone: c.phone,
                            type: 'Instituição',
                            role: c.role,
                            organization: i.name
                        });
                    });
                });

                setAgendaItems(items.sort((a,b) => a.name.localeCompare(b.name)));

            } catch (e) {
                console.error("Error loading agenda:", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredItems = useMemo(() => {
        return agendaItems.filter(item => {
            const searchMatch = searchQuery === '' || 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const typeMatch = filterType === '' || item.type === filterType;
            return searchMatch && typeMatch;
        });
    }, [agendaItems, searchQuery, filterType]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
        return filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredItems, currentPage, itemsPerPage]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Colaborador': return <FaUserTie className="text-blue-400" />;
            case 'Fornecedor': return <FaIndustry className="text-orange-400" />;
            case 'Entidade': return <FaBuilding className="text-green-400" />;
            case 'Instituição': return <FaUniversity className="text-purple-400" />;
            default: return <FaAddressBook className="text-gray-400" />;
        }
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FaAddressBook className="text-brand-secondary" /> Agenda de Contactos
                    </h2>
                    <p className="text-sm text-on-surface-dark-secondary mt-1">
                        Diretório global de contactos (Internos e Externos).
                    </p>
                </div>
            </div>

            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Pesquisar por nome, email ou organização..."
                        className="w-full bg-gray-800 border border-gray-600 text-white rounded-md pl-9 p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaFilter className="h-3 w-3 text-gray-400" />
                    </div>
                    <select 
                        value={filterType} 
                        onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-gray-800 border border-gray-600 text-white rounded-md pl-8 p-2 text-sm"
                    >
                        <option value="">Todos os Tipos</option>
                        <option value="Colaborador">Colaboradores</option>
                        <option value="Fornecedor">Fornecedores</option>
                        <option value="Entidade">Entidades</option>
                        <option value="Instituição">Instituições</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">A carregar contactos...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedItems.length > 0 ? paginatedItems.map((item, idx) => (
                            <div key={idx} className="bg-gray-800 border border-gray-700 p-4 rounded-lg hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-900 p-2 rounded-full">
                                            {getTypeIcon(item.type)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm">{item.name}</h3>
                                            <p className="text-xs text-gray-400">{item.role || item.type}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] uppercase bg-gray-900 text-gray-400 px-2 py-1 rounded border border-gray-700">
                                        {item.type}
                                    </span>
                                </div>
                                
                                <div className="space-y-2 text-sm mt-2 pt-2 border-t border-gray-700/50">
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <FaBuilding className="text-gray-500 w-3 h-3" />
                                        <span className="truncate font-medium">{item.organization}</span>
                                    </div>
                                    {item.email && (
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <FaEnvelope className="text-gray-500 w-3 h-3" />
                                            <a href={`mailto:${item.email}`} className="truncate hover:text-brand-secondary">{item.email}</a>
                                        </div>
                                    )}
                                    {item.phone && (
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <FaPhone className="text-gray-500 w-3 h-3" />
                                            <a href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-brand-secondary hover:underline">{item.phone}</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-8 text-gray-500">Nenhum contacto encontrado.</div>
                        )}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={setItemsPerPage}
                        totalItems={filteredItems.length}
                    />
                </>
            )}
        </div>
    );
};

export default AgendaDashboard;