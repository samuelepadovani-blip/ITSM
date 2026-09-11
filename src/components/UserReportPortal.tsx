import React, { useState } from 'react';
import { ITSMTicket, PriorityLevel, UserAccount } from '../types';
import { analyzeIncidentClientSide } from '../utils/itsmEngine';
import { 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  MapPin, 
  User, 
  Wrench, 
  Flame, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  RefreshCw,
  ExternalLink,
  Laptop,
  Gamepad2,
  Coffee,
  Building2,
  Users,
  Lock,
  ArrowRightLeft
} from 'lucide-react';

interface UserReportPortalProps {
  onTicketCreated: (ticket: ITSMTicket) => void;
  onNavigateToInbox: (technicianId?: string) => void;
  currentUser?: UserAccount;
  allTickets?: ITSMTicket[];
  onLogout?: () => void;
  onAskAI?: (ticket: ITSMTicket) => void;
}

export const UserReportPortal: React.FC<UserReportPortalProps> = ({
  onTicketCreated,
  onNavigateToInbox,
  currentUser,
  allTickets = [],
  onLogout,
  onAskAI,
}) => {
  const [reporterName, setReporterName] = useState(currentUser?.displayName || 'Marco (Staff Centro)');
  const [reporterZone, setReporterZone] = useState('Sala Slot Nord - Postazione 14');
  const [userMessage, setUserMessage] = useState('');
  const [urgencyOverride, setUrgencyOverride] = useState<'Normale' | 'Urgente' | 'Critico'>('Normale');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<ITSMTicket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tickets created by or pertinent to this user
  const userTickets = allTickets.filter(
    (t) => t.reporterName?.toLowerCase().includes(reporterName.toLowerCase().split(' ')[0]) ||
           t.reporterName?.toLowerCase().includes('marco') ||
           t.reporterName?.toLowerCase().includes('utente')
  );

  const PRESET_SCENARIOS = [
    {
      title: 'Gaming & Casse',
      icon: Gamepad2,
      color: 'border-amber-500/40 text-amber-300 hover:bg-amber-950/30',
      reporter: 'Marco (Operatore Slot)',
      zone: 'Sala Slot Nord - Postazione 14',
      message: 'Slot Machine n. 14 con gettoniera inceppata e schermo che mostra codice errore E-22.',
      target: 'Benin (Gaming)',
    },
    {
      title: 'Facility & Clima',
      icon: Building2,
      color: 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/30',
      reporter: 'Davide (Sala Bowling)',
      zone: 'Area Piste 1-8',
      message: 'Sistema di ventilazione UTA bloccato, forte rumore di sfregamento e temperatura in aumento.',
      target: 'Padovani (Facility)',
    },
    {
      title: 'Food & Beverage',
      icon: Coffee,
      color: 'border-rose-500/40 text-rose-300 hover:bg-rose-950/30',
      reporter: 'Sara (Caposala Bar)',
      zone: 'Bancone Bar Centrale',
      message: 'La macchinetta del caffè perde copiosamente acqua dalla base e la lancia vapore non ha pressione.',
      target: 'Ayoub (F&B)',
    },
    {
      title: 'IT & Reti',
      icon: Laptop,
      color: 'border-blue-500/40 text-blue-300 hover:bg-blue-950/30',
      reporter: 'Amministrazione Cassa',
      zone: 'Cassa Reception',
      message: 'Il POS e il terminale di cassa non riescono a contattare il gateway di rete e le transazioni falliscono.',
      target: 'Piccirilli (IT)',
    },
    {
      title: 'Escalation T3 (Fornitore Esterno)',
      icon: Flame,
      color: 'border-purple-500/50 text-purple-300 hover:bg-purple-950/40',
      reporter: 'Matteo (Staff Gaming)',
      zone: 'Sala VLT',
      message: 'La slot 08 ha la scheda madre completamente bruciata dopo sbalzo di tensione, serve ricambio dal costruttore in garanzia.',
      target: 'Escalation Piccirilli (T3)',
    },
  ];

  const applyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setReporterName(preset.reporter);
    setReporterZone(preset.zone);
    setUserMessage(preset.message);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim()) {
      setErrorMessage('Inserisci una descrizione del disservizio riscontrato.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let created: ITSMTicket | null = null;

      try {
        const res = await fetch('/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userMessage: userMessage.trim(),
            reporterName: reporterName.trim() || 'Operatore Centro',
            reporterZone: reporterZone.trim() || 'Generale',
            urgencyOverride,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.ticket) {
            created = data.ticket;
          }
        }
      } catch (networkErr) {
        console.warn('Server ticket creation network error, applying local rule engine fallback:', networkErr);
      }

      // If server could not be reached or failed, use local deterministic ITSM engine
      if (!created) {
        const local = analyzeIncidentClientSide(userMessage.trim());
        const now = new Date();
        const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        if (urgencyOverride) {
          if (urgencyOverride === 'Critico') {
            local.priority = 'P1';
            local.sla = 'P1 Critico - Presa in carico < 15 min / Risoluzione < 2h';
          } else if (urgencyOverride === 'Urgente') {
            local.priority = 'P2';
            local.sla = 'P2 Alto - Presa in carico < 30 min / Risoluzione < 4h';
          } else if (urgencyOverride === 'Normale') {
            local.priority = 'P3';
            local.sla = 'P3 Medio - Presa in carico < 2h / Risoluzione < 8h';
          }
        }

        created = {
          ...local,
          id: `ticket-${Date.now()}`,
          reporterName: reporterName.trim() || 'Operatore Centro',
          reporterZone: reporterZone.trim() || 'Generale',
          timestamp: timeStr,
          createdAtIso: now.toISOString(),
          status: local.escalationT3 ? 'Escalato T3' : 'Aperto',
          history: [
            { timestamp: timeStr, action: `Segnalazione inviata da: ${reporterName.trim() || 'Operatore'}`, by: reporterName.trim() || 'Operatore' },
            { timestamp: timeStr, action: `Instradato a: ${local.assignedTo}`, by: 'Sistema Triage ITSM' }
          ]
        };
      }

      setCreatedTicket(created);
      onTicketCreated(created);
      setUserMessage('');
    } catch (err: any) {
      console.error('Submit error:', err);
      setErrorMessage(err.message || 'Errore imprevisto durante l\'elaborazione della segnalazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl border border-[#1A3166] bg-[#0A1636] p-6 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F3C64F]">
            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>Portale Segnalazione Disservizi Centro Operativo</span>
          </div>

          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-xl border border-[#1A3166] bg-[#0E1F4B] px-3 py-1.5 text-xs text-blue-200 hover:bg-red-950/40 hover:border-red-500/40 hover:text-red-300 transition"
            >
              <Users className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Connesso: <strong>{currentUser.displayName}</strong> (Logout)</span>
            </button>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F3C64F] tracking-tight">
          Segnala un Guasto o Disservizio
        </h1>
        <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-2xl">
          Descrivi l'anomalia riscontrata su qualsiasi asset (Slot, Impianto Audio/Luci, Rete/POS, Macchinette Caffè, ecc.). Il sistema analizzerà la richiesta e assegnerà istantaneamente il ticket al tecnico competente (Piccirilli, Benin, Padovani o Ayoub) notificandolo in tempo reale.
        </p>
      </div>

      {/* Confirmation Card after Ticket Creation */}
      {createdTicket && (
        <div className="rounded-2xl border border-[#D4AF37]/50 bg-[#0A1636]/95 p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-[#D4AF37]/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#F3C64F] border border-[#D4AF37]/30">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#F3C64F] uppercase tracking-wider block">
                  Segnalazione Inviata con Successo
                </span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Ticket Creato:</span>
                  <span className="font-mono text-[#F3C64F]">#{createdTicket.ticketId}</span>
                </h3>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
              createdTicket.priority === 'P1'
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : createdTicket.priority === 'P2'
                ? 'bg-[#D4AF37]/15 text-[#F3C64F] border-[#D4AF37]/40'
                : 'bg-[#0E1F4B] text-blue-200 border-[#1E3975]'
            }`}>
              {createdTicket.priority} • {createdTicket.sla.split('-')[0]}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#070F24]/80 border border-[#1A3166] text-xs">
            <div>
              <span className="text-blue-300/70 block text-[11px]">Asset Rilevato:</span>
              <strong className="text-white font-medium">{createdTicket.asset}</strong>
            </div>
            <div>
              <span className="text-blue-300/70 block text-[11px]">Reparto / Categoria:</span>
              <strong className="text-[#F3C64F] font-medium">{createdTicket.category}</strong>
            </div>
            <div>
              <span className="text-blue-300/70 block text-[11px]">Tecnico Assegnatario:</span>
              <strong className="text-white font-medium">{createdTicket.assignedTo}</strong>
            </div>
            <div>
              <span className="text-blue-300/70 block text-[11px]">Livello Supporto:</span>
              <strong className="text-purple-300 font-medium font-mono">{createdTicket.assignedLevel}</strong>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#070F24]/50 border border-[#1A3166] text-xs text-blue-200 space-y-1">
            <div className="font-semibold text-blue-100">Azione Operativa Programmata:</div>
            <p className="text-blue-300/80 text-xs">{createdTicket.actionRequired}</p>
          </div>

          {createdTicket.escalationT3 && (
            <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-3 text-xs text-purple-200 flex items-center gap-2">
              <Flame className="h-4 w-4 text-purple-400 shrink-0" />
              <span>
                <strong>Nota Escalation T3:</strong> Questo ticket necessita di intervento del fornitore esterno. È stato indirizzato prioritariamente a <strong>Piccirilli</strong> per l'apertura della chiamata fornitore.
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setCreatedTicket(null)}
              className="rounded-xl border border-[#1A3166] bg-[#0E1F4B] px-4 py-2 text-xs font-semibold text-blue-200 hover:bg-[#152B66] hover:text-white transition"
            >
              Invia un'altra segnalazione
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {onAskAI && (
                <button
                  onClick={() => onAskAI(createdTicket)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#F3C64F] hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/60 transition shadow-sm"
                  title="Inoltra la richiesta all'Assistente AI per approfondimenti e istruzioni immediate"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span>Chiedi all'Assistente AI</span>
                </button>
              )}

              <button
                onClick={() => onNavigateToInbox(createdTicket.assignedTechnicianId)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] hover:brightness-110 px-4 py-2 text-xs font-bold text-[#070F26] shadow-md shadow-[#D4AF37]/20 transition"
              >
                <span>Vedi Arrivo nella Postazione di {createdTicket.assignedTo}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Box */}
      {!createdTicket && (
        <div className="rounded-2xl border border-[#1A3166] bg-[#0A1636]/80 p-5 sm:p-7 shadow-xl space-y-6">
          {/* Fast Test Presets */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>Scenari di Prova Rapida:</span>
              </span>
              <span className="text-[11px] text-blue-300/60 hidden sm:inline">
                Clicca per autocompilare e testare l'instradamento ai diversi tecnici
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {PRESET_SCENARIOS.map((preset, idx) => {
                const IconComp = preset.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition bg-[#070F24]/80 ${preset.color}`}
                  >
                    <IconComp className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">{preset.title}</div>
                      <div className="text-[10px] text-blue-300/70 truncate">
                        Destinatario: {preset.target}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-[#1A3166]" />

          {/* User Input Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reporter Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-200">
                  <User className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span>Nome Segnalatore o Ruolo *</span>
                </label>
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Es. Marco (Sala Slot), Laura (Bar)..."
                  className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                />
              </div>

              {/* Location / Zone */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-200">
                  <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span>Ubicazione / Postazione *</span>
                </label>
                <input
                  type="text"
                  required
                  value={reporterZone}
                  onChange={(e) => setReporterZone(e.target.value)}
                  placeholder="Es. Sala Nord - Slot 14, Bancone Bar, ecc."
                  className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                />
              </div>
            </div>

            {/* Problem Description (Core field requested by prof) */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-semibold text-blue-200">
                <div className="flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span>Descrizione del problema o anomalia *</span>
                </div>
                <span className="text-[11px] text-blue-300/60 font-normal">
                  Scrivi in linguaggio naturale
                </span>
              </label>
              <textarea
                rows={4}
                required
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Scrivi qui cosa è successo... (Es. La slot 14 si è spenta all'improvviso, fuma la scheda madre e serve il fornitore in garanzia; oppure: Il tostapane fa scattare il salvavita del bar...)"
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] p-3.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 leading-relaxed resize-none"
              />
            </div>

            {/* Urgency Level selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-blue-200">
                Gravità percepita dall'utente:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Normale', 'Urgente', 'Critico'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setUrgencyOverride(lvl)}
                    className={`rounded-xl py-2 px-3 text-xs font-semibold transition border text-center ${
                      urgencyOverride === lvl
                        ? lvl === 'Critico'
                          ? 'bg-red-500/20 border-red-500 text-red-300 font-bold'
                          : lvl === 'Urgente'
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3C64F] font-bold'
                          : 'bg-[#0E1F4B] border-blue-400 text-blue-100 font-bold'
                        : 'bg-[#070F24] border-[#1A3166] text-blue-200/60 hover:bg-[#0C1A3D]'
                    }`}
                  >
                    {lvl === 'Critico' ? '🔴 Critico (Fermo Sala)' : lvl === 'Urgente' ? '🟡 Urgente' : '🟢 Normale'}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-3 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="submit-ticket-btn"
              type="submit"
              disabled={isSubmitting || !userMessage.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] hover:brightness-110 py-3 text-sm font-bold text-[#070F26] shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-[#070F26]" />
                  <span>Analisi ITSM e Instradamento al Tecnico in corso...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 text-[#070F26] stroke-[2.5]" />
                  <span>Invia Segnalazione e Notifica Tecnico Competente</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Tracked Tickets by Reporter */}
      {userTickets.length > 0 && (
        <div className="rounded-2xl border border-[#1A3166] bg-[#0A1636]/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#D4AF37]" />
              <span>Stato delle Tue Segnalazioni Recenti ({userTickets.length})</span>
            </h3>
            <span className="text-[11px] text-blue-300/60">Aggiornato in tempo reale</span>
          </div>

          <div className="space-y-2.5">
            {userTickets.map((t) => (
              <div
                key={t.ticketId}
                className="rounded-xl border border-[#15254A] bg-[#070F24]/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">#{t.ticketId}</span>
                    <span className="font-semibold text-[#F3C64F]">{t.asset}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      t.status === 'Risolto'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : t.status === 'In Lavorazione'
                        ? 'bg-[#D4AF37]/15 text-[#F3C64F] border-[#D4AF37]/40'
                        : 'bg-[#0E1F4B] text-blue-200 border-[#1E3975]'
                    }`}>
                      {t.status}
                    </span>
                    {t.lastTransfer && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#F3C64F] bg-[#0A1636] border border-[#D4AF37]/40 px-1.5 py-0.2 rounded">
                        <ArrowRightLeft className="h-3 w-3" />
                        Spostato a {t.assignedTo}
                      </span>
                    )}
                  </div>
                  <p className="text-blue-200/80 text-xs line-clamp-1">"{t.userMessage}"</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-blue-300/70 text-[11px]">
                  <span>Preso in carico da: <strong className="text-white">{t.assignedTo}</strong></span>
                  <span className="font-mono text-blue-400/60">{t.timestamp}</span>
                  {onAskAI && (
                    <button
                      onClick={() => onAskAI(t)}
                      className="flex items-center gap-1 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1 text-[11px] font-semibold text-[#F3C64F] hover:bg-[#D4AF37]/20 transition"
                      title="Chiedi supporto all'Assistente AI per questa segnalazione"
                    >
                      <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                      <span>Chiedi all'AI</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
