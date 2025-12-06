
// Dynamic Configuration Types
export interface ConfigItem {
    id: string;
    name: string;
    color?: string; // New: Hex Color code for Statuses
}

export type SoftwareCategory = ConfigItem; // Reuse ConfigItem as it fits (id, name)

export interface SoftwareProduct {
    id: string;
    name: string;
    category_id: string;
}

export interface TooltipConfig {
    // Equipment Tooltips
    showNomeNaRede: boolean;
    showAssignedTo: boolean;
    showOsVersion: boolean;
    showLastPatch: boolean;
    showSerialNumber: boolean;
    showBrand: boolean;
    showIpAddress: boolean; // Future use
    showWarranty: boolean;
    showLocation: boolean; // New: Physical Location
    showFirmwareVersion: boolean;
    
    // Collaborator Tooltips
    showCollabName: boolean;
    showCollabJob: boolean;
    showCollabContact: boolean;
    showCollabEntity: boolean;
}

export const defaultTooltipConfig: TooltipConfig = {
    // Equipment Defaults
    showNomeNaRede: true,
    showAssignedTo: true,
    showOsVersion: true,
    showLastPatch: true,
    showSerialNumber: false,
    showBrand: false,
    showIpAddress: false,
    showWarranty: false,
    showLocation: false,
    showFirmwareVersion: false,

    // Collaborator Defaults
    showCollabName: true,
    showCollabJob: true,
    showCollabContact: true,
    showCollabEntity: true
};

export interface UserPreferences {
    tooltipConfig?: TooltipConfig;
    theme?: 'dark' | 'light'; // Future use
}

export interface VulnerabilityScanConfig {
    includeEol: boolean; // Include End-of-Life software (Win7, etc)
    lookbackYears: number; // How far back to look for CVEs (default 2)
    customInstructions?: string; // Extra context for the AI
}

// Converted Enums to Const Objects for backward compatibility in code logic
// but types are now strings to allow dynamic DB values.

export const EquipmentStatus = {
  Stock: 'Stock',
  Operational: 'Operacional',
  Decommissioned: 'Abate',
  Warranty: 'Garantia',
  Loan: 'Empréstimo', // New Status
} as const;
export type EquipmentStatus = string;

export const CriticalityLevel = {
    Low: 'Baixa',
    Medium: 'Média',
    High: 'Alta',
    Critical: 'Crítica',
} as const;
export type CriticalityLevel = string;

export const CIARating = {
    Low: 'Baixo',
    Medium: 'Médio',
    High: 'Alto',
} as const;
export type CIARating = string;

export interface Brand {
  id: string;
  name: string;
  // Supply Chain Security Fields
  risk_level?: CriticalityLevel;
  is_iso27001_certified?: boolean;
  security_contact_email?: string;
}

// --- Supplier / Vendor Risk Management (NIS2 / DORA) ---

export interface SupplierContract {
    id: string; // UUID or temp ID
    ref_number: string; // Contract Reference
    description: string; // e.g. "SLA Gold Hosting"
    start_date: string;
    end_date: string;
    notice_period_days: number; // Exit clause notice
    exit_strategy: string; // DORA Art. 28 (Mandatory for critical functions)
    supported_service_ids: string[]; // Link to BusinessService IDs
    is_active: boolean;
}

// Generic Contact used for Suppliers, Entities, Institutions
export interface ResourceContact {
    id: string;
    resource_type: 'supplier' | 'entidade' | 'instituicao';
    resource_id: string;
    title?: string; // e.g. "Eng.", "Dr."
    name: string;
    role: string; // Managed via ContactRole
    email: string;
    phone?: string;
    is_active?: boolean; // New field
}

// Alias for backward compatibility during migration, though we prefer ResourceContact
export interface SupplierContact extends ResourceContact {}

export interface ContactRole {
    id: string;
    name: string;
}

export interface ContactTitle {
    id: string;
    name: string; // e.g. "Eng.", "Dr.", "Sr."
}

export interface Supplier {
    id: string;
    name: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    nif?: string;
    website?: string;
    notes?: string;
    address?: string; // Legacy/Full formatted string
    // Structured Address Fields
    address_line?: string;
    postal_code?: string;
    city?: string;
    locality?: string;
    
