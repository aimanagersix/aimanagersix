
import React, { useState, useMemo } from 'react';
import { SecurityTrainingRecord, Collaborator, ConfigItem, TrainingType } from '../types';
import { FaGraduationCap, FaSearch, FaPlus, FaCheckCircle, FaTimesCircle, FaUserGraduate } from 'react-icons/fa';
import Pagination from './common/Pagination';
import SortableHeader from './common/SortableHeader';

interface TrainingDashboardProps {
    trainings: SecurityTrainingRecord[];
    collaborators: Collaborator[];
    trainingTypes: ConfigItem[];
    onCreate?: () => void;
}

const TrainingDashboard: React.FC<TrainingDashboardProps> = ({ trainings, collaborators, trainingTypes, onCreate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    
    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
        key: 'completion_date',
        direction: 'descending'
    });

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const trainingOptions = useMemo(() => {
        if (trainingTypes && trainingTypes.length > 0) return trainingTypes.map(t => t.name);
        return Object.values(TrainingType);
    }, [trainingTypes]);

    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const filteredTrainings = useMemo(() => {
        let filtered = trainings.filter(t => {
            const collabName = collaboratorMap.get(t.collaborator_id)?.toLowerCase() || '';
            const searchMatch = collabName.includes(searchQuery.toLowerCase()) || 
                                t.training_type.toLowerCase().includes(searchQuery.toLowerCase());
            const typeMatch = filterType === '' || t.training_type === filterType;
            return searchMatch && typeMatch;
        });

        // Sorting Logic
        filtered.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (sortConfig.key) {
                case 'completion_date':
                    valA = new Date(a.completion_date).getTime();
                    valB = new Date(b.completion_date).getTime();
                    break;
                case 'collaborator_name':
                    valA = collaboratorMap.get(a.collaborator_id) || '';
                    valB = collaboratorMap.get(b.collaborator_id) || '';
                    break;
                case 'training_type':
                    valA = a.training_type;
                    valB = b.training_type;
                    break;
                case 'score':
                    valA = a.score || 0;
                    valB = b.score || 0;
                    break;
                case 'status':
                    valA = a.status;
                    valB = b.status;
                    break;
                default:
                    valA = a[sortConfig.key as keyof SecurityTrainingRecord];
                    valB = b[sortConfig.key as keyof SecurityTrainingRecord];
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [trainings, searchQuery, filterType, collaboratorMap, sortConfig]);

    const totalPages = Math.ceil(filteredTrainings.length / itemsPerPage);
    const paginatedTrainings = useMemo(() => {
        return filteredTrainings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredTrainings, currentPage, itemsPerPage]);

    // KPIs
    const totalTrained = new Set(trainings.map(t => t.collaborator_id)).size;
    const coveragePercent = Math.round((totalTrained / Math.max(collaborators.length, 1)) * 100);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FaGraduationCap className="text-green-400"/> 
                        Formação & Consciencialização (NIS2 Art. 7º)
                    </h2>
                    <p className="text-sm text-on-surface-dark-secondary mt-1">
                        Registo de ações de formação em cibersegurança para colaboradores.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-green-900/30 px-4 py-2 rounded border border-green-500/30 text-center">
                        <span className="block text-xs text-green-200 uppercase">Cobertura</span>
                        <span className="font-bold text-xl text-green-400">{coveragePercent}%</span>
                    </div>
                    {onCreate && (
                        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors shadow-lg">
                            <FaPlus /> Registar Sessão
                        </button>
                    )}
                </div>
            </div>

            <div className="flex gap-4 mb-6 bg-gray-900/30 p-4 rounded-lg border border-gray-700">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar colaborador ou formação..."
                        className="w-full bg-gray-800 border border-gray-600 text-white rounded-md pl-9 p-2 text-sm"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm"
                >
                    <option value="">Todos os Tipos</option>
                    {trainingOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <SortableHeader label="Data Conclusão" sortKey="completion_date" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Colaborador" sortKey="collaborator_name" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Tipo de Formação" sortKey="training_type" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Score" sortKey="score" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <th className="px-6 py-3 text-center">Duração (H)</th>
                            <SortableHeader label="Estado" sortKey="status" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <th className="px-6 py-3">Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTrainings.length > 0 ? paginatedTrainings.map(t => (
                            <tr key={t.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                                <td className="px-6 py-4 text-white">{new Date(t.completion_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium text-on-surface-dark flex items-center gap-2">
                                    <FaUserGraduate className="text-gray-500"/>
                                    {collaboratorMap.get(t.collaborator_id) || 'Desconhecido'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-gray-800 px-2 py-1 rounded text-xs border border-gray-600">{t.training_type}</span>
                                </td>
                                <td className="px-6 py-4 text-center font-bold">
                                    {t.score !== undefined ? (
                                        <span className={t.score >= 70 ? 'text-green-400' : 'text-red-400'}>{t.score}%</span>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-center font-mono">{t.duration_hours || '-'}</td>
                                <td className="px-6 py-4 text-center">
                                    {t.status === 'Concluído' ? (
                                        <FaCheckCircle className="text-green-500 mx-auto" title="Concluído"/>
                                    ) : (
                                        <FaTimesCircle className="text-red-500 mx-auto" title={t.status}/>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-400 truncate max-w-xs" title={t.notes}>
                                    {t.notes || '-'}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">Nenhuma formação registada.</td>
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
                totalItems={filteredTrainings.length}
            />
        </div>
    );
};

export default TrainingDashboard;
