import React, { useState } from 'react';
import { ITSMTicket, UserAccount } from '../types';
import { USER_ACCOUNTS } from '../data/accountsData';
import { 
  ArrowRightLeft, 
  X, 
  ShieldAlert, 
  Sparkles, 
  AlertTriangle, 
  Send, 
  UserCheck,
  Building2,
  Gamepad2,
  Coffee,
  Laptop
} from 'lucide-react';

interface TransferTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: ITSMTicket | null;
  currentUser: UserAccount;
  onTransferConfirmed: (
    ticketId: string, 
    targetTechId: string, 
    targetLevel: string, 
    reason: string, 
    escalateT3: boolean
  ) => Promise<void>;
}

export const TransferTicketModal: React.FC<TransferTicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
  currentUser,
  onTransferConfirmed,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>('piccirilli');
  const [reason, setReason] = useState<string>('');
  const [isEscalateT3, setIsEscalateT3] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !ticket) return null;

  // Filter out the current technician or current assignee
  const eligibleTargets = USER_ACCOUNTS.filter(
    (acc) => acc.type === 'technician' && acc.id !== currentUser.id
  );

  const getTargetIcon = (id: string) => {
    switch (id) {
      case 'benin':
        return <Gamepad2 className="h-4 w-4 text-amber-400" />;
      case 'padovani':
        return <Building2 className="h-4 w-4 text-emerald-400" />;
      case 'ayoub':
        return <Coffee className="h-4 w-4 text-rose-400" />;
      default:
        return <Laptop className="h-4 w-4 text-blue-400" />;
    }
  };

  const handleQuickReason = (text: string, t3 = false) => {
    setReason(text);
    if (t3) {
      setIsEscalateT3(true);
      setSelectedTarget('piccirilli');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      const targetAcc = USER_ACCOUNTS.find((a) => a.id === selectedTarget);
      const levelLabel = isEscalateT3 
        ? 'T3 (Fornitori Esterni)' 
        : targetAcc?.level || 'T2 (Specialista)';

      await onTransferConfirmed(
        ticket.ticketId,
        selectedTarget,
        levelLabel,
        reason.trim(),
        isEscalateT3 || selectedTarget === 'piccirilli-t3'
      );
      onClose();
    } catch (err) {
      console.error('Transfer failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl p-5 sm:p-6 space-y-5 text-slate-100 ring-1 ring-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Sposta Ticket di Livello</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                  #{ticket.ticketId}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Asset: <strong className="text-white">{ticket.asset}</strong> • Attualmente a: <span className="text-cyan-300">{ticket.assignedTo}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Target Technician Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 block">
              1. Seleziona il Nuovo Livello / Tecnico Ricevente:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {eligibleTargets.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => {
                    setSelectedTarget(target.id);
                    if (target.id !== 'piccirilli') {
                      setIsEscalateT3(false);
                    }
                  }}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition ${
                    selectedTarget === target.id
                      ? 'border-cyan-500/80 bg-cyan-950/40 text-white ring-1 ring-cyan-500/40'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getTargetIcon(target.id)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>{target.displayName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {target.level}
                    </div>
                    <div className="text-[10px] text-cyan-400/80 mt-0.5">
                      {target.category}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Special Escalation T3 Checkbox if Target is Piccirilli */}
          {selectedTarget === 'piccirilli' && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="check-t3"
                checked={isEscalateT3}
                onChange={(e) => setIsEscalateT3(e.target.checked)}
                className="mt-0.5 rounded border-purple-400 text-purple-600 focus:ring-purple-500 bg-slate-900"
              />
              <label htmlFor="check-t3" className="cursor-pointer text-[11px] text-purple-200">
                <strong className="block text-purple-300 font-semibold">
                  ⚡ Escalation T3 (Richiesta Fornitore Esterno)
                </strong>
                Spunta se il guasto richiede ricambi o assistenza del costruttore. Il ticket verrà contrassegnato con priorità fornitore e notificato a Piccirilli per l'apertura formale della chiamata.
              </label>
            </div>
          )}

          {/* Quick Presets for Reasons */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-400 block text-[11px]">
              Motivazioni rapide consigliate:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickReason('Richiede ricambio originale o assistenza costruttore esterno (garanzia/contratto)', true)}
                className="rounded-lg bg-slate-800/80 hover:bg-slate-700 px-2 py-1 text-[10px] text-purple-300 border border-purple-500/30 transition"
              >
                + Escalation T3 Fornitore
              </button>
              <button
                type="button"
                onClick={() => handleQuickReason('Rilevata anomalia sull’impianto elettrico/ventilazione di competenza Facility')}
                className="rounded-lg bg-slate-800/80 hover:bg-slate-700 px-2 py-1 text-[10px] text-emerald-300 border border-emerald-500/30 transition"
              >
                + Passaggio a Facility
              </button>
              <button
                type="button"
                onClick={() => handleQuickReason('Blocco software/rete richiedente verifica switch o server centrale')}
                className="rounded-lg bg-slate-800/80 hover:bg-slate-700 px-2 py-1 text-[10px] text-blue-300 border border-blue-500/30 transition"
              >
                + Passaggio a IT (Piccirilli)
              </button>
              <button
                type="button"
                onClick={() => handleQuickReason('Problema hardware specifico su scheda gioco/cambiamonete')}
                className="rounded-lg bg-slate-800/80 hover:bg-slate-700 px-2 py-1 text-[10px] text-amber-300 border border-amber-500/30 transition"
              >
                + Passaggio a Gaming (Benin)
              </button>
            </div>
          </div>

          {/* Reason Text Area */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 block">
              2. Motivo del Trasferimento:
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Spiega chiaramente al collega cosa hai riscontrato e perché il ticket viene trasferito al suo livello..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="text-[11px] text-slate-400">
              Mittente: <strong className="text-white">{currentUser.displayName}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-900/40 hover:from-cyan-500 hover:to-blue-500 transition disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Trasferimento in corso...' : 'Conferma e Invia Notifica'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
