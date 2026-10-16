import React from 'react';
import { Plus, Sparkles, TrendingUp, Award, BarChart2 } from 'lucide-react';
import type { ChartConfig, ColumnMeta, DataRow, ExecutiveInsight } from '../types/data.ts';
import { ChartCard } from './ChartCard.tsx';

interface ChartGridProps {
  charts: ChartConfig[];
  rows: DataRow[];
  columns: ColumnMeta[];
  insights: ExecutiveInsight[];
  onUpdateChart: (index: number, updated: ChartConfig) => void;
  onAddChart: () => void;
  onExpandChart: (config: ChartConfig) => void;
}

export const ChartGrid: React.FC<ChartGridProps> = ({
  charts,
  rows,
  columns,
  insights,
  onUpdateChart,
  onAddChart,
  onExpandChart,
}) => {
  return (
    <div className="space-y-6">
      {/* Automated Analytical Insights Strip */}
      {insights.length > 0 && (
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Automated Executive Presentation Signals
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/80 rounded-lg p-3.5 border border-slate-700/60"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h4 className="text-xs font-semibold text-slate-100 truncate">
                    {item.title}
                  </h4>
                  {item.metric && (
                    <span className="text-[11px] font-mono tabular-nums text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/50 shrink-0">
                      {item.metric}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Interactive Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map((chart, idx) => (
          <ChartCard
            key={chart.id}
            config={chart}
            rows={rows}
            columns={columns}
            onUpdateConfig={(updated) => onUpdateChart(idx, updated)}
            onExpand={onExpandChart}
          />
        ))}
      </div>

      {/* Add Custom Visualization Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onAddChart}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-600" />
          Add Custom Chart
        </button>
      </div>
    </div>
  );
};
