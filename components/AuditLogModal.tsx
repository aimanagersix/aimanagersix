
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from './common/Modal';
import { AuditLogEntry } from '../types';
import * as dataService from '../services/dataService';
import Pagination from './common/Pagination';
import { FaClipboardList, FaSearch, FaSync, FaExclamationTriangle } from 'react-icons/fa';

interface AuditLogModalProps {
    onClose: () => void;
}

const AuditLogModal: React.FC<AuditLogModalProps> = ({ onClose }) => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const loadLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await dataService.fetchAuditLogs();
            setLogs(data);
        } catch (e: any) {
            console.error("Failed to load audit logs", e);
            setError(e.message || "Erro ao comunicar com a base de dados.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => 
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (log.user_email && log.user_email.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [logs, searchQuery]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getActionColor = (action: string) => {
        if (action === 'DELETE') return 'text-red-400';
        if (action === 'UPDATE') return 'text-yellow-400';
        if (action === 'CREATE') return 'text-green-400';
        if (action === 'LOGIN') return 'text-blue-400';
        return 'text-gray-400';
    };

    return (
        <Modal title="Logs de Auditoria do Sistema" onClose={onClose} maxWidth="max-w-6xl">
            <div className="flex flex-col h-[70vh]">
                <div className="flex justify-between items-center mb-4 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-4 text-on-surface-dark-secondary text-sm">
                        <div className="flex items-center gap-2">
                            <FaClipboardList className="text-brand-secondary" />
                            <span>Monitorização NIS2</span>
                        </div>
                        <button 
                            onClick={loadLogs} 
                            disabled={isLoading}
                            className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-600 disabled:opacity-50"
                        >
                            <FaSync className={isLoading ? 'animate-spin' : ''} /> Sincronizar
                        </button>
                    </div>
                    <div className="relative w-64">
                        <input 
                            type="text" 
                            placeholder="Filtrar logs..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md pl-8 pr-2 py-1 text-sm focus:border-brand-secondary outline-none"
                        />
                        <FaSearch className="absolute left-2.5 top-2 text-gray-400 h-3 w-3" />
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center gap-3">
                        <FaExclamationTriangle className="flex-shrink-0" />
                        <div>
                            <p className="font-bold">Erro de Carregamento</p>
                            <p className="opacity-80">{error}. Verifique se a tabela 'audit_log' e as políticas RLS estão configuradas.</p>
                        </div>
                    </div>
                )}

                <div className="flex-grow overflow-auto border border-gray-700 rounded-lg bg-black/20">
                    <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                        <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-800 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3">Data/Hora</th>
                                <th className="px-6 py-3">Utilizador</th>
                                <th className="px-6 py-3">Ação</th>
                                <th className="px-6 py-3">Recurso</th>
                                <th className="px-6 py-3">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {isLoading && logs.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">A carregar logs...</td></tr>
                            ) : paginatedLogs.length > 0 ? (
                                paginatedLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                                        <td className="px-6 py-3 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-3">{log.user_email}</td>
                                        <td className={`px-6 py-3 font-bold text-xs ${getActionColor(log.action)}`}>{log.action}</td>
                                        <td className="px-6 py-3 text-xs">{log.resource_type} <span className="text-gray-500">#{log.resource_id?.substring(0, 8)}</span></td>
                                        <td className="px-6 py-3 truncate max-w-xs" title={log.details}>{log.details}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">Nenhum registo encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-auto pt-4">
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={setItemsPerPage}
                        totalItems={filteredLogs.length}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default AuditLogModal;
