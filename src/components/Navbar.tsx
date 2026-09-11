import React from 'react';
import { 
  MessageSquare, 
  Layers, 
  FileText, 
  ShieldCheck, 
  Inbox, 
  Send, 
  Globe, 
  Users, 
  ChevronDown, 
  Sparkles,
  ArrowRightLeft,
  Lock,
  Gamepad2,
  Building2,
  Coffee,
  Laptop,
  LogOut,
  User
} from 'lucide-react';
import { UserAccount } from '../types';

export type ActiveView = 'portal' | 'inbox' | 'chat' | 'board' | 'design';

interface NavbarProps {
  currentView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  openTicketCount: number;
  t3EscalationCount: number;
  onOpenOnlineModal: () => void;
  currentUser: UserAccount;
  onLogout: () => void;
  unreadTransferCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  openTicketCount,
  t3EscalationCount,
  onOpenOnlineModal,
  currentUser,
  onLogout,
  unreadTransferCount = 0,
}) => {
  const getRoleIcon = (id: string) => {
    switch (id) {
      case 'benin':
        return <Gamepad2 className="h-3.5 w-3.5 text-amber-400" />;
      case 'padovani':
        return <Building2 className="h-3.5 w-3.5 text-emerald-400" />;
      case 'ayoub':
        return <Coffee className="h-3.5 w-3.5 text-rose-400" />;
      case 'piccirilli':
        return <Laptop className="h-3.5 w-3.5 text-blue-400" />;
      default:
        return <User className="h-3.5 w-3.5 text-cyan-300" />;
    }
  };

  const hasCoordination = currentUser.permissions?.coordination || currentUser.id === 'piccirilli';
  const hasT1 = currentUser.permissions?.t1 || currentUser.id === 'piccirilli';
  const isTechnician = currentUser.type === 'technician';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Operational Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div 
              onClick={() => onViewChange(currentUser.type === 'reporter' ? 'portal' : 'inbox')}
              className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-md shadow-cyan-900/30 text-white font-bold font-mono hover:scale-105 transition"
            >
              ITSM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs sm:text-sm tracking-tight">
                  Centro Operativo
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xl:block">
                Gaming • Food & Beverage • Facility • IT
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Tailored strictly to logged in role & permissions) */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
            {/* 1. Portal for Users to Report Disservizio */}
            <button
              id="nav-portal"
              onClick={() => onViewChange('portal')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold transition ${
                currentView === 'portal'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/30 ring-1 ring-cyan-400/40'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Send className="h-3.5 w-3.5 text-cyan-300" />
              <span className="whitespace-nowrap">
                {currentUser.type === 'reporter' ? 'Nuova Segnalazione' : 'Segnala Disservizio'}
              </span>
            </button>

            {/* 2. Technicians' Inbox (Visible ONLY to technicians) */}
            {isTechnician && (
              <button
                id="nav-inbox"
                onClick={() => onViewChange('inbox')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold transition relative ${
                  currentView === 'inbox'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/30 ring-1 ring-cyan-400/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Inbox className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">
                  Dashboard {currentUser.displayName.split(' ')[0]}
                </span>

                {openTicketCount > 0 && (
                  <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-cyan-400 text-[10px] font-bold text-slate-950 font-mono">
                    {openTicketCount}
                  </span>
                )}

                {unreadTransferCount > 0 && (
                  <span 
                    title={`${unreadTransferCount} ticket trasferiti al tuo livello!`}
                    className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-950 font-mono animate-bounce"
                  >
                    +{unreadTransferCount}
                  </span>
                )}
              </button>
            )}

            {/* 3. AI Helpdesk Chat (Visible to Coordinators, T1 or Reporter) */}
            {(hasCoordination || hasT1 || currentUser.type === 'reporter') && (
              <button
                id="nav-chat"
                onClick={() => onViewChange('chat')}
                className={`hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  currentView === 'chat'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/20'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">Assistente AI</span>
              </button>
            )}

            {/* 4. Complete Ticket Register (Accessible ONLY if Coordinator) */}
            {hasCoordination && (
              <button
                id="nav-board"
                onClick={() => onViewChange('board')}
                className={`hidden md:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  currentView === 'board'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/20'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">Registro T1 Coordinamento</span>
              </button>
            )}

            {/* 5. ITSM Architecture Reference */}
            <button
              id="nav-design"
              onClick={() => onViewChange('design')}
              className={`hidden lg:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                currentView === 'design'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="whitespace-nowrap">Architettura ITSM</span>
            </button>
          </nav>

          {/* Right Section: Active Account Display & Logout Button */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Active User Information Badge */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 sm:px-3 py-1.5 text-xs text-slate-200">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                {getRoleIcon(currentUser.id)}
              </div>

              <div className="text-left">
                <div className="font-bold text-white text-xs leading-none flex items-center gap-1.5">
                  <span>{currentUser.displayName}</span>
                  {/* Badges based on permissions */}
                  {currentUser.type === 'reporter' ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Utente
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      {currentUser.permissions?.t1 && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          T1
                        </span>
                      )}
                      {currentUser.permissions?.t2 && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                          T2
                        </span>
                      )}
                      {currentUser.permissions?.t3Vendor && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30 font-semibold">
                          T3
                        </span>
                      )}
                      {currentUser.permissions?.coordination && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-semibold">
                          Coord
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight truncate max-w-[130px] hidden sm:block">
                  {currentUser.role}
                </div>
              </div>
            </div>

            {/* Logout / Disconnetti Button (Realistic Authentication) */}
            <button
              id="btn-logout"
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/20 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/40 hover:border-red-500/50 transition shadow-sm"
              title="Disconnetti la sessione e torna alla schermata di Login / Registrazione"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Disconnetti</span>
            </button>

            {/* Online Live Share Button */}
            <button
              onClick={onOpenOnlineModal}
              id="btn-online-share"
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/40 transition shadow-sm"
              title="Apri link pubblico per testare l'invio su cellulare o altra finestra"
            >
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span>Condividi</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
