import React, { useState, useEffect, useRef } from 'react';
import { ITSMTicket, TicketStatus, TechnicianId, UserAccount } from './types';
import { INITIAL_TICKETS } from './data/itsmData';
import { USER_ACCOUNTS } from './data/accountsData';
import { Navbar, ActiveView } from './components/Navbar';
import { UserReportPortal } from './components/UserReportPortal';
import { TechnicianInboxView } from './components/TechnicianInboxView';
import { HelpdeskChat } from './components/HelpdeskChat';
import { ITSMDesignerView } from './components/ITSMDesignerView';
import { TicketBoardView } from './components/TicketBoardView';
import { OnlineLiveModal } from './components/OnlineLiveModal';
import { TransferTicketModal } from './components/TransferTicketModal';
import { AuthScreen } from './components/AuthScreen';
import { playNotificationChime } from './utils/audio';
import { 
  CheckCircle, 
  Bell, 
  Radio, 
  ShieldCheck, 
  Globe, 
  RefreshCw,
  Send,
  Inbox,
  Users,
  ArrowRightLeft,
  Lock
} from 'lucide-react';

export default function App() {
  // Authentication status: defaults to false so initial screen is Login & Signup
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Available user accounts (preconfigured + registered)
  const [accounts, setAccounts] = useState<UserAccount[]>(USER_ACCOUNTS);

  // Current active user profile
  const [currentUser, setCurrentUser] = useState<UserAccount>(USER_ACCOUNTS[0]);
  
  // Modals state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [ticketToTransfer, setTicketToTransfer] = useState<ITSMTicket | null>(null);

  // AI Chat navigation state
  const [aiChatInitialPrompt, setAiChatInitialPrompt] = useState<string | null>(null);
  const [activeTicketForAI, setActiveTicketForAI] = useState<ITSMTicket | null>(null);

  // Active view: default to 'inbox' if technician, 'portal' if reporter
  const [currentView, setCurrentView] = useState<ActiveView>('inbox');
  const [tickets, setTickets] = useState<ITSMTicket[]>(INITIAL_TICKETS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastArrivedTicketId, setLastArrivedTicketId] = useState<string | null>(null);

  // Known ticket IDs and transfer timestamps to detect real-time events
  const knownTicketIdsRef = useRef<Set<string>>(new Set(INITIAL_TICKETS.map(t => t.ticketId)));
  const knownTransferTimestampsRef = useRef<Set<string>>(new Set());

  // Initial fetch and real-time polling from the server
  useEffect(() => {
    let isMounted = true;

    const fetchServerTickets = async () => {
      try {
        const res = await fetch('/api/tickets');
        if (!res.ok) return;
        const data = await res.json();
        if (data.tickets && Array.isArray(data.tickets) && isMounted) {
          const serverTickets: ITSMTicket[] = data.tickets;

          // 1. Detect newly created tickets
          let newlyArrived: ITSMTicket | null = null;
          serverTickets.forEach((st) => {
            if (!knownTicketIdsRef.current.has(st.ticketId)) {
              knownTicketIdsRef.current.add(st.ticketId);
              newlyArrived = st;
            }
          });

          if (newlyArrived) {
            const arrivingTicket: ITSMTicket = newlyArrived;
            setLastArrivedTicketId(arrivingTicket.ticketId);
            
            // Audio Chime if sound enabled
            if (soundEnabled) {
              playNotificationChime(arrivingTicket.priority);
            }

            // Toast Alert
            setToastMessage(
              `🔔 Nuovo Ticket #${arrivingTicket.ticketId} [${arrivingTicket.category}]: inoltrato a ${arrivingTicket.assignedTo}!`
            );
            setTimeout(() => setToastMessage(null), 5000);
          }

          // 2. Detect newly transferred tickets to this active user
          serverTickets.forEach((st) => {
            if (st.lastTransfer) {
              const transferKey = `${st.ticketId}_${st.lastTransfer.transferredAtIso}`;
              if (!knownTransferTimestampsRef.current.has(transferKey)) {
                knownTransferTimestampsRef.current.add(transferKey);
                
                // If it was transferred to the current logged in user
                if (st.lastTransfer.toTechnicianId === currentUser.id) {
                  if (soundEnabled) {
                    playNotificationChime('P2');
                  }
                  setToastMessage(
                    `🔄 TICKET TRASFERITO A TE: #${st.ticketId} (${st.asset}) da ${st.lastTransfer.fromName}!`
                  );
                  setTimeout(() => setToastMessage(null), 6000);
                }
              }
            }
          });

          setTickets(serverTickets);
        }
      } catch (err) {
        console.debug('Polling note:', err);
      }
    };

    // Initial load
    fetchServerTickets();

    // Poll every 3 seconds for multi-user live synchronization
    const interval = setInterval(fetchServerTickets, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [soundEnabled, currentUser.id]);

  // Authentication Handlers
  const handleLoginSuccess = (account: UserAccount) => {
    setCurrentUser(account);
    setIsAuthenticated(true);
    if (account.type === 'reporter') {
      setCurrentView('portal');
    } else {
      setCurrentView('inbox');
    }
    setToastMessage(`Benvenuto, ${account.displayName}! Accesso effettuato con successo.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToastMessage('Disconnessione effettuata. Effettua il login per accedere.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRegisterAccount = (newAccount: UserAccount) => {
    setAccounts((prev) => [newAccount, ...prev]);
  };

  const handleNewTicketCreated = (newTicket: ITSMTicket) => {
    knownTicketIdsRef.current.add(newTicket.ticketId);
    setTickets((prev) => {
      const exists = prev.some((t) => t.ticketId === newTicket.ticketId);
      if (exists) return prev;
      return [newTicket, ...prev];
    });

    setLastArrivedTicketId(newTicket.ticketId);
    setToastMessage(`Ticket #${newTicket.ticketId} creato e inoltrato a ${newTicket.assignedTo}!`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus, note?: string) => {
    // 1. Optimistic UI update
    setTickets((prev) =>
      prev.map((t) => {
        if (t.ticketId === ticketId || t.id === ticketId) {
          const nowTime = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
          const newHistory = [
            ...(t.history || []),
            {
              timestamp: nowTime,
              action: `Stato modificato in: ${newStatus}`,
              by: currentUser.displayName,
            },
          ];
          const newNotes = note ? [...(t.notes || []), `[${nowTime} - ${currentUser.displayName}]: ${note}`] : t.notes;

          return {
            ...t,
            status: newStatus,
            history: newHistory,
            notes: newNotes,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );

    // 2. Server PATCH request
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note, updatedBy: currentUser.displayName }),
      });
    } catch (e) {
      console.error('Failed to sync status change to server:', e);
    }
  };

  const handleEscalateT3 = async (ticketId: string, note?: string) => {
    // Optimistic UI update
    setTickets((prev) =>
      prev.map((t) => {
        if (t.ticketId === ticketId || t.id === ticketId) {
          const nowTime = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
          return {
            ...t,
            escalationT3: true,
            escalationT3Note: 'Inoltrato a Piccirilli per contatto/coordinamento fornitore esterno',
            status: 'Escalato T3',
            history: [
              ...(t.history || []),
              {
                timestamp: nowTime,
                action: `Escalation T3 richiesta da ${currentUser.displayName}: passaggio a Piccirilli per fornitore esterno`,
                by: currentUser.displayName,
              },
            ],
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );

    setToastMessage(`⚡ Ticket ${ticketId} escalato formalmente a Piccirilli per attivazione fornitore esterno!`);
    setTimeout(() => setToastMessage(null), 5000);

    // Server PATCH request
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalateT3: true, note, updatedBy: currentUser.displayName }),
      });
    } catch (e) {
      console.error('Failed to sync T3 escalation to server:', e);
    }
  };

  // Transfer Ticket Handler
  const handleConfirmTransfer = async (
    ticketId: string,
    targetTechId: string,
    targetLevel: string,
    reason: string,
    escalateT3: boolean
  ) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          fromName: currentUser.displayName,
          targetTechnicianId: targetTechId,
          targetLevel,
          reason,
          escalateT3,
        }),
      });

      if (!res.ok) {
        throw new Error('Errore durante il trasferimento del ticket');
      }

      const data = await res.json();
      if (data.ticket) {
        // Register key
        const transferKey = `${data.ticket.ticketId}_${data.ticket.lastTransfer?.transferredAtIso}`;
        knownTransferTimestampsRef.current.add(transferKey);

        setTickets((prev) =>
          prev.map((t) => (t.ticketId === ticketId ? data.ticket : t))
        );

        if (soundEnabled) {
          playNotificationChime('P2');
        }

        setToastMessage(
          `🔄 Ticket #${ticketId} trasferito con successo a ${data.targetAccount?.displayName || targetTechId}!`
        );
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err: any) {
      console.error('Transfer error:', err);
      setToastMessage(`❌ Errore nel trasferimento: ${err.message}`);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleAddNote = async (ticketId: string, note: string) => {
    const nowTime = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    setTickets((prev) =>
      prev.map((t) => {
        if (t.ticketId === ticketId || t.id === ticketId) {
          return {
            ...t,
            notes: [...(t.notes || []), `[${nowTime} - ${currentUser.displayName}]: ${note}`],
          };
        }
        return t;
      })
    );

    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, updatedBy: currentUser.displayName }),
      });
    } catch (e) {
      console.error('Failed to sync note to server:', e);
    }
  };

  // Navigate directly from Ticket to AI Assistant with automatic prompt submission
  const handleAskAI = (ticket: ITSMTicket) => {
    // Automatically set status to 'In Lavorazione' if ticket was 'Aperto'
    if (ticket.status === 'Aperto') {
      handleStatusChange(
        ticket.ticketId, 
        'In Lavorazione', 
        'Ticket preso in carico con Assistente AI per diagnosi e passaggi operativi di risoluzione.'
      );
    }

    const prompt = `Richiesta di presa in carico e procedura operativa per il Ticket #${ticket.ticketId}:
- Asset: ${ticket.asset} (${ticket.category})
- Priorità/SLA: ${ticket.priority} (${ticket.sla})
- Assegnato a: ${ticket.assignedTo}
- Segnalazione: "${ticket.userMessage}"
- Azione programmata: ${ticket.actionRequired}

Prendi in carico il problema e forniscimi subito la serie completa di passaggi operativi di risoluzione per risolvere il guasto sul posto, specificando i criteri di eventuale escalation fornitore T3 a Piccirilli.`;

    setActiveTicketForAI(ticket);
    setAiChatInitialPrompt(prompt);
    setCurrentView('chat');
  };

  // Count open tickets for the current technician (or all for coordinator)
  const openTicketsForUser = tickets.filter((t) => {
    if (currentUser.type === 'reporter') return true;
    if (currentUser.id === 'piccirilli') return (t.assignedTechnicianId === 'piccirilli' || t.escalationT3) && t.status !== 'Risolto' && t.status !== 'Chiuso';
    return t.assignedTechnicianId === currentUser.id && t.status !== 'Risolto' && t.status !== 'Chiuso';
  }).length;

  const t3Tickets = tickets.filter(
    (t) => t.escalationT3 && t.status !== 'Chiuso' && t.status !== 'Risolto'
  ).length;

  const unreadTransferCount = tickets.filter(
    (t) => t.lastTransfer?.toTechnicianId === currentUser.id && t.status !== 'Risolto' && t.status !== 'Chiuso'
  ).length;

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLoginSuccess={handleLoginSuccess}
        existingAccounts={accounts}
        onRegisterAccount={handleRegisterAccount}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#060d1f] text-slate-100 flex flex-col font-sans selection:bg-[#D4AF37] selection:text-[#060d1f]">
      {/* Top Navbar with Account & Role Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        openTicketCount={openTicketsForUser}
        t3EscalationCount={t3Tickets}
        onOpenOnlineModal={() => setIsOnlineModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        unreadTransferCount={unreadTransferCount}
      />

      {/* Ticket Transfer Modal */}
      <TransferTicketModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTicketToTransfer(null);
        }}
        ticket={ticketToTransfer}
        currentUser={currentUser}
        onTransferConfirmed={handleConfirmTransfer}
      />

      {/* Online & Sharing Modal */}
      <OnlineLiveModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        onOpenPortal={() => setCurrentView('portal')}
      />

      {/* Real-time Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-14 right-6 z-50 max-w-md rounded-2xl border border-[#D4AF37]/50 bg-[#0d1b3e]/95 px-4 py-3 shadow-2xl backdrop-blur flex items-center gap-3 text-xs text-[#F3C64F] ring-1 ring-[#D4AF37]/30 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Bell className="h-5 w-5 text-[#D4AF37] shrink-0 animate-bounce" />
          <div className="flex-1">
            <span className="font-semibold block text-white">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8">
        {/* 1. Portal for Users to Report Problems */}
        {currentView === 'portal' && (
          <UserReportPortal
            onTicketCreated={handleNewTicketCreated}
            onNavigateToInbox={(techId) => {
              if (currentUser.type === 'technician') {
                setCurrentView('inbox');
              } else {
                handleLogout();
              }
            }}
            currentUser={currentUser}
            allTickets={tickets}
            onLogout={handleLogout}
            onAskAI={handleAskAI}
          />
        )}

        {/* 2. Technicians' Inbox View (Isolated strictly by currentUser role) */}
        {currentView === 'inbox' && (
          <TechnicianInboxView
            tickets={tickets}
            currentUser={currentUser}
            onLogout={handleLogout}
            onStatusChange={handleStatusChange}
            onEscalateT3={handleEscalateT3}
            onAddNote={handleAddNote}
            onOpenTransferModal={(ticket) => {
              setTicketToTransfer(ticket);
              setIsTransferModalOpen(true);
            }}
            onAskAI={handleAskAI}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            lastArrivedTicketId={lastArrivedTicketId}
          />
        )}

        {/* 3. AI Helpdesk Chat */}
        {currentView === 'chat' && (
          <HelpdeskChat
            onNewTicketCreated={handleNewTicketCreated}
            onStatusChange={handleStatusChange}
            allTickets={tickets}
            initialPrompt={aiChatInitialPrompt}
            onClearInitialPrompt={() => setAiChatInitialPrompt(null)}
            activeTicketContext={activeTicketForAI}
          />
        )}

        {/* 4. Complete Ticket Register (Piccirilli / Coordinamento) */}
        {currentView === 'board' && (
          <TicketBoardView
            tickets={tickets}
            onStatusChange={handleStatusChange}
            onAskAI={handleAskAI}
          />
        )}

        {/* 5. ITSM Manual & Architecture Reference */}
        {currentView === 'design' && <ITSMDesignerView />}
      </main>

      {/* Operational Footer Bar */}
      <footer className="border-t border-[#162752] bg-[#070f24]/95 py-3 px-4 text-xs text-blue-300/70">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-blue-200/80 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Piattaforma ITSM Online • Profilo attivo: <strong className="text-white">{currentUser.displayName}</strong>
            </span>
            <span className="text-blue-900 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-blue-300/60">
              Segregazione Ruoli Attiva • Trasferimento Ticket Notificato
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-blue-300/70">
            <button
              onClick={handleLogout}
              className="hover:text-red-400 flex items-center gap-1 transition"
            >
              <Users className="h-3 w-3" />
              <span>Disconnetti ({currentUser.displayName.split(' ')[0]})</span>
            </button>
            <span className="text-blue-900">•</span>
            <button
              onClick={() => setIsOnlineModalOpen(true)}
              className="hover:text-[#F3C64F] flex items-center gap-1 transition"
            >
              <Globe className="h-3 w-3" />
              <span>Link Condivisione</span>
            </button>
            <span className="text-blue-900">•</span>
            <span className="font-mono text-blue-400/60">v3.0 Multi-Ruolo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
