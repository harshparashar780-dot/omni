import * as XLSX from 'xlsx';
import type {
  ColumnMeta,
  ColumnType,
  DataRow,
  AggregationType,
  FilterState,
  FilterPreset,
  SummaryMetric,
  ExecutiveInsight,
} from '../types/data.ts';

/**
 * Pure function: Detect column types and unique values from raw data rows
 */
export function detectColumnTypes(rows: DataRow[]): ColumnMeta[] {
  if (!rows || rows.length === 0) return [];

  // Extract all unique keys across all rows
  const keysSet = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => keysSet.add(k)));
  const keys = Array.from(keysSet);

  return keys.map((key) => {
    let numericCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    let nullCount = 0;
    let totalCount = 0;
    let minVal: number | undefined = undefined;
    let maxVal: number | undefined = undefined;
    const uniqueValuesSet = new Set<string | number>();

    for (const row of rows) {
      const val = row[key];
      if (val === null || val === undefined || val === '') {
        nullCount++;
        continue;
      }
      totalCount++;

      // Check Boolean
      if (typeof val === 'boolean' || val === 'true' || val === 'false') {
        booleanCount++;
      }

      // Check Numeric
      const num = typeof val === 'number' ? val : Number(String(val).replace(/[\$,%]/g, '').trim());
      if (!isNaN(num) && typeof val !== 'boolean' && String(val).trim() !== '') {
        numericCount++;
        if (minVal === undefined || num < minVal) minVal = num;
        if (maxVal === undefined || num > maxVal) maxVal = num;
      }

      // Check Date
      if (typeof val === 'string' && val.length >= 6 && !isNaN(Date.parse(val)) && isNaN(Number(val))) {
        dateCount++;
      } else if (val instanceof Date) {
        dateCount++;
      }

      if (uniqueValuesSet.size < 500) {
        uniqueValuesSet.add(String(val));
      }
    }

    const validCount = rows.length - nullCount;
    let type: ColumnType = 'categorical';

    if (validCount > 0) {
      if (numericCount / validCount >= 0.8) {
        // If unique values equal row count and key includes 'id' or 'code', classify as ID
        if (uniqueValuesSet.size === rows.length && /id|code|sku|uuid/i.test(key)) {
          type = 'id';
        } else {
          type = 'numeric';
        }
      } else if (dateCount / validCount >= 0.7 || /date|time|timestamp|period/i.test(key)) {
        type = 'date';
      } else if (booleanCount / validCount >= 0.8) {
        type = 'boolean';
      } else if (uniqueValuesSet.size === rows.length && /id|uuid|guid|key/i.test(key)) {
        type = 'id';
      } else {
        type = 'categorical';
      }
    }

    return {
      key,
      label: formatColumnLabel(key),
      type,
      uniqueValues: Array.from(uniqueValuesSet).slice(0, 100),
      min: minVal,
      max: maxVal,
      nullCount,
      totalCount: rows.length,
    };
  });
}

export function formatColumnLabel(key: string): string {
  // Convert camelCase or snake_case or hyphen-case to Title Case
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Pure function: Parse Excel buffer into sheets and records
 */
export function parseExcelBuffer(buffer: ArrayBuffer): { sheetNames: string[]; sheetsData: Record<string, DataRow[]> } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;
  const sheetsData: Record<string, DataRow[]> = {};

  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name];
    if (sheet) {
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      sheetsData[name] = rawRows.map((row) => {
        const cleanRow: DataRow = {};
        for (const [k, v] of Object.entries(row)) {
          const cleanKey = k.trim();
          if (v instanceof Date) {
            cleanRow[cleanKey] = v.toISOString().split('T')[0];
          } else if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) {
            cleanRow[cleanKey] = Number(v.trim());
          } else {
            cleanRow[cleanKey] = v;
          }
        }
        return cleanRow;
      });
    }
  }

  return { sheetNames, sheetsData };
}

/**
 * Pure function: Calculate summary metric statistics for a numeric column
 */
export function calculateSummaryStatistics(rows: DataRow[], columnKey: string): SummaryMetric | null {
  if (!rows || rows.length === 0) return null;

  const values: number[] = [];
  for (const row of rows) {
    const val = row[columnKey];
    const num = typeof val === 'number' ? val : Number(String(val).replace(/[\$,%]/g, '').trim());
    if (!isNaN(num) && val !== null && val !== undefined && val !== '') {
      values.push(num);
    }
  }

  if (values.length === 0) return null;

  const total = values.reduce((acc, v) => acc + v, 0);
  const average = total / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Approximate trend comparing first half of rows to second half
  const half = Math.floor(values.length / 2);
  let deltaPercent = 0;
  if (half > 0) {
    const firstHalfAvg = values.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const secondHalfAvg = values.slice(half).reduce((a, b) => a + b, 0) / (values.length - half);
    if (firstHalfAvg !== 0) {
      deltaPercent = Math.round(((secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)) * 100);
    }
  }

  const isRateOrMargin = /rate|ratio|margin|roi|percentage|pct|csat|nps/i.test(columnKey);
  const primaryDisplayVal = isRateOrMargin ? average : total;

  return {
    key: columnKey,
    label: formatColumnLabel(columnKey),
    total,
    average,
    min,
    max,
    count: values.length,
    formattedTotal: formatNumber(primaryDisplayVal, columnKey),
    deltaPercent,
    trend: deltaPercent > 0 ? 'up' : deltaPercent < 0 ? 'down' : 'neutral',
  };
}

