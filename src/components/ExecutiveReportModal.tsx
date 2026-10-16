import React, { useState } from 'react';
import { FileText, Download, X, Check, Loader2, Settings, BarChart2 } from 'lucide-react';
import type { ChartConfig, DataRow, ExecutiveInsight, ReportConfig, SummaryMetric } from '../types/data.ts';
import { generateExecutivePDFReport } from '../utils/exportHelper.ts';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetName: string;
  metrics: SummaryMetric[];
  insights: ExecutiveInsight[];
  charts: ChartConfig[];
  rows: DataRow[];
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  datasetName,
  metrics,
  insights,
  charts,
  rows,
}) => {
  const [config, setConfig] = useState<ReportConfig>({
    reportTitle: `${datasetName.replace(/\.[^/.]+$/, '')} Executive Report`,
    companyName: 'OmniViz Enterprise',
    preparedBy: 'Analytics & Strategy Division',
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    executiveSummary:
      'This presentation document synthesizes filtered performance cohorts, key multi-dimensional drivers, and real-time visualization snapshots. The operational data indicates positive momentum in core product lines alongside distinct growth opportunities across primary channels.',
    includeKPIs: true,
    includeCharts: charts.slice(0, 2).map((c) => c.id),
    includeDataTableSummary: true,
    notes: 'Generated via OmniViz Analytics High-Resolution Presentation Engine.',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleToggleChart = (chartId: string) => {
    const current = config.includeCharts;
    const updated = current.includes(chartId)
      ? current.filter((id) => id !== chartId)
      : [...current, chartId];
    setConfig({ ...config, includeCharts: updated });
  };

  const handleGeneratePDF = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const chartElementIds = config.includeCharts.map((cid) => {
        const found = charts.find((c) => c.id === cid);
        return {
          id: `chart-card-${cid}`,
          title: found ? found.title : 'Visualization',
        };
      });

      await generateExecutivePDFReport({
        config,
        kpis: metrics,
        insights,
        chartElementIds,
        sampleRows: rows,
      });

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                High-Resolution Executive Report Builder
              </h3>
              <p className="text-xs text-slate-500">
                Generate presentation-ready, multi-page PDF briefing reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 text-xs">
          {/* Report Title & Organization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Report Title</label>
              <input
                type="text"
                value={config.reportTitle}
                onChange={(e) => setConfig({ ...config, reportTitle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Organization</label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Author & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prepared By</label>
              <input
                type="text"
                value={config.preparedBy}
                onChange={(e) => setConfig({ ...config, preparedBy: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Presentation Date</label>
              <input
                type="text"
                value={config.date}
                onChange={(e) => setConfig({ ...config, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Executive Summary Narrative */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Executive Commentary & Takeaways
            </label>
            <textarea
              rows={3}
              value={config.executiveSummary}
              onChange={(e) => setConfig({ ...config, executiveSummary: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
            />
          </div>

          {/* Include Options */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-2.5">
              Report Sections & Visuals
            </span>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeKPIs}
                  onChange={(e) => setConfig({ ...config, includeKPIs: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-800">
                  Include Key Performance Indicators Grid ({metrics.length} metrics)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeDataTableSummary}
                  onChange={(e) => setConfig({ ...config, includeDataTableSummary: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-800">
                  Include Filtered Data Digest Table (Top records)
                </span>
              </label>
            </div>
          </div>

          {/* Select Charts to embed */}
          <div className="pt-2">
            <span className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
              Select Visualizations for PDF Rendering
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {charts.map((c) => {
                const isChecked = config.includeCharts.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggleChart(c.id)}
                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-indigo-400 bg-indigo-50/50 text-indigo-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{c.title}</span>
                    </div>
                    {isChecked && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleGeneratePDF}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rendering High-Res PDF...
              </>
            ) : exportSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Presentation PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
