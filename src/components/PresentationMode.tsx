import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Presentation, Sparkles, TrendingUp, Download } from 'lucide-react';
import type { ChartConfig, ColumnMeta, DataRow, ExecutiveInsight, SummaryMetric } from '../types/data.ts';
import { ChartCard } from './ChartCard.tsx';
import { exportElementAsHighResImage } from '../utils/exportHelper.ts';

interface PresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
  datasetName: string;
  metrics: SummaryMetric[];
  insights: ExecutiveInsight[];
  charts: ChartConfig[];
  rows: DataRow[];
  columns: ColumnMeta[];
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  isOpen,
  onClose,
  datasetName,
  metrics,
  insights,
  charts,
  rows,
  columns,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Total slides: Slide 0 (Executive Title & KPIs), Slide 1..N (each primary chart), Slide N+1 (Strategic Recommendations)
  const totalSlides = 1 + Math.min(charts.length, 3) + 1;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentSlide((s) => Math.min(totalSlides - 1, s + 1));
      }
      if (e.key === 'ArrowLeft') {
        setCurrentSlide((s) => Math.max(0, s - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, totalSlides, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden animate-fadeIn">
      {/* Top Presentation Bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            P
          </div>
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            {datasetName}  ·  Executive Briefing
          </span>
        </div>

        {/* Slide Counter & Close */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-slate-400">
            Slide {currentSlide + 1} of {totalSlides}
          </span>
          <button
            onClick={() => exportElementAsHighResImage('presentation-slide-view', `presentation-slide-${currentSlide + 1}.png`)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Download this slide as high-res PNG image"
          >
            <Download className="w-3.5 h-3.5" />
            Capture Slide
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Exit Presentation Mode (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Content Canvas */}
      <div
        id="presentation-slide-view"
        className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-12 flex flex-col justify-center bg-slate-950"
      >
        {/* SLIDE 0: TITLE & EXECUTIVE METRICS */}
        {currentSlide === 0 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-3">
                <Sparkles className="w-4 h-4" />
                Executive Briefing
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                Operations & Performance Intelligence
              </h1>
              <p className="text-base text-slate-400 max-w-2xl leading-relaxed">
                Automated multi-dimensional data synthesis across active operational units, highlighted cohort benchmarks, and filtered quarterly momentum.
              </p>
            </div>

            {/* Big Headline KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-4">
              {metrics.slice(0, 4).map((m) => (
                <div
                  key={m.key}
                  className="bg-slate-900/90 rounded-xl p-5 border border-slate-800"
                >
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {m.label}
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono tabular-nums mb-2">
                    {m.formattedTotal}
                  </div>
                  <div className="text-xs text-slate-400">
                    Average: {m.average.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </div>
                </div>
              ))}
            </div>

            {/* Core Finding */}
            {insights[0] && (
              <div className="p-4 bg-indigo-950/40 rounded-xl border border-indigo-800/50 flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-indigo-200">
                    {insights[0].title}
                  </h4>
                  <p className="text-xs text-indigo-300/80 mt-0.5">
                    {insights[0].description}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SLIDES 1..N: CHART SPOTLIGHTS */}
        {currentSlide > 0 && currentSlide <= Math.min(charts.length, 3) && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Performance Deep-Dive {currentSlide}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  {charts[currentSlide - 1].title}
                </h2>
              </div>
            </div>

            {/* Embedded High-Contrast Chart Card */}
            <div className="bg-white rounded-xl p-4 shadow-xl">
              <ChartCard
                config={charts[currentSlide - 1]}
                rows={rows}
                columns={columns}
                onUpdateConfig={() => {}}
              />
            </div>

            {/* Contextual Analytical Note */}
            {insights[currentSlide - 1] && (
              <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-300">
                <strong className="text-white mr-1.5 font-semibold">Takeaway:</strong>
                {insights[currentSlide - 1].description}
              </div>
            )}
          </div>
        )}

        {/* FINAL SLIDE: STRATEGIC SUMMARY & RECOMMENDATIONS */}
        {currentSlide === totalSlides - 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Strategic Synthesis
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                Executive Action Directives
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Synthesized from {rows.length} verified data records across active cohorts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {insights.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-5 bg-slate-900 rounded-xl border border-slate-800 flex items-start gap-3.5"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Dock */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <button
          onClick={() => setCurrentSlide((s) => Math.max(0, s - 1))}
          disabled={currentSlide === 0}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Slide
        </button>

        {/* Slide Dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentSlide === idx ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide((s) => Math.min(totalSlides - 1, s + 1))}
          disabled={currentSlide === totalSlides - 1}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          Next Slide
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
