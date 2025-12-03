import React, { useState, useMemo, useEffect } from 'react';
import { FaRobot, FaCopy, FaCheck, FaDownload, FaWindows } from 'react-icons/fa';

const agentScriptTemplate = `
# AIManager Windows Inventory Agent v1.3
#
# COMO USAR:
# 1. Execute este script como Administrador no computador alvo.
#    (As credenciais Supabase são injetadas automaticamente)
#
# MELHORIAS v1.3:
# - Corrigido erro de criação de novos equipamentos (erro 'brandId').
# - Refatorada a lógica de construção de payload para maior robustez.
# - Mantida a recolha automática de RAM, Disco, MACs e outras informações.

# --- CONFIGURAÇÃO (PREENCHIDA AUTOMATICAMENTE) ---
$supabaseUrl = "COLE_AQUI_O_SEU_SUPABASE_URL"
$supabaseAnonKey = "COLE_AQUI_A_SUA_SUPABASE_ANON_KEY"
# --------------------------------------------------

function Get-HardwareInfo {
    Write-Host "A recolher dados de Hardware e SO..."
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
    
    # Get Network Adapters (Active only)
    Write-Host "A recolher endereços MAC de placas ativas..."
    $macWifi = $null
    $macCabo = $null
    Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | ForEach-Object {
        if ($_.InterfaceDescription -like "*Wireless*" -or $_.InterfaceDescription -like "*Wi-Fi*") {
            $macWifi = $_.MacAddress
            Write-Host "  - MAC WiFi encontrado: $($macWifi)"
        }
        if ($_.InterfaceDescription -like "*Ethernet*" -or $_.InterfaceDescription -like "*Gigabit*") {
            $macCabo = $_.MacAddress
            Write-Host "  - MAC Cabo encontrado: $($macCabo)"
        }
    }

    $serialNumber = $bios.SerialNumber
    
    $chassisType = (Get-CimInstance -ClassName Win32_SystemEnclosure).ChassisTypes
    $isLaptop = $chassisType -contains 8 -or $chassisType -contains 9 -or $chassisType -contains 10 -or $chassisType -contains 14

    $typeGuess = if ($isLaptop) { "Laptop" } else { "Desktop" }
    Write-Host "Tipo de equipamento detetado: $($typeGuess)"

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
        macAddressWIFI = $macWifi
        macAddressCabo = $macCabo
    }
}

try {
    Write-Host "AIManager Agent v1.3" -ForegroundColor Cyan
    $info = Get-HardwareInfo
    
    if (-not $info.serialNumber) {
        Write-Error "Não foi possível obter o Número de Série. Abortar."
        return
    }

    Write-Host "Informação recolhida para S/N: $($info.serialNumber)"
    Write-Host "A contactar o AIManager em $supabaseUrl..."

    $headers = @{
        "apikey" = $supabaseAnonKey
        "Authorization" = "Bearer $supabaseAnonKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation" 
    }

    # Tenta encontrar o equipamento pelo S/N
    $query = "equipment?select=id&serialNumber=eq.$($info.serialNumber)"
    $existing = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/$query" -Method Get -Headers $headers
    
    # Construir payload base como uma Hashtable
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
        # Update (PATCH)
        $id = $existing[0].id
        $payload.Add("modifiedDate", (Get-Date).ToUniversalTime().ToString("o"))
        Write-Host "Equipamento encontrado (ID: $id). A atualizar..."
        Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/equipment?id=eq.$id" -Method Patch -Headers $headers -Body ($payload | ConvertTo-Json -Depth 5)
        Write-Host "Equipamento atualizado com sucesso." -ForegroundColor Green
    } else {
        # Create (POST)
        Write-Host "Equipamento novo. A registar no inventário..."
        
        # Tenta encontrar Brand/Type pelo nome para obter os IDs
        Write-Host "A procurar por Marca '$($info.brandName)' e Tipo '$($info.typeName)' existentes..."
        $brandId = (Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/brands?select=id&name=ilike.$($info.brandName)" -Method Get -Headers $headers)[0].id
        $typeId = (Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/equipment_types?select=id&name=ilike.$($info.typeName)" -Method Get -Headers $headers)[0].id

        # Fallback para nomes comuns (Laptop vs Portátil)
        if (-not $typeId -and ($info.typeName -eq "Laptop" -or $info.typeName -eq "Portátil")) {
            Write-Host "Tipo '$($info.typeName)' não encontrado. A tentar nomes alternativos..."
            $typeId = (Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/equipment_types?select=id&name=ilike.Laptop" -Method Get -Headers $headers)[0].id
            if (-not $typeId) {
                $typeId = (Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/equipment_types?select=id&name=ilike.Portátil" -Method Get -Headers $headers)[0].id
            }
        }
        
        # Adiciona os IDs ao payload se encontrados
        if($brandId) { 
            $payload.Add("brandId", $brandId)
            Write-Host "  - Marca encontrada: $($info.brandName)" -ForegroundColor Yellow 
        } else {
            Write-Host "  - AVISO: Marca '$($info.brandName)' não encontrada. Será necessário adicionar manualmente." -ForegroundColor Yellow
        }

        if($typeId) { 
            $payload.Add("typeId", $typeId)
            Write-Host "  - Tipo encontrado: $($info.typeName)" -ForegroundColor Yellow
        } else {
            Write-Host "  - AVISO: Tipo '$($info.typeName)' não encontrado. Será necessário adicionar manualmente." -ForegroundColor Yellow
        }
        
        Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/equipment" -Method Post -Headers $headers -Body ($payload | ConvertTo-Json -Depth 5)
        Write-Host "Equipamento criado com sucesso." -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "------------------------------------"
    Write-Host "Operação concluída!" -ForegroundColor Green
    Write-Host "------------------------------------"

} catch {
    Write-Error "Ocorreu um erro: $($_.Exception.Message)"
}

# Manter a janela aberta por 5 segundos para ler a saída
Start-Sleep -Seconds 5
`;


const AgentsTab: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseAnonKey, setSupabaseAnonKey] = useState('');

    useEffect(() => {
        // As credenciais são guardadas no localStorage durante o setup inicial.
        const url = localStorage.getItem('SUPABASE_URL');
        const key = localStorage.getItem('SUPABASE_ANON_KEY');
        if (url) setSupabaseUrl(url);
        if (key) setSupabaseAnonKey(key);
    }, []);

    const agentScript = useMemo(() => {
        if (!supabaseUrl || !supabaseAnonKey) {
            return agentScriptTemplate; // Mostra o template se as chaves não forem encontradas
        }
        // Injeta as credenciais corretas no script
        return agentScriptTemplate
            .replace('"COLE_AQUI_O_SEU_SUPABASE_URL"', `"${supabaseUrl}"`)
            .replace('"COLE_AQUI_A_SUA_SUPABASE_ANON_KEY"', `"${supabaseAnonKey}"`);
    }, [supabaseUrl, supabaseAnonKey]);

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
                <p className="mt-2 text-green-300 font-semibold bg-green-900/30 p-2 rounded border border-green-500/30">
                    O script abaixo já está configurado com as suas credenciais. Não é necessário editar.
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