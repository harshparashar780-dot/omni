import React, { useState } from 'react';
import { Search, RotateCcw, Sparkles, Filter, ChevronDown, Check, X } from 'lucide-react';
import type { ColumnMeta, FilterPreset, FilterState } from '../types/data.ts';

interface AutoFilterBarProps {
  columns: ColumnMeta[];
  presets: FilterPreset[];
  activePresetId: string;
  onSelectPreset: (preset: FilterPreset) => void;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
  onReset: () => void;
}

export const AutoFilterBar: React.FC<AutoFilterBarProps> = ({
  columns,
  presets,
  activePresetId,
  onSelectPreset,
  filters,
  onFilterChange,
  totalCount,
  filteredCount,
  onReset,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Identify top categorical filterable columns (e.g. 2 to 12 unique items)
  const filterableCategories = columns.filter(
    (c) => c.type === 'categorical' && c.uniqueValues.length >= 2 && c.uniqueValues.length <= 20
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      searchQuery: e.target.value,
      activePresetId: undefined,
    });
  };

  const handleToggleCategoryValue = (columnKey: string, val: string) => {
    const current = filters.categoricalFilters[columnKey] || [];
    const updated = current.includes(val)
      ? current.filter((item) => item !== val)
      : [...current, val];

    onFilterChange({
      ...filters,
      categoricalFilters: {
        ...filters.categoricalFilters,
        [columnKey]: updated,
      },
      activePresetId: undefined,
    });
  };

  const handleClearCategory = (columnKey: string) => {
    const updated = { ...filters.categoricalFilters };
    delete updated[columnKey];
    onFilterChange({
      ...filters,
      categoricalFilters: updated,
      activePresetId: undefined,
    });
  };

  // Count active filter conditions
  const activeCategoryCount = Object.values(filters.categoricalFilters).reduce(
    (acc, vals) => acc + (vals.length > 0 ? 1 : 0),
    0
  );
  const activeRangeCount = Object.keys(filters.numericRanges).length;
  const isFiltered =
    activeCategoryCount > 0 ||
    activeRangeCount > 0 ||
    Boolean(filters.searchQuery) ||
    (activePresetId && activePresetId !== 'all');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-xs">
      {/* 1. Presentation Presets Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Presentation Filter Presets
            </span>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {filteredCount} of {totalCount} records active
          </span>
        </div>

        {/* Functional segmented control buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title={preset.description}
              >
                <span>{preset.title}</span>
                {preset.badge && !isActive && (
                  <span className="text-[10px] text-slate-400">· {preset.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-slate-100 my-3" />

      {/* 2. Granular Filters & Live Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Live Search */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search across all fields..."
              value={filters.searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ ...filters, searchQuery: '', activePresetId: undefined })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categorical Dimension Dropdowns */}
          {filterableCategories.slice(0, 4).map((col) => {
            const selected = filters.categoricalFilters[col.key] || [];
            const isOpen = openDropdown === col.key;

            return (
              <div key={col.key} className="relative">
                <button
                  onClick={() => setOpenDropdown(isOpen ? null : col.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                    selected.length > 0
                      ? 'border-indigo-300 bg-indigo-50/60 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="w-3 h-3 text-slate-400" />
                  <span>{col.label}</span>
                  {selected.length > 0 && (
                    <span className="font-mono text-[10px] bg-indigo-200 text-indigo-800 rounded px-1">
                      {selected.length}
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setOpenDropdown(null)}
                    />
                    <div className="absolute left-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 max-h-60 overflow-y-auto">
                      <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Filter by {col.label}</span>
                        {selected.length > 0 && (
                          <button
                            onClick={() => handleClearCategory(col.key)}
                            className="text-indigo-600 hover:underline capitalize"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {col.uniqueValues.map((val) => {
                        const valStr = String(val);
                        const isChecked = selected.includes(valStr);
                        return (
                          <label
                            key={valStr}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-xs text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCategoryValue(col.key, valStr)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="truncate">{valStr}</span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};
