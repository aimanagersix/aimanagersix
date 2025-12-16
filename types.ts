
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

export interface Collaborator {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: CollaboratorStatus;
    canLogin: boolean;
    entidadeId?: string;
    instituicaoId?: string;
    numeroMecanografico?: string;
    telemovel?: string;
    telefoneInterno?: string;
    photoUrl?: string;
    job_title_id?: string;
    job_title_name?: string;
    address_line?: string;
    address?: string; // Legacy
    postal_code?: string;
    city?: string;
    locality?: string;
    dateOfBirth?: string;
    receivesNotifications?: boolean;
    preferences?: any;
    title?: string;
    nif?: string;
}

export enum CollaboratorStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo',
    Onboarding = 'Onboarding'
}

export interface Equipment {
    id: string;
    serialNumber: string;
    description: string;
    brandId: string;
    typeId: string;
    status: string;
    purchaseDate?: string;
    warrantyEndDate?: string;
    acquisitionCost?: number;
    inventoryNumber?: string;
    nomeNaRede?: string;
    macAddressWIFI?: string;
    macAddressCabo?: string;
    ip_address?: string;
    supplier_id?: string;
    invoiceNumber?: string;
    requisitionNumber?: string;
    parent_equipment_id?: string;
    os_version?: string;
    last_security_update?: string;
    firmware_version?: string;
    wwan_address?: string;
    bluetooth_address?: string;
    usb_thunderbolt_address?: string;
    ram_size?: string;
    disk_info?: string;
    cpu_info?: string;
    monitor_info?: string;
    manufacture_date?: string;
    embedded_license_key?: string;
    last_inventory_scan?: string;
    installationLocation?: string;
    isLoan?: boolean;
    criticality?: CriticalityLevel;
    confidentiality?: CIARating;
    integrity?: CIARating;
    availability?: CIARating;
    accounting_category_id?: string;
    conservation_state_id?: string;
    residual_value?: number;
    creationDate: string;
    modifiedDate: string;
    procurement_request_id?: string;
    expectedLifespanYears?: number;
}

export interface EquipmentType extends ConfigItem {
    default_team_id?: string;
    requiresNomeNaRede?: boolean;
    requiresMacWIFI?: boolean;
    requiresMacCabo?: boolean;
    requiresInventoryNumber?: boolean;
    requiresBackupTest?: boolean;
    requires_backup_test?: boolean;
    requiresbackuptest?: boolean;
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

export interface Brand extends ConfigItem {
    risk_level?: CriticalityLevel;
    is_iso27001_certified?: boolean;
    security_contact_email?: string;
}

export interface Instituicao {
    id: string;
    name: string;
    codigo: string;
    email?: string;
    telefone?: string;
    nif?: string;
    website?: string;
    address_line?: string;
    address?: string;
    postal_code?: string;
    city?: string;
    locality?: string;
    is_active?: boolean;
    contacts?: ResourceContact[];
}

export interface Entidade {
    id: string;
    name: string;
    codigo: string;
    instituicaoId: string;
    responsavel?: string;
    email?: string;
    telefone?: string;
    telemovel?: string;
    telefoneInterno?: string;
    nif?: string;
    website?: string;
    address_line?: string;
    address?: string;
    postal_code?: string;
    city?: string;
    locality?: string;
    description?: string;
    status: EntidadeStatus;
    contacts?: ResourceContact[];
}

export enum EntidadeStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo'
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

export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: TicketStatus;
    requestDate: string;
    finishDate?: string;
    collaboratorId: string; // requester
    technicianId?: string;
    team_id?: string;
    equipmentId?: string;
    entidadeId?: string;
    instituicaoId?: string;
    category?: string;
    priority?: string;
    requester_supplier_id?: string;
    supplier_id?: string; // external service provider linked
    securityIncidentType?: string;
    impactCriticality?: CriticalityLevel;
    impactConfidentiality?: CIARating;
    impactIntegrity?: CIARating;
    impactAvailability?: CIARating;
    resolution_summary?: string;
    attachments?: { name: string; dataUrl: string }[];
}

export enum TicketStatus {
    Requested = 'Pedido',
    InProgress = 'Em progresso',
    Finished = 'Finalizado',
    Cancelled = 'Cancelado'
}

export enum TicketCategory {
    Hardware = 'Hardware',
    Software = 'Software',
    Network = 'Rede',
    Access = 'Acessos',
    SecurityIncident = 'Incidente de Segurança',
    TechnicalFault = 'Falha Técnica',
    Other = 'Outro',
    Maintenance = 'Manutenção',
    RequestAccess = 'Pedido de Acesso'
}

export enum SecurityIncidentType {
    Ransomware = 'Ransomware',
    Phishing = 'Phishing',
    Malware = 'Malware',
    DDoS = 'DDoS',
    DataLeak = 'Fuga de Dados',
    UnauthorizedAccess = 'Acesso Não Autorizado',
    VulnerabilityExploit = 'Exploração de Vulnerabilidade',
    Other = 'Outro'
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
    status: string; // 'Ativo' | 'Inativo'
    purchaseDate?: string;
    expiryDate?: string;
    purchaseEmail?: string;
    invoiceNumber?: string;
    supplier_id?: string;
    unitCost?: number;
    is_oem?: boolean;
    category_id?: string;
    criticality?: CriticalityLevel;
    confidentiality?: CIARating;
    integrity?: CIARating;
    availability?: CIARating;
}

export interface LicenseAssignment {
    id: string;
    softwareLicenseId: string;
    equipmentId: string;
    assignedDate: string;
    returnDate?: string;
}

export enum LicenseStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo'
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

export interface TicketCategoryItem extends ConfigItem {
    default_team_id?: string;
    sla_warning_hours?: number;
    sla_critical_hours?: number;
    is_security?: boolean;
    is_active: boolean;
}

export interface SecurityIncidentTypeItem extends ConfigItem {
    description?: string;
    is_active: boolean;
}

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

export interface ServiceDependency {
    id: string;
    service_id: string;
    dependency_type?: string;
    notes?: string;
    equipment_id?: string;
    software_license_id?: string;
}

export enum ServiceStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo',
    Manutencao = 'Manutenção'
}

export enum EquipmentStatus {
    Operacional = 'Operacional',
    Stock = 'Stock',
    Garantia = 'Garantia',
    Abate = 'Abate',
    Empréstimo = 'Empréstimo',
    Acquisition = 'Aquisição',
    Decommissioned = 'Decommissioned'
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

export enum VulnerabilityStatus {
    Open = 'Open',
    InProgress = 'In Progress',
    Resolved = 'Resolved',
    Mitigated = 'Mitigated',
    FalsePositive = 'False Positive'
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

export interface BackupExecution {
    id: string;
    system_name: string;
    equipment_id?: string;
    type: BackupType;
    status: string; // 'Sucesso' | 'Falha' | 'Parcial'
    backup_date: string;
    test_date: string;
    tester_id: string;
    restore_time_minutes?: number;
    notes?: string;
    attachments?: { name: string; dataUrl: string }[];
}

export enum BackupType {
    Full = 'Full',
    Incremental = 'Incremental',
    Differential = 'Diferencial'
}

export interface ResilienceTest {
    id: string;
    title: string;
    test_type: ResilienceTestType;
    status: string; // 'Planeado' | 'Em Execução' | 'Concluído' | 'Cancelado'
    planned_date: string;
    executed_date?: string;
    auditor_entity?: string;
    auditor_supplier_id?: string;
    auditor_internal_entidade_id?: string;
    summary_findings?: string;
    attachments?: { name: string; dataUrl: string }[];
}

export enum ResilienceTestType {
    Pentest = 'Penetration Test',
    DRP = 'Disaster Recovery Plan',
    Tabletop = 'Tabletop Exercise',
    RedTeaming = 'Red Teaming',
    VulnerabilityScan = 'Vulnerability Scan'
}

export interface SecurityTrainingRecord {
    id: string;
    collaborator_id: string;
    training_type: string;
    completion_date: string;
    status: string; // 'Concluído' | 'Agendado'
    score?: number;
    notes?: string;
    duration_hours?: number;
}

export enum TrainingType {
    Phishing = 'Simulação Phishing',
    General = 'Consciencialização Geral',
    Gdpr = 'GDPR / RGPD',
    Technical = 'Técnica / Seg. Informação'
}

export interface Supplier {
    id: string;
    name: string;
    nif?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    website?: string;
    address_line?: string;
    address?: string; // legacy
    postal_code?: string;
    city?: string;
    locality?: string;
    risk_level: CriticalityLevel;
    is_iso27001_certified?: boolean;
    iso_certificate_expiry?: string;
    security_contact_email?: string;
    notes?: string;
    is_active?: boolean;
    attachments?: { name: string; dataUrl: string }[];
    other_certifications?: { name: string; expiryDate?: string }[];
    contracts?: SupplierContract[];
    contacts?: ResourceContact[];
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
    name: string;
    role: string;
    email?: string;
    phone?: string;
    title?: string;
    is_active?: boolean;
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
    accepted_at: string;
    version: string;
}

export interface ProcurementRequest {
    id: string;
    title: string;
    description: string;
    quantity: number;
    estimated_cost: number;
    requester_id: string;
    status: ProcurementStatus;
    priority: 'Normal' | 'Urgente';
    request_date: string;
    resource_type: 'Hardware' | 'Software';
    approval_date?: string;
    approver_id?: string;
    order_date?: string;
    received_date?: string;
    order_reference?: string;
    invoice_number?: string;
    supplier_id?: string;
    brand_id?: string;
    equipment_type_id?: string;
    software_category_id?: string;
    specifications?: any;
    attachments?: { name: string; dataUrl: string }[];
}

export enum ProcurementStatus {
    Pending = 'Pendente',
    Approved = 'Aprovado',
    Rejected = 'Rejeitado',
    Ordered = 'Encomendado',
    Received = 'Recebido',
    Completed = 'Concluído'
}

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    is_all_day?: boolean;
    is_private?: boolean;
    team_id?: string;
    created_by: string;
    color?: string;
    reminder_minutes?: number;
}

export interface ContinuityPlan {
    id: string;
    title: string;
    type: 'BCP' | 'DRP' | 'Crise';
    description?: string;
    service_id?: string;
    owner_id: string;
    document_url?: string;
    document_name?: string;
    last_review_date: string;
    next_review_date?: string;
    status?: string;
}

export interface DiagnosticResult {
    module: string;
    status: 'Success' | 'Failure' | 'Warning';
    message: string;
    details?: any;
}

export interface AuditLogEntry {
    id: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    details?: string;
    user_id?: string;
    user_email?: string;
    timestamp: string;
}

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    ACCESS_REVIEW = 'ACCESS_REVIEW',
    RISK_ACKNOWLEDGE = 'RISK_ACKNOWLEDGE',
    AUTO_SCAN = 'AUTO_SCAN',
    OFFBOARDING = 'OFFBOARDING'
}

export interface TooltipConfig {
    showNomeNaRede: boolean;
