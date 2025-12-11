
export type ModuleKey = 
    | 'equipment' | 'licensing' | 'tickets' | 'organization' | 'suppliers' 
    | 'procurement' | 'reports' | 'settings' | 'dashboard_smart'
    | 'compliance_bia' | 'compliance_security' | 'compliance_backups' 
    | 'compliance_resilience' | 'compliance_training' | 'compliance_policies' 
    | 'compliance_continuity' | 'brands' | 'equipment_types' 
    | 'config_equipment_statuses' | 'config_cpus' | 'config_ram_sizes' 
    | 'config_storage_types' | 'config_software_categories' 
    | 'config_software_products' | 'config_decommission_reasons' 
    | 'ticket_categories' | 'security_incident_types' | 'contact_roles' 
    | 'contact_titles' | 'config_custom_roles' 
    | 'config_collaborator_deactivation_reasons' | 'config_accounting_categories' 
    | 'config_conservation_states' | 'config_automation' 
    | 'config_criticality_levels' | 'config_cia_ratings' 
    | 'config_service_statuses' | 'config_backup_types' 
    | 'config_training_types' | 'config_resilience_test_types' 
    | 'document_templates' | 'config_job_titles';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export type PermissionMatrix = Record<string, Record<string, boolean>>;

export interface CustomRole {
    id: string;
    name: string;
    permissions: PermissionMatrix;
    is_system?: boolean;
    requires_mfa?: boolean;
}

export enum UserRole {
    SuperAdmin = 'SuperAdmin',
    Admin = 'Admin',
    Tecnico = 'Técnico',
    Utilizador = 'Utilizador',
    Basic = 'Basic',
    Normal = 'Normal'
}

export enum CollaboratorStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo',
    Onboarding = 'Onboarding'
}

export interface Collaborator {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: CollaboratorStatus;
    entidadeId?: string;
    instituicaoId?: string;
    numeroMecanografico?: string;
    telemovel?: string;
    telefoneInterno?: string;
    title?: string;
    canLogin?: boolean;
    photoUrl?: string;
    receivesNotifications?: boolean;
    address_line?: string;
    address?: string; // Legacy
    postal_code?: string;
    city?: string;
    locality?: string;
    nif?: string;
    dateOfBirth?: string;
    job_title_id?: string;
    job_title_name?: string;
    deactivation_reason_id?: string;
    preferences?: any;
    contacts?: any[];
}

export interface CollaboratorHistory {
    id: string;
    collaboratorId: string;
    entidadeId: string;
    startDate: string;
    endDate?: string;
}

export interface Instituicao {
    id: string;
    name: string;
    codigo: string;
    email: string;
    telefone: string;
    nif?: string;
    website?: string;
    address_line?: string;
    address?: string; // Legacy
    postal_code?: string;
    city?: string;
    locality?: string;
    is_active?: boolean;
    contacts?: ResourceContact[];
}

export enum EntidadeStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo'
}

export interface Entidade {
    id: string;
    instituicaoId: string;
    name: string;
    codigo: string;
    email: string;
    telefone?: string;
    telemovel?: string;
    telefoneInterno?: string; // Added
    responsavel?: string;
    status: EntidadeStatus;
    website?: string;
    address_line?: string;
    address?: string; // Legacy
    postal_code?: string;
    city?: string;
    locality?: string;
    description?: string;
    nif?: string; // Added
    contacts?: ResourceContact[];
}

export interface Brand {
    id: string;
    name: string;
    risk_level?: CriticalityLevel;
    is_iso27001_certified?: boolean;
    security_contact_email?: string;
}

export interface EquipmentType {
    id: string;
    name: string;
    requiresNomeNaRede?: boolean;
    requiresMacWIFI?: boolean;
    requiresMacCabo?: boolean;
    requiresInventoryNumber?: boolean;
    default_team_id?: string;
    requiresBackupTest?: boolean;
    requiresLocation?: boolean;
    is_maintenance?: boolean;
    requires_wwan_address?: boolean;
    requires_bluetooth_address?: boolean;
    requires_usb_thunderbolt_address?: boolean;
    requires_ram_size?: boolean;
    requires_disk_info?: boolean;
    requires_cpu_info?: boolean;
    requires_manufacture_date?: boolean;
    requires_ip?: boolean;
}

