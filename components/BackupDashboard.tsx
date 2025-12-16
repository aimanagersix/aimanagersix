
import React, { useState, useMemo } from 'react';
import { BackupExecution, Collaborator, BackupType, Equipment } from '../types';
import { EditIcon, FaTrash as DeleteIcon, PlusIcon, FaServer, FaSearch, FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaClock, FaPaperclip } from './common/Icons';
import Pagination from './common/Pagination';
import SortableHeader from './common/SortableHeader';

interface BackupDashboardProps {
    backups: BackupExecution[];
    collaborators: Collaborator[];
    equipment: Equipment[]; // Added prop
    onEdit?: (backup: BackupExecution) => void;
    onDelete?: (id: string) => void;
    onCreate?: () => void;
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'Sucesso': return <FaCheckCircle className="text-green-500" />;
        case 'Falha': return <FaTimesCircle className="text-red-500" />;
        case 'Parcial': return <FaExclamationCircle className="text-yellow-500" />;
        default: return <FaClock className="text-gray-500" />;
    }
};

const getStatusClass = (status: string) => {
    switch (status) {
        case 'Sucesso': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'Falha': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'Parcial': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const BackupDashboard: React.FC<BackupDashboardProps> = ({ backups, collaborators, equipment, onEdit, onDelete, onCreate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    
    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
        key: 'test_date',
        direction: 'descending'
    });

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);
    const equipmentMap = useMemo(() => new Map(equipment.map(e => [e.id, e])), [equipment]);
    
    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const filteredBackups = useMemo(() => {
        let filtered = backups.filter(b => {
            const linkedEq = b.equipment_id ? equipmentMap.get(b.equipment_id) : null;
            const linkedEqName = linkedEq ? linkedEq.description : '';

            const searchMatch = searchQuery === '' || 
                b.system_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                linkedEqName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const statusMatch = filterStatus === '' || b.status === filterStatus;
            return searchMatch && statusMatch;
        });
        
        // Sorting Logic
        filtered.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (sortConfig.key) {
                case 'test_date':
                    valA = new Date(a.test_date).getTime();
                    valB = new Date(b.test_date).getTime();
                    break;
                case 'system_name':
                    valA = a.system_name;
                    valB = b.system_name;
                    break;
                case 'status':
                    valA = a.status;
                    valB = b.status;
                    break;
                case 'tester':
                    valA = collaboratorMap.get(a.tester_id) || '';
                    valB = collaboratorMap.get(b.tester_id) || '';
                    break;
                default:
                    valA = a[sortConfig.key as keyof BackupExecution];
                    valB = b[sortConfig.key as keyof BackupExecution];
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [backups, searchQuery, filterStatus, equipmentMap, sortConfig, collaboratorMap]);

    const totalPages = Math.ceil(filteredBackups.length / itemsPerPage);
    const paginatedBackups = useMemo(() => {
        return filteredBackups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredBackups, currentPage, itemsPerPage]);

    // Stats
    const successRate = useMemo(() => {
        if (filteredBackups.length === 0) return 0;
        const successCount = filteredBackups.filter(b => b.status === 'Sucesso').length;
        return Math.round((successCount / filteredBackups.length) * 100);
    }, [filteredBackups]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FaServer className="text-indigo-400"/> 
                        Registo de Testes de Restauro (Backups)
                    </h2>
                    <p className="text-sm text-on-surface-dark-secondary mt-1">
                        Monitorização e evidência de testes de recuperação de dados (Compliance NIS2).
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-xs text-gray-400">Taxa de Sucesso</span>
                        <span className={`font-bold text-lg ${successRate >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>{successRate}%</span>
                    </div>
                    {onCreate && (
                    <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors">
                        <PlusIcon /> Registar Teste
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
                        placeholder="Pesquisar sistema, equipamento..."
                        className="w-full bg-gray-800 border border-gray-600 text-white rounded-md pl-9 p-2 text-sm"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm"
                >
                    <option value="">Todos os Estados</option>
                    <option value="Sucesso">Sucesso</option>
                    <option value="Falha">Falha</option>
                    <option value="Parcial">Parcial</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <SortableHeader label="Data Teste" sortKey="test_date" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Sistema / Equipamento" sortKey="system_name" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Tipo Backup" sortKey="type" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Data Backup" sortKey="backup_date" currentSort={sortConfig} onSort={handleSort} />
                            <th className="px-6 py-3 text-center">RTO (min)</th>
                            <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                            <th className="px-6 py-3 text-center">Evidências</th>
                            <SortableHeader label="Testado Por" sortKey="tester" currentSort={sortConfig} onSort={handleSort} />
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedBackups.length > 0 ? paginatedBackups.map((backup) => {
                            const linkedEquipment = backup.equipment_id ? equipmentMap.get(backup.equipment_id) : null;
                            return (
                            <tr key={backup.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                                <td className="px-6 py-4 text-white">{backup.test_date}</td>
                                <td className="px-6 py-4 font-medium text-on-surface-dark">
                                    {linkedEquipment ? (
                                        <div>
                                            <span className="block text-indigo-300">{linkedEquipment.description}</span>
                                            <span className="text-xs text-gray-500">S/N: {linkedEquipment.serialNumber}</span>
                                        </div>
                                    ) : (
                                        <span>{backup.system_name}</span>
                                    )}
                                    {backup.notes && <p className="text-xs text-gray-500 truncate max-w-xs mt-1">{backup.notes}</p>}
                                </td>
                                <td className="px-6 py-4">{backup.type}</td>
                                <td className="px-6 py-4 text-xs">{backup.backup_date}</td>
                                <td className="px-6 py-4 text-center font-mono">{backup.restore_time_minutes || '-'}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusClass(backup.status)}`}>
                                        {getStatusIcon(backup.status)} {backup.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {backup.attachments && backup.attachments.length > 0 ? (
                                        <div className="flex items-center justify-center gap-1 text-brand-secondary" title={`${backup.attachments.length} anexo(s)`}>
                                            <FaPaperclip />
                                            <span className="text-xs">{backup.attachments.length}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600 text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">{collaboratorMap.get(backup.tester_id) || 'Desconhecido'}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-3">
                                        {onEdit && (
                                        <button onClick={() => onEdit(backup)} className="text-blue-400 hover:text-blue-300" title="Editar">
                                            <EditIcon />
                                        </button>
                                        )}
                                        {onDelete && (
                                        <button onClick={() => onDelete(backup.id)} className="text-red-400 hover:text-red-300" title="Excluir">
                                            <DeleteIcon />
                                        </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}) : (
                            <tr>
                                <td colSpan={9} className="text-center py-8 text-gray-500">Nenhum registo de teste encontrado.</td>
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
                totalItems={filteredBackups.length}
            />
        </div>
    );
};

export default BackupDashboard;
