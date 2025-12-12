
import React, { useState, useMemo } from 'react';
import { FaRobot, FaCopy, FaCheck, FaDownload, FaWindows, FaPython } from 'react-icons/fa';

const agentScriptTemplatePowerShell = `
# AIManager Windows Inventory Agent v2.5 (Offline Mode)
#
# ESTE SCRIPT É SEGURO: NÃO CONTÉM CHAVES DE API.
# Gera um ficheiro JSON local para ser carregado manualmente na aplicação web.

# --- AUTO-ELEVATE TO ADMINISTRATOR ---
# Verifica se está a correr como Admin. Se não, reinicia o processo pedindo elevação.
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "A solicitar privilegios de Administrador para ler chave da BIOS..." -ForegroundColor Yellow
    $newProcess = New-Object System.Diagnostics.ProcessStartInfo "powershell"
    $newProcess.Arguments = "-NoProfile -ExecutionPolicy Bypass -File ""$($MyInvocation.MyCommand.Path)"" -Verb RunAs"
    $newProcess.Verb = "runas"
    [System.Diagnostics.Process]::Start($newProcess)
    exit
}

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
    
    # 1. Obter Chave de Licença Embutida (OEM/BIOS)
    # Tenta via WMI primeiro (mais comum em versões antigas), depois CIM
    $embeddedKey = ""
    try {
        $wmiObj = Get-WmiObject -query 'select * from SoftwareLicensingService' -ErrorAction SilentlyContinue
        if ($wmiObj -and $wmiObj.OA3xOriginalProductKey) { 
            $embeddedKey = $wmiObj.OA3xOriginalProductKey 
        }
    } catch {}

    if ([string]::IsNullOrWhiteSpace($embeddedKey)) {
        try {
            $cimObj = Get-CimInstance -query 'select OA3xOriginalProductKey from SoftwareLicensingService' -ErrorAction SilentlyContinue
            if ($cimObj -and $cimObj.OA3xOriginalProductKey) { 
                $embeddedKey = $cimObj.OA3xOriginalProductKey 
            }
        } catch {}
    }

    # 2. Obter Data do Último Patch de Segurança
    $lastPatchDate = ""
    try {
        $hotfix = Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 1 -ErrorAction SilentlyContinue
        if ($hotfix) {
            $lastPatchDate = $hotfix.InstalledOn.ToString("yyyy-MM-dd")
        }
    } catch {}

    # 3. Formatar Data da BIOS
    $biosDate = ""
    if ($bios.ReleaseDate) {
        try {
            if ($bios.ReleaseDate.Length -ge 8) {
                $biosDate = $bios.ReleaseDate.Substring(0, 4) + "-" + $bios.ReleaseDate.Substring(4, 2) + "-" + $bios.ReleaseDate.Substring(6, 2)
            } else {
                 $biosDate = $bios.ReleaseDate.ToString("yyyy-MM-dd")
            }
        } catch {
            $biosDate = $bios.ReleaseDate
        }
    }
    
    $macWifi = $null
    $macCabo = $null
    Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | ForEach-Object {
        if ($_.InterfaceDescription -like "*Wireless*" -or $_.InterfaceDescription -like "*Wi-Fi*") { $macWifi = $_.MacAddress }
        if ($_.InterfaceDescription -like "*Ethernet*" -or $_.InterfaceDescription -like "*Gigabit*") { $macCabo = $_.MacAddress }
    }
    
    $serialNumber = $bios.SerialNumber.Trim()
    
    # Normalizar Marca
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
        embedded_license_key = $embeddedKey
        bios_date = $biosDate
        last_patch_date = $lastPatchDate
        nomeNaRede = $env:COMPUTERNAME
        macAddressWIFI = $macWifi
        macAddressCabo = $macCabo
        purchaseDate = $null # Explicitly null to avoid defaults
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
    Write-Host "Chave Windows detetada: $(if($info.embedded_license_key){'Sim'}else{'Nao'})" -ForegroundColor Cyan
    Write-Host "Agora faça upload deste ficheiro no menu 'Inventário' da aplicação." -ForegroundColor White
} catch {
    Write-Error "Erro: $($_.Exception.Message)"
}
Start-Sleep -Seconds 10
`;

