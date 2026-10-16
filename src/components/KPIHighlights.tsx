import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SummaryMetric } from '../types/data.ts';

interface KPIHighlightsProps {
  metrics: SummaryMetric[];
  activeFilterCount: number;
  totalRowCount: number;
  filteredRowCount: number;
}

export const KPIHighlights: React.FC<KPIHighlightsProps> = ({
  metrics,
  activeFilterCount,
  totalRowCount,
  filteredRowCount,
}) => {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.slice(0, 4).map((metric) => {
          const isUp = metric.trend === 'up';
          const isDown = metric.trend === 'down';

          return (
            <div
              key={metric.key}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {metric.label}
                </span>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    isUp ? 'text-emerald-600' : isDown ? 'text-rose-600' : 'text-slate-500'
                  }`}
                >
                  {isUp && <TrendingUp className="w-3.5 h-3.5" />}
                  {isDown && <TrendingDown className="w-3.5 h-3.5" />}
                  {!isUp && !isDown && <Minus className="w-3.5 h-3.5" />}
                  <span className="font-mono tabular-nums">
                    {metric.deltaPercent ? `${metric.deltaPercent > 0 ? '+' : ''}${metric.deltaPercent}%` : 'Stable'}
                  </span>
                </div>
              </div>

              {/* Dominant KPI Value */}
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums mb-2">
                {metric.formattedTotal}
              </div>

              {/* Clean Unboxed Metadata with Typographic Separator */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Avg: {metric.average.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>Peak: {metric.max.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>{metric.count} samples</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
