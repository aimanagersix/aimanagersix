
import React, { useState, useMemo } from 'react';
import { Supplier, CriticalityLevel, BusinessService } from '../types';
// FIX: Replaced non-existent DeleteIcon with an alias for FaTrash
import { EditIcon, FaTrash as DeleteIcon, PlusIcon, FaShieldAlt, FaPhone, FaEnvelope, FaCheckCircle, FaTimesCircle, FaGlobe, FaSearch, FaExclamationTriangle, FaUsers } from './common/Icons';
import { FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Pagination from './common/Pagination';
import SupplierDetailModal from './SupplierDetailModal';

interface SupplierDashboardProps {
  suppliers: Supplier[];
  onEdit?: (supplier: Supplier) => void;
  onDelete?: (id: string) => void;
  onCreate?: () => void;
  businessServices: BusinessService[];
  onToggleStatus?: (id: string) => void;
}

const getRiskClass = (level: CriticalityLevel) => {
    switch (level) {
        case CriticalityLevel.Critical: return 'bg-red-600 text-white border-red-700';
        case CriticalityLevel.High: return 'bg-orange-600 text-white border-orange-700';
        case CriticalityLevel.Medium: return 'bg-yellow-600 text-white border-yellow-700';
        case CriticalityLevel.Low: return 'bg-green-600 text-white border-green-700';
        default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
};

const ConcentrationRiskWidget: React.FC<{ services: BusinessService[], suppliers: Supplier[] }> = ({ services, suppliers }) => {
    // Filter Critical Services
    const criticalServices = services.filter(s => s.criticality === CriticalityLevel.Critical || s.criticality === CriticalityLevel.High);
    
    if (criticalServices.length === 0) return null;

    // Count per supplier
    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));
    const supplierCounts: Record<string, number> = {};
    
    criticalServices.forEach(s => {
        const supplierId = s.external_provider_id || 'internal';
        supplierCounts[supplierId] = (supplierCounts[supplierId] || 0) + 1;
    });

    // Determine Max Concentration
    let maxSupplierId = 'internal';
    let maxCount = 0;
    Object.entries(supplierCounts).forEach(([id, count]) => {
        if (count > maxCount) {
            maxCount = count;
            maxSupplierId = id;
        }
    });

    const percentage = Math.round((maxCount / criticalServices.length) * 100);
    const supplierName = maxSupplierId === 'internal' ? 'Recursos Internos' : (supplierMap.get(maxSupplierId) || 'Desconhecido');
    
    // Alert Threshold (e.g., > 50% dependence on one vendor for critical services)
    const isHighConcentration = percentage > 50; 

    return (
        <div className={`mb-6 p-4 rounded-lg border flex items-center justify-between gap-4 ${isHighConcentration ? 'bg-orange-900/20 border-orange-500/50' : 'bg-green-900/20 border-green-500/50'}`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${isHighConcentration ? 'bg-orange-600 text-white' : 'bg-green-600 text-white'}`}>
                    {isHighConcentration ? <FaExclamationTriangle className="h-5 w-5" /> : <FaCheckCircle className="h-5 w-5" />}
                </div>
                <div>
                    <h3 className={`font-bold text-lg ${isHighConcentration ? 'text-orange-400' : 'text-green-400'}`}>
                        Análise de Concentração (DORA Art. 28º)
                    </h3>
                    <p className="text-sm text-gray-300 mt-1">
                        {isHighConcentration 
                            ? `Alerta: ${percentage}% dos serviços críticos dependem do fornecedor "${supplierName}". Risco de concentração elevado.`
                            : `Risco de concentração controlado. O maior fornecedor (${supplierName}) suporta ${percentage}% dos serviços críticos.`
                        }
                    </p>
                </div>
            </div>
            <div className="text-right hidden sm:block">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Dependência Máxima</div>
                <div className={`text-2xl font-bold ${isHighConcentration ? 'text-orange-400' : 'text-green-400'}`}>{percentage}%</div>
            </div>
        </div>
    );
};

const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ suppliers, onEdit, onDelete, onCreate, businessServices, onToggleStatus }) => {
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [filterRisk, setFilterRisk] = useState<string>('');
    const [filterIso, setFilterIso] = useState<string>(''); // 'yes' | 'no' | ''
    const [filterStatus, setFilterStatus] = useState<string>('');

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s => {
            const searchMatch = searchQuery === '' ||
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.nif?.includes(searchQuery);
            
            const riskMatch = filterRisk === '' || s.risk_level === filterRisk;
            
            const isoMatch = filterIso === '' || 
                (filterIso === 'yes' ? s.is_iso27001_certified : !s.is_iso27001_certified);
                
            const statusMatch = filterStatus === '' || 
                (filterStatus === 'active' ? s.is_active !== false : s.is_active === false);

            return searchMatch && riskMatch && isoMatch && statusMatch;
        }).sort((a,b) => a.name.localeCompare(b.name));
    }, [suppliers, searchQuery, filterRisk, filterIso, filterStatus]);

    const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
    const paginatedSuppliers = useMemo(() => {
        return filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredSuppliers, currentPage, itemsPerPage]);

    const clearFilters = () => {
        setSearchQuery('');
        setFilterRisk('');
        setFilterIso('');
        setFilterStatus('');
        setCurrentPage(1);
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FaShieldAlt className="text-brand-secondary"/> 
                        Gestão de Risco de Fornecedores
                    </h2>
                    <p className="text-sm text-on-surface-dark-secondary mt-1">
                        Avaliação e controlo de fornecedores críticos para a cadeia de abastecimento (NIS2 / DORA).
                    </p>
                </div>
                {onCreate && (
                    <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors">
                        <PlusIcon /> Novo Fornecedor
                    </button>
                )}
            </div>

            <ConcentrationRiskWidget services={businessServices} suppliers={suppliers} />

            <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            placeholder="Procurar por nome ou NIF..."
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md pl-9 p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                        />
                    </div>
                    <select
                        value={filterRisk}
                        onChange={(e) => { setFilterRisk(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                    >
                        <option value="">Todos os Níveis de Risco</option>
                        {Object.values(CriticalityLevel).map(level => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>
                    <select
                        value={filterIso}
                        onChange={(e) => { setFilterIso(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                    >
                        <option value="">Certificação ISO 27001 (Todos)</option>
                        <option value="yes">Sim</option>
                        <option value="no">Não</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                    >
                        <option value="">Todos os Estados</option>
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                    </select>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Fornecedor / NIF</th>
                            <th scope="col" className="px-6 py-3">Contactos</th>
                            <th scope="col" className="px-6 py-3 text-center">ISO 27001</th>
                            <th scope="col" className="px-6 py-3 text-center">Nível de Risco</th>
                            <th scope="col" className="px-6 py-3">Contratos</th>
                            <th scope="col" className="px-6 py-3 text-center">Status</th>
                            <th scope="col" className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSuppliers.length > 0 ? paginatedSuppliers.map((supplier) => {
                            const isActive = supplier.is_active !== false;
                            const extraContacts = supplier.contacts?.length || 0;
                            return (
                            <tr 
                                key={supplier.id} 
                                className={`border-b border-gray-700 cursor-pointer ${isActive ? 'bg-surface-dark hover:bg-gray-800/50' : 'bg-gray-800/50 opacity-70'}`}
                                onClick={() => setSelectedSupplier(supplier)}
                            >
                                <td className="px-6 py-4 font-medium text-on-surface-dark">
                                    <div className="text-base">{supplier.name}</div>
                                    {supplier.nif && <div className="text-xs text-gray-500">NIF: {supplier.nif}</div>}
                                    {supplier.website && (
                                        <a href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-brand-secondary hover:underline flex items-center gap-1 mt-1">
                                            <FaGlobe className="h-3 w-3"/> Website
                                        </a>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {supplier.contact_name ? (
                                        <>
                                            <div className="font-semibold text-xs text-white">{supplier.contact_name}</div>
                                            {supplier.contact_email && <div className="text-xs flex items-center gap-1"><FaEnvelope className="h-3 w-3"/> {supplier.contact_email}</div>}
                                            {supplier.contact_phone && <div className="text-xs flex items-center gap-1"><FaPhone className="h-3 w-3"/> {supplier.contact_phone}</div>}
                                        </>
                                    ) : <span className="text-xs text-gray-500 italic">Sem contacto principal</span>}
                                    
                                    {/* INDICATOR FOR EXTRA CONTACTS */}
                                    {extraContacts > 0 && (
                                        <div className="mt-2 inline-flex items-center gap-1 bg-gray-700/50 text-gray-300 text-[10px] px-2 py-0.5 rounded-full border border-gray-600">
                                            <FaUsers className="h-3 w-3"/> + {extraContacts} Contacto{extraContacts > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {supplier.is_iso27001_certified ? (
                                        <FaCheckCircle className="text-green-500 h-5 w-5 mx-auto" title="Certificado ISO 27001"/>
                                    ) : (
                                        <FaTimesCircle className="text-gray-600 h-5 w-5 mx-auto" title="Não Certificado"/>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 text-xs rounded border font-bold ${getRiskClass(supplier.risk_level)}`}>
                                        {supplier.risk_level}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {supplier.contracts && supplier.contracts.length > 0 ? (
                                        <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-white">
                                            {supplier.contracts.length} Contrato(s)
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-500 italic">--</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 text-xs rounded-full ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center items-center gap-4">
                                        {onToggleStatus && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onToggleStatus(supplier.id); }}
                                                className={`text-xl ${isActive ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
                                                title={isActive ? 'Inativar' : 'Ativar'}
                                            >
                                                {isActive ? <FaToggleOn /> : <FaToggleOff />}
                                            </button>
                                        )}
                                        {onEdit && (
                                            <button onClick={(e) => { e.stopPropagation(); onEdit(supplier); }} className="text-blue-400 hover:text-blue-300" title="Editar">
                                                <EditIcon />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button onClick={(e) => { e.stopPropagation(); onDelete(supplier.id); }} className="text-red-400 hover:text-red-300" title="Excluir">
                                                <DeleteIcon />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}) : (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-on-surface-dark-secondary">
                                    Nenhum fornecedor encontrado.
                                </td>
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
                totalItems={filteredSuppliers.length}
            />

            {selectedSupplier && (
                <SupplierDetailModal
                    supplier={selectedSupplier}
                    onClose={() => setSelectedSupplier(null)}
                    onEdit={() => {
                        setSelectedSupplier(null);
                        if (onEdit) onEdit(selectedSupplier);
                    }}
                />
            )}
        </div>
    );
};

export default SupplierDashboard;
