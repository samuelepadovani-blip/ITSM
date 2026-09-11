import React from 'react';
import { UserAccount } from '../types';
import { USER_ACCOUNTS } from '../data/accountsData';
import { 
  Users, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight,
  Gamepad2,
  Building2,
  Coffee,
  Laptop,
  Lock,
  Sparkles
} from 'lucide-react';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onSelectAccount: (account: UserAccount) => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectAccount,
}) => {
  if (!isOpen) return null;

  const getAccountIcon = (id: string) => {
    switch (id) {
      case 'benin':
        return <Gamepad2 className="h-5 w-5 text-[#F3C64F]" />;
      case 'padovani':
        return <Building2 className="h-5 w-5 text-emerald-400" />;
      case 'ayoub':
        return <Coffee className="h-5 w-5 text-rose-400" />;
      case 'piccirilli':
        return <Laptop className="h-5 w-5 text-blue-400" />;
      default:
        return <Users className="h-5 w-5 text-blue-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-[#1A3166] bg-[#0A1636] shadow-2xl p-5 sm:p-7 space-y-6 text-blue-100 ring-1 ring-[#D4AF37]/20 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1A3166] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F3C64F] tracking-tight flex items-center gap-2">
                <span>Gestione Account & Ruoli ITSM</span>
              </h2>
              <p className="text-xs text-blue-300/70 mt-0.5">
                Seleziona il profilo con cui accedere per testare la segregazione delle competenze e il trasferimento tra livelli.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-blue-300 hover:bg-[#0E1F4B] hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informative Note for Professors / Evaluators */}
        <div className="rounded-xl border border-[#1A3166] bg-[#070F24] p-3.5 flex items-start gap-3 text-xs text-blue-200">
          <Lock className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <strong className="text-white block font-semibold">
              Regola di Segregazione & Competenze Rigorose:
            </strong>
            <p className="text-blue-300/80 text-[11px]">
              Ciascun account ha una vista limitata ai soli ticket di propria competenza. Ad esempio, <strong>Benin</strong> vede solo Gaming e non i ticket di Piccirilli o Padovani; <strong>Piccirilli</strong> gestisce IT e coordina le escalation T3 a fornitori esterni. Quando un ticket viene spostato ad un altro livello, il destinatario riceve una notifica immediata e il ticket appare nella sua dashboard!
            </p>
          </div>
        </div>

        {/* Accounts List */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-blue-200 uppercase tracking-wider block">
            Profili Disponibili (Cambio Sessione 1-Click):
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {USER_ACCOUNTS.map((acc) => {
              const isCurrent = acc.id === currentUser.id;

              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    onSelectAccount(acc);
                    onClose();
                  }}
                  className={`group cursor-pointer rounded-xl border p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-[#D4AF37] bg-[#0E1F4B] ring-1 ring-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/10'
                      : 'border-[#1A3166] bg-[#070F24]/70 hover:border-[#D4AF37]/40 hover:bg-[#0E1F4B]/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A1636] border border-[#1A3166] mt-0.5">
                      {getAccountIcon(acc.id)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {acc.displayName}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          acc.type === 'reporter' 
                            ? 'bg-[#0A1636] border-[#1A3166] text-blue-300'
                            : acc.id === 'piccirilli'
                            ? 'bg-purple-950/80 border-purple-600/50 text-purple-300'
                            : 'bg-[#D4AF37]/15 border-[#D4AF37]/30 text-[#F3C64F]'
                        }`}>
                          {acc.role}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Attivo Ora
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-blue-300/70 leading-snug">
                        {acc.competencyDescription}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-blue-400/60 pt-0.5">
                        <span>Reparto: <strong className="text-blue-200">{acc.category}</strong></span>
                        <span>•</span>
                        <span>Livello: <strong className="text-[#F3C64F]">{acc.level}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:shrink-0 flex items-center justify-end">
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        isCurrent
                          ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-black shadow-md shadow-[#D4AF37]/20'
                          : 'bg-[#0E1F4B] text-blue-200 border border-[#1A3166] group-hover:bg-gradient-to-r group-hover:from-[#D4AF37] group-hover:via-[#F3C64F] group-hover:to-[#D4AF37] group-hover:text-[#070F26]'
                      }`}
                    >
                      <span>{isCurrent ? 'In Uso' : 'Accedi'}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1A3166] text-xs text-blue-400/60">
          <span>Sistema di Controllo Accessi ITSM Centro Operativo</span>
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white font-medium"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
