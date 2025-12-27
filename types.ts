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
    | 'equipment' | 'equipment_view_full' | 'licensing' | 'tickets' | 'tickets_security' | 'organization' | 'suppliers' | 'procurement' | 'reports' | 'settings' | 'dashboard_smart'
    | 'compliance_bia' | 'compliance_security' | 'compliance_backups' | 'compliance_resilience' | 'compliance_training' | 'compliance_policies' | 'compliance_continuity'
    | 'brands' | 'equipment_types' | 'config_equipment_statuses' | 'config_ticket_statuses' | 'config_license_statuses' | 'config_cpus' | 'config_ram_sizes' | 'config_storage_types' | 'config_software_categories' | 'config_software_products' | 'config_decommission_reasons'
    | 'ticket_categories' | 'security_incident_types' | 'contact_roles' | 'contact_titles' | 'config_custom_roles' | 'config_collaborator_deactivation_reasons' | 'config_accounting_categories' | 'config_conservation_states' | 'config_job_titles'
    | 'config_automation' | 'config_criticality_levels' | 'config_cia_ratings' | 'config_service_statuses' | 'config_backup_types' | 'config_training_types' | 'config_resilience_test_types' | 'document_templates'
    | 'my_area' | 'tools_agenda' | 'tools_map' | 'tools_calendar' | 'tools_manual'
    | 'org_institutions' | 'org_entities' | 'org_collaborators' | 'org_suppliers'
    | 'notif_tickets' | 'notif_licenses' | 'notif_warranties'
    | 'msg_tickets' | 'msg_licenses' | 'msg_warranties'
    | 'holidays' | 'vacation_schedule' | 'vacation_report'
    | 'config_holiday_types';

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
    requires_nome_na_rede: boolean;
    requires_mac_wifi: boolean;
    requires_mac_cabo: boolean;
    requires_inventory_number: boolean;
    requires_backup_test: boolean;
    requires_location: boolean;
    is_maintenance: boolean;
    requires_wwan_address: boolean;
    requires_bluetooth_address: boolean;
    requires_usb_thunderbolt_address: boolean;
    requires_ram_size: boolean;
    requires_disk_info: boolean;
    requires_cpu_info: boolean;
    requires_manufacture_date: boolean;
    requires_ip: boolean;
    default_team_id?: string;
}

export interface Collaborator {
    id: string;
    full_name: string;
    email: string;
    numero_mecanografico?: string;
    title?: string;
    role: string;
    status: CollaboratorStatus;
    can_login: boolean;
    receives_notifications: boolean;
    entidade_id?: string;
    instituicao_id?: string;
    job_title_id?: string;
    job_title_name?: string;
    telemovel?: string;
    telefone_interno?: string;
    address?: string;
    address_line?: string;
    postal_code?: string;
    city?: string;
    locality?: string;
    nif?: string;
    date_of_birth?: string;
    admission_date?: string;
    photo_url?: string;
    password_updated_at?: string;
    preferences?: {
        tooltip_config?: TooltipConfig;
    };
    deactivation_reason_id?: string;
    deleted_at?: string;
}

export interface Equipment {
    id: string;
    brand_id: string;
    type_id: string;
    description: string;
    serial_number: string;
    inventory_number?: string;
    nome_na_rede?: string;
    mac_address_wifi?: string;
    mac_address_cabo?: string;
    status: EquipmentStatus;
    purchase_date?: string;
    warranty_end_date?: string;
    invoice_number?: string;
    requisition_number?: string;
    criticality?: CriticalityLevel;
    confidentiality?: CIARating;
    integrity?: CIARating;
    availability?: CIARating;
    supplier_id?: string;
    acquisition_cost?: number;
    expected_lifespan_years?: number;
    embedded_license_key?: string;
    installation_location?: string;
    is_loan: boolean;
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
    creation_date: string;
    modified_date: string;
    procurement_request_id?: string;
    deleted_at?: string;
}

export interface Assignment {
    id: string;
    equipment_id: string;
    collaborator_id?: string;
    entidade_id?: string;
    instituicao_id?: string;
    assigned_date: string;
    return_date?: string;
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
    instituicao_id: string;
    codigo: string;
    name: string;
    description?: string;
    email: string;
    nif?: string;
    website?: string;
    responsavel?: string;
    telefone?: string;
    telemovel?: string;
    telefone_interno?: string;
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
    request_date: string;
    finish_date?: string;
    collaborator_id: string;
    technician_id?: string;
    entidade_id?: string;
    instituicao_id?: string;
    team_id?: string;
    equipment_id?: string;
    software_license_id?: string;
    security_incident_type?: string;
    impact_criticality?: string;
    resolution_summary?: string;
    requester_supplier_id?: string;
    attachments?: { name: string; dataUrl: string }[];
    embedding?: number[];
    regulatory_status?: string;
    regulatory_24h_deadline?: string;
    regulatory_72h_deadline?: string;
}

export interface SoftwareLicense {
    id: string;
    product_name: string;
    license_key: string;
    total_seats: number;
    purchase_date?: string;
    expiry_date?: string;
    purchase_email?: string;
    invoice_number?: string;
    status: string;
    criticality: CriticalityLevel;
    supplier_id?: string;
    unit_cost?: number;
    is_oem: boolean;
    category_id?: string;
}

export interface LicenseAssignment {
    id: string;
    software_license_id: string;
    equipment_id: string;
    assigned_date: string;
    return_date?: string;
}

export interface Team {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    vacation_auto_reassign: boolean; 
    sla_pause_on_absence: boolean;
}

export interface TeamMember {
    id: string;
    team_id: string;
    collaborator_id: string;
}

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    timestamp: string;
    read: boolean;
}

export interface TooltipConfig {
    show_nome_na_rede: boolean;
    show_assigned_to: boolean;
    show_serial_number: boolean;
    show_collab_name: boolean;
    show_collab_job: boolean;
    show_collab_entity: boolean;
    show_collab_contact: boolean;
}

export const defaultTooltipConfig: TooltipConfig = {
    show_nome_na_rede: true,
    show_assigned_to: true,
    show_serial_number: true,
    show_collab_name: true,
    show_collab_job: true,
    show_collab_entity: true,
    show_collab_contact: true
};

export interface Vulnerability {
    id: string;
    cve_id: string;
    description: string;
    severity: CriticalityLevel;
    affected_software?: string;
    remediation?: string;
    status: string;
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
    type: string;
    restore_time_minutes?: number;
    tester_id: string;
    notes?: string;
    attachments?: { name: string; dataUrl: string }[];
}

export interface ResilienceTest {
    id: string;
    title: string;
    test_type: string;
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
    status: string;
    request_date: string;
    priority: 'Normal' | 'Urgente';
    resource_type: 'Hardware' | 'Software';
    specifications: any;
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
    is_private: boolean;
    team_id?: string;
    reminder_minutes?: number;
    created_by: string;
    created_at: string;
}

export interface Supplier {
    id: string;
    name: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    nif?: string;
    website?: string;
    address_line?: string;
    postal_code?: string;
    city?: string;
    locality?: string;
    is_iso27001_certified: boolean;
    iso_certificate_expiry?: string;
    risk_level: CriticalityLevel;
    is_active?: boolean;
    notes?: string;
    security_contact_email?: string;
    other_certifications?: { name: string; expiryDate: string }[];
    contracts?: SupplierContract[];
    contacts?: ResourceContact[];
    attachments?: { name: string; dataUrl: string }[];
}

export interface JobTitle {
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

export interface VulnerabilityScanConfig {
    includeEol: boolean;
    lookbackYears: number;
    customInstructions?: string;
}

export interface TicketActivity {
    id: string;
    ticket_id: string;
    technician_id: string;
    description: string;
    date: string;
    equipment_id?: string;
    software_license_id?: string;
}

export interface CollaboratorHistory {
    id: string;
    collaborator_id: string;
    entidade_id: string;
    start_date: string;
    end_date?: string;
}

export type TicketCategoryItem = ConfigItem & {
    is_active: boolean;
    default_team_id?: string;
    sla_warning_hours?: number;
    sla_critical_hours?: number;
    sla_working_days?: number; 
    is_security?: boolean;
};

export type SecurityIncidentTypeItem = ConfigItem & {
    description?: string;
    is_active: boolean;
};

export interface BusinessService {
    id: string;
    name: string;
    description?: string;
    criticality: CriticalityLevel;
    rto_goal?: string;
    owner_id?: string;
    status: ServiceStatus;
    external_provider_id?: string;
}

export enum ServiceStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo'
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
    Open = 'Open',
    InProgress = 'In Progress',
    Mitigated = 'Mitigated',
    Resolved = 'Resolved',
    FalsePositive = 'False Positive'
}

export enum LicenseStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo'
}

export interface SoftwareCategory extends ConfigItem {}

export interface SoftwareProduct {
    id: string;
    name: string;
    category_id: string;
}

export enum ProcurementStatus {
    Pending = 'Pendente',
    Approved = 'Aprovado',
    Rejected = 'Rejeitado',
    Ordered = 'Encomendado',
    Received = 'Recebido',
    Completed = 'Concluído'
}

export interface SupplierContract {
    id: string;
    ref_number: string;
    description: string;
    start_date: string;
    end_date: string;
    notice_period_days: number;
    exit_strategy?: string;
    supported_service_ids: string[];
    is_active: boolean;
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

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    user_email: string;
    details?: string;
}

export interface Holiday {
    id: string;
    name: string;
    start_date: string; 
    end_date?: string; 
    type: string; 
    is_recurring: boolean;
    collaborator_id?: string; 
    instituicao_id?: string; 
}

export interface HolidayType extends ConfigItem {}

export enum BackupType {
    Full = 'Full',
    Incremental = 'Incremental',
    Differential = 'Differential'
}

export enum ResilienceTestType {
    VulnerabilityScan = 'Vulnerability Scan',
    Pentest = 'Pentest',
    RedTeaming = 'Red Teaming',
    DRP = 'DRP (Recovery Test)'
}

export enum TrainingType {
    General = 'Geral / Awareness',
    Phishing = 'Phishing',
    Technical = 'Técnica / SOC',
    Privacy = 'Privacidade / RGPD'
}

export interface RuleCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
    value: any;
}

export interface RuleAction {
    type: 'ASSIGN_TEAM' | 'ASSIGN_USER' | 'SET_PRIORITY' | 'SET_STATUS' | 'UPDATE_FIELD' | 'SEND_EMAIL';
    value: any;
    target_field?: string;
}

export interface AutomationRule {
    id: string;
    name: string;
    description?: string;
    trigger_event: 'TICKET_CREATED' | 'EQUIPMENT_CREATED';
    conditions: RuleCondition[];
    actions: RuleAction[];
    priority: number;
    is_active: boolean;
    created_at: string;
}

export interface DiagnosticResult {
    module: string;
    status: 'Success' | 'Failure' | 'Warning';
    message: string;
}

export interface DocumentTemplate {
    id: string;
    name: string;
    type: 'equipment' | 'collaborator' | 'generic';
    template_json: any;
    is_active: boolean;
    created_at: string;
}

export interface DbPolicy {
    tablename: string;
    policyname: string;
    permissive: string;
    roles: string[];
    cmd: string;
    qual: string;
    with_check: string;
}

export interface DbTrigger {
    trigger_name: string;
    table_name: string;
    event_manipulation: string;
    action_statement: string;
    action_timing: string;
}

export interface DbFunction {
    function_name: string;
    schema_name: string;
    return_type: string;
    argument_types: string;
}
