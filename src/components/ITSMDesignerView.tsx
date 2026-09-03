import React, { useState } from 'react';
import { STAFF_MEMBERS, SLA_DEFINITIONS, ASSET_CATALOG } from '../data/itsmData';
import { PriorityLevel } from '../types';
import { 
  Network, 
  Layers, 
  Clock, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  Server, 
  Flame, 
  Gamepad2, 
  Coffee, 
  Building2,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

export const ITSMDesignerView: React.FC = () => {
  const [selectedImpact, setSelectedImpact] = useState<'Alto' | 'Medio' | 'Basso'>('Alto');
  const [selectedUrgency, setSelectedUrgency] = useState<'Alta' | 'Media' | 'Bassa'>('Alta');
  const [activeTab, setActiveTab] = useState<'routing' | 'matrix' | 'sla' | 'assets' | 'staff'>('routing');

  // Matrix calculation
  const calculatePriority = (impact: 'Alto' | 'Medio' | 'Basso', urgency: 'Alta' | 'Media' | 'Bassa'): {
    priority: PriorityLevel;
    label: string;
    slaResponse: string;
    slaResolution: string;
  } => {
    if (impact === 'Alto' && urgency === 'Alta') {
      return { priority: 'P1', label: 'Critico', slaResponse: '< 15 min', slaResolution: '< 2 ore' };
    }
    if ((impact === 'Alto' && urgency === 'Media') || (impact === 'Medio' && urgency === 'Alta')) {
      return { priority: 'P2', label: 'Alto', slaResponse: '< 30 min', slaResolution: '< 4 ore' };
    }
    if ((impact === 'Alto' && urgency === 'Bassa') || (impact === 'Medio' && urgency === 'Media') || (impact === 'Basso' && urgency === 'Alta')) {
      return { priority: 'P3', label: 'Medio', slaResponse: '< 2 ore', slaResolution: '< 8 ore' };
    }
    return { priority: 'P4', label: 'Basso', slaResponse: '< 4 ore', slaResolution: '< 24-48 ore' };
  };

  const calculated = calculatePriority(selectedImpact, selectedUrgency);

  const getPriorityColor = (p: PriorityLevel) => {
    switch (p) {
      case 'P1': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'P2': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'P3': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'P4': return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 mb-2">
              <Network className="h-3.5 w-3.5" />
              <span>Manuale di Architettura ITSM & Procedure Operative</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Progettazione del Sistema ITSM per Centro Operativo
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-3xl">
              Configurazione aggiornata dei ruoli, catena di triage T1, supporto specialistico T2 ed escalation esclusiva T3 per fornitori esterni centralizzata su Piccirilli.
            </p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          <button
            id="tab-routing"
            onClick={() => setActiveTab('routing')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'routing'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/60 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Workflow & Escalation T3</span>
          </button>

          <button
            id="tab-matrix"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'matrix'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/60 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>Matrice di Classificazione</span>
          </button>

          <button
            id="tab-sla"
            onClick={() => setActiveTab('sla')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'sla'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/60 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>SLA e Obiettivi di Risoluzione</span>
          </button>

          <button
            id="tab-staff"
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'staff'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/60 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Ruoli e Personale (RACI)</span>
          </button>

          <button
            id="tab-assets"
            onClick={() => setActiveTab('assets')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'assets'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/60 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Asset Censiti ({ASSET_CATALOG.length})</span>
          </button>
        </div>
      </div>

      {/* 1. ROUTING & ESCALATION WORKFLOW */}
      {activeTab === 'routing' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Logica di Routing ed Escalation Aggiornata</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Flusso standard per la gestione dei ticket dal momento della segnalazione fino alla risoluzione.
                </p>
              </div>
              <span className="rounded-md border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300">
                Regola Speciale Fornitori Attiva
              </span>
            </div>

            {/* Visual Workflow Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              {/* T1 */}
              <div className="rounded-xl border border-blue-500/40 bg-blue-950/20 p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-xs font-bold text-blue-400 border border-blue-500/30">
                    LIVELLO 1 (T1)
                  </span>
                  <span className="text-xs font-medium text-blue-300">Triage & Prima Accoglienza</span>
                </div>
                <h4 className="text-base font-bold text-white">Piccirilli (IT & Systems Manager)</h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>Ricezione segnalazione e prima diagnosi.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>Risoluzione diretta problematiche <strong>IT & Rete</strong> (Wi-Fi, gestionali, POS, videocamere, UPS).</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>Instradamento automatico al tecnico T2 competente per altri reparti.</span>
                  </li>
                </ul>
                <div className="pt-2 text-[11px] text-blue-300/80 font-mono">
                  SLA Assegnazione: Immediata
                </div>
              </div>

              {/* T2 */}
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-400 border border-amber-500/30">
                    LIVELLO 2 (T2)
                  </span>
                  <span className="text-xs font-medium text-amber-300">Specialisti di Reparto</span>
                </div>
                <h4 className="text-base font-bold text-white">Tecnici Specializzati Interni</h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="font-semibold text-amber-300">Benin:</span> Gaming & Cassa (Slot, Cambio Cash, Bowling, Casse).
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="font-semibold text-emerald-300">Padovani:</span> Facility & Sicurezza (Audio, Luci, Ventilazione, Allarme, Antincendio).
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="font-semibold text-rose-300">Ayoub:</span> Food & Beverage (Frigo, Tostapane, Distributori, Macchinetta caffè).
                  </div>
                </div>
                <div className="rounded bg-amber-950/50 p-2 border border-amber-500/30 text-[11px] text-amber-200">
                  ⚠️ <strong>Vincolo T2:</strong> Nessun tecnico T2 è abilitato a chiamare ditte o fornitori esterni.
                </div>
              </div>

              {/* T3 */}
              <div className="rounded-xl border border-purple-500/50 bg-purple-950/30 p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-purple-500/20 px-2 py-0.5 font-mono text-xs font-bold text-purple-300 border border-purple-500/40">
                    LIVELLO 3 (T3)
                  </span>
                  <span className="text-xs font-medium text-purple-300">Fornitori Esterni</span>
                </div>
                <h4 className="text-base font-bold text-white">Coordinamento Esclusivo Piccirilli</h4>
                <p className="text-xs text-slate-300">
                  Se il guasto richiede ricambi originali, intervento in garanzia del costruttore o ditta esterna specializzata:
                </p>
                <div className="rounded-lg bg-slate-900/90 p-3 border border-purple-500/30 space-y-1.5 text-xs text-purple-200">
                  <p className="font-semibold text-purple-300">Regola Incondizionata di Escalation:</p>
                  <p className="leading-relaxed">
                    Il ticket viene scalato a <strong>Piccirilli</strong>, che attiva il fornitore ufficiale (casa madre slot, ditta UTA/clima, costruttore macchina caffè, manutentore antincendio).
                  </p>
                </div>
                <div className="pt-1 text-[11px] text-purple-300/80 font-mono">
                  Referente T3 Unico: Piccirilli
                </div>
              </div>
            </div>

            {/* Escalation Policy Callout Card */}
            <div className="rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    Nota di Conformità ITSM — Gestione Contrattuale Fornitori (T3)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Al fine di garantire il controllo del budget, i contratti di manutenzione (SLA fornitore) e la tracciabilità delle chiamate esterne, nessun collaboratore (inclusi Benin, Padovani e Ayoub) ha la facoltà di autorizzare interventi o ordinare parti di ricambio a fornitori esterni. Il passaggio di consegne a Piccirilli è tracciato formalmente all'interno della scheda ticket.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CLASSIFICATION MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Matrice di Classificazione Priorità (Impatto x Urgenza)</h3>
              <p className="text-xs text-slate-400 mt-1">
                La severità di un ticket è determinata dall'incrocio tra la portata del danno operativo (Impatto) e la sensibilità temporale (Urgenza).
              </p>
            </div>

            {/* Interactive Calculator */}
            <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Simulatore di Calcolo Priorità ITSM
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Livello di Impatto (Danno o Numero Utenti Coinvolti)
                  </label>
                  <div className="flex gap-2">
                    {(['Alto', 'Medio', 'Basso'] as const).map((imp) => (
                      <button
                        key={imp}
                        onClick={() => setSelectedImpact(imp)}
                        className={`flex-1 rounded-lg py-2 text-xs font-semibold transition border ${
                          selectedImpact === imp
                            ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {imp}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {selectedImpact === 'Alto' && 'Blocco dell\'intero reparto o intero centro (es. cassa centrale, rete, allarme).'}
                    {selectedImpact === 'Medio' && 'Disservizio su singolo asset critico con alternativa parziale.'}
                    {selectedImpact === 'Basso' && 'Malfunzionamento circoscritto senza impatto sui clienti.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Livello di Urgenza (Pressione Temporale)
                  </label>
                  <div className="flex gap-2">
                    {(['Alta', 'Media', 'Bassa'] as const).map((urg) => (
                      <button
                        key={urg}
                        onClick={() => setSelectedUrgency(urg)}
                        className={`flex-1 rounded-lg py-2 text-xs font-semibold transition border ${
                          selectedUrgency === urg
                            ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {urg}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {selectedUrgency === 'Alta' && 'Richiede azione immediata durante le ore di punta o orario di apertura.'}
                    {selectedUrgency === 'Media' && 'Può tollerare qualche ora senza fermare il centro.'}
                    {selectedUrgency === 'Bassa' && 'Pianificabile entro il turno successivo o a fine settimana.'}
                  </p>
                </div>
              </div>

              {/* Result Box */}
              <div className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 ${getPriorityColor(calculated.priority)}`}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black font-mono">
                    {calculated.priority}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm">Priorità {calculated.label}</h5>
                    <p className="text-xs opacity-90">
                      Impatto {selectedImpact} × Urgenza {selectedUrgency}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase opacity-75">Presa in Carico SLA</span>
                    <span className="font-bold font-mono">{calculated.slaResponse}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase opacity-75">Tempo Risoluzione SLA</span>
                    <span className="font-bold font-mono">{calculated.slaResolution}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Static Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300 border border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="p-3 border-b border-slate-800">Impatto \ Urgenza</th>
                    <th className="p-3 border-b border-slate-800 text-center">Urgenza Alta</th>
                    <th className="p-3 border-b border-slate-800 text-center">Urgenza Media</th>
                    <th className="p-3 border-b border-slate-800 text-center">Urgenza Bassa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  <tr>
                    <td className="p-3 font-semibold text-white bg-slate-950/40">Impatto Alto</td>
                    <td className="p-3 text-center bg-red-500/10 text-red-400 font-bold border-l border-slate-800">
                      P1 - Critico
                    </td>
                    <td className="p-3 text-center bg-amber-500/10 text-amber-400 font-bold border-l border-slate-800">
                      P2 - Alto
                    </td>
                    <td className="p-3 text-center bg-blue-500/10 text-blue-400 font-bold border-l border-slate-800">
                      P3 - Medio
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white bg-slate-950/40">Impatto Medio</td>
                    <td className="p-3 text-center bg-amber-500/10 text-amber-400 font-bold border-l border-slate-800">
                      P2 - Alto
                    </td>
                    <td className="p-3 text-center bg-blue-500/10 text-blue-400 font-bold border-l border-slate-800">
                      P3 - Medio
                    </td>
                    <td className="p-3 text-center bg-slate-500/10 text-slate-300 font-bold border-l border-slate-800">
                      P4 - Basso
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white bg-slate-950/40">Impatto Basso</td>
                    <td className="p-3 text-center bg-blue-500/10 text-blue-400 font-bold border-l border-slate-800">
                      P3 - Medio
                    </td>
                    <td className="p-3 text-center bg-slate-500/10 text-slate-300 font-bold border-l border-slate-800">
                      P4 - Basso
                    </td>
                    <td className="p-3 text-center bg-slate-500/10 text-slate-300 font-bold border-l border-slate-800">
                      P4 - Basso
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SLA DEFINITIONS */}
      {activeTab === 'sla' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SLA_DEFINITIONS.map((sla) => (
            <div
              key={sla.level}
              className={`rounded-xl border p-5 space-y-4 shadow-lg bg-slate-900/90 ${sla.badgeBorder}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-md border px-2.5 py-1 font-mono text-xs font-bold ${sla.badgeBg} ${sla.badgeBorder} ${sla.badgeText}`}>
                    {sla.level} - {sla.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Target Vincolante</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {sla.description}
              </p>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 font-mono text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-sans">Presa in Carico</span>
                  <span className="font-bold text-white">{sla.responseTime}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-sans">Tempo di Risoluzione</span>
                  <span className="font-bold text-white">{sla.resolutionTime}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Esempi Tipici Centro Operativo:
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {sla.examples.map((ex, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-cyan-400">•</span>
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. STAFF & ROLES (RACI) */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STAFF_MEMBERS.map((staff) => (
              <div
                key={staff.id}
                className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-lg hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${staff.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                      {staff.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{staff.name}</h4>
                      <p className="text-xs text-cyan-400 font-medium">{staff.role}</p>
                    </div>
                  </div>

                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                    staff.canCallVendors
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {staff.canCallVendors ? 'T3 Autorizzato' : 'T2 Interno'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Livelli di Supporto:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {staff.levels.map((lvl, idx) => (
                        <span key={idx} className="rounded bg-slate-800 px-2 py-0.5 text-slate-200 border border-slate-700 text-[11px]">
                          {lvl}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase mt-2">Asset in Gestione Diretta:</span>
                    <p className="text-slate-200 font-medium mt-0.5">
                      {staff.assets.join(', ')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Responsabilità & Vincoli:</span>
                    <p className="text-xs text-slate-300 mt-1 italic">
                      "{staff.specialDuty}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ASSET INVENTORY */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-white text-sm">Registro Asset Censiti per Categoria</h4>
              <span className="text-xs text-slate-400">Totale: {ASSET_CATALOG.length} asset monitorati</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Asset</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Tecnico T1/T2</th>
                    <th className="p-3">Criticità</th>
                    <th className="p-3">Descrizione Tecnica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {ASSET_CATALOG.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                        {asset.name}
                      </td>
                      <td className="p-3">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                          {asset.category}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-emerald-400">
                        {asset.assignedTechnician} ({asset.level})
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          asset.criticality === 'Critica' 
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40' 
                            : asset.criticality === 'Alta' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}>
                          {asset.criticality}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 max-w-xs truncate" title={asset.description}>
                        {asset.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
