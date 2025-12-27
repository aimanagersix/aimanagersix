import React, { useState, useMemo } from 'react';
import { Supplier, CriticalityLevel, BusinessService } from '../types';
// Fix: Removed unused FaArrowRight and added missing FaUserTie
import { EditIcon, FaTrash as DeleteIcon, PlusIcon, FaShieldAlt, FaPhone, FaEnvelope, FaCheckCircle, FaTimesCircle, FaGlobe, FaSearch, FaExclamationTriangle, FaUsers, FaChartPie, FaLandmark, FaUserTie } from './common/Icons';
import { FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Pagination from './common/Pagination';
import SupplierDetailModal from './SupplierDetailModal';
import SortableHeader from './common/SortableHeader';

/**
 * SUPPLIER DASHBOARD - V9.0 (Active Status & Actionable Lifecycle)
 * -----------------------------------------------------------------------------
 * IMPLEMENTAÇÃO: Sistema de Estados Ativo/Inativo (Pedido 3).
 * CONFORMIDADE: Art. 28º DORA - Gestão do Ciclo de Vida do Fornecedor.
 * -----------------------------------------------------------------------------
 */

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
        case CriticalityLevel.Critical: return 'bg-red-600 text-white border-red-700 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]';
        case CriticalityLevel.High: return 'bg-orange-600 text-white border-orange-700';
        case CriticalityLevel.Medium: return 'bg-yellow-600 text-white border-yellow-700';
        case CriticalityLevel.Low: return 'bg-green-600 text-white border-green-700';
        default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
};

