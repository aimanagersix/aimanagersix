import React, { useState, useMemo } from 'react';
import { Entidade, Instituicao, Collaborator, EntidadeStatus, Assignment, Ticket, CollaboratorHistory, Equipment } from '../types';
import { EditIcon, FaTrash as DeleteIcon, SearchIcon, PlusIcon, ReportIcon } from './common/Icons';
import { FaToggleOn, FaToggleOff, FaBuilding } from 'react-icons/fa';
import Pagination from './common/Pagination';

interface EntidadeDashboardProps {
  escolasDepartamentos: Entidade[];
  instituicoes: Instituicao[];
  collaborators: Collaborator[];
  assignments: Assignment[];
  onEdit?: (entidade: Entidade) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onCreate?: () => void;
  onViewDetails?: (entidade: Entidade) => void;
}

const EntidadeDashboard: React.FC<EntidadeDashboardProps> = ({ escolasDepartamentos: entidadesData, instituicoes, collaborators, onEdit, onDelete, onToggleStatus, onCreate, onViewDetails }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const instituicaoMap = useMemo(() => new Map(instituicoes.map(i => [i.id, i.name])), [instituicoes]);
    
    const collabCountMap = useMemo(() => {
        const counts: Record<string, number> = {};
        collaborators.forEach(c => { if(c.entidade_id) counts[c.entidade_id] = (counts[c.entidade_id] || 0) + 1; });
        return counts;
    }, [collaborators]);

    const filtered = useMemo(() => {
        return entidadesData.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.codigo.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [entidadesData, searchQuery]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Gestão de Entidades</h2>
                <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md font-bold transition-all shadow-lg hover:bg-brand-secondary"><PlusIcon /> Adicionar</button>
            </div>

            <div className="relative mb-6">
                <SearchIcon className="absolute left-3 top-2.5 text-gray-500 h-4 w-4"/>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Procurar local..." className="w-full bg-gray-700 border border-gray-600 text-white rounded pl-10 p-2 text-sm focus:border-brand-secondary outline-none"/>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3">Entidade (Código)</th>
                            <th className="px-6 py-3">Instituição</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-center">Colaboradores</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filtered.map((e) => (
                            <tr 
                                key={e.id} 
                                className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                                onClick={() => onViewDetails && onViewDetails(e)}
                            >
                                <td className="px-6 py-4 font-medium text-white">
                                    <div className="font-bold">{e.name}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">{e.codigo}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-400">{instituicaoMap.get(e.instituicao_id) || 'N/A'}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.status === 'Ativo' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{e.status}</span>
                                </td>
                                <td className="px-6 py-4 text-center font-mono text-white">{collabCountMap[e.id] || 0}</td>
                                <td className="px-6 py-4 text-center" onClick={ev => ev.stopPropagation()}>
                                    <div className="flex justify-center gap-4">
                                        <button onClick={() => onViewDetails && onViewDetails(e)} className="text-teal-400 hover:text-teal-300" title="Ver Detalhes"><ReportIcon className="w-5 h-5"/></button>
                                        {onToggleStatus && <button onClick={() => onToggleStatus(e.id)} className="text-xl">{e.status === 'Ativo' ? <FaToggleOn className="text-green-400" /> : <FaToggleOff className="text-gray-500" />}</button>}
                                        {onEdit && <button onClick={() => onEdit(e)} className="text-blue-400"><EditIcon /></button>}
                                        {onDelete && <button onClick={() => onDelete(e.id)} className="text-red-400"><DeleteIcon /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EntidadeDashboard;