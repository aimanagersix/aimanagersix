
import React, { useState, useEffect } from 'react';
import { FaRobot, FaCog, FaKey, FaNetworkWired, FaClock } from 'react-icons/fa';
import * as dataService from '../services/dataService';
import { parseSecurityAlert } from '../services/geminiService';

// Import Tab Components
import GeneralScansTab from './settings/GeneralScansTab';
import ConnectionsTab from './settings/ConnectionsTab';
import AgentsTab from './settings/AgentsTab';
import WebhooksTab from './settings/WebhooksTab';
import CronJobsTab from './settings/CronJobsTab';

interface AuxiliaryDataDashboardProps {
    appData: any;
    onRefresh: () => void;
}

const AuxiliaryDataDashboard: React.FC<AuxiliaryDataDashboardProps> = ({ appData, onRefresh }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'connections' | 'agents' | 'webhooks' | 'cron'>('general');
    
    // State is managed here and passed down to child components
    const [settings, setSettings] = useState({
        // General & Scans
        scan_frequency_days: '0',
        scan_start_time: '02:00',
        last_auto_scan: '-',
        scan_include_eol: true,
        scan_lookback_years: 2,
        scan_custom_prompt: '',
        equipment_naming_prefix: 'PC-',
        equipment_naming_digits: '4',
        weekly_report_recipients: '',

        // Connections
        sbUrl: '',
        sbKey: '',
        sbServiceKey: '',
        resendApiKey: '',
        resendFromEmail: '',

        // Webhook
        webhookJson: '{\n  "alert_name": "Malware Detected",\n  "severity": "Critical",\n  "hostname": "PC-FINANCE-01",\n  "description": "Ransomware detected in C:\\Users\\Admin"\n}',
        isSimulating: false,
        simulatedTicket: null,
        webhookUrl: '',

        // Cron
        cronFunctionUrl: '',
        isTestingCron: false,
        cronFunctionCode: '', // This will be static text
        cronSqlCode: '',
        copiedCode: null,
    });
    
    // FIX: Copied script constants from AutomationModal.tsx to fix reference errors.
    // Get configured keys from localStorage to pre-fill the script
    const supabaseUrl = localStorage.getItem('SUPABASE_URL') || 'https://SEU-PROJECT-ID.supabase.co';
    const supabaseKey = localStorage.getItem('SUPABASE_ANON_KEY') || 'SUA-CHAVE-PUBLICA';

    // The PowerShell Agent Script (DIRECT REST API VERSION)
    const agentScript = `# ==========================================
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
    
    const cronFunctionCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Ler Configurações da DB (Emails e API Key)
    const { data: settings } = await supabase
      .from('global_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['weekly_report_recipients', 'resend_api_key'])
    
    const recipientsStr = settings?.find(s => s.setting_key === 'weekly_report_recipients')?.setting_value
    const resendKey = settings?.find(s => s.setting_key === 'resend_api_key')?.setting_value
    
    // Default recipients if none configured
    const recipients = recipientsStr ? recipientsStr.split(',').map(e => e.trim()) : []

    // Early return if no key, but return JSON to avoid crashing frontend fetch
    if (!resendKey) {
         return new Response(JSON.stringify({ error: "Resend API Key não configurada na tabela global_settings." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    
    if (recipients.length === 0) {
        return new Response(JSON.stringify({ message: "Sem destinatários configurados para envio." }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Fetch Data
    const { count: ticketCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'Pedido')
    const { count: vulnCount } = await supabase.from('vulnerabilities').select('*', { count: 'exact', head: true }).eq('status', 'Aberto')
    
    const emailHtml = \`
      <h1>Relatório Semanal - AIManager</h1>
      <ul>
        <li><strong>Tickets Pendentes:</strong> \${ticketCount}</li>
        <li><strong>Vulnerabilidades Abertas:</strong> \${vulnCount}</li>
      </ul>
      <p>Aceda ao dashboard para mais detalhes.</p>
    \`

    // 3. Send Email via Resend
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${resendKey}\`
        },
        body: JSON.stringify({
            from: 'AIManager <onboarding@resend.dev>',
            to: recipients, 
            subject: 'Relatório Semanal de Ativos',
            html: emailHtml
        })
    })
    
    // Parse Resend response safely
    const resultText = await res.text()
    let resultJson = {}
    try {
        resultJson = JSON.parse(resultText)
    } catch (e) {
        resultJson = { raw: resultText }
    }

    if (!res.ok) {
        console.error("Resend Error:", resultJson)
        throw new Error(\`Resend API Error: \${JSON.stringify(resultJson)}\`)
    }

    return new Response(JSON.stringify({ success: true, result: resultJson }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error("Function Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
        url:='https://[PROJECT-REF].supabase.co/functions/v1/weekly-report',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
`;

    useEffect(() => {
        const loadSettings = async () => {
            const keysToFetch = [
                'scan_frequency_days', 'scan_start_time', 'last_auto_scan', 
                'scan_include_eol', 'scan_lookback_years', 'scan_custom_prompt',
                'equipment_naming_prefix', 'equipment_naming_digits',
                'weekly_report_recipients', 'resend_api_key', 'resend_from_email'
            ];
            
            const fetchedSettings: any = {};
            for (const key of keysToFetch) {
                fetchedSettings[key] = await dataService.getGlobalSetting(key);
            }

            const projectUrl = localStorage.getItem('SUPABASE_URL');

            setSettings(prev => ({
                ...prev,
                scan_frequency_days: fetchedSettings.scan_frequency_days || '0',
                scan_start_time: fetchedSettings.scan_start_time || '02:00',
                last_auto_scan: fetchedSettings.last_auto_scan ? new Date(fetchedSettings.last_auto_scan).toLocaleString() : '-',
                scan_include_eol: fetchedSettings.scan_include_eol ? fetchedSettings.scan_include_eol === 'true' : true,
                scan_lookback_years: fetchedSettings.scan_lookback_years ? parseInt(fetchedSettings.scan_lookback_years) : 2,
                scan_custom_prompt: fetchedSettings.scan_custom_prompt || '',
                equipment_naming_prefix: fetchedSettings.equipment_naming_prefix || 'PC-',
                equipment_naming_digits: fetchedSettings.equipment_naming_digits || '4',
                weekly_report_recipients: fetchedSettings.weekly_report_recipients || '',
                resendApiKey: fetchedSettings.resend_api_key || '',
                resendFromEmail: fetchedSettings.resend_from_email || '',

                sbUrl: localStorage.getItem('SUPABASE_URL') || '',
                sbKey: localStorage.getItem('SUPABASE_ANON_KEY') || '',
                sbServiceKey: localStorage.getItem('SUPABASE_SERVICE_ROLE_KEY') || '',
                
                webhookUrl: projectUrl ? `${projectUrl}/functions/v1/siem-ingest` : '',
                cronFunctionUrl: projectUrl ? `${projectUrl}/functions/v1/weekly-report` : '',
            }));
        };
        loadSettings();
    }, []);

    const handleSettingsChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveGeneral = async () => {
        const keysToSave = [
            'scan_frequency_days', 'scan_start_time', 
            'scan_include_eol', 'scan_lookback_years', 'scan_custom_prompt',
            'equipment_naming_prefix', 'equipment_naming_digits', 'weekly_report_recipients'
        ];
        for (const key of keysToSave) {
            await dataService.updateGlobalSetting(key, String((settings as any)[key]));
        }
        alert("Configurações guardadas.");
    };

    const handleSaveConnections = async () => {
        await dataService.updateGlobalSetting('resend_api_key', settings.resendApiKey);
        await dataService.updateGlobalSetting('resend_from_email', settings.resendFromEmail);
        
        if (settings.sbUrl && settings.sbKey) {
            localStorage.setItem('SUPABASE_URL', settings.sbUrl);
            localStorage.setItem('SUPABASE_ANON_KEY', settings.sbKey);
        }
        if (settings.sbServiceKey) {
            localStorage.setItem('SUPABASE_SERVICE_ROLE_KEY', settings.sbServiceKey);
        }

        if (confirm("Credenciais guardadas. A página será recarregada para aplicar a nova ligação.")) {
            window.location.reload();
        }
    };
    
    // Webhook Simulation Logic
    const handleSimulateWebhook = async () => {
        handleSettingsChange('isSimulating', true);
        handleSettingsChange('simulatedTicket', null);
        try {
            const result = await parseSecurityAlert(settings.webhookJson);
            handleSettingsChange('simulatedTicket', {
                title: result.title,
                description: `${result.description}\n\n[Origem: ${result.sourceSystem}] [Ativo: ${result.affectedAsset}]`,
                severity: result.severity,
                category: 'Incidente de Segurança',
                type: result.incidentType,
                status: 'Pedido'
            });
        } catch (error) {
            console.error(error);
            alert("Erro na simulação da IA.");
        } finally {
            handleSettingsChange('isSimulating', false);
        }
    };

    const handleCreateSimulatedTicket = async () => {
        if (!settings.simulatedTicket) return;
        if (confirm("Deseja criar este ticket real na base de dados?")) {
            try {
                await dataService.addTicket({
                    title: settings.simulatedTicket.title,
                    description: settings.simulatedTicket.description,
                    category: settings.simulatedTicket.category,
                    securityIncidentType: settings.simulatedTicket.type,
                    impactCriticality: settings.simulatedTicket.severity,
                    status: 'Pedido',
                    requestDate: new Date().toISOString(),
                    entidadeId: appData.entidades[0]?.id || '', 
                    collaboratorId: appData.collaborators[0]?.id || '' 
                });
                alert("Ticket criado com sucesso!");
                handleSettingsChange('simulatedTicket', null);
                onRefresh();
            } catch (e) {
                alert("Erro ao criar ticket.");
            }
        }
    };

    const handleTestCron = async () => {
        if (!settings.cronFunctionUrl) return;
        handleSettingsChange('isTestingCron', true);
        try {
            const response = await fetch(settings.cronFunctionUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${settings.sbKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const result = await response.json();
            if (response.ok) {
                alert(`Teste executado!\nResultado: ${JSON.stringify(result)}`);
            } else {
                alert(`Erro: ${result.error || response.statusText}\n\nVerifique se a Edge Function 'weekly-report' foi implementada (deployed) e se os 'secrets' estão configurados.`);
            }
        } catch (e: any) {
            alert(`Erro de conexão: ${e.message}.\n\nVerifique a implementação da Edge Function.`);
        } finally {
            handleSettingsChange('isTestingCron', false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                <FaRobot className="text-brand-secondary" /> Automação & Integrações
            </h2>

            <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
                <button onClick={() => setActiveTab('general')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'general' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Geral & Scans</button>
                <button onClick={() => setActiveTab('connections')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'connections' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Conexões</button>
                <button onClick={() => setActiveTab('agents')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'agents' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot /> Agentes</button>
                <button onClick={() => setActiveTab('webhooks')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'webhooks' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}><FaNetworkWired className="text-green-400" /> Webhooks</button>
                <button onClick={() => setActiveTab('cron')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'cron' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}><FaClock className="text-yellow-400" /> Cron Jobs</button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {activeTab === 'general' && <GeneralScansTab settings={settings} onSettingsChange={handleSettingsChange} onSave={handleSaveGeneral} instituicoes={appData.instituicoes} />}
                {activeTab === 'connections' && <ConnectionsTab settings={settings} onSettingsChange={handleSettingsChange} onSave={handleSaveConnections} />}
                {activeTab === 'agents' && <AgentsTab agentScript={agentScript} />}
                {activeTab === 'webhooks' && <WebhooksTab settings={{...settings, onCreateSimulatedTicket: handleCreateSimulatedTicket}} onSettingsChange={handleSettingsChange} onSimulate={handleSimulateWebhook} />}
                {activeTab === 'cron' && <CronJobsTab settings={{...settings, cronFunctionCode, cronSqlCode}} onSettingsChange={handleSettingsChange} onSave={handleSaveGeneral} onTest={handleTestCron} onCopy={(text, type) => handleSettingsChange('copiedCode', type)} />}
            </div>
        </div>
    );
};

export default AuxiliaryDataDashboard;
