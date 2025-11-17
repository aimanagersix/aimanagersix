import React, { useMemo, useState, useEffect } from 'react';
import { SoftwareLicense, LicenseAssignment, LicenseStatus } from '../types';
import { EditIcon, DeleteIcon, ReportIcon } from './common/Icons';
import { FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Pagination from './common/Pagination';

interface LicenseDashboardProps {
  licenses: SoftwareLicense[];
  licenseAssignments: LicenseAssignment[];
  initialFilter?: any;
  onClearInitialFilter?: () => void;
  onEdit?: (license: SoftwareLicense) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onGenerateReport?: () => void;
}

const getStatusClass = (status?: LicenseStatus) => {
    switch (status) {
        case LicenseStatus.Ativo: return 'bg-green-500/20 text-green-400';
        case LicenseStatus.Inativo: return 'bg-gray-500/20 text-gray-400';
        default: return 'bg-gray-500/20 text-gray-400';
    }
};

const LicenseDashboard: React.FC<LicenseDashboardProps> = ({ licenses, licenseAssignments, onEdit, onDelete, onGenerateReport, initialFilter, onClearInitialFilter, onToggleStatus }) => {
    
    const [filters, setFilters] = useState({ productName: '', licenseKey: '', status: '', invoiceNumber: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    useEffect(() => {
        if (initialFilter) {
            const blankFilters = { productName: '', licenseKey: '', status: '', invoiceNumber: '' };
            setFilters({ ...blankFilters, ...initialFilter });
        }
        setCurrentPage(1);
    }, [initialFilter]);

    const usedSeatsMap = useMemo(() => {
        return licenseAssignments.reduce((acc, assignment) => {
            acc.set(assignment.softwareLicenseId, (acc.get(assignment.softwareLicenseId) || 0) + 1);
            return acc;
        }, new Map<string, number>());
    }, [licenseAssignments]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        onClearInitialFilter?.();
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({ productName: '', licenseKey: '', status: '', invoiceNumber: '' });
        onClearInitialFilter?.();
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };

    const filteredLicenses = useMemo(() => {
        return licenses.filter(license => {
            const nameMatch = filters.productName === '' || license.productName.toLowerCase().includes(filters.productName.toLowerCase());
            const keyMatch = filters.licenseKey === '' || license.licenseKey.toLowerCase().includes(filters.licenseKey.toLowerCase());
            const invoiceMatch = filters.invoiceNumber === '' || (license.invoiceNumber && license.invoiceNumber.toLowerCase().includes(filters.invoiceNumber.toLowerCase()));

            const statusMatch = (() => {
                if (!filters.status) return true;

                // Filter by new status property
                if (filters.status === LicenseStatus.Ativo) return (license.status || LicenseStatus.Ativo) === LicenseStatus.Ativo;
                if (filters.status === LicenseStatus.Inativo) return license.status === LicenseStatus.Inativo;

                // Filter by seat usage
                const usedSeats = usedSeatsMap.get(license.id) || 0;
                const availableSeats = license.totalSeats - usedSeats;
                if (filters.status === 'available' && availableSeats <= 0) return false;
                if (filters.status === 'in_use' && usedSeats === 0) return false;
                if (filters.status === 'depleted' && availableSeats > 0) return false;

                return true;
            })();
            
            return nameMatch && keyMatch && invoiceMatch && statusMatch;
        });
    }, [licenses, filters, usedSeatsMap]);

    const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage);
    const paginatedLicenses = useMemo(() => {
        return filteredLicenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredLicenses, currentPage, itemsPerPage]);


    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-xl font-semibold text-white">Gerenciar Licenças de Software</h2>
                 {onGenerateReport && (
                    <button
                        onClick={onGenerateReport}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-brand-secondary text-white rounded-md hover:bg-brand-primary transition-colors"
                    >
                        <ReportIcon />
                        Gerar Relatório
                    </button>
                )}
            </div>

            <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input type="text" id="productNameFilter" name="productName" value={filters.productName} onChange={handleFilterChange} placeholder="Filtrar por Produto..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary" />
                    <input type="text" id="licenseKeyFilter" name="licenseKey" value={filters.licenseKey} onChange={handleFilterChange} placeholder="Filtrar por Chave..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary" />
                    <input type="text" id="invoiceNumberFilter" name="invoiceNumber" value={filters.invoiceNumber} onChange={handleFilterChange} placeholder="Filtrar por Nº Fatura..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary" />
                    <select id="statusFilter" name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary">
                        <option value="">Todos os Estados</option>
                        <option value={LicenseStatus.Ativo}>Ativo</option>
                        <option value={LicenseStatus.Inativo}>Inativo</option>
                        <option value="available">Com Vagas</option>
                        <option value="in_use">Em Uso</option>
                        <option value="depleted">Esgotado</option>
                    </select>
                </div>
                 <div className="flex justify-end">
                    <button onClick={clearFilters} className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">
                        Limpar Filtros
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nome do Produto</th>
                            <th scope="col" className="px-6 py-3">Chave de Licença</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3 text-center">Uso (Total/Uso/Disp)</th>
                            <th scope="col" className="px-6 py-3">Datas</th>
                            <th scope="col" className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedLicenses.length > 0 ? paginatedLicenses.map((license) => {
                            const usedSeats = usedSeatsMap.get(license.id) || 0;
                            const availableSeats = license.totalSeats - usedSeats;
                            const status = license.status || LicenseStatus.Ativo;
                            return (
                                <tr key={license.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                                    <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">{license.productName}</td>
                                    <td className="px-6 py-4 font-mono">{license.licenseKey}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(status)}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-semibold text-white">{license.totalSeats}</span> / <span>{usedSeats}</span> / <span className={`font-bold ${availableSeats > 0 ? 'text-green-400' : 'text-red-400'}`}>{availableSeats}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        {license.purchaseDate && <div>Compra: {license.purchaseDate}</div>}
                                        {license.expiryDate && <div className="text-yellow-400">Expira: {license.expiryDate}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center gap-4">
                                            {onToggleStatus && (
                                                <button 
                                                    onClick={() => onToggleStatus(license.id)} 
                                                    className={`text-xl ${status === LicenseStatus.Ativo ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
                                                    title={status === LicenseStatus.Ativo ? 'Inativar' : 'Ativar'}
                                                >
                                                    {status === LicenseStatus.Ativo ? <FaToggleOn /> : <FaToggleOff />}
                                                </button>
                                            )}
                                            {onEdit && (
                                                <button onClick={() => onEdit(license)} className="text-blue-400 hover:text-blue-300" aria-label={`Editar ${license.productName}`}>
                                                    <EditIcon />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button onClick={() => onDelete(license.id)} className="text-red-400 hover:text-red-300" aria-label={`Excluir ${license.productName}`}>
                                                    <DeleteIcon />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-on-surface-dark-secondary">Nenhuma licença de software encontrada.</td>
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
                onItemsPerPageChange={handleItemsPerPageChange}
                totalItems={filteredLicenses.length}
            />
        </div>
    );
};

export default LicenseDashboard;
