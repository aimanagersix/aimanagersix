
import React, { useState, useMemo } from 'react';
import { BackupExecution, Collaborator, BackupType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon, FaServer, FaSearch, FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaClock } from './common/Icons';
import Pagination from './common/Pagination';

interface BackupDashboardProps {
    backups: BackupExecution[];
    collaborators: Collaborator[];
    onEdit: (backup: BackupExecution) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
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

const BackupDashboard: React.FC<BackupDashboardProps> = ({ backups, collaborators, onEdit, onDelete, onCreate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);

    const filteredBackups = useMemo(() => {
        return backups.filter(b => {
            const searchMatch = searchQuery === '' || 
                b.system_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const statusMatch = filterStatus === '' || b.status === filterStatus;
            return searchMatch && statusMatch;
        });
    }, [backups, searchQuery, filterStatus]);

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
                        Monitorização e evidência de testes de recuperação de dados (Conformidade NIS2).
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-xs text-gray-400">Taxa de Sucesso</span>
                        <span className={`font-bold text-lg ${successRate >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>{successRate}%</span>
                    </div>
                    <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors">
                        <PlusIcon /> Registar Teste
                    </button>
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
                        placeholder="Procurar sistema..."
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
                            <th className="px-6 py-3">Data Teste</th>
                            <th className="px-6 py-3">Sistema</th>
                            <th className="px-6 py-3">Tipo Backup</th>
                            <th className="px-6 py-3">Data Backup</th>
                            <th className="px-6 py-3 text-center">RTO (min)</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3">Testado Por</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedBackups.length > 0 ? paginatedBackups.map((backup) => (
                            <tr key={backup.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                                <td className="px-6 py-4 text-white">{backup.test_date}</td>
                                <td className="px-6 py-4 font-medium text-on-surface-dark">
                                    {backup.system_name}
                                    {backup.notes && <p className="text-xs text-gray-500 truncate max-w-xs">{backup.notes}</p>}
                                </td>
                                <td className="px-6 py-4">{backup.type}</td>
                                <td className="px-6 py-4 text-xs">{backup.backup_date}</td>
                                <td className="px-6 py-4 text-center font-mono">{backup.restore_time_minutes || '-'}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusClass(backup.status)}`}>
                                        {getStatusIcon(backup.status)} {backup.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{collaboratorMap.get(backup.tester_id) || 'Desconhecido'}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center items-center gap-4">
                                        <button onClick={() => onEdit(backup)} className="text-blue-400 hover:text-blue-300" title="Editar">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDelete(backup.id)} className="text-red-400 hover:text-red-300" title="Excluir">
                                            <DeleteIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-on-surface-dark-secondary">
                                    Nenhum teste de backup registado.
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
                totalItems={filteredBackups.length}
            />
        </div>
    );
};

export default BackupDashboard;
