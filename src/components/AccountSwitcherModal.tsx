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
        return <Gamepad2 className="h-5 w-5 text-amber-400" />;
      case 'padovani':
        return <Building2 className="h-5 w-5 text-emerald-400" />;
      case 'ayoub':
        return <Coffee className="h-5 w-5 text-rose-400" />;
      case 'piccirilli':
        return <Laptop className="h-5 w-5 text-blue-400" />;
      default:
        return <Users className="h-5 w-5 text-slate-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-5 sm:p-7 space-y-6 text-slate-100 ring-1 ring-white/10 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Gestione Account & Ruoli ITSM</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Seleziona il profilo con cui accedere per testare la segregazione delle competenze e il trasferimento tra livelli.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informative Note for Professors / Evaluators */}
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 flex items-start gap-3 text-xs text-cyan-300">
          <Lock className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <strong className="text-white block font-semibold">
              Regola di Segregazione & Competenze Rigorose:
            </strong>
            <p className="text-cyan-200/90 text-[11px]">
              Ciascun account ha una vista limitata ai soli ticket di propria competenza. Ad esempio, <strong>Benin</strong> vede solo Gaming e non i ticket di Piccirilli o Padovani; <strong>Piccirilli</strong> gestisce IT e coordina le escalation T3 a fornitori esterni. Quando un ticket viene spostato ad un altro livello, il destinatario riceve una notifica immediata e il ticket appare nella sua dashboard!
            </p>
          </div>
        </div>

        {/* Accounts List */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
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
                      ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500/50 shadow-md'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 mt-0.5">
                      {getAccountIcon(acc.id)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {acc.displayName}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          acc.type === 'reporter' 
                            ? 'bg-slate-800 border-slate-700 text-slate-300'
                            : acc.id === 'piccirilli'
                            ? 'bg-blue-950/80 border-blue-600/50 text-blue-300'
                            : 'bg-indigo-950/60 border-indigo-700/50 text-indigo-300'
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

                      <p className="text-xs text-slate-400 leading-snug">
                        {acc.competencyDescription}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        <span>Reparto: <strong className="text-slate-300">{acc.category}</strong></span>
                        <span>•</span>
                        <span>Livello: <strong className="text-cyan-400">{acc.level}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:shrink-0 flex items-center justify-end">
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-cyan-600 group-hover:text-white'
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
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-500">
          <span>Sistema di Controllo Accessi ITSM Centro Operativo</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-medium"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
