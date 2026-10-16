import { useEffect, useMemo, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';

import { db } from '../services/firebase';
import { shiftDate, todayLocalISO } from '../utils/streak';
import type { FoodLogEntry } from '../services/foodLogService';
import type { MealType, TodayTotals } from '../services/foodLogs';
import type { WeightEntry } from '../services/weightLogs';
import type { User } from '../types/user';
import { useAuthStore } from '../store/authStore';

export interface PerMealSummary {
  cal: number;
  count: number;
}

/** Which meals have at least one entry — consumed by the dashboard CTA logic. */
export type PerMealFlags = Partial<Record<MealType, boolean>>;

const emptyTotals: TodayTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, perMeal: {} };

/**
 * Live view of today's food logs.
 *
 * Returns { entries, totals, perMeal, perMealFlags, loading, error }:
 * - `totals` uses the shared TodayTotals shape so the dashboard CTA logic and
 *   the macro rings read exactly the same numbers.
 * - `perMeal` sums calories/entry counts per meal (for TodaysMealsCard).
 * - `perMealFlags` marks which meals have >= 1 entry (for getCta).
 */
export function useTodayFoodLogs(uid: string | undefined) {
  const [rows, setRows] = useState<{ id: string; data: Record<string, unknown> }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setRows([]);
      setLoading(false);
      return;
    }
    const today = todayLocalISO();
    const q = query(collection(db, 'foodLogs', uid, 'entries'), where('date', '==', today));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRows(snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('[useTodayFoodLogs]', err.message);
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [uid]);

  const entries = useMemo<FoodLogEntry[]>(
    () =>
      rows.map(({ id, data }) => ({
        id,
        date: String(data.date ?? ''),
        mealType: (data.mealType as MealType) ?? 'snack',
        foodId: String(data.foodId ?? ''),
        name: String(data.name ?? ''),
        source: (data.source as FoodLogEntry['source']) ?? 'usda',
        servings: Number(data.servings ?? 1),
        cal: Number(data.cal ?? 0),
        protein: Number(data.protein ?? 0),
        carbs: Number(data.carbs ?? 0),
        fat: Number(data.fat ?? 0),
        ...(data.portionGrams !== undefined ? { portionGrams: Number(data.portionGrams) } : {}),
      })),
    [rows],
  );

  // Mirrors getTodaysTotals exactly, including its legacy field fallbacks, so
  // the real-time path and the legacy fetch path agree on the same documents.
  const totals = useMemo<TodayTotals>(
    () =>
      rows.reduce<TodayTotals>((acc, { data }) => {
        const mealType = data.mealType as MealType | undefined;
        return {
          calories: acc.calories + Number(data.totalCal ?? data.calories ?? data.cal ?? 0),
          protein: acc.protein + Number(data.totalP ?? data.protein ?? 0),
          carbs: acc.carbs + Number(data.totalC ?? data.carbs ?? 0),
          fat: acc.fat + Number(data.totalF ?? data.fat ?? 0),
          perMeal: mealType ? { ...acc.perMeal, [mealType]: true } : acc.perMeal,
        };
      }, emptyTotals),
    [rows],
  );

  const perMeal = useMemo<Record<string, PerMealSummary>>(() => {
    const map: Record<string, PerMealSummary> = {};
    for (const entry of entries) {
      const key = entry.mealType ?? 'snack';
      if (!map[key]) map[key] = { cal: 0, count: 0 };
      map[key].cal += entry.cal;
      map[key].count += 1;
    }
    return map;
  }, [entries]);

  const perMealFlags = useMemo<PerMealFlags>(() => ({ ...totals.perMeal }), [totals]);

  return { entries, totals, perMeal, perMealFlags, loading, error };
}

/**
 * Live view of today's water total. Water is a single doc per day keyed by the
 * local date, so this listens to that exact document rather than querying the
 * collection (no index needed, and it survives the `increment` write shape).
 */