const ConcentrationRiskWidget: React.FC<{ services: BusinessService[], suppliers: Supplier[] }> = ({ services, suppliers }) => {
    const criticalServices = services.filter(s => s.criticality === CriticalityLevel.Critical || s.criticality === CriticalityLevel.High);
    if (criticalServices.length === 0) return null;

    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));
    const supplierCounts: Record<string, number> = {};
    criticalServices.forEach(s => {
        const supplierId = s.external_provider_id || 'internal';
        supplierCounts[supplierId] = (supplierCounts[supplierId] || 0) + 1;
    });

    let maxSupplierId = 'internal';
    let maxCount = 0;
    Object.entries(supplierCounts).forEach(([id, count]) => { if (count > maxCount) { maxCount = count; maxSupplierId = id; } });

    const percentage = Math.round((maxCount / criticalServices.length) * 100);
    const supplierName = maxSupplierId === 'internal' ? 'Recursos Internos' : (supplierMap.get(maxSupplierId) || 'Desconhecido');
    const isHighConcentration = percentage > 50; 

    return (
        <div className={`mb-8 p-5 rounded-xl border-l-8 shadow-2xl flex items-center justify-between gap-6 transition-all hover:scale-[1.01] ${isHighConcentration ? 'bg-red-900/20 border-red-500 shadow-red-900/20' : 'bg-green-900/20 border-green-500 shadow-green-900/20'}`}>
            <div className="flex items-start gap-4">
                <div className={`p-4 rounded-full shadow-lg ${isHighConcentration ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {isHighConcentration ? <FaExclamationTriangle size={24} /> : <FaCheckCircle size={24} />}
                </div>
                <div>
                    <h3 className={`font-black text-lg uppercase tracking-widest ${isHighConcentration ? 'text-red-400' : 'text-green-400'}`}>Monitor de Concentração DORA</h3>
                    <p className="text-sm text-gray-300 mt-1 max-w-2xl leading-relaxed">
                        {isHighConcentration 
                            ? `ALERTA CRÍTICO: Detetada dependência de ${percentage}% dos serviços vitais no fornecedor "${supplierName}". Risco de interrupção sistémica elevado conforme Art. 28º.`
                            : `Postura de resiliência adequada. A dispersão de dependências está dentro dos limites de segurança. Fornecedor principal (${supplierName}) detém ${percentage}% da operação.`
                        }
                    </p>
                </div>
            </div>
            <div className="text-right flex flex-col items-end">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Risco Agregado</span>
                <div className={`text-4xl font-black font-mono ${isHighConcentration ? 'text-red-500' : 'text-green-500'}`}>{percentage}%</div>
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
    const [filterIso, setFilterIso] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
        key: 'name',
        direction: 'ascending'
    });

    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const filteredSuppliers = useMemo(() => {
        let filtered = suppliers.filter(s => {
            const searchMatch = searchQuery === '' || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nif?.includes(searchQuery);
            const riskMatch = filterRisk === '' || s.risk_level === filterRisk;
            const isoMatch = filterIso === '' || (filterIso === 'yes' ? s.is_iso27001_certified : !s.is_iso27001_certified);
            const statusMatch = filterStatus === '' || (filterStatus === 'active' ? s.is_active !== false : s.is_active === false);
            return searchMatch && riskMatch && isoMatch && statusMatch;
        });

        filtered.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';
            const riskPriority: Record<string, number> = { [CriticalityLevel.Critical]: 4, [CriticalityLevel.High]: 3, [CriticalityLevel.Medium]: 2, [CriticalityLevel.Low]: 1 };

            switch (sortConfig.key) {
                case 'contracts': valA = a.contracts?.length || 0; valB = b.contracts?.length || 0; break;
                case 'risk_level': valA = riskPriority[a.risk_level] || 0; valB = riskPriority[b.risk_level] || 0; break;
                case 'status': valA = a.is_active !== false ? 'active' : 'inactive'; valB = b.is_active !== false ? 'active' : 'inactive'; break;
                case 'iso': valA = a.is_iso27001_certified ? 1 : 0; valB = b.is_iso27001_certified ? 1 : 0; break;
                default: valA = (a as any)[sortConfig.key] || ''; valB = (b as any)[sortConfig.key] || '';
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return filtered;
    }, [suppliers, searchQuery, filterRisk, filterIso, filterStatus, sortConfig]);

    const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
    const paginatedSuppliers = useMemo(() => filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredSuppliers, currentPage, itemsPerPage]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl animate-fade-in">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-primary/20 rounded-xl text-brand-secondary shadow-lg"><FaShieldAlt size={32}/></div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Cadeia de Abastecimento (NIS2/DORA)</h2>
                        <p className="text-sm text-on-surface-dark-secondary font-medium">Controlo estrito de riscos de terceiros e conformidade regulatória.</p>
                    </div>
                </div>
                {onCreate && (
                    <button onClick={onCreate} className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-black uppercase tracking-widest hover:bg-brand-secondary transition-all shadow-2xl active:scale-95"><PlusIcon /> Novo Fornecedor</button>
                )}
            </div>

            <ConcentrationRiskWidget services={businessServices} suppliers={suppliers} />

            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/40 p-5 rounded-xl border border-gray-700 shadow-inner">
                <div className="relative md:col-span-1">
                    <FaSearch className="absolute left-3 top-3 text-gray-500" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Procurar Firma ou NIF..." className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-10 p-2 text-sm focus:border-brand-secondary outline-none"/>
                </div>
                <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="bg-gray-800 border border-gray-700 text-white rounded-lg p-2 text-sm font-bold">
                    <option value="">Todos os Riscos</option>
                    {Object.values(CriticalityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={filterIso} onChange={(e) => setFilterIso(e.target.value)} className="bg-gray-800 border border-gray-700 text-white rounded-lg p-2 text-sm font-bold">
                    <option value="">ISO 27001 (Todos)</option>
                    <option value="yes">Apenas Certificados</option>
                    <option value="no">Sem Certificação</option>
                </select>
                <button onClick={() => {setSearchQuery(''); setFilterRisk(''); setFilterIso(''); setFilterStatus('');}} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-bold text-xs uppercase tracking-widest border border-gray-600">Limpar Filtros</button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-2xl">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] bg-gray-800">
                        <tr>
                            <SortableHeader label="Fornecedor / NIF" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Contactos" sortKey="contact_name" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="ISO 27001" sortKey="iso" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <SortableHeader label="Risco NIS2" sortKey="risk_level" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <SortableHeader label="Contratos" sortKey="contracts" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <th scope="col" className="px-6 py-3 text-center">Gestão</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {paginatedSuppliers.map((supplier) => {
                            const isActive = supplier.is_active !== false;
                            return (
                                <tr key={supplier.id} className={`group cursor-pointer transition-all ${isActive ? 'bg-surface-dark hover:bg-gray-800/60' : 'bg-gray-800/40 grayscale opacity-60'}`} onClick={() => setSelectedSupplier(supplier)}>
                                    <td className="px-6 py-5 align-top">
                                        <div className="text-white font-bold text-base group-hover:text-brand-secondary transition-colors">{supplier.name}</div>
                                        <div className="text-xs text-gray-500 font-mono mt-1">{supplier.nif || 'NIF PENDENTE'}</div>
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <div className="flex flex-col gap-1">
                                            {supplier.contact_name && <div className="text-gray-300 font-bold text-xs flex items-center gap-2"><FaUserTie className="text-gray-500" size={10}/> {supplier.contact_name}</div>}
                                            {supplier.contact_email && <div className="text-gray-500 text-[11px] flex items-center gap-2"><FaEnvelope size={10}/> {supplier.contact_email}</div>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {supplier.is_iso27001_certified ? <FaCheckCircle className="text-green-500" size={18}/> : <FaTimesCircle className="text-gray-700" size={18}/>}
                                            <span className="text-[9px] font-black uppercase text-gray-600">{supplier.is_iso27001_certified ? 'Validado' : 'Ausente'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`px-3 py-1 text-[10px] rounded-full font-black uppercase border-2 ${getRiskClass(supplier.risk_level)}`}>
                                            {supplier.risk_level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-lg font-black text-white">{(supplier.contracts || []).length}</span>
                                            <span className="text-[9px] font-black uppercase text-gray-600">Acordos</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-center items-center gap-4">
                                            {onToggleStatus && (
                                                <button onClick={() => onToggleStatus(supplier.id)} className={`text-xl transition-transform hover:scale-125 ${isActive ? 'text-green-400' : 'text-gray-500'}`} title={isActive ? 'Suspender Fornecedor' : 'Reativar Fornecedor'}>{isActive ? <FaToggleOn /> : <FaToggleOff />}</button>
                                            )}
                                            {onEdit && <button onClick={() => onEdit(supplier)} className="p-2 bg-gray-800 rounded-lg text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-md"><EditIcon /></button>}
                                            {onDelete && <button onClick={() => onDelete(supplier.id)} className="p-2 bg-gray-800 rounded-lg text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-md"><DeleteIcon /></button>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredSuppliers.length === 0 && (
                            <tr><td colSpan={6} className="p-20 text-center text-gray-600 italic text-lg">Sem fornecedores correspondentes aos critérios.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={filteredSuppliers.length} />
            {selectedSupplier && <SupplierDetailModal supplier={selectedSupplier} onClose={() => setSelectedSupplier(null)} onEdit={() => { setSelectedSupplier(null); if (onEdit) onEdit(selectedSupplier); }} />}
        </div>
    );
};

export default SupplierDashboard;