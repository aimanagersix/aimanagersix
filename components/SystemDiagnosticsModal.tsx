
import React, { useState } from 'react';
import Modal from './common/Modal';
import { DiagnosticResult } from '../types';
import { runSystemDiagnostics } from '../services/dataService';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaPlay, FaSpinner, FaClipboardList } from 'react-icons/fa';

interface SystemDiagnosticsModalProps {
    onClose: () => void;
}

const SystemDiagnosticsModal: React.FC<SystemDiagnosticsModalProps> = ({ onClose }) => {
    const [results, setResults] = useState<DiagnosticResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [hasRun, setHasRun] = useState(false);

    const handleRun = async () => {
        setIsRunning(true);
        setResults([]);
        try {
            const res = await runSystemDiagnostics();
            setResults(res);
        } catch (e) {
            console.error(e);
            alert("Erro fatal ao executar diagnóstico.");
        } finally {
            setIsRunning(false);
            setHasRun(true);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Success': return <FaCheckCircle className="text-green-500" />;
            case 'Failure': return <FaTimesCircle className="text-red-500" />;
            case 'Warning': return <FaExclamationTriangle className="text-yellow-500" />;
            default: return null;
        }
    };

    const overallStatus = results.some(r => r.status === 'Failure') ? 'Falha' : 'Sucesso';
    const overallColor = overallStatus === 'Sucesso' ? 'text-green-400' : 'text-red-400';

    return (
        <Modal title="Diagnóstico de Sistema" onClose={onClose} maxWidth="max-w-2xl">
            <div className="space-y-6">
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg text-sm text-blue-200 flex items-start gap-3">
                    <FaClipboardList className="text-xl mt-1" />
                    <div>
                        <p className="font-bold mb-1">Teste de Integridade CRUD</p>
                        <p>
                            Este módulo executa operações de criação, leitura, atualização e eliminação em entidades chave (Colaboradores, Equipamentos, Tickets) para validar a saúde da base de dados e permissões.
                            Os dados de teste são removidos automaticamente.
                        </p>
                    </div>
                </div>

                {!hasRun && !isRunning && (
                    <div className="flex justify-center py-8">
                        <button 
                            onClick={handleRun}
                            className="flex items-center gap-3 px-8 py-4 bg-brand-primary text-white rounded-full hover:bg-brand-secondary transition-all hover:scale-105 shadow-lg font-bold text-lg"
                        >
                            <FaPlay /> Iniciar Diagnóstico
                        </button>
                    </div>
                )}

                {isRunning && (
                    <div className="text-center py-12">
                        <FaSpinner className="animate-spin text-4xl text-brand-secondary mx-auto mb-4" />
                        <p className="text-gray-300">A executar testes de sistema...</p>
                    </div>
                )}

                {hasRun && (
                    <div className="animate-fade-in space-y-4">
                        <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <span className="text-gray-400">Resultado Geral:</span>
                            <span className={`text-xl font-bold ${overallColor}`}>{overallStatus}</span>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                                    <tr>
                                        <th className="p-3">Módulo</th>
                                        <th className="p-3">Mensagem</th>
                                        <th className="p-3 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {results.map((res, idx) => (
                                        <tr key={idx} className="hover:bg-gray-800/30">
                                            <td className="p-3 font-semibold text-white">{res.module}</td>
                                            <td className="p-3 text-gray-300">{res.message}</td>
                                            <td className="p-3 text-center text-lg">{getStatusIcon(res.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                         <div className="flex justify-end gap-4 pt-4">
                            <button onClick={() => setHasRun(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                                Limpar
                            </button>
                            <button onClick={handleRun} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">
                                Executar Novamente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default SystemDiagnosticsModal;