export function formatNumber(value: number, keyHint = ''): string {
  const isCurrency = /revenue|cost|price|budget|sales|profit|spend|fee|arr|mrr|ltv|cac|amount/i.test(keyHint);
  const isPercent = /rate|ratio|margin|roi|percentage|pct/i.test(keyHint);

  if (isPercent) {
    return `${value >= 0 ? '' : ''}${value.toFixed(1)}%`;
  }

  if (Math.abs(value) >= 1_000_000_000) {
    return `${isCurrency ? '$' : ''}${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${isCurrency ? '$' : ''}${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${isCurrency ? '$' : ''}${(value / 1_000).toFixed(1)}k`;
  }

  return `${isCurrency ? '$' : ''}${Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2)}`;
}

/**
 * Pure function: Apply search, categorical filters, numeric ranges, and date filtering
 */
export function applyFilters(rows: DataRow[], filters: FilterState): DataRow[] {
  if (!rows || rows.length === 0) return [];

  return rows.filter((row) => {
    // 1. Text Search Query
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      const match = Object.values(row).some((val) =>
        String(val ?? '').toLowerCase().includes(q)
      );
      if (!match) return false;
    }

    // 2. Categorical Filters
    for (const [colKey, selectedValues] of Object.entries(filters.categoricalFilters)) {
      if (selectedValues && selectedValues.length > 0) {
        const rowVal = String(row[colKey] ?? '');
        if (!selectedValues.includes(rowVal)) {
          return false;
        }
      }
    }

    // 3. Numeric Ranges
    for (const [colKey, range] of Object.entries(filters.numericRanges)) {
      if (range) {
        const val = Number(row[colKey]);
        if (!isNaN(val)) {
          if (val < range.min || val > range.max) {
            return false;
          }
        }
      }
    }

    // 4. Date Range
    if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) {
      // Find first date column or check standard date fields
      let rowDateStr: string | undefined = undefined;
      for (const [k, v] of Object.entries(row)) {
        if (/date|time|period|quarter|month/i.test(k) && v) {
          rowDateStr = String(v);
          break;
        }
      }
      if (rowDateStr) {
        const rowTime = new Date(rowDateStr).getTime();
        if (!isNaN(rowTime)) {
          if (filters.dateRange.start) {
            const startTime = new Date(filters.dateRange.start).getTime();
            if (!isNaN(startTime) && rowTime < startTime) return false;
          }
          if (filters.dateRange.end) {
            const endTime = new Date(filters.dateRange.end).getTime();
            if (!isNaN(endTime) && rowTime > endTime) return false;
          }
        }
      }
    }

    return true;
  });
}

/**
 * Pure function: Aggregate data for chart rendering
 */
