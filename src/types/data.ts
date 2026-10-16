export type ColumnType = 'numeric' | 'categorical' | 'date' | 'boolean' | 'id';

export interface ColumnMeta {
  key: string;
  label: string;
  type: ColumnType;
  uniqueValues: (string | number)[];
  min?: number;
  max?: number;
  nullCount: number;
  totalCount: number;
}

export type DataRow = Record<string, any>;

export interface Dataset {
  id: string;
  name: string;
  sheetNames: string[];
  activeSheet: string;
  rows: DataRow[];
  columns: ColumnMeta[];
  uploadedAt: string;
  sourceType: 'sample' | 'excel' | 'csv';
  fileSize?: number;
}

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';

export type ChartType = 'bar' | 'stacked-bar' | 'line' | 'area' | 'doughnut' | 'scatter' | 'radar';

export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  xAxisKey: string;
  yAxisKey: string;
  aggregation: AggregationType;
  groupByKey?: string;
  colorPalette: string;
  showGrid: boolean;
  showDataLabels: boolean;
  smoothCurve: boolean;
  sortOrder: 'desc' | 'asc' | 'none';
  limit?: number;
}

export interface FilterState {
  searchQuery: string;
  categoricalFilters: Record<string, string[]>;
  numericRanges: Record<string, { min: number; max: number }>;
  dateRange?: { start?: string; end?: string };
  activePresetId?: string;
}

export interface FilterPreset {
  id: string;
  title: string;
  description: string;
  filters: Partial<FilterState>;
  badge?: string;
}

export interface SummaryMetric {
  key: string;
  label: string;
  total: number;
  average: number;
  min: number;
  max: number;
  count: number;
  formattedTotal: string;
  deltaPercent?: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface ExecutiveInsight {
  id: string;
  type: 'growth' | 'anomaly' | 'leader' | 'distribution' | 'recommendation';
  title: string;
  description: string;
  metric?: string;
  impact: 'positive' | 'warning' | 'neutral';
}

export interface ReportConfig {
  reportTitle: string;
  companyName: string;
  preparedBy: string;
  date: string;
  executiveSummary: string;
  includeKPIs: boolean;
  includeCharts: string[];
  includeDataTableSummary: boolean;
  notes: string;
}
