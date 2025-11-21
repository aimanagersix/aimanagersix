

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

// --- Supplier / Vendor Risk Management (NIS2) ---
export interface Supplier {
    id: string;
    name: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    nif?: string;
    website?: string;
    notes?: string;
    address?: string; // New field
    attachments?: { name: string; dataUrl: string }[]; // New field
    // Security Fields
    is_iso27001_certified: boolean;
    iso_certificate_expiry?: string; // New field for certificate validity
    security_contact_email?: string;
    risk_level: CriticalityLevel; // Vendor Risk Rating
}

export interface EquipmentType {
  id: string;
  name: string;
  requiresNomeNaRede?: boolean;
  requiresMacWIFI?: boolean;
  requiresMacCabo?: boolean;
  requiresInventoryNumber?: boolean;
  default_team_id?: string;
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
}

export interface Instituicao {
  id: string;
  codigo: string;
  name: string;
  email: string;
  telefone: string;
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
  responsavel?: string;
  telefone?: string;
  telemovel?: string;
  telefoneInterno?: string;
  status: EntidadeStatus;
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
  telefoneInterno?: string;
  telemovel?: string;
  photoUrl?: string;
  dateOfBirth?: string;
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
  
  // NIS2 Incident Response Fields
  category?: string; // Changed to string to support dynamic categories
  securityIncidentType?: string; // Changed to string to support dynamic types
  impactCriticality?: CriticalityLevel; // Specific to this incident
  impactConfidentiality?: CIARating; // Was confidentiality compromised?
  impactIntegrity?: CIARating;      // Was integrity compromised?
  impactAvailability?: CIARating;   // Was availability compromised?
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

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'ACCESS_REVIEW';

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
