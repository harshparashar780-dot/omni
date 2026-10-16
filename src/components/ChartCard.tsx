import React, { useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';
import { Download, Maximize2, Settings2, BarChart3, LineChart, PieChart, Sparkles } from 'lucide-react';
import type { ChartConfig, ColumnMeta, DataRow } from '../types/data.ts';
import { aggregateChartData, formatColumnLabel, formatNumber } from '../utils/dataProcessor.ts';
import { exportElementAsHighResImage } from '../utils/exportHelper.ts';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartCardProps {
  config: ChartConfig;
  rows: DataRow[];
  columns: ColumnMeta[];
  onUpdateConfig: (updated: ChartConfig) => void;
  onExpand?: (config: ChartConfig) => void;
}

const PALETTES: Record<string, string[]> = {
  indigo: ['#4f46e5', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1'],
  emerald: ['#059669', '#10b981', '#34d399', '#0d9488', '#14b8a6', '#047857', '#065f46', '#0f766e'],
  slate: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#0f172a', '#64748b'],
  amber: ['#d97706', '#f59e0b', '#fbbf24', '#ea580c', '#f97316', '#c2410c', '#b45309', '#e11d48'],
};

export const ChartCard: React.FC<ChartCardProps> = ({
  config,
  rows,
  columns,
  onUpdateConfig,
  onExpand,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardId = `chart-card-${config.id}`;

  const numericCols = columns.filter((c) => c.type === 'numeric');
  const categoricalCols = columns.filter((c) => c.type === 'categorical' || c.type === 'date');

  // Compute aggregated chart data
  const aggResult = aggregateChartData(
    rows,
    config.xAxisKey,
    config.yAxisKey,
    config.aggregation,
    config.groupByKey,
    config.limit || 12,
    config.sortOrder
  );

  const colors = PALETTES[config.colorPalette] || PALETTES.indigo;

  // Prepare Chart.js dataset config
  const chartData = {
    labels: aggResult.labels,
    datasets: aggResult.datasets.map((ds, idx) => {
      const isMultiColor = (config.type === 'doughnut') && aggResult.datasets.length === 1;
      const baseColor = colors[idx % colors.length];

      if (isMultiColor) {
        return {
          ...ds,
          backgroundColor: colors.slice(0, aggResult.labels.length),
          borderColor: '#ffffff',
          borderWidth: 2,
        };
      }

      if (config.type === 'area') {
        return {
          ...ds,
          fill: true,
          backgroundColor: `${baseColor}25`, // 15% opacity fill
          borderColor: baseColor,
          borderWidth: 2.5,
          tension: config.smoothCurve ? 0.35 : 0,
          pointRadius: 3,
          pointBackgroundColor: baseColor,
        };
      }

      if (config.type === 'line') {
        return {
          ...ds,
          fill: false,
          borderColor: baseColor,
          borderWidth: 2.5,
          tension: config.smoothCurve ? 0.35 : 0,
          pointRadius: 3.5,
          pointBackgroundColor: baseColor,
        };
      }

      if (config.type === 'radar') {
        return {
          ...ds,
          fill: true,
          backgroundColor: `${baseColor}30`,
          borderColor: baseColor,
          pointBackgroundColor: baseColor,
          pointBorderColor: '#fff',
        };
      }

      // Default Bar / Stacked Bar
      return {
        ...ds,
        backgroundColor: baseColor,
        borderRadius: 4,
        maxBarThickness: 42,
      };
    }),
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: config.type === 'doughnut' || (aggResult.datasets.length > 1),
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
          color: '#475569',
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (context: any) => {
            const val = context.parsed.y ?? context.parsed;
            return ` ${context.dataset.label || ''}: ${formatNumber(val, config.yAxisKey)}`;
          },
        },
      },
    },
    scales:
      config.type === 'doughnut' || config.type === 'radar'
        ? undefined
        : {
            x: {
              grid: { display: config.showGrid, color: '#f1f5f9' },
              ticks: {
                font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" },
                color: '#64748b',
                maxRotation: 45,
                minRotation: 0,
              },
            },
            y: {
              stacked: config.type === 'stacked-bar',
              grid: { display: config.showGrid, color: '#f1f5f9' },
              ticks: {
                font: { size: 10, family: "'JetBrains Mono', monospace" },
                color: '#64748b',
                callback: (val: any) => formatNumber(val, config.yAxisKey),
              },
            },
          },
  };

  const handleExportPNG = async () => {
    const filename = `${config.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-hires.png`;
    await exportElementAsHighResImage(cardId, filename);
  };

  return (
    <div
      id={cardId}
      ref={containerRef}
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between transition-shadow hover:shadow-sm"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            {config.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>By {formatColumnLabel(config.xAxisKey)}</span>
            <span aria-hidden="true">·</span>
            <span>{config.aggregation.toUpperCase()} of {formatColumnLabel(config.yAxisKey)}</span>
            {config.groupByKey && (
              <>
                <span aria-hidden="true">·</span>
                <span>Split by {formatColumnLabel(config.groupByKey)}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showConfig ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Configure Chart Dimensions & Palette"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExportPNG}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
            title="Export High-Resolution PNG for Presentation Slides (Keynote/PowerPoint)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          {onExpand && (
            <button
              onClick={() => onExpand(config)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
              title="Expand Chart View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inline Configuration Drawer */}
      {showConfig && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fadeIn">
          {/* Chart Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chart Type</label>
            <select
              value={config.type}
              onChange={(e) => onUpdateConfig({ ...config, type: e.target.value as any })}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
            >
              <option value="bar">Bar Chart</option>
              <option value="stacked-bar">Stacked Bar</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="doughnut">Donut Chart</option>
              <option value="radar">Radar Chart</option>
            </select>
          </div>

          {/* Dimension (X-Axis) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dimension (X-Axis)</label>
            <select
              value={config.xAxisKey}
              onChange={(e) => onUpdateConfig({ ...config, xAxisKey: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
            >
              {categoricalCols.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Metric (Y-Axis) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Metric (Y-Axis)</label>
            <select
              value={config.yAxisKey}
              onChange={(e) => onUpdateConfig({ ...config, yAxisKey: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
            >
              {numericCols.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Aggregation */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Aggregation</label>
            <select
              value={config.aggregation}
              onChange={(e) => onUpdateConfig({ ...config, aggregation: e.target.value as any })}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
            >
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="count">Count</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
            </select>
          </div>
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="relative w-full h-[280px] sm:h-[310px] flex items-center justify-center">
        {aggResult.labels.length === 0 ? (
          <div className="text-xs text-slate-400 italic">No records matching active filters</div>
        ) : config.type === 'doughnut' ? (
          <Doughnut data={chartData} options={chartOptions} />
        ) : config.type === 'line' || config.type === 'area' ? (
          <Line data={chartData} options={chartOptions} />
        ) : config.type === 'radar' ? (
          <Radar data={chartData} options={chartOptions} />
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};