export enum EquipmentStatus {
    Operacional = 'Operacional',
    Stock = 'Stock',
    Garantia = 'Garantia',
    Abate = 'Abate',
    Emprestimo = 'Empréstimo',
    Decommissioned = 'Abate', // Alias
    Acquisition = 'Aquisição',
    Warranty = 'Garantia' // Alias
}

export enum CriticalityLevel {
    Low = 'Baixa',
    Medium = 'Média',
    High = 'Alta',
    Critical = 'Crítica'
}

export enum CIARating {
    Low = 'Baixo',
    Medium = 'Médio',
    High = 'Alto'
}

export interface Equipment {
    id: string;
    serialNumber: string;
    description: string;
    brandId: string;
    typeId: string;
    status: string; // Dynamic status
    purchaseDate?: string;
    warrantyEndDate?: string;
    invoiceNumber?: string;
    requisitionNumber?: string;
    acquisitionCost?: number;
    expectedLifespanYears?: number;
    residual_value?: number;
    
    // Technical
    nomeNaRede?: string;
    macAddressWIFI?: string;
    macAddressCabo?: string;
    ip_address?: string;
    os_version?: string;
    firmware_version?: string;
    last_security_update?: string;
    last_inventory_scan?: string;
    cpu_info?: string;
    ram_size?: string;
    disk_info?: string;
    monitor_info?: string; // Added
    manufacture_date?: string;
    embedded_license_key?: string;
    wwan_address?: string;
    bluetooth_address?: string;
    usb_thunderbolt_address?: string;
    
    // Relations
    supplier_id?: string;
    parent_equipment_id?: string;
    accounting_category_id?: string;
    conservation_state_id?: string;
    procurement_request_id?: string;
    
    // Meta
    inventoryNumber?: string;
    installationLocation?: string;
    isLoan?: boolean;
    
    // Risk
    criticality?: CriticalityLevel;
    confidentiality?: CIARating;
    integrity?: CIARating;
    availability?: CIARating;

    creationDate: string;
    modifiedDate: string;
}

export interface SoftwareLicense {
    id: string;
    productName: string;
    licenseKey: string;
    totalSeats: number;
    category_id?: string;
    status?: string;
    purchaseDate?: string;
    expiryDate?: string;
    purchaseEmail?: string;
    invoiceNumber?: string;
    supplier_id?: string;
    unitCost?: number;
    is_oem?: boolean;
    
    criticality?: CriticalityLevel;
    confidentiality?: CIARating;
    integrity?: CIARating;
    availability?: CIARating;
}

export enum LicenseStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo'
}

export interface LicenseAssignment {
    id: string;
    softwareLicenseId: string;
    equipmentId: string;
    assignedDate: string;
    returnDate?: string;
}

export interface Assignment {
    id: string;
    equipmentId: string;
    collaboratorId?: string;
    entidadeId?: string;
    instituicaoId?: string;
    assignedDate: string;
    returnDate?: string;
}

export interface Team {
    id: string;
    name: string;
    description?: string;
    is_active?: boolean;
}

export interface TeamMember {
    id: string;
    team_id: string;
    collaborator_id: string;
}

export enum TicketStatus {
    Requested = 'Pedido',
    InProgress = 'Em progresso',
    Finished = 'Finalizado',
    Cancelled = 'Cancelado'
}

export enum TicketCategory {
    TechnicalFault = 'Falha Técnica',
    Request = 'Pedido de Acesso',
    SecurityIncident = 'Incidente de Segurança',
    Maintenance = 'Manutenção'
}

export interface TicketCategoryItem {
    id: string;
    name: string;
    is_active: boolean;
    default_team_id?: string;
    sla_warning_hours?: number;
    sla_critical_hours?: number;
}

export enum SecurityIncidentType {
    Malware = 'Malware',
    Phishing = 'Phishing',
    Ransomware = 'Ransomware',
    DDoS = 'DDoS',
    DataLeak = 'Fuga de Dados',
    Other = 'Outro'
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
    description: string;
    status: TicketStatus;
    category: string;
    requestDate: string;
    finishDate?: string;
    
    collaboratorId: string;
    entidadeId?: string;
    instituicaoId?: string;
    requester_supplier_id?: string;
    
