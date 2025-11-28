
import React, { useState, useRef } from 'react';
import Modal from './common/Modal';
import { FaRobot, FaWindows, FaServer, FaCopy, FaCheck, FaDatabase, FaCode, FaTerminal, FaClock, FaEnvelope, FaList, FaPaperPlane, FaReply } from 'react-icons/fa';

interface AutomationModalProps {
    onClose: () => void;
}

const AutomationModal: React.FC<AutomationModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'client' | 'server' | 'cron' | 'email'>('client');
    const [copied, setCopied] = useState(false);

    // Get configured keys from localStorage to pre-fill the script
    const supabaseUrl = localStorage.getItem('SUPABASE_URL') || 'https://SEU-PROJECT-ID.supabase.co';
    const supabaseKey = localStorage.getItem('SUPABASE_ANON_KEY') || 'SUA-CHAVE-PUBLICA';

    // The PowerShell Agent Script (DIRECT REST API VERSION)
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

# 2. Sincronização (Marca & Tipo) - AS 3 OPÇÕES PARA REGISTO
Write-Host "2. A verificar dependências de registo..." -ForegroundColor Cyan

# Opção 1: Marca
$brandId = Get-DbId "brands" "name" $manufacturer
if (-not $brandId) {
    Write-Host " > Marca '$manufacturer' inexistente. A criar..." -ForegroundColor Yellow
    $newBrand = Create-Record "brands" @{ name = $manufacturer; risk_level = "Baixa" }
    $brandId = $newBrand.id
} else {
    Write-Host " > Marca '$manufacturer' validada." -ForegroundColor Gray
}

# Opção 2: Tipo de Equipamento
$typeId = Get-DbId "equipment_types" "name" $typeStr
if (-not $typeId) {
    Write-Host " > Tipo '$typeStr' inexistente. A criar..." -ForegroundColor Yellow
    $newType = Create-Record "equipment_types" @{ name = $typeStr }
    $typeId = $newType.id
} else {
    Write-Host " > Tipo '$typeStr' validado." -ForegroundColor Gray
}

# 3. Registar ou Atualizar Equipamento (Opção 3)
Write-Host "3. A processar registo do equipamento..." -ForegroundColor Cyan
$eqId = Get-DbId "equipment" "serialNumber" $serialNumber

$eqPayload = @{
    description = $description
    os_version = "$osName ($osVersion)"
    last_security_update = (Get-Date).ToString("yyyy-MM-dd")
}

