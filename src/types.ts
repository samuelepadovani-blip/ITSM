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
  category: AssetCategory;
  assignedTechnician: string;
  level: string;
  criticality: 'Alta' | 'Media' | 'Critica';
  description: string;
}

export interface ITSMTicket {
  id: string;
  ticketId: string;
  timestamp: string;
  userMessage: string;
  asset: string;
  category: string;
  priority: PriorityLevel;
  sla: string;
  assignedTo: string;
  escalationT3: boolean;
  escalationT3Note: string;
  actionRequired: string;
  rawResponse: string;
  status: TicketStatus;
  updatedAt?: string;
  history?: Array<{
    timestamp: string;
    action: string;
    by: string;
  }>;
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
