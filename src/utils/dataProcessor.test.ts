import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectColumnTypes,
  calculateSummaryStatistics,
  applyFilters,
  aggregateChartData,
  generateAutoFiltersAndPresets,
  generateExecutiveInsights,
  formatNumber,
} from './dataProcessor.ts';
import type { DataRow } from '../types/data.ts';

const mockSalesData: DataRow[] = [
  { Region: 'North America', Quarter: 'Q1', Revenue: 120000, Units: 500, Margin: 35.5, Date: '2024-01-15' },
  { Region: 'North America', Quarter: 'Q2', Revenue: 145000, Units: 620, Margin: 38.0, Date: '2024-04-12' },
  { Region: 'Europe', Quarter: 'Q1', Revenue: 95000, Units: 410, Margin: 29.5, Date: '2024-01-20' },
  { Region: 'Europe', Quarter: 'Q2', Revenue: 110000, Units: 480, Margin: 31.0, Date: '2024-04-18' },
  { Region: 'Asia Pacific', Quarter: 'Q1', Revenue: 85000, Units: 390, Margin: 27.0, Date: '2024-01-25' },
  { Region: 'Asia Pacific', Quarter: 'Q2', Revenue: 130000, Units: 580, Margin: 34.2, Date: '2024-04-22' },
];

test('detectColumnTypes correctly identifies numeric, categorical, and date fields', () => {
  const columns = detectColumnTypes(mockSalesData);
  assert.equal(columns.length, 6);

  const regionCol = columns.find((c) => c.key === 'Region');
  assert.ok(regionCol);
  assert.equal(regionCol.type, 'categorical');
  assert.equal(regionCol.uniqueValues.length, 3);

  const revCol = columns.find((c) => c.key === 'Revenue');
  assert.ok(revCol);
  assert.equal(revCol.type, 'numeric');
  assert.equal(revCol.min, 85000);
  assert.equal(revCol.max, 145000);

  const dateCol = columns.find((c) => c.key === 'Date');
  assert.ok(dateCol);
  assert.equal(dateCol.type, 'date');
});

test('calculateSummaryStatistics calculates accurate sum, avg, min, and max', () => {
  const stats = calculateSummaryStatistics(mockSalesData, 'Revenue');
  assert.ok(stats);
  assert.equal(stats.total, 685000);
  assert.equal(stats.count, 6);
  assert.equal(Math.round(stats.average), Math.round(685000 / 6));
  assert.equal(stats.min, 85000);
  assert.equal(stats.max, 145000);
  assert.equal(stats.trend, 'down'); // (120k+145k+95k)/3 = 120k vs (110k+85k+130k)/3 = 108.3k
});

test('applyFilters filters by categorical selections and search query', () => {
  // Filter by Region = 'North America'
  const filtered = applyFilters(mockSalesData, {
    searchQuery: '',
    categoricalFilters: { Region: ['North America'] },
    numericRanges: {},
  });
  assert.equal(filtered.length, 2);
  assert.ok(filtered.every((r) => r.Region === 'North America'));

  // Search query 'Europe'
  const searched = applyFilters(mockSalesData, {
    searchQuery: 'Europe',
    categoricalFilters: {},
    numericRanges: {},
  });
  assert.equal(searched.length, 2);
  assert.equal(searched[0].Region, 'Europe');

  // Numeric range filter
  const rangeFiltered = applyFilters(mockSalesData, {
    searchQuery: '',
    categoricalFilters: {},
    numericRanges: { Revenue: { min: 120000, max: 200000 } },
  });
  assert.equal(rangeFiltered.length, 3); // 120000, 145000, 130000
});

test('aggregateChartData aggregates sums and averages cleanly by dimension', () => {
  const agg = aggregateChartData(mockSalesData, 'Region', 'Revenue', 'sum', undefined, 10, 'desc');
  assert.equal(agg.labels.length, 3);
  assert.equal(agg.labels[0], 'North America'); // 120k + 145k = 265k (highest)
  assert.equal(agg.datasets[0].data[0], 265000);

  // Grouped aggregation by Quarter
  const groupedAgg = aggregateChartData(mockSalesData, 'Region', 'Revenue', 'sum', 'Quarter');
  assert.ok(groupedAgg.datasets.length >= 2);
  assert.ok(groupedAgg.datasets.some((d) => d.label === 'Q1'));
  assert.ok(groupedAgg.datasets.some((d) => d.label === 'Q2'));
});

test('generateAutoFiltersAndPresets generates meaningful presets', () => {
  const columns = detectColumnTypes(mockSalesData);
  const presets = generateAutoFiltersAndPresets(mockSalesData, columns);
  assert.ok(presets.length >= 2);
  assert.equal(presets[0].id, 'all');
  assert.ok(presets.some((p) => p.id === 'top-performers' || p.id === 'high-efficiency'));
});

test('generateExecutiveInsights creates structured narrative takeaways', () => {
  const columns = detectColumnTypes(mockSalesData);
  const insights = generateExecutiveInsights(mockSalesData, columns);
  assert.ok(insights.length >= 3);
  assert.ok(insights.some((i) => i.type === 'growth'));
  assert.ok(insights.some((i) => i.type === 'leader'));
});

test('formatNumber handles currency and large magnitudes cleanly', () => {
  assert.equal(formatNumber(1500000, 'Revenue'), '$1.50M');
  assert.equal(formatNumber(24500, 'Profit'), '$24.5k');
  assert.equal(formatNumber(32.5, 'Margin'), '32.5%');
});
