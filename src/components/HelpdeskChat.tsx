import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ITSMTicket, TicketStatus } from '../types';
import { QUICK_PROMPTS } from '../data/itsmData';
import { TicketCard } from './TicketCard';
import { analyzeIncidentClientSide } from '../utils/itsmEngine';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ShieldCheck,
  Zap,
  Cpu
} from 'lucide-react';

interface HelpdeskChatProps {
  onNewTicketCreated: (ticket: ITSMTicket) => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
  allTickets: ITSMTicket[];
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
  activeTicketContext?: ITSMTicket | null;
}

export const HelpdeskChat: React.FC<HelpdeskChatProps> = ({
  onNewTicketCreated,
  onStatusChange,
  allTickets,
  initialPrompt,
  onClearInitialPrompt,
  activeTicketContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Benvenuto nel Centro Operativo ITSM. Sono l'Assistente Virtuale di Helpdesk.\n\nInserisci una segnalazione descrivendo il problema riscontrato (es. guasto slot, caduta rete, anomalia ventilazione, macchinetta del caffè o necessità fornitore esterno).\n\nProvvederò all'identificazione immediata dell'asset, al calcolo di priorità/SLA, all'assegnazione al tecnico competente (Piccirilli, Benin, Padovani, Ayoub) e all'eventuale escalation T3 a Piccirilli per i fornitori esterni.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [engineSource, setEngineSource] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);
  isTypingRef.current = isTyping;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      const text = initialPrompt.trim();
      onClearInitialPrompt?.();
      const timer = setTimeout(() => {
        handleSendMessage(text);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputValue).trim();
    if (!messageContent || isTypingRef.current) return;

    const userMsgId = `user-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: messageContent,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Call server-side API (Gemini or deterministic fallback)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          ticketContext: activeTicketContext || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEngineSource(data.source || 'gemini-3.8-flash');

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: data.reply || 'Segnalazione presa in carico con successo.',
          timestamp: new Date().toISOString(),
          ticket: data.ticket ? {
            ...data.ticket,
            id: activeTicketContext ? activeTicketContext.id : `ticket-${Date.now()}`,
            ticketId: activeTicketContext ? activeTicketContext.ticketId : data.ticket.ticketId,
            userMessage: activeTicketContext ? activeTicketContext.userMessage : messageContent,
            status: activeTicketContext ? (activeTicketContext.status === 'Aperto' ? 'In Lavorazione' : activeTicketContext.status) : (data.ticket.escalationT3 ? 'Escalato T3' : 'Aperto'),
          } : undefined,
        };

        // Only register as new ticket if not already an existing active ticket
        if (botMsg.ticket && !activeTicketContext) {
          onNewTicketCreated(botMsg.ticket);
        }

        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('Server returned non-200');
      }
    } catch (err) {
      console.warn('Network or API issue, using local ITSM engine client-side:', err);
      // Client-side fallback
      const localTicket = analyzeIncidentClientSide(messageContent);
      setEngineSource('local-itsm-rule-engine');

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: `Presa in carico ed elaborazione con motore di regole ITSM:\n\n${localTicket.rawResponse}`,
        timestamp: new Date().toISOString(),
        ticket: activeTicketContext ? {
          ...localTicket,
          id: activeTicketContext.id,
          ticketId: activeTicketContext.ticketId,
          status: activeTicketContext.status === 'Aperto' ? 'In Lavorazione' : activeTicketContext.status,
        } : localTicket,
      };

      if (!activeTicketContext) {
        onNewTicketCreated(localTicket);
      }
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: `Sessione riavviata. Pronto per una nuova segnalazione di Helpdesk.`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-6xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Top Banner / Assistant Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-5 py-3.5 gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md text-white">
            <Bot className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Assistente Virtuale Helpdesk & ITSM
              </h2>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[11px] font-medium text-cyan-400">
                Triage & Routing Automatico
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Presidio attivo: Gaming • Food & Beverage • Facility & Sicurezza • IT & Rete
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {engineSource && (
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-400">
              <Cpu className="h-3 w-3 text-cyan-400" />
              <span>{engineSource.includes('gemini') ? 'Gemini 3.8 Flash' : 'Motore Regole ITSM'}</span>
            </div>
          )}

          <button
            id="btn-reset-chat"
            onClick={handleResetChat}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 transition"
            title="Pulisci cronologia chat"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Nuova Sessione</span>
          </button>
        </div>
      </div>

      {/* Active Ticket Context Banner (when navigating from a ticket) */}
      {activeTicketContext && (
        <div className="bg-gradient-to-r from-indigo-950/90 via-blue-950/80 to-slate-900 border-b border-indigo-500/40 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-2 text-indigo-200">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 animate-pulse" />
            <span>
              <strong>Presa in carico attiva per il Ticket</strong> <strong className="text-white font-mono bg-indigo-900/80 px-1.5 py-0.5 rounded border border-indigo-500/40">#{activeTicketContext.ticketId}</strong>: <span className="text-cyan-300 font-semibold">{activeTicketContext.asset}</span> ({activeTicketContext.category} • Priorità {activeTicketContext.priority})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-emerald-300 font-medium bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              ⚡ Richiesta inviata: Generazione passaggi di soluzione
            </span>
          </div>
        </div>
      )}

      {/* Rules Notice Badge */}
      <div className="bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-indigo-950/40 border-b border-slate-800/60 px-5 py-2 text-xs text-slate-300 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Regola Escalation Fornitori (T3):</strong> Qualsiasi intervento esterno viene scalato in esclusiva a <strong>Piccirilli</strong>. I tecnici T2 (Benin, Padovani, Ayoub) non contattano terze parti.
          </span>
        </div>
        <span className="hidden md:inline-block font-mono text-[11px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
          SLA: P1 (&lt;15m) • P2 (&lt;30m) • P3 (&lt;2h) • P4 (&lt;4h)
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mt-1">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div className={`max-w-2xl space-y-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs font-medium'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-xs'
                }`}
              >
                {/* Regular text / markdown format rendering */}
                <div className="whitespace-pre-wrap">
                  {msg.text}
                </div>
                <div
                  className={`mt-1.5 text-[10px] ${
                    msg.sender === 'user' ? 'text-cyan-100/70 text-right' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Formatted Ticket Card if attached */}
              {msg.ticket && (
                <div className="w-full">
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Scheda Ticket Ufficiale Registrata</span>
                  </div>
                  <TicketCard
                    ticket={msg.ticket}
                    onStatusChange={onStatusChange}
                  />
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 mt-1">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3.5 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mt-1">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-bl-xs border border-slate-700/60 bg-slate-800/90 px-4 py-3 shadow-md flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span>
                  {activeTicketContext
                    ? `L'Assistente AI ha preso in carico il Ticket #${activeTicketContext.ticketId} e sta elaborando la serie di passaggi per risolverlo...`
                    : 'Analisi asset, severità e routing in corso...'}
                </span>
              </div>
              <div className="flex gap-1 ml-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Carousel */}
      <div className="border-t border-slate-800/70 bg-slate-950/60 px-4 py-2.5">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-400">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>Segnalazioni rapide di test (prova il routing):</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.prompt)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:bg-slate-800 hover:border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition group"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
              <span className="font-medium text-slate-200 group-hover:text-white">{qp.label}</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                {qp.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Composer */}
      <div className="border-t border-slate-800 bg-slate-950 p-3 md:p-4">
        <div className="relative flex items-end rounded-xl border border-slate-700/80 bg-slate-900 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 shadow-inner">
          <textarea
            ref={inputRef}
            id="helpdesk-chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descrivi il problema (es. 'La slot 7 ha il monitor spento', 'Perdita d'acqua dal frigo bar', 'Serve il fornitore esterno per la cassa 2')..."
            rows={2}
            className="w-full resize-none bg-transparent px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          <div className="p-2">
            <button
              id="btn-send-message"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Invia segnalazione"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500">
          <span>Premi Invio per inviare • Shift + Invio per andare a capo</span>
          <span>Formato conforme standard ITSM P1-P4 & Catena T1/T2/T3</span>
        </div>
      </div>
    </div>
  );
};
