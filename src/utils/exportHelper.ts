import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import type { DataRow, ReportConfig, SummaryMetric, ExecutiveInsight } from '../types/data.ts';

/**
 * Export any chart element or container as a crisp high-res PNG (2x scale for 300 DPI slides)
 */
export async function exportElementAsHighResImage(elementId: string, filename = 'chart-visualization.png'): Promise<string | null> {
  const el = document.getElementById(elementId);
  if (!el) {
    console.error(`Element #${elementId} not found for export`);
    return null;
  }

  try {
    const dataUrl = await toPng(el, {
      pixelRatio: 2.5, // 2.5x crisp resolution for presentation slides
      backgroundColor: '#ffffff',
      cacheBust: true,
      style: {
        borderRadius: '0px',
      },
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    return dataUrl;
  } catch (err) {
    console.error('Failed to export high-res image:', err);
    return null;
  }
}

/**
 * Capture an element as a data URL for embedding into PDF
 */
export async function captureElementDataUrl(elementId: string): Promise<string | null> {
  const el = document.getElementById(elementId);
  if (!el) return null;
  try {
    return await toPng(el, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });
  } catch (err) {
    console.error(`Error capturing element #${elementId}:`, err);
    return null;
  }
}

/**
 * Export active filtered rows to Excel (.xlsx)
 */
export function exportToExcel(rows: DataRow[], filename = 'filtered_analytics_export.xlsx', sheetName = 'Analytics Data'): void {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

/**
 * Export active filtered rows to CSV
 */
export function exportToCSV(rows: DataRow[], filename = 'filtered_analytics_export.csv'): void {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate a multi-page High-Resolution Executive Presentation PDF Report
 */
export async function generateExecutivePDFReport(params: {
  config: ReportConfig;
  kpis: SummaryMetric[];
  insights: ExecutiveInsight[];
  chartElementIds: { id: string; title: string }[];
  sampleRows: DataRow[];
}): Promise<void> {
  const { config, kpis, insights, chartElementIds, sampleRows } = params;

  // Initialize jsPDF (Portrait, mm, a4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Color Palette
  const primaryNavy = '#0F172A';
  const accentIndigo = '#4338CA';
  const textDark = '#1E293B';
  const textMuted = '#64748B';
  const surfaceLight = '#F8FAFC';
  const borderLight = '#E2E8F0';

  // --- PAGE 1: COVER & EXECUTIVE SUMMARY ---
  // Header accent bar
  doc.setFillColor(15, 23, 42); // Navy
  doc.rect(0, 0, pageWidth, 12, 'F');

  // Title & Metadata
  let currentY = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryNavy);
  doc.text(config.reportTitle || 'Executive Analytics Briefing', margin, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(textMuted);
  const subtitle = `${config.companyName || 'Enterprise Analytics'}  ·  Prepared by: ${config.preparedBy || 'Analytics Team'}  ·  ${config.date || new Date().toLocaleDateString()}`;
  doc.text(subtitle, margin, currentY);

  // Divider line
  currentY += 6;
  doc.setDrawColor(borderLight);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // Executive Narrative
  currentY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryNavy);
  doc.text('1. Executive Summary & Strategic Context', margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(textDark);
  const narrativeLines = doc.splitTextToSize(
    config.executiveSummary ||
      'This high-resolution report synthesizes consolidated performance metrics, cohort distributions, and real-time interactive analytical signals. Strategic opportunities highlight high-yield customer segments and sustained conversion acceleration across key business units.',
    contentWidth
  );
  doc.text(narrativeLines, margin, currentY);
  currentY += narrativeLines.length * 5.2 + 6;

  // Key Performance Indicators Grid
  if (config.includeKPIs && kpis.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(primaryNavy);
    doc.text('2. Key Performance Indicators', margin, currentY);
    currentY += 6;

    const kpiCount = Math.min(kpis.length, 4);
    const boxGap = 4;
    const boxWidth = (contentWidth - boxGap * (kpiCount - 1)) / kpiCount;
    const boxHeight = 26;

    kpis.slice(0, kpiCount).forEach((kpi, idx) => {
      const boxX = margin + idx * (boxWidth + boxGap);

      // Box background
      doc.setFillColor(surfaceLight);
      doc.setDrawColor(borderLight);
      doc.roundedRect(boxX, currentY, boxWidth, boxHeight, 2, 2, 'FD');

      // Metric Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(textMuted);
      const labelTrunc = kpi.label.length > 18 ? kpi.label.substring(0, 16) + '..' : kpi.label;
      doc.text(labelTrunc, boxX + 4, currentY + 6.5);

      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(primaryNavy);
      doc.text(kpi.formattedTotal, boxX + 4, currentY + 16);

      // Subtitle / delta
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const deltaText = kpi.deltaPercent ? `${kpi.deltaPercent > 0 ? '+' : ''}${kpi.deltaPercent}% vs baseline` : `Avg: ${kpi.average.toFixed(1)}`;
      doc.setTextColor(kpi.trend === 'up' ? '#16A34A' : kpi.trend === 'down' ? '#DC2626' : textMuted);
      doc.text(deltaText, boxX + 4, currentY + 22);
    });

    currentY += boxHeight + 10;
  }

  // Key Analytical Insights
  if (insights.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(primaryNavy);
    doc.text('3. Automated Analytical Findings & Signals', margin, currentY);
    currentY += 7;

    insights.slice(0, 3).forEach((item) => {
      // Bullet icon box
      doc.setFillColor(accentIndigo);
      doc.circle(margin + 2, currentY - 1.2, 1.4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(primaryNavy);
      doc.text(item.title, margin + 7, currentY);
      currentY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(textMuted);
      const descLines = doc.splitTextToSize(item.description, contentWidth - 8);
      doc.text(descLines, margin + 7, currentY);
      currentY += descLines.length * 4.2 + 3.5;
    });
  }

  // Page 1 Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted);
  doc.text(`OmniViz Presentation Suite  ·  Confidential & Proprietary`, margin, pageHeight - 10);
  doc.text(`Page 1 of 2`, pageWidth - margin - 15, pageHeight - 10);

  // --- PAGE 2: HIGH-RESOLUTION VISUAL CHARTS & TABULAR DIGEST ---
  doc.addPage();

  // Header accent bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 10, 'F');

  currentY = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryNavy);
  doc.text('Visual Analytics Breakdown', margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(textMuted);
  doc.text('High-fidelity visual renderings captured directly from interactive model layers.', margin, currentY);
  currentY += 8;

  // Render Charts onto Page 2
  const chartsToRender = chartElementIds.slice(0, 2);
  for (const chartItem of chartsToRender) {
    const dataUrl = await captureElementDataUrl(chartItem.id);
    if (dataUrl) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(primaryNavy);
      doc.text(chartItem.title, margin, currentY);
      currentY += 4;

      const chartWidth = contentWidth;
      const chartHeight = 65; // mm

      try {
        doc.addImage(dataUrl, 'PNG', margin, currentY, chartWidth, chartHeight, undefined, 'FAST');
        currentY += chartHeight + 8;
      } catch (e) {
        console.warn('Could not embed chart image in PDF:', e);
      }
    }
  }

  // Summary Table of Data Rows
  if (config.includeDataTableSummary && sampleRows.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryNavy);
    doc.text('Key Filtered Data Digest', margin, currentY);
    currentY += 5;

    // Table header
    const headers = Object.keys(sampleRows[0]).slice(0, 5);
    const colWidth = contentWidth / headers.length;
    const rowHeight = 6;

    doc.setFillColor(surfaceLight);
    doc.rect(margin, currentY, contentWidth, rowHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryNavy);
    headers.forEach((h, i) => {
      doc.text(String(h).substring(0, 14), margin + i * colWidth + 2, currentY + 4.2);
    });
    currentY += rowHeight;

    // Up to 6 rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark);
    sampleRows.slice(0, 6).forEach((row) => {
      headers.forEach((h, i) => {
        const val = String(row[h] ?? '');
        const displayVal = val.length > 15 ? val.substring(0, 13) + '..' : val;
        doc.text(displayVal, margin + i * colWidth + 2, currentY + 4.2);
      });
      // hairline row divider
      doc.setDrawColor(borderLight);
      doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);
      currentY += rowHeight;
    });
  }

  // Page 2 Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted);
  doc.text(`OmniViz Presentation Suite  ·  Confidential & Proprietary`, margin, pageHeight - 10);
  doc.text(`Page 2 of 2`, pageWidth - margin - 15, pageHeight - 10);

  // Trigger browser download
  const safeTitle = (config.reportTitle || 'executive_report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 30);
  doc.save(`${safeTitle}.pdf`);
}
