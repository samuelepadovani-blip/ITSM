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
  ChevronDown
} from 'lucide-react';

interface TicketCardProps {
  ticket: ITSMTicket;
  onStatusChange?: (ticketId: string, newStatus: TicketStatus) => void;
  compact?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onStatusChange,
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
        return 'bg-red-500/15 text-red-400 border-red-500/40 ring-1 ring-red-500/30';
      case 'P2':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30';
      case 'P3':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/40';
      case 'P4':
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/40';
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Aperto':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'In Lavorazione':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'Escalato T3':
      case 'In Attesa Fornitore':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 ring-1 ring-purple-500/30';
      case 'Risolto':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Chiuso':
        return 'bg-slate-700/40 text-slate-400 border-slate-600/40';
    }
  };

  return (
    <div 
      id={`ticket-card-${ticket.ticketId}`}
      className="rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl transition-all hover:border-slate-700/80 overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
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
            <p className="text-xs text-slate-400">
              Registrato il {new Date(ticket.timestamp).toLocaleDateString('it-IT')} alle {new Date(ticket.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id={`btn-copy-${ticket.ticketId}`}
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
            title="Copia scheda formattata ITSM"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiato!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copia Scheda</span>
              </>
            )}
          </button>

          {onStatusChange && (
            <div className="relative inline-block text-left">
              <select
                id={`select-status-${ticket.ticketId}`}
                value={ticket.status}
                onChange={(e) => onStatusChange(ticket.ticketId, e.target.value as TicketStatus)}
                aria-label="Aggiorna stato ticket"
                className="rounded-lg border border-slate-700/80 bg-slate-800/90 px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
          <div className="rounded-lg border border-purple-500/40 bg-purple-950/30 p-3 text-xs text-purple-200 flex items-start gap-2.5 shadow-sm">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/40 rounded-lg p-3 border border-slate-800/60 font-sans">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Asset</span>
            <p className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              {ticket.asset}
            </p>
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Categoria</span>
            <p className="text-sm font-semibold text-slate-200 mt-0.5">
              {ticket.category}
            </p>
          </div>

          <div className="md:col-span-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Priorità / SLA</span>
            <p className="text-sm font-semibold text-slate-100 mt-0.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>{ticket.priority} - {ticket.sla}</span>
            </p>
          </div>

          <div className="md:col-span-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Assegnato a (T1/T2)</span>
            <p className="text-sm font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>{ticket.assignedTo}</span>
            </p>
          </div>

          <div className="md:col-span-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Escalation T3 (Fornitore Esterno)</span>
            <p className={`text-sm mt-0.5 font-medium ${ticket.escalationT3 ? 'text-purple-300 font-semibold' : 'text-slate-300'}`}>
              {ticket.escalationT3 ? `SÌ -> Inoltrato a Piccirilli per contatto/coordinamento fornitore esterno` : 'NO'}
            </p>
          </div>

          <div className="md:col-span-2 border-t border-slate-800/80 pt-2.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Azione Richiesta</span>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed bg-slate-900/90 p-2.5 rounded border border-slate-800">
              {ticket.actionRequired}
            </p>
          </div>
        </div>

        {/* Original user message */}
        {ticket.userMessage && (
          <div className="text-xs text-slate-400 bg-slate-950/20 p-2.5 rounded border border-slate-800/40">
            <span className="font-medium text-slate-300">Segnalazione originale: </span>
            <span className="italic text-slate-300">"{ticket.userMessage}"</span>
          </div>
        )}

        {/* Collapsible history */}
        {ticket.history && ticket.history.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              <span>Cronologia e log passaggi ({ticket.history.length})</span>
            </button>

            {showHistory && (
              <div className="mt-2 space-y-1.5 border-l-2 border-slate-700 pl-3 text-xs text-slate-400">
                {ticket.history.map((h, i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <span className="font-mono text-cyan-400 font-semibold">{h.timestamp}</span>
                    <span className="text-slate-300">{h.action}</span>
                    <span className="text-slate-500">({h.by})</span>
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
