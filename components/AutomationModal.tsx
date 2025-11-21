
import React, { useState, useRef } from 'react';
import Modal from './common/Modal';
import { FaRobot, FaWindows, FaServer, FaCopy, FaCheck, FaDatabase, FaCode, FaTerminal } from 'react-icons/fa';

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
    // Updated to include Creation logic (Register)
    const clientScript = `# ==========================================
# AIManager - Agente de Inventário (v2.0 - Auto Registo)
# ==========================================

$SupabaseUrl = "${supabaseUrl}"
$SupabaseKey = "${supabaseKey}"
$BaseUrl = "$SupabaseUrl/rest/v1"

# Configuração
$Headers = @{
    "apikey" = $SupabaseKey
    "Authorization" = "Bearer $SupabaseKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation" # Retorna o objeto criado/atualizado
}

# --- Funções Auxiliares ---
function Get-DbId($Table, $Col, $Val) {
    try {
        $url = "$BaseUrl/$Table?$Col=eq.$([Uri]::EscapeDataString($Val))&select=id"
        $res = Invoke-RestMethod -Uri $url -Method Get -Headers $Headers
        if ($res.Count -gt 0) { return $res[0].id }
    } catch { return $null }
    return $null
}

function Create-Record($Table, $Body) {
    try {
        $json = $Body | ConvertTo-Json -Depth 2
        $url = "$BaseUrl/$Table"
        $res = Invoke-RestMethod -Uri $url -Method Post -Body $json -Headers $Headers
        return $res
    } catch {
        Write-Host "Erro ao criar registo em $Table : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Recolha de Dados do Equipamento
Write-Host "1. A recolher dados do sistema..." -ForegroundColor Cyan
$bios = Get-WmiObject -Class Win32_BIOS
$os = Get-WmiObject -Class Win32_OperatingSystem
$comp = Get-WmiObject -Class Win32_ComputerSystem
$defender = Get-MpComputerStatus

$serialNumber = $bios.SerialNumber.Trim()
$manufacturer = $comp.Manufacturer.Trim()
$model = $comp.Model.Trim()
$osName = $os.Caption.Trim()
$osVersion = $os.Version
$hostname = $comp.Name
$description = "$manufacturer $model ($hostname)"

# Determinar Tipo (Simples)
$chassis = Get-WmiObject -Class Win32_SystemEnclosure
$typeStr = "Desktop"
if ($chassis.ChassisTypes -contains 9 -or $chassis.ChassisTypes -contains 10) { $typeStr = "Laptop" }

Write-Host " > Sistema detetado: $description [$typeStr] S/N: $serialNumber" -ForegroundColor Gray

# 2. Sincronização (Marca & Tipo)
Write-Host "2. A sincronizar dependências..." -ForegroundColor Cyan

# Marca
$brandId = Get-DbId "brands" "name" $manufacturer
if (-not $brandId) {
    Write-Host " > Marca '$manufacturer' nova. A registar..." -ForegroundColor Yellow
    $newBrand = Create-Record "brands" @{ name = $manufacturer; risk_level = "Baixa" }
    $brandId = $newBrand.id
}

# Tipo
$typeId = Get-DbId "equipment_types" "name" $typeStr
if (-not $typeId) {
    Write-Host " > Tipo '$typeStr' novo. A registar..." -ForegroundColor Yellow
    $newType = Create-Record "equipment_types" @{ name = $typeStr }
    $typeId = $newType.id
}

# 3. Registar ou Atualizar Equipamento
Write-Host "3. A processar equipamento..." -ForegroundColor Cyan
$eqId = Get-DbId "equipment" "serialNumber" $serialNumber

$eqPayload = @{
    description = $description
    os_version = "$osName ($osVersion)"
    last_security_update = (Get-Date).ToString("yyyy-MM-dd")
}

if ($eqId) {
    # --- OPÇÃO A: ATUALIZAR ---
    Write-Host " > Equipamento já existe. A atualizar dados..." -ForegroundColor Green
    $updateUrl = "$BaseUrl/equipment?id=eq.$eqId"
    Invoke-RestMethod -Uri $updateUrl -Method Patch -Body ($eqPayload | ConvertTo-Json) -Headers $Headers
} else {
    # --- OPÇÃO B: REGISTAR ---
    Write-Host " > Novo equipamento detetado. A registar..." -ForegroundColor Green
    $newEqPayload = $eqPayload + @{
        serialNumber = $serialNumber
        brandId = $brandId
        typeId = $typeId
        status = "Stock"
        criticality = "Baixa"
    }
    $newEq = Create-Record "equipment" $newEqPayload
    $eqId = $newEq.id
}

# 4. Verificação de Segurança (Ticket Automático)
Write-Host "4. A verificar conformidade de segurança..." -ForegroundColor Cyan
if (-not $defender.RealTimeProtectionEnabled) {
    Write-Host " ! ALERTA CRÍTICO: Antivírus Desativado!" -ForegroundColor Red
    
    if ($eqId) {
        # Verificar se já existe ticket aberto
        $checkTicketUrl = "$BaseUrl/tickets?equipmentId=eq.$eqId&status=eq.Pedido&category=eq.Incidente de Segurança&select=id"
        $existingTickets = Invoke-RestMethod -Uri $checkTicketUrl -Method Get -Headers $Headers

        if ($existingTickets.Count -eq 0) {
            # --- OPÇÃO C: CRIAR TICKET DE ALERTA ---
            Write-Host " > A criar ticket de incidente de segurança..." -ForegroundColor Yellow
            $ticketBody = @{
                title = "Alerta Automático: Antivírus Desativado"
                description = "O agente detetou que o Windows Defender está desativado em $hostname ($serialNumber)."
                equipmentId = $eqId
                # Nota: Campos obrigatórios como entidadeId dependem da atribuição prévia. 
                # Este script assume que o registo permite nulos ou tem defaults na BD.
                category = "Incidente de Segurança"
                securityIncidentType = "Malware / Vírus"
                impactCriticality = "Alta"
                requestDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
                status = "Pedido"
            }
            Create-Record "tickets" $ticketBody | Out-Null
        } else {
            Write-Host " > Ticket já existe. Nenhuma ação necessária." -ForegroundColor Gray
        }
    }
} else {
    Write-Host " > Sistema Seguro (Antivírus Ativo)." -ForegroundColor Green
}

Write-Host "--- Concluído com sucesso ---" -ForegroundColor Cyan
`;

    // Instructions and Code for Supabase Edge Function
    const edgeFunctionCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Initialize Client (Service Role recommended for Agents)
    // Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Function Secrets
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Parse Request
    const { serialNumber, manufacturer, model, hostname, os_version, defender_status } = await req.json()

    if (!serialNumber) throw new Error("Missing Serial Number")

    // 4. Sync Brand
    let { data: brand } = await supabase.from('brands').select('id').eq('name', manufacturer).single()
    if (!brand) {
        const { data: newBrand } = await supabase.from('brands').insert({ name: manufacturer }).select('id').single()
        brand = newBrand
    }

    // 5. Upsert Equipment
    // First try to find it
    let { data: equipment } = await supabase.from('equipment').select('id, description').eq('serialNumber', serialNumber).single()
    
    const updateData = {
        os_version,
        last_security_update: new Date().toISOString().split('T')[0],
        modifiedDate: new Date().toISOString().split('T')[0]
    }

    if (equipment) {
        // Update
        await supabase.from('equipment').update(updateData).eq('id', equipment.id)
    } else {
        // Create
        // Find default type (e.g. Desktop)
        const { data: type } = await supabase.from('equipment_types').select('id').limit(1).single()
        
        const { data: newEq } = await supabase.from('equipment').insert({
            serialNumber,
            description: \`\${manufacturer} \${model}\`,
            brandId: brand?.id,
            typeId: type?.id,
            status: 'Stock',
            ...updateData
        }).select().single()
        equipment = newEq
    }

    // 6. Security Logic
    if (defender_status && !defender_status.RealTimeProtectionEnabled) {
        // Create ticket logic here...
    }

    return new Response(
      JSON.stringify({ success: true, equipmentId: equipment?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
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
        a.download = 'agent_aimanager_v2.ps1';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <Modal title="Automação e Agentes" onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex flex-col h-[75vh]">
                <div className="flex gap-4 mb-4 border-b border-gray-700 pb-2">
                    <button
                        onClick={() => setActiveTab('client')}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                            activeTab === 'client' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaWindows /> 1. Script do PC (PowerShell)
                    </button>
                    <button
                        onClick={() => setActiveTab('server')}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                            activeTab === 'server' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaServer /> 2. Edge Function (Supabase)
                    </button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'client' && (
                        <div className="flex flex-col h-full space-y-4">
                            <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <FaDatabase /> Modo Direto (Sem Servidor)
                                </div>
                                <p className="mb-2">
                                    Este script PowerShell executa as <strong>3 operações essenciais</strong> diretamente na base de dados:
                                </p>
                                <ol className="list-decimal list-inside text-xs text-gray-300 space-y-1">
                                    <li><strong>Registo Automático:</strong> Se o equipamento (Serial Number) não existir, cria-o (incluindo Marca e Tipo se necessário).</li>
                                    <li><strong>Atualização:</strong> Se existir, atualiza a informação do SO e data do último patch de segurança.</li>
                                    <li><strong>Alerta de Segurança:</strong> Verifica o Windows Defender e cria um Ticket crítico se estiver desativado.</li>
                                </ol>
                                <p className="mt-2 text-xs text-yellow-400">
                                    Nota: Certifique-se que a chave "Anon" tem permissões para INSERT/UPDATE nas tabelas 'equipment', 'brands', 'equipment_types' e 'tickets' (RLS Policies).
                                </p>
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
                        <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-2">
                            <div className="bg-purple-900/20 border border-purple-900/50 p-4 rounded-lg text-sm text-purple-200">
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <FaCode /> Criar Supabase Edge Function
                                </div>
                                <p>
                                    Use esta opção para maior segurança. O script do cliente envia dados para esta função, que lida com a lógica de negócio usando a chave de administração (Service Role).
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-black/30 p-4 rounded border border-gray-700">
                                    <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaTerminal className="text-gray-400"/> 1. Preparação (Terminal)</h4>
                                    <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap select-all">
{`# Instalar CLI (se necessário)
brew install supabase/tap/supabase  # macOS
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase  # Windows

# Login e Inicialização
supabase login
supabase init

# Criar a nova função
supabase functions new sync-agent`}
                                    </pre>
                                </div>

                                <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                                    <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaCode className="text-yellow-400"/> 2. Código da Função (index.ts)</h4>
                                    <p className="text-xs text-gray-400 mb-2">Copie este código para o ficheiro <code>supabase/functions/sync-agent/index.ts</code>:</p>
                                    <div className="relative">
                                        <pre className="text-xs font-mono text-green-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-64">
                                            {edgeFunctionCode}
                                        </pre>
                                        <button onClick={() => handleCopy(edgeFunctionCode)} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                            <FaCopy />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-black/30 p-4 rounded border border-gray-700">
                                    <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaServer className="text-purple-400"/> 3. Deploy</h4>
                                    <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap select-all">
{`# Deploy da função para o projeto
supabase functions deploy sync-agent --project-ref ${supabaseUrl.split('.')[0].replace('https://', '')} --no-verify-jwt

# Definir Variáveis de Ambiente (Secrets)
supabase secrets set SUPABASE_URL=${supabaseUrl}
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui`}
                                    </pre>
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