    attachments?: { name: string; dataUrl: string }[]; 
    // Security Fields
    is_iso27001_certified: boolean;
    iso_certificate_expiry?: string; 
    security_contact_email?: string;
    risk_level: CriticalityLevel; // Vendor Risk Rating
    
    // New: Extra certificates
    other_certifications?: { name: string; expiryDate?: string }[];
    
    // DORA: Contract Information
    contracts?: SupplierContract[];
    
    // New: Multiple Contacts
    contacts?: ResourceContact[];
    
    is_active?: boolean; // Status Toggle
}

export interface EquipmentType {
  id: string;
  name: string;
  requiresNomeNaRede?: boolean;
  requiresMacWIFI?: boolean;
  requiresMacCabo?: boolean;
  requiresInventoryNumber?: boolean;
  default_team_id?: string;
  requiresBackupTest?: boolean; // New field for Backup linkage
  requiresLocation?: boolean; // New field for Physical Location
  is_maintenance?: boolean; // NEW: Flag for Maintenance/Component types
  requires_wwan_address?: boolean;
  requires_bluetooth_address?: boolean;
  requires_usb_thunderbolt_address?: boolean;
  requires_ram_size?: boolean;
  requires_disk_info?: boolean;
  requires_cpu_info?: boolean;
  requires_manufacture_date?: boolean; // NEW: Data de Fabrico
}

export interface Equipment {
  id:string;
  brandId: string;
  typeId: string;
  description: string;
  serialNumber: string;
  inventoryNumber?: string;
  invoiceNumber?: string;
  requisitionNumber?: string;
  nomeNaRede?: string;
  macAddressWIFI?: string;
  macAddressCabo?: string;
  installationLocation?: string; 
  purchaseDate: string;
  warrantyEndDate?: string;
  creationDate: string;
  modifiedDate: string;
  status: EquipmentStatus;
  isLoan?: boolean; // New Field: Equipamento de Empréstimo
  // NIS2 Compliance Fields
  criticality?: CriticalityLevel;
  confidentiality?: CIARating;
  integrity?: CIARating;
  availability?: CIARating;
  // Security & Patching
  os_version?: string;
  last_security_update?: string;
  firmware_version?: string;
  encryption_status?: 'N/A' | 'Ativa (BitLocker)' | 'Ativa (FileVault)' | 'Ativa (LUKS)' | 'Inativa' | 'Desconhecido';
  wwan_address?: string;
  bluetooth_address?: string;
  usb_thunderbolt_address?: string;
  // New Automation Fields
  ip_address?: string;
  ram_size?: string;
  cpu_info?: string;
  disk_info?: string;
  monitor_info?: string;
  manufacture_date?: string; // NEW: Data de Fabrico
  last_inventory_scan?: string; // NEW: Date when the agent ran
  // Vendor Link
  supplier_id?: string;
  
  // FinOps Fields
  acquisitionCost?: number; // Cost in EUR
  expectedLifespanYears?: number; // e.g. 4 years
  
  // Legal / Accounting Fields (Linked to Config Tables)
  accounting_category_id?: string; // Link to config_accounting_categories (CIBE)
  conservation_state_id?: string; // Link to config_conservation_states
  residual_value?: number; // Valor residual no fim de vida
  
  // OEM / Embedded License
  embedded_license_key?: string; // Unique key for this machine
  
  // Maintenance Link
  parent_equipment_id?: string; // NEW: Link to main equipment if this is a part
  procurement_request_id?: string;
  decommission_reason_id?: string;
}

export interface Instituicao {
  id: string;
  codigo: string;
  name: string;
  email: string;
  telefone: string;
  nif?: string;
  website?: string; // New field
  // Address
  address?: string;
  address_line?: string;
  postal_code?: string;
  city?: string;
  locality?: string;
  
  contacts?: ResourceContact[];
  
  is_active?: boolean; // Status Toggle
}

export const EntidadeStatus = {
  Ativo: 'Ativo',
  Inativo: 'Inativo',
} as const;
export type EntidadeStatus = string;

