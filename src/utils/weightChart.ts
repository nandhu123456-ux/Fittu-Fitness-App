import type { WeightEntry } from '../services/weightLogs';

export interface ChartPoint { x: number; y: number; }

export interface WeightChartPaths {
  linePath: string;
  areaPath: string;
  points: ChartPoint[];
}

export function createWeightChartPaths(entries: WeightEntry[], width: number, height = 140): WeightChartPaths {
  const padding = 10;
  const values = [...entries].reverse().map((entry) => entry.weight);
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const graphHeight = height - padding * 2;
  const points = values.map((value, index) => ({
    x: padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2),
    y: height - padding - ((value - min) / span) * graphHeight,
  }));
  const linePath = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    return `${path} Q ${(previous.x + point.x) / 2} ${previous.y}, ${point.x} ${point.y}`;
  }, '');
  const first = points[0];
  const last = points[points.length - 1];
  return { linePath, areaPath: `${linePath} L ${last.x} ${height - padding} L ${first.x} ${height - padding} Z`, points };
}