export interface AggregatedChartResult {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

export function aggregateChartData(
  rows: DataRow[],
  xAxisKey: string,
  yAxisKey: string,
  aggregation: AggregationType = 'sum',
  groupByKey?: string,
  limit = 15,
  sortOrder: 'desc' | 'asc' | 'none' = 'desc'
): AggregatedChartResult {
  if (!rows || rows.length === 0 || !xAxisKey) {
    return { labels: [], datasets: [] };
  }

  // Without secondary grouping
  if (!groupByKey || groupByKey === xAxisKey) {
    const buckets: Record<string, number[]> = {};

    for (const row of rows) {
      const rawX = row[xAxisKey];
      const xLabel = rawX === null || rawX === undefined || rawX === '' ? '(Blank)' : String(rawX);
      const rawY = row[yAxisKey];
      const yVal = typeof rawY === 'number' ? rawY : Number(String(rawY).replace(/[\$,%]/g, '').trim());

      if (!buckets[xLabel]) {
        buckets[xLabel] = [];
      }
      if (!isNaN(yVal)) {
        buckets[xLabel].push(yVal);
      }
    }

    const aggregatedList: { label: string; value: number }[] = Object.entries(buckets).map(([label, vals]) => {
      let value = 0;
      if (vals.length === 0) {
        value = 0;
      } else if (aggregation === 'sum') {
        value = vals.reduce((a, b) => a + b, 0);
      } else if (aggregation === 'avg') {
        value = vals.reduce((a, b) => a + b, 0) / vals.length;
      } else if (aggregation === 'count') {
        value = vals.length;
      } else if (aggregation === 'min') {
        value = Math.min(...vals);
      } else if (aggregation === 'max') {
        value = Math.max(...vals);
      }
      return { label, value: Number(value.toFixed(2)) };
    });

    if (sortOrder === 'desc') {
      aggregatedList.sort((a, b) => b.value - a.value);
    } else if (sortOrder === 'asc') {
      aggregatedList.sort((a, b) => a.value - b.value);
    }

    const limited = aggregatedList.slice(0, limit);
    return {
      labels: limited.map((i) => i.label),
      datasets: [
        {
          label: `${formatColumnLabel(yAxisKey)} (${aggregation.toUpperCase()})`,
          data: limited.map((i) => i.value),
        },
      ],
    };
  }

  // Multi-grouping (e.g. Sales by Region grouped by Quarter)
  const primaryBuckets = new Set<string>();
  const groupBuckets = new Set<string>();
  const matrix: Record<string, Record<string, number[]>> = {};

  for (const row of rows) {
    const rawX = row[xAxisKey];
    const xLabel = rawX === null || rawX === undefined ? '(Blank)' : String(rawX);
    const rawGroup = row[groupByKey];
    const gLabel = rawGroup === null || rawGroup === undefined ? 'General' : String(rawGroup);
    const rawY = row[yAxisKey];
    const yVal = typeof rawY === 'number' ? rawY : Number(String(rawY).replace(/[\$,%]/g, '').trim());

    primaryBuckets.add(xLabel);
    groupBuckets.add(gLabel);

    if (!matrix[gLabel]) matrix[gLabel] = {};
    if (!matrix[gLabel][xLabel]) matrix[gLabel][xLabel] = [];
    if (!isNaN(yVal)) matrix[gLabel][xLabel].push(yVal);
  }

  const labels = Array.from(primaryBuckets).slice(0, limit);
  const groups = Array.from(groupBuckets).slice(0, 8);

  const datasets = groups.map((g) => {
    const data = labels.map((l) => {
      const vals = matrix[g]?.[l] || [];
      if (vals.length === 0) return 0;
      if (aggregation === 'sum') return Number(vals.reduce((a, b) => a + b, 0).toFixed(2));
      if (aggregation === 'avg') return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
      if (aggregation === 'count') return vals.length;
      if (aggregation === 'min') return Math.min(...vals);
      if (aggregation === 'max') return Math.max(...vals);
      return 0;
    });

    return {
      label: g,
      data,
    };
  });

  return { labels, datasets };
}

/**
 * Pure function: Automatically generate presentation filter presets based on dataset structure
 */
export function generateAutoFiltersAndPresets(rows: DataRow[], columns: ColumnMeta[]): FilterPreset[] {
  const presets: FilterPreset[] = [
    {
      id: 'all',
      title: 'Complete View',
      description: 'All records unfiltered with full historical baseline',
      filters: { searchQuery: '', categoricalFilters: {}, numericRanges: {} },
    },
  ];

  if (!rows || rows.length === 0 || !columns || columns.length === 0) {
    return presets;
  }

  const numericCols = columns.filter((c) => c.type === 'numeric');
  const categoricalCols = columns.filter((c) => c.type === 'categorical' && c.uniqueValues.length >= 2 && c.uniqueValues.length <= 15);

  // Find primary numeric metric (e.g. revenue, sales, profit, score)
  const primaryMetric =
    numericCols.find((c) => /revenue|sales|profit|arr|mrr|score|amount/i.test(c.key)) || numericCols[0];

  // 1. Top Performers Preset
  if (primaryMetric && primaryMetric.min !== undefined && primaryMetric.max !== undefined) {
    const threshold = Number((primaryMetric.min + (primaryMetric.max - primaryMetric.min) * 0.6).toFixed(2));
    presets.push({
      id: 'top-performers',
      title: `Top 40% ${primaryMetric.label}`,
      description: `Focus on high-value items where ${primaryMetric.label} ≥ ${formatNumber(threshold, primaryMetric.key)}`,
      badge: 'High Impact',
      filters: {
        numericRanges: {
          [primaryMetric.key]: { min: threshold, max: primaryMetric.max },
        },
      },
    });
  }

  // 2. High Margin / High Efficiency Preset (if margin, roi, or csat exists)
  const marginCol = numericCols.find((c) => /margin|roi|csat|rate|ratio|efficiency/i.test(c.key));
  if (marginCol && marginCol.min !== undefined && marginCol.max !== undefined) {
    const marginThreshold = Number((marginCol.min + (marginCol.max - marginCol.min) * 0.5).toFixed(1));
    presets.push({
      id: 'high-efficiency',
      title: `High ${marginCol.label}`,
      description: `Segments exhibiting superior ${marginCol.label} (≥ ${marginThreshold}%)`,
      badge: 'Efficiency',
      filters: {
        numericRanges: {
          [marginCol.key]: { min: marginThreshold, max: marginCol.max },
        },
      },
    });
  }

  // 3. Dominant Category Preset (e.g. top category by occurrence)
  if (categoricalCols.length > 0) {
    const topCatCol = categoricalCols[0];
    const firstTwoVals = topCatCol.uniqueValues.slice(0, 2).map(String);
    if (firstTwoVals.length > 0) {
      presets.push({
        id: `focus-${topCatCol.key}`,
        title: `${firstTwoVals[0]} Segment`,
        description: `Deep dive into primary focus segment: ${firstTwoVals[0]}`,
        badge: 'Segment Focus',
        filters: {
          categoricalFilters: {
            [topCatCol.key]: [firstTwoVals[0]],
          },
        },
      });
    }
  }

  return presets;
}

/**
 * Pure function: Generate analytical presentation insights from current filtered data
 */
export function generateExecutiveInsights(
  rows: DataRow[],
  columns: ColumnMeta[]
): ExecutiveInsight[] {
  if (!rows || rows.length === 0) return [];

  const insights: ExecutiveInsight[] = [];
  const numericCols = columns.filter((c) => c.type === 'numeric');
  const catCols = columns.filter((c) => c.type === 'categorical' && c.uniqueValues.length >= 2);

  const primaryMetric =
    numericCols.find((c) => /revenue|sales|profit|arr|mrr|score|volume/i.test(c.key)) || numericCols[0];

  if (primaryMetric) {
    const stats = calculateSummaryStatistics(rows, primaryMetric.key);
    if (stats) {
      // 1. Total & Scale
      insights.push({
        id: 'scale-metric',
        type: 'growth',
        title: `Aggregated ${stats.label}: ${stats.formattedTotal}`,
        description: `Across ${rows.length.toLocaleString()} active entries, average ${stats.label.toLowerCase()} is ${formatNumber(stats.average, stats.key)} with a peak of ${formatNumber(stats.max, stats.key)}.`,
        metric: stats.formattedTotal,
        impact: stats.trend === 'up' ? 'positive' : stats.trend === 'down' ? 'warning' : 'neutral',
      });
    }

    // 2. Dominant Dimension Driver
    if (catCols.length > 0) {
      const dim = catCols[0];
      const agg = aggregateChartData(rows, dim.key, primaryMetric.key, 'sum', undefined, 5, 'desc');
      if (agg.labels.length > 0 && agg.datasets[0]?.data.length > 0) {
        const topLabel = agg.labels[0];
        const topVal = agg.datasets[0].data[0];
        const total = agg.datasets[0].data.reduce((a, b) => a + b, 0);
        const share = total > 0 ? Math.round((topVal / total) * 100) : 0;

        insights.push({
          id: 'leader-dimension',
          type: 'leader',
          title: `${topLabel} leads ${dim.label} with ${share}% share`,
          description: `Generating ${formatNumber(topVal, primaryMetric.key)} of the top distributed ${primaryMetric.label.toLowerCase()}, outpacing secondary contributors.`,
          metric: `${share}% share`,
          impact: 'positive',
        });
      }
    }
  }

  // 3. Margin or Quality Metric (if present)
  const qualityCol = numericCols.find((c) => /margin|csat|nps|conversion|retention|roi/i.test(c.key));
  if (qualityCol) {
    const qStats = calculateSummaryStatistics(rows, qualityCol.key);
    if (qStats) {
      const isStrong = qStats.average >= 50 || /csat/i.test(qualityCol.key) ? qStats.average >= 4 : true;
      insights.push({
        id: 'efficiency-health',
        type: 'distribution',
        title: `Benchmark Average ${qStats.label}: ${qStats.average.toFixed(1)}${/rate|margin|roi/i.test(qStats.key) ? '%' : ''}`,
        description: `Performance span ranges from ${qStats.min.toFixed(1)} to ${qStats.max.toFixed(1)}, showing healthy distribution across cohorts.`,
        metric: `${qStats.average.toFixed(1)}`,
        impact: isStrong ? 'positive' : 'warning',
      });
    }
  }

  // 4. Strategic Executive Recommendation
  insights.push({
    id: 'executive-recom',
    type: 'recommendation',
    title: 'Presentation Strategy Recommendation',
    description: `Prioritize top 20% high-yield segments for capital allocation while consolidating lower performing long-tail entries.`,
    impact: 'neutral',
  });

  return insights;
}
