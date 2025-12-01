import React, { useState } from 'react';
import { FaRobot, FaCopy, FaCheck, FaDownload, FaWindows } from 'react-icons/fa';

interface AgentsTabProps {
    agentScript: string;
}

const AgentsTab: React.FC<AgentsTabProps> = ({ agentScript }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(agentScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([agentScript.replace(/\r\n/g, '\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'aimanager_agent.ps1';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full space-y-4 animate-fade-in">
            <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                <div className="flex items-center gap-2 font-bold mb-2">
                    <FaRobot /> Agente de Inventário (PowerShell)
                </div>
                <p>
                    Execute este script nos computadores Windows para os registar ou atualizar automaticamente no inventário. O script recolhe detalhes de hardware, software e configuração de rede.
                </p>
            </div>
            
            <div className="relative flex-grow">
                <pre className="w-full h-full bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-300 border border-gray-700 overflow-auto custom-scrollbar whitespace-pre-wrap">
                    {agentScript}
                </pre>
                <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={handleCopy} className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md shadow transition-colors" title="Copiar Código">
                        {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                    </button>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleDownload} className="px-6 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-md font-medium shadow-lg transition-colors flex items-center gap-2">
                    <FaWindows /> Download Script (.ps1)
                </button>
            </div>
        </div>
    );
};

export default AgentsTab;