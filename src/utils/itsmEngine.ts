import { ITSMTicket, PriorityLevel } from '../types';

function generateTroubleshootingSteps(asset: string, category: string, userMessage: string, assignedTo: string): string {
  const tech = assignedTo.split(' ')[0] || 'il Tecnico';

  if (asset === 'Slot') {
    return `1. **Isolamento & Messa in Sicurezza:** Apporre immediatamente il cartello "Fuori Servizio per Manutenzione" a video/cabinet. Aprire il portello con chiave di servizio del settore Gaming.
2. **Diagnosi Display e Codici di Allarme:** Consultare il display ausiliario interno della scheda logica per identificare il codice di tilt (es. Hopper Jam, BNA Stacker Full, Disconnessione SAS, Tilt RAM o sensore ottico oscurato).
3. **Intervento Correttivo Diretto:**
   - *Se inceppamento banconote/monete:* Sganciare il gruppo validatore (BNA), rimuovere la banconota incastrata o la moneta bloccata nell'erogatore; pulire le fotocellule di lettura con panno in microfibra.
   - *Se stampante ticket (TITO):* Sbloccare la testina termica, estrarre frammenti e reinserire il rotolo carta allineando la tacca nera.
   - *Se display lampeggiante / freeze software:* Controllare i cablaggi LVDS/HDMI e alimentazione 12V/24V, quindi effettuare un Soft Reset da pulsante protetto interno.
4. **Collaudo Funzionale:** Richiudere il cabinet verificando il microswitch antimanomissione, inserire una banconota/ticket di test e simulare vincita ed erogazione.
5. **Verifica Escalation T3:** Se persiste errore irreversibile di scheda madre o guasto al generatore RNG sigillato, **${tech}** non tocca i sigilli e passa il ticket a **Piccirilli** per la chiamata al costruttore autorizzato T3.`;
  }

  if (asset === 'Cambio Cash') {
    return `1. **Messa in Sicurezza:** Attivare la modalità Service con chiave master e bloccare l'erogazione al pubblico.
2. **Ispezione Meccanica Moduli Cassa:** Aprire la blindatura ed esaminare i moduli di accettazione banconote, lo scambiatore monete e le cassette di ricircolo.
3. **Rimozione Inceppamento & Pulizia:** Rimuovere eventuali banconote sgualcite o monete incastrate nelle guide; soffiare aria compressa sui sensori ottici e magnetici.
4. **Allineamento & Test Contabile:** Stampare il giornale di fondo cassa, eseguire la ricalibrazione dal menu service ed effettuare un cambio di test da 5€ e 10€.
5. **Verifica Escalation T3:** Se il validatore banconote presenta guasto elettronico o il display touch è in tilt hardware, **${tech}** inoltra a **Piccirilli** per l'uscita del fornitore convenzionato T3.`;
  }

  if (asset === 'Macchinetta del caffè') {
    return `1. **Sicurezza Termica & Elettrica:** Non intervenire sui componenti idraulici in pressione. Scaricare la pressione con la lancia vapore prima di qualsiasi smontaggio.
2. **Diagnostica Circuitale:**
   - *Se pressione vapore a zero:* Verificare il rubinetto a monte dell'addolcitore idrico e riarmare l'eventuale termostato di sicurezza della caldaia.
   - *Se perdita d'acqua inferiore:* Ispezionare la vaschetta e il tubo flessibile di scarico (spesso ostruito da fondi di caffè essiccati); verificare la tenuta della guarnizione sottocoppa.
3. **Intervento sul Posto:** Disostruire lo scarico, pulire doccette e filtri con spazzolino e filtro cieco con pastiglia sgrassante. Sostituire la guarnizione se indurita.
4. **Collaudo Termico & Pressione:** Riaccendere la macchina, attendere il raggiungimento di 1.1-1.3 bar in caldaia ed erogare due caffè a 9 bar stabili con prova montaggio latte.
5. **Verifica Escalation T3:** Se la resistenza riscaldante è bruciata o la motopompa è grippata, **${tech}** richiede a **Piccirilli** l'attivazione dell'assistenza della ditta fornitrice T3.`;
  }

  if (asset === 'Sistema di ventilazione') {
    return `1. **Sezionamento Elettrico (LOTO):** Posizionare il sezionatore generale dell'UTA su OFF e applicare il cartellino di blocco manutenzione.
2. **Diagnosi Quadro Comandi:** Verificare se è scattato il salvamotore termico, il pressostato differenziale filtri o l'allarme antigelo.
3. **Ispezione Meccanica:** Aprire i portelli con chiave quadra, controllare lo stato e il tensionamento delle cinghie trapezoidali e ruotare a mano la ventola per verificare i cuscinetti.
4. **Riarmo e Test di Avvio:** Riarmo del relè termico nel quadro, chiusura portelli, riattivazione del sezionatore e misurazione assorbimento di spunto.
5. **Verifica Escalation T3:** In caso di avvolgimenti motore bruciati o guasto permanente inverter, **${tech}** trasferisce la gestione a **Piccirilli** per l'uscita della ditta termotecnica T3.`;
  }

  if (asset === 'Sistema di rete') {
    return `1. **Controllo Fisico:** Verificare i LED Link/Activity sulle porte dello switch/router coinvolto e controllare l'integrità del cavo RJ45.
2. **Diagnostica Rete:** Eseguire ping test continuo verso gateway e apparati a valle per localizzare l'interruzione.
3. **Intervento Tecnico:** Eseguire reboot della porta PoE o power-cycle di 30 secondi dell'apparato; verificare l'assenza di loop di rete (Spanning-Tree).
4. **Collaudo Prestazionale:** Verificare la riassegnazione degli indirizzi IP DHCP e testare la velocità di throughput.
5. **Verifica Escalation T3:** In caso di rottura della fibra ottica o guasto alla terminazione ONT del carrier, **Piccirilli** apre direttamente il guasto con il fornitore TLC.`;
  }

  return `1. **Isolamento & Messa in Sicurezza:** Delimitare la zona e togliere tensione se il guasto presenta rischi elettrici o meccanici.
2. **Diagnosi Strumentale e Visiva:** Esaminare spie di stato, allarmi e integrità fisica delle connessioni.
3. **Intervento di Ripristino:** Applicare la procedura standard di pulizia, riarmo protezioni o riavvio sequenziale.
4. **Collaudo Funzionale:** Eseguire ciclo di prova in condizioni operative reali.
5. **Verifica Escalation T3:** Se occorrono ricambi specifici o intervento della casa madre, **${tech}** delega a **Piccirilli** per la gestione col fornitore T3.`;
}

export function analyzeIncidentClientSide(userMessage: string): ITSMTicket {
  const text = userMessage.toLowerCase();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const matchExistingId = userMessage.match(/TCK-\d{8}-\d{3}/i);
  const ticketId = matchExistingId ? matchExistingId[0].toUpperCase() : `TCK-${yyyy}${mm}${dd}-${randomSuffix}`;

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

  const steps = generateTroubleshootingSteps(asset, category, userMessage, assignedTo);

  const rawResponse = `✅ **Presa in carico confermata per il Ticket #${ticketId}**
L'Assistente Virtuale ha preso in carico la segnalazione per l'asset **${asset}** (${category}).
Il ticket è stato assegnato al referente di competenza: **${assignedTo}**.

---

### 📋 Scheda Tecnica del Ticket
- **ID Ticket**: ${ticketId}
- **Asset**: ${asset}
- **Categoria**: ${category}
- **Priorità / SLA**: ${priority} - ${sla}
- **Assegnato a (T1/T2)**: ${assignedTo}
- **Escalation T3 (Fornitore Esterno)**: ${needsT3 ? `SÌ -> ${escalationT3Note}` : 'NO'}
- **Azione Richiesta**: ${actionRequired}

---

### 🔧 Procedura di Risoluzione Passo-Passo (Intervento sul Campo)
${steps}

---

### ⚠️ Criteri di Escalation T3 (Fornitore Esterno a Piccirilli)
${needsT3 
  ? `Il guasto richiede assistenza/parti di ricambio specialistiche: **${techName}** deve effettuare il passaggio di consegne a **Piccirilli**, unico autorizzato a contattare il fornitore esterno.`
  : `Se durante i controlli preliminari si riscontra guasto strutturale irreparabile o componente coperto da garanzia/manutenzione del costruttore, sospendere l'intervento e richiedere a **Piccirilli** l'attivazione della procedura T3.`
}

⏱️ **Tempistiche Operative:** Rispettare la finestra di SLA stabilita (${sla}). Al completamento, aggiornare lo stato su **Risolto** e registrare le note d'intervento.`;

  return {
    id: `ticket-${Date.now()}`,
    ticketId,
    timestamp: new Date().toISOString(),
    userMessage,
    asset,
    category,
    priority,
    sla,
    aiSuggestedPriority: priority,
    priorityConfirmed: false,
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
