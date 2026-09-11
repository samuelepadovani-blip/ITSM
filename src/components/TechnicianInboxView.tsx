import React, { useState } from 'react';
import { ITSMTicket, TicketStatus, UserAccount } from '../types';
import { USER_ACCOUNTS } from '../data/accountsData';
import { playNotificationChime } from '../utils/audio';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  Wrench, 
  ExternalLink, 
  PhoneCall, 
  UserCheck, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Send,
  MessageSquare,
  Building2,
  Gamepad2,
  Coffee,
  Laptop,
  ArrowRight,
  Plus,
  ArrowRightLeft,
  Lock,
  Users,
  LogOut,
  ShieldCheck,
  Filter,
  Search,
  X,
  KeyRound,
  UserPlus,
  Crown
} from 'lucide-react';

interface TechnicianInboxViewProps {
  tickets: ITSMTicket[];
  currentUser: UserAccount;
  onLogout: () => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus, note?: string) => void;
  onEscalateT3: (ticketId: string, note?: string) => void;
  onAddNote: (ticketId: string, note: string) => void;
  onOpenTransferModal: (ticket: ITSMTicket) => void;
  onAskAI?: (ticket: ITSMTicket) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  lastArrivedTicketId?: string | null;
  onOpenAdminRegisterModal?: () => void;
  onOpenChangePasswordModal?: () => void;
}

