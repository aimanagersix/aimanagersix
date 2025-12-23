
import React, { useState, useMemo } from 'react';
import { FaRobot, FaCopy, FaCheck, FaDownload, FaWindows, FaPython } from 'react-icons/fa';

const agentScriptTemplatePowerShell = `
# AIManager Windows Inventory Agent v2.5
# Gera um ficheiro JSON local para ser carregado na app.
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "A solicitar privilégios de Administrador..." -ForegroundColor Yellow
    Start-Process powershell "-NoProfile -ExecutionPolicy Bypass -File \`"$($MyInvocation.MyCommand.Path)\`"" -Verb RunAs
    exit
}

$os = Get-CimInstance Win32_OperatingSystem
$cs = Get-CimInstance Win32_ComputerSystem
$bios = Get-CimInstance Win32_BIOS

$info = @{
    serialNumber = $bios.SerialNumber.Trim()
    description = "$($cs.Manufacturer) $($cs.Model)"
    nomeNaRede = $env:COMPUTERNAME
    os_version = $os.Caption
    scan_date = (Get-Date).ToString("yyyy-MM-dd")
}

$info | ConvertTo-Json | Out-File "inventario.json" -Encoding utf8
Write-Host "Sucesso! Ficheiro 'inventario.json' gerado." -ForegroundColor Green
`;

const agentScriptTemplatePython = `
# AIManager Python Management App v1.0
# Conecta-se diretamente ao projeto yyiwkrkuhlkqibhowdmq
import os
from supabase import create_client

URL = "https://yyiwkrkuhlkqibhowdmq.supabase.co"
KEY = "SUA_ANON_KEY"

def run_app():
    supabase = create_client(URL, KEY)
    print("--- AIManager Mobile Python ---")
    collabs = supabase.table("collaborators").select("full_name, email").execute()
    for c in collabs.data:
        print(f"Colaborador: {c['full_name']} ({c['email']})")

if __name__ == "__main__":
    run_app()
`;

const AgentsTab: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'powershell' | 'python'>('powershell');
    const [copied, setCopied] = useState(false);

    const currentScript = useMemo(() => {
        return activeTab === 'powershell' ? agentScriptTemplatePowerShell : agentScriptTemplatePython;
    }, [activeTab]);

    const handleCopy = () => {
        navigator.clipboard.writeText(currentScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const ext = activeTab === 'powershell' ? 'ps1' : 'py';
        const blob = new Blob([currentScript], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aimanager_agent.${ext}`;
        a.click();
    };

    return (
        <div className="flex flex-col h-full space-y-4 animate-fade-in p-6">
            <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200">
                <div className="flex items-center gap-2 font-bold mb-2">
                    <FaRobot /> Agentes e Apps Externas
                </div>
                <p className="mb-4">
                    Utilize estes scripts para interagir com o projeto <strong>yyiwkrkuhlkqibhowdmq</strong> fora do browser.
                </p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('powershell')}
                        className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'powershell' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                        <FaWindows /> PowerShell (Inventário)
                    </button>
                    <button 
                        onClick={() => setActiveTab('python')}
                        className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'python' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                        <FaPython /> Python App (Gestão)
                    </button>
                </div>
            </div>
            
            <div className="relative flex-grow border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                <pre className="p-4 text-xs font-mono text-green-400 overflow-auto h-full custom-scrollbar">
                    {currentScript}
                </pre>
                 <div className="absolute top-2 right-2 flex gap-2">
                    <button onClick={handleCopy} className="p-1.5 bg-gray-700 rounded text-white border border-gray-600">
                        {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                    </button>
                    <button onClick={handleDownload} className="p-1.5 bg-gray-700 rounded text-white border border-gray-600">
                        <FaDownload />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentsTab;