const agentScriptTemplatePython = `
import platform
import socket
import uuid
import json
import sys
import os
import subprocess
from datetime import datetime

# AIManager Inventory Agent v2.5 (Offline Mode)
# Gera um ficheiro JSON local.

def get_bios_key():
    """Tenta obter a chave OEM da BIOS"""
    key = ""
    try:
        if platform.system() == "Windows":
            # Tenta via Powershell WMI
            cmd = "powershell \"(Get-WmiObject -query 'select * from SoftwareLicensingService').OA3xOriginalProductKey\""
            key = subprocess.check_output(cmd, shell=True).decode().strip()
        elif platform.system() == "Linux":
            if os.geteuid() == 0 and os.path.exists('/sys/firmware/acpi/tables/MSDM'):
                with open('/sys/firmware/acpi/tables/MSDM', 'rb') as f:
                    content = f.read()
                    # Offset 56 geralmente contém a chave
                    key = content[56:].decode('utf-8', errors='ignore').strip()
    except Exception:
        pass
    return key

def get_bios_date():
    """Tenta obter a data da BIOS"""
    date_str = ""
    try:
        if platform.system() == "Windows":
            cmd = "wmic bios get releasedate"
            output = subprocess.check_output(cmd, shell=True).decode().strip()
            lines = output.split('\\n')
            if len(lines) > 1:
                raw = lines[1].strip()
                if len(raw) >= 8:
                    date_str = f"{raw[0:4]}-{raw[4:6]}-{raw[6:8]}"
        elif platform.system() == "Linux":
             if os.path.exists('/sys/class/dmi/id/bios_date'):
                 with open('/sys/class/dmi/id/bios_date', 'r') as f:
                     raw = f.read().strip()
                     parts = raw.split('/')
                     if len(parts) == 3:
                         date_str = f"{parts[2]}-{parts[0]}-{parts[1]}"
    except Exception:
        pass
    return date_str

def get_system_info():
    print("A recolher informação do sistema...")
    
    info = {}
    
    # OS Info
    info['os_version'] = f"{platform.system()} {platform.release()} {platform.version()}"
    info['nomeNaRede'] = socket.gethostname()
    
    # Hardware (Generic)
    info['cpu_info'] = platform.processor()
    info['ram_size'] = "N/A (Requer psutil)" 
    info['embedded_license_key'] = get_bios_key()
    info['bios_date'] = get_bios_date()
    info['last_patch_date'] = "" 
    
    # Network (MAC)
    mac_num = uuid.getnode()
    mac = ':'.join(('%012X' % mac_num)[i:i+2] for i in range(0, 12, 2))
    info['macAddressCabo'] = mac 
    
    # Serial & Brand
    info['description'] = f"{platform.node()} ({platform.system()})"
    info['serialNumber'] = f"PY-{uuid.getnode()}" 
    info['brandName'] = "Generic"
    info['typeName'] = "Server" if platform.system() == "Linux" else "Workstation"
    info['purchaseDate'] = None # Explicitly null
    
    info['scan_date'] = datetime.now().strftime("%Y-%m-%d")

    return info

if __name__ == "__main__":
    try:
        data = get_system_info()
        filename = f"inventario_{data['nomeNaRede']}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"Sucesso! Ficheiro gerado: {filename}")
        print(f"Chave detetada: {data['embedded_license_key']}")
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
                    <li>O script irá solicitar permissões de <strong>Administrador</strong> automaticamente.</li>
                    <li>Será gerado um ficheiro <code>.json</code> contendo o inventário e a chave Windows.</li>
                    <li>Vá ao menu <strong>Ativos &gt; Equipamentos</strong> e clique em <strong>"Importar JSON Agente"</strong>.</li>
                </ol>
                <div className="flex gap-2 mt-3">
                    <button 
                        onClick={() => setActiveTab('powershell')}
                        className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'powershell' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                        <FaWindows /> Windows (PowerShell v2.5)
                    </button>
                    <button 
                        onClick={() => setActiveTab('python')}
                        className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'python' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                        <FaPython /> Cross-Platform (Python v2.5)
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
