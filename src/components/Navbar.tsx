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
  User,
  UserPlus,
  KeyRound,
  Crown
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
  onOpenAdminRegisterModal?: () => void;
  onOpenChangePasswordModal?: () => void;
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
  onOpenAdminRegisterModal,
  onOpenChangePasswordModal,
}) => {
  const getRoleIcon = (id: string) => {
    switch (id) {
      case 'benin':
        return <Gamepad2 className="h-3.5 w-3.5 text-[#EDE5D8]" />;
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
    <header className="sticky top-0 z-40 border-b border-[#1A3166] bg-[#070F26]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Operational Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div 
              onClick={() => onViewChange(currentUser.type === 'reporter' ? 'portal' : 'inbox')}
              className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] shadow-md shadow-black/60 text-[#070F26] font-black font-mono hover:scale-105 transition border border-[#F5D880]"
            >
              ITSM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F3C64F] text-xs sm:text-sm tracking-tight">
                  Centro Operativo
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              </div>
              <p className="text-[11px] text-blue-200/70 hidden xl:block">
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
                  ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-bold shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#F5D880]'
                  : 'text-blue-100/90 hover:bg-[#0E1C42] hover:text-[#F3C64F]'
              }`}
            >
              <Send className={`h-3.5 w-3.5 ${currentView === 'portal' ? 'text-[#070F26]' : 'text-[#D4AF37]'}`} />
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
                    ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-bold shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#F5D880]'
                    : 'text-blue-100/90 hover:bg-[#0E1C42] hover:text-[#F3C64F]'
                }`}
              >
                <Inbox className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">
                  Dashboard {currentUser.displayName.split(' ')[0]}
                </span>

                {openTicketCount > 0 && (
                  <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#070F26] text-[10px] font-black text-[#F3C64F] border border-[#D4AF37]/60 font-mono">
                    {openTicketCount}
                  </span>
                )}

                {unreadTransferCount > 0 && (
                  <span 
                    title={`${unreadTransferCount} ticket trasferiti al tuo livello!`}
                    className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] font-bold text-[#070F26] font-mono animate-bounce"
                  >
                    +{unreadTransferCount}
                  </span>
                )}
              </button>
            )}

            {/* 3. AI Helpdesk Chat (Visible only to Admins/Technicians) */}
            {isTechnician && (hasCoordination || hasT1) && (
              <button
                id="nav-chat"
                onClick={() => onViewChange('chat')}
                className={`hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  currentView === 'chat'
                    ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-bold shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#F5D880]'
                    : 'text-blue-100/90 hover:bg-[#0E1C42] hover:text-[#F3C64F]'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">Assistente AI</span>
              </button>
            )}

            {/* 4. Complete Ticket Register (Accessible ONLY if Coordinator) */}
            {isTechnician && hasCoordination && (
              <button
                id="nav-board"
                onClick={() => onViewChange('board')}
                className={`hidden md:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  currentView === 'board'
                    ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-bold shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#F5D880]'
                    : 'text-blue-100/90 hover:bg-[#0E1C42] hover:text-[#F3C64F]'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">Registro T1 Coordinamento</span>
              </button>
            )}

            {/* 5. ITSM Architecture Reference (Admins only) */}
            {isTechnician && (
              <button
                id="nav-design"
                onClick={() => onViewChange('design')}
                className={`hidden lg:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  currentView === 'design'
                    ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-bold shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#F5D880]'
                    : 'text-blue-100/90 hover:bg-[#0E1C42] hover:text-[#F3C64F]'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">Architettura ITSM</span>
              </button>
            )}
          </nav>

          {/* Right Section: Active Account Display & Logout Button */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Active User Information Badge */}
            <div className="flex items-center gap-2 rounded-xl border border-[#1A3166] bg-[#0A1636]/90 px-2.5 sm:px-3 py-1.5 text-xs text-blue-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0E1F4B] border border-[#1E3975] shrink-0">
                {getRoleIcon(currentUser.id)}
              </div>

              <div className="text-left">
                <div className="font-bold text-white text-xs leading-none flex items-center gap-1.5">
                  <span>{currentUser.displayName}</span>
                  {/* Badges based on role */}
                  {currentUser.isAdmin ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D4AF37]/20 text-[#F3C64F] border border-[#D4AF37]/40 font-bold">
                      🛡️ Admin
                    </span>
                  ) : currentUser.type === 'reporter' ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-blue-200 border border-slate-700">
                      👤 Utente
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      {currentUser.permissions?.t1 && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#D4AF37]/15 text-[#F3C64F] border border-[#D4AF37]/40 font-semibold">
                          T1
                        </span>
                      )}
                      {currentUser.permissions?.t2 && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#0E1F4B] text-blue-200 border border-[#1E3975] font-semibold">
                          T2
                        </span>
                      )}
                      {currentUser.permissions?.t3Vendor && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950/70 text-purple-300 border border-purple-500/40 font-semibold">
                          T3
                        </span>
                      )}
                      {currentUser.permissions?.coordination && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#D4AF37]/20 text-[#F3C64F] border border-[#D4AF37]/50 font-semibold">
                          Coord
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-blue-200/70 leading-tight truncate max-w-[130px] hidden sm:block">
                  {currentUser.role}
                </div>
              </div>
            </div>

            {/* Change Password Button for all logged in accounts */}
            <button
              id="btn-change-password"
              onClick={onOpenChangePasswordModal}
              className="flex items-center gap-1 rounded-xl border border-[#1A3166] bg-[#0E1F4B]/90 px-2 sm:px-2.5 py-1.5 text-xs text-blue-200 hover:text-[#F3C64F] hover:border-[#D4AF37]/40 transition shadow-sm"
              title="Modifica la password del tuo account"
            >
              <KeyRound className="h-3.5 w-3.5 text-[#F3C64F]" />
              <span className="hidden md:inline text-[11px] font-semibold">Password</span>
            </button>

            {/* Register New Admin Button - ONLY FOR COORDINATORS (Piccirilli & users with coordination permission) */}
            {hasCoordination && (
              <button
                id="btn-register-admin"
                onClick={onOpenAdminRegisterModal}
                className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/60 bg-gradient-to-r from-[#D4AF37]/20 via-[#F3C64F]/20 to-[#D4AF37]/20 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#F3C64F] hover:brightness-125 transition shadow-sm ring-1 ring-[#D4AF37]/30"
                title="Registra un nuovo Utente Admin (Funzione abilitata dal ruolo di Coordinamento)"
              >
                <UserPlus className="h-3.5 w-3.5 text-[#F3C64F]" />
                <span className="hidden sm:inline">Nuovo Admin</span>
              </button>
            )}

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
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#F3C64F] hover:bg-[#D4AF37]/20 transition shadow-sm"
              title="Apri link pubblico per testare l'invio su cellulare o altra finestra"
            >
              <Globe className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Condividi</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
