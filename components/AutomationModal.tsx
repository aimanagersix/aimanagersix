
import React, { useState, useRef } from 'react';
import Modal from './common/Modal';
import { FaRobot, FaWindows, FaServer, FaCopy, FaCheck, FaDatabase } from 'react-icons/fa';

interface AutomationModalProps {
    onClose: () => void;
}

const AutomationModal: React.FC<AutomationModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'client' | 'server'>('client');
    const [copied, setCopied] = useState(false);

    // Get configured keys from localStorage to pre-fill the script
    const supabaseUrl = localStorage.getItem('SUPABASE_URL') || 'https://SEU-PROJECT-ID.supabase.co';
    const supabaseKey = localStorage.getItem('SUPABASE_ANON_KEY') || 'SUA-CHAVE-PUBLICA';

    // The PowerShell Agent Script (DIRECT REST API VERSION)
    const clientScript = `# ==========================================
# AIManager - Agente de Inventário (Modo Direto)
# ==========================================

$SupabaseUrl = "${supabaseUrl}"
$SupabaseKey = "${supabaseKey}"
$BaseUrl = "$SupabaseUrl/rest/v1"

# Headers de Autenticação
$Headers = @{
    "apikey" = $SupabaseKey
    "Authorization" = "Bearer $SupabaseKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# 1. Recolha de Dados do Equipamento
try {
    $bios = Get-WmiObject -Class Win32_BIOS
    $os = Get-WmiObject -Class Win32_OperatingSystem
    $comp = Get-WmiObject -Class Win32_ComputerSystem
    $defender = Get-MpComputerStatus

    $serialNumber = $bios.SerialNumber.Trim()
    $manufacturer = $comp.Manufacturer
    $model = $comp.Model
    $osName = $os.Caption
    $osVersion = $os.Version
    $hostname = $comp.Name
    
    Write-Host "A verificar equipamento: $hostname (S/N: $serialNumber)..." -ForegroundColor Cyan

    # 2. Verificar se existe na BD
    $CheckUrl = "$BaseUrl/equipment?serialNumber=eq.$serialNumber&select=*"
    $EquipmentList = Invoke-RestMethod -Uri $CheckUrl -Method Get -Headers $Headers

    if ($EquipmentList.Count -gt 0) {
        $eq = $EquipmentList[0]
        Write-Host " > Equipamento encontrado: $($eq.description)" -ForegroundColor Green

        # 3. Atualizar Dados (SO e Patch)
        $UpdateUrl = "$BaseUrl/equipment?id=eq.$($eq.id)"
        $UpdateBody = @{
            os_version = "$osName ($osVersion)"
            last_security_update = (Get-Date).ToString("yyyy-MM-dd")
        } | ConvertTo-Json

        Invoke-RestMethod -Uri $UpdateUrl -Method Patch -Body $UpdateBody -Headers $Headers
        Write-Host " > Informação de segurança atualizada." -ForegroundColor Green

        # 4. Verificação de Segurança (Windows Defender)
        if (-not $defender.RealTimeProtectionEnabled) {
            Write-Host " ! ALERTA: Antivírus Desativado!" -ForegroundColor Red
            
            # Verificar se já existe ticket aberto
            $TicketCheckUrl = "$BaseUrl/tickets?equipmentId=eq.$($eq.id)&status=eq.Pedido&category=eq.Incidente de Segurança&select=id"
            $ExistingTickets = Invoke-RestMethod -Uri $TicketCheckUrl -Method Get -Headers $Headers

            if ($ExistingTickets.Count -eq 0) {
                $TicketUrl = "$BaseUrl/tickets"
                $TicketBody = @{
                    title = "Alerta Crítico: Antivírus Desativado"
                    description = "O agente detetou que o Windows Defender está desativado em $hostname."
                    entidadeId = $eq.entidadeId # Assumindo que o equipamento já tem entidade
                    collaboratorId = $eq.collaboratorId # Assumindo colaborador associado
                    equipmentId = $eq.id
                    category = "Incidente de Segurança"
                    securityIncidentType = "Malware / Vírus"
                    impactCriticality = "Alta"
                    requestDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
                    status = "Pedido"
                } | ConvertTo-Json
                
                # Só cria ticket se tiver entidade associada (obrigatório)
                if ($eq.entidadeId) {
                    Invoke-RestMethod -Uri $TicketUrl -Method Post -Body $TicketBody -Headers $Headers
                    Write-Host " > Ticket de incidente criado." -ForegroundColor Yellow
                }
            }
        }
    } else {
        Write-Host " ! Equipamento NÃO encontrado na base de dados." -ForegroundColor Yellow
        
        # Opcional: Criar alerta de dispositivo desconhecido (Requer ID de entidade default, ignorado neste script simples)
        Write-Host " > Por favor, registe o S/N $serialNumber manualmente no AIManager."
    }

} catch {
    Write-Host "Erro de execução: $_" -ForegroundColor Red
    Write-Host "Detalhes: $($_.Exception.Response.StatusCode) - $($_.Exception.Message)"
}
`;

    // The Supabase Edge Function Code (Reference)
    const serverScript = `// Para cenários avançados (NIS2 Compliance & Segurança)
// Deploy via CLI: supabase functions deploy sync-agent

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // ... lógica avançada de validação e criação automática de ativos ...
  return new Response("Esta funcionalidade requer deploy no Supabase.", { status: 501 })
})
`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPs1 = () => {
        const blob = new Blob([clientScript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'agent_aimanager_direct.ps1';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <Modal title="Automação e Agentes" onClose={onClose} maxWidth="max-w-4xl">
            <div className="flex flex-col h-[70vh]">
                <div className="flex gap-4 mb-4 border-b border-gray-700 pb-2">
                    <button
                        onClick={() => setActiveTab('client')}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                            activeTab === 'client' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaWindows /> 1. Script do PC (Ligação Direta)
                    </button>
                    <button
                        onClick={() => setActiveTab('server')}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                            activeTab === 'server' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaServer /> 2. Servidor (Edge Function)
                    </button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'client' && (
                        <div className="flex flex-col h-full space-y-4">
                            <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <FaDatabase /> Modo Direto (Sem Servidor)
                                </div>
                                <p>
                                    Este script liga-se <strong>diretamente</strong> à sua base de dados para atualizar o equipamento.
                                    <br/>
                                    Resolve o erro "404 Not Found" pois não depende de configuração extra no servidor.
                                </p>
                                <ul className="list-disc list-inside mt-2 text-xs text-gray-400">
                                    <li>Recolhe o Serial Number e procura na lista de Equipamentos.</li>
                                    <li>Se encontrar: Atualiza a versão do SO e a data de segurança.</li>
                                    <li>Se o Antivírus estiver desligado: Tenta criar um Ticket de Alerta.</li>
                                </ul>
                            </div>
                            
                            <div className="relative flex-grow">
                                <pre className="w-full h-full bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-400 border border-gray-700 overflow-auto custom-scrollbar">
                                    {clientScript}
                                </pre>
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button onClick={() => handleCopy(clientScript)} className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md shadow transition-colors" title="Copiar Código">
                                        {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button onClick={handleDownloadPs1} className="px-6 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-md font-medium shadow-lg transition-colors flex items-center gap-2">
                                    <FaWindows /> Download Script (.ps1)
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'server' && (
                        <div className="flex flex-col h-full space-y-4">
                            <div className="bg-purple-900/20 border border-purple-900/50 p-4 rounded-lg text-sm text-purple-200">
                                <p className="font-bold mb-1">Lógica Avançada (Opcional):</p>
                                <p>
                                    Para empresas maiores, recomenda-se o uso de uma Edge Function para não expor a lógica de negócio no script do cliente.
                                    Requer deploy via <code>supabase functions deploy</code>.
                                </p>
                            </div>

                            <div className="relative flex-grow flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700">
                                <div className="text-center p-8">
                                    <FaServer className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                                    <h3 className="text-lg font-medium text-white">Configuração Avançada</h3>
                                    <p className="text-gray-400 text-sm mt-2 max-w-md">
                                        O código da Edge Function está disponível na documentação técnica para administradores de sistema que desejem configurar pipelines de CI/CD.
                                    </p>
                                    <button onClick={() => handleCopy(serverScript)} className="mt-4 text-brand-secondary hover:text-white text-xs underline">
                                        Ver esboço do código
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default AutomationModal;
