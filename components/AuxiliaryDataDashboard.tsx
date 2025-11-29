import React, { useState, useEffect } from 'react';
import { ConfigItem, Brand, Equipment, EquipmentType, TicketCategoryItem, Ticket, Team, SecurityIncidentTypeItem, Collaborator, SoftwareLicense, BusinessService, BackupExecution, SecurityTrainingRecord, ResilienceTest, Supplier, Entidade, Instituicao, Vulnerability, TooltipConfig, defaultTooltipConfig, CustomRole, ModuleKey } from '../types';
import { PlusIcon, EditIcon, DeleteIcon } from './common/Icons';
import { FaCog, FaSave, FaTimes, FaTags, FaShapes, FaShieldAlt, FaTicketAlt, FaUsers, FaUserTag, FaList, FaServer, FaGraduationCap, FaLock, FaRobot, FaClock, FaImage, FaInfoCircle, FaMousePointer, FaUser, FaKey, FaPalette, FaKeyboard, FaBoxOpen, FaIdCard, FaLink, FaDatabase, FaCheckCircle, FaExclamationCircle, FaNetworkWired, FaPlay, FaSpinner, FaCopy, FaEnvelope, FaPaperPlane, FaReply } from 'react-icons/fa';
import * as dataService from '../services/dataService';
import { parseSecurityAlert } from '../services/geminiService';

// Import existing dashboards for complex views
import BrandDashboard from './BrandDashboard';
import EquipmentTypeDashboard from './EquipmentTypeDashboard';
import CategoryDashboard from './CategoryDashboard';
import SecurityIncidentTypeDashboard from './SecurityIncidentTypeDashboard';
import RoleManager from './RoleManager'; 

interface AuxiliaryDataDashboardProps {
    // Generic Config Data
    configTables: {
        tableName: string;
        label: string;
        data: ConfigItem[];
    }[];
    onRefresh: () => void;

    // Complex Data & Handlers
    brands: Brand[];
    equipment: Equipment[];
    equipmentTypes: EquipmentType[];
    ticketCategories: TicketCategoryItem[];
    tickets: Ticket[];
    teams: Team[];
    securityIncidentTypes: SecurityIncidentTypeItem[];

    // NEW PROPS for integrity checks
    collaborators: Collaborator[];
    softwareLicenses: SoftwareLicense[];
    businessServices: BusinessService[];
    backupExecutions: BackupExecution[];
    securityTrainings: SecurityTrainingRecord[];
    resilienceTests: ResilienceTest[];
    suppliers: Supplier[];
    entidades: Entidade[];
    instituicoes: Instituicao[];
    vulnerabilities: Vulnerability[];

    // Complex Handlers
    onEditBrand: (b: Brand) => void;
    onDeleteBrand: (id: string) => void;
    onCreateBrand: () => void;

    onEditType: (t: EquipmentType) => void;
    onDeleteType: (id: string) => void;
    onCreateType: () => void;

    onEditCategory: (c: TicketCategoryItem) => void;
    onDeleteCategory: (id: string) => void;
    onToggleCategoryStatus: (id: string) => void;
    onCreateCategory: () => void;

    onEditIncidentType: (t: SecurityIncidentTypeItem) => void;
    onDeleteIncidentType: (id: string) => void;
    onToggleIncidentTypeStatus: (id: string) => void;
    onCreateIncidentType: () => void;
    
    // Tooltip Config
    onSaveTooltipConfig?: (config: TooltipConfig) => void;
}

type ViewType = 'generic' | 'brands' | 'equipment_types' | 'ticket_categories' | 'incident_types' | 'automation' | 'rbac';

interface MenuItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    type: ViewType;
    targetTable?: string; 
    permissionKey: ModuleKey; // Granular key
}

// --- EDGE FUNCTION SCRIPTS (Atualizados para ler da DB) ---

const cronFunctionCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
    
    const recipients = recipientsStr ? recipientsStr.split(',').map(e => e.trim()) : []

    if (!resendKey) throw new Error("Resend API Key não configurada na tabela global_settings.")
    if (recipients.length === 0) return new Response(JSON.stringify({ message: "Sem destinatários configurados." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

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

    // 3. Send Email
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
    
    const result = await res.json()

    return new Response(JSON.stringify({ success: res.ok, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
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

const emailNotifyCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const { record } = await req.json()
    
    if (!record || !record.team_id) return new Response('No team assigned', { status: 200 })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Ler API Key da DB
    const { data: setting } = await supabase
      .from('global_settings')
      .select('setting_value')
      .eq('setting_key', 'resend_api_key')
      .single()
      
    const resendKey = setting?.setting_value
    if (!resendKey) return new Response('Resend API Key missing in DB', { status: 500 })

    // 2. Fetch Team Emails
    const { data: members } = await supabase
        .from('team_members')
        .select('collaborator_id, collaborators(email)')
        .eq('team_id', record.team_id)

    if (!members || members.length === 0) return new Response('No members found', { status: 200 })
    
    const emails = members.map((m:any) => m.collaborators?.email).filter(Boolean)

    // 3. Send Email
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${resendKey}\`
      },
      body: JSON.stringify({
        from: 'AIManager Support <support@resend.dev>',
        to: emails,
        subject: \`[Ticket: \${record.id.substring(0,8)}] \${record.title}\`,
        html: \`
            <h2>Novo Ticket Atribuído à Equipa</h2>
            <p><strong>Assunto:</strong> \${record.title}</p>
            <p><strong>Descrição:</strong> \${record.description}</p>
            <p>Responda a este email para adicionar comentários.</p>
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
    const payload = await req.json()
    const subject = payload.subject || ''
    const text = payload.text || ''
    const from = payload.from || ''

    const ticketIdMatch = subject.match(/Ticket: ([a-f0-9-]{8})/)
    if (!ticketIdMatch) return new Response('No Ticket ID found', { status: 200 })
    
    const shortId = ticketIdMatch[1]

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: ticket } = await supabase.from('tickets').select('id').ilike('id', \`\${shortId}%\`).single()
    if (!ticket) return new Response('Ticket not found', { status: 404 })

    const cleanEmail = from.match(/<(.+)>/)?.[1] || from
    const { data: tech } = await supabase.from('collaborators').select('id').eq('email', cleanEmail).single()

    await supabase.from('ticket_activities').insert({
        ticketId: ticket.id,
        description: \`[Email Reply]: \${text.substring(0, 1000)}\`,
        technicianId: tech?.id || null, 
        date: new Date().toISOString()
    })

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})`;

const AuxiliaryDataDashboard: React.FC<AuxiliaryDataDashboardProps> = ({ 
    configTables, onRefresh,
    brands, equipment, onEditBrand, onDeleteBrand, onCreateBrand,
    equipmentTypes, onEditType, onDeleteType, onCreateType,
    ticketCategories, tickets, teams, onEditCategory, onDeleteCategory, onToggleCategoryStatus, onCreateCategory,
    securityIncidentTypes, onEditIncidentType, onDeleteIncidentType, onToggleIncidentTypeStatus, onCreateIncidentType,
    collaborators, softwareLicenses, businessServices, backupExecutions, securityTrainings, resilienceTests, suppliers, entidades, instituicoes, vulnerabilities,
    onSaveTooltipConfig
}) => {
    const [selectedMenuId, setSelectedMenuId] = useState<string>('brands'); 
    
    // Generic Editor State
    const [newItemName, setNewItemName] = useState('');
    const [newItemColor, setNewItemColor] = useState('#3b82f6'); 
    const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
    const [error, setError] = useState('');

    // Automation & Branding State
    const [activeAutoTab, setActiveAutoTab] = useState<'general' | 'connections' | 'webhooks' | 'cron' | 'email'>('general');
    const [scanFrequency, setScanFrequency] = useState('0');
    const [scanStartTime, setScanStartTime] = useState('02:00');
    const [lastScanDate, setLastScanDate] = useState('-');
    const [logoUrl, setLogoUrl] = useState('');
    
    // Naming Convention State
    const [equipPrefix, setEquipPrefix] = useState('PC-');
    const [equipDigits, setEquipDigits] = useState('4');
    
    // New Scan Configs
    const [scanIncludeEol, setScanIncludeEol] = useState(true);
    const [scanLookbackYears, setScanLookbackYears] = useState(2);
    const [scanCustomPrompt, setScanCustomPrompt] = useState('');
    const [nistApiKey, setNistApiKey] = useState('');
    
    // Connections State (Supabase & Resend)
    const [sbUrl, setSbUrl] = useState('');
    const [sbKey, setSbKey] = useState('');
    const [sbServiceKey, setSbServiceKey] = useState('');
    const [resendApiKey, setResendApiKey] = useState('');
    
    // Reporting Config
    const [reportRecipients, setReportRecipients] = useState('');
    const [cronFunctionUrl, setCronFunctionUrl] = useState('');
    const [isTestingCron, setIsTestingCron] = useState(false);
    
    // Custom Roles State
    const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);

    // Webhook Simulator State
    const [webhookJson, setWebhookJson] = useState('{\n  "alert_name": "Malware Detected",\n  "severity": "Critical",\n  "hostname": "PC-FINANCE-01",\n  "description": "Ransomware detected in C:\\Users\\Admin"\n}');
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatedTicket, setSimulatedTicket] = useState<any>(null);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [copied, setCopied] = useState(false);

    // Define Menu Structure mapped to Permission Keys
    const menuStructure: { group: string, items: MenuItem[] }[] = [
        {
            group: "Inventário & Ativos",
            items: [
                { id: 'brands', label: 'Marcas (Fabricantes)', icon: <FaTags />, type: 'brands', permissionKey: 'brands' },
                { id: 'equipment_types', label: 'Tipos de Equipamento', icon: <FaShapes />, type: 'equipment_types', permissionKey: 'equipment_types' },
                { id: 'status', label: 'Estados de Equipamento', icon: <FaList />, type: 'generic', targetTable: 'config_equipment_statuses', permissionKey: 'config_equipment_statuses' },
                { id: 'software_categories', label: 'Categorias de Software', icon: <FaBoxOpen />, type: 'generic', targetTable: 'config_software_categories', permissionKey: 'config_software_categories' }, 
            ]
        },
        {
            group: "Suporte & Tickets",
            items: [
                { id: 'ticket_categories', label: 'Categorias de Tickets', icon: <FaTicketAlt />, type: 'ticket_categories', permissionKey: 'ticket_categories' },
                { id: 'incident_types', label: 'Tipos de Incidente', icon: <FaShieldAlt />, type: 'incident_types', permissionKey: 'security_incident_types' },
            ]
        },
        {
            group: "Pessoas & Contactos",
            items: [
                { id: 'contact_roles', label: 'Funções de Contacto', icon: <FaUserTag />, type: 'generic', targetTable: 'contact_roles', permissionKey: 'contact_roles' },
                { id: 'contact_titles', label: 'Tratos (Honoríficos)', icon: <FaUserTag />, type: 'generic', targetTable: 'contact_titles', permissionKey: 'contact_titles' },
                { id: 'rbac', label: 'Perfis de Acesso (RBAC)', icon: <FaIdCard />, type: 'rbac', permissionKey: 'config_custom_roles' },
            ]
        },
        {
            group: "Sistema & Compliance",
            items: [
                { id: 'automation', label: 'Automação & Integrações', icon: <FaRobot />, type: 'automation', permissionKey: 'config_automation' },
                { id: 'criticality', label: 'Níveis de Criticidade', icon: <FaShieldAlt />, type: 'generic', targetTable: 'config_criticality_levels', permissionKey: 'config_criticality_levels' },
                { id: 'cia_ratings', label: 'Classificação CIA', icon: <FaShieldAlt />, type: 'generic', targetTable: 'config_cia_ratings', permissionKey: 'config_cia_ratings' },
                { id: 'service_status', label: 'Estados de Serviço (BIA)', icon: <FaServer />, type: 'generic', targetTable: 'config_service_statuses', permissionKey: 'config_service_statuses' },
                { id: 'backup_types', label: 'Tipos de Backup', icon: <FaServer />, type: 'generic', targetTable: 'config_backup_types', permissionKey: 'config_backup_types' },
                { id: 'training_types', label: 'Tipos de Formação', icon: <FaGraduationCap />, type: 'generic', targetTable: 'config_training_types', permissionKey: 'config_training_types' },
                { id: 'resilience_types', label: 'Tipos de Teste Resiliência', icon: <FaShieldAlt />, type: 'generic', targetTable: 'config_resilience_test_types', permissionKey: 'config_resilience_test_types' },
            ]
        }
    ];

    // Load settings
    useEffect(() => {
        const loadSettings = async () => {
            if (selectedMenuId === 'automation') {
                // General Automation
                const freq = await dataService.getGlobalSetting('scan_frequency_days');
                const start = await dataService.getGlobalSetting('scan_start_time');
                const last = await dataService.getGlobalSetting('last_auto_scan');
                const logo = await dataService.getGlobalSetting('app_logo_url');
                
                const eol = await dataService.getGlobalSetting('scan_include_eol');
                const years = await dataService.getGlobalSetting('scan_lookback_years');
                const custom = await dataService.getGlobalSetting('scan_custom_prompt');
                
                const prefix = await dataService.getGlobalSetting('equipment_naming_prefix');
                const digits = await dataService.getGlobalSetting('equipment_naming_digits');
                
                const recipients = await dataService.getGlobalSetting('weekly_report_recipients');
                
                if (freq) setScanFrequency(freq);
                if (start) setScanStartTime(start);
                if (last) setLastScanDate(new Date(last).toLocaleString());
                if (logo) setLogoUrl(logo);
                
                if (eol) setScanIncludeEol(eol === 'true');
                if (years) setScanLookbackYears(parseInt(years));
                if (custom) setScanCustomPrompt(custom);
                
                if (prefix) setEquipPrefix(prefix);
                if (digits) setEquipDigits(digits);
                
                if (recipients) setReportRecipients(recipients);
                
                // Connections
                const nistKey = await dataService.getGlobalSetting('nist_api_key');
                const rKey = await dataService.getGlobalSetting('resend_api_key');
                
                if (nistKey) setNistApiKey(nistKey);
                if (rKey) setResendApiKey(rKey);

                setSbUrl(localStorage.getItem('SUPABASE_URL') || '');
                setSbKey(localStorage.getItem('SUPABASE_ANON_KEY') || '');
                setSbServiceKey(localStorage.getItem('SUPABASE_SERVICE_ROLE_KEY') || '');
                
                // Webhook
                const projectUrl = localStorage.getItem('SUPABASE_URL');
                if (projectUrl) {
                    setWebhookUrl(`${projectUrl}/functions/v1/siem-ingest`);
                    setCronFunctionUrl(`${projectUrl}/functions/v1/weekly-report`);
                }

            } else if (selectedMenuId === 'rbac') {
                const roles = await dataService.getCustomRoles();
                setCustomRoles(roles);
            }
        };
        loadSettings();
    }, [selectedMenuId]);

    const handleSaveAutomation = async () => {
         await dataService.updateGlobalSetting('scan_frequency_days', scanFrequency);
        await dataService.updateGlobalSetting('scan_start_time', scanStartTime);
        await dataService.updateGlobalSetting('app_logo_url', logoUrl);
        
        await dataService.updateGlobalSetting('scan_include_eol', String(scanIncludeEol));
        await dataService.updateGlobalSetting('scan_lookback_years', String(scanLookbackYears));
        await dataService.updateGlobalSetting('scan_custom_prompt', scanCustomPrompt);
        
        await dataService.updateGlobalSetting('equipment_naming_prefix', equipPrefix);
        await dataService.updateGlobalSetting('equipment_naming_digits', equipDigits);
        
        await dataService.updateGlobalSetting('weekly_report_recipients', reportRecipients);

        alert("Configuração geral guardada.");
    };
    
    const handleTestCron = async () => {
        if (!cronFunctionUrl) {
            alert("URL da função não definido. Verifique as conexões.");
            return;
        }
        setIsTestingCron(true);
        try {
            const response = await fetch(cronFunctionUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sbKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            
            const result = await response.json();
            if (response.ok) {
                alert(`Teste executado com sucesso!\nResultado: ${JSON.stringify(result)}`);
            } else {
                alert(`Erro ao executar teste: ${result.error || response.statusText}`);
            }
        } catch (e: any) {
            alert(`Erro de conexão: ${e.message}.\n\nVerifique se a Edge Function 'weekly-report' foi implementada (deployed) corretamente no Supabase e se os segredos (secrets) estão configurados. Consulte o Guia de Configuração.`);
        } finally {
            setIsTestingCron(false);
        }
    };
    
    const handleSaveConnections = async () => {
        await dataService.updateGlobalSetting('nist_api_key', nistApiKey);
        await dataService.updateGlobalSetting('resend_api_key', resendApiKey);
        
        if (sbUrl && sbKey) {
            localStorage.setItem('SUPABASE_URL', sbUrl);
            localStorage.setItem('SUPABASE_ANON_KEY', sbKey);
        }
        if (sbServiceKey) {
            localStorage.setItem('SUPABASE_SERVICE_ROLE_KEY', sbServiceKey);
        }

        if (confirm("Credenciais guardadas com sucesso. A página será recarregada para aplicar a nova ligação à base de dados.")) {
            window.location.reload();
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const handleSimulateWebhook = async () => {
        setIsSimulating(true);
        setSimulatedTicket(null);
        try {
            const result = await parseSecurityAlert(webhookJson);
            
            setSimulatedTicket({
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
            setIsSimulating(false);
        }
    };
    
    const handleCreateSimulatedTicket = async () => {
        if (!simulatedTicket) return;
        if (confirm("Deseja criar este ticket real na base de dados?")) {
            try {
                await dataService.addTicket({
                    title: simulatedTicket.title,
                    description: simulatedTicket.description,
                    category: simulatedTicket.category,
                    securityIncidentType: simulatedTicket.type,
                    impactCriticality: simulatedTicket.severity,
                    status: 'Pedido',
                    requestDate: new Date().toISOString(),
                    entidadeId: entidades[0]?.id || '', 
                    collaboratorId: collaborators[0]?.id || '' 
                });
                alert("Ticket criado com sucesso!");
                setSimulatedTicket(null);
            } catch (e) {
                alert("Erro ao criar ticket.");
            }
        }
    };

    const getCurrentSelection = () => {
        for (const group of menuStructure) {
            const found = group.items.find(i => i.id === selectedMenuId);
            if (found) return found;
        }
        return menuStructure[0].items[0];
    };

    const currentSelection = getCurrentSelection();
    const currentTableConfig = currentSelection.targetTable ? configTables.find(t => t.tableName === currentSelection.targetTable) : null;
    
    const showColorPicker = currentSelection.targetTable === 'config_equipment_statuses';

    const checkUsage = (tableName: string, item: ConfigItem): boolean => {
        const name = item.name;
        switch (tableName) {
            case 'config_equipment_statuses':
                return equipment.some(e => e.status === name);
            case 'config_software_categories':
                return softwareLicenses.some(l => l.category_id === item.id);
            case 'config_criticality_levels':
                return equipment.some(e => e.criticality === name) || 
                       softwareLicenses.some(l => l.criticality === name) ||
                       businessServices.some(s => s.criticality === name) ||
                       vulnerabilities.some(v => v.severity === name);
            case 'config_cia_ratings':
                return equipment.some(e => e.confidentiality === name || e.integrity === name || e.availability === name) ||
                       softwareLicenses.some(l => l.confidentiality === name || l.integrity === name || l.availability === name);
            case 'config_service_statuses':
                return businessServices.some(s => s.status === name);
            case 'config_backup_types':
                return backupExecutions.some(b => b.type === name);
            case 'config_training_types':
                return securityTrainings.some(t => t.training_type === name);
            case 'config_resilience_test_types':
                return resilienceTests.some(t => t.test_type === name);
            case 'contact_titles': {
                if (collaborators.some(c => c.title === name)) return true;
                const allContacts = [
                    ...suppliers.flatMap(s => s.contacts || []),
                    ...entidades.flatMap(e => e.contacts || []),
                    ...instituicoes.flatMap(i => i.contacts || [])
                ];
                return allContacts.some(c => c.title === name);
            }
            case 'contact_roles': {
                const allContacts = [
                    ...suppliers.flatMap(s => s.contacts || []),
                    ...entidades.flatMap(e => e.contacts || []),
                    ...instituicoes.flatMap(i => i.contacts || [])
                ];
                return allContacts.some(c => c.role === name);
            }
            default:
                return false;
        }
    };

    const handleGenericAdd = async () => {
        if (currentSelection.type !== 'generic' || !currentTableConfig) return;
        
        if (!newItemName.trim()) {
            setError('O nome é obrigatório.');
            return;
        }
        try {
            const payload: any = { name: newItemName.trim() };
            if (showColorPicker) payload.color = newItemColor;

            await dataService.addConfigItem(currentTableConfig.tableName, payload);
            setNewItemName('');
            setNewItemColor('#3b82f6'); // Reset to default blue
            setError('');
            onRefresh();
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Erro ao adicionar item. Verifique se a tabela existe na base de dados.');
        }
    };

    const handleGenericUpdate = async () => {
        if (currentSelection.type !== 'generic' || !currentTableConfig) return;

        if (!editingItem || !editingItem.name.trim()) return;
        try {
            const payload: any = { name: editingItem.name.trim() };
            if (showColorPicker && editingItem.color) payload.color = editingItem.color;

            await dataService.updateConfigItem(currentTableConfig.tableName, editingItem.id, payload);
            setEditingItem(null);
            setError('');
            onRefresh();
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Erro ao atualizar item.');
        }
    };

    const handleGenericDelete = async (id: string) => {
        if (currentSelection.type !== 'generic' || !currentTableConfig) return;

        if (!confirm("Tem a certeza que deseja excluir este item?")) return;
        try {
            await dataService.deleteConfigItem(currentTableConfig.tableName, id);
            onRefresh();
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Erro ao excluir item.');
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
            {/* Sidebar Menu */}
            <div className="w-full lg:w-64 bg-surface-dark rounded-lg shadow-xl border border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
                <div className="p-4 border-b border-gray-700 bg-gray-900">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FaCog className="text-brand-secondary" />
                        Configurações
                    </h2>
                </div>
                <div className="overflow-y-auto flex-grow p-2 space-y-4 custom-scrollbar">
                    {menuStructure.map((group, gIdx) => (
                        <div key={gIdx}>
                            <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group.group}</h3>
                            <div className="space-y-1">
                                {group.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => { setSelectedMenuId(item.id); setError(''); setNewItemName(''); setEditingItem(null); }}
                                        className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md flex items-center gap-3 transition-colors ${
                                            selectedMenuId === item.id
                                            ? 'bg-brand-primary text-white shadow-md'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-surface-dark rounded-lg shadow-xl border border-gray-700 overflow-hidden flex flex-col" key={selectedMenuId}>
                
                {/* Generic Table Editor */}
                {currentSelection.type === 'generic' && currentTableConfig && (
                    <div className="p-6 h-full flex flex-col">
                         <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                            Gerir: {currentSelection.label}
                        </h2>
                        
                        <div className="mb-4 flex gap-2 items-center">
                            <input
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder={`Novo item...`}
                                className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenericAdd()}
                                autoFocus
                            />
                            {showColorPicker && (
                                <div className="flex items-center gap-2 bg-gray-800 p-1.5 rounded border border-gray-600">
                                    <label htmlFor="newColor" className="text-xs text-gray-400"><FaPalette /></label>
                                    <input 
                                        type="color" 
                                        id="newColor"
                                        value={newItemColor} 
                                        onChange={(e) => setNewItemColor(e.target.value)}
                                        className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer"
                                        title="Cor do Estado"
                                    />
                                </div>
                            )}
                            <button onClick={handleGenericAdd} className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary flex items-center gap-2">
                                <PlusIcon className="h-4 w-4" /> Adicionar
                            </button>
                        </div>

                        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm mb-4 border border-red-500/50">{error}</div>}

                        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex-grow overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-900 text-gray-400 uppercase text-xs sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Nome</th>
                                        {showColorPicker && <th className="px-4 py-3 text-center">Cor</th>}
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {currentTableConfig.data.length > 0 ? (
                                        currentTableConfig.data.sort((a,b) => a.name.localeCompare(b.name)).map(item => {
                                            const isUsed = checkUsage(currentTableConfig.tableName, item);
                                            
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-700/50">
                                                    <td className="px-4 py-3">
                                                        {editingItem?.id === item.id ? (
                                                            <input
                                                                type="text"
                                                                value={editingItem.name}
                                                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                                className="w-full bg-gray-600 border border-gray-500 text-white rounded p-1"
                                                                autoFocus
                                                                onKeyDown={(e) => e.key === 'Enter' && handleGenericUpdate()}
                                                            />
                                                        ) : (
                                                            <span className="text-white font-medium">{item.name}</span>
                                                        )}
                                                    </td>
                                                    {showColorPicker && (
                                                        <td className="px-4 py-3 text-center">
                                                            {editingItem?.id === item.id ? (
                                                                <input 
                                                                    type="color" 
                                                                    value={editingItem.color || '#3b82f6'} 
                                                                    onChange={(e) => setEditingItem({...editingItem, color: e.target.value})}
                                                                    className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer"
                                                                />
                                                            ) : (
                                                                <span 
                                                                    className="inline-block w-4 h-4 rounded-full border border-gray-500" 
                                                                    style={{ backgroundColor: item.color || 'transparent' }}
                                                                    title={item.color}
                                                                ></span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-right">
                                                        {editingItem?.id === item.id ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={handleGenericUpdate} className="text-green-400 hover:text-green-300"><FaSave /></button>
                                                                <button onClick={() => setEditingItem(null)} className="text-red-400 hover:text-red-300"><FaTimes /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => setEditingItem(item)} className="text-blue-400 hover:text-blue-300"><EditIcon /></button>
                                                                <button 
                                                                    onClick={() => handleGenericDelete(item.id)} 
                                                                    className={isUsed ? "text-gray-600 cursor-not-allowed" : "text-red-400 hover:text-red-300"}
                                                                    disabled={isUsed}
                                                                    title={isUsed ? "Este item está a ser utilizado e não pode ser apagado." : "Excluir"}
                                                                >
                                                                    {isUsed ? <FaLock className="h-3 w-3"/> : <DeleteIcon />}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={showColorPicker ? 3 : 2} className="p-4 text-center text-gray-500 italic">Nenhum item registado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Complex Views */}
                {currentSelection.type === 'brands' && (
                    <div className="h-full overflow-y-auto">
                        <BrandDashboard brands={brands} equipment={equipment} onCreate={onCreateBrand} onEdit={onEditBrand} onDelete={onDeleteBrand} />
                    </div>
                )}
                {currentSelection.type === 'equipment_types' && (
                    <div className="h-full overflow-y-auto">
                        <EquipmentTypeDashboard equipmentTypes={equipmentTypes} equipment={equipment} onCreate={onCreateType} onEdit={onEditType} onDelete={onDeleteType} />
                    </div>
                )}
                {currentSelection.type === 'ticket_categories' && (
                    <div className="h-full overflow-y-auto">
                        <CategoryDashboard categories={ticketCategories} tickets={tickets} teams={teams} onCreate={onCreateCategory} onEdit={onEditCategory} onDelete={onDeleteCategory} onToggleStatus={onToggleCategoryStatus} />
                    </div>
                )}
                {currentSelection.type === 'incident_types' && (
                    <div className="h-full overflow-y-auto">
                        <SecurityIncidentTypeDashboard incidentTypes={securityIncidentTypes} tickets={tickets} onCreate={onCreateIncidentType} onEdit={onEditIncidentType} onDelete={onDeleteIncidentType} onToggleStatus={onToggleIncidentTypeStatus} />
                    </div>
                )}
                
                {/* Automation View */}
                {currentSelection.type === 'automation' && (
                    <div className="p-6 h-full overflow-y-auto">
                        <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                            <FaCog className="text-brand-secondary" /> Automação & Integrações
                        </h2>

                        {/* Tab Navigation */}
                        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
                            <button 
                                onClick={() => setActiveAutoTab('general')} 
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeAutoTab === 'general' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                            >
                                Geral & Scans
                            </button>
                            <button 
                                onClick={() => setActiveAutoTab('connections')} 
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeAutoTab === 'connections' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                            >
                                Conexões & Credenciais
                            </button>
                             <button 
                                onClick={() => setActiveAutoTab('webhooks')} 
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeAutoTab === 'webhooks' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                            >
                                <FaNetworkWired className="text-green-400" /> Integração RMM/SIEM
                            </button>
                            <button 
                                onClick={() => setActiveAutoTab('cron')} 
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeAutoTab === 'cron' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                            >
                                <FaClock className="text-yellow-400" /> Cron Jobs
                            </button>
                             <button 
                                onClick={() => setActiveAutoTab('email')} 
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeAutoTab === 'email' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                            >
                                <FaEnvelope className="text-blue-400" /> Email Automations
                            </button>
                        </div>

                        {activeAutoTab === 'general' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Branding Section */}
                                <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaImage className="text-blue-400"/> Personalização (Branding)</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Defina o logotipo da sua organização para aparecer nos cabeçalhos dos relatórios impressos.
                                    </p>
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase mb-1">URL do Logotipo</label>
                                        <input 
                                            type="text" 
                                            value={logoUrl}
                                            onChange={(e) => setLogoUrl(e.target.value)}
                                            placeholder="https://exemplo.com/logo.png"
                                            className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm w-full"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">O URL deve ser acessível publicamente ou na rede local.</p>
                                    </div>
                                </div>
                                
                                {/* Network Naming Convention */}
                                <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaKeyboard className="text-green-400"/> Nomenclatura de Rede</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Defina o formato automático para o campo "Nome na Rede". O sistema sugerirá o próximo número disponível.
                                    </p>
                                    <div className="flex gap-4 items-end">
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase mb-1">Prefixo</label>
                                            <input 
                                                type="text" 
                                                value={equipPrefix}
                                                onChange={(e) => setEquipPrefix(e.target.value)}
                                                placeholder="Ex: ADM"
                                                className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm w-32"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase mb-1">Dígitos</label>
                                            <input 
                                                type="number" 
                                                value={equipDigits}
                                                onChange={(e) => setEquipDigits(e.target.value)}
                                                min="1"
                                                max="10"
                                                className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm w-20"
                                            />
                                        </div>
                                        <div className="mb-2 text-sm text-gray-300">
                                            Exemplo Gerado: <strong>{equipPrefix}{'0'.repeat(Math.max(0, parseInt(equipDigits) - 1))}1</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Automation Section */}
                                <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaRobot className="text-purple-400"/> Auto Scan de Vulnerabilidades (IA)</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Configuração do analisador de segurança automatizado que verifica o inventário em busca de CVEs.
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase mb-1">Frequência</label>
                                            <select 
                                                value={scanFrequency}
                                                onChange={(e) => setScanFrequency(e.target.value)}
                                                className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm w-48"
                                            >
                                                <option value="0">Desativado</option>
                                                <option value="1">Diário (24h)</option>
                                                <option value="7">Semanal</option>
                                                <option value="30">Mensal</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase mb-1">Hora de Início</label>
                                            <input 
                                                type="time" 
                                                value={scanStartTime}
                                                onChange={(e) => setScanStartTime(e.target.value)}
                                                className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm w-32"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase mb-1">Janela de Tempo (Anos)</label>
                                            <input 
                                                type="number" 
                                                value={scanLookbackYears}
                                                onChange={(e) => setScanLookbackYears(parseInt(e.target.value))}
                                                className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm w-32"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase mb-1">Última Execução</label>
                                            <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-800 p-2 rounded border border-gray-700 min-w-[150px]">
                                                <FaClock /> {lastScanDate}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={scanIncludeEol} 
                                                onChange={(e) => setScanIncludeEol(e.target.checked)} 
                                                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary" 
                                            />
                                            <span className="ml-2 text-sm text-white font-bold">Incluir Software EOL (End-of-Life)</span>
                                        </label>
                                        <p className="text-xs text-gray-500 ml-6 mt-1">
                                            Força a procura de vulnerabilidades críticas em sistemas antigos (ex: Win 7, Server 2008), ignorando a janela de tempo.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase mb-1">Instruções Personalizadas (Prompt)</label>
                                        <textarea 
                                            value={scanCustomPrompt}
                                            onChange={(e) => setScanCustomPrompt(e.target.value)}
                                            rows={3}
                                            className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm w-full"
                                            placeholder="Ex: Ignorar vulnerabilidades relacionadas com impressoras. Focar apenas em RCE."
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <button onClick={handleSaveAutomation} className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-secondary transition-colors flex items-center gap-2">
                                        <FaSave /> Guardar Configuração
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeAutoTab === 'connections' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200 mb-4">
                                    <p className="flex items-center gap-2 font-bold mb-2"><FaInfoCircle/> Dados Necessários para o Funcionamento</p>
                                    <p>Aqui pode consultar e atualizar as chaves de API e ligações do sistema. <strong>Atenção:</strong> Alterar as credenciais do Supabase irá recarregar a aplicação.</p>
                                </div>

                                <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg space-y-4">
                                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaDatabase className="text-green-400"/> Base de Dados (Supabase)</h3>
                                    
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase mb-1">URL do Projeto</label>
                                        <div className="relative">
                                            <FaLink className="absolute top-3 left-3 text-gray-500" />
                                            <input 
                                                type="text" 
                                                value={sbUrl}
                                                onChange={(e) => setSbUrl(e.target.value)}
                                                className="bg-gray-800 border border-gray-600 text-white rounded-md pl-9 p-2 text-sm w-full font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase mb-1">Chave Pública (Anon Key)</label>
                                        <div className="relative">
                                            <FaKey className="absolute top-3 left-3 text-gray-500" />
                                            <input 
                                                type="password" 
                                                value={sbKey}
                                                onChange={(e) => setSbKey(e.target.value)}
                                                className="bg-gray-800 border border-gray-600 text-white rounded-md pl-9 p-2 text-sm w-full font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-red-400 font-bold uppercase mb-1 flex items-center gap-1"><FaLock/> Service Role Key (Admin)</label>
                                        <div className="relative">
                                            <FaKey className="absolute top-3 left-3 text-red-500" />
                                            <input 
                                                type="password" 
                                                value={sbServiceKey}
                                                onChange={(e) => setSbServiceKey(e.target.value)}
                                                className="bg-gray-800 border border-red-500/50 text-white rounded-md pl-9 p-2 text-sm w-full font-mono placeholder-gray-500"
                                                placeholder="Necessária para criar utilizadores com login"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            <strong>Obrigatória</strong> para criar novos utilizadores com acesso à plataforma (envio de email). Guardada apenas localmente.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg space-y-4">
                                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaEnvelope className="text-orange-400"/> Email e Comunicações (Resend)</h3>
                                    
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase mb-1">Resend API Key</label>
                                        <div className="relative">
                                            <FaKey className="absolute top-3 left-3 text-gray-500" />
                                            <input 
                                                type="password" 
                                                value={resendApiKey}
                                                onChange={(e) => setResendApiKey(e.target.value)}
                                                className="bg-gray-800 border border-gray-600 text-white rounded-md pl-9 p-2 text-sm w-full font-mono"
                                                placeholder="re_123456789..."
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Necessária para enviar emails automáticos (Tickets, Relatórios). Será guardada na tabela <code>global_settings</code>.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg space-y-4">
                                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaShieldAlt className="text-red-400"/> Segurança Externa (NIST)</h3>
                                    
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase mb-1">NIST API Key (Opcional)</label>
                                        <div className="relative">
                                            <FaKey className="absolute top-3 left-3 text-gray-500" />
                                            <input 
                                                type="password" 
                                                value={nistApiKey}
                                                onChange={(e) => setNistApiKey(e.target.value)}
                                                className="bg-gray-800 border border-gray-600 text-white rounded-md pl-9 p-2 text-sm w-full font-mono"
                                                placeholder="Chave para consulta oficial de CVEs"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Se configurada, o sistema consulta a base de dados oficial do governo americano (NVD). Se vazia, usa apenas a IA.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg space-y-4">
                                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaRobot className="text-purple-400"/> Inteligência Artificial (Google Gemini)</h3>
                                    
                                    <div className="flex items-center gap-2 p-3 bg-gray-800 rounded border border-gray-600">
                                        {process.env.API_KEY ? (
                                            <>
                                                <FaCheckCircle className="text-green-400 text-xl" />
                                                <div>
                                                    <p className="text-sm font-bold text-white">Chave API Configurada</p>
                                                    <p className="text-xs text-gray-400">Detetada via Variável de Ambiente (Seguro).</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <FaExclamationCircle className="text-red-400 text-xl" />
                                                <div>
                                                    <p className="text-sm font-bold text-white">Chave API Não Detetada</p>
                                                    <p className="text-xs text-gray-400">A IA não funcionará. Configure a variável <code>API_KEY</code> no build.</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <button onClick={handleSaveConnections} className="bg-brand-primary text-white px-6 py-2 rounded hover:bg-brand-secondary transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
                                        <FaSave /> Atualizar Conexões
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {activeAutoTab === 'webhooks' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-purple-900/20 border border-purple-900/50 p-4 rounded-lg text-sm text-purple-200 mb-4">
                                    <p className="flex items-center gap-2 font-bold mb-2"><FaNetworkWired/> Integração com Managed Services (RMM/EDR)</p>
                                    <p>Configure a sua ferramenta de monitorização (SentinelOne, Datto, CrowdStrike, Wazuh) para enviar alertas via Webhook. A IA analisará o JSON e criará o ticket automaticamente.</p>
                                </div>

                                <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg space-y-4">
                                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaLink className="text-blue-400"/> Endpoint para Configuração</h3>
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase mb-1">Webhook URL (Endpoint)</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={webhookUrl} 
                                                readOnly 
                                                className="bg-black border border-gray-700 text-green-400 rounded-md p-2 text-xs font-mono w-full select-all"
                                                placeholder="URL da Edge Function (necessário deploy)"
                                            />
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(webhookUrl); }}
                                                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                                                title="Copiar"
                                            >
                                                <FaCopy />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Copie este URL e configure como "Alert Action" no seu sistema RMM/EDR. Método: POST.</p>
                                    </div>
                                </div>

                                <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg space-y-4">
                                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaRobot className="text-purple-400"/> Simulador de Ingestão IA</h3>
                                    <p className="text-sm text-gray-400">Teste como a IA interpreta os logs brutos do seu sistema antes de configurar a integração real.</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase mb-1">Input: Raw JSON (Log)</label>
                                            <textarea 
                                                value={webhookJson} 
                                                onChange={(e) => setWebhookJson(e.target.value)}
                                                rows={10}
                                                className="w-full bg-black border border-gray-700 text-gray-300 rounded-md p-3 font-mono text-xs"
                                                placeholder='Cole aqui o JSON de exemplo do seu EDR...'
                                            ></textarea>
                                            <div className="mt-2 flex justify-end">
                                                <button 
                                                    onClick={handleSimulateWebhook} 
                                                    disabled={isSimulating}
                                                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isSimulating ? <FaSpinner className="animate-spin"/> : <FaPlay />} Testar IA
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                            <label className="block text-xs text-gray-500 uppercase mb-2">Output: Ticket Gerado</label>
                                            {simulatedTicket ? (
                                                <div className="space-y-3 text-sm animate-fade-in">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Título:</span>
                                                        <span className="font-bold text-white">{simulatedTicket.title}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400 block mb-1">Descrição:</span>
                                                        <p className="bg-gray-900 p-2 rounded text-gray-300 text-xs whitespace-pre-wrap border border-gray-700">{simulatedTicket.description}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <span className="text-gray-400 text-xs">Severidade:</span>
                                                            <span className={`block font-bold ${simulatedTicket.severity === 'Crítica' ? 'text-red-500' : 'text-yellow-500'}`}>{simulatedTicket.severity}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400 text-xs">Tipo:</span>
                                                            <span className="block text-white">{simulatedTicket.type}</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={handleCreateSimulatedTicket}
                                                        className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white py-2 rounded flex items-center justify-center gap-2"
                                                    >
                                                        <FaCheckCircle /> Criar Ticket Real
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs italic">
                                                    <FaRobot className="text-4xl mb-2 opacity-20" />
                                                    <p>A aguardar input para análise...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeAutoTab === 'cron' && (
                             <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-2 custom-scrollbar animate-fade-in">
                                 <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaClock className="text-yellow-400"/> Guia de Configuração: Relatórios Automáticos</h3>
                                    <div className="text-sm text-gray-300 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-gray-700 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">1</div>
                                            <div>
                                                <strong className="text-white">Crie a Edge Function</strong>
                                                <p className="text-xs text-gray-400">Vá à aba "Config BD" &rarr; "Automação" e copie o código da função <code>weekly-report</code>. Use a CLI do Supabase para criar e colar este código na sua função.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="bg-gray-700 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">2</div>
                                            <div>
                                                <strong className="text-white">Configure as Chaves (Secrets)</strong>
                                                <p className="text-xs text-gray-400">A função precisa de acesso à sua <strong>Resend API Key</strong>. Certifique-se que a preencheu na aba "Conexões". Depois, execute os comandos <code>supabase secrets set</code> para a função no seu terminal, conforme indicado no guia "Config BD".</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="bg-gray-700 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">3</div>
                                            <div>
                                                <strong className="text-white">Agende o Cron Job</strong>
                                                <p className="text-xs text-gray-400">Copie o código SQL da aba "Config BD" &rarr; "Automação" e execute-o no seu Editor SQL do Supabase para agendar a tarefa.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* New Config Section for Recipients & Testing */}
                                    <div className="bg-gray-900/50 p-4 rounded border border-gray-700 relative">
                                        <h4 className="text-white font-bold mb-4 text-sm flex items-center gap-2"><FaCog className="text-gray-400"/> Configuração & Teste</h4>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 uppercase mb-1">Emails Destinatários do Relatório (separados por vírgula)</label>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={reportRecipients} 
                                                        onChange={(e) => setReportRecipients(e.target.value)}
                                                        className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm"
                                                        placeholder="admin@empresa.com, gestor@empresa.com"
                                                    />
                                                    <button onClick={handleSaveAutomation} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
                                                        <FaSave /> Guardar
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="border-t border-gray-700 pt-3">
                                                 <label className="block text-xs text-gray-500 uppercase mb-1">URL da Função (Para Teste)</label>
                                                 <div className="flex gap-2 items-center">
                                                    <input 
                                                        type="text" 
                                                        value={cronFunctionUrl} 
                                                        onChange={(e) => setCronFunctionUrl(e.target.value)}
                                                        className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm font-mono"
                                                        placeholder="https://[PROJECT].supabase.co/functions/v1/weekly-report"
                                                    />
                                                    <button 
                                                        onClick={handleTestCron} 
                                                        disabled={isTestingCron || !cronFunctionUrl}
                                                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm flex items-center gap-2 disabled:opacity-50"
                                                    >
                                                        {isTestingCron ? <FaSpinner className="animate-spin"/> : <FaPlay />} Testar Envio Agora
                                                    </button>
                                                 </div>
                                                 <p className="text-xs text-gray-500 mt-1">Este botão executa a função imediatamente, enviando o relatório para os emails configurados.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeAutoTab === 'email' && (
                             <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-2 custom-scrollbar animate-fade-in">
                                <div className="bg-orange-900/20 border border-orange-500/50 p-4 rounded-lg text-sm text-orange-200">
                                    <div className="flex items-center gap-2 font-bold mb-2">
                                        <FaEnvelope /> Email & Tickets (Inbound/Outbound)
                                    </div>
                                    <p>
                                        Automatize o envio de notificações de novos tickets e permita que a equipa responda diretamente por email para atualizar o ticket (usando Resend).
                                        <br/>
                                        <strong>Requisito:</strong> Chave API do Resend configurada na aba "Conexões".
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Outbound Notification */}
                                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                                        <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaPaperPlane className="text-blue-400"/> 1. Notificação de Novo Ticket (Outbound)</h4>
                                        <p className="text-xs text-gray-400 mb-2">
                                            Crie uma função <code>ticket-notify</code>. No Dashboard Supabase, crie um <strong>Database Webhook</strong> na tabela <code>tickets</code> (INSERT) que chame esta função.
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
                                        <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaReply className="text-green-400"/> 2. Processar Respostas (Inbound)</h4>
                                        <p className="text-xs text-gray-400 mb-2">
                                            Crie uma função <code>email-processor</code>. Configure o seu serviço de email (Resend) para reencaminhar emails recebidos (Inbound Webhook) para a URL desta função.
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
                )}
                
                {/* RBAC Role Manager */}
                {currentSelection.type === 'rbac' && (
                    <div className="h-full overflow-hidden">
                        <RoleManager 
                            roles={customRoles} 
                            onRefresh={() => {
                                dataService.getCustomRoles().then(setCustomRoles);
                            }} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuxiliaryDataDashboard;