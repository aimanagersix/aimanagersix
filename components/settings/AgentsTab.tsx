import React, { useState } from 'react';
import { FaRobot, FaCopy, FaCheck, FaDownload, FaWindows } from 'react-icons/fa';

const agentScript = `
# AIManager Windows Inventory Agent v1.0
#
# COMO USAR:
# 1. Copie o seu Supabase URL e Anon Key para as variáveis abaixo.
# 2. Execute este script como Administrador no computador alvo.
#
# NOTA: Este script recolhe informação e envia-a para a sua base de dados AIManager.
#       Revise o código para garantir que está confortável com os dados recolhidos.

# --- CONFIGURAÇÃO (PREENCHER) ---
$supabaseUrl = "COLE_AQUI_O_SEU_SUPABASE_URL"
$supabaseAnonKey = "COLE_AQUI_A_SUA_SUPABASE_ANON_KEY"
# -----------------------------------

function Get-HardwareInfo {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $cs = Get-CimInstance -ClassName Win32_ComputerSystem
    $bios = Get-CimInstance -ClassName Win32_BIOS
    $cpu = Get-CimInstance -ClassName Win32_Processor
    $memory = Get-CimInstance -ClassName Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum
    $disks = Get-CimInstance -ClassName Win32_DiskDrive | ForEach-Object {
        @{
            Model = $_.Model
            Size = [Math]::Round($_.Size / 1GB)
        }
    }

    $serialNumber = $bios.SerialNumber
    
    # Heurística para portáteis (Chassis Type)
    $chassisType = (Get-CimInstance -ClassName Win32_SystemEnclosure).ChassisTypes
    $isLaptop = $chassisType -contains 8 -or $chassisType -contains 9 -or $chassisType -contains 10 -or $chassisType -contains 14

    $typeGuess = if ($isLaptop) { "Laptop" } else { "Desktop" }

    return @{
        serialNumber = $serialNumber
        description = "$($cs.Manufacturer) $($cs.Model)"
        brandName = $cs.Manufacturer
        typeName = $typeGuess
        os_version = $os.Caption
        cpu_info = $cpu.Name
        ram_size = "$([Math]::Round($memory.Sum / 1GB)) GB"
        disk_info = $disks | ConvertTo-Json -Compress
        nomeNaRede = $env:COMPUTERNAME
    }
}

try {
    Write-Host "A recolher informação do sistema..."
    $info = Get-HardwareInfo
    
    if (-not $info.serialNumber) {
        Write-Error "Não foi possível obter o Número de Série. Abortar."
        return
    }

    Write-Host "A contactar o AIManager..."
    $headers = @{
        "apikey" = $supabaseAnonKey
        "Authorization" = "Bearer $supabaseAnonKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation" 
    }

    # Tenta encontrar o equipamento pelo S/N
    $query = "equipment?select=id&serialNumber=eq.$($info.serialNumber)"
    $existing = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/$query" -Method Get -Headers $headers
    
    $body = @{
        serialNumber = $info.serialNumber
        description = $info.description
        os_version = $info.os_version
        cpu_info = $info.cpu_info
        ram_size = $info.ram_size
        disk_info = $info.disk_info
        nomeNaRede = $info.nomeNaRede
        modifiedDate = (Get-Date).ToUniversalTime().ToString("o")
    } | ConvertTo-Json -Depth 5

    if ($existing.Count -gt 0) {
        # Update
        $id = $existing[0].id
        Write-Host "Equipamento encontrado (ID: $id). A atualizar..."
        Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/equipment?id=eq.$id" -Method Patch -Headers $headers -Body $body
    } else {
        # Create
        Write-Host "Equipamento novo. A registar no inventário..."
        # Tenta encontrar Brand/Type pelo nome
        $brandId = (Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/brands?select=id&name=ilike.$($info.brandName)" -Method Get -Headers $headers)[0].id
        $typeId = (Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/equipment_types?select=id&name=ilike.$($info.typeName)" -Method Get -Headers $headers)[0].id
        
        $createBody = $body | ConvertFrom-Json
        if($brandId) { $createBody.brandId = $brandId }
        if($typeId) { $createBody.typeId = $typeId }
        
        Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/equipment" -Method Post -Headers $headers -Body ($createBody | ConvertTo-Json -Depth 5)
    }

    Write-Host "Operação concluída com sucesso!" -ForegroundColor Green

} catch {
    Write-Error "Ocorreu um erro: $($_.Exception.Message)"
}
`;


const AgentsTab: React.FC = () => {
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
        <div className="flex flex-col h-full space-y-4 animate-fade-in p-6">
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
