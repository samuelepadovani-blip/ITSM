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

function generateDeterministicTicket(userMessage: string): ITSMTicketData {
  const text = userMessage.toLowerCase();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const ticketId = `TCK-${yyyy}${mm}${dd}-${randomSuffix}`;

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

  const rawResponse = `Ecco la scheda del ticket registrato:

- **ID Ticket**: ${ticketId}
- **Asset**: ${asset}
- **Categoria**: ${category}
- **Priorità/SLA**: ${priority} - ${sla}
- **Assegnato a (T1/T2)**: ${assignedTo}
- **Escalation T3 (Fornitore Esterno)**: ${needsT3 ? `SÌ -> ${escalationT3Note}` : 'NO'}
- **Azione Richiesta**: ${actionRequired}`;

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

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ITSM Helpdesk Chat API
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Messaggio mancante o non valido.' });
  }

  const ai = getAI();

  if (!ai) {
    // Deterministic fallback if Gemini key is not configured
    const fallbackTicket = generateDeterministicTicket(message);
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
  const suggestedTicketId = `TCK-${yyyy}${mm}${dd}-${randomSuffix}`;

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

FORMATO OUTPUT RICHIESTO (DEVI RISPETTARLO RIGOROSAMENTE):
- **ID Ticket**: ${suggestedTicketId}
- **Asset**: [Nome dell'asset censito coinvolto]
- **Categoria**: [IT / Gaming / Facility / F&B]
- **Priorità/SLA**: [P1/P2/P3/P4] - [Tempo stimato di presaincarico/risoluzione]
- **Assegnato a (T1/T2)**: [Nome del Tecnico competente per l'asset]
- **Escalation T3 (Fornitore Esterno)**: [SÌ/NO] -> Se SÌ: "Inoltrato a Piccirilli per contatto/coordinamento fornitore esterno"
- **Azione Richiesta**: [Descrizione sintetica dell'intervento o del passaggio di consegne]

In aggiunta alla scheda, puoi fornire una breve nota operativa di accompagnamento in tono professionale, calmo ed efficiente.`;

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

    return res.json({
      reply: replyText,
      ticket,
      source: 'gemini-3.8-flash',
    });
  } catch (error) {
    console.error('Error in Gemini call, using deterministic fallback:', error);
    const fallbackTicket = generateDeterministicTicket(message);
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
