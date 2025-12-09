import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { DiagnosticResult } from '../types';
import { runSystemDiagnostics } from '../services/dataService';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaPlay, FaSpinner, FaClipboardList, FaCloudDownloadAlt, FaTerminal, FaCopy, FaServer } from 'react-icons/fa';

interface SystemDiagnosticsModalProps {
    onClose: () => void;
}

interface PackageVersion {
    name: string;
    current: string;
    latest: string;
    status: 'up-to-date' | 'outdated' | 'loading' | 'error' | 'info';
}

const SystemDiagnosticsModal: React.FC<SystemDiagnosticsModalProps> = ({ onClose }) => {
    // Diagnostics State
    const [results, setResults] = useState<DiagnosticResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [hasRun, setHasRun] = useState(false);

    // Updates State
    const [checkingUpdates, setCheckingUpdates] = useState(false);
    const [updateCommand, setUpdateCommand] = useState<string | null>(null);
    
    // Initial State with Environment Variables
    const [packages, setPackages] = useState<PackageVersion[]>([
        { name: 'Node.js (Build)', current: process.env.NODE_VERSION || 'Unknown', latest: 'System', status: 'info' },
        { name: 'react', current: process.env.REACT_VERSION || 'Unknown', latest: '-', status: 'loading' },
        { name: 'vite', current: process.env.VITE_VERSION || 'Unknown', latest: '-', status: 'loading' },
        { name: '@google/genai', current: process.env.GENAI_VERSION || 'Unknown', latest: '-', status: 'loading' },
        { name: 'AIManager (App)', current: process.env.APP_VERSION || '1.0.0', latest: 'Local', status: 'up-to-date' }
    ]);
    
    // Use ref to prevent double-execution in React 18 Strict Mode
    const ranUpdates = useRef(false);

    const handleRunDiagnostics = async () => {
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

    const cleanVersion = (ver: string) => ver.replace('^', '').replace('~', '');

    const handleGenerateUpdate = (pkgName: string, version: string) => {
        const cmd = `npm install ${pkgName}@${version}`;
        setUpdateCommand(cmd);
        navigator.clipboard.writeText(cmd);
    };

    useEffect(() => {
        if (ranUpdates.current) return;
        ranUpdates.current = true;

        const runCheck = async () => {
            setCheckingUpdates(true);
            
            // Create a deep copy to modify
            const updatedPackages = packages.map(p => ({...p}));

            for (let i = 0; i < updatedPackages.length; i++) {
                const pkg = updatedPackages[i];
                
                // Skip local app and Node.js
                if (pkg.name === 'AIManager (App)' || pkg.name === 'Node.js (Build)') continue; 

                try {
                    const response = await fetch(`https://unpkg.com/${pkg.name}@latest/package.json`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        const latestVer = data.version;
                        
                        pkg.latest = latestVer;
                        
                        if (cleanVersion(pkg.current) === latestVer) {
                            pkg.status = 'up-to-date';
                        } else {
                            pkg.status = 'outdated';
                        }
                    } else {
                        pkg.status = 'error';
                    }
                } catch (e) {
                    console.error(`Failed to check ${pkg.name}`, e);
                    pkg.status = 'error';
                }
                // Update state incrementally for better UX
                setPackages([...updatedPackages]);
            }
            setCheckingUpdates(false);
        };

        runCheck();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        <Modal title="Diagnóstico de Sistema & Atualizações" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-8">
                
                {/* --- UPDATE CHECKER SECTION --- */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FaCloudDownloadAlt className="text-blue-400" />
                        Verificação de Versões (Core)
                    </h3>
                    <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                                <tr>
                                    <th className="p-3">Pacote / Biblioteca</th>
                                    <th className="p-3">Versão Instalada</th>
                                    <th className="p-3">Última Disponível</th>
                                    <th className="p-3 text-center">Estado</th>
                                    <th className="p-3 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {packages.map((pkg, idx) => (
                                    <tr key={idx} className="hover:bg-gray-800/30">
                                        <td className="p-3 font-semibold text-white">{pkg.name}</td>
                                        <td className="p-3 font-mono text-gray-300">{pkg.current}</td>
                                        <td className="p-3 font-mono text-gray-300">
                                            {checkingUpdates && pkg.status === 'loading' ? <FaSpinner className="animate-spin" /> : pkg.latest}
                                        </td>
                                        <td className="p-3 text-center">
                                            {pkg.status === 'loading' && <span className="text-gray-500 text-xs">A verificar...</span>}
                                            {pkg.status === 'up-to-date' && <span className="text-green-400 text-xs font-bold flex items-center justify-center gap-1"><FaCheckCircle/> Atualizado</span>}
                                            {pkg.status === 'outdated' && <span className="text-yellow-400 text-xs font-bold flex items-center justify-center gap-1"><FaExclamationTriangle/> Nova versão</span>}
                                            {pkg.status === 'error' && <span className="text-red-400 text-xs">Erro Rede</span>}
                                            {pkg.status === 'info' && <span className="text-blue-400 text-xs flex items-center justify-center gap-1"><FaServer/> Sistema</span>}
                                        </td>
                                        <td className="p-3 text-right">
                                            {pkg.status === 'outdated' && (
                                                <button 
                                                    onClick={() => handleGenerateUpdate(pkg.name, pkg.latest)}
                                                    className="px-3 py-1 bg-brand-primary text-white text-xs rounded hover:bg-brand-secondary flex items-center gap-1 ml-auto"
                                                >
                                                    <FaCloudDownloadAlt /> Atualizar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Update Instruction Panel */}
                    {updateCommand && (
                        <div className="mt-4 p-4 bg-gray-800 border border-brand-secondary rounded-lg animate-fade-in">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-brand-secondary font-bold text-sm flex items-center gap-2">
                                    <FaTerminal /> Comando de Atualização
                                </h4>
                                <button onClick={() => setUpdateCommand(null)} className="text-gray-400 hover:text-white"><FaTimesCircle/></button>
                            </div>
                            <p className="text-xs text-gray-300 mb-2">
                                Numa aplicação web, as atualizações de dependências devem ser feitas no código fonte. O comando foi copiado para a área de transferência. Execute no terminal do servidor:
                            </p>
                            <div className="bg-black p-3 rounded font-mono text-green-400 text-sm flex justify-between items-center">
                                <span>{updateCommand} && npm run build</span>
                                <span className="text-xs text-gray-500 flex items-center gap-1"><FaCopy/> Copiado</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-700"></div>

                {/* --- DIAGNOSTICS SECTION --- */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FaClipboardList className="text-purple-400" />
                            Teste de Integridade (End-to-End)
                        </h3>
                        {!isRunning && (
                            <button 
                                onClick={handleRunDiagnostics}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-all shadow-lg text-sm font-bold"
                            >
                                <FaPlay /> Executar Testes
                            </button>
                        )}
                    </div>

                    {isRunning && (
                        <div className="text-center py-8 bg-gray-800/30 rounded-lg">
                            <FaSpinner className="animate-spin text-3xl text-brand-secondary mx-auto mb-3" />
                            <p className="text-gray-300">A validar base de dados e permissões...</p>
                        </div>
                    )}

                    {!isRunning && hasRun && (
                        <div className="animate-fade-in space-y-4">
                            <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <span className="text-gray-400 text-sm">Resultado Geral:</span>
                                <span className={`text-lg font-bold ${overallColor}`}>{overallStatus}</span>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-800 text-gray-400 uppercase text-xs sticky top-0">
                                        <tr>
                                            <th className="p-3">Módulo</th>
                                            <th className="p-3">Mensagem</th>
                                            <th className="p-3 text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {results.map((res, idx) => (
                                            <tr key={idx} className="hover:bg-gray-800/30">
                                                <td className="p-3 font-semibold text-white text-xs">{res.module}</td>
                                                <td className="p-3 text-gray-300 text-xs">{res.message}</td>
                                                <td className="p-3 text-center text-lg">{getStatusIcon(res.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                     
                    {!isRunning && !hasRun && (
                         <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg text-sm text-blue-200">
                            <p>
                                Este diagnóstico executa operações de teste (criação/leitura/remoção) em todos os módulos para validar permissões de base de dados e conectividade.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SystemDiagnosticsModal;