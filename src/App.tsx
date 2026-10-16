/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import type { ChartConfig, Dataset, FilterPreset, FilterState } from './types/data.ts';
import { sampleDatasets } from './data/sampleDatasets.ts';
import {
  applyFilters,
  calculateSummaryStatistics,
  generateAutoFiltersAndPresets,
  generateExecutiveInsights,
} from './utils/dataProcessor.ts';
import { Header } from './components/Header.tsx';
import { KPIHighlights } from './components/KPIHighlights.tsx';
import { AutoFilterBar } from './components/AutoFilterBar.tsx';
import { ChartGrid } from './components/ChartGrid.tsx';
import { DataTableModal } from './components/DataTableModal.tsx';
import { DataUploader } from './components/DataUploader.tsx';
import { PresentationMode } from './components/PresentationMode.tsx';
import { ExecutiveReportModal } from './components/ExecutiveReportModal.tsx';
import { ChartCard } from './components/ChartCard.tsx';
import { X } from 'lucide-react';

export default function App() {
  // 1. Dataset State (defaults to Enterprise Global Sales)
  const [activeDataset, setActiveDataset] = useState<Dataset>(sampleDatasets[0]);

  // 2. Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    categoricalFilters: {},
    numericRanges: {},
    activePresetId: 'all',
  });

  // 3. UI State
  const [activeView, setActiveView] = useState<'dashboard' | 'table'>('dashboard');
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [expandedChart, setExpandedChart] = useState<ChartConfig | null>(null);

  // 4. Auto-generated Presets for current dataset
  const presets = useMemo(() => {
    return generateAutoFiltersAndPresets(activeDataset.rows, activeDataset.columns);
  }, [activeDataset]);

  // 5. Filtered Rows
  const filteredRows = useMemo(() => {
    return applyFilters(activeDataset.rows, filters);
  }, [activeDataset.rows, filters]);

  // 6. Summary Metrics for KPI Cards
  const summaryMetrics = useMemo(() => {
    const numCols = activeDataset.columns.filter((c) => c.type === 'numeric');
    return numCols
      .map((c) => calculateSummaryStatistics(filteredRows, c.key))
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [activeDataset.columns, filteredRows]);

  // 7. Executive Analytical Insights
  const executiveInsights = useMemo(() => {
    return generateExecutiveInsights(filteredRows, activeDataset.columns);
  }, [filteredRows, activeDataset.columns]);

  // 8. Dynamic Charts initial configuration based on dataset schema
  const [charts, setCharts] = useState<ChartConfig[]>(() => {
    return createDefaultCharts(activeDataset);
  });

  // When dataset changes, reset filters and adapt default charts
  const handleSelectDataset = (newDataset: Dataset) => {
    setActiveDataset(newDataset);
    setFilters({
      searchQuery: '',
      categoricalFilters: {},
      numericRanges: {},
      activePresetId: 'all',
    });
    setCharts(createDefaultCharts(newDataset));
  };

  const handleSelectPreset = (preset: FilterPreset) => {
    setFilters({
      searchQuery: preset.filters.searchQuery ?? '',
      categoricalFilters: preset.filters.categoricalFilters ?? {},
      numericRanges: preset.filters.numericRanges ?? {},
      dateRange: preset.filters.dateRange,
      activePresetId: preset.id,
    });
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      categoricalFilters: {},
      numericRanges: {},
      activePresetId: 'all',
    });
  };

  const handleUpdateChart = (index: number, updated: ChartConfig) => {
    const nextCharts = [...charts];
    nextCharts[index] = updated;
    setCharts(nextCharts);
  };

  const handleAddChart = () => {
    const numericCols = activeDataset.columns.filter((c) => c.type === 'numeric');
    const catCols = activeDataset.columns.filter((c) => c.type === 'categorical' || c.type === 'date');

    const newChart: ChartConfig = {
      id: `custom-chart-${Date.now()}`,
      title: `Custom ${numericCols[0]?.label || 'Metric'} Breakdown`,
      type: 'bar',
      xAxisKey: catCols[0]?.key || 'Category',
      yAxisKey: numericCols[0]?.key || 'Revenue',
      aggregation: 'sum',
      colorPalette: 'indigo',
      showGrid: true,
      showDataLabels: true,
      smoothCurve: true,
      sortOrder: 'desc',
      limit: 12,
    };
    setCharts([...charts, newChart]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header following Top-Bar Contract */}
      <Header
        datasetName={activeDataset.name}
        rowCount={activeDataset.rows.length}
        filteredCount={filteredRows.length}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenUploadModal={() => setIsUploadOpen(true)}
        onOpenReportModal={() => setIsReportOpen(true)}
        onOpenPresentationMode={() => setIsPresentationOpen(true)}
        onToggleFilters={() => setIsFiltersVisible(!isFiltersVisible)}
        isFiltersVisible={isFiltersVisible}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dynamic Auto-Filter Bar */}
        {isFiltersVisible && (
          <AutoFilterBar
            columns={activeDataset.columns}
            presets={presets}
            activePresetId={filters.activePresetId || 'all'}
            onSelectPreset={handleSelectPreset}
            filters={filters}
            onFilterChange={setFilters}
            totalCount={activeDataset.rows.length}
            filteredCount={filteredRows.length}
            onReset={handleResetFilters}
          />
        )}

        {/* Executive KPI Summary Grid */}
        <KPIHighlights
          metrics={summaryMetrics}
          activeFilterCount={Object.keys(filters.categoricalFilters).length}
          totalRowCount={activeDataset.rows.length}
          filteredRowCount={filteredRows.length}
        />

        {/* View Switch: Dashboard vs Tabular Data */}
        {activeView === 'dashboard' ? (
          <ChartGrid
            charts={charts}
            rows={filteredRows}
            columns={activeDataset.columns}
            insights={executiveInsights}
            onUpdateChart={handleUpdateChart}
            onAddChart={handleAddChart}
            onExpandChart={(c) => setExpandedChart(c)}
          />
        ) : (
          <DataTableModal
            rows={filteredRows}
            columns={activeDataset.columns}
            datasetName={activeDataset.name}
          />
        )}
      </main>

      {/* Expanded Chart Inspection Modal */}
      {expandedChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl p-6 relative">
            <button
              onClick={() => setExpandedChart(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="pt-2">
              <ChartCard
                config={expandedChart}
                rows={filteredRows}
                columns={activeDataset.columns}
                onUpdateConfig={(up) => {
                  setExpandedChart(up);
                  const idx = charts.findIndex((c) => c.id === up.id);
                  if (idx >= 0) handleUpdateChart(idx, up);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Ingestion & Sample Data Modal */}
      <DataUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        activeDataset={activeDataset}
        onSelectDataset={handleSelectDataset}
      />

      {/* Executive PDF Report Generator Modal */}
      <ExecutiveReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        datasetName={activeDataset.name}
        metrics={summaryMetrics}
        insights={executiveInsights}
        charts={charts}
        rows={filteredRows}
      />

      {/* Fullscreen Presentation / Boardroom Mode */}
      <PresentationMode
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        datasetName={activeDataset.name}
        metrics={summaryMetrics}
        insights={executiveInsights}
        charts={charts}
        rows={filteredRows}
        columns={activeDataset.columns}
      />
    </div>
  );
}

/**
 * Pure helper: Create default intelligent charts based on detected dataset columns
 */
function createDefaultCharts(dataset: Dataset): ChartConfig[] {
  const numericCols = dataset.columns.filter((c) => c.type === 'numeric');
  const catCols = dataset.columns.filter((c) => c.type === 'categorical' || c.type === 'date');

  const primaryMetric =
    numericCols.find((c) => /revenue|mrr|spend|sales|profit|total/i.test(c.key)) ||
    numericCols[0] || { key: 'Value', label: 'Value' };

  const secondaryMetric =
    numericCols.find((c) => c.key !== primaryMetric.key && /margin|profit|conversions|active|roi/i.test(c.key)) ||
    numericCols[1] ||
    primaryMetric;

  const primaryDim =
    catCols.find((c) => /region|product|channel|category/i.test(c.key)) ||
    catCols[0] || { key: 'Category', label: 'Category' };

  const secondaryDim =
    catCols.find((c) => c.key !== primaryDim.key && /quarter|cohort|month|category|tier/i.test(c.key)) ||
    catCols[1] ||
    primaryDim;

  return [
    {
      id: 'chart-1',
      title: `${primaryMetric.label} by ${primaryDim.label}`,
      type: 'bar',
      xAxisKey: primaryDim.key,
      yAxisKey: primaryMetric.key,
      aggregation: 'sum',
      colorPalette: 'indigo',
      showGrid: true,
      showDataLabels: true,
      smoothCurve: true,
      sortOrder: 'desc',
      limit: 10,
    },
    {
      id: 'chart-2',
      title: `${primaryMetric.label} Trend across ${secondaryDim.label}`,
      type: 'line',
      xAxisKey: secondaryDim.key,
      yAxisKey: primaryMetric.key,
      aggregation: 'sum',
      colorPalette: 'emerald',
      showGrid: true,
      showDataLabels: true,
      smoothCurve: true,
      sortOrder: 'asc',
      limit: 12,
    },
    {
      id: 'chart-3',
      title: `${secondaryMetric.label} Distribution by ${primaryDim.label}`,
      type: 'doughnut',
      xAxisKey: primaryDim.key,
      yAxisKey: secondaryMetric.key,
      aggregation: 'avg',
      colorPalette: 'amber',
      showGrid: false,
      showDataLabels: true,
      smoothCurve: true,
      sortOrder: 'desc',
      limit: 8,
    },
    {
      id: 'chart-4',
      title: `${primaryMetric.label} Breakdown by ${primaryDim.label} & ${secondaryDim.label}`,
      type: 'stacked-bar',
      xAxisKey: primaryDim.key,
      yAxisKey: primaryMetric.key,
      groupByKey: secondaryDim.key,
      aggregation: 'sum',
      colorPalette: 'slate',
      showGrid: true,
      showDataLabels: true,
      smoothCurve: true,
      sortOrder: 'desc',
      limit: 8,
    },
  ];
}
