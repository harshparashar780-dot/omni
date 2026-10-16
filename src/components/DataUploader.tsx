import React, { useState } from 'react';
import { Upload, FileSpreadsheet, X, Layers, CheckCircle2 } from 'lucide-react';
import type { Dataset } from '../types/data.ts';
import { parseExcelBuffer, detectColumnTypes } from '../utils/dataProcessor.ts';
import { sampleDatasets } from '../data/sampleDatasets.ts';

interface DataUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  activeDataset: Dataset;
  onSelectDataset: (dataset: Dataset) => void;
}

export const DataUploader: React.FC<DataUploaderProps> = ({
  isOpen,
  onClose,
  activeDataset,
  onSelectDataset,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const buffer = await file.arrayBuffer();
      const { sheetNames, sheetsData } = parseExcelBuffer(buffer);

      if (sheetNames.length === 0 || Object.keys(sheetsData).length === 0) {
        throw new Error('No valid sheets or tabular data found in file.');
      }

      const firstSheet = sheetNames[0];
      const rows = sheetsData[firstSheet] || [];

      if (rows.length === 0) {
        throw new Error(`Sheet "${firstSheet}" contains no data rows.`);
      }

      const columns = detectColumnTypes(rows);

      const newDataset: Dataset = {
        id: `custom-${Date.now()}`,
        name: file.name,
        sheetNames,
        activeSheet: firstSheet,
        rows,
        columns,
        uploadedAt: new Date().toLocaleTimeString(),
        sourceType: file.name.endsWith('.csv') ? 'csv' : 'excel',
        fileSize: file.size,
      };

      onSelectDataset(newDataset);
      onClose();
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg(err.message || 'Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl p-6 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Excel Data Ingestion
              </h3>
              <p className="text-xs text-slate-500">
                Upload your workbook (.xlsx, .xls, .csv) or explore sample benchmarks
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

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
          onClick={() => document.getElementById('excel-file-input')?.click()}
        >
          <input
            id="excel-file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 mb-1">
            {loading ? 'Processing Excel Sheet...' : 'Drop Excel or CSV file here'}
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            Supports .xlsx, .xls, and .csv multi-sheet workbooks
          </p>
          <span className="inline-block px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-2xs">
            Browse Local File
          </span>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 text-xs text-rose-700 bg-rose-50 rounded-lg border border-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Multi-sheet indicator if active dataset has multiple sheets */}
        {activeDataset.sheetNames.length > 1 && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-700">Workbook Sheets:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeDataset.sheetNames.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    onSelectDataset({ ...activeDataset, activeSheet: name });
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activeDataset.activeSheet === name
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Built-in Sample Datasets */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Or Load Curated Business Benchmarks
          </label>
          <div className="space-y-2">
            {sampleDatasets.map((sample) => {
              const isSelected = activeDataset.id === sample.id;
              return (
                <div
                  key={sample.id}
                  onClick={() => {
                    onSelectDataset(sample);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/30'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet
                      className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {sample.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{sample.rows.length} records</span>
                        <span aria-hidden="true">·</span>
                        <span>{sample.columns.length} columns</span>
                        <span aria-hidden="true">·</span>
                        <span>{sample.sheetNames.length} sheets</span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
