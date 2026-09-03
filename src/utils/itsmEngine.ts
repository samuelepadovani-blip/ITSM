import { ITSMTicket, PriorityLevel } from '../types';

export function analyzeIncidentClientSide(userMessage: string): ITSMTicket {
  const text = userMessage.toLowerCase();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const ticketId = `TCK-${yyyy}${mm}${dd}-${randomSuffix}`;

  // 1. Asset & Category Identification
  let asset = 'Asset da verificare in Triage';
  let category = 'IT';
  let assignedTo = 'Piccirilli (IT & Systems Manager)';

  // IT & Rete (Piccirilli)
  if (
    text.includes('rete') ||
    text.includes('wifi') ||
    text.includes('switch') ||
    text.includes('router') ||
    text.includes('connessione') ||
    text.includes('fibra') ||
    text.includes('internet')
  ) {
    asset = 'Sistema di rete';
    category = 'IT';
    assignedTo = 'Piccirilli (IT & Systems Manager)';
  } else if (
    text.includes('gestional') ||
    text.includes('software') ||
    text.includes('server') ||
    text.includes('database') ||
    text.includes('programma') ||
    text.includes('anagrafic')
  ) {
    asset = 'Gestionali';
    category = 'IT';
    assignedTo = 'Piccirilli (IT & Systems Manager)';
  } else if (
    text.includes('videocamer') ||
    text.includes('telecamer') ||
    text.includes('cctv') ||
    text.includes('videosorveglianza') ||
    text.includes('nvr')
  ) {
    asset = 'Videocamere';
    category = 'IT';
    assignedTo = 'Piccirilli (IT & Systems Manager)';
  } else if (
    text.includes('pos') ||
    text.includes('bancomat') ||
    text.includes('carta di credito') ||
    text.includes('transazione elettronica')
  ) {
    asset = 'POS';
    category = 'IT';
    assignedTo = 'Piccirilli (IT & Systems Manager)';
  } else if (
    text.includes('continuità') ||
    text.includes('continuita') ||
    text.includes('ups') ||
    text.includes('batteria di backup') ||
    text.includes('gruppo elettrogeno')
  ) {
    asset = 'Gruppo di continuità';
    category = 'IT';
    assignedTo = 'Piccirilli (IT & Systems Manager)';
  }
  // Gaming & Cassa (Benin)
  else if (
    text.includes('slot') ||
    text.includes('vlt') ||
    text.includes('awp') ||
    text.includes('macchinetta')
  ) {
    asset = 'Slot';
    category = 'Gaming';
    assignedTo = 'Benin (Gaming & Cash Technician)';
  } else if (
    text.includes('cambio cash') ||
    text.includes('cambiamonete') ||
    text.includes('scambiamonete') ||
    text.includes('erogatore cash') ||
    text.includes('distributore monete')
  ) {
    asset = 'Cambio Cash';
    category = 'Gaming';
    assignedTo = 'Benin (Gaming & Cash Technician)';
  } else if (
    text.includes('bowling') ||
    text.includes('pista') ||
    text.includes('birill') ||
    text.includes('posabirilli') ||
    text.includes('boccia')
  ) {
    asset = 'Bowling';
    category = 'Gaming';
    assignedTo = 'Benin (Gaming & Cash Technician)';
  } else if (
    text.includes('cassa') ||
    text.includes('casse') ||
    text.includes('registratore') ||
    text.includes('cassetto contanti') ||
    text.includes('stampante fiscale')
  ) {
    asset = 'Casse';
    category = 'Gaming';
    assignedTo = 'Benin (Gaming & Cash Technician)';
  }
  // Facility & Sicurezza (Padovani)
  else if (
    text.includes('audio') ||
    text.includes('altoparlant') ||
    text.includes('microfon') ||
    text.includes('musica') ||
    text.includes('amplificator')
  ) {
    asset = 'Impianto audio';
    category = 'Facility';
    assignedTo = 'Padovani (Facility & Safety Technician)';
  } else if (
    text.includes('luci') ||
    text.includes('luce') ||
    text.includes('lampad') ||
    text.includes('faretto') ||
    text.includes('illuminazione') ||
    text.includes('led')
  ) {
    asset = 'Luci';
    category = 'Facility';
    assignedTo = 'Padovani (Facility & Safety Technician)';
  } else if (
    text.includes('ventilazione') ||
    text.includes('clima') ||
    text.includes('aria') ||
    text.includes('condizionat') ||
    text.includes('uta') ||
    text.includes('hvac')
  ) {
    asset = 'Sistema di ventilazione';
    category = 'Facility';
    assignedTo = 'Padovani (Facility & Safety Technician)';
  } else if (
    text.includes('antincendio') ||
    text.includes('fumo') ||
    text.includes('incendio') ||
    text.includes('sprinkler') ||
    text.includes('estintor') ||
    text.includes('porte tagliafuoco')
  ) {
    asset = 'Antincendio';
    category = 'Facility';
    assignedTo = 'Padovani (Facility & Safety Technician)';
  } else if (
    text.includes('allarme') ||
    text.includes('antifurto') ||
    text.includes('sirena') ||
    text.includes('volumetric') ||
    text.includes('intrusione')
  ) {
    asset = 'Allarme';
    category = 'Facility';
    assignedTo = 'Padovani (Facility & Safety Technician)';
  }
  // Food & Beverage (Ayoub)
  else if (
    text.includes('frigo') ||
    text.includes('frigorifero') ||
    text.includes('cella') ||
    text.includes('freezer') ||
    text.includes('congelat')
  ) {
    asset = 'Frigo';
    category = 'F&B';
    assignedTo = 'Ayoub (Food & Beverage Coordinator)';
  } else if (
    text.includes('tostapan') ||
    text.includes('piastra') ||
    text.includes('tostier') ||
    text.includes('toast')
  ) {
    asset = 'Tostapane';
    category = 'F&B';
    assignedTo = 'Ayoub (Food & Beverage Coordinator)';
  } else if (
    text.includes('distributore') ||
    text.includes('vending') ||
    text.includes('snack') ||
    text.includes('merend')
  ) {
    asset = 'Distributori automatici';
    category = 'F&B';
    assignedTo = 'Ayoub (Food & Beverage Coordinator)';
  } else if (
    text.includes('caffè') ||
    text.includes('caffe') ||
    text.includes('espresso') ||
    text.includes('caldaia') ||
    text.includes('macinad')
  ) {
    asset = 'Macchinetta del caffè';
    category = 'F&B';
    assignedTo = 'Ayoub (Food & Beverage Coordinator)';
  }

  // 2. Escalation T3 Check (External Vendor)
  const needsT3 =
    text.includes('fornitore') ||
    text.includes('esterno') ||
    text.includes('costruttore') ||
    text.includes('garanzia') ||
    text.includes('pezzo di ricambio') ||
    text.includes('ricambi') ||
    text.includes('manutentore esterno') ||
    text.includes('assistenza tecnica ufficiale') ||
    text.includes('scheda madre bruciata') ||
    text.includes('non riparabile internamente') ||
    text.includes('intervento della casa madre') ||
    text.includes('ditta esterna') ||
    text.includes('assistenza della casa madre') ||
    text.includes('tecnico esterno') ||
    text.includes('ditta specializzata');

  // 3. Priority & SLA Determination
  let priority: PriorityLevel = 'P3';
  let sla = 'Presa in carico < 2h / Risoluzione < 8h';

  if (
    text.includes('blocco') ||
    text.includes('fermo totale') ||
    text.includes('incendio') ||
    text.includes('pericolo') ||
    text.includes('antincendio') ||
    text.includes('urgente') ||
    text.includes('critico') ||
    text.includes('tutte le casse') ||
    text.includes('tutta la rete') ||
    text.includes('blackout') ||
    text.includes('corto circuito')
  ) {
    priority = 'P1';
    sla = 'P1 Critico - Presa in carico < 15 min / Risoluzione < 2h';
  } else if (
    text.includes('grave') ||
    text.includes('alto') ||
    text.includes('bloccata') ||
    text.includes('non funziona') ||
    text.includes('guasto') ||
    text.includes('temperatura sta salendo') ||
    text.includes('perdita acqua')
  ) {
    priority = 'P2';
    sla = 'P2 Alto - Presa in carico < 30 min / Risoluzione < 4h';
  } else if (
    text.includes('minore') ||
    text.includes('basso') ||
    text.includes('pulizia') ||
    text.includes('info') ||
    text.includes('quando possibile') ||
    text.includes('lampadina') ||
    text.includes('fulminat') ||
    text.includes('controllo preventivo')
  ) {
    priority = 'P4';
    sla = 'P4 Basso - Presa in carico < 4h / Risoluzione < 24-48h';
  } else {
    priority = 'P3';
    sla = 'P3 Medio - Presa in carico < 2h / Risoluzione < 8h';
  }

  const escalationT3Note = needsT3
    ? 'Inoltrato a Piccirilli per contatto/coordinamento fornitore esterno'
    : 'NO';

  const techName = assignedTo.split(' ')[0];
  let actionRequired = '';
  if (needsT3) {
    actionRequired = `Intervento di secondo livello svolto da ${techName}. Rilevata necessità di intervento del costruttore/manutentore esterno: passaggio di consegne a Piccirilli per l'attivazione e il coordinamento del fornitore T3.`;
  } else {
    actionRequired = `Presa in carico diretta da parte di ${techName} per verifica tecnica, ripristino dell'asset e collaudo entro i tempi definiti dallo SLA (${sla.split(' - ')[0] || priority}).`;
  }

  const rawResponse = `- **ID Ticket**: ${ticketId}
- **Asset**: ${asset}
- **Categoria**: ${category}
- **Priorità/SLA**: ${priority} - ${sla}
- **Assegnato a (T1/T2)**: ${assignedTo}
- **Escalation T3 (Fornitore Esterno)**: ${needsT3 ? `SÌ -> ${escalationT3Note}` : 'NO'}
- **Azione Richiesta**: ${actionRequired}`;

  return {
    id: `ticket-${Date.now()}`,
    ticketId,
    timestamp: new Date().toISOString(),
    userMessage,
    asset,
    category,
    priority,
    sla,
    assignedTo,
    escalationT3: needsT3,
    escalationT3Note,
    actionRequired,
    rawResponse,
    status: needsT3 ? 'Escalato T3' : 'Aperto',
    history: [
      {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: `Ticket registrato e assegnato a ${techName}`,
        by: 'Helpdesk Virtuale',
      },
    ],
  };
}