if ($eqId) {
    # --- ATUALIZAR ---
    Write-Host " > Equipamento já registado. A atualizar dados..." -ForegroundColor Green
    $updateUrl = "$BaseUrl/equipment?id=eq.$eqId"
    Invoke-RestMethod -Uri $updateUrl -Method Patch -Body ($eqPayload | ConvertTo-Json) -Headers $Headers
} else {
    # --- CRIAR NOVO ---
    Write-Host " > Novo equipamento detetado. A efetuar registo completo..." -ForegroundColor Green
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
            Write-Host " > A criar ticket de incidente de segurança..." -ForegroundColor Yellow
            $ticketBody = @{
                title = "Alerta Automático: Antivírus Desativado"
                description = "O agente detetou que o Windows Defender está desativado em $hostname ($serialNumber)."
                equipmentId = $eqId
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

Write-Host "--- Sincronização Concluída ---" -ForegroundColor Cyan
`;

    // Instructions and Code for Supabase Edge Function
    const edgeFunctionCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Initialize Client (Service Role needed for upserts/creates)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Parse Request Body
    const { serialNumber, manufacturer, model, hostname, os_version, defender_status } = await req.json()

    if (!serialNumber) throw new Error("Missing Serial Number")

    // 4. Sync Brand (Opção 1)
    let { data: brand } = await supabase.from('brands').select('id').eq('name', manufacturer).single()
    if (!brand) {
        // Create if missing
        const { data: newBrand } = await supabase.from('brands').insert({ name: manufacturer }).select('id').single()
        brand = newBrand
    }

    // 5. Find or Create Type (Opção 2)
    const typeName = model.toLowerCase().includes('laptop') ? 'Laptop' : 'Desktop';
    let { data: type } = await supabase.from('equipment_types').select('id').eq('name', typeName).single()
    if (!type) {
         const { data: newType } = await supabase.from('equipment_types').insert({ name: typeName }).select('id').single()
         type = newType
    }

    // 6. Upsert Equipment (Opção 3)
    let { data: equipment } = await supabase.from('equipment').select('id, description').eq('serialNumber', serialNumber).single()
    
    const updateData = {
        os_version,
        last_security_update: new Date().toISOString().split('T')[0],
        modifiedDate: new Date().toISOString().split('T')[0],
        description: \`\${manufacturer} \${model} (\${hostname})\`
    }

    if (equipment) {
        await supabase.from('equipment').update(updateData).eq('id', equipment.id)
    } else {
        const { data: newEq } = await supabase.from('equipment').insert({
            serialNumber,
            description: \`\${manufacturer} \${model} (\${hostname})\`,
            brandId: brand?.id,
            typeId: type?.id,
            status: 'Stock',
            criticality: 'Baixa',
            ...updateData
        }).select().single()
        equipment = newEq
    }

    // 7. Security Logic (Create Ticket)
    if (defender_status && !defender_status.RealTimeProtectionEnabled) {
        const { data: tickets } = await supabase.from('tickets')
            .select('id')
            .eq('equipmentId', equipment.id)
            .eq('status', 'Pedido')
            .eq('category', 'Incidente de Segurança')
        
        if (!tickets || tickets.length === 0) {
             await supabase.from('tickets').insert({
                title: "Alerta Automático: Antivírus Desativado",
                description: \`Detetado Windows Defender desativado em \${hostname}.\`,
                equipmentId: equipment.id,
                category: "Incidente de Segurança",
                securityIncidentType: "Malware / Vírus",
                impactCriticality: "Alta",
                requestDate: new Date().toISOString(),
                status: "Pedido"
             })
        }
    }

    return new Response(
      JSON.stringify({ success: true, equipmentId: equipment?.id, action: equipment ? 'updated' : 'created' }),
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

    // CRON Job Scripts
    const cronFunctionCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Use Resend.com for free transactional emails
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch Summary Data
    const { count: ticketCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'Pedido')
    const { count: vulnCount } = await supabase.from('vulnerabilities').select('*', { count: 'exact', head: true }).eq('status', 'Aberto')
    
    // 2. Construct Email Body
    const emailHtml = \`
      <h1>Relatório Semanal - AIManager</h1>
      <p>Aqui está o resumo do estado do seu parque informático:</p>
      <ul>
        <li><strong>Tickets Pendentes:</strong> \${ticketCount}</li>
        <li><strong>Vulnerabilidades Abertas:</strong> \${vulnCount}</li>
      </ul>
      <p>Aceda ao dashboard para mais detalhes.</p>
    \`

    // 3. Send Email (Example using Fetch to Resend)
    if (RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${RESEND_API_KEY}\`
            },
            body: JSON.stringify({
                from: 'AIManager <onboarding@resend.dev>',
                to: ['admin@empresa.com'], // Change this
                subject: 'Relatório Semanal de Ativos',
                html: emailHtml
            })
        })
    }

    return new Response(JSON.stringify({ success: true, sent: !!RESEND_API_KEY }), { headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
`;

    const cronSqlCode = `
-- Habilitar extensão pg_cron (necessário projeto Pro ou instância própria com suporte)
create extension if not exists pg_cron;

-- Agendar execução todas as Segundas-feiras às 09:00 AM
select cron.schedule(
  'weekly-report-job', -- nome do job
  '0 9 * * 1',         -- cron expression (min hora dia mes dia_semana)
  $$
  select
    net.http_post(
        url:='https://PROJECT_REF.supabase.co/functions/v1/weekly-report',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Para ver jobs agendados:
-- select * from cron.job;
`;

    const emailNotifyCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    // Webhook Payload from Database Insert
    const { record } = await req.json()
    
    if (!record || !record.team_id) {
        return new Response('No team assigned', { status: 200 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch Team Members emails
    const { data: members } = await supabase
        .from('team_members')
        .select('collaborator_id, collaborators(email)')
        .eq('team_id', record.team_id)

    if (!members || members.length === 0) return new Response('No members found', { status: 200 })
    
    const emails = members.map((m:any) => m.collaborators?.email).filter(Boolean)

    // 2. Send Email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${RESEND_API_KEY}\`
      },
      body: JSON.stringify({
        from: 'AIManager Support <support@resend.dev>',
        to: emails,
        subject: \`[Ticket: \${record.id.substring(0,8)}] \${record.title}\`,
        html: \`
            <h2>Novo Ticket Atribuído à Equipa</h2>
            <p><strong>Assunto:</strong> \${record.title}</p>
            <p><strong>Prioridade:</strong> \${record.impactCriticality || 'Normal'}</p>
            <p><strong>Descrição:</strong> \${record.description}</p>
            <br/>
            <p>Para adicionar um comentário, responda diretamente a este email.</p>
        \`
      })
    })

    return new Response(JSON.stringify(await res.json()), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})`;

    const emailReplyCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    // 1. Parse Inbound Email
    // Resend uses a specific JSON payload for webhooks, unlike Mailgun/SendGrid that use FormData
    const payload = await req.json()
    
    // Check payload structure (Resend specific)
    const subject = payload.subject || ''
    const text = payload.text || ''
    const from = payload.from || ''

    // 2. Extract Ticket ID from Subject (Regex: [Ticket: UUID-PART])
    // Example Subject: "Re: [Ticket: a1b2c3d4] Impressora"
    const ticketIdMatch = subject.match(/Ticket: ([a-f0-9-]{8})/)
    
    if (!ticketIdMatch) {
        console.log("No Ticket ID found in subject:", subject)
        return new Response('No Ticket ID found', { status: 200 })
    }
    
    const shortId = ticketIdMatch[1] // Partial ID

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Find full Ticket ID
    const { data: ticket } = await supabase
        .from('tickets')
        .select('id')
        .ilike('id', \`\${shortId}%\`)
        .single()

    if (!ticket) return new Response('Ticket not found', { status: 404 })

    // 4. Find Technician by Email (From)
    // Clean up sender string if it comes as "Name <email@domain.com>"
    const cleanEmail = from.match(/<(.+)>/)?.[1] || from
    
    const { data: tech } = await supabase
        .from('collaborators')
        .select('id')
        .eq('email', cleanEmail)
        .single()

    // 5. Insert Activity (Comment)
    // Filter out email signatures if possible (simple split by common delimiters)
    const cleanText = text.split('On ')[0].split('-----Original Message-----')[0].substring(0, 1000)

    await supabase.from('ticket_activities').insert({
        ticketId: ticket.id,
        description: \`[Email Reply]: \${cleanText}\`,
        technicianId: tech?.id || null, // Null if external user
        date: new Date().toISOString()
    })

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})`;

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
                <div className="flex gap-4 mb-4 border-b border-gray-700 pb-2 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('client')}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                            activeTab === 'client' ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaWindows /> 1. Script do PC
                    </button>
                    <button
                        onClick={() => setActiveTab('server')}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                            activeTab === 'server' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaServer /> 2. Edge Functions
                    </button>
                    <button
                        onClick={() => setActiveTab('cron')}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                            activeTab === 'cron' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaClock /> 3. Cron Jobs
                    </button>
                    <button
                        onClick={() => setActiveTab('email')}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                            activeTab === 'email' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaEnvelope /> 4. Email & Tickets
                    </button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTab === 'client' && (
                        <div className="flex flex-col h-full space-y-4">
                            <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <FaDatabase /> Modo Direto (Auto-Registo Completo)
                                </div>
                                <p className="mb-2">
                                    Este script PowerShell executa as <strong>3 opções essenciais</strong> para garantir que o equipamento fica registado corretamente:
                                </p>
                                <ol className="list-decimal list-inside text-xs text-gray-300 space-y-1">
                                    <li><strong>Verificar/Criar Marca:</strong> Se a marca detetada não existir na base de dados, é criada automaticamente.</li>
                                    <li><strong>Verificar/Criar Tipo:</strong> Se o tipo (Desktop/Laptop) não existir, é criado automaticamente.</li>
                                    <li><strong>Registar Equipamento:</strong> Cria o equipamento com todas as relações corretas ou atualiza os dados de segurança se já existir.</li>
                                </ol>
                                <p className="mt-2 text-xs text-yellow-400">
                                    Nota: O script utiliza a chave "Anon" configurada localmente.
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
                        <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="bg-purple-900/20 border border-purple-900/50 p-4 rounded-lg text-sm text-purple-200">
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <FaCode /> Criar Supabase Edge Function (Segurança Avançada)
                                </div>
                                <p>
                                    Use esta opção para centralizar a lógica no servidor. O script do cliente envia apenas o JSON, e a função gere as 3 opções de registo usando a chave de administração.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-black/30 p-4 rounded border border-gray-700">
                                    <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaTerminal className="text-gray-400"/> 1. Preparação (Terminal)</h4>
                                    <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap select-all">
{`# Instalar CLI do Supabase (se necessário)
brew install supabase/tap/supabase  # macOS
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase  # Windows

# Login e Inicialização do Projeto Local
supabase login
supabase init

# Criar a nova função chamada 'sync-agent'
supabase functions new sync-agent`}
                                    </pre>
                                </div>

                                <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                                    <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaCode className="text-yellow-400"/> 2. Código da Função (Copiar para index.ts)</h4>
                                    <p className="text-xs text-gray-400 mb-2">
                                        Substitua o conteúdo do ficheiro <code>supabase/functions/sync-agent/index.ts</code> pelo seguinte código.
                                        Este código implementa a lógica de auto-registo de Marca, Tipo e Equipamento.
                                    </p>
                                    <div className="relative">
                                        <pre className="text-xs font-mono text-green-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-64 custom-scrollbar">
                                            {edgeFunctionCode}
                                        </pre>
                                        <button onClick={() => handleCopy(edgeFunctionCode)} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                            <FaCopy />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-black/30 p-4 rounded border border-gray-700">
                                    <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaServer className="text-purple-400"/> 3. Deploy e Configuração</h4>
                                    <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap select-all">
{`# Obter o ID do projeto (Reference ID) nas definições do Supabase
# Exemplo: se o URL é https://abcdefgh.supabase.co, o ID é 'abcdefgh'

# Deploy da função para a nuvem
supabase functions deploy sync-agent --project-ref SEU_PROJECT_ID --no-verify-jwt

# Definir Variáveis de Ambiente (Secrets) para a função funcionar
supabase secrets set SUPABASE_URL=${supabaseUrl} --project-ref SEU_PROJECT_ID
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui --project-ref SEU_PROJECT_ID`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cron' && (
                         <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-sm text-green-200">
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <FaClock /> Cron Jobs (Relatórios Automáticos)
                                </div>
                                <p>
                                    Configure o envio automático de relatórios semanais por email utilizando Edge Functions e o agendador `pg_cron` da base de dados.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                                    <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaEnvelope className="text-yellow-400"/> 1. Edge Function (Envio de Email)</h4>
                                    <p className="text-xs text-gray-400 mb-2">
                                        Crie uma nova função `supabase functions new weekly-report` e use este código. Necessita de uma API Key de um serviço de email (ex: Resend).
                                    </p>
                                    <div className="relative">
                                        <pre className="text-xs font-mono text-green-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-64 custom-scrollbar">
                                            {cronFunctionCode}
                                        </pre>
                                        <button onClick={() => handleCopy(cronFunctionCode)} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                            <FaCopy />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                                    <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaDatabase className="text-blue-400"/> 2. Configuração SQL (pg_cron)</h4>
                                    <p className="text-xs text-gray-400 mb-2">
                                        Execute este comando no <strong>SQL Editor</strong> do Supabase para agendar a execução da função todas as segundas-feiras.
                                    </p>
                                    <div className="relative">
                                        <pre className="text-xs font-mono text-orange-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-40 custom-scrollbar">
                                            {cronSqlCode}
                                        </pre>
                                        <button onClick={() => handleCopy(cronSqlCode)} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                            <FaCopy />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'email' && (
                         <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="bg-orange-900/20 border border-orange-500/50 p-4 rounded-lg text-sm text-orange-200">
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <FaEnvelope /> Email & Tickets (Resend Integration)
                                </div>
                                <p>
                                    Configure o envio de notificações e a recepção de respostas (Inbound) utilizando o serviço <strong>Resend</strong>.
                                </p>
                                <p className="mt-2 text-xs text-white">
                                    Nota: O Resend utiliza <strong>Webhooks JSON</strong>. O código abaixo está preparado para isso.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Outbound Notification */}
                                <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                                    <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaPaperPlane className="text-blue-400"/> 1. Notificação de Novo Ticket (Outbound)</h4>
                                    <p className="text-xs text-gray-400 mb-2">
                                        Esta função envia um email quando um ticket é criado, incluindo o ID no assunto para rastreio.
                                        <br/>
                                        <strong>Setup:</strong> Crie a função <code>ticket-notify</code> e configure um Database Webhook no Supabase (Tabela: tickets, Evento: INSERT).
                                    </p>
                                    <div className="relative">
                                        <pre className="text-xs font-mono text-blue-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-64 custom-scrollbar">
                                            {emailNotifyCode}
                                        </pre>
                                        <button onClick={() => handleCopy(emailNotifyCode)} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                            <FaCopy />
                                        </button>
                                    </div>
                                </div>

                                {/* Inbound Reply */}
                                <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                                    <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaReply className="text-green-400"/> 2. Processar Respostas (Inbound Webhook)</h4>
                                    <p className="text-xs text-gray-400 mb-2">
                                        Esta função recebe o JSON do Resend, extrai o ID do ticket do assunto e insere o comentário.
                                        <br/>
                                        <strong>Setup:</strong>
                                        <br/>1. Crie a função <code>email-processor</code> com este código.
                                        <br/>2. Faça deploy: <code>supabase functions deploy email-processor --no-verify-jwt</code>
                                        <br/>3. No <strong>Resend Dashboard</strong>: Adicione o seu domínio, verifique os registos MX e configure um <strong>Webhook</strong> apontando para a URL da função.
                                    </p>
                                    <div className="relative">
                                        <pre className="text-xs font-mono text-green-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-64 custom-scrollbar">
                                            {emailReplyCode}
                                        </pre>
                                        <button onClick={() => handleCopy(emailReplyCode)} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                            <FaCopy />
                                        </button>
                                    </div>
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
