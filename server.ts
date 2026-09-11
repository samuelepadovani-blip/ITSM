import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily if API key is provided
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Fallback rule-based ITSM parser
interface ITSMTicketData {
  ticketId: string;
  asset: string;
  category: 'IT' | 'Gaming' | 'Facility' | 'F&B';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  sla: string;
  assignedTo: string;
  escalationT3: boolean;
  escalationT3Note: string;
  actionRequired: string;
  rawResponse: string;
}

function generateTroubleshootingSteps(asset: string, category: string, userMessage: string, assignedTo: string): string {
  const text = userMessage.toLowerCase();
  const tech = assignedTo.split(' ')[0] || 'il Tecnico';

  if (asset === 'Slot') {
    return `1. **Isolamento & Messa in Sicurezza:** Apporre immediatamente il cartello "Fuori Servizio per Manutenzione" a video/cabinet. Aprire il portello con chiave di servizio del settore Gaming.
2. **Diagnosi Display e Codici di Allarme:** Consultare il display ausiliario interno della scheda logica per identificare il codice di tilt (es. Hopper Jam, BNA Stacker Full, Disconnessione SAS, Tilt RAM o sensore ottico oscurato).
3. **Intervento Correttivo Diretto:**
   - *Se inceppamento banconote/monete:* Sganciare il gruppo validatore (BNA), rimuovere con cura la banconota inceppata o la moneta bloccata nell'erogatore a spirale/hopper; pulire le fotocellule di lettura con panno in microfibra asciutto.
   - *Se stampante ticket (TITO):* Sbloccare la testina di stampa termica, rimuovere residui di carta e verificare il corretto posizionamento del rotolo con tacca nera di allineamento.
   - *Se display lampeggiante / freeze software:* Controllare i cablaggi LVDS/HDMI e alimentazione 12V/24V, quindi effettuare un Soft Reset protetto tramite switch interno di diagnostica.
4. **Collaudo Funzionale e Test di Gioco:** Richiudere il portello di sicurezza (verificando il microinterruttore di chiusura antimanomissione), inserire una banconota/ticket di test e simulare una vincita con relativa stampa/erogazione.
5. **Verifica Escalation T3:** Se persiste errore irreversibile alla scheda madre/CPU, display LCD rotto o guasto al generatore RNG sigillato, **${tech}** non manomette i sigilli fiscali e passa immediatamente il ticket a **Piccirilli** per la chiamata al costruttore autorizzato T3.`;
  }

  if (asset === 'Cambio Cash') {
    return `1. **Messa in Sicurezza Operativa:** Attivare la modalità Service con chiave master e bloccare l'erogazione verso il pubblico.
2. **Ispezione Meccanica Moduli Cassa:** Aprire la blindatura ed esaminare i moduli di accettazione banconote, lo scambiatore monete e le cassette di ricircolo (hopper multilivello).
3. **Rimozione Inceppamento & Pulizia:** Rimuovere eventuali banconote sgualcite o monete incastrate nelle guide a caduta; soffiare aria deumidificata sui sensori ottici e magnetici di validazione.
4. **Allineamento & Test Contabile:** Stampare il giornale di fondo cassa intermedio, eseguire la ricalibrazione dal menu service ed erogare un cambio di test da 5€ e 10€.
5. **Verifica Escalation T3:** Se il validatore banconote presenta guasto elettronico permanente al lettore ottico o il display touch è in tilt hardware, **${tech}** inoltra la segnalazione a **Piccirilli** per richiedere l'intervento del fornitore esterno convenzionato T3.`;
  }

  if (asset === 'Macchinetta del caffè') {
    return `1. **Sicurezza Termica & Elettrica:** Non intervenire sui componenti idraulici in pressione. Azionare la valvola di sfiato della lancia vapore per azzerare la pressione residua prima di qualsiasi smontaggio.
2. **Diagnostica Circuitale:**
   - *Se pressione vapore a zero:* Verificare che il rubinetto a monte dell'addolcitore idrico sia aperto e controllare se il termostato di sicurezza a riarmo della caldaia è scattato.
   - *Se perdita d'acqua inferiore:* Ispezionare il vassoio di raccolta e il tubo flessibile di scarico (frequentemente ostruito da morchie/fondi di caffè essiccati); verificare la tenuta della guarnizione del gruppo (sottocoppa).
3. **Intervento sul Posto:** Disostruire il sifone di scarico, pulire doccette e filtri con spazzolino e filtro cieco con apposita pastiglia sgrassante. Sostituire la guarnizione sottocoppa indurita se gocciola durante l'estrazione.
4. **Collaudo Termico & Pressione:** Riaccendere la macchina, attendere il carico automatico della caldaia e il raggiungimento di 1.1-1.3 bar sul manometro vapore; effettuare erogazione di test di due caffè a 9 bar stabili.
5. **Verifica Escalation T3:** Se la resistenza riscaldante è interrotta, la motopompa volumetrica è grippata o la caldaia presenta microfessurazioni, **${tech}** richiede a **Piccirilli** l'attivazione dell'assistenza tecnica della ditta torrefattrice/costruttrice T3.`;
  }

  if (asset === 'Sistema di ventilazione') {
    return `1. **Sezionamento Elettrico in Sicurezza (LOTO):** Posizionare il sezionatore generale dell'UTA (Unità Trattamento Aria) su OFF e applicare il cartellino di blocco manutenzione.
2. **Diagnosi Quadro Comandi:** Ispezionare il quadro di potenza: verificare l'intervento del salvamotore magnetotermico, del pressostato differenziale filtri sporchi o dell'allarme antigelo.
3. **Ispezione Meccanica sul Posto:**
   - Aprire i portelli di ispezione camera ventilante con chiave quadra.
   - Verificare integrità, allineamento e corretta tensione delle cinghie trapezoidali di trasmissione.
   - Ruotare manualmente a mano la girante della ventola per accertarsi che i cuscinetti non siano grippati o sbilanciati.
   - Rimuovere accumuli di polvere sui filtri a tasche e verificare le serrande di presa aria esterna.
4. **Riarmo e Test di Avvio:** Riarmare il relè termico nel quadro comando, richiudere ermeticamente i portelli, riattivare il sezionatore e misurare l'assorbimento amperometrico allo spunto con pinza amperometrica.
5. **Verifica Escalation T3:** Se il motore elettrico è in dispersione/bruciato, la girante è deformata o l'inverter segnala guasto irreversibile a codice F004/Overcurrent, **${tech}** trasferisce la gestione a **Piccirilli** per l'uscita immediata della ditta termotecnica specializzata T3.`;
  }

  if (asset === 'Sistema di rete') {
    return `1. **Controllo Fisico e Infrastruttura:** Verificare lo stato dei LED Link/Activity sulle porte dello switch/router coinvolto e controllare l'integrità meccanica del patch cable RJ45.
2. **Diagnostica Logica LAN:** Eseguire ping test continuativo verso gateway predefinito, controller Wi-Fi e apparati a valle per individuare il punto di interruzione.
3. **Intervento Tecnico:**
   - *Se switch PoE bloccato:* Riavviare l'erogazione PoE sulla porta interessata da interfaccia gestionale o eseguire power-cycle di 30 secondi dell'apparato.
   - *Se loop di rete / broadcast storm:* Isolare temporaneamente i link ridondanti e verificare lo stato del protocollo Spanning-Tree (STP/RSTP).
4. **Test Prestazionale e Convalida:** Verificare la riassegnazione degli indirizzi IP tramite DHCP, testare la velocità di throughput e verificare l'assenza di pacchetti scartati (drop/errors).
5. **Verifica Escalation T3:** In caso di rottura del modulo SFP/fibra ottica o guasto alla terminazione ottica esterna (ONT dell'operatore), **Piccirilli** contatta direttamente il carrier TLC fornitore per l'apertura del guasto di linea.`;
  }

  if (asset === 'Videocamere') {
    return `1. **Verifica Alimentazione PoE:** Ispezionare la telecamera verificando se i LED infrarossi e di alimentazione sono accesi; controllare l'erogazione di wattaggio sullo switch PoE.
2. **Controllo Canale NVR/VMS:** Verificare sul registratore se il flusso RTSP è disconnesso o se viene riportato un errore di handshake credenziali.
3. **Intervento sul Posto:** Controllare il connettore RJ45 stagno, pulire l'ottica da polvere o condensa e forzare il riavvio elettrico della telecamera.
4. **Collaudo Video:** Verificare il live streaming ad alta risoluzione (1080p/4K) sulla postazione di vigilanza e confermare la registrazione sul disco dell'NVR.
5. **Verifica Escalation T3:** In caso di sensore ottico CMOS guasto o corto circuito interno del modulo camera, inoltrare a **Piccirilli** per la sostituzione in garanzia con il fornitore dell'impianto TVCC.`;
  }

  if (asset === 'POS') {
    return `1. **Verifica Connettività:** Controllare l'indicatore di segnale Wi-Fi o Ethernet sul display del POS (deve essere verde/attivo).
2. **Riavvio Hardware del Terminale:** Eseguire un riavvio forzato tenendo premuto il tasto di accensione o la combinazione [Pulsante Giallo + Tasto Punto] per 5 secondi.
3. **Controllo Firewall e Gateway:** Verificare che le porte bancarie SSL (porta 443 / 8443) non siano filtrate dal firewall di cassa.
4. **Transazione di Collaudo:** Eseguire una transazione di prova a importo nullo o storno centesimo per verificare il corretto instradamento col centro autorizzativo.
5. **Verifica Escalation T3:** In presenza di allarme "Tamper Alert" (blocco anti-manomissione hardware irreversibile), **Piccirilli** attiva la sostituzione urgente con l'assistenza dell'istituto bancario / fornitore T3.`;
  }

  if (asset === 'Frigo') {
    return `1. **Verifica Temperatura e Termostato:** Controllare il display digitale del controllore Dixell/Carel ed annotare l'allarme attivo (es. HA allarme alta temperatura o E1 guasto sonda).
2. **Ispezione Condensatore e Pulizia:** Pulire con spazzola morbida la serpentina condensatore posteriore/inferiore per rimuovere accumuli di lanugine e polvere che impediscono lo scambio termico.
3. **Controllo Guarnizioni Porte:** Verificare la tenuta ermetica magnetica delle guarnizioni sportelli ed accertarsi che le porte chiudano a tenuta senza fessure.
4. **Verifica Sbrinamento:** Controllare che l'evaporatore non sia ostruito da un blocco di ghiaccio; se necessario avviare sbrinamento manuale forzato.
5. **Verifica Escalation T3:** In caso di perdita di gas refrigerante o motore compressore bloccato/bruciato, **${tech}** segnala a **Piccirilli** per l'uscita urgente del tecnico frigorista abilitato F-GAS (T3).`;
  }

  if (asset === 'Casse') {
    return `1. **Verifica Alimentazione e Cablaggio:** Controllare l'alimentatore a 24V del registratore telematico e verificare i collegamenti con cassetto contanti e scanner barcode.
2. **Sblocco Meccanico Stampante Fiscale:** Aprire il coperchio del rotolo termico, rimuovere eventuali frammenti di carta inceppati nella taglierina e inserire un nuovo rotolo certificato.
3. **Test Cassetto Contanti:** Controllare il cavo RJ11 di apertura a solenoide e verificare la fluidità di scorrimento delle guide meccaniche del cassetto.
4. **Stampa di Collaudo:** Eseguire una stampa di prova di stato e verificare la corretta connessione al server dell'Agenzia delle Entrate.
5. **Verifica Escalation T3:** In caso di "Memoria Fiscale DGFE Piena" o errore hardware del giornale di fondo sigillato, **${tech}** richiede a **Piccirilli** l'intervento del laboratorio fiscale autorizzato T3.`;
  }

  if (asset === 'Impianto audio' || asset === 'Luci' || asset === 'Allarme' || asset === 'Antincendio') {
    return `1. **Localizzazione Anomalia sul Quadro:** Ispezionare la centrale antincendio/antifurto o il rack amplificatori/DMX identificando la zona/circuito in guasto.
2. **Verifica Protezioni e Fusibili:** Controllare se sono intervenuti interruttori magnetotermici dedicati, fusibili rapidi o se gli amplificatori sono in modalità Protect/Clip.
3. **Isolamento Linea Guasta:** Selezionare o escludere temporaneamente la linea o il sensore in allarme per verificare se l'infrastruttura centrale torna operativa.
4. **Test di Continuità e Ripristino:** Effettuare misura di impedenza/continuità sul circuito riparato e riarmare la centrale di controllo.
5. **Verifica Escalation T3:** Se la centrale antincendio richiede ripristino con codice master di certificazione o il sensore omologato è guasto, **${tech}** passa la chiamata a **Piccirilli** per l'uscita del fornitore esterno autorizzato T3.`;
  }

  return `1. **Isolamento & Messa in Sicurezza:** Delimitare la zona interessata dall'asset e scollegare l'alimentazione se il guasto presenta rischi elettrici o meccanici.
2. **Diagnosi Strumentale e Visiva:** Esaminare spie di stato, codici di allarme e collegamenti fisici/cavi dell'apparato.
3. **Intervento di Ripristino:** Applicare la procedura di riparazione standard (disostruzione meccanica, pulizia contatti, riavvio sequenziale).
4. **Collaudo Funzionale:** Eseguire test di carico e ciclo di lavoro di prova verificando l'assenza di nuove anomalie.
5. **Verifica Escalation T3:** Se il problema richiede parti di ricambio del costruttore o certificazione esterna, **${tech}** delega a **Piccirilli** per la gestione con il fornitore T3.`;
}

