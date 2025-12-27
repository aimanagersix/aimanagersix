import React, { useState, useMemo, useEffect } from 'react';
import { ProcurementRequest, Collaborator, Supplier, ProcurementStatus, UserRole } from '../types';
import { FaShoppingCart, FaPlus, FaSearch, FaFilter, FaCheckCircle, FaTimesCircle, FaBoxOpen, FaEdit, FaTrash, FaMicrochip, FaKey, FaSort, FaSortUp, FaSortDown, FaSync, FaEye } from 'react-icons/fa';
import Pagination from './common/Pagination';
import * as dataService from '../services/dataService'; // For brand fetching if not passed via props, but assume props passed usually

interface ProcurementDashboardProps {
    requests: ProcurementRequest[];
    collaborators: Collaborator[];
    suppliers: Supplier[];
    currentUser: Collaborator | null;
    onCreate?: () => void;
    onEdit?: (request: ProcurementRequest) => void;
    onDelete?: (id: string) => void;
    onReceive?: (request: ProcurementRequest) => void;
    canApprove?: boolean;
}

const getStatusClass = (status: string) => {
    switch (status) {
        case ProcurementStatus.Pending: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case ProcurementStatus.Approved: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case ProcurementStatus.Rejected: return 'bg-red-500/20 text-red-400 border-red-500/30';
        case ProcurementStatus.Ordered: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        case ProcurementStatus.Received: return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
        case ProcurementStatus.Completed: return 'bg-green-500/20 text-green-400 border-green-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

// Helper Component for Sortable Headers
const SortableHeader: React.FC<{
    label: string;
    sortKey: string;
    currentSort: { key: string; direction: 'ascending' | 'descending' };
    onSort: (key: string) => void;
    className?: string;
}> = ({ label, sortKey, currentSort, onSort, className = "" }) => (
    <th 
        scope="col" 
        className={`px-6 py-3 cursor-pointer hover:bg-gray-700/50 transition-colors group ${className}`}
        onClick={() => onSort(sortKey)}
    >
        <div className={`flex items-center gap-2 ${className.includes('text-right') ? 'justify-end' : className.includes('text-center') ? 'justify-center' : 'justify-start'}`}>
            {label}
            <span className="text-gray-500 group-hover:text-gray-300">
                {currentSort.key === sortKey ? (
                    currentSort.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />
                ) : (
                    <FaSort className="opacity-50" />
                )}
            </span>
        </div>
    </th>
);

const ProcurementDashboard: React.FC<ProcurementDashboardProps> = ({ requests = [], collaborators, suppliers, currentUser, onCreate, onEdit, onDelete, onReceive, canApprove = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [brandMap, setBrandMap] = useState<Map<string, string>>(new Map());
    
    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
        key: 'request_date',
        direction: 'descending'
    });

    useEffect(() => {
        const loadBrands = async () => {
            const data = await dataService.fetchAllData();
            const map = new Map<string, string>(data.brands.map((b: any) => [b.id, b.name]));
            setBrandMap(map);
        };
        loadBrands();
    }, []);

    // Fix: fullName to full_name
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);

    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setFilterStatus('');
        setCurrentPage(1);
    };

    const filteredRequests = useMemo(() => {
        if (!requests) return [];
        
        let filtered = requests.filter(r => {
            const requesterName = collaboratorMap.get(r.requester_id)?.toLowerCase() || '';
            const supplierName = r.supplier_id ? (supplierMap.get(r.supplier_id)?.toLowerCase() || '') : '';
            const brandName = r.brand_id ? (brandMap.get(r.brand_id)?.toLowerCase() || '') : '';
            
            const searchMatch = 
                r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                requesterName.includes(searchQuery.toLowerCase()) ||
                supplierName.includes(searchQuery.toLowerCase()) ||
                brandName.includes(searchQuery.toLowerCase());
            
            const statusMatch = filterStatus === '' || r.status === filterStatus;
            
            return searchMatch && statusMatch;
        });

        // Sorting Logic
        filtered.sort((a, b) => {
            let valA: any = a[sortConfig.key as keyof ProcurementRequest];
            let valB: any = b[sortConfig.key as keyof ProcurementRequest];

            // Resolve values for specific sort keys
            if (sortConfig.key === 'requester_id') {
                valA = collaboratorMap.get(a.requester_id) || '';
                valB = collaboratorMap.get(b.requester_id) || '';
            } else if (sortConfig.key === 'brand_supplier') {
                // Hybrid Sort for the combined column
                const brandA = a.brand_id ? brandMap.get(a.brand_id) : '';
                const brandB = b.brand_id ? brandMap.get(b.brand_id) : '';
                const supA = a.supplier_id ? supplierMap.get(a.supplier_id) : '';
                const supB = b.supplier_id ? supplierMap.get(b.supplier_id) : '';
                valA = (brandA || '') + (supA || '');
                valB = (brandB || '') + (supB || '');
            } else if (sortConfig.key === 'estimated_cost') {
                valA = a.estimated_cost || 0;
                valB = b.estimated_cost || 0;
            }

            // Null safety
            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            // String comparison
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortConfig.direction === 'ascending' 
                    ? valA.localeCompare(valB) 
                    : valB.localeCompare(valA);
            }
            
            // Numeric/Date comparison
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [requests, searchQuery, filterStatus, collaboratorMap, supplierMap, brandMap, sortConfig]);

    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const paginatedRequests = useMemo(() => {
        return filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredRequests, currentPage, itemsPerPage]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl animate-fade-in">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FaShoppingCart className="text-blue-400" /> Gestão de Aquisições
                    </h2>
                    <p className="text-sm text-on-surface-dark-secondary mt-1">
                        Controlo de pedidos de compra, aprovações e receção de material.
                    </p>
                </div>
                {onCreate && (
                    <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md font-bold uppercase text-xs tracking-widest hover:bg-brand-secondary transition-all shadow-lg active:scale-95">
                        <FaPlus /> Novo Pedido
                    </button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-gray-900/30 p-4 rounded-lg border border-gray-700">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Procurar pedido, requerente, fornecedor, marca..."
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-md pl-9 p-2 text-sm focus:border-brand-secondary outline-none"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-white rounded-md p-2 text-sm sm:w-48 font-bold"
                >
                    <option value="">Todos os Estados</option>
                    {Object.values(ProcurementStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button 
                    onClick={handleClearFilters}
                    className="px-4 py-2 text-xs uppercase tracking-widest font-black bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center gap-2 border border-gray-600 whitespace-nowrap"
                >
                    <FaSync className={searchQuery || filterStatus ? "text-brand-secondary" : ""} /> Limpar
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-[10px] text-gray-500 uppercase font-black tracking-widest bg-gray-800">
                        <tr>
                            <th scope="col" className="px-4 py-3 w-10"></th>
                            <SortableHeader label="Data" sortKey="request_date" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Tipo" sortKey="resource_type" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <SortableHeader label="Pedido" sortKey="title" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Marca/Fornecedor" sortKey="brand_supplier" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Qtd" sortKey="quantity" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <SortableHeader label="Valor Est." sortKey="estimated_cost" currentSort={sortConfig} onSort={handleSort} className="text-right" />
                            <SortableHeader label="Estado" sortKey="status" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <th scope="col" className="px-6 py-3 text-center">Gestão</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {paginatedRequests.length > 0 ? paginatedRequests.map(req => {
                            const brandName = req.brand_id ? brandMap.get(req.brand_id) : null;
                            const supplierName = req.supplier_id ? supplierMap.get(req.supplier_id) : '-';
                            
                            return (
                            <tr 
                                key={req.id} 
                                className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer transition-colors"
                                onClick={() => onEdit && onEdit(req)}
                            >
                                <td className="px-4 py-4 text-center">
                                    <FaEye className="text-gray-600 hover:text-brand-secondary transition-colors" size={14} />
                                </td>
                                <td className="px-6 py-4 text-white whitespace-nowrap text-xs font-bold">{new Date(req.request_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-center">
                                    {req.resource_type === 'Hardware' ? <FaMicrochip title="Hardware" className="text-blue-400 mx-auto" size={14}/> : <FaKey title="Software" className="text-yellow-400 mx-auto" size={14}/>}
                                </td>
                                <td className="px-6 py-4 font-bold text-on-surface-dark text-sm">
                                    {req.title}
                                    {req.priority === 'Urgente' && <span className="ml-2 text-[9px] bg-red-900 text-red-200 px-1 rounded font-black uppercase tracking-tighter shadow-lg">Urgente</span>}
                                </td>
                                <td className="px-6 py-4 text-xs">
                                    {brandName && <div className="text-white font-bold">{brandName}</div>}
                                    <div className="text-gray-400">{supplierName}</div>
                                </td>
                                <td className="px-6 py-4 text-center font-mono font-bold text-white">{req.quantity}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-brand-secondary">€ {req.estimated_cost ? req.estimated_cost.toLocaleString() : '0'}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 text-[9px] font-black uppercase rounded border ${getStatusClass(req.status)}`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-center gap-3">
                                        {onReceive && req.status === ProcurementStatus.Received && (
                                            <button 
                                                onClick={() => onReceive(req)}
                                                className="text-green-400 hover:text-green-200 transition-colors"
                                                title="Entrada em Stock"
                                            >
                                                <FaBoxOpen size={16} />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button onClick={() => onDelete(req.id)} className="text-red-400 hover:text-red-300 transition-colors" title="Excluir">
                                                <FaTrash size={14}/>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}) : (
                            <tr>
                                <td colSpan={9} className="text-center py-10 text-gray-500 italic">Nenhum pedido de aquisição encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={filteredRequests.length}
            />
        </div>
    );
};

export default ProcurementDashboard;