
import React, { useState, useRef } from 'react';
import Modal from './common/Modal';
import { FaRobot, FaWindows, FaServer, FaCopy, FaCheck } from 'react-icons/fa';

interface AutomationModalProps {
    onClose: () => void;
}

const AutomationModal: React.FC<AutomationModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'client' | 'server'>('client');
    const [copied, setCopied] = useState(false);

    // Get configured keys from localStorage to pre-fill the script
    const supabaseUrl = localStorage.getItem('SUPABASE_URL') || 'https://SEU-PROJECT-ID.supabase.co';
    const supabaseKey = localStorage.getItem('SUPABASE_ANON_KEY') || 'SUA-CHAVE-PUBLICA';

    // The PowerShell Agent Script
    const clientScript = `# ==========================================
# AIManager - Agente de Inventário e Segurança
# ==========================================

$SupabaseUrl = "${supabaseUrl}"
$SupabaseKey = "${supabaseKey}"
$FunctionUrl = "$SupabaseUrl/functions/v1/sync-agent"

# 1. Recolha de Dados do Equipamento
$bios = Get-WmiObject -Class Win32_BIOS
$os = Get-WmiObject -Class Win32_OperatingSystem
$comp = Get-WmiObject -Class Win32_ComputerSystem

$serialNumber = $bios.SerialNumber
$manufacturer = $comp.Manufacturer
$model = $comp.Model
$osName = $os.Caption
$osVersion = $os.Version
$pcName = $comp.Name

# 2. Verificação de Segurança (Windows Defender)
$defender = Get-MpComputerStatus
$defenderStatus = @{
    RealTimeProtectionEnabled = $defender.RealTimeProtectionEnabled
    AntivirusEnabled = $defender.AntivirusEnabled
    AntivirusSignatureLastUpdated = $defender.AntivirusSignatureLastUpdated.ToString("yyyy-MM-dd HH:mm:ss")
    AntivirusSignatureVersion = $defender.AntivirusSignatureVersion
}

# 3. Payload para envio
$payload = @{
    serialNumber = $serialNumber
    manufacturer = $manufacturer
    model = $model
    hostname = $pcName
    os_version = "$osName ($osVersion)"
    last_security_update = (Get-Date).ToString("yyyy-MM-dd") # Data da execução
    defender = $defenderStatus
} | ConvertTo-Json -Depth 3

# 4. Envio para a Cloud (Supabase Edge Function)
try {
    $response = Invoke-RestMethod -Uri $FunctionUrl -Method Post -Body $payload -Headers @{ 
        "Authorization" = "Bearer $SupabaseKey"
        "Content-Type" = "application/json" 
    }
    Write-Host "Sucesso: Dados enviados para AIManager." -ForegroundColor Green
} catch {
    Write-Host "Erro ao enviar dados: $_" -ForegroundColor Red
}
`;

    // The Supabase Edge Function Code
    const serverScript = `// supabase/functions/sync-agent/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { serialNumber, manufacturer, model, hostname, os_version, defender } = await req.json()

    // 1. Procurar equipamento pelo Serial Number
    const { data: equipment } = await supabase
      .from('equipment')
      .select('id, criticality')
      .eq('serialNumber', serialNumber)
      .single()

    if (equipment) {
      // --- CENÁRIO A: EQUIPAMENTO EXISTE (Atualização) ---
      
      // 2. Atualizar dados do SO e Patch
      await supabase
        .from('equipment')
        .update({
          os_version: os_version,
          last_security_update: new Date().toISOString().split('T')[0], // Data de hoje
          // Se o Defender estiver desligado, sobe a criticidade automaticamente (Lógica de Segurança)
          criticality: (!defender.RealTimeProtectionEnabled) ? 'Alta' : equipment.criticality
        })
        .eq('id', equipment.id)

      // 3. Criar Ticket se o Defender estiver desligado (e não houver ticket aberto hoje)
      if (!defender.RealTimeProtectionEnabled) {
         const { data: existingTicket } = await supabase
            .from('tickets')
            .select('id')
            .eq('equipmentId', equipment.id)
            .eq('category', 'Incidente de Segurança')
            .eq('status', 'Pedido')
            .single()
         
         if (!existingTicket) {
             await supabase.from('tickets').insert({
                 title: 'Alerta Crítico: Antivírus Desativado',
                 description: 'O agente detetou que o Windows Defender está desativado neste posto de trabalho.',
                 equipmentId: equipment.id,
                 category: 'Incidente de Segurança',
                 securityIncidentType: 'Malware / Vírus',
                 impactCriticality: 'Alta',
                 requestDate: new Date().toISOString(),
                 status: 'Pedido'
             })
         }
      }
    } else {
        // --- CENÁRIO B: EQUIPAMENTO NÃO EXISTE (Dispositivo Desconhecido / Intruso) ---
        
        // Verificar se já existe um ticket de alerta para este Serial Number recentemente para evitar spam
        const { data: existingAlert } = await supabase
            .from('tickets')
            .select('id')
            .ilike('description', \`%serial: \${serialNumber}%\`)
            .eq('status', 'Pedido')
            .single()

        if (!existingAlert) {
            // Obter a primeira entidade (admin/default) para associar o ticket
            const { data: defaultEntity } = await supabase.from('entidades').select('id').limit(1).single()
            // Obter um admin para associar (fallback)
            const { data: defaultUser } = await supabase.from('collaborators').select('id').limit(1).single()

            if (defaultEntity && defaultUser) {
                await supabase.from('tickets').insert({
                    title: 'Alerta de Segurança: Dispositivo Não Inventariado na Rede',
                    description: \`O agente foi executado num dispositivo não registado na base de dados.\\n\\nDados detetados:\\nHostname: \${hostname}\\nSerial: \${serialNumber}\\nMarca: \${manufacturer}\\nModelo: \${model}\\nSO: \${os_version}\`,
                    entidadeId: defaultEntity.id,
                    collaboratorId: defaultUser.id, 
                    category: 'Incidente de Segurança',
                    securityIncidentType: 'Acesso Não Autorizado / Compromisso de Conta',
                    impactCriticality: 'Média',
                    requestDate: new Date().toISOString(),
                    status: 'Pedido'
                })
            }
        }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
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
        a.download = 'agent_aimanager.ps1';
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
                        <FaWindows /> 1. Script do PC (Local)
                    </button>
                    <button
                        onClick={() => setActiveTab('server')}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                            activeTab === 'server' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaServer /> 2. Servidor (Edge Function)
                    </button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'client' && (
                        <div className="flex flex-col h-full space-y-4">
                            <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                                <p className="font-bold mb-1">Instruções para o Script Local:</p>
                                <p>
                                    Este script recolhe o Nº de Série, Marca, Modelo e o <strong>Estado do Antivírus</strong>.
                                </p>
                                <ul className="list-disc list-inside mt-2 text-xs text-gray-400">
                                    <li>Copie o código ou faça download do ficheiro <code>.ps1</code>.</li>
                                    <li>Execute nos computadores da organização (manualmente, via GPO ou Intune).</li>
                                    <li>O script enviará os dados automaticamente para a sua base de dados.</li>
                                </ul>
                            </div>
                            
                            <div className="relative flex-grow">
                                <pre className="w-full h-full bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-400 border border-gray-700 overflow-auto custom-scrollbar">
                                    {clientScript}
                                </pre>
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button onClick={() => handleCopy(clientScript)} className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md shadow transition-colors" title="Copiar">
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
                                <p className="font-bold mb-1">Lógica da Edge Function (Cérebro):</p>
                                <p>
                                    Este código processa os dados recebidos dos agentes.
                                </p>
                                <ul className="list-disc list-inside mt-2 text-xs text-gray-300">
                                    <li><strong>Se o PC existe:</strong> Atualiza versão do SO e verifica se o Windows Defender está ativo. Se inativo, cria ticket crítico.</li>
                                    <li><strong>Se o PC NÃO existe:</strong> Cria um Ticket de Segurança alertando para "Dispositivo Não Inventariado na Rede".</li>
                                </ul>
                            </div>

                            <div className="relative flex-grow">
                                <pre className="w-full h-full bg-gray-900 p-4 rounded-lg text-xs font-mono text-blue-300 border border-gray-700 overflow-auto custom-scrollbar">
                                    {serverScript}
                                </pre>
                                <div className="absolute top-4 right-4">
                                    <button onClick={() => handleCopy(serverScript)} className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md shadow transition-colors" title="Copiar">
                                        {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
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
