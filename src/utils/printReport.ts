import { ITSMTicket, AssetInfo } from '../types';

interface PrintableReportData {
  title: string;
  subtitle: string;
  filterSummary: {
    assetLabel: string;
    areaLabel: string;
    timeRangeLabel: string;
    generatedAt: string;
  };
  metrics: {
    totalCount: number;
    resolvedCount: number;
    unresolvedCount: number;
    resolutionRate: number;
    avgResolutionMinutes: number;
  };
  criticalityBreakdown: Array<{
    key: string;
    label: string;
    totale: number;
    pctOfTotal: number;
    chiusi: number;
    pctClosed: number;
    aperti: number;
    pctOpen: number;
    sla: string;
    lvlMttr: number | null;
  }>;
  tickets: ITSMTicket[];
  assets?: AssetInfo[];
}

/**
 * Triggers a real, high-quality printer & PDF preview for ITSM reports.
 * Layout:
 * 1. Intestazione Ufficiale & Riepilogo Filtri
 * 2. Tabella 1: Sintesi Generale Ticket Totali & KPI Operativi (in alto per orizzontale)
 * 3. Sezione a 2 Colonne perfettamente bilanciata:
 *    - COLONNA SINISTRA: Tabella Dettaglio Criticità (P1 - P4) che si sviluppa in verticale
 *    - COLONNA DESTRA: I 2 Grafici Vettoriali ben proporzionati e nitidi:
 *        * Grafico 1: Torta/Ciambella con percentuali e legenda spaziosa
 *        * Grafico 2: Grafico a Barre comparativo Chiusi vs Aperti per livello
 * 4. Barra di Avanzamento Globale Risoluzione
 */
export function triggerPrintableReport(data: PrintableReportData) {
  const printWindow = window.open('', '_blank', 'width=1150,height=900,menubar=no,toolbar=no,location=no,status=no');

  if (!printWindow) {
    window.print();
    return;
  }

  const escapeHtml = (str: any) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const priorityColors: Record<string, string> = {
    P1: '#dc2626', // Red
    P2: '#ea580c', // Orange
    P3: '#2563eb', // Blue
    P4: '#16a34a', // Green
  };

  const priorityLabels: Record<string, string> = {
    P1: 'Critico',
    P2: 'Alto',
    P3: 'Medio',
    P4: 'Basso',
  };

  const total = data.metrics.totalCount;
  const resolved = data.metrics.resolvedCount;
  const unresolved = data.metrics.unresolvedCount;
  const rate = data.metrics.resolutionRate;
  const mttr = data.metrics.avgResolutionMinutes;

  // --- SVG DONUT CHART GENERATION (BEN PROPORZIONATO) ---
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402.12
  let accumulatedOffset = 0;

  const donutSlices = total === 0
    ? `<circle cx="125" cy="125" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="32" />`
    : data.criticalityBreakdown.map((item) => {
        const color = priorityColors[item.key] || '#64748b';
        const fraction = item.totale / total;
        const sliceLength = fraction * circumference;
        const strokeDasharray = `${sliceLength.toFixed(2)} ${(circumference - sliceLength).toFixed(2)}`;
        const strokeDashoffset = (-accumulatedOffset).toFixed(2);
        accumulatedOffset += sliceLength;

        return `
          <circle 
            cx="125" 
            cy="125" 
            r="${radius}" 
            fill="none" 
            stroke="${color}" 
            stroke-width="32" 
            stroke-dasharray="${strokeDasharray}" 
            stroke-dashoffset="${strokeDashoffset}"
          />
        `;
      }).join('');

  // --- SVG BAR CHART GENERATION (CHIUSI VS APERTI) ---
  const barChartWidth = 480;
  const barChartHeight = 210;
  const plotLeft = 45;
  const plotTop = 26;
  const plotWidth = 415;
  const plotHeight = 135;
  const baselineY = plotTop + plotHeight; // 161

  const maxValInBreakdown = Math.max(
    1,
    ...data.criticalityBreakdown.map((b) => Math.max(b.chiusi, b.aperti, 1))
  );
  const maxAxisVal = maxValInBreakdown <= 4 ? 4 : maxValInBreakdown <= 10 ? 10 : Math.ceil(maxValInBreakdown / 5) * 5;

  const numGridLines = 4;
  const gridLinesSvg = Array.from({ length: numGridLines + 1 }).map((_, i) => {
    const val = Math.round((maxAxisVal / numGridLines) * i);
    const y = baselineY - (val / maxAxisVal) * plotHeight;
    return `
      <line x1="${plotLeft}" y1="${y}" x2="${plotLeft + plotWidth}" y2="${y}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
      <text x="${plotLeft - 8}" y="${y + 4}" font-size="10" fill="#64748b" text-anchor="end" font-family="monospace">${val}</text>
    `;
  }).join('');

  const groupStep = plotWidth / 4;
  const barBarsSvg = data.criticalityBreakdown.map((item, idx) => {
    const centerX = plotLeft + idx * groupStep + groupStep / 2;
    const barWidth = 24;

    const hClosed = Math.max(0, (item.chiusi / maxAxisVal) * plotHeight);
    const yClosed = baselineY - hClosed;

    const hOpen = Math.max(0, (item.aperti / maxAxisVal) * plotHeight);
    const yOpen = baselineY - hOpen;

    const xClosed = centerX - barWidth - 3;
    const xOpen = centerX + 3;

    return `
      <g>
        <!-- Bar Chiusi (Verde) -->
        <rect x="${xClosed}" y="${yClosed}" width="${barWidth}" height="${hClosed}" rx="3" fill="#16a34a" />
        <text x="${xClosed + barWidth / 2}" y="${Math.max(plotTop + 10, yClosed - 4)}" font-size="10" font-weight="bold" fill="#15803d" text-anchor="middle" font-family="monospace">${item.chiusi}</text>

        <!-- Bar Aperti (Ambra) -->
        <rect x="${xOpen}" y="${yOpen}" width="${barWidth}" height="${hOpen}" rx="3" fill="#f59e0b" />
        <text x="${xOpen + barWidth / 2}" y="${Math.max(plotTop + 10, yOpen - 4)}" font-size="10" font-weight="bold" fill="#b45309" text-anchor="middle" font-family="monospace">${item.aperti}</text>

        <!-- Etichette Asse X -->
        <text x="${centerX}" y="${baselineY + 16}" font-size="12" font-weight="800" fill="#0f172a" text-anchor="middle" font-family="monospace">${item.key}</text>
        <text x="${centerX}" y="${baselineY + 29}" font-size="9.5" font-weight="600" fill="#475569" text-anchor="middle">${priorityLabels[item.key] || item.label}</text>
      </g>
    `;
  }).join('');

  // --- RIGHE TABELLA VERTICALE CRITICITÀ PER LA COLONNA SINISTRA ---
  const verticalTableRows = data.criticalityBreakdown.map((item) => {
    const color = priorityColors[item.key] || '#0f172a';
    return `
      <tr>
        <td style="padding: 10px 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-weight: 800; font-family: monospace; font-size: 12px; border: 1.5px solid ${color}; color: ${color}; background: #ffffff;">
              ${escapeHtml(item.key)}
            </span>
            <div>
              <div style="font-weight: 800; color: #0f172a; font-size: 11.5px;">${escapeHtml(item.label)}</div>
              <div style="font-size: 9.5px; color: #64748b; font-family: monospace;">${escapeHtml(item.sla)}</div>
            </div>
          </div>
        </td>
        <td style="text-align: center; font-weight: 800; font-size: 13px; font-family: monospace; color: #0f172a;">
          ${item.totale}
        </td>
        <td style="text-align: center; font-weight: 800; font-size: 12px; font-family: monospace; color: #334155;">
          ${item.pctOfTotal}%
        </td>
        <td style="text-align: center; font-family: monospace; font-weight: 700;">
          <div style="color: #15803d; font-size: 11.5px; font-weight: 800;">${item.chiusi}</div>
          <div style="font-size: 9.5px; color: #166534;">(${item.pctClosed}%)</div>
        </td>
        <td style="text-align: center; font-family: monospace; font-weight: 700;">
          <div style="color: #b45309; font-size: 11.5px; font-weight: 800;">${item.aperti}</div>
          <div style="font-size: 9.5px; color: #92400e;">(${item.pctOpen}%)</div>
        </td>
        <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 11px; color: #0f172a;">
          ${item.lvlMttr !== null ? `${item.lvlMttr}m` : 'N/D'}
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="it">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(data.title)} - ${escapeHtml(data.filterSummary.generatedAt)}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #ffffff;
            color: #0f172a;
            margin: 0;
            padding: 8px 12px;
            font-size: 11.5px;
            line-height: 1.35;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5px solid #070F26;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: 900;
            color: #070F26;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header .subtitle {
            margin: 2px 0 0 0;
            font-size: 11px;
            color: #475569;
          }
          .header .meta {
            text-align: right;
            font-size: 10px;
            color: #64748b;
          }
          .filter-bar {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 5px 12px;
            margin-bottom: 10px;
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            font-size: 11px;
          }
          .filter-bar strong {
            color: #070F26;
          }

          /* SECTION HEADINGS */
          .section-heading {
            font-size: 11.5px;
            font-weight: 800;
            color: #070F26;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin: 8px 0 5px 0;
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 3px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          /* GENERAL TABLE 1 */
          table.table-summary {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 10px;
          }
          table.table-summary th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 5px 8px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          table.table-summary td {
            padding: 5px 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          table.table-summary tbody tr:nth-child(even) {
            background-color: #f8fafc;
          }

          /* 2-COLUMN SPLIT LAYOUT (TABELLA A SINISTRA, GRAFICI A DESTRA) */
          .main-split-layout {
            display: grid;
            grid-template-columns: 46% 54%;
            gap: 12px;
            align-items: stretch;
            margin-top: 4px;
            margin-bottom: 8px;
          }

          /* LEFT COLUMN: VERTICAL CRITICALITY TABLE */
          .left-column {
            display: flex;
            flex-direction: column;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #ffffff;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          }
          .col-header {
            background: #0f172a;
            color: #ffffff;
            padding: 7px 10px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          table.table-crit-vertical {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            flex: 1;
          }
          table.table-crit-vertical th {
            background: #1e293b;
            color: #ffffff;
            font-size: 9.5px;
            font-weight: 700;
            padding: 5px 6px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
          }
          table.table-crit-vertical td {
            border-bottom: 1px solid #e2e8f0;
            padding: 7px 6px;
          }
          table.table-crit-vertical tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          table.table-crit-vertical tfoot {
            background: #f1f5f9;
            font-weight: bold;
            border-top: 2px solid #0f172a;
          }
          table.table-crit-vertical tfoot td {
            padding: 7px 6px;
          }

          /* RIGHT COLUMN: CHARTS STACK */
          .right-column {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .chart-box {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #ffffff;
            padding: 8px 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          }
          .chart-title {
            font-size: 11px;
            font-weight: 800;
            color: #070F26;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          /* DONUT LAYOUT */
          .donut-wrapper {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }
          .donut-legend-stack {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          .legend-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            font-size: 10.5px;
          }

          /* PROGRESS BAR */
          .progress-bar-container {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 6px 12px;
            margin-top: 6px;
            margin-bottom: 6px;
          }
          .progress-bar-track {
            height: 12px;
            border-radius: 4px;
            background: #fef3c7;
            overflow: hidden;
            display: flex;
            margin-top: 3px;
          }
          .progress-bar-fill {
            height: 100%;
            background: #16a34a;
          }

          /* FOOTER */
          .footer {
            margin-top: 10px;
            border-top: 1px solid #cbd5e1;
            padding-top: 5px;
            font-size: 9px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
          }

          /* FLOATING PRINT ACTIONS */
          .print-actions {
            position: fixed;
            bottom: 16px;
            right: 16px;
            background: #070F26;
            color: #ffffff;
            padding: 10px 18px;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.35);
            display: flex;
            gap: 10px;
            align-items: center;
            z-index: 9999;
          }
          .btn-print {
            background: #D4AF37;
            color: #070F26;
            border: none;
            padding: 6px 14px;
            font-weight: 800;
            font-size: 12px;
            border-radius: 4px;
            cursor: pointer;
          }
          .btn-close {
            background: #334155;
            color: #ffffff;
            border: none;
            padding: 6px 12px;
            font-size: 12px;
            border-radius: 4px;
            cursor: pointer;
          }
          @media print {
            .print-actions {
              display: none !important;
            }
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <!-- Floating print actions -->
        <div class="print-actions">
          <span style="font-weight: 600; font-size: 12px;">Stampa Report Grafico & KPI ITSM</span>
          <button class="btn-print" onclick="window.print()">Stampa Ora</button>
          <button class="btn-close" onclick="window.close()">Chiudi</button>
        </div>

        <!-- Header -->
        <div class="header">
          <div>
            <h1>${escapeHtml(data.title)}</h1>
            <div class="subtitle">${escapeHtml(data.subtitle)}</div>
          </div>
          <div class="meta">
            <div>Data Generazione: <strong>${escapeHtml(data.filterSummary.generatedAt)}</strong></div>
            <div>Piattaforma: <strong>Gaming Hall ITSM Control System</strong></div>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="filter-bar">
          <div>Apparato / Asset: <strong>${escapeHtml(data.filterSummary.assetLabel)}</strong></div>
          <div>Area Operativa: <strong>${escapeHtml(data.filterSummary.areaLabel)}</strong></div>
          <div>Periodo Temporale: <strong>${escapeHtml(data.filterSummary.timeRangeLabel)}</strong></div>
        </div>

        <!-- TABELLA 1: SINTESI GENERALE TICKET TOTALI & KPI OPERATIVI -->
        <div class="section-heading">
          <span>Tabella 1: Sintesi Generale Ticket Totali & KPI Operativi</span>
          <span style="font-size: 9.5px; font-weight: normal; color: #64748b;">Metriche di Performance Operativa</span>
        </div>
        <table class="table-summary">
          <thead>
            <tr>
              <th style="width: 32%;">Indicatore Operativo</th>
              <th style="text-align: center; width: 18%;">Valore Assoluto</th>
              <th style="text-align: center; width: 18%;">Quota Percentuale (%)</th>
              <th style="width: 32%;">Target di Riferimento / SLA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Segnalazioni Totali Registrate</strong></td>
              <td style="text-align: center; font-weight: 900; font-size: 13px; font-family: monospace;">${total}</td>
              <td style="text-align: center; font-weight: 700; font-family: monospace;">100%</td>
              <td style="color: #475569;">Volume totale guasti e disservizi censiti</td>
            </tr>
            <tr>
              <td><strong>Ticket Chiusi / Risolti</strong></td>
              <td style="text-align: center; font-weight: 900; font-size: 13px; font-family: monospace; color: #15803d;">${resolved}</td>
              <td style="text-align: center; font-weight: 800; font-family: monospace; color: #15803d;">${rate}%</td>
              <td style="color: #15803d;">Interventi tecnici conclusi con successo</td>
            </tr>
            <tr>
              <td><strong>Ticket Aperti / In Lavorazione</strong></td>
              <td style="text-align: center; font-weight: 900; font-size: 13px; font-family: monospace; color: #b45309;">${unresolved}</td>
              <td style="text-align: center; font-weight: 800; font-family: monospace; color: #b45309;">${total > 0 ? 100 - rate : 0}%</td>
              <td style="color: #b45309;">Anomalie attive attualmente in corso</td>
            </tr>
            <tr>
              <td><strong>Tasso di Risoluzione Complessivo</strong></td>
              <td style="text-align: center; font-weight: 900; font-size: 13px; font-family: monospace; color: ${rate >= 85 ? '#15803d' : '#d97706'};">${rate}%</td>
              <td style="text-align: center; font-weight: 700; font-family: monospace;">—</td>
              <td style="color: #475569;">Soglia di conformità Gaming Hall: <strong>≥ 85.0%</strong></td>
            </tr>
            <tr>
              <td><strong>Tempo Medio di Ripristino (MTTR)</strong></td>
              <td style="text-align: center; font-weight: 900; font-size: 13px; font-family: monospace;">${mttr > 0 ? `${mttr} min` : 'N/D'}</td>
              <td style="text-align: center; font-weight: 700; font-family: monospace;">—</td>
              <td style="color: #475569;">Media durata disservizio fino a ripristino</td>
            </tr>
          </tbody>
        </table>

        <!-- SEZIONE A 2 COLONNE: TABELLA CRITICITÀ A SINISTRA (VERTICALE), GRAFICI A DESTRA -->
        <div class="main-split-layout">
          <!-- COLONNA SINISTRA: TABELLA DEL LIVELLO DI CRITICITÀ CON PERCENTUALI (CHE SCENDE) -->
          <div class="left-column">
            <div class="col-header">
              <span>Tabella 2: Criticità & Percentuali</span>
              <span style="font-size: 10px; font-family: monospace;">P1 - P4</span>
            </div>

            <table class="table-crit-vertical">
              <thead>
                <tr>
                  <th style="width: 32%;">Livello SLA</th>
                  <th style="text-align: center; width: 13%;">Tot</th>
                  <th style="text-align: center; width: 14%;">% Tot</th>
                  <th style="text-align: center; width: 17%;">Chiusi</th>
                  <th style="text-align: center; width: 17%;">Aperti</th>
                  <th style="text-align: right; width: 17%;">MTTR</th>
                </tr>
              </thead>
              <tbody>
                ${verticalTableRows}
              </tbody>
              <tfoot>
                <tr>
                  <td style="font-weight: 800; color: #070F26;">TOTALE</td>
                  <td style="text-align: center; font-family: monospace; font-size: 12px;">${total}</td>
                  <td style="text-align: center; font-family: monospace; font-size: 12px;">100%</td>
                  <td style="text-align: center; font-family: monospace; color: #15803d; font-size: 11px;">${resolved} (${rate}%)</td>
                  <td style="text-align: center; font-family: monospace; color: #b45309; font-size: 11px;">${unresolved} (${total > 0 ? 100 - rate : 0}%)</td>
                  <td style="text-align: right; font-family: monospace; font-size: 11px;">${mttr > 0 ? `${mttr}m` : 'N/D'}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- COLONNA DESTRA: I DUE GRAFICI ALLA SUA DESTRA BEN PROPORZIONATI -->
          <div class="right-column">
            <!-- GRAFICO 1: TORTA / CIAMBELLA (% CRITICITÀ CON LEGENDA AMPIA) -->
            <div class="chart-box">
              <div class="chart-title">
                <span>Ripartizione % per Criticità</span>
                <span style="font-size: 10px; font-family: monospace; color: #64748b;">${total} Ticket Totali</span>
              </div>

              <div class="donut-wrapper">
                <div style="width: 130px; height: 130px; position: relative; flex-shrink: 0;">
                  <svg width="130" height="130" viewBox="0 0 250 250" style="transform: rotate(-90deg);">
                    ${donutSlices}
                  </svg>
                  <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; pointer-events: none;">
                    <span style="font-size: 20px; font-weight: 900; color: #0f172a; font-family: monospace; line-height: 1;">${total}</span>
                    <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Ticket</span>
                  </div>
                </div>

                <div class="donut-legend-stack">
                  ${data.criticalityBreakdown.map((item) => {
                    const color = priorityColors[item.key] || '#64748b';
                    return `
                      <div class="legend-row">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${color};"></span>
                          <strong style="color: #0f172a; font-family: monospace; font-size: 11px;">${item.key}</strong>
                          <span style="color: #475569; font-size: 10px;">${priorityLabels[item.key] || item.label}</span>
                        </div>
                        <div style="font-family: monospace; font-weight: bold; color: #0f172a; font-size: 11px;">
                          ${item.totale} <span style="font-size: 9.5px; color: #64748b; font-weight: normal;">(${item.pctOfTotal}%)</span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>

            <!-- GRAFICO 2: BARRE COMPARATIVE (CHIUSI VS APERTI BEN PROPORZIONATO) -->
            <div class="chart-box">
              <div class="chart-title">
                <span>Confronto: Chiusi (Risolti) vs Aperti</span>
                <div style="display: flex; gap: 10px; font-size: 10px; font-weight: bold;">
                  <span style="display: flex; align-items: center; gap: 4px; color: #15803d;">
                    <span style="display: inline-block; width: 9px; height: 9px; background: #16a34a; border-radius: 2px;"></span> Chiusi
                  </span>
                  <span style="display: flex; align-items: center; gap: 4px; color: #b45309;">
                    <span style="display: inline-block; width: 9px; height: 9px; background: #f59e0b; border-radius: 2px;"></span> Aperti
                  </span>
                </div>
              </div>

              <div style="width: 100%; height: 140px; display: flex; align-items: center; justify-content: center;">
                <svg width="100%" height="140" viewBox="0 0 ${barChartWidth} ${barChartHeight}" preserveAspectRatio="xMidYMid meet">
                  <!-- Griglia e Valori Asse Y -->
                  ${gridLinesSvg}

                  <!-- Linea Base Asse X -->
                  <line x1="${plotLeft}" y1="${baselineY}" x2="${plotLeft + plotWidth}" y2="${baselineY}" stroke="#0f172a" stroke-width="1.5" />

                  <!-- Barre dei Livelli P1, P2, P3, P4 -->
                  ${barBarsSvg}
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- PROGRESS BAR GLOBALE DI RISOLUZIONE -->
        <div class="progress-bar-container">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10.5px;">
            <span style="font-weight: 800; color: #070F26; text-transform: uppercase;">Avanzamento Globale Risoluzione Sala:</span>
            <span style="font-family: monospace; font-weight: bold; color: #0f172a;">
              <span style="color: #15803d;">${resolved} Risolti (${rate}%)</span> • 
              <span style="color: #b45309;">${unresolved} Aperti (${total > 0 ? 100 - rate : 0}%)</span>
            </span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${rate}%;"></div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div>Documento Ufficiale ad uso interno del team tecnico ITSM Gaming Hall. Convalida Admin certificata.</div>
          <div>Report Statistico & Grafici — Generato il ${escapeHtml(data.filterSummary.generatedAt)}</div>
        </div>

        <script>
          // Trigger print dialog on load
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.print();
            }, 350);
          });
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Triggers a dedicated printable report specifically for a Single Asset with the same structured format:
 * Tabella 1 (Totali e KPI in alto), Tabella 2 (Criticità che scende a sinistra) e Grafici alla sua destra.
 */
export function triggerPrintableSingleAsset(asset: AssetInfo, tickets: ITSMTicket[]) {
  const resolved = tickets.filter(t => t.status === 'Risolto' || t.status === 'Chiuso');
  const unresolved = tickets.filter(t => t.status !== 'Risolto' && t.status !== 'Chiuso');
  const rate = tickets.length > 0 ? Math.round((resolved.length / tickets.length) * 100) : 100;

  const totalMinutes = resolved.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
  const avgMttr = resolved.length > 0 ? Math.round(totalMinutes / resolved.length) : 0;

  const p1 = tickets.filter(t => t.priority === 'P1');
  const p2 = tickets.filter(t => t.priority === 'P2');
  const p3 = tickets.filter(t => t.priority === 'P3');
  const p4 = tickets.filter(t => t.priority === 'P4');

  const buildBreakdownItem = (key: string, label: string, list: ITSMTicket[], sla: string) => {
    const closed = list.filter(t => t.status === 'Risolto' || t.status === 'Chiuso').length;
    const open = list.length - closed;
    const dur = list.filter(t => t.status === 'Risolto' || t.status === 'Chiuso').reduce((a, b) => a + (b.durationMinutes || 0), 0);
    return {
      key,
      label,
      totale: list.length,
      pctOfTotal: tickets.length > 0 ? Math.round((list.length / tickets.length) * 100) : 0,
      chiusi: closed,
      pctClosed: list.length > 0 ? Math.round((closed / list.length) * 100) : 0,
      aperti: open,
      pctOpen: list.length > 0 ? Math.round((open / list.length) * 100) : 0,
      sla,
      lvlMttr: closed > 0 ? Math.round(dur / closed) : null,
    };
  };

  triggerPrintableReport({
    title: `Scheda Asset & Report KPI: [${asset.id}] ${asset.name}`,
    subtitle: `Area: ${asset.area} | Referente: ${asset.assignedTechnician} (${asset.level}) | Matricola: ${asset.serialNumber || `SN-${asset.id}`}`,
    filterSummary: {
      assetLabel: `[${asset.id}] ${asset.name}`,
      areaLabel: asset.area,
      timeRangeLabel: 'Storico Completo',
      generatedAt: new Date().toLocaleString('it-IT'),
    },
    metrics: {
      totalCount: tickets.length,
      resolvedCount: resolved.length,
      unresolvedCount: unresolved.length,
      resolutionRate: rate,
      avgResolutionMinutes: avgMttr,
    },
    criticalityBreakdown: [
      buildBreakdownItem('P1', 'Critico', p1, '< 2h (Blocco Totale)'),
      buildBreakdownItem('P2', 'Alto', p2, '< 4h (Guasto Primario)'),
      buildBreakdownItem('P3', 'Medio', p3, '< 8h (Anomalia Ordinaria)'),
      buildBreakdownItem('P4', 'Basso', p4, '< 24-48h (Intervento Minore)'),
    ],
    tickets,
  });
}
