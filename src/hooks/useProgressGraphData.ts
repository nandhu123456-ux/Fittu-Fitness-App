import { useMemo } from 'react';

import { useActivityHistory } from './useRealtime';
import { shiftDate, todayLocalISO } from '../utils/streak';

export interface GraphPoint {
  label: string; // weekday short name, e.g. 'Mon'
  value: number;
}

export interface ProgressGraphData {
  steps: GraphPoint[];
  sleep: GraphPoint[];
  calories: GraphPoint[];
  loading: boolean;
}

/**
 * Structural shape of a raw `activityLogs/{uid}/entries` document.
 * The documents can carry fields that are not part of `DailyActivity`
 * (e.g. `sleepMinutes` written by the manual sleep log), so the rows are
 * read defensively through this type instead of assuming the interface.
 */
interface RawActivityRow {
  date?: string;
  steps?: number;
  activeKcal?: number;
  totalKcal?: number;
  sleepMin?: number;
  sleepMinutes?: number;
}

/** Returns the number when it is a finite value, otherwise `undefined`. */
function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Coerces an optional number into a finite number (defaults to 0). */
function finiteNumber(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) ? value : 0;
}

/** Reads a raw activity document defensively, without relying on `any`. */
function toRawRow(entry: unknown): RawActivityRow {
  if (typeof entry !== 'object' || entry === null) return {};
  const row = entry as Record<string, unknown>;
  return {
    date: typeof row.date === 'string' ? row.date : undefined,
    steps: optionalNumber(row.steps),
    activeKcal: optionalNumber(row.activeKcal),
    totalKcal: optionalNumber(row.totalKcal),
    sleepMin: optionalNumber(row.sleepMin),
    sleepMinutes: optionalNumber(row.sleepMinutes),
  };
}

/**
 * Live graph series (steps / sleep / calories) for the last `days` days,
 * ending today (local date) and oldest → newest.
 *
 * `useActivityHistory` returns a sparse list (only dates that actually have a
 * Firestore document), so this hook re-expands it into a continuous series:
 * days without a document become 0 so the chart keeps a fixed x-axis.
 */
export function useProgressGraphData(uid: string | undefined, days = 7): ProgressGraphData {
  const { days: activityDays, loading } = useActivityHistory(uid);

  const points = useMemo(() => {
    const byDate = new Map<string, RawActivityRow>();
    for (const entry of activityDays) {
      const row = toRawRow(entry);
      if (row.date) byDate.set(row.date, row);
    }

    const today = todayLocalISO();
    const span = Number.isFinite(days) && days > 0 ? Math.floor(days) : 0;
    const steps: GraphPoint[] = [];
    const sleep: GraphPoint[] = [];
    const calories: GraphPoint[] = [];

    for (let i = span - 1; i >= 0; i--) {
      const date = shiftDate(today, -i);
      const label = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
      const row = byDate.get(date);
      steps.push({ label, value: finiteNumber(row?.steps) });
      sleep.push({ label, value: finiteNumber(row?.sleepMin ?? row?.sleepMinutes) });
      calories.push({ label, value: finiteNumber(row?.activeKcal ?? row?.totalKcal) });
    }

    return { steps, sleep, calories };
  }, [activityDays, days]);

  return useMemo(() => ({ ...points, loading }), [points, loading]);
}