export const TechnicianInboxView: React.FC<TechnicianInboxViewProps> = ({
  tickets,
  currentUser,
  onLogout,
  onStatusChange,
  onEscalateT3,
  onAddNote,
  onOpenTransferModal,
  onAskAI,
  soundEnabled,
  onToggleSound,
  lastArrivedTicketId,
  onOpenAdminRegisterModal,
  onOpenChangePasswordModal,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 't3'>('pending');
  const [filterPriority, setFilterPriority] = useState<string>('Tutte');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [vendorRefInputs, setVendorRefInputs] = useState<Record<string, string>>({});

  const canCallVendors = Boolean(currentUser.permissions?.t3Vendor || currentUser.canCallVendors || currentUser.id === 'piccirilli');

  // Role & Competency Based Filtering
  const technicianTickets = tickets.filter((t) => {
    // 1. Direct assignment to this user
    if (t.assignedTechnicianId === currentUser.id || (t.assignedTo && t.assignedTo.toLowerCase().includes(currentUser.displayName.toLowerCase()))) {
      return true;
    }

    // 2. Coordination / Systems Manager
    if (currentUser.permissions?.coordination || currentUser.id === 'piccirilli') {
      if (t.category === 'IT' || t.escalationT3 === true || t.assignedTechnicianId === 'piccirilli') {
        return true;
      }
    }

    // 3. T3 Vendor authorized technicians see all tickets escalated to T3
    if (canCallVendors && t.escalationT3 === true) {
      return true;
    }

    // 4. Category matching for T2 specialists
    if (currentUser.permissions?.t2 && currentUser.category && currentUser.category !== 'Operazioni Generali') {
      const catMap: Record<string, string> = {
        'Gaming & Cassa': 'Gaming',
        'Facility & Sicurezza': 'Facility',
        'Food & Beverage': 'F&B',
        'IT & Rete': 'IT',
      };
      const catCode = catMap[currentUser.category] || currentUser.category;
      if (t.category === catCode || t.category === currentUser.category) {
        return true;
      }
    }

    // Known default demo accounts
    if (currentUser.id === 'benin') return t.assignedTechnicianId === 'benin' || t.category === 'Gaming';
    if (currentUser.id === 'padovani') return t.assignedTechnicianId === 'padovani' || t.category === 'Facility';
    if (currentUser.id === 'ayoub') return t.assignedTechnicianId === 'ayoub' || t.category === 'F&B';

    return false;
  });

  const pendingTickets = technicianTickets.filter(
    (t) => t.status === 'Aperto' || t.status === 'In Lavorazione' || t.status === 'Escalato T3' || t.status === 'In Attesa Fornitore'
  );
  const resolvedTickets = technicianTickets.filter((t) => t.status === 'Risolto' || t.status === 'Chiuso');
  
  // T3 tickets visible to authorized technicians
  const t3Tickets = technicianTickets.filter((t) => t.escalationT3 && t.status !== 'Chiuso');

  // Check for any tickets newly transferred to this technician
  const transferredToMeCount = technicianTickets.filter(
    (t) => t.lastTransfer?.toTechnicianId === currentUser.id && t.status !== 'Risolto' && t.status !== 'Chiuso'
  ).length;

  const handleNoteSubmit = (ticketId: string) => {
    const note = noteInputs[ticketId];
    if (note && note.trim()) {
      onAddNote(ticketId, note.trim());
      setNoteInputs((prev) => ({ ...prev, [ticketId]: '' }));
    }
  };

  const handleVendorCallConfirmed = (ticketId: string) => {
    const ref = vendorRefInputs[ticketId] || 'Chiamata autorizzata e aperta con ditta costruttrice';
    onStatusChange(ticketId, 'In Attesa Fornitore', `[T3 ${currentUser.displayName}] Contatto fornitore esterno registrato: ${ref}`);
    setVendorRefInputs((prev) => ({ ...prev, [ticketId]: '' }));
  };

  const getDepartmentIcon = (cat: string) => {
    switch (cat) {
      case 'Gaming & Cassa':
        return <Gamepad2 className="h-5 w-5 text-[#D4AF37]" />;
      case 'Facility & Sicurezza':
        return <Building2 className="h-5 w-5 text-emerald-400" />;
      case 'Food & Beverage':
        return <Coffee className="h-5 w-5 text-rose-400" />;
      default:
        return <Laptop className="h-5 w-5 text-blue-400" />;
    }
  };

  // Tab bar
  const currentTabTickets = activeTab === 'pending'
    ? pendingTickets
    : activeTab === 'resolved'
    ? resolvedTickets
    : t3Tickets;

  // Counts for each priority within current tab
  const countTutte = currentTabTickets.length;
  const countP1 = currentTabTickets.filter((t) => t.priority === 'P1').length;
  const countP2 = currentTabTickets.filter((t) => t.priority === 'P2').length;
  const countP3 = currentTabTickets.filter((t) => t.priority === 'P3').length;
  const countP4 = currentTabTickets.filter((t) => t.priority === 'P4').length;

  // Filtered tickets based on priority and search query
  const displayedTickets = currentTabTickets.filter((t) => {
    const matchesPriority = filterPriority === 'Tutte' || t.priority === filterPriority;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      t.ticketId.toLowerCase().includes(q) ||
      t.asset.toLowerCase().includes(q) ||
      t.actionRequired.toLowerCase().includes(q) ||
      t.userMessage.toLowerCase().includes(q) ||
      (t.assignedTo && t.assignedTo.toLowerCase().includes(q));
    return matchesPriority && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Banner: Account Identity & Competency Statement */}
      <div className="rounded-2xl border border-[#1A3166] bg-[#0A1636] p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0E1F4B] border border-[#1E3975] shadow-md">
              {getDepartmentIcon(currentUser.category)}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-0.5 text-xs font-semibold text-[#F3C64F] mb-1">
                <Lock className="h-3 w-3" />
                <span>Dashboard Personale con Segregazione Ruolo</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#F3C64F] tracking-tight flex items-center gap-2">
                <span>Postazione di {currentUser.displayName}</span>
              </h1>
              <p className="text-xs sm:text-sm text-blue-300/70">
                Ruolo: <strong className="text-blue-100">{currentUser.role}</strong> • Livello: <span className="text-[#F3C64F] font-mono font-semibold">{currentUser.level}</span>
              </p>
            </div>
          </div>

          {/* Sound Notification Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onToggleSound();
                if (!soundEnabled) playNotificationChime('P2');
              }}
              title={soundEnabled ? 'Disattiva avviso acustico' : 'Attiva avviso acustico arrivo ticket'}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold border transition ${
                soundEnabled
                  ? 'bg-[#D4AF37]/15 text-[#F3C64F] border-[#D4AF37]/40'
                  : 'bg-[#0E1F4B] text-blue-300 border-[#1A3166]'
              }`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-[#D4AF37]" /> : <VolumeX className="h-4 w-4" />}
              <span>{soundEnabled ? 'Audio: Attivo' : 'Audio: Muto'}</span>
            </button>

            <button
              onClick={() => playNotificationChime('P1')}
              className="rounded-xl border border-[#1A3166] bg-[#070F24] px-2.5 py-2 text-[11px] text-blue-300 hover:text-white transition"
              title="Test audio"
            >
              Test
            </button>
          </div>
        </div>

        {/* Competency Isolation Notice */}
        <div className="rounded-xl border border-[#1A3166] bg-[#070F24]/80 p-3.5 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <UserCheck className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-blue-100 block">
                Ambito di Competenza Riservato:
              </span>
              <p className="text-blue-300/70 text-[11px] leading-relaxed">
                {currentUser.competencyDescription}
              </p>
            </div>
          </div>

          {currentUser.canCallVendors ? (
            <span className="shrink-0 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/40 px-2.5 py-1 font-semibold text-[10px] flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              Abilitato T3 Fornitori
            </span>
          ) : (
            <span className="shrink-0 rounded-lg bg-[#0E1F4B] text-blue-200 border border-[#1E3975] px-2.5 py-1 text-[10px]">
              T2: Scala a Piccirilli per Fornitori
            </span>
          )}
        </div>

        {/* Authenticated Session & Security Boundary */}
        <div className="pt-2 border-t border-[#1A3166]/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-blue-200">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              Sessione autenticata per <strong className="text-white">{currentUser.displayName}</strong> ({currentUser.role}).
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Password Change Button for current admin */}
            <button
              onClick={onOpenChangePasswordModal}
              id="btn-inbox-change-pwd"
              className="flex items-center gap-1.5 rounded-xl border border-[#1A3166] bg-[#0E1F4B] hover:bg-[#1E3975] hover:border-[#D4AF37]/50 px-3 py-1.5 text-xs text-blue-100 font-semibold transition"
              title="Cambia la tua password di accesso"
            >
              <KeyRound className="h-3.5 w-3.5 text-[#F3C64F]" />
              <span>Modifica Password</span>
            </button>

            {/* Coordinator Register Admin Button - Only if user has coordination permission */}
            {(currentUser.permissions?.coordination || currentUser.id === 'piccirilli') && (
              <button
                onClick={onOpenAdminRegisterModal}
                id="btn-inbox-new-admin"
                className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/70 bg-gradient-to-r from-[#D4AF37]/20 via-[#F3C64F]/25 to-[#D4AF37]/20 hover:brightness-125 px-3 py-1.5 text-xs text-[#F3C64F] font-bold transition shadow-sm ring-1 ring-[#D4AF37]/40"
                title="Finestra riservata ai Coordinatori per registrare nuovi account Amministratori"
              >
                <Crown className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>Registra Nuovo Admin</span>
              </button>
            )}

            <button
              onClick={onLogout}
              id="btn-inbox-logout"
              className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/20 hover:bg-red-900/40 hover:border-red-500/60 px-3 py-1.5 text-xs text-red-300 font-semibold transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Disconnetti</span>
            </button>
          </div>
        </div>
      </div>

      {/* High-priority Transferred Alert Banner */}
      {transferredToMeCount > 0 && (
        <div className="rounded-xl border border-[#D4AF37]/50 bg-[#0A1636] p-4 shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-[#D4AF37] animate-ping"></div>
            <div>
              <span className="text-xs font-bold text-[#F3C64F] block">
                🔔 HAI {transferredToMeCount} TICKET TRASFERITI AL TUO LIVELLO
              </span>
              <p className="text-xs text-blue-100">
                Un collega ha spostato uno o più ticket alla tua competenza. Verifica i dettagli e la motivazione qui sotto.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#F3C64F] bg-[#070F24] px-2.5 py-1 rounded border border-[#D4AF37]/40">
            Trasferiti a te
          </span>
        </div>
      )}

      {/* Real-time Incoming Alert Highlight */}
      {lastArrivedTicketId && (
        <div className="rounded-xl border border-[#D4AF37]/50 bg-[#0A1636] p-4 shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-[#D4AF37] animate-pulse"></div>
            <div>
              <span className="text-xs font-bold text-[#F3C64F] block">
                🔔 NUOVO TICKET RICEVUTO LIVE
              </span>
              <p className="text-xs text-blue-100">
                Il ticket <strong className="text-[#F3C64F] font-mono">{lastArrivedTicketId}</strong> è attivo e sincronizzato sul server.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#F3C64F] bg-[#070F24] px-2.5 py-1 rounded border border-[#D4AF37]/40">
            Sincronizzato
          </span>
        </div>
      )}

      {/* Coordinator Dedicated Admin Registration Panel (Only for Piccirilli and coordinators) */}
      {(currentUser.permissions?.coordination || currentUser.id === 'piccirilli') && (
        <div 
          id="coordinator-admin-registration-banner"
          className="rounded-2xl border border-[#D4AF37]/60 bg-gradient-to-r from-[#070F24] via-[#0E1F4B] to-[#070F24] p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ring-1 ring-[#D4AF37]/30"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-black shadow-lg shadow-black/50">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Finestra Registrazione Nuovo Utente Admin
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F3C64F] border border-[#D4AF37]/40">
                  Riservato Coordinatori
                </span>
              </div>
              <p className="text-xs text-blue-200/90 mt-1 max-w-2xl">
                Funzione attiva per <strong>{currentUser.displayName}</strong>. Puoi registrare nuovi amministratori configurando le checkbox di livello (T1 Triage, T2 Specialista, T3 Fornitore) e l'abilitazione al Coordinamento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAdminRegisterModal}
            id="btn-open-admin-register-modal-banner"
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] hover:brightness-110 text-[#070F26] text-xs font-bold shadow-lg shadow-[#D4AF37]/20 transition active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span>Apri Registrazione Admin</span>
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A3166] pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-bold shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#F5D880]'
                : 'bg-[#0A1636] text-blue-200 border border-[#1A3166] hover:text-[#F3C64F]'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Da Gestire ({pendingTickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'resolved'
                ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-bold shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#F5D880]'
                : 'bg-[#0A1636] text-blue-200 border border-[#1A3166] hover:text-[#F3C64F]'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Risolti ({resolvedTickets.length})</span>
          </button>

          {/* Special T3 Tab for Piccirilli */}
          {currentUser.id === 'piccirilli' && (
            <button
              onClick={() => setActiveTab('t3')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeTab === 't3'
                  ? 'bg-purple-950/60 text-purple-300 border border-purple-500/50'
                  : 'bg-[#0A1636] text-blue-200 border border-[#1A3166] hover:text-[#F3C64F]'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-purple-400" />
              <span>Chiamate Fornitori Esterni T3 ({t3Tickets.length})</span>
            </button>
          )}
        </div>

        <span className="text-xs text-blue-300/70">
          Mostrati solo ticket di competenza <strong className="text-white">{currentUser.displayName}</strong>
        </span>
      </div>

      {/* Priority Filter & Search Bar */}
      <div className="rounded-2xl border border-[#1A3166] bg-[#0A1636] p-4 shadow-lg space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Priority filter buttons / pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-blue-300/80 mr-1 font-semibold">
              <Filter className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Priorità:</span>
            </div>

            {/* Select for mobile */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              aria-label="Filtra per priorità"
              className="sm:hidden rounded-lg border border-[#1A3166] bg-[#070F24] px-2.5 py-1.5 text-xs text-blue-200 focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="Tutte">Tutte ({countTutte})</option>
              <option value="P1">P1 - Critico ({countP1})</option>
              <option value="P2">P2 - Alto ({countP2})</option>
              <option value="P3">P3 - Medio ({countP3})</option>
              <option value="P4">P4 - Basso ({countP4})</option>
            </select>

            {/* Desktop / tablet button chips */}
            <div className="hidden sm:flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterPriority('Tutte')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border flex items-center gap-1.5 ${
                  filterPriority === 'Tutte'
                    ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-bold border-[#F5D880] shadow-sm'
                    : 'bg-[#070F24] border-[#1A3166] text-blue-200 hover:border-[#D4AF37]/40 hover:text-white'
                }`}
              >
                <span>Tutte</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  filterPriority === 'Tutte' ? 'bg-[#070F26]/30 text-[#070F26]' : 'bg-[#0E1F4B] text-blue-300'
                }`}>
                  {countTutte}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterPriority(filterPriority === 'P1' ? 'Tutte' : 'P1')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border flex items-center gap-1.5 ${
                  filterPriority === 'P1'
                    ? 'bg-red-600 text-white font-bold border-red-400 shadow-md shadow-red-950/50 ring-2 ring-red-500/40'
                    : countP1 > 0
                    ? 'bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/40'
                    : 'bg-[#070F24] border-[#1A3166] text-red-400/50 hover:border-red-500/30'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse"></span>
                <span>P1 - Critico</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  filterPriority === 'P1' ? 'bg-black/40 text-white' : 'bg-red-950 text-red-300 border border-red-500/30'
                }`}>
                  {countP1}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterPriority(filterPriority === 'P2' ? 'Tutte' : 'P2')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border flex items-center gap-1.5 ${
                  filterPriority === 'P2'
                    ? 'bg-[#D4AF37] text-[#070F26] font-bold border-[#F5D880] shadow-md shadow-[#D4AF37]/30 ring-2 ring-[#D4AF37]/40'
                    : countP2 > 0
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#F3C64F] hover:bg-[#D4AF37]/25'
                    : 'bg-[#070F24] border-[#1A3166] text-amber-400/50 hover:border-[#D4AF37]/30'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-[#F3C64F]"></span>
                <span>P2 - Alto</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  filterPriority === 'P2' ? 'bg-[#070F26]/30 text-[#070F26]' : 'bg-[#0E1F4B] text-[#F3C64F] border border-[#D4AF37]/30'
                }`}>
                  {countP2}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterPriority(filterPriority === 'P3' ? 'Tutte' : 'P3')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border flex items-center gap-1.5 ${
                  filterPriority === 'P3'
                    ? 'bg-blue-600 text-white font-bold border-blue-400 shadow-md shadow-blue-950/50 ring-2 ring-blue-500/40'
                    : countP3 > 0
                    ? 'bg-blue-950/40 border-blue-500/40 text-blue-300 hover:bg-blue-900/40'
                    : 'bg-[#070F24] border-[#1A3166] text-blue-400/50 hover:border-blue-500/30'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                <span>P3 - Medio</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  filterPriority === 'P3' ? 'bg-black/40 text-white' : 'bg-blue-950 text-blue-300 border border-blue-500/30'
                }`}>
                  {countP3}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterPriority(filterPriority === 'P4' ? 'Tutte' : 'P4')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border flex items-center gap-1.5 ${
                  filterPriority === 'P4'
                    ? 'bg-slate-400 text-[#070F26] font-bold border-slate-300 shadow-md ring-2 ring-slate-400/40'
                    : countP4 > 0
                    ? 'bg-slate-900/60 border-slate-600/40 text-slate-300 hover:bg-slate-800/60'
                    : 'bg-[#070F24] border-[#1A3166] text-slate-400/50 hover:border-slate-500/30'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                <span>P4 - Basso</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  filterPriority === 'P4' ? 'bg-black/40 text-white' : 'bg-slate-900 text-slate-300 border border-slate-600/30'
                }`}>
                  {countP4}
                </span>
              </button>
            </div>
          </div>

          {/* Quick search input & Active filter reset */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-blue-400/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca ticket, asset, problema..."
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] pl-9 pr-7 py-1.5 text-xs text-blue-100 placeholder-blue-400/40 focus:border-[#D4AF37] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-blue-400/60 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {(filterPriority !== 'Tutte' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setFilterPriority('Tutte');
                  setSearchQuery('');
                }}
                className="flex items-center gap-1 rounded-xl border border-[#1A3166] bg-[#070F24] px-2.5 py-1.5 text-xs text-blue-300 hover:text-[#F3C64F] hover:border-[#D4AF37]/40 transition shrink-0"
                title="Rimuovi tutti i filtri"
              >
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Azzera</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback on applied priority filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-blue-300/70 pt-2 border-t border-[#1A3166]/60">
          <div className="flex flex-wrap items-center gap-2">
            <span>Mostrati: <strong className="text-white font-mono">{displayedTickets.length}</strong> su <strong className="text-blue-200 font-mono">{currentTabTickets.length}</strong> ticket</span>
            {filterPriority !== 'Tutte' && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold border ${
                filterPriority === 'P1'
                  ? 'bg-red-950/60 text-red-300 border-red-500/40'
                  : filterPriority === 'P2'
                  ? 'bg-[#D4AF37]/15 text-[#F3C64F] border-[#D4AF37]/40'
                  : filterPriority === 'P3'
                  ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                  : 'bg-slate-900/60 text-slate-300 border-slate-600/40'
              }`}>
                Filtro Priorità attivo: <strong className="font-mono">{filterPriority}</strong>
                <button
                  type="button"
                  onClick={() => setFilterPriority('Tutte')}
                  className="hover:text-white ml-0.5"
                  title="Rimuovi filtro priorità"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-[#0E1F4B] text-blue-200 border border-blue-500/30 px-2 py-0.5 rounded-md">
                Testo: "{searchQuery}"
              </span>
            )}
          </div>

          {filterPriority !== 'Tutte' && (
            <button
              type="button"
              onClick={() => setFilterPriority('Tutte')}
              className="text-[#F3C64F] hover:underline font-medium text-xs"
            >
              Mostra tutte le priorità
            </button>
          )}
        </div>
      </div>

      {/* Ticket List for the Active Tab */}
      <div className="space-y-4">
        {activeTab === 'pending' && pendingTickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#1A3166] p-12 text-center text-blue-300/60 space-y-2">
            <CheckCircle2 className="h-9 w-9 mx-auto text-emerald-400" />
            <h3 className="text-sm font-semibold text-blue-100">
              Nessun ticket in sospeso per {currentUser.displayName}!
            </h3>
            <p className="text-xs max-w-sm mx-auto">
              Tutti i ticket di tua competenza ({currentUser.category}) sono stati gestiti. I ticket degli altri reparti sono segregati.
            </p>
          </div>
        )}

        {activeTab === 'resolved' && resolvedTickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#1A3166] p-12 text-center text-blue-300/60">
            <p className="text-sm font-semibold text-blue-200">Nessun ticket archiviato come risolto in questa postazione.</p>
          </div>
        )}

        {activeTab === 't3' && t3Tickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#1A3166] p-12 text-center text-blue-300/60">
            <p className="text-sm font-semibold text-blue-200">Nessun ticket attualmente escalato a ditte fornitrici esterne.</p>
          </div>
        )}

        {/* Empty filter results when tickets exist in tab but none match priority / query */}
        {currentTabTickets.length > 0 && displayedTickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#1A3166] p-10 text-center text-blue-300/60 space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-[#D4AF37]" />
            <h3 className="text-sm font-semibold text-blue-100">
              {filterPriority !== 'Tutte'
                ? `Nessun ticket con priorità "${filterPriority}" trovato in questa sezione`
                : 'Nessun ticket corrisponde ai filtri di ricerca'}
            </h3>
            <p className="text-xs max-w-sm mx-auto">
              {filterPriority !== 'Tutte'
                ? `Ci sono altri ${currentTabTickets.length} ticket in questa sezione con diversi livelli di priorità.`
                : 'Prova a modificare o azzerare i parametri inseriti.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterPriority('Tutte');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#0E1F4B] px-4 py-2 text-xs font-semibold text-[#F3C64F] hover:bg-[#D4AF37]/20 transition"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reimposta Filtro Priorità</span>
            </button>
          </div>
        )}

        {/* Render Cards */}
        {displayedTickets.map((ticket) => {
          const isNewlyArrived = ticket.ticketId === lastArrivedTicketId;
          const isTransferredToMe = ticket.lastTransfer?.toTechnicianId === currentUser.id;

          return (
            <div
              key={ticket.id || ticket.ticketId}
              className={`rounded-2xl border p-5 sm:p-6 transition shadow-xl space-y-4 ${
                isTransferredToMe
                  ? 'border-[#D4AF37]/60 bg-[#0A1636] ring-2 ring-[#D4AF37]/20'
                  : isNewlyArrived
                  ? 'border-[#D4AF37]/50 bg-[#0A1636] ring-2 ring-[#D4AF37]/30'
                  : ticket.priority === 'P1'
                  ? 'border-red-500/40 bg-[#0A1636]/95'
                  : ticket.escalationT3
                  ? 'border-purple-500/40 bg-[#0A1636]/95'
                  : 'border-[#1A3166] bg-[#0A1636]/95'
              }`}
            >
              {/* Header Info */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-white text-base">
                      {ticket.ticketId}
                    </span>

                    {/* Priority Badge */}
                    <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold font-mono border ${
                      ticket.priority === 'P1'
                        ? 'bg-rose-950/50 text-rose-300 border-rose-500/50 ring-1 ring-rose-500/30'
                        : ticket.priority === 'P2'
                        ? 'bg-[#D4AF37]/15 text-[#F3C64F] border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/20'
                        : 'bg-[#0E1F4B] text-blue-200 border-[#1E3975]'
                    }`}>
                      {ticket.priority} - {ticket.sla.split('-')[0]}
                    </span>

                    {/* Status Badge */}
                    <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold border ${
                      ticket.status === 'Risolto'
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                        : ticket.status === 'In Lavorazione'
                        ? 'bg-[#D4AF37]/15 text-[#F3C64F] border-[#D4AF37]/40 font-semibold'
                        : ticket.status === 'Escalato T3' || ticket.status === 'In Attesa Fornitore'
                        ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                        : 'bg-[#0E1F4B] text-[#F3C64F] border-[#D4AF37]/30'
                    }`}>
                      {ticket.status}
                    </span>

                    {ticket.escalationT3 && (
                      <span className="rounded-md bg-purple-950/60 px-2 py-0.5 text-[11px] font-bold text-purple-300 border border-purple-500/40">
                        ⚡ Escalation T3
                      </span>
                    )}

                    {isTransferredToMe && (
                      <span className="rounded-md bg-[#D4AF37]/20 px-2 py-0.5 text-[11px] font-bold text-[#F3C64F] border border-[#D4AF37]/40 animate-pulse">
                        🔄 Ricevuto per Trasferimento
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-blue-300/70 flex flex-wrap items-center gap-2">
                    <span>Segnalato da: <strong className="text-blue-100">{ticket.reporterName || 'Operatore'}</strong></span>
                    <span>•</span>
                    <span>Zona: <strong className="text-blue-100">{ticket.reporterZone || 'Generale'}</strong></span>
                    <span>•</span>
                    <span className="font-mono">{ticket.timestamp}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-blue-300/70 block uppercase">Assegnato a:</span>
                  <span className="text-xs font-bold text-[#F3C64F]">{ticket.assignedTo}</span>
                </div>
              </div>

              {/* Transfer Details Callout if present */}
              {ticket.lastTransfer && (
                <div className="rounded-xl border border-[#D4AF37]/40 bg-[#070F24]/80 p-3 flex items-start gap-2.5 text-xs">
                  <ArrowRightLeft className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-[#F3C64F] font-semibold">
                        Spostamento Livello: Da {ticket.lastTransfer.fromName} a {ticket.lastTransfer.toName} [{ticket.lastTransfer.targetLevel}]
                      </strong>
                      <span className="text-[10px] text-blue-300/60 font-mono">
                        {new Date(ticket.lastTransfer.transferredAtIso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-blue-200 text-[11px]">
                      <strong>Motivo specificato:</strong> "{ticket.lastTransfer.reason}"
                    </p>
                  </div>
                </div>
              )}

              {/* Problem Content Box */}
              <div className="rounded-xl border border-[#1A3166] bg-[#070F24]/80 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-blue-300/70">
                  <span className="font-semibold text-blue-100">Asset: <strong className="text-white">{ticket.asset}</strong></span>
                  <span className="font-mono text-[11px]">{ticket.sla}</span>
                </div>

                <p className="text-sm text-blue-100 leading-relaxed font-sans">
                  "{ticket.userMessage}"
                </p>

                <div className="pt-2 border-t border-[#1A3166]/80 text-xs text-blue-300/70 flex items-start gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span><strong>Azione Suggerita:</strong> {ticket.actionRequired}</span>
                </div>
              </div>

              {/* T3 Escalation Callout if present */}
              {ticket.escalationT3 && (
                <div className="rounded-xl border border-purple-500/40 bg-purple-950/30 p-3.5 text-xs text-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-purple-300">
                      <ShieldAlert className="h-4 w-4" />
                      Intervento Fornitore Esterno (T3) Centralizzato su Piccirilli
                    </span>
                    <span className="font-mono text-[10px] text-purple-300/80">Regola di Governance</span>
                  </div>
                  <p className="text-blue-200 text-xs">
                    {ticket.escalationT3Note}
                  </p>

                  {/* Supplier Phone Action for T3 Authorized Personnel */}
                  {canCallVendors && ticket.status !== 'Risolto' && (
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Rif. Chiamata Ditta / N. Richiesta fornitore..."
                        value={vendorRefInputs[ticket.ticketId] || ''}
                        onChange={(e) =>
                          setVendorRefInputs((prev) => ({ ...prev, [ticket.ticketId]: e.target.value }))
                        }
                        className="rounded-lg border border-purple-500/40 bg-[#070F24] px-3 py-1.5 text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-purple-400 flex-1 min-w-[200px]"
                      />
                      <button
                        onClick={() => handleVendorCallConfirmed(ticket.ticketId)}
                        className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs font-bold text-white transition shadow-sm"
                      >
                        <PhoneCall className="h-3 w-3" />
                        <span>Registra Chiamata Ditta</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1A3166]">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status update buttons */}
                  {ticket.status === 'Aperto' && (
                    <button
                      onClick={() => onStatusChange(ticket.ticketId, 'In Lavorazione')}
                      className="rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] hover:brightness-110 px-3.5 py-1.5 text-xs font-bold text-[#070F26] transition shadow-md shadow-[#D4AF37]/20"
                    >
                      Prendi in Carico
                    </button>
                  )}

                  {ticket.status === 'In Lavorazione' && (
                    <button
                      onClick={() => onStatusChange(ticket.ticketId, 'Risolto', 'Intervento tecnico completato con successo sul posto')}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Segna Risolto</span>
                    </button>
                  )}

                  {/* Move Level / Transfer Button (Requested explicitly by the user!) */}
                  {ticket.status !== 'Risolto' && ticket.status !== 'Chiuso' && (
                    <button
                      onClick={() => onOpenTransferModal(ticket)}
                      className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold text-[#F3C64F] hover:bg-[#D4AF37]/20 transition shadow-sm"
                      title="Sposta questo ticket a un altro livello o tecnico e invia una notifica immediata"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 text-[#D4AF37]" />
                      <span>Sposta Livello / Riassegna</span>
                    </button>
                  )}

                  {/* Escalate to T3 Vendors (if not yet escalated and current user is not authorized for T3) */}
                  {!ticket.escalationT3 && !canCallVendors && ticket.status !== 'Risolto' && (
                    <button
                      onClick={() => onEscalateT3(ticket.ticketId, 'Richiesta ditta costruttrice o ricambio originale')}
                      className="flex items-center gap-1 rounded-xl border border-purple-500/40 bg-purple-950/20 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/30 transition"
                      title="Trasferisci a referente autorizzato T3 per attivazione fornitore esterno"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-purple-400" />
                      <span>Richiedi Escalation T3</span>
                    </button>
                  )}

                  {/* Ask AI Assistant (Chiedi all'Assistente AI) */}
                  {onAskAI && (
                    <button
                      onClick={() => onAskAI(ticket)}
                      className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold text-[#F3C64F] hover:bg-[#D4AF37]/20 transition shadow-sm"
                      title="Inoltra la segnalazione all'Assistente AI per diagnosi tecnica immediata e supporto operativo"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                      <span>Chiedi ad Assistente AI</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-blue-300/60 font-mono">
                  SLA: {ticket.priority === 'P1' ? '15m / 2h' : ticket.priority === 'P2' ? '30m / 4h' : '1h / 8h'}
                </span>
              </div>

              {/* Note / History Accordion */}
              <div className="space-y-2 pt-2">
                {ticket.notes && ticket.notes.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-blue-300/70">Note Tecniche Registrate:</span>
                    <div className="space-y-1">
                      {ticket.notes.map((note, idx) => (
                        <div key={idx} className="rounded-lg bg-[#070F24]/80 px-3 py-1.5 text-xs text-blue-200 border border-[#1A3166] font-mono">
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add note input */}
                {ticket.status !== 'Risolto' && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Aggiungi una nota operativa..."
                      value={noteInputs[ticket.ticketId] || ''}
                      onChange={(e) =>
                        setNoteInputs((prev) => ({ ...prev, [ticket.ticketId]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNoteSubmit(ticket.ticketId);
                      }}
                      className="rounded-xl border border-[#1A3166] bg-[#070F24] px-3 py-1.5 text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-[#D4AF37] flex-1"
                    />
                    <button
                      onClick={() => handleNoteSubmit(ticket.ticketId)}
                      className="rounded-xl border border-[#1A3166] bg-[#0E1F4B] px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-[#152B66] hover:text-white transition"
                    >
                      Aggiungi Nota
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