export function useTodayWater(uid: string | undefined) {
  const [ml, setMl] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setMl(0);
      setLoading(false);
      return;
    }
    const today = todayLocalISO();
    const unsub = onSnapshot(
      doc(db, 'waterLogs', uid, 'entries', today),
      (snap) => {
        setMl(Number(snap.data()?.ml ?? 0));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('[useTodayWater]', err.message);
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [uid]);

  return { ml, loading, error };
}

/**
 * Live view of today's mood. Same storage model as water — a single doc per day
 * keyed by the local date — so this listens to that document directly.
 */
export function useTodayMood(uid: string | undefined) {
  const [mood, setMoodValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setMoodValue(null);
      setLoading(false);
      return;
    }
    const today = todayLocalISO();
    const unsub = onSnapshot(
      doc(db, 'moodLogs', uid, 'entries', today),
      (snap) => {
        const value = snap.data()?.mood;
        setMoodValue(typeof value === 'string' ? value : null);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('[useTodayMood]', err.message);
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [uid]);

  return { mood, loading, error };
}

/** Live view of the most recent weight entries, newest first. */
export function useRecentWeights(uid: string | undefined, count = 30) {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setEntries([]);
      setLoading(false);
      return;
    }
    // Single-field orderBy only — served by Firestore's automatic index, same
    // shape as the legacy getRecentWeights query it replaces.
    const q = query(collection(db, 'weightLogs', uid, 'entries'), orderBy('date', 'desc'), limit(count));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              date: String(data.date),
              weight: Number(data.weight),
              note: typeof data.note === 'string' ? data.note : undefined,
            };
          }),
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('[useRecentWeights]', err.message);
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [uid, count]);

  return { entries, loading, error };
}

/**
 * Live view of users/{uid}, also pushed into the auth store so every screen
 * that reads `profile` stays current without its own fetch.
 *
 * The JSON guard prevents redundant store writes (and the re-render loop that
 * would follow) when a snapshot fires but the document contents are unchanged —
 * for example when refreshStreak re-writes the same streakDays value.
 */
export function useUserDoc(uid: string | undefined) {
  const [profile, setDocProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setDocProfile(null);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        const next: User | null = snap.exists() ? (snap.data() as User) : null;
        setDocProfile(next);
        const serializedNext = JSON.stringify(next);
        if (JSON.stringify(useAuthStore.getState().profile) !== serializedNext) {
          useAuthStore.getState().setProfile(next);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('[useUserDoc]', err.message);
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [uid]);

  return { profile, loading, error };
}

/**
 * Live view of the last 7 days of food logs, aggregated by date.
 * Returns { days, loading } where `days` is always 7 entries (oldest → newest)
 * with summed calories/protein/carbs/fat per day.
 */
export function useLast7DaysFoodLogs(uid: string | undefined) {
  const [days, setDays] = useState<Array<{ date: string; cal: number; protein: number; carbs: number; fat: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setDays([]); setLoading(false); return; }
    const since = shiftDate(todayLocalISO(), -6);
    const q = query(
      collection(db, 'foodLogs', uid, 'entries'),
      where('date', '>=', since)
    );
    const unsub = onSnapshot(q, (snap) => {
      const map: Record<string, { cal: number; protein: number; carbs: number; fat: number }> = {};
      for (const docSnap of snap.docs) {
        const d = docSnap.data();
        const date = String(d.date ?? '');
        if (!date) continue;
        if (!map[date]) map[date] = { cal: 0, protein: 0, carbs: 0, fat: 0 };
        map[date].cal += Number(d.cal ?? 0);
        map[date].protein += Number(d.protein ?? 0);
        map[date].carbs += Number(d.carbs ?? 0);
        map[date].fat += Number(d.fat ?? 0);
      }
      const result: Array<{ date: string; cal: number; protein: number; carbs: number; fat: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = shiftDate(todayLocalISO(), -i);
        result.push({ date, ...(map[date] ?? { cal: 0, protein: 0, carbs: 0, fat: 0 }) });
      }
      setDays(result);
      setLoading(false);
    }, (err) => {
      console.warn('[useLast7DaysFoodLogs]', err.message);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  return { days, loading };
}
