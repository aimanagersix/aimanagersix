

export enum EquipmentStatus {
  Stock = 'Stock',
  Operational = 'Operacional',
  Decommissioned = 'Abate',
  Warranty = 'Garantia',
}

export interface Brand {
  id: string;
  name: string;
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
}

export interface LicenseAssignment {
  id: string;
  softwareLicenseId: string;
  equipmentId: string;
  assignedDate: string;
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
