import React, { useState } from 'react';
import { ITSMTicket, TicketStatus } from './types';
import { INITIAL_TICKETS } from './data/itsmData';
import { Navbar } from './components/Navbar';
import { HelpdeskChat } from './components/HelpdeskChat';
import { ITSMDesignerView } from './components/ITSMDesignerView';
import { TicketBoardView } from './components/TicketBoardView';
import { ShieldAlert, Info, Radio, Users, CheckCircle } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'chat' | 'design' | 'board'>('chat');
  const [tickets, setTickets] = useState<ITSMTicket[]>(INITIAL_TICKETS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleNewTicketCreated = (newTicket: ITSMTicket) => {
    setTickets((prev) => {
      // Avoid duplicate by ticketId
      const exists = prev.some((t) => t.ticketId === newTicket.ticketId);
      if (exists) return prev;
      return [newTicket, ...prev];
    });

    setToastMessage(`Nuovo Ticket registrato: ${newTicket.ticketId} [${newTicket.priority}]`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.ticketId === ticketId) {
          const nowTime = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
          const newHistory = [
            ...(t.history || []),
            {
              timestamp: nowTime,
              action: `Stato modificato in: ${newStatus}`,
              by: 'Operatore Centro',
            },
          ];
          return {
            ...t,
            status: newStatus,
            history: newHistory,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  const openTickets = tickets.filter((t) => t.status === 'Aperto' || t.status === 'In Lavorazione').length;
  const t3Tickets = tickets.filter((t) => t.escalationT3 && t.status !== 'Chiuso' && t.status !== 'Risolto').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        openTicketCount={openTickets}
        t3EscalationCount={t3Tickets}
      />

      {/* Quick Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-14 right-6 z-50 rounded-xl border border-cyan-500/40 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur flex items-center gap-2.5 text-xs text-cyan-300 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8">
        {currentView === 'chat' && (
          <HelpdeskChat
            onNewTicketCreated={handleNewTicketCreated}
            onStatusChange={handleStatusChange}
            allTickets={tickets}
          />
        )}

        {currentView === 'design' && <ITSMDesignerView />}

        {currentView === 'board' && (
          <TicketBoardView
            tickets={tickets}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>

      {/* Operational Footer Bar */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-3 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              SLA Engine Operativo
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline text-slate-400">
              T1: Piccirilli • T2: Benin, Padovani, Ayoub • T3: Piccirilli (Fornitori)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>ITSM v2.4 • Centro Operativo Gaming, F&B & Facility</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
