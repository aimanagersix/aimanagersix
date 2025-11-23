

export enum EquipmentStatus {
  Stock = 'Stock',
  Operational = 'Operacional',
  Decommissioned = 'Abate',
  Warranty = 'Garantia',
}

export enum CriticalityLevel {
    Low = 'Baixa',
    Medium = 'Média',
    High = 'Alta',
    Critical = 'Crítica',
}

export enum CIARating {
    Low = 'Baixo',
    Medium = 'Médio',
    High = 'Alto',
}

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

export interface SupplierContact {
    id: string;
    supplier_id: string;
    name: string;
    role: string; // 'Comercial', 'Técnico', 'Financeiro', 'DPO/CISO'
    email: string;
    phone?: string;
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
    contacts?: SupplierContact[];
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
}

export interface Equipment {
  id:string;
  brandId: string;
  typeId: string;
  description: string;
  serialNumber: string;
  inventoryNumber?: string;
  invoiceNumber?: string;
  nomeNaRede?: string;
  macAddressWIFI?: string;
  macAddressCabo?: string;
  purchaseDate: string;
  warrantyEndDate?: string;
  creationDate: string;
  modifiedDate: string;
  status: EquipmentStatus;
  // NIS2 Compliance Fields
  criticality?: CriticalityLevel;
  confidentiality?: CIARating;
  integrity?: CIARating;
  availability?: CIARating;
  // Security & Patching
  os_version?: string;
  last_security_update?: string;
  // Vendor Link
  supplier_id?: string;
  
  // FinOps Fields
  acquisitionCost?: number; // Cost in EUR
  expectedLifespanYears?: number; // e.g. 4 years
}

export interface Instituicao {
  id: string;
  codigo: string;
  name: string;
  email: string;
  telefone: string;
  nif?: string;
  // Address
  address?: string;
  address_line?: string;
  postal_code?: string;
  city?: string;
  locality?: string;
}

export enum EntidadeStatus {
  Ativo = 'Ativo',
  Inativo = 'Inativo',
}

export interface Entidade {
  id: string;
  instituicaoId: string;
  codigo: string;
  name: string;
  description: string;
  email: string;
  nif?: string;
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
}

export enum UserRole {
    Admin = 'Admin',
    Normal = 'Normal',
    Basic = 'Básico',
    Utilizador = 'Utilizador',
}

export enum CollaboratorStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo',
}

export type AppModule = 'inventory' | 'organization' | 'collaborators' | 'licensing' | 'tickets' | 'bia' | 'security';

export interface Collaborator {
  id: string;
  numeroMecanografico: string;
  fullName: string;
  entidadeId: string;
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
  role: UserRole;
  status: CollaboratorStatus;
  password?: string;
  allowedModules?: AppModule[];
}

export interface Assignment {
  id: string;
  equipmentId: string;
  entidadeId: string;
  collaboratorId?: string;
  assignedDate: string;
  returnDate?: string;
}

export enum TicketStatus {
  Requested = 'Pedido',
  InProgress = 'Em progresso',
  Finished = 'Finalizado',
}

// Deprecated: Use dynamic categories from DB, keeping for fallback
export enum TicketCategory {
    TechnicalFault = 'Falha Técnica',
    AccessRequest = 'Pedido de Acesso',
    SecurityIncident = 'Incidente de Segurança',
    GeneralSupport = 'Suporte Geral',
    Maintenance = 'Manutenção'
}

// Deprecated: Use dynamic types from DB, keeping for fallback
export enum SecurityIncidentType {
    Ransomware = 'Ransomware',
    Phishing = 'Phishing / Engenharia Social',
    DataLeak = 'Fuga de Dados (Data Leak)',
    Malware = 'Malware / Vírus',
    DDoS = 'Negação de Serviço (DDoS)',
    UnauthorizedAccess = 'Acesso Não Autorizado / Compromisso de Conta',
    InsiderThreat = 'Ameaça Interna',
    VulnerabilityExploit = 'Exploração de Vulnerabilidade',
    Other = 'Outro'
}

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
  impactCriticality?: CriticalityLevel; // Specific to this incident
  impactConfidentiality?: CIARating; // Was confidentiality compromised?
  impactIntegrity?: CIARating;      // Was integrity compromised?
  impactAvailability?: CIARating;   // Was availability compromised?
  
  // KB / RAG Fields
  resolution_summary?: string; // For AI Knowledge Base

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

export enum LicenseStatus {
  Ativo = 'Ativo',
  Inativo = 'Inativo',
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

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'ACCESS_REVIEW' | 'RISK_ACKNOWLEDGE';

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

export enum ServiceStatus {
    Ativo = 'Ativo',
    Inativo = 'Inativo',
    EmManutencao = 'Em Manutenção'
}

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

export enum VulnerabilityStatus {
    Open = 'Aberto',
    InProgress = 'Em Análise',
    Mitigated = 'Mitigado',
    Resolved = 'Resolvido',
    FalsePositive = 'Falso Positivo'
}

export interface Vulnerability {
    id: string;
    cve_id: string; // e.g., CVE-2024-1234
    description: string;
    severity: CriticalityLevel;
    status: VulnerabilityStatus;
    affected_software?: string;
    remediation?: string;
    published_date?: string;
}

// --- Backup & Restore Testing (NIS2) ---

export enum BackupType {
    Full = 'Completo',
    Incremental = 'Incremental',
    Differential = 'Diferencial',
    Snapshot = 'Snapshot VM'
}

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

export enum TrainingType {
    PhishingSimulation = 'Simulação Phishing',
    SecurityPolicy = 'Leitura Política Segurança',
    CyberHygiene = 'Higiene Cibernética (Geral)',
    GDPR = 'RGPD / Privacidade',
    SpecificTool = 'Ferramenta Específica'
}

export interface SecurityTrainingRecord {
    id: string;
    collaborator_id: string;
    training_type: TrainingType;
    completion_date: string;
    status: 'Concluído' | 'Pendente' | 'Falhou';
    score?: number; // e.g. 80/100
    notes?: string;
    valid_until?: string; // For recurring training
}

// --- DORA Resilience Testing ---

export enum ResilienceTestType {
    VulnerabilityScan = 'Scan Vulnerabilidades',
    PenetrationTest = 'Penetration Test (Pentest)',
    TLPT = 'TLPT (Red Teaming)',
    TabletopExercise = 'Exercício de Mesa (DRP)',
    DisasterRecovery = 'Recuperação de Desastres (Full)'
}

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