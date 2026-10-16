import React, { useState } from 'react';
import { ArrowUpDown, Download, Search, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ColumnMeta, DataRow } from '../types/data.ts';
import { exportToExcel, exportToCSV } from '../utils/exportHelper.ts';

interface DataTableModalProps {
  rows: DataRow[];
  columns: ColumnMeta[];
  datasetName: string;
}

export const DataTableModal: React.FC<DataTableModalProps> = ({
  rows,
  columns,
  datasetName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filter rows
  const filtered = rows.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q));
  });

  // Sort rows
  const sorted = [...filtered].sort((a, b) => {
    if (!sortCol) return 0;
    const aVal = a[sortCol];
    const bVal = b[sortCol];

    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const isNum = typeof aVal === 'number' && typeof bVal === 'number';
    if (isNum) {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginatedRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colKey);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Raw Tabular Dataset
          </h3>
          <p className="text-xs text-slate-500">
            Showing {sorted.length} matching rows across {columns.length} schema dimensions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Table Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search data table..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Export Buttons */}
          <button
            onClick={() => exportToExcel(sorted, `${datasetName.replace('.xlsx', '')}_filtered.xlsx`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel (.xlsx)
          </button>
          <button
            onClick={() => exportToCSV(sorted, `${datasetName.replace('.xlsx', '')}_filtered.csv`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-2.5 px-3 w-12 text-center text-slate-400 font-mono">#</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`py-2.5 px-3 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap select-none ${
                    col.type === 'numeric' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      col.type === 'numeric' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span>{col.label}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-slate-400">
                  No records matching search query
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col.key];
                    const isNum = col.type === 'numeric';
                    return (
                      <td
                        key={col.key}
                        className={`py-2 px-3 whitespace-nowrap text-slate-700 ${
                          isNum ? 'text-right font-mono tabular-nums' : 'text-left'
                        }`}
                      >
                        {val === null || val === undefined
                          ? '—'
                          : isNum && typeof val === 'number'
                          ? val.toLocaleString()
                          : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
        <div>
          Page {currentPage} of {totalPages} ({sorted.length} total rows)
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
