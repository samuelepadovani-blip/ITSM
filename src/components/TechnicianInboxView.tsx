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
  ShieldCheck
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
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 't3'>('pending');
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
        return <Gamepad2 className="h-5 w-5 text-amber-400" />;
      case 'Facility & Sicurezza':
        return <Building2 className="h-5 w-5 text-emerald-400" />;
      case 'Food & Beverage':
        return <Coffee className="h-5 w-5 text-rose-400" />;
      default:
        return <Laptop className="h-5 w-5 text-blue-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Banner: Account Identity & Competency Statement */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 shadow-md">
              {getDepartmentIcon(currentUser.category)}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-xs font-semibold text-cyan-400 mb-1">
                <Lock className="h-3 w-3" />
                <span>Dashboard Personale con Segregazione Ruolo</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Postazione di {currentUser.displayName}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Ruolo: <strong className="text-slate-200">{currentUser.role}</strong> • Livello: <span className="text-cyan-400 font-mono">{currentUser.level}</span>
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
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4" />}
              <span>{soundEnabled ? 'Audio: Attivo' : 'Audio: Muto'}</span>
            </button>

            <button
              onClick={() => playNotificationChime('P1')}
              className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-2 text-[11px] text-slate-400 hover:text-white transition"
              title="Test audio"
            >
              Test
            </button>
          </div>
        </div>

        {/* Competency Isolation Notice */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-3.5 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <UserCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200 block">
                Ambito di Competenza Riservato:
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {currentUser.competencyDescription}
              </p>
            </div>
          </div>

          {currentUser.canCallVendors ? (
            <span className="shrink-0 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-1 font-semibold text-[10px] flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              Abilitato T3 Fornitori
            </span>
          ) : (
            <span className="shrink-0 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 text-[10px]">
              T2: Scala a Piccirilli per Fornitori
            </span>
          )}
        </div>

        {/* Authenticated Session & Security Boundary */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              Sessione autenticata per <strong className="text-white">{currentUser.displayName}</strong> ({currentUser.role}). Visibilità rigorosamente segregata.
            </span>
          </div>

          <button
            onClick={onLogout}
            id="btn-inbox-logout"
            className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/20 hover:bg-red-900/40 hover:border-red-500/60 px-3 py-1.5 text-xs text-red-300 font-semibold transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Disconnetti (Logout)</span>
          </button>
        </div>
      </div>

      {/* High-priority Transferred Alert Banner */}
      {transferredToMeCount > 0 && (
        <div className="rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 p-4 shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-amber-400 animate-ping"></div>
            <div>
              <span className="text-xs font-bold text-amber-300 block">
                🔔 HAI {transferredToMeCount} TICKET TRASFERITI AL TUO LIVELLO
              </span>
              <p className="text-xs text-slate-300">
                Un collega ha spostato uno o più ticket alla tua competenza. Verifica i dettagli e la motivazione qui sotto.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/40">
            Trasferiti a te
          </span>
        </div>
      )}

      {/* Real-time Incoming Alert Highlight */}
      {lastArrivedTicketId && (
        <div className="rounded-xl border border-cyan-500/60 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 p-4 shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse"></div>
            <div>
              <span className="text-xs font-bold text-cyan-300 block">
                🔔 NUOVO TICKET RICEVUTO LIVE
              </span>
              <p className="text-xs text-slate-300">
                Il ticket <strong className="text-white font-mono">{lastArrivedTicketId}</strong> è attivo e sincronizzato sul server.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30">
            Sincronizzato
          </span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'pending'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Da Gestire ({pendingTickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'resolved'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
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
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-purple-400" />
              <span>Chiamate Fornitori Esterni T3 ({t3Tickets.length})</span>
            </button>
          )}
        </div>

        <span className="text-xs text-slate-400">
          Mostrati solo ticket di competenza <strong className="text-white">{currentUser.displayName}</strong>
        </span>
      </div>

      {/* Ticket List for the Active Tab */}
      <div className="space-y-4">
        {activeTab === 'pending' && pendingTickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="h-9 w-9 mx-auto text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-300">
              Nessun ticket in sospeso per {currentUser.displayName}!
            </h3>
            <p className="text-xs max-w-sm mx-auto">
              Tutti i ticket di tua competenza ({currentUser.category}) sono stati gestiti. I ticket degli altri reparti sono segregati.
            </p>
          </div>
        )}

        {activeTab === 'resolved' && resolvedTickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-400">Nessun ticket archiviato come risolto in questa postazione.</p>
          </div>
        )}

        {activeTab === 't3' && t3Tickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-400">Nessun ticket attualmente escalato a ditte fornitrici esterne.</p>
          </div>
        )}

        {/* Render Cards */}
        {((activeTab === 'pending' ? pendingTickets : activeTab === 'resolved' ? resolvedTickets : t3Tickets)).map((ticket) => {
          const isNewlyArrived = ticket.ticketId === lastArrivedTicketId;
          const isTransferredToMe = ticket.lastTransfer?.toTechnicianId === currentUser.id;

          return (
            <div
              key={ticket.id || ticket.ticketId}
              className={`rounded-2xl border p-5 sm:p-6 transition shadow-xl space-y-4 ${
                isTransferredToMe
                  ? 'border-amber-500/80 bg-slate-900 ring-2 ring-amber-500/30'
                  : isNewlyArrived
                  ? 'border-cyan-400/80 bg-slate-900 ring-2 ring-cyan-500/40'
                  : ticket.priority === 'P1'
                  ? 'border-red-500/40 bg-slate-900/90'
                  : ticket.escalationT3
                  ? 'border-purple-500/40 bg-slate-900/90'
                  : 'border-slate-800 bg-slate-900/90'
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
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : ticket.priority === 'P2'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    }`}>
                      {ticket.priority} - {ticket.sla.split('-')[0]}
                    </span>

                    {/* Status Badge */}
                    <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold border ${
                      ticket.status === 'Risolto'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : ticket.status === 'In Lavorazione'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : ticket.status === 'Escalato T3' || ticket.status === 'In Attesa Fornitore'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {ticket.status}
                    </span>

                    {ticket.escalationT3 && (
                      <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[11px] font-bold text-purple-300 border border-purple-500/40">
                        ⚡ Escalation T3
                      </span>
                    )}

                    {isTransferredToMe && (
                      <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/40 animate-pulse">
                        🔄 Ricevuto per Trasferimento
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                    <span>Segnalato da: <strong className="text-slate-200">{ticket.reporterName || 'Operatore'}</strong></span>
                    <span>•</span>
                    <span>Zona: <strong className="text-slate-200">{ticket.reporterZone || 'Generale'}</strong></span>
                    <span>•</span>
                    <span className="font-mono">{ticket.timestamp}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block uppercase">Assegnato a:</span>
                  <span className="text-xs font-bold text-cyan-300">{ticket.assignedTo}</span>
                </div>
              </div>

              {/* Transfer Details Callout if present */}
              {ticket.lastTransfer && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 flex items-start gap-2.5 text-xs">
                  <ArrowRightLeft className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-amber-300 font-semibold">
                        Spostamento Livello: Da {ticket.lastTransfer.fromName} a {ticket.lastTransfer.toName} [{ticket.lastTransfer.targetLevel}]
                      </strong>
                      <span className="text-[10px] text-amber-400/80 font-mono">
                        {new Date(ticket.lastTransfer.transferredAtIso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-amber-100/90 text-[11px]">
                      <strong>Motivo specificato:</strong> "{ticket.lastTransfer.reason}"
                    </p>
                  </div>
                </div>
              )}

              {/* Problem Content Box */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Asset: <strong className="text-white">{ticket.asset}</strong></span>
                  <span className="font-mono text-[11px]">{ticket.sla}</span>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  "{ticket.userMessage}"
                </p>

                <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400 flex items-start gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Azione Suggerita:</strong> {ticket.actionRequired}</span>
                </div>
              </div>

              {/* T3 Escalation Callout if present */}
              {ticket.escalationT3 && (
                <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-3.5 text-xs text-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-purple-300">
                      <ShieldAlert className="h-4 w-4" />
                      Intervento Fornitore Esterno (T3) Centralizzato su Piccirilli
                    </span>
                    <span className="font-mono text-[10px] text-purple-300/80">Regola di Governance</span>
                  </div>
                  <p className="text-slate-300 text-xs">
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
                        className="rounded-lg border border-purple-500/40 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 flex-1 min-w-[200px]"
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
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status update buttons */}
                  {ticket.status === 'Aperto' && (
                    <button
                      onClick={() => onStatusChange(ticket.ticketId, 'In Lavorazione')}
                      className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm"
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
                      className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/40 transition shadow-sm"
                      title="Sposta questo ticket a un altro livello o tecnico e invia una notifica immediata"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 text-cyan-400" />
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
                      className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-900/50 hover:border-indigo-400 transition shadow-sm"
                      title="Inoltra la segnalazione all'Assistente AI per diagnosi tecnica immediata e supporto operativo"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Chiedi ad Assistente AI</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-slate-500 font-mono">
                  SLA: {ticket.priority === 'P1' ? '15m / 2h' : ticket.priority === 'P2' ? '30m / 4h' : '1h / 8h'}
                </span>
              </div>

              {/* Note / History Accordion */}
              <div className="space-y-2 pt-2">
                {ticket.notes && ticket.notes.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400">Note Tecniche Registrate:</span>
                    <div className="space-y-1">
                      {ticket.notes.map((note, idx) => (
                        <div key={idx} className="rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs text-slate-300 border border-slate-800 font-mono">
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
                      className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 flex-1"
                    />
                    <button
                      onClick={() => handleNoteSubmit(ticket.ticketId)}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
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
