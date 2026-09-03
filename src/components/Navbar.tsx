import React from 'react';
import { 
  MessageSquare, 
  Layers, 
  FileText, 
  ShieldCheck, 
  Activity, 
  Radio
} from 'lucide-react';

interface NavbarProps {
  currentView: 'chat' | 'design' | 'board';
  onViewChange: (view: 'chat' | 'design' | 'board') => void;
  openTicketCount: number;
  t3EscalationCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  openTicketCount,
  t3EscalationCount,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Operational Status */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-md shadow-cyan-900/30 text-white font-bold font-mono">
              ITSM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-tight sm:text-base">
                  Centro Operativo Multifunzionale
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Attivo 24/7
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Gaming • Food & Beverage • Entertainment & Facility
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="nav-chat"
              onClick={() => onViewChange('chat')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                currentView === 'chat'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Assistente Helpdesk</span>
            </button>

            <button
              id="nav-design"
              onClick={() => onViewChange('design')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                currentView === 'design'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Progettazione ITSM</span>
            </button>

            <button
              id="nav-board"
              onClick={() => onViewChange('board')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition relative ${
                currentView === 'board'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Registro Ticket</span>
              {openTicketCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[10px] font-bold text-slate-950 font-mono">
                  {openTicketCount}
                </span>
              )}
            </button>
          </nav>

          {/* T3 Escalation Quick Counter */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/30 px-2.5 py-1 text-xs text-purple-300">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
              <span>T3 Piccirilli:</span>
              <strong className="font-mono text-purple-200">{t3EscalationCount} attivi</strong>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
