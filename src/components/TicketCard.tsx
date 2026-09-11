import React, { useState } from 'react';
import { ITSMTicket, TicketStatus } from '../types';
import { 
  Check, 
  Copy, 
  ExternalLink, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  ShieldAlert, 
  FileText,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface TicketCardProps {
  ticket: ITSMTicket;
  onStatusChange?: (ticketId: string, newStatus: TicketStatus) => void;
  onAskAI?: (ticket: ITSMTicket) => void;
  compact?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onStatusChange,
  onAskAI,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleCopy = () => {
    const formattedText = `- **ID Ticket**: ${ticket.ticketId}
- **Asset**: ${ticket.asset}
- **Categoria**: ${ticket.category}
- **Priorità/SLA**: ${ticket.priority} - ${ticket.sla}
- **Assegnato a (T1/T2)**: ${ticket.assignedTo}
- **Escalation T3 (Fornitore Esterno)**: ${ticket.escalationT3 ? `SÌ -> ${ticket.escalationT3Note}` : 'NO'}
- **Azione Richiesta**: ${ticket.actionRequired}`;

    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'P1':
        return 'bg-rose-950/50 text-rose-300 border-rose-500/50 ring-1 ring-rose-500/30 font-bold';
      case 'P2':
        return 'bg-[#D4AF37]/15 text-[#F3C64F] border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/20 font-bold';
      case 'P3':
        return 'bg-[#0E1F4B] text-blue-200 border-[#1A3166] font-medium';
      case 'P4':
      default:
        return 'bg-[#070F24] text-blue-300 border-[#1A3166]';
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Aperto':
        return 'bg-[#D4AF37]/10 text-[#F3C64F] border-[#D4AF37]/30';
      case 'In Lavorazione':
        return 'bg-[#0E1F4B] text-white border-[#D4AF37]/40 font-semibold';
      case 'Escalato T3':
      case 'In Attesa Fornitore':
        return 'bg-purple-950/60 text-purple-300 border-purple-500/40 ring-1 ring-purple-500/30';
      case 'Risolto':
        return 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40';
      case 'Chiuso':
        return 'bg-[#070F24] text-blue-300/60 border-[#1A3166]';
    }
  };

  return (
    <div 
      id={`ticket-card-${ticket.ticketId}`}
      className="rounded-xl border border-[#1A3166] bg-[#0A1636]/95 shadow-xl transition-all hover:border-[#D4AF37]/40 overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A3166] bg-[#070F24]/80 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-tight text-white">
                {ticket.ticketId}
              </span>
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${getPriorityBadge(ticket.priority)}`}>
                {ticket.priority}
              </span>
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                {ticket.status}
              </span>
            </div>
            <p className="text-xs text-blue-300/70">
              Registrato il {new Date(ticket.timestamp).toLocaleDateString('it-IT')} alle {new Date(ticket.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id={`btn-copy-${ticket.ticketId}`}
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-[#1A3166] bg-[#0E1F4B] px-2.5 py-1 text-xs font-medium text-blue-200 transition hover:border-[#D4AF37]/40 hover:text-white"
            title="Copia scheda formattata ITSM"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiato!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-blue-400/60" />
                <span>Copia Scheda</span>
              </>
            )}
          </button>

          {onAskAI && (
            <button
              id={`btn-ask-ai-${ticket.ticketId}`}
              onClick={() => onAskAI(ticket)}
              className="flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-semibold text-[#F3C64F] transition hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/60"
              title="Inoltra questa segnalazione all'Assistente AI per diagnosi e risposte automatiche"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Chiedi all'AI</span>
            </button>
          )}

          {onStatusChange && (
            <div className="relative inline-block text-left">
              <select
                id={`select-status-${ticket.ticketId}`}
                value={ticket.status}
                onChange={(e) => onStatusChange(ticket.ticketId, e.target.value as TicketStatus)}
                aria-label="Aggiorna stato ticket"
                className="rounded-lg border border-[#1A3166] bg-[#0E1F4B] px-2.5 py-1 text-xs font-medium text-blue-100 hover:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                <option value="Aperto">Aperto</option>
                <option value="In Lavorazione">In Lavorazione</option>
                <option value="Escalato T3">Escalato T3</option>
                <option value="In Attesa Fornitore">In Attesa Fornitore</option>
                <option value="Risolto">Risolto</option>
                <option value="Chiuso">Chiuso</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Ticket Card Content - Conforme al FORMATO SCHEDA TICKET */}
      <div className="p-4 space-y-3.5 text-sm">
        {/* Escalation T3 Banner if active */}
        {ticket.escalationT3 && (
          <div className="rounded-lg border border-purple-500/40 bg-purple-950/40 p-3 text-xs text-purple-200 flex items-start gap-2.5 shadow-sm">
            <ShieldAlert className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-purple-300">Escalation T3 (Fornitore Esterno) Attiva:</span>
              <p className="mt-0.5 text-purple-200/90 font-medium">
                Inoltrato a <strong>Piccirilli</strong> per contatto/coordinamento fornitore esterno (unico referente autorizzato T3).
              </p>
            </div>
          </div>
        )}

        {/* Formatted fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#070F24]/80 rounded-lg p-3 border border-[#1A3166] font-sans">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-300/70">Asset</span>
            <p className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37]"></span>
              {ticket.asset}
            </p>
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-300/70">Categoria</span>
            <p className="text-sm font-semibold text-blue-200 mt-0.5">
              {ticket.category}
            </p>
          </div>

          <div className="md:col-span-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-300/70">Priorità / SLA</span>
            <p className="text-sm font-semibold text-blue-100 mt-0.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>{ticket.priority} - {ticket.sla}</span>
            </p>
          </div>

          <div className="md:col-span-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-300/70">Assegnato a (T1/T2)</span>
            <p className="text-sm font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>{ticket.assignedTo}</span>
            </p>
          </div>

          <div className="md:col-span-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-300/70">Escalation T3 (Fornitore Esterno)</span>
            <p className={`text-sm mt-0.5 font-medium ${ticket.escalationT3 ? 'text-purple-300 font-semibold' : 'text-blue-200'}`}>
              {ticket.escalationT3 ? `SÌ -> Inoltrato a Piccirilli per contatto/coordinamento fornitore esterno` : 'NO'}
            </p>
          </div>

          <div className="md:col-span-2 border-t border-[#1A3166] pt-2.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-300/70">Azione Richiesta</span>
            <p className="text-xs text-blue-100 mt-1 leading-relaxed bg-[#0A1636] p-2.5 rounded border border-[#1A3166]">
              {ticket.actionRequired}
            </p>
          </div>
        </div>

        {/* Original user message */}
        {ticket.userMessage && (
          <div className="text-xs text-blue-300/80 bg-[#070F24]/50 p-2.5 rounded border border-[#1A3166]/50">
            <span className="font-medium text-blue-200">Segnalazione originale: </span>
            <span className="italic text-blue-200">"{ticket.userMessage}"</span>
          </div>
        )}

        {/* Collapsible history */}
        {ticket.history && ticket.history.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 text-xs text-blue-300/70 hover:text-blue-200 transition"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              <span>Cronologia e log passaggi ({ticket.history.length})</span>
            </button>

            {showHistory && (
              <div className="mt-2 space-y-1.5 border-l-2 border-[#1A3166] pl-3 text-xs text-blue-300/70">
                {ticket.history.map((h, i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <span className="font-mono text-[#F3C64F] font-semibold">{h.timestamp}</span>
                    <span className="text-blue-200">{h.action}</span>
                    <span className="text-blue-400/60">({h.by})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