export interface Entidade {
  id: string;
  instituicaoId: string;
  codigo: string;
  name: string;
  description: string;
  email: string;
  nif?: string;
  website?: string; // New field
  responsavel?: string;
  telefone?: string;
  telemovel?: string;
  telefoneInterno?: string;
  status: EntidadeStatus;
  // Address
  address?: string;
  address_line?: string;
  postal_code?: string;
  city?: string;
  locality?: string;
  
  contacts?: ResourceContact[];
}

export const UserRole = {
    SuperAdmin: 'SuperAdmin',
    Admin: 'Admin',
    Normal: 'Normal',
    Basic: 'Básico',
    Utilizador: 'Utilizador',
} as const;
export type UserRole = string;

// --- NEW RBAC TYPES ---
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

// Granular Keys for all modules and config tables
export type ModuleKey = 
    // Operational Modules
    | 'equipment' // Inventory
    | 'procurement' // Procurement
    | 'licensing' // Software
    | 'tickets' // Support
    | 'organization' // Entities/HR/Teams
    | 'suppliers' // Vendors
    // Granular Compliance
    | 'compliance_bia' 
    | 'compliance_security' 
    | 'compliance_backups' 
    | 'compliance_resilience'
    | 'compliance_training'
    | 'compliance_policies' 
    | 'compliance_continuity' // NEW
    // General
    | 'reports' 
    | 'settings' // General Settings Access (Fallback)
    | 'dashboard_smart'
    // Configuration Tables
    | 'brands'
    | 'equipment_types'
    | 'config_equipment_statuses'
    | 'config_software_categories'
    | 'config_software_products' 
    | 'ticket_categories'
    | 'security_incident_types'
    | 'contact_roles'
    | 'contact_titles'
    | 'config_custom_roles' // RBAC itself
    | 'config_automation' // API Keys etc
    | 'config_criticality_levels'
    | 'config_cia_ratings'
    | 'config_service_statuses'
    | 'config_backup_types'
    | 'config_training_types'
    | 'config_resilience_test_types'
    | 'config_decommission_reasons'
    | 'config_collaborator_deactivation_reasons'
    | 'config_accounting_categories' // NEW: CIBE
    | 'config_conservation_states' // NEW: States
    | 'config_cpus' // NEW: CPUs
    | 'config_ram_sizes' // NEW: RAM
    | 'config_storage_types' // NEW: Storage
    | 'document_templates'; // NEW: PDF Templates

