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

                const entidadeMap = new Map<string, string>(data.entidades.map((e: any) => [e.id, e.name]));
                data.collaborators.forEach((c: Collaborator) => {
                    items.push({
                        id: c.id,
                        name: c.full_name,
                        email: c.email,
                        phone: c.telemovel || c.telefone_interno,
                        type: 'Colaborador',
                        role: c.role,
                        organization: c.entidade_id ? (entidadeMap.get(c.entidade_id) || 'Desconhecida') : '—'
                    });
                });

                data.suppliers.forEach((s: Supplier) => {
                    if (s.contact_name) {
                        items.push({ id: s.id + '_main', name: s.contact_name, email: s.contact_email, phone: s.contact_phone, type: 'Fornecedor', role: 'Contacto Geral', organization: s.name });
                    } else {
                         items.push({ id: s.id, name: s.name, email: s.contact_email, phone: s.contact_phone, type: 'Fornecedor', role: 'Empresa', organization: s.name });
                    }
                    s.contacts?.forEach((c: ResourceContact) => {
                        items.push({ id: c.id, name: c.name, email: c.email, phone: c.phone, type: 'Fornecedor', role: c.role, organization: s.name });
                    });
                });

                data.entidades.forEach((e: Entidade) => {
                    if (e.responsavel) {
                        items.push({ id: e.id + '_resp', name: e.responsavel, email: e.email, phone: e.telemovel || e.telefone, type: 'Entidade', role: 'Responsável', organization: e.name });
                    }
                });

                setAgendaItems(items.sort((a,b) => a.name.localeCompare(b.name)));
            } catch (e) {
                console.error(e);
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
                item.organization.toLowerCase().includes(searchQuery.toLowerCase());
            const typeMatch = filterType === '' || item.type === filterType;
            return searchMatch && typeMatch;
        });
    }, [agendaItems, searchQuery, filterType]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = useMemo(() => filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredItems, currentPage, itemsPerPage]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl min-h-screen">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2"><FaAddressBook className="text-brand-secondary" /> Agenda Global</h2>
            </div>

            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <FaSearch className="absolute left-3 top-3 text-gray-500" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Procurar contacto..." className="w-full bg-gray-800 border border-gray-600 text-white rounded pl-10 p-2 text-sm" />
                </div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm">
                    <option value="">Todos os Tipos</option>
                    <option value="Colaborador">Colaboradores</option>
                    <option value="Fornecedor">Fornecedores</option>
                    <option value="Entidade">Entidades</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedItems.map((item, idx) => (
                    <div key={idx} className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-white text-sm">{item.name}</h3>
                            <span className="text-[9px] uppercase bg-gray-900 text-gray-500 px-1 rounded">{item.type}</span>
                        </div>
                        <p className="text-xs text-brand-secondary mb-3">{item.organization}</p>
                        <div className="space-y-1 text-xs text-gray-400">
                            {item.email && <div className="flex items-center gap-2"><FaEnvelope /> {item.email}</div>}
                            {item.phone && <div className="flex items-center gap-2"><FaPhone /> {item.phone}</div>}
                        </div>
                    </div>
                ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={filteredItems.length} />
        </div>
    );
};

export default AgendaDashboard;