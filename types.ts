
export enum UserRole {
    SuperAdmin = 'SuperAdmin',
    Admin = 'Admin',
    Tecnico = 'Técnico',
    Utilizador = 'Utilizador',
    Basic = 'Basic',
    Normal = 'Normal'
}

export interface ConfigItem {
    id: string;
    name: string;
    color?: string;
    is_active?: boolean;
}

export type ModuleKey = 
    | 'widget_alerts' | 'widget_kpi_cards' | 'widget_inventory_charts' | 'widget_financial' | 'widget_operational_charts' | 'widget_activity'
    | 'equipment' | 'equipment_view_full' | 'licensing' | 'tickets' | 'organization' | 'suppliers' | 'procurement' | 'reports' | 'settings' | 'dashboard_smart'
    | 'compliance_bia' | 'compliance_security' | 'compliance_backups' | 'compliance_resilience' | 'compliance_training' | 'compliance_policies' | 'compliance_continuity'
    | 'brands' | 'equipment_types' | 'config_equipment_statuses' | 'config_ticket_statuses' | 'config_license_statuses' | 'config_cpus' | 'config_ram_sizes' | 'config_storage_types' | 'config_software_categories' | 'config_software_products' | 'config_decommission_reasons'
    | 'ticket_categories' | 'security_incident_types' | 'contact_roles' | 'contact_titles' | 'config_custom_roles' | 'config_collaborator_deactivation_reasons' | 'config_accounting_categories' | 'config_conservation_states' | 'config_job_titles'
    | 'config_automation' | 'config_criticality_levels' | 'config_cia_ratings' | 'config_service_statuses' | 'config_backup_types' | 'config_training_types' | 'config_resilience_test_types' | 'document_templates'
    | 'my_area' | 'tools_agenda' | 'tools_map' | 'tools_calendar' | 'tools_manual'
    | 'org_institutions' | 'org_entities' | 'org_collaborators' | 'org_suppliers';

export type PermissionAction = 'view' | 'view_own' | 'create' | 'edit' | 'delete' | 'manage';

export enum EquipmentStatus {
    Operacional = 'Operacional',
    Stock = 'Stock',
    Garantia = 'Garantia',
    Abate = 'Abate',
    Empréstimo = 'Empréstimo',
    Acquisition = 'Aquisição',
    Retirado = 'Retirado (Arquivo)'
}

export enum CriticalityLevel {
    Low = 'Baixa',
    Medium = 'Média',
    High = 'Alta',
    Critical = 'Crítica'
}

export enum CIARating {
    Low = 'Baixa',
    Medium = 'Média',
    High = 'Alta'
}

export enum CollaboratorStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo',
    Onboarding = 'Onboarding'
}

export enum EntidadeStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo'
}

export enum TicketStatus {
    Requested = 'Pedido',
    InProgress = 'Em progresso',
    Finished = 'Finalizado',
    Cancelled = 'Cancelado'
}

export enum TicketCategory {
    TechnicalFault = 'Avaria Técnica',
    SoftwareRequest = 'Pedido de Software',
    AccessRequest = 'Pedido de Acesso',
    SecurityIncident = 'Incidente de Segurança'
}

export enum LicenseStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo'
}

export enum ServiceStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo'
}

export enum VulnerabilityStatus {
    Open = 'Aberto',
    InProgress = 'Em Resolução',
    Mitigated = 'Mitigado',
    Resolved = 'Resolvido',
    FalsePositive = 'Falso Positivo'
}

export enum BackupType {
    Full = 'Completo',
    Incremental = 'Incremental',
    Differential = 'Diferencial'
}

export enum ResilienceTestType {
    VulnerabilityScan = 'Vulnerability Scan',
    Pentest = 'Pentest',
    DRP = 'DRP (Recovery Test)',
    RedTeaming = 'Red Teaming'
}

export enum TrainingType {
    Phishing = 'Phishing Awareness',
    SecurityPolicy = 'Security Policy',
    GDPR = 'Proteção de Dados (RGPD)',
    SafeBrowsing = 'Navegação Segura'
}

export enum ProcurementStatus {
    Pending = 'Pendente',
    Approved = 'Aprovado',
    Rejected = 'Rejeitado',
    Ordered = 'Encomendado',
    Received = 'Recebido',
    Completed = 'Concluído'
}

export interface Brand {
    id: string;
    name: string;
    risk_level: CriticalityLevel;
    is_iso27001_certified: boolean;
    security_contact_email?: string;
}

export interface EquipmentType {
    id: string;
    name: string;
    requiresNomeNaRede: boolean;
    requiresMacWIFI: boolean;
    requiresMacCabo: boolean;
    requiresInventoryNumber: boolean;
    default_team_id?: string;
    requiresBackupTest: boolean;
    requiresLocation: boolean;
    is_maintenance: boolean;
    requires_wwan_address: boolean;
    requires_bluetooth_address: boolean;
    requires_usb_thunderbolt_address: boolean;
    requires_ram_size: boolean;
    requires_disk_info: boolean;
    requires_cpu_info: boolean;
    requires_manufacture_date: boolean;
    requires_ip: boolean;
}

export interface Collaborator {
    id: string;
    fullName: string;
    email: string;
    numeroMecanografico?: string;
    title?: string;
    role: string;
    status: CollaboratorStatus;
    canLogin: boolean;
    receivesNotifications: boolean;
    entidadeId?: string;
    instituicaoId?: string;
    job_title_id?: string;
    job_title_name?: string;
    telemovel?: string;
    telefoneInterno?: string;
    address?: string;
    address_line?: string;
    postal_code?: string;
    city?: string;
    locality?: string;
    nif?: string;
    dateOfBirth?: string;
    admissionDate?: string;
    photoUrl?: string;
    preferences?: {
        tooltipConfig?: TooltipConfig;
    };
}

export interface Equipment {
    id: string;
    brandId: string;
    typeId: string;
    description: string;
    serialNumber: string;
    inventoryNumber?: string;
    nomeNaRede?: string;
    macAddressWIFI?: string;
    macAddressCabo?: string;
    status: EquipmentStatus;
    purchaseDate?: string;
    warrantyEndDate?: string;
    invoiceNumber?: string;
    requisitionNumber?: string;
    criticality?: CriticalityLevel;
    confidentiality?: CIARating;
    integrity?: CIARating;
    availability?: CIARating;
    supplier_id?: string;
    acquisitionCost?: number;
    expectedLifespanYears?: number;
    embedded_license_key?: string;
    installationLocation?: string;
    isLoan: boolean;
    parent_equipment_id?: string;
    os_version?: string;
    last_security_update?: string;
    firmware_version?: string;
    wwan_address?: string;
    bluetooth_address?: string;
    usb_thunderbolt_address?: string;
    ip_address?: string;
    ram_size?: string;
    disk_info?: string;
    cpu_info?: string;
    monitor_info?: string;
    manufacture_date?: string;
    accounting_category_id?: string;
    conservation_state_id?: string;
    decommission_reason_id?: string;
    residual_value?: number;
    last_inventory_scan?: string;
    creationDate: string;
    modifiedDate: string;
    procurement_request_id?: string;
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

export interface Instituicao {
    id: string;
    name: string;
    codigo: string;
    email: string;
    telefone: string;
    nif?: string;
    website?: string;
    address?: string;
    address_line?: string;
    postal_code?: string;
    city?: string;
    locality?: string;
    is_active?: boolean;
    contacts?: ResourceContact[];
}

export interface Entidade {
    id: string;
    instituicaoId: string;
    codigo: string;
    name: string;
    description?: string;
    email: string;
    nif?: string;
    website?: string;
    responsavel?: string;
    telefone?: string;
    telemovel?: string;
    telefoneInterno?: string;
    status: EntidadeStatus;
    address?: string;
    address_line?: string;
    postal_code?: string;
    city?: string;
    locality?: string;
    contacts?: ResourceContact[];
}

export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: string;
    category: string;
    requestDate: string;
    finishDate?: string;
    collaboratorId: string;
    technicianId?: string;
    entidadeId?: string;
    team_id?: string;
    equipmentId?: string;
    securityIncidentType?: string;
    impactCriticality?: string;
    attachments?: { name: string; dataUrl: string }[];
    resolution_summary?: string;
    requester_supplier_id?: string;
}

export interface TicketActivity {
    id: string;
    ticketId: string;
    technicianId: string;
    description: string;
    date: string;
    equipmentId?: string;
}

export interface SoftwareLicense {
    id: string;
    productName: string;
    licenseKey: string;
    totalSeats: number;
    purchaseDate?: string;
    expiryDate?: string;
    purchaseEmail?: string;
    invoiceNumber?: string;
    status: string;
    criticality: CriticalityLevel;
    confidentiality: CIARating;
    integrity: CIARating;
    availability: CIARating;
    supplier_id?: string;
    unitCost?: number;
    is_oem: boolean;
    category_id?: string;
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
    is_active: boolean;
}

export interface TeamMember {
    id: string;
    team_id: string;
    collaborator_id: string;
}

export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
    read: boolean;
}

export interface CollaboratorHistory {
    id: string;
    collaboratorId: string;
    entidadeId: string;
    startDate: string;
    endDate?: string;
}

export interface TicketCategoryItem {
    id: string;
    name: string;
    is_active: boolean;
    default_team_id?: string;
    sla_warning_hours: number;
    sla_critical_hours: number;
    is_security: boolean;
}

export interface SecurityIncidentTypeItem {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
}

export interface BusinessService {
    id: string;
    name: string;
    description?: string;
    criticality: CriticalityLevel;
    rto_goal?: string;
    owner_id: string;
    status: ServiceStatus;
    external_provider_id?: string;
}

export interface ServiceDependency {
    id: string;
    service_id: string;
    equipment_id?: string;
    software_license_id?: string;
    dependency_type?: string;
    notes?: string;
}

export interface Vulnerability {
    id: string;
    cve_id: string;
    description: string;
    severity: CriticalityLevel;
    affected_software?: string;
    remediation?: string;
    status: VulnerabilityStatus;
    published_date: string;
    ticket_id?: string;
    affected_assets?: string;
}

export interface BackupExecution {
    id: string;
    system_name: string;
    equipment_id?: string;
    backup_date: string;
    test_date: string;
    status: string;
    type: BackupType;
    restore_time_minutes?: number;
    tester_id: string;
    notes?: string;
    attachments?: { name: string; dataUrl: string }[];
}

export interface ResilienceTest {
    id: string;
    title: string;
    test_type: ResilienceTestType;
    planned_date: string;
    executed_date?: string;
    status: string;
    auditor_entity?: string;
    auditor_supplier_id?: string;
    auditor_internal_entidade_id?: string;
    summary_findings?: string;
    attachments?: { name: string; dataUrl: string }[];
}

export interface SecurityTrainingRecord {
    id: string;
    collaborator_id: string;
    training_type: string;
    completion_date: string;
    status: string;
    score?: number;
    notes?: string;
    duration_hours?: number;
}

export interface Supplier {
    id: string;
    name: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    nif?: string;
    website?: string;
    address?: string;
    address_line?: string;
    postal_code?: string;
    city?: string;
    locality?: string;
    notes?: string;
    is_iso27001_certified: boolean;
    iso_certificate_expiry?: string;
    security_contact_email?: string;
    risk_level: CriticalityLevel;
    attachments?: { name: string; dataUrl: string }[];
    other_certifications?: { name: string; expiryDate: string }[];
    contracts?: SupplierContract[];
    contacts?: ResourceContact[];
    is_active?: boolean;
}

export interface SupplierContract {
    id: string;
    ref_number: string;
    description: string;
    start_date: string;
    end_date: string;
    notice_period_days: number;
    exit_strategy: string;
    supported_service_ids: string[];
    is_active: boolean;
}

export interface ResourceContact {
    id: string;
    resource_type: 'supplier' | 'entidade' | 'instituicao';
    resource_id: string;
    title?: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    is_active?: boolean;
}

export interface CustomRole {
    id: string;
    name: string;
    description?: string;
    permissions: any;
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
    target_type?: 'Global' | 'Instituicao' | 'Entidade';
    target_instituicao_ids?: string[];
    target_entidade_ids?: string[];
}

export interface PolicyAcceptance {
    id: string;
    policy_id: string;
    collaborator_id: string;
    version: string;
    accepted_at: string;
}

export interface ProcurementRequest {
    id: string;
    title: string;
    description: string;
    quantity: number;
    estimated_cost: number;
    requester_id: string;
    status: ProcurementStatus;
    request_date: string;
    priority: 'Normal' | 'Urgente';
    resource_type: 'Hardware' | 'Software';
    specifications: any;
    attachments?: { name: string; dataUrl: string }[];
    brand_id?: string;
    supplier_id?: string;
    order_reference?: string;
    invoice_number?: string;
    approval_date?: string;
    approver_id?: string;
    received_date?: string;
    equipment_type_id?: string;
    software_category_id?: string;
    order_date?: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    is_all_day: boolean;
    color?: string;
    is_private: boolean;
    team_id?: string;
    reminder_minutes?: number;
    created_by: string;
    created_at: string;
}

export interface ContinuityPlan {
    id: string;
    title: string;
    type: 'BCP' | 'DRP' | 'Crise';
    description?: string;
    service_id?: string;
    last_review_date: string;
    next_review_date?: string;
    owner_id: string;
    document_url?: string;
    document_name?: string;
}

export interface SoftwareProduct {
    id: string;
    name: string;
    category_id: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    user_email: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    details?: string;
}

export interface DiagnosticResult {
    module: string;
    status: 'Success' | 'Failure' | 'Warning';
    message: string;
}

export interface DbPolicy {
    tablename: string;
    policyname: string;
    cmd: string;
    roles: string[];
    qual: string;
    with_check: string;
}

export interface DbTrigger {
    table_name: string;
    trigger_name: string;
    event_manipulation: string;
    action_statement: string;
    action_timing: string;
}

export interface DbFunction {
    routine_name: string;
    data_type: string;
    external_language: string;
    definition: string;
}

export interface VulnerabilityScanConfig {
    includeEol: boolean;
    lookbackYears: number;
    customInstructions?: string;
}

export interface TooltipConfig {
    showNomeNaRede: boolean;
    showAssignedTo: boolean;
    showSerialNumber: boolean;
    showCollabName: boolean;
    showCollabJob: boolean;
    showCollabEntity: boolean;
    showCollabContact: boolean;
}

export const defaultTooltipConfig: TooltipConfig = {
    showNomeNaRede: true,
    showAssignedTo: true,
    showSerialNumber: true,
    showCollabName: true,
    showCollabJob: true,
    showCollabEntity: true,
    showCollabContact: true
};

export interface AutomationRule {
    id: string;
    name: string;
    trigger_event: 'TICKET_CREATED' | 'EQUIPMENT_CREATED';
    conditions: RuleCondition[];
    actions: RuleAction[];
    priority: number;
    is_active: boolean;
    description?: string;
    created_at: string;
}

export interface RuleCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
    value: any;
}

export interface RuleAction {
    type: 'ASSIGN_TEAM' | 'ASSIGN_USER' | 'SET_PRIORITY' | 'SET_STATUS' | 'UPDATE_FIELD' | 'SEND_EMAIL';
    value: string;
    target_field?: string;
}

export interface SoftwareCategory {
    id: string;
    name: string;
}

export interface ContactTitle {
    id: string;
    name: string;
}

export interface ContactRole {
    id: string;
    name: string;
}

export interface JobTitle {
    id: string;
    name: string;
}

export interface DocumentTemplate {
    id: string;
    name: string;
    type: 'equipment' | 'collaborator' | 'generic';
    template_json: any;
    is_active: boolean;
    created_at?: string;
}