    technicianId?: string;
    team_id?: string;
    equipmentId?: string;
    supplier_id?: string;

    resolution_summary?: string;
    priority?: string;
    attachments?: { name: string; dataUrl: string }[];
    
    securityIncidentType?: string;
    impactCriticality?: CriticalityLevel;
    impactConfidentiality?: CIARating;
    impactIntegrity?: CIARating;
    impactAvailability?: CIARating;
}

export interface TicketActivity {
    id: string;
    ticketId: string;
    technicianId: string;
    description: string;
    date: string;
    equipmentId?: string;
}

export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
    read: boolean;
}

export interface ConfigItem {
    id: string;
    name: string;
    color?: string;
}

export interface Supplier {
    id: string;
    name: string;
    nif?: string;
    address?: string;
    address_line?: string;
    postal_code?: string;
    city?: string;
    locality?: string;
    website?: string;
    notes?: string;
    
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    
    risk_level: CriticalityLevel;
    is_iso27001_certified?: boolean;
    iso_certificate_expiry?: string;
    security_contact_email?: string;
    is_active?: boolean;
    
    other_certifications?: { name: string; expiryDate: string }[];
    contracts?: SupplierContract[];
    contacts?: ResourceContact[];
    attachments?: { name: string; dataUrl: string }[];
}

export interface SupplierContract {
    id: string;
    ref_number: string;
    description: string;
    start_date: string;
    end_date: string;
    notice_period_days: number;
    exit_strategy?: string;
    supported_service_ids?: string[];
    is_active: boolean;
}

export interface ResourceContact {
    id: string;
    resource_type: 'supplier' | 'entidade' | 'instituicao';
    resource_id: string;
    title?: string;
    name: string;
    role?: string;
    email?: string;
    phone?: string;
    is_active?: boolean;
}

export interface ContactRole extends ConfigItem {}
export interface ContactTitle extends ConfigItem {}
export interface JobTitle extends ConfigItem {}

export enum ServiceStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo',
    Descontinuado = 'Descontinuado'
}

export interface BusinessService {
    id: string;
    name: string;
    description?: string;
    criticality: CriticalityLevel;
    rto_goal?: string;
    owner_id?: string;
    external_provider_id?: string;
    status: ServiceStatus;
}

export interface ServiceDependency {
    id: string;
    service_id: string;
    dependency_type?: string;
    notes?: string;
    equipment_id?: string;
    software_license_id?: string;
}

export enum VulnerabilityStatus {
    Open = 'Aberto',
    InProgress = 'Em Análise',
    Mitigated = 'Mitigado',
    Resolved = 'Resolvido',
    FalsePositive = 'Falso Positivo'
}

export interface Vulnerability {
    id: string;
    cve_id: string;
    description: string;
    severity: CriticalityLevel;
    affected_software?: string;
    affected_assets?: string;
    remediation?: string;
    status: VulnerabilityStatus;
    published_date?: string;
    ticket_id?: string;
}

export enum BackupType {
    Full = 'Full',
    Incremental = 'Incremental',
    Differential = 'Diferencial'
}

export interface BackupExecution {
    id: string;
    system_name: string;
    equipment_id?: string;
    backup_date: string;
    test_date: string;
    status: 'Sucesso' | 'Falha' | 'Parcial';
    type: BackupType;
    restore_time_minutes?: number;
    tester_id: string;
    notes?: string;
    attachments?: { name: string; dataUrl: string }[];
}

export enum ResilienceTestType {
    VulnerabilityScan = 'Scan Vulnerabilidades',
    Pentest = 'Penetration Test',
    PhishingSim = 'Simulação Phishing',
    RedTeam = 'Red Teaming',
    Tabletop = 'Tabletop Exercise (DRP)'
}

export interface ResilienceTest {
    id: string;
    title: string;
    test_type: ResilienceTestType;
    planned_date: string;
    executed_date?: string;
    status: 'Planeado' | 'Em Execução' | 'Concluído' | 'Cancelado';
    auditor_entity?: string;
    auditor_supplier_id?: string;
    auditor_internal_entidade_id?: string;
    summary_findings?: string;
    attachments?: { name: string; dataUrl: string }[];
}

export enum TrainingType {
    Onboarding = 'Onboarding',
    PhishingAwareness = 'Consciencialização Phishing',
    GDPR = 'RGPD / Privacidade',
    SecureCoding = 'Desenvolvimento Seguro',
    GeneralSecurity = 'Segurança Geral',
    IncidentResponse = 'Resposta a Incidentes'
}

export interface SecurityTrainingRecord {
    id: string;
    collaborator_id: string;
    training_type: string;
    completion_date: string;
    expiration_date?: string;
    status: 'Concluído' | 'Pendente' | 'Expirado';
    score?: number;
    certificate_url?: string;
    duration_hours?: number;
    notes?: string;
}

export interface Policy {
    id: string;
    title: string;
    content: string;
    version: string;
    is_active: boolean;
    is_mandatory: boolean;
    created_at: string;
    updated_at: string;
}

export interface PolicyAcceptance {
    id: string;
    policy_id: string;
    user_id: string;
    version: string;
    accepted_at: string;
}

export enum ProcurementStatus {
    Pending = 'Pendente',
    Approved = 'Aprovado',
    Rejected = 'Rejeitado',
    Ordered = 'Encomendado',
    Received = 'Recebido',
    Completed = 'Concluído'
}

export interface ProcurementRequest {
    id: string;
    title: string;
    description?: string;
    quantity: number;
    estimated_cost?: number;
    requester_id: string;
    approver_id?: string;
    supplier_id?: string;
    status: string;
    priority: 'Normal' | 'Urgente';
    request_date: string;
    approval_date?: string;
    order_date?: string;
    received_date?: string;
    
    resource_type: 'Hardware' | 'Software';
    equipment_type_id?: string;
    brand_id?: string;
    software_category_id?: string;
    specifications?: any;
    
    order_reference?: string;
    invoice_number?: string;
    attachments?: { name: string; dataUrl: string }[];
}

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    is_all_day: boolean;
    color?: string;
    created_by: string;
    is_private: boolean;
    team_id?: string;
    reminder_minutes?: number;
}

export interface ContinuityPlan {
    id: string;
    title: string;
    type: 'BCP' | 'DRP' | 'Crise';
    description?: string;
    document_url?: string;
    document_name?: string;
    last_review_date: string;
    next_review_date?: string;
    owner_id: string;
    service_id?: string;
}

export interface SoftwareProduct {
    id: string;
    name: string;
    category_id: string;
}

export interface DocumentTemplate {
    id: string;
    name: string;
    type: 'equipment' | 'collaborator' | 'generic';
    template_json: any;
    is_active: boolean;
    created_at: string;
}

export interface TooltipConfig {
    showNomeNaRede: boolean;
    showAssignedTo: boolean;
    showOsVersion: boolean;
    showLastPatch: boolean;
    showFirmwareVersion: boolean;
    showSerialNumber: boolean;
    showBrand: boolean;
    showWarranty: boolean;
    showLocation: boolean;
    showCollabName: boolean;
    showCollabJob: boolean;
    showCollabEntity: boolean;
    showCollabContact: boolean;
}

export const defaultTooltipConfig: TooltipConfig = {
    showNomeNaRede: true,
    showAssignedTo: true,
    showOsVersion: true,
    showLastPatch: true,
    showFirmwareVersion: false,
    showSerialNumber: true,
    showBrand: true,
    showWarranty: true,
    showLocation: true,
    showCollabName: true,
    showCollabJob: true,
    showCollabEntity: true,
    showCollabContact: true
};

export interface DiagnosticResult {
    module: string;
    status: 'Success' | 'Failure' | 'Warning';
    message: string;
    timestamp: string;
}

export type AuditAction = 
    | 'LOGIN' 
    | 'CREATE' 
    | 'UPDATE' 
    | 'DELETE' 
    | 'VIEW' 
    | 'EXPORT' 
    | 'IMPORT' 
    | 'ACCESS_REVIEW' 
    | 'RISK_ACKNOWLEDGE' 
    | 'AUTO_SCAN'
    | 'OFFBOARDING'
    | 'ONBOARDING';

export interface AuditLogEntry {
    id: string;
    user_id: string;
    user_email: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    details?: string;
    timestamp: string;
}

export interface VulnerabilityScanConfig {
    includeEol?: boolean;
    lookbackYears?: number;
    customInstructions?: string;
}

export interface SoftwareCategory extends ConfigItem {}