export interface PermissionMatrix {
    [module: string]: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export interface CustomRole {
    id: string;
    name: string;
    permissions: PermissionMatrix;
    is_system?: boolean; // Protected roles like Admin
    requires_mfa?: boolean; // NEW: Enforce MFA
}
// ---------------------

export const CollaboratorStatus = {
    Ativo: 'Ativo',
    Inativo: 'Inativo',
    Onboarding: 'Onboarding', // NEW STATUS
} as const;
export type CollaboratorStatus = string;

export type AppModule = 'inventory' | 'organization' | 'collaborators' | 'licensing' | 'tickets' | 'bia' | 'security';

export interface Collaborator {
  id: string;
  numeroMecanografico: string;
  title?: string; // Trato
  fullName: string;
  entidadeId?: string; // Can be null (direct to Institution or Global)
  instituicaoId?: string; // NEW: Direct link to Institution
  email: string;
  nif?: string;
  telefoneInterno?: string;
  telemovel?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  // Address (Optional for Collaborators)
  address?: string;
  address_line?: string;
  postal_code?: string;
  city?: string;
  locality?: string;
  // Auth fields
  canLogin: boolean;
  receivesNotifications: boolean;
  role: string; // Now string to support custom role names
  status: CollaboratorStatus;
  deactivation_reason_id?: string; // NEW
  password?: string;
  allowedModules?: AppModule[];
  preferences?: UserPreferences; // New: Stores Tooltip Config etc
}

export interface Assignment {
  id: string;
  equipmentId: string;
  entidadeId?: string; // Optional if assigned to Institution directly
  instituicaoId?: string; // NEW: Direct Institution Assignment
  collaboratorId?: string;
  assignedDate: string;
  returnDate?: string;
}

export const TicketStatus = {
  Requested: 'Pedido',
  InProgress: 'Em progresso',
  Finished: 'Finalizado',
} as const;
export type TicketStatus = string;

// Deprecated: Use dynamic categories from DB, keeping for fallback
export const TicketCategory = {
    TechnicalFault: 'Falha Técnica',
    AccessRequest: 'Pedido de Acesso',
    SecurityIncident: 'Incidente de Segurança',
    GeneralSupport: 'Suporte Geral',
    Maintenance: 'Manutenção'
} as const;
export type TicketCategory = string;

// Deprecated: Use dynamic types from DB, keeping for fallback
export const SecurityIncidentType = {
    Ransomware: 'Ransomware',
    Phishing: 'Phishing / Engenharia Social',
    DataLeak: 'Fuga de Dados (Data Leak)',
    Malware: 'Malware / Vírus',
    DDoS: 'Negação de Serviço (DDoS)',
    UnauthorizedAccess: 'Acesso Não Autorizado / Compromisso de Conta',
    InsiderThreat: 'Ameaça Interna',
    VulnerabilityExploit: 'Exploração de Vulnerabilidade',
    Other: 'Outro'
} as const;
export type SecurityIncidentType = string;

export interface TicketCategoryItem {
    id: string;
    name: string;
    is_active: boolean;
    default_team_id?: string;
    sla_warning_hours?: number; // e.g. 24h
    sla_critical_hours?: number; // e.g. 72h
}

export interface SecurityIncidentTypeItem {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
}

export interface Ticket {
  id: string;
  title: string;
  entidadeId: string;
  collaboratorId: string;
  description: string;
  requestDate: string;
  finishDate?: string;
  status: TicketStatus;
  technicianId?: string;
  attachments?: { name: string; dataUrl: string }[];
  team_id?: string;
  equipmentId?: string;
  
  // Supplier Request Support
  requester_supplier_id?: string; // If set, collaboratorId might be ignored or set to a system user
  
  // NIS2 Incident Response Fields
  category?: string; // Changed to string to support dynamic categories
  securityIncidentType?: string; // Changed to string to support dynamic types
  impactCriticality?: CriticalityLevel; // Specific to incident
  impactConfidentiality?: CIARating; // Was confidentiality compromised?
  impactIntegrity?: CIARating;      // Was integrity compromised?
  impactAvailability?: CIARating;   // Was availability compromised?
  
  // KB / RAG Fields
  resolution_summary?: string; // For AI Knowledge Base
  resolution_embedding?: any; // For pg_vector search

  // DORA / NIS2 Regulatory Reporting
  regulatory_status?: 'NotRequired' | 'Pending' | 'EarlyWarningSent' | 'NotificationSent';
  regulatory_24h_deadline?: string; // Calculated 24h from requestDate
  regulatory_72h_deadline?: string; // Calculated 72h from requestDate
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  technicianId: string;
  date: string;
  description: string;
  equipmentId?: string;
}

export interface CollaboratorHistory {
  id: string;
  collaboratorId: string;
  entidadeId: string;
  startDate: string;
  endDate?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export const LicenseStatus = {
  Ativo: 'Ativo',
  Inativo: 'Inativo',
} as const;
export type LicenseStatus = string;

export interface SoftwareLicense {
  id: string;
  productName: string;
  licenseKey: string;
  totalSeats: number;
  purchaseDate?: string;
  expiryDate?: string;
  purchaseEmail?: string;
  invoiceNumber?: string;
  status: LicenseStatus;
  // NIS2 Compliance Fields
  criticality?: CriticalityLevel;
  confidentiality?: CIARating;
  integrity?: CIARating;
  availability?: CIARating;
  // Vendor Link
  supplier_id?: string;
  
  // FinOps
  unitCost?: number; // Cost per seat or total? Usually unit cost for TCO.
  
  // OEM Logic
  is_oem?: boolean; // If true, totalSeats is dynamic/ignored
  
