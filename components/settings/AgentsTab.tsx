import React, { useState, useMemo, useEffect } from 'react';
import { FaRobot, FaCopy, FaCheck, FaDownload, FaWindows, FaPython, FaLinux, FaApple } from 'react-icons/fa';

const agentScriptTemplatePowerShell = `
# AIManager Windows Inventory Agent v1.6
#
# COMO USAR:
# 1. Execute este script como Administrador no computador alvo.
#    (As credenciais Supabase são injetadas automaticamente)

$supabaseUrl = "COLE_AQUI_O_SEU_SUPABASE_URL"
$supabaseAnonKey = "COLE_AQUI_A_SUA_SUPABASE_ANON_KEY"

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
        disk_info = $disks | ConvertTo-Json -Compress
        nomeNaRede = $env:COMPUTERNAME
        macAddressWIFI = $macWifi
        macAddressCabo = $macCabo
    }
}

try {
    Write-Host "AIManager Agent (PowerShell)" -ForegroundColor Cyan
    $info = Get-HardwareInfo
    
    if (-not $info.serialNumber) { Write-Error "Sem S/N. Abortar."; return }

    $headers = @{ "apikey" = $supabaseAnonKey; "Authorization" = "Bearer $supabaseAnonKey"; "Content-Type" = "application/json"; "Prefer" = "return=representation" }
    
    # Check Existing
    $existing = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/equipment?select=id&serialNumber=eq.$($info.serialNumber)" -Method Get -Headers $headers
    
    $payload = @{
        serialNumber = $info.serialNumber
        description = $info.description
        os_version = $info.os_version
        cpu_info = $info.cpu_info
        ram_size = $info.ram_size
        disk_info = $info.disk_info
        nomeNaRede = $info.nomeNaRede
        macAddressWIFI = $info.macAddressWIFI
        macAddressCabo = $info.macAddressCabo
    }

    if ($existing.Count -gt 0) {
        $id = $existing[0].id
        $payload["modifiedDate"] = (Get-Date).ToUniversalTime().ToString("o")
        $jsonPayload = $payload | ConvertTo-Json -Depth 5
        Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/equipment?id=eq.$id" -Method Patch -Headers $headers -Body $jsonPayload
        Write-Host "Atualizado: $($info.serialNumber)" -ForegroundColor Green
    } else {
        # Create Logic (simplified for brevity)
        # Brand/Type lookup logic would go here similar to v1.5
        $payload["status"] = "Stock"
        $payload["purchaseDate"] = (Get-Date).ToString("yyyy-MM-dd")
        
        # Dummy IDs for create (Agent relies on DB having a default 'Unknown' or doing lookup)
        # Ideally the API handles lookup, but here we simplify
        $jsonPayload = $payload | ConvertTo-Json -Depth 5
        # Note: Create might fail if Brand/Type not resolved. Use full script logic for Create.
        Write-Host "Para criar novos, o script completo (v1.5) faz lookup de IDs." -ForegroundColor Yellow
    }
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

# --- CONFIGURAÇÃO ---
SUPABASE_URL = "COLE_AQUI_O_SEU_SUPABASE_URL"
SUPABASE_KEY = "COLE_AQUI_A_SUA_SUPABASE_ANON_KEY"
# --------------------

try:
    import requests
except ImportError:
    print("Erro: A biblioteca 'requests' é necessária. Instale com: pip install requests")
    sys.exit(1)

def get_system_info():
    print("A recolher informação do sistema (Python)...")
    
    info = {}
    
    # OS Info
    info['os_version'] = f"{platform.system()} {platform.release()} {platform.version()}"
    info['nomeNaRede'] = socket.gethostname()
    
    # Hardware (Generic)
    info['cpu_info'] = platform.processor()
    info['ram_size'] = "N/A (Requer psutil)" # psutil recommended for full hardware specs
    
    # Network (MAC)
    mac_num = uuid.getnode()
    mac = ':'.join(('%012X' % mac_num)[i:i+2] for i in range(0, 12, 2))
    info['macAddressCabo'] = mac # Primary Interface
    
    # Serial Number (Cross-Platform logic is complex without sudo/admin)
    # Using Hostname as fallback description
    info['description'] = f"{platform.node()} ({platform.system()})"
    info['serialNumber'] = f"PY-{uuid.getnode()}" # Fallback ID if real serial not accessible

    return info

def send_to_supabase(info):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # Check if exists
    query_url = f"{SUPABASE_URL}/rest/v1/equipment?select=id&serialNumber=eq.{info['serialNumber']}"
    try:
        r = requests.get(query_url, headers=headers)
        r.raise_for_status()
        existing = r.json()
        
        payload = {
            "serialNumber": info['serialNumber'],
            "description": info['description'],
            "os_version": info['os_version'],
            "cpu_info": info['cpu_info'],
            "nomeNaRede": info['nomeNaRede'],
            "macAddressCabo": info['macAddressCabo']
        }

        if len(existing) > 0:
            # Update
            eq_id = existing[0]['id']
            payload["modifiedDate"] = datetime.utcnow().isoformat()
            update_url = f"{SUPABASE_URL}/rest/v1/equipment?id=eq.{eq_id}"
            requests.patch(update_url, headers=headers, json=payload)
            print(f"Equipamento {info['serialNumber']} atualizado com sucesso.")
        else:
            # Create (Basic)
            print("Equipamento não encontrado. Criação requer Brand/Type ID válidos.")
            # To implement create, we need to fetch BrandID and TypeID first.
            # Skipping for brevity in this template.
            
    except Exception as e:
        print(f"Erro de conexão: {e}")

if __name__ == "__main__":
    data = get_system_info()
    print(json.dumps(data, indent=2))
    if SUPABASE_URL.startswith("http"):
        send_to_supabase(data)
    else:
        print("Configure o URL do Supabase no script para enviar dados.")
`;

const AgentsTab: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'powershell' | 'python'>('powershell');
    const [copied, setCopied] = useState(false);
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseAnonKey, setSupabaseAnonKey] = useState('');

    useEffect(() => {
        const url = localStorage.getItem('SUPABASE_URL');
        const key = localStorage.getItem('SUPABASE_ANON_KEY');
        if (url) setSupabaseUrl(url);
        if (key) setSupabaseAnonKey(key);
    }, []);

    const currentScript = useMemo(() => {
        const template = activeTab === 'powershell' ? agentScriptTemplatePowerShell : agentScriptTemplatePython;
        
        if (!supabaseUrl || !supabaseAnonKey) return template;

        return template
            .replace('"COLE_AQUI_O_SEU_SUPABASE_URL"', `"${supabaseUrl}"`)
            .replace('"COLE_AQUI_A_SUA_SUPABASE_ANON_KEY"', `"${supabaseAnonKey}"`);
    }, [supabaseUrl, supabaseAnonKey, activeTab]);

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
                    <FaRobot /> Agentes de Inventário Automático
                </div>
                <p className="mb-2">
                    Utilize estes scripts para recolher automaticamente dados de hardware e software dos equipamentos da sua rede.
                    Os dados são enviados diretamente para a API do sistema.
                </p>
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
                    <span className="text-[10px] uppercase tracking-widest text-gray-600">READ ONLY</span>
                </div>
                <pre className="p-4 pt-10 text-xs font-mono text-green-400 overflow-auto h-full custom-scrollbar bg-gray-900">
                    {currentScript}
                </pre>
                 <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <button onClick={handleCopy} className="p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white border border-gray-600" title="Copiar">
                        {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                    </button>
                    <button onClick={handleDownload} className="p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white border border-gray-600" title="Download">
                        <FaDownload />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentsTab;