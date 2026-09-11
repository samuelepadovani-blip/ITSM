export type AssetCategory = 'IT & Rete' | 'Gaming & Cassa' | 'Facility & Sicurezza' | 'Food & Beverage';

export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';

export type TicketStatus = 'Aperto' | 'In Lavorazione' | 'Escalato T3' | 'In Attesa Fornitore' | 'Risolto' | 'Chiuso';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  levels: string[];
  category: AssetCategory;
  assets: string[];
  specialDuty?: string;
  canCallVendors: boolean;
  avatarColor: string;
}

export interface AssetInfo {
  id: string;
  name: string;
  area: string;
  category: AssetCategory;
  assignedTechnician: string;
  level: string;
  criticality: 'Alta' | 'Media' | 'Critica';
  description: string;
  status?: 'Operativo' | 'In Manutenzione' | 'Guasto / Degradato';
  location?: string;
  serialNumber?: string;
}

export type TechnicianId = 'piccirilli' | 'benin' | 'padovani' | 'ayoub' | 'all';
export type AccountId = string;

export interface TechnicianPermissions {
  t1: boolean;
  t2: boolean;
  t3Vendor: boolean;
  coordination: boolean;
}

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  role: string;
  type: 'reporter' | 'technician';
  isAdmin?: boolean;
  level: string;
  technicianId?: string;
  category: AssetCategory | 'Operazioni Generali';
  competencyDescription: string;
  canCallVendors: boolean;
  avatarColor: string;
  email: string;
  password?: string;
  permissions?: TechnicianPermissions;
}

export interface TransferInfo {
  transferredAtIso: string;
  fromTechnicianId: string;
  fromName: string;
  toTechnicianId: string;
  toName: string;
  targetLevel: string;
  reason: string;
  escalatedToT3?: boolean;
}

export interface ITSMTicket {
  id: string;
  ticketId: string;
  timestamp: string;
  createdAtIso?: string;
  reporterName?: string;
  reporterZone?: string;
  reporterContact?: string;
  userMessage: string;
  asset: string;
  category: string;
  priority: PriorityLevel;
  sla: string;
  assignedTo: string;
  assignedTechnicianId?: 'piccirilli' | 'benin' | 'padovani' | 'ayoub';
  escalationT3: boolean;
  escalationT3Note: string;
  actionRequired: string;
  rawResponse?: string;
  status: TicketStatus;
  updatedAt?: string;
  notes?: string[];
  history?: Array<{
    timestamp: string;
    action: string;
    by: string;
  }>;
  lastTransfer?: TransferInfo;
}

export interface SLADefinition {
  level: PriorityLevel;
  label: string;
  description: string;
  responseTime: string;
  resolutionTime: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  examples: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  ticket?: ITSMTicket;
  isProcessing?: boolean;
}