  category_id?: string; // Link to ConfigItem for Software Category
}

export interface LicenseAssignment {
  id: string;
  softwareLicenseId: string;
  equipmentId: string;
  assignedDate: string;
  returnDate?: string;
}

export interface Team {
    id: string;
    name: string;
    description?: string;
    created_at?: string;
    is_active?: boolean; // Status Toggle
}

export interface TeamMember {
    team_id: string;
    collaborator_id: string;
}

export interface UserNotificationSnooze {
    id: string;
    userId: string;
    referenceId: string;
    notificationType: 'warranty' | 'license' | 'ticket';
    snoozeUntil: string;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'ACCESS_REVIEW' | 'RISK_ACKNOWLEDGE' | 'AUTO_SCAN' | 'POLICY_ACCEPTANCE' | 'DIAGNOSTIC' | 'OFFBOARDING' | 'ONBOARDING' | 'DOC_TEMPLATE_CHANGE';

export interface AuditLogEntry {
    id: string;
    user_id: string; // The actor
    action: AuditAction;
    resource_type: string; // 'Collaborator', 'Equipment', etc.
    resource_id?: string;
    details?: string; // JSON string or text
    timestamp: string;
    user_email?: string; // Joined for display
}

// --- NIS2 Business Impact Analysis (BIA) Types ---

export const ServiceStatus = {
    Ativo: 'Ativo',
    Inativo: 'Inativo',
    EmManutencao: 'Em Manutenção'
} as const;
export type ServiceStatus = string;

export interface BusinessService {
    id: string;
    name: string;
    description?: string;
    criticality: CriticalityLevel;
    rto_goal?: string; // Recovery Time Objective (e.g. "4h")
    owner_id?: string; // Collaborator ID (Service Owner)
    status: ServiceStatus;
    // External Provider Link
    external_provider_id?: string; // FK to Supplier
}

export interface ServiceDependency {
    id: string;
    service_id: string;
    equipment_id?: string;
    software_license_id?: string;
    dependency_type?: string; // e.g., "Server", "Database", "Frontend"
    notes?: string;
}

// --- Vulnerability Management Types ---

export const VulnerabilityStatus = {
    Open: 'Aberto',
    InProgress: 'Em Análise',
    Mitigated: 'Mitigado',
    Resolved: 'Resolvido',
    FalsePositive: 'Falso Positivo'
} as const;
export type VulnerabilityStatus = string;

export interface Vulnerability {
    id: string;
    cve_id: string; // e.g., CVE-2024-1234
    description: string;
    severity: CriticalityLevel;
    status: VulnerabilityStatus;
    affected_software?: string;
    remediation?: string;
    published_date?: string;
    ticket_id?: string; // Link to automatic ticket
    affected_assets?: string; // Text description of equipment/assets affected
}

// --- Backup & Restore Testing (NIS2) ---

export const BackupType = {
    Full: 'Completo',
    Incremental: 'Incremental',
    Differential: 'Diferencial',
    Snapshot: 'Snapshot VM'
} as const;
export type BackupType = string;

export interface BackupExecution {
    id: string;
    system_name: string; // e.g. "Servidor ERP" (can be derived from equipment)
    equipment_id?: string; // Link to physical/virtual asset
    backup_date: string;
    test_date: string; // When the restore test was performed
    status: 'Sucesso' | 'Falha' | 'Parcial';
    type: BackupType;
    restore_time_minutes?: number; // RTO verification
    tester_id: string; // Collaborator who tested
    notes?: string;
    attachments?: { name: string; dataUrl: string }[]; // Evidences (screenshots, logs)
}

// --- NIS2 Training & Awareness ---

export const TrainingType = {
    PhishingSimulation: 'Simulação Phishing',
    SecurityPolicy: 'Leitura Política Segurança',
    CyberHygiene: 'Higiene Cibernética (Geral)',
    GDPR: 'RGPD / Privacidade',
    SpecificTool: 'Ferramenta Específica'
} as const;
export type TrainingType = string;

export interface SecurityTrainingRecord {
    id: string;
    collaborator_id: string;
    training_type: TrainingType;
    completion_date: string;
    status: 'Concluído' | 'Pendente' | 'Falhou';
    score?: number; // e.g. 80/100
    notes?: string;
    valid_until?: string; // For recurring training
    duration_hours?: number; // New: Duration in hours
}

// --- Governance & Policies ---
export interface Policy {
    id: string;
    title: string;
    content: string; // Text content or URL
    version: string; // e.g. "1.0"
    is_active: boolean;
    is_mandatory: boolean;
    created_at: string;
    updated_at: string;
}

export interface PolicyAcceptance {
    id: string;
    policy_id: string;
    user_id: string;
    accepted_at: string;
    version: string;
}

// --- DORA Resilience Testing ---

export const ResilienceTestType = {
    VulnerabilityScan: 'Scan Vulnerabilidades',
    PenetrationTest: 'Penetration Test (Pentest)',
    TLPT: 'TLPT (Red Teaming)',
    TabletopExercise: 'Exercício de Mesa (DRP)',
    DisasterRecovery: 'Recuperação de Desastres (Full)'
} as const;
export type ResilienceTestType = string;

export interface ResilienceTest {
    id: string;
    title: string;
    test_type: ResilienceTestType;
    planned_date: string;
    executed_date?: string;
    status: 'Planeado' | 'Em Execução' | 'Concluído' | 'Cancelado';
    
    auditor_entity?: string; // Name Display
    // Linked Entity/Supplier
    auditor_supplier_id?: string;
    auditor_internal_entidade_id?: string;
    
    summary_findings?: string;
    attachments?: { name: string; dataUrl: string }[]; // Reports
    created_at?: string;
}

// --- NEW: Business Continuity ---
export interface ContinuityPlan {
    id: string;
    title: string;
    type: 'BCP' | 'DRP' | 'Crise';
    description?: string;
    document_url?: string;
    document_name?: string;
    service_id?: string; // Link to BIA
    last_review_date: string;
    next_review_date: string;
    owner_id: string; // Collaborator
}

// --- Global Settings (Automation) ---
export interface GlobalSetting {
    id: string;
    setting_key: string; // e.g. 'scan_frequency_days'
    setting_value: string; // e.g. '7'
    updated_at: string;
}

// --- PROCUREMENT (AQUISIÇÕES) ---
export const ProcurementStatus = {
    Pending: 'Pendente',
    Approved: 'Aprovado',
    Rejected: 'Rejeitado',
    Ordered: 'Encomendado',
    Received: 'Recebido',
    Completed: 'Concluído' // After assets are created
} as const;
export type ProcurementStatus = typeof ProcurementStatus[keyof typeof ProcurementStatus];

export interface ProcurementRequest {
    id: string;
    title: string; // e.g. "5x Laptop Dell"
    description?: string;
    quantity: number;
    estimated_cost?: number;
    requester_id: string; // Collaborator
    approver_id?: string;
    supplier_id?: string; // Optional initially, mandatory for Order
    
    status: ProcurementStatus;
    
    request_date: string;
    approval_date?: string;
    order_date?: string; // When ordered from supplier
    received_date?: string; // When physically received
    
    order_reference?: string; // Supplier order #
    invoice_number?: string;
    
    priority: 'Normal' | 'Urgente';
    
    // New fields for improved workflow
    resource_type?: 'Hardware' | 'Software';
    equipment_type_id?: string;
    specifications?: any; // JSONB to store specs like RAM, CPU etc.
    software_category_id?: string; // Link to ConfigItem for Software Category
    brand_id?: string; // NEW: Brand Link

    attachments?: { name: string; dataUrl: string }[]; // Quotes, Invoices
}

// --- SYSTEM DIAGNOSTICS ---
export interface DiagnosticResult {
    module: string;
    status: 'Success' | 'Failure' | 'Warning';
    message: string;
    details?: string;
    timestamp: string;
}

// --- CALENDAR EVENTS ---
export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    is_all_day: boolean;
    color: string; // hex
    created_by: string; // collaborator ID
    team_id?: string; // If set, visible to team
    is_private: boolean;
    reminder_minutes?: number; // Notification trigger
    created_at?: string;
}

// --- DOCUMENT TEMPLATES (PDFME) ---
export interface DocumentTemplate {
    id: string;
    name: string;
    type: 'equipment' | 'collaborator' | 'generic'; // Context
    template_json: any; // Stored as JSONB in DB
    is_active: boolean;
    created_at?: string;
}