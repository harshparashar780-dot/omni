import React from 'react';
import { Presentation, Download, FileSpreadsheet, SlidersHorizontal, Table } from 'lucide-react';

interface HeaderProps {
  datasetName: string;
  rowCount: number;
  filteredCount: number;
  activeView: 'dashboard' | 'table';
  onViewChange: (view: 'dashboard' | 'table') => void;
  onOpenUploadModal: () => void;
  onOpenReportModal: () => void;
  onOpenPresentationMode: () => void;
  onToggleFilters: () => void;
  isFiltersVisible: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  datasetName,
  rowCount,
  filteredCount,
  activeView,
  onViewChange,
  onOpenUploadModal,
  onOpenReportModal,
  onOpenPresentationMode,
  onToggleFilters,
  isFiltersVisible,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            O
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            OmniViz Analytics
          </span>
        </div>

        {/* Zone 2: Navigation Links & View Controls */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onViewChange('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'dashboard' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onViewChange('table')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'table' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            Data Table
          </button>
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isFiltersVisible ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Auto-Filters
          </button>
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="truncate max-w-[150px]">{datasetName}</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenPresentationMode}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Open Fullscreen Presentation Mode for Slides"
          >
            <Presentation className="w-3.5 h-3.5 text-indigo-600" />
            Presentation Mode
          </button>
          <button
            onClick={onOpenReportModal}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Executive Report</span>
            <span className="sm:hidden">Export Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
