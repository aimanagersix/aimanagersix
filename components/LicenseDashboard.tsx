import React, { useMemo, useState } from 'react';
import { SoftwareLicense, LicenseAssignment, LicenseStatus, Equipment, Assignment, Collaborator, CriticalityLevel, BusinessService, ServiceDependency, SoftwareCategory } from '../types';
import { EditIcon, FaTrash as DeleteIcon, PlusIcon, FaKey } from './common/Icons';
import Pagination from './common/Pagination';
import { FaToggleOn, FaToggleOff, FaLaptop, FaTags } from 'react-icons/fa';

interface LicenseDashboardProps {
  licenses: SoftwareLicense[];
  licenseAssignments: LicenseAssignment[];
  equipmentData: Equipment[];
  collaborators: Collaborator[];
  onEdit?: (license: SoftwareLicense) => void;
  onDelete?: (id: string) => void;
  onCreate?: () => void;
  onToggleStatus?: (id: string) => void;
}

export const LicenseDashboard: React.FC<LicenseDashboardProps> = ({ licenses, licenseAssignments, onEdit, onDelete, onCreate, onToggleStatus }) => {
    const usageMap = useMemo(() => {
        const counts: Record<string, number> = {};
        licenseAssignments.forEach(la => { if(!la.return_date) counts[la.software_license_id] = (counts[la.software_license_id] || 0) + 1; });
        return counts;
    }, [licenseAssignments]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-xl font-semibold text-white">Licenciamento de Software</h2><p className="text-sm text-gray-500">Gestão de chaves e ativações</p></div>
                <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md font-bold shadow-lg"><PlusIcon /> Adicionar</button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3">Produto</th>
                            <th className="px-6 py-3">Chave / Identificador</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-center">Ativações</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {licenses.map(lic => {
                            const used = usageMap[lic.id] || 0;
                            const isExceeded = !lic.is_oem && used > lic.total_seats;
                            return (
                                <tr key={lic.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">{lic.product_name} {lic.is_oem && <span className="ml-2 text-[8px] bg-purple-900 text-purple-200 px-1 rounded">OEM</span>}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{lic.license_key}</td>
                                    <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${lic.status === 'Ativo' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{lic.status}</span></td>
                                    <td className="px-6 py-4 text-center"><div className={`text-xs font-bold ${isExceeded ? 'text-red-400' : 'text-white'}`}>{used} / {lic.is_oem ? '∞' : lic.total_seats}</div></td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-4">
                                            {onToggleStatus && <button onClick={() => onToggleStatus(lic.id)} className="text-xl">{lic.status === 'Ativo' ? <FaToggleOn className="text-green-400" /> : <FaToggleOff className="text-gray-500" />}</button>}
                                            {onEdit && <button onClick={() => onEdit(lic)} className="text-blue-400"><EditIcon /></button>}
                                            {onDelete && <button onClick={() => onDelete(lic.id)} className="text-red-400"><DeleteIcon /></button>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};