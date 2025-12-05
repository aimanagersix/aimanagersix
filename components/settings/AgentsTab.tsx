
import React, { useState, useMemo, useEffect } from 'react';
import { FaRobot, FaCopy, FaCheck, FaDownload, FaWindows, FaPython, FaFileCode } from 'react-icons/fa';

const agentScriptTemplatePowerShell = `
# AIManager Windows Inventory Agent v2.0 (Offline Mode)
#
# ESTE SCRIPT É SEGURO: NÃO CONTÉM CHAVES DE API.
# Gera um ficheiro JSON local para ser carregado manualmente na aplicação web.

function Get-HardwareInfo {
    Write-Host "A recolher dados de Hardware e SO..." -ForegroundColor Cyan
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $cs = Get-CimInstance -ClassName Win32_ComputerSystem
    $bios = Get-CimInstance -ClassName Win32_BIOS
    $cpu = Get-CimInstance -ClassName Win32_Processor
    $memory = Get-CimInstance -ClassName Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum
    $disks = Get-CimInstance -ClassName Win32_DiskDrive | ForEach-Object {
        @{ Model = $_.Model; Size = [Math]::Round($_.Size / 1GB) }
    }
    
    $macWifi = $null
    $macCabo = $null
    Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | ForEach-Object {
        if ($_.InterfaceDescription -like "*Wireless*" -or $_.InterfaceDescription -like "*Wi-Fi*") { $macWifi = $_.MacAddress }
        if ($_.InterfaceDescription -like "*Ethernet*" -or $_.InterfaceDescription -like "*Gigabit*") { $macCabo = $_.MacAddress }
    }
    
    $serialNumber = $bios.SerialNumber.Trim()
    
    # Normalize brand
    $brand = $cs.Manufacturer
    if($brand -match "Dell") { $brand = "Dell" }
    if($brand -match "HP") { $brand = "HP" }
    if($brand -match "Lenovo") { $brand = "Lenovo" }

    $chassisType = (Get-CimInstance -ClassName Win32_SystemEnclosure).ChassisTypes
    $typeGuess = if ($chassisType -contains 9 -or $chassisType -contains 10) { "Laptop" } else { "Desktop" }

    return @{
        serialNumber = $serialNumber
        description = "$($cs.Manufacturer) $($cs.Model)"
        brandName = $brand
        typeName = $typeGuess
        os_version = $os.Caption
        cpu_info = $cpu.Name
        ram_size = "$([Math]::Round($memory.Sum / 1GB)) GB"
        disk_info = $disks
        nomeNaRede = $env:COMPUTERNAME
        macAddressWIFI = $macWifi
        macAddressCabo = $macCabo
        scan_date = (Get-Date).ToString("yyyy-MM-dd")
    }
}

try {
    $info = Get-HardwareInfo
    
    if (-not $info.serialNumber) { Write-Error "Sem S/N. Abortar."; return }

    $fileName = "inventario_$($info.nomeNaRede).json"
    $filePath = Join-Path $PWD $fileName
    
    $info | ConvertTo-Json -Depth 5 | Out-File -FilePath $filePath -Encoding utf8
    
    Write-Host "Sucesso! Ficheiro gerado:" -ForegroundColor Green
    Write-Host $filePath -ForegroundColor Yellow
    Write-Host "Agora faça upload deste ficheiro no menu 'Inventário' da aplicação." -ForegroundColor White
} catch {
    Write-Error "Erro: $($_.Exception.Message)"
}
Start-Sleep -Seconds 5
`;

const agentScriptTemplatePython = `
import platform
import socket
import uuid
import json
import sys
import os
from datetime import datetime

# AIManager Inventory Agent v2.0 (Offline Mode)
# Gera um ficheiro JSON local.

def get_system_info():
    print("A recolher informação do sistema...")
    
    info = {}
    
    # OS Info
    info['os_version'] = f"{platform.system()} {platform.release()} {platform.version()}"
    info['nomeNaRede'] = socket.gethostname()
    
    # Hardware (Generic)
    info['cpu_info'] = platform.processor()
    info['ram_size'] = "N/A (Requer psutil)" 
    
    # Network (MAC)
    mac_num = uuid.getnode()
    mac = ':'.join(('%012X' % mac_num)[i:i+2] for i in range(0, 12, 2))
    info['macAddressCabo'] = mac 
    
    # Serial & Brand (Mock for Python script without root/admin access to BIOS)
    # In a real deployment, you would use 'dmidecode' or system specific commands here
    info['description'] = f"{platform.node()} ({platform.system()})"
    info['serialNumber'] = f"PY-{uuid.getnode()}" 
    info['brandName'] = "Generic"
    info['typeName'] = "Server" if platform.system() == "Linux" else "Workstation"
    
    info['scan_date'] = datetime.now().strftime("%Y-%m-%d")

    return info

if __name__ == "__main__":
    try:
        data = get_system_info()
        filename = f"inventario_{data['nomeNaRede']}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"Sucesso! Ficheiro gerado: {filename}")
        print("Faça upload deste ficheiro na aplicação web.")
    except Exception as e:
        print(f"Erro: {e}")
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
        const blob = new Blob([currentScript.replace(/\r\n/g, '\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aimanager_agent.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full space-y-4 animate-fade-in p-6">
            <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                <div className="flex items-center gap-2 font-bold mb-2">
                    <FaRobot /> Agentes de Inventário Offline (Seguro)
                </div>
                <p className="mb-2">
                    Esta abordagem <strong>Air-Gapped</strong> garante segurança máxima. Os scripts não contêm credenciais.
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-gray-300">
                    <li>Descarregue o script e execute no computador alvo.</li>
                    <li>O script irá gerar um ficheiro <code>.json</code> com os dados do equipamento.</li>
                    <li>Vá ao menu <strong>Ativos &gt; Equipamentos</strong> e clique em <strong>"Importar JSON Agente"</strong> para carregar o ficheiro.</li>
                </ol>
                <div className="flex gap-2 mt-3">
                    <button 
                        onClick={() => setActiveTab('powershell')}
                        className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'powershell' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                        <FaWindows /> Windows (PowerShell)
                    </button>
                    <button 
                        onClick={() => setActiveTab('python')}
                        className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'python' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                        <FaPython /> Cross-Platform (Python)
                    </button>
                </div>
            </div>
            
            <div className="relative flex-grow border border-gray-700 rounded-lg overflow-hidden">
                <div className="absolute top-0 left-0 right-0 bg-gray-800 px-4 py-2 text-xs font-mono text-gray-400 border-b border-gray-700 flex justify-between items-center">
                    <span>{activeTab === 'powershell' ? 'aimanager_agent.ps1' : 'aimanager_agent.py'}</span>
                    <span className="text-[10px] uppercase tracking-widest text-green-400 border border-green-500/30 px-2 rounded bg-green-900/20">SECURE MODE</span>
                </div>
                <pre className="p-4 pt-10 text-xs font-mono text-green-400 overflow-auto h-full custom-scrollbar bg-gray-900">
                    {currentScript}
                </pre>
                 <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <button onClick={handleCopy} className="p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white border border-gray-600" title="Copiar Código">
                        {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                    </button>
                    <button onClick={handleDownload} className="p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white border border-gray-600" title="Download Script">
                        <FaDownload />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentsTab;
