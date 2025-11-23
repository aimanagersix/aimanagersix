


import React, { useState, useMemo } from 'react';
import { ResilienceTest, ResilienceTestType, Ticket } from '../types';
import { FaShieldAlt, FaSearch, FaPlus, FaCheckCircle, FaTimesCircle, FaClock, FaFilePdf, FaExclamationTriangle, FaCalendarAlt } from './common/Icons';
import Pagination from './common/Pagination';
import AddResilienceTestModal from './AddResilienceTestModal';
import * as dataService from '../services/dataService';

interface ResilienceDashboardProps {
    resilienceTests: ResilienceTest[];
    onCreate: () => void;
    onEdit: (test: ResilienceTest) => void;
    onDelete: (id: string) => void;
    onCreateTicket?: (ticket: Partial<Ticket>) => void;
}

const getStatusClass = (status: string) => {
    switch (status) {
        case 'Concluído': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'Planeado': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'Em Execução': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'Cancelado': return 'bg-red-500/20 text-red-400 border-red-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const ResilienceDashboard: React.FC<ResilienceDashboardProps> = ({ resilienceTests, onCreate, onEdit, onDelete, onCreateTicket }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showAddModal, setShowAddModal] = useState(false);
    const [testToEdit, setTestToEdit] = useState<ResilienceTest | null>(null);

    const filteredTests = useMemo(() => {
        return resilienceTests.filter(t => 
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.auditor_entity?.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => new Date(b.planned_date).getTime() - new Date(a.planned_date).getTime());
    }, [resilienceTests, searchQuery]);

    const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
    const paginatedTests = useMemo(() => {
        return filteredTests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredTests, currentPage, itemsPerPage]);

    const handleSaveTest = async (test: any) => {
        try {
            if (testToEdit) {
                await dataService.updateResilienceTest(testToEdit.id, test);
            } else {
                await dataService.addResilienceTest(test);
            }
            // Ideally trigger a refresh here, assuming parent component handles it via props or context updates.
            // Since we are injecting this, let's assume `onCreate` in parent triggers refresh or we reload.
            window.location.reload(); 
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar teste.");
        }
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FaShieldAlt className="text-purple-500"/> 
                        Testes de Resiliência (DORA / TLPT)
                    </h2>
                    <p className="text-sm text-on-surface-dark-secondary mt-1">
                        Planeamento e registo de testes de segurança avançados (Pentests, Red Teaming, DRP).
                    </p>
                </div>
                <button onClick={() => { setTestToEdit(null); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors shadow-lg">
                    <FaPlus /> Agendar Teste
                </button>
            </div>

            <div className="mb-6 relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Procurar por título, auditor..."
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md pl-9 p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Upcoming Tests Widget */}
                <div className="bg-gray-900/30 border border-gray-700 p-4 rounded-lg">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2"><FaCalendarAlt className="text-blue-400"/> Próximos Testes</h3>
                    <div className="space-y-2">
                        {resilienceTests.filter(t => t.status === 'Planeado').slice(0, 3).map(t => (
                            <div key={t.id} className="flex justify-between items-center text-sm p-2 bg-surface-dark rounded border border-gray-700">
                                <div>
                                    <span className="block font-semibold text-white">{t.title}</span>
                                    <span className="text-xs text-gray-400">{new Date(t.planned_date).toLocaleDateString()}</span>
                                </div>
                                <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">{t.test_type}</span>
                            </div>
                        ))}
                        {resilienceTests.filter(t => t.status === 'Planeado').length === 0 && <p className="text-gray-500 text-sm italic">Nenhum teste planeado.</p>}
                    </div>
                </div>
                
                {/* Recent Findings Widget */}
                <div className="bg-gray-900/30 border border-gray-700 p-4 rounded-lg">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2"><FaExclamationTriangle className="text-red-400"/> Resultados Recentes</h3>
                    <div className="space-y-2">
                        {resilienceTests.filter(t => t.status === 'Concluído').slice(0, 3).map(t => (
                            <div key={t.id} className="text-sm p-2 bg-surface-dark rounded border border-gray-700">
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-white">{t.title}</span>
                                    <span className="text-xs text-green-400 font-bold">Concluído</span>
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-1">{t.summary_findings || 'Sem resumo disponível.'}</p>
                            </div>
                        ))}
                         {resilienceTests.filter(t => t.status === 'Concluído').length === 0 && <p className="text-gray-500 text-sm italic">Nenhum teste concluído.</p>}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3">Teste / Auditor</th>
                            <th className="px-6 py-3">Tipo</th>
                            <th className="px-6 py-3">Data Planeada</th>
                            <th className="px-6 py-3 text-center">Estado</th>
                            <th className="px-6 py-3">Executado Em</th>
                            <th className="px-6 py-3 text-center">Relatório</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTests.length > 0 ? paginatedTests.map(test => (
                            <tr key={test.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-white">{test.title}</div>
                                    <div className="text-xs text-gray-500">{test.auditor_entity || 'Interno'}</div>
                                </td>
                                <td className="px-6 py-4">{test.test_type}</td>
                                <td className="px-6 py-4">{test.planned_date}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusClass(test.status)}`}>
                                        {test.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{test.executed_date || '-'}</td>
                                <td className="px-6 py-4 text-center">
                                    {test.attachments && test.attachments.length > 0 ? (
                                        <a href={test.attachments[0].dataUrl} download={test.attachments[0].name} className="text-purple-400 hover:text-purple-300" title="Download Relatório">
                                            <FaFilePdf className="h-5 w-5 mx-auto"/>
                                        </a>
                                    ) : <span className="text-gray-600">-</span>}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-3">
                                        <button onClick={() => { setTestToEdit(test); setShowAddModal(true); }} className="text-blue-400 hover:text-blue-300">Editar</button>
                                        <button onClick={() => onDelete(test.id)} className="text-red-400 hover:text-red-300">Excluir</button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">Nenhum teste encontrado.</td>
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
                totalItems={filteredTests.length}
            />

            {showAddModal && (
                <AddResilienceTestModal 
                    onClose={() => setShowAddModal(false)} 
                    onSave={handleSaveTest}
                    testToEdit={testToEdit}
                    onCreateTicket={onCreateTicket}
                />
            )}
        </div>
    );
};

export default ResilienceDashboard;