function generateDeterministicTicket(userMessage: string): ITSMTicketData {
  const text = userMessage.toLowerCase();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const matchExistingId = userMessage.match(/TCK-\d{8}-\d{3}/i);
  const ticketId = matchExistingId ? matchExistingId[0].toUpperCase() : `TCK-${yyyy}${mm}${dd}-${randomSuffix}`;

  // 1. Asset & Category Detection
  let asset = 'Asset non specificato';
  let category: 'IT' | 'Gaming' | 'Facility' | 'F&B' = 'IT';
  let assignedTo = 'Piccirilli (IT & Systems Manager)';

  // IT & Rete
  if (text.includes('rete') || text.includes('wifi') || text.includes('switch') || text.includes('router') || text.includes('connessione') || text.includes('internet')) {
    asset = 'Sistema di rete';
    category = 'IT';
    assignedTo = 'Piccirilli (IT & Systems Manager)';
  } else if (text.includes('gestional') || text.includes('software') || text.includes('programma') || text.includes('database') || text.includes('server')) {
    asset = 'Gestionali';
    category = 'IT';
    assignedTo = 'Piccirilli (IT & Systems Manager)';
  } else if (text.includes('videocamer') || text.includes('telecamer') || text.includes('cctv') || text.includes('videosorveglianza')) {
    asset = 'Videocamere';
    category = 'IT';
    assignedTo = 'Piccirilli (IT & Systems Manager)';
  } else if (text.includes('pos') || text.includes('pagamento elettronico') || text.includes('bancomat')) {
    asset = 'POS';
    category = 'IT';
    assignedTo = 'Piccirilli (IT & Systems Manager)';
  } else if (text.includes('continuità') || text.includes('ups') || text.includes('batteria di backup')) {
    asset = 'Gruppo di continuità';
    category = 'IT';
    assignedTo = 'Piccirilli (IT & Systems Manager)';
  }
  // Gaming & Cassa
  else if (text.includes('slot') || text.includes('vlt') || text.includes('macchinetta da gioco')) {
    asset = 'Slot';
    category = 'Gaming';
    assignedTo = 'Benin (Gaming & Cash Technician)';
  } else if (text.includes('cambio cash') || text.includes('cambiamonete') || text.includes('erogatore') || text.includes('cash dispenser') || text.includes('scambiamonete')) {
    asset = 'Cambio Cash';
    category = 'Gaming';
    assignedTo = 'Benin (Gaming & Cash Technician)';
  } else if (text.includes('bowling') || text.includes('pista') || text.includes('birilli') || text.includes('posabirilli')) {
    asset = 'Bowling';
    category = 'Gaming';
    assignedTo = 'Benin (Gaming & Cash Technician)';
  } else if (text.includes('cassa') || text.includes('casse') || text.includes('registratore di cassa') || text.includes('cassetto contanti')) {
    asset = 'Casse';
    category = 'Gaming';
    assignedTo = 'Benin (Gaming & Cash Technician)';
  }
  // Facility & Sicurezza
  else if (text.includes('audio') || text.includes('altoparlant') || text.includes('microfono') || text.includes('cassa audio') || text.includes('musica')) {
    asset = 'Impianto audio';
    category = 'Facility';
    assignedTo = 'Padovani (Facility & Safety Technician)';
  } else if (text.includes('luci') || text.includes('luce') || text.includes('lampada') || text.includes('illuminazione') || text.includes('faretto')) {
    asset = 'Luci';
    category = 'Facility';
    assignedTo = 'Padovani (Facility & Safety Technician)';
  } else if (text.includes('ventilazione') || text.includes('aria condizionata') || text.includes('climatizzat') || text.includes('hvac') || text.includes('condizionatore')) {
    asset = 'Sistema di ventilazione';
    category = 'Facility';
    assignedTo = 'Padovani (Facility & Safety Technician)';
  } else if (text.includes('antincendio') || text.includes('sprinkler') || text.includes('estintor') || text.includes('fumo') || text.includes('rilevatore fumo')) {
    asset = 'Antincendio';
    category = 'Facility';
    assignedTo = 'Padovani (Facility & Safety Technician)';
  } else if (text.includes('allarme') || text.includes('antifurto') || text.includes('sensore')) {
    asset = 'Allarme';
    category = 'Facility';
    assignedTo = 'Padovani (Facility & Safety Technician)';
  }
  // Food & Beverage
  else if (text.includes('frigo') || text.includes('frigorifero') || text.includes('cella frigorifera') || text.includes('freezer')) {
    asset = 'Frigo';
    category = 'F&B';
    assignedTo = 'Ayoub (Food & Beverage Coordinator)';
  } else if (text.includes('tostapane') || text.includes('piastra tosti') || text.includes('griglia')) {
    asset = 'Tostapane';
    category = 'F&B';
    assignedTo = 'Ayoub (Food & Beverage Coordinator)';
  } else if (text.includes('distributore') || text.includes('vending') || text.includes('snack')) {
    asset = 'Distributori automatici';
    category = 'F&B';
    assignedTo = 'Ayoub (Food & Beverage Coordinator)';
  } else if (text.includes('caffè') || text.includes('caffe') || text.includes('macchina del caffè') || text.includes('espresso')) {
    asset = 'Macchinetta del caffè';
    category = 'F&B';
    assignedTo = 'Ayoub (Food & Beverage Coordinator)';
  }

  // 2. Escalation T3 Check
  const needsT3 = text.includes('fornitore') ||
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
    text.includes('ditta esterna');

  // 3. Priority & SLA
  let priority: 'P1' | 'P2' | 'P3' | 'P4' = 'P3';
  let sla = 'Presa in carico < 2h / Risoluzione stimata < 8h';

  if (text.includes('blocco') || text.includes('fermo') || text.includes('incendio') || text.includes('pericolo') || text.includes('totale') || text.includes('urgente') || text.includes('critico') || text.includes('tutte le casse') || text.includes('tutta la rete') || text.includes('allagamento') || text.includes('corto circuito')) {
    priority = 'P1';
    sla = 'P1 Critico - Presa in carico < 15 min / Risoluzione < 2h';
  } else if (text.includes('grave') || text.includes('alto') || text.includes('bloccata') || text.includes('non funziona') || text.includes('guasto') || text.includes('impatto')) {
    priority = 'P2';
    sla = 'P2 Alto - Presa in carico < 30 min / Risoluzione < 4h';
  } else if (text.includes('minore') || text.includes('basso') || text.includes('pulizia') || text.includes('info') || text.includes('quando possibile') || text.includes('lampadina')) {
    priority = 'P4';
    sla = 'P4 Basso - Presa in carico < 4h / Risoluzione < 24-48h';
  } else {
    priority = 'P3';
    sla = 'P3 Medio - Presa in carico < 2h / Risoluzione < 8h';
  }

  const escalationT3Note = needsT3
    ? 'Inoltrato a Piccirilli per contatto/coordinamento fornitore esterno'
    : 'NO';

  let actionRequired = '';
  if (needsT3) {
    actionRequired = `Intervento di secondo livello svolto da ${assignedTo.split(' ')[0]}. Rilevata necessità di manutentore/costruttore esterno: passaggio di consegne a Piccirilli per l'apertura chiamata fornitore T3.`;
  } else {
    actionRequired = `Presa in carico immediata da parte di ${assignedTo.split(' ')[0]} per verifica diagnostica, ripristino asset e chiusura ticket nei termini SLA stabiliti.`;
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
  ? `Il guasto richiede assistenza/parti di ricambio specialistiche: **${assignedTo.split(' ')[0]}** deve effettuare il passaggio di consegne a **Piccirilli**, unico autorizzato a contattare il fornitore esterno.`
  : `Se durante i controlli preliminari si riscontra guasto strutturale irreparabile o componente coperto da garanzia/manutenzione del costruttore, sospendere l'intervento e richiedere a **Piccirilli** l'attivazione della procedura T3.`
}

⏱️ **Tempistiche Operative:** Rispettare la finestra di SLA stabilita (${sla}). Al completamento, aggiornare lo stato su **Risolto** e registrare le note d'intervento.`;

  return {
    ticketId,
    asset,
    category,
    priority,
    sla,
    assignedTo,
    escalationT3: needsT3,
    escalationT3Note,
    actionRequired,
    rawResponse,
  };
}

// In-memory shared ticket store for online multi-user synchronization
export interface StoredTicket {
  id: string;
  ticketId: string;
  timestamp: string;
  createdAtIso: string;
  reporterName: string;
  reporterZone: string;
  reporterContact?: string;
  userMessage: string;
  asset: string;
  category: 'IT' | 'Gaming' | 'Facility' | 'F&B';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  sla: string;
  assignedTo: string;
  assignedTechnicianId: 'piccirilli' | 'benin' | 'padovani' | 'ayoub';
  escalationT3: boolean;
  escalationT3Note: string;
  actionRequired: string;
  rawResponse: string;
  status: 'Aperto' | 'In Lavorazione' | 'Escalato T3' | 'In Attesa Fornitore' | 'Risolto' | 'Chiuso';
  history: Array<{
    timestamp: string;
    action: string;
    by: string;
  }>;
  notes: string[];
  lastTransfer?: {
    transferredAtIso: string;
    fromTechnicianId: string;
    fromName: string;
    toTechnicianId: string;
    toName: string;
    targetLevel: string;
    reason: string;
    escalatedToT3?: boolean;
  };
}

function getTechnicianId(assignedTo: string, category: string): 'piccirilli' | 'benin' | 'padovani' | 'ayoub' {
  const lower = assignedTo.toLowerCase();
  if (lower.includes('benin') || category === 'Gaming') return 'benin';
  if (lower.includes('padovani') || category === 'Facility') return 'padovani';
  if (lower.includes('ayoub') || category === 'F&B') return 'ayoub';
  return 'piccirilli';
}

const INITIAL_SERVER_TICKETS: StoredTicket[] = [
  {
    id: 'srv-1',
    ticketId: 'TCK-20260904-401',
    timestamp: '08:45',
    createdAtIso: new Date(Date.now() - 3600000).toISOString(),
    reporterName: 'Marco (Staff Casse)',
    reporterZone: 'Sala Slot Nord',
    userMessage: 'Slot Machine n. 14 con gettoniera inceppata e schermo lampeggiante',
    asset: 'Slot',
    category: 'Gaming',
    priority: 'P3',
    sla: 'P3 Medio - Presa in carico < 2h / Risoluzione < 8h',
    assignedTo: 'Benin (Gaming & Cash Technician)',
    assignedTechnicianId: 'benin',
    escalationT3: false,
    escalationT3Note: 'NO',
    actionRequired: 'Presa in carico diretta di Benin per sblocco meccanico gettoniera e test di pagamento.',
    rawResponse: 'Ticket di manutenzione ordinaria slot gaming.',
    status: 'In Lavorazione',
    notes: ['Iniziato controllo meccanismo hopper.'],
    history: [
      { timestamp: '08:45', action: 'Segnalazione inserita dal personale di sala', by: 'Marco (Staff Casse)' },
      { timestamp: '08:52', action: 'Ticket preso in carico da Benin', by: 'Benin' }
    ]
  },
  {
    id: 'srv-2',
    ticketId: 'TCK-20260904-402',
    timestamp: '09:10',
    createdAtIso: new Date(Date.now() - 2400000).toISOString(),
    reporterName: 'Sara (Caposala Bar)',
    reporterZone: 'Bancone Bar Centrale',
    userMessage: 'Macchinetta del caffè a 3 gruppi con pressione vapore a zero e perdita acqua inferiore',
    asset: 'Macchinetta del caffè',
    category: 'F&B',
    priority: 'P2',
    sla: 'P2 Alto - Presa in carico < 30 min / Risoluzione < 4h',
    assignedTo: 'Ayoub (Food & Beverage Coordinator)',
    assignedTechnicianId: 'ayoub',
    escalationT3: false,
    escalationT3Note: 'NO',
    actionRequired: 'Intervento immediato di Ayoub per controllo guarnizioni e valvola di sicurezza caldaia.',
    rawResponse: 'Ticket F&B prioritario bar.',
    status: 'Aperto',
    notes: [],
    history: [
      { timestamp: '09:10', action: 'Segnalazione inserita dal personale bar', by: 'Sara (Caposala Bar)' }
    ]
  },
  {
    id: 'srv-3',
    ticketId: 'TCK-20260904-403',
    timestamp: '09:30',
    createdAtIso: new Date(Date.now() - 1200000).toISOString(),
    reporterName: 'Davide (Reception & Accoglienza)',
    reporterZone: 'Area Bowling & Sala Eventi',
    userMessage: 'Ventilazione UTA 2 bloccata con allarme sovraccarico termico e odore di bruciato',
    asset: 'Sistema di ventilazione',
    category: 'Facility',
    priority: 'P2',
    sla: 'P2 Alto - Presa in carico < 30 min / Risoluzione < 4h',
    assignedTo: 'Padovani (Facility & Safety Technician)',
    assignedTechnicianId: 'padovani',
    escalationT3: false,
    escalationT3Note: 'NO',
    actionRequired: 'Diagnosi impianto UTA da parte di Padovani per verifica cinghie e motori estrattori.',
    rawResponse: 'Ticket Facility per climatizzazione sala.',
    status: 'Aperto',
    notes: [],
    history: [
      { timestamp: '09:30', action: 'Segnalazione registrata dal responsabile sala', by: 'Davide' }
    ]
  },
  {
    id: 'srv-4',
    ticketId: 'TCK-20260904-404',
    timestamp: '07:30',
    createdAtIso: new Date(Date.now() - 7200000).toISOString(),
    reporterName: 'Amministrazione Centro',
    reporterZone: 'Cassa Centrale & Rete',
    userMessage: 'Switch PoE piano terra non risponde e telecamere di cassa spente',
    asset: 'Sistema di rete',
    category: 'IT',
    priority: 'P1',
    sla: 'P1 Critico - Presa in carico < 15 min / Risoluzione < 2h',
    assignedTo: 'Piccirilli (IT & Systems Manager)',
    assignedTechnicianId: 'piccirilli',
    escalationT3: false,
    escalationT3Note: 'NO',
    actionRequired: 'Riavvio controller switch da parte di Piccirilli e ripristino alimentazione PoE.',
    rawResponse: 'Ticket critico IT.',
    status: 'Risolto',
    notes: ['Sostituito patch cable e riavviato stack switch Cisco.'],
    history: [
      { timestamp: '07:30', action: 'Segnalazione creata da monitoraggio di sicurezza', by: 'Amministrazione' },
      { timestamp: '07:35', action: 'Presa in carico da Piccirilli', by: 'Piccirilli' },
      { timestamp: '08:15', action: 'Risolto con ripristino completo delle videocamere', by: 'Piccirilli' }
    ]
  }
];

let ticketsStore: StoredTicket[] = [...INITIAL_SERVER_TICKETS];

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString(), ticketCount: ticketsStore.length });
});

// REST: Get all stored tickets with live sync and role-based filtering
app.get('/api/tickets', (req: Request, res: Response) => {
  const { technician, category, status, userAccount } = req.query;
  let result = [...ticketsStore];

  // Strict role-based isolation requested by user:
  // "Piccirilli T1; coordinatore; IT & Systems Manager che può vedere solo i ticket a lui competenti ma non gli altri.
  // Quindi, gli altri utenti possono vedere solo i loro ticket e non quelli di Piccirilli"
  if (userAccount && typeof userAccount === 'string') {
    const acc = userAccount.toLowerCase();
    if (acc === 'benin') {
      // Benin can ONLY see Benin's gaming tickets
      result = result.filter(t => t.assignedTechnicianId === 'benin');
    } else if (acc === 'padovani') {
      // Padovani can ONLY see Padovani's facility tickets
      result = result.filter(t => t.assignedTechnicianId === 'padovani');
    } else if (acc === 'ayoub') {
      // Ayoub can ONLY see Ayoub's F&B tickets
      result = result.filter(t => t.assignedTechnicianId === 'ayoub');
    } else if (acc === 'piccirilli') {
      // Piccirilli sees IT tickets AND any ticket escalated to T3 (for external vendor coordination)
      result = result.filter(t => t.assignedTechnicianId === 'piccirilli' || t.escalationT3 === true);
    } else if (acc === 'utente') {
      // Reporter / Staff di sala only sees tickets created by reporters/users
      result = result.filter(t => 
        t.reporterName.toLowerCase().includes('marco') || 
        t.reporterName.toLowerCase().includes('utente') || 
        t.reporterName.toLowerCase().includes('staff') ||
        t.reporterName.toLowerCase().includes('sala') ||
        t.reporterName.toLowerCase().includes('operatore')
      );
    }
  }

  if (technician && typeof technician === 'string' && technician !== 'all') {
    result = result.filter(t => t.assignedTechnicianId === technician.toLowerCase() || t.assignedTo.toLowerCase().includes(technician.toLowerCase()));
  }
  if (category && typeof category === 'string' && category !== 'all') {
    result = result.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }
  if (status && typeof status === 'string' && status !== 'all') {
    result = result.filter(t => t.status.toLowerCase() === status.toLowerCase());
  }

  res.json({
    tickets: result,
    total: ticketsStore.length,
    serverTime: new Date().toISOString(),
  });
});

// REST: Create a new ticket from User Portal
const handleCreateTicket = async (req: Request, res: Response) => {
  try {
    const { 
      reporterName = 'Operatore Centro',
      reporterZone = 'Area Multifunzionale',
      userMessage,
      reporterContact = '',
      priorityOverride,
      urgencyOverride
    } = req.body;

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      return res.status(400).json({ error: 'Descrizione del problema obbligatoria.' });
    }

    // 1. Run deterministic classification first
    const classified = generateDeterministicTicket(userMessage);

    if (priorityOverride && ['P1', 'P2', 'P3', 'P4'].includes(priorityOverride)) {
      classified.priority = priorityOverride;
    } else if (urgencyOverride) {
      if (urgencyOverride === 'Critico') {
        classified.priority = 'P1';
        classified.sla = 'P1 Critico - Presa in carico < 15 min / Risoluzione < 2h';
      } else if (urgencyOverride === 'Urgente') {
        classified.priority = 'P2';
        classified.sla = 'P2 Alto - Presa in carico < 30 min / Risoluzione < 4h';
      } else if (urgencyOverride === 'Normale') {
        classified.priority = 'P3';
        classified.sla = 'P3 Medio - Presa in carico < 2h / Risoluzione < 8h';
      }
    }

    const techId = getTechnicianId(classified.assignedTo, classified.category);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    const newTicket: StoredTicket = {
      id: `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketId: classified.ticketId,
      timestamp: timeStr,
      createdAtIso: now.toISOString(),
      reporterName: reporterName.trim() || 'Operatore Centro',
      reporterZone: reporterZone.trim() || 'Area Multifunzionale',
      reporterContact: reporterContact.trim(),
      userMessage: userMessage.trim(),
      asset: classified.asset,
      category: classified.category,
      priority: classified.priority,
      sla: classified.sla,
      assignedTo: classified.assignedTo,
      assignedTechnicianId: techId,
      escalationT3: classified.escalationT3,
      escalationT3Note: classified.escalationT3Note,
      actionRequired: classified.actionRequired,
      rawResponse: classified.rawResponse,
      status: classified.escalationT3 ? 'Escalato T3' : 'Aperto',
      history: [
        {
          timestamp: timeStr,
          action: `Segnalazione registrata dall'utente: ${reporterName} (${reporterZone})`,
          by: reporterName || 'Utente'
        },
        {
          timestamp: timeStr,
          action: `Instradato automaticamente a: ${classified.assignedTo}`,
          by: 'Sistema ITSM Triage'
        }
      ],
      notes: classified.escalationT3 ? ['⚠️ Escalation Fornitore Esterno T3: assegnata a Piccirilli per gestione contrattuale.'] : []
    };

    if (classified.escalationT3) {
      newTicket.history.push({
        timestamp: timeStr,
        action: 'Richiesta apertura chiamata fornitore esterno inoltrata a Piccirilli',
        by: 'Sistema ITSM (Policy T3)'
      });
    }

    // Add to the head of the list
    ticketsStore.unshift(newTicket);

    return res.status(201).json({
      success: true,
      ticket: newTicket,
      message: `Ticket ${newTicket.ticketId} creato con successo e inviato direttamente a ${newTicket.assignedTo}!`,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ error: 'Errore durante la creazione del ticket.' });
  }
};

app.post('/api/tickets', handleCreateTicket);
app.post('/api/tickets/create', handleCreateTicket);

// REST: Update ticket status or add technician notes / T3 escalation
app.patch('/api/tickets/:ticketId', (req: Request, res: Response) => {
  const { ticketId } = req.params;
  const { status, note, escalateT3, updatedBy = 'Tecnico Centro' } = req.body;

  const ticketIndex = ticketsStore.findIndex(t => t.ticketId === ticketId || t.id === ticketId);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket non trovato.' });
  }

  const ticket = ticketsStore[ticketIndex];
  const now = new Date();
  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  if (status) {
    ticket.status = status;
    ticket.history.push({
      timestamp: timeStr,
      action: `Stato aggiornato a: ${status}`,
      by: updatedBy
    });
  }

  if (note && typeof note === 'string' && note.trim().length > 0) {
    ticket.notes = ticket.notes || [];
    ticket.notes.push(`[${timeStr} - ${updatedBy}]: ${note.trim()}`);
    ticket.history.push({
      timestamp: timeStr,
      action: `Aggiunta nota operativa da ${updatedBy}`,
      by: updatedBy
    });
  }

  if (escalateT3 === true && !ticket.escalationT3) {
    ticket.escalationT3 = true;
    ticket.escalationT3Note = 'Inoltrato a Piccirilli per contatto/coordinamento fornitore esterno';
    ticket.status = 'Escalato T3';
    ticket.history.push({
      timestamp: timeStr,
      action: `Escalation T3 autorizzata da ${updatedBy}: richiesta passata a Piccirilli per contatto fornitore`,
      by: updatedBy
    });
  }

  ticketsStore[ticketIndex] = ticket;

  return res.json({
    success: true,
    ticket,
    message: `Ticket ${ticket.ticketId} aggiornato con successo.`
  });
});

// REST: Move / Transfer Ticket across levels and technicians
app.post('/api/tickets/:ticketId/transfer', (req: Request, res: Response) => {
  const { ticketId } = req.params;
  const { 
    targetTechnicianId, 
    reason = 'Trasferimento di livello operativo', 
    transferredBy = 'Tecnico Operatore', 
    targetLevel = 'T2', 
    escalateT3 = false 
  } = req.body;

  const ticketIndex = ticketsStore.findIndex(t => t.ticketId === ticketId || t.id === ticketId);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket non trovato.' });
  }

  const ticket = ticketsStore[ticketIndex];
  const now = new Date();
  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  let targetName = 'Piccirilli';
  let assignedTechId: 'piccirilli' | 'benin' | 'padovani' | 'ayoub' = 'piccirilli';
  let levelLabel = targetLevel;

  if (targetTechnicianId === 'benin') {
    targetName = 'Benin';
    assignedTechId = 'benin';
    levelLabel = 'T2 (Gaming & Cash)';
  } else if (targetTechnicianId === 'padovani') {
    targetName = 'Padovani';
    assignedTechId = 'padovani';
    levelLabel = 'T2 (Facility & Safety)';
  } else if (targetTechnicianId === 'ayoub') {
    targetName = 'Ayoub';
    assignedTechId = 'ayoub';
    levelLabel = 'T2 (Food & Beverage)';
  } else {
    targetName = 'Piccirilli';
    assignedTechId = 'piccirilli';
    levelLabel = escalateT3 ? 'T3 (Fornitori Esterni)' : 'T1 (IT & Coordinamento)';
  }

  const fromTechId = ticket.assignedTechnicianId;
  const fromName = ticket.assignedTo;

  ticket.assignedTechnicianId = assignedTechId;
  ticket.assignedTo = targetName;
  if (escalateT3 === true || targetTechnicianId === 'piccirilli-t3') {
    ticket.escalationT3 = true;
    ticket.escalationT3Note = reason;
    ticket.status = 'Escalato T3';
  } else if (ticket.status === 'Risolto' || ticket.status === 'Chiuso') {
    ticket.status = 'In Lavorazione';
  }

  ticket.lastTransfer = {
    transferredAtIso: now.toISOString(),
    fromTechnicianId: fromTechId,
    fromName,
    toTechnicianId: assignedTechId,
    toName: targetName,
    targetLevel: levelLabel,
    reason,
    escalatedToT3: !!escalateT3
  };

  ticket.history.push({
    timestamp: timeStr,
    action: `Spostamento Livello: trasferito a ${targetName} [${levelLabel}] da ${transferredBy}. Motivo: ${reason}`,
    by: transferredBy
  });

  ticket.notes = ticket.notes || [];
  ticket.notes.push(`[${timeStr} - Trasferimento]: Spostato a ${targetName} per: ${reason}`);

  ticketsStore[ticketIndex] = ticket;

  return res.json({
    success: true,
    ticket,
    message: `Ticket ${ticket.ticketId} trasferito con successo a ${targetName} (${levelLabel})!`
  });
});

// REST: Reset tickets store to defaults (useful for demonstrations)
app.post('/api/tickets/reset', (req: Request, res: Response) => {
  ticketsStore = [...INITIAL_SERVER_TICKETS];
  return res.json({ success: true, message: 'Registro ticket reimpostato ai dati iniziali.', count: ticketsStore.length });
});

// ITSM Helpdesk Chat API
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Messaggio mancante o non valido.' });
  }

  const ai = getAI();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const matchExistingId = message.match(/TCK-\d{8}-\d{3}/i);

  if (!ai) {
    // Deterministic fallback if Gemini key is not configured
    const fallbackTicket = generateDeterministicTicket(message);
    const existingIndex = ticketsStore.findIndex(t => t.ticketId === fallbackTicket.ticketId);

    if (existingIndex !== -1) {
      const existing = ticketsStore[existingIndex];
      existing.notes = existing.notes || [];
      existing.notes.push(`[${timeStr} - Assistente AI]: Fornita procedura tecnica di risoluzione.`);
      if (existing.status === 'Aperto') {
        existing.status = 'In Lavorazione';
        existing.history.push({
          timestamp: timeStr,
          action: 'Stato aggiornato a In Lavorazione (preso in carico con Assistente AI)',
          by: 'Assistente AI'
        });
      }
      ticketsStore[existingIndex] = existing;
    } else if (!matchExistingId) {
      const techId = getTechnicianId(fallbackTicket.assignedTo, fallbackTicket.category);
      ticketsStore.unshift({
        id: `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ticketId: fallbackTicket.ticketId,
        timestamp: timeStr,
        createdAtIso: now.toISOString(),
        reporterName: 'Operatore Chat Helpdesk',
        reporterZone: 'Chat Assistente Virtuale',
        userMessage: message,
        asset: fallbackTicket.asset,
        category: fallbackTicket.category,
        priority: fallbackTicket.priority,
        sla: fallbackTicket.sla,
        assignedTo: fallbackTicket.assignedTo,
        assignedTechnicianId: techId,
        escalationT3: fallbackTicket.escalationT3,
        escalationT3Note: fallbackTicket.escalationT3Note,
        actionRequired: fallbackTicket.actionRequired,
        rawResponse: fallbackTicket.rawResponse,
        status: fallbackTicket.escalationT3 ? 'Escalato T3' : 'Aperto',
        history: [
          { timestamp: timeStr, action: 'Ticket registrato da Assistente Virtuale', by: 'Chat Helpdesk' }
        ],
        notes: []
      });
    }

    return res.json({
      reply: fallbackTicket.rawResponse,
      ticket: fallbackTicket,
      source: 'local-itsm-engine',
    });
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const suggestedTicketId = matchExistingId ? matchExistingId[0].toUpperCase() : `TCK-${yyyy}${mm}${dd}-${randomSuffix}`;

  const systemInstruction = `Sei un esperto Architetto ITSM (IT Service Management) e l'Assistente Virtuale di Helpdesk per un centro operativo multifunzionale (Gaming, Food & Beverage, Entertainment e Facility).

ASSET CENSITI E CATEGORIE:
1. IT & Rete: Sistema di rete, Gestionali, Videocamere, POS, Gruppo di continuità.
2. Gaming & Cassa: Slot, Cambio Cash, Bowling, Casse.
3. Facility & Sicurezza: Impianto audio, Luci, Sistema di ventilazione, Allarme, Antincendio.
4. Food & Beverage: Frigo, Tostapane, Distributori automatici, Macchinetta del caffè.

RUOLI E RESPONSABILITÀ:
- Piccirilli (IT & Systems Manager): T1 per triage/accoglienza + assegnatario diretto di IT & Rete. È L'UNICO REFERENTE INCARICATO di contattare e coordinare fornitori esterni (T3) per QUALSIASI asset.
- Benin (Gaming & Cash Technician): T2 per Gaming & Cassa. NON contatta fornitori esterni.
- Padovani (Facility & Safety Technician): T2 per Facility & Sicurezza. NON contatta fornitori esterni.
- Ayoub (Food & Beverage Coordinator): T2 per Food & Beverage. NON gestisce né chiama fornitori esterni.

LOGICA DI ROUTING ED ESCALATION:
- Se l'asset è IT/Rete -> Assegna a Piccirilli (T1)
- Se Gaming/Casse -> Assegna a Benin (T2)
- Se Facility/Sicurezza -> Assegna a Padovani (T2)
- Se Food & Beverage -> Assegna ad Ayoub (T2)
- Escalation T3 (Fornitore Esterno): se il guasto richiede parti di ricambio del costruttore, manutenzione specialistica esterna o assistenza del produttore, DEVE ESSERE SÌ e indicare: "Inoltrato a Piccirilli per contatto/coordinamento fornitore esterno".

PRIORITÀ E SLA:
- P1 Critico: Blocco operativo totale o sicurezza (Presa in carico < 15 min / Risoluzione < 2h)
- P2 Alto: Impatto operativo rilevante senza blocco totale (Presa in carico < 30 min / Risoluzione < 4h)
- P3 Medio: Disservizio parziale o workaround disponibile (Presa in carico < 2h / Risoluzione < 8h)
- P4 Basso: Richiesta minore / manutenzione preventiva (Presa in carico < 4h / Risoluzione < 24-48h)

FORMATO DELLA RISPOSTA:
1. Inizio:
✅ **Presa in carico confermata per il Ticket #${suggestedTicketId}**
L'Assistente Virtuale ha preso in carico il problema per l'asset [Nome Asset] ([Categoria]) assegnato a [Tecnico Assegnatario].

2. Scheda Tecnica del Ticket:
- **ID Ticket**: ${suggestedTicketId}
- **Asset**: [Nome dell'asset censito coinvolto]
- **Categoria**: [IT / Gaming / Facility / F&B]
- **Priorità/SLA**: [P1/P2/P3/P4] - [Tempo stimato di presa in carico/risoluzione]
- **Assegnato a (T1/T2)**: [Nome del Tecnico competente per l'asset]
- **Escalation T3 (Fornitore Esterno)**: [SÌ/NO] -> Se SÌ: "Inoltrato a Piccirilli per contatto/coordinamento fornitore esterno"
- **Azione Richiesta**: [Descrizione sintetica dell'intervento o del passaggio di consegne]

3. PROCEDURA OPERATIVA DI RISOLUZIONE PASSO-PASSO (Troubleshooting & Intervento sul Campo):
Fornisci SEMPRE una lista numerata di 4-5 passaggi pratici, tecnici, dettagliati e precisi sul come intervenire fisicamente e logicamente sull'asset per risolvere il guasto (sicurezza/isolamento, diagnosi errori, smontaggio/pulizia/riparazione, test/collaudo e ripristino).

4. CRITERI DI ESCALATION T3 (Fornitore Esterno a Piccirilli):
Spiega chiaramente in quali specifiche condizioni il tecnico deve fermarsi e passare la pratica a Piccirilli per il fornitore esterno.

5. INDICAZIONI RISPETTO SLA & CHIUSURA:
Indicazione delle tempistiche massime e promemoria di chiusura del ticket.`;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 4500)
    );

    const callPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const response = await Promise.race([callPromise, timeoutPromise]);
    const replyText = response.text || '';
    // Parse the generated text to extract structured fields if possible
    const fallbackTicket = generateDeterministicTicket(message);

    // Extract ID Ticket if present in response
    const idMatch = replyText.match(/ID Ticket\*\*:\s*([^\n\r]+)/i);
    const assetMatch = replyText.match(/Asset\*\*:\s*([^\n\r]+)/i);
    const catMatch = replyText.match(/Categoria\*\*:\s*([^\n\r]+)/i);
    const prioMatch = replyText.match(/Priorità\/SLA\*\*:\s*([^\n\r]+)/i);
    const assignedMatch = replyText.match(/Assegnato a[^:]*:\s*([^\n\r]+)/i);
    const escMatch = replyText.match(/Escalation T3[^:]*:\s*([^\n\r]+)/i);
    const actionMatch = replyText.match(/Azione Richiesta\*\*:\s*([^\n\r]+)/i);

    const ticket: ITSMTicketData = {
      ticketId: idMatch ? idMatch[1].trim() : fallbackTicket.ticketId,
      asset: assetMatch ? assetMatch[1].trim() : fallbackTicket.asset,
      category: (catMatch ? (catMatch[1].includes('Gaming') ? 'Gaming' : catMatch[1].includes('Facility') ? 'Facility' : catMatch[1].includes('F&B') || catMatch[1].includes('Food') ? 'F&B' : 'IT') : fallbackTicket.category),
      priority: (prioMatch && prioMatch[1].includes('P1') ? 'P1' : prioMatch && prioMatch[1].includes('P2') ? 'P2' : prioMatch && prioMatch[1].includes('P4') ? 'P4' : 'P3'),
      sla: prioMatch ? prioMatch[1].trim() : fallbackTicket.sla,
      assignedTo: assignedMatch ? assignedMatch[1].trim() : fallbackTicket.assignedTo,
      escalationT3: escMatch ? escMatch[1].toUpperCase().includes('SÌ') || escMatch[1].toUpperCase().includes('SI') : fallbackTicket.escalationT3,
      escalationT3Note: escMatch && (escMatch[1].toUpperCase().includes('SÌ') || escMatch[1].toUpperCase().includes('SI'))
        ? 'Inoltrato a Piccirilli per contatto/coordinamento fornitore esterno'
        : 'NO',
      actionRequired: actionMatch ? actionMatch[1].trim() : fallbackTicket.actionRequired,
      rawResponse: replyText,
    };

    const finalTicket = ticket;
    const existingIndex = ticketsStore.findIndex(t => t.ticketId === finalTicket.ticketId);

    if (existingIndex !== -1) {
      const existing = ticketsStore[existingIndex];
      existing.notes = existing.notes || [];
      existing.notes.push(`[${timeStr} - Assistente AI]: Fornita procedura tecnica di risoluzione.`);
      if (existing.status === 'Aperto') {
        existing.status = 'In Lavorazione';
        existing.history.push({
          timestamp: timeStr,
          action: 'Stato aggiornato a In Lavorazione (preso in carico con Assistente AI)',
          by: 'Assistente AI'
        });
      }
      ticketsStore[existingIndex] = existing;
    } else if (!matchExistingId) {
      const techId = getTechnicianId(finalTicket.assignedTo, finalTicket.category);
      ticketsStore.unshift({
        id: `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ticketId: finalTicket.ticketId,
        timestamp: timeStr,
        createdAtIso: now.toISOString(),
        reporterName: 'Operatore Chat Helpdesk',
        reporterZone: 'Chat Assistente Virtuale',
        userMessage: message,
        asset: finalTicket.asset,
        category: finalTicket.category,
        priority: finalTicket.priority,
        sla: finalTicket.sla,
        assignedTo: finalTicket.assignedTo,
        assignedTechnicianId: techId,
        escalationT3: finalTicket.escalationT3,
        escalationT3Note: finalTicket.escalationT3Note,
        actionRequired: finalTicket.actionRequired,
        rawResponse: finalTicket.rawResponse,
        status: finalTicket.escalationT3 ? 'Escalato T3' : 'Aperto',
        history: [
          { timestamp: timeStr, action: 'Ticket creato tramite Assistente Virtuale', by: 'Chat Helpdesk' },
          { timestamp: timeStr, action: `Assegnato a: ${finalTicket.assignedTo}`, by: 'Triage ITSM' }
        ],
        notes: []
      });
    }

    return res.json({
      reply: replyText,
      ticket: finalTicket,
      source: 'gemini-3.8-flash',
    });
  } catch (error) {
    console.error('Error calling Gemini or processing chat:', error);
    // Safe deterministic fallback
    const fallbackTicket = generateDeterministicTicket(message);
    const existingIndex = ticketsStore.findIndex(t => t.ticketId === fallbackTicket.ticketId);

    if (existingIndex !== -1) {
      const existing = ticketsStore[existingIndex];
      existing.notes = existing.notes || [];
      existing.notes.push(`[${timeStr} - Assistente AI]: Fornita procedura tecnica di risoluzione.`);
      if (existing.status === 'Aperto') {
        existing.status = 'In Lavorazione';
        existing.history.push({
          timestamp: timeStr,
          action: 'Stato aggiornato a In Lavorazione (preso in carico con Assistente AI)',
          by: 'Assistente AI'
        });
      }
      ticketsStore[existingIndex] = existing;
    }

    return res.json({
      reply: fallbackTicket.rawResponse,
      ticket: fallbackTicket,
      source: 'local-itsm-engine-fallback',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ITSM Helpdesk Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
