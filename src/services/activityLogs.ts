import { collection, doc, getDocs, limit, orderBy, query, setDoc, Timestamp, where } from 'firebase/firestore';

import { db } from './firebase';
import { shiftDate, todayLocalISO } from '../utils/streak';

export interface DailyActivity {
  date: string; // 'YYYY-MM-DD' local — same field name as food logs & weight logs
  steps: number;
  activeKcal: number;
  totalKcal: number;
  distanceKm: number;
  sleepMin: number;
  source: 'health_connect';
  updatedAt: Timestamp;
}

/** Raw numbers handed in by the Health Connect reader (useTodayHealth). */
export interface ActivitySummary {
  steps: number;
  activeKcal: number;
  totalKcal: number;
  distanceKm: number;
  sleepMin: number;
}

/**
 * Idempotent daily upsert. The same date is always overwritten (merge: true),
 * so a late-night re-sync never duplicates rows.
 */
export async function addActivityEntry(uid: string, summary: ActivitySummary): Promise<void> {
  const date = todayLocalISO();
  await setDoc(doc(db, 'activityLogs', uid, 'entries', date), {
    date,
    steps: Math.round(summary.steps),
    activeKcal: Math.round(summary.activeKcal),
    totalKcal: Math.round(summary.totalKcal),
    distanceKm: Math.round((summary.distanceKm + Number.EPSILON) * 10) / 10,
    sleepMin: Math.round(summary.sleepMin),
    source: 'health_connect',
    updatedAt: Timestamp.now(),
  }, { merge: true });
}

/**
 * Manually logs sleep duration by merging into today's activityLogs document.
 * Uses merge: true so it never overwrites other fields (steps, activeKcal, etc.).
 */
export async function logManualSleep(uid: string, sleepMinutes: number): Promise<void> {
  const today = todayLocalISO();
  const docRef = doc(db, 'activityLogs', uid, 'entries', today);
  await setDoc(docRef, {
    date: today,
    sleepMinutes: sleepMinutes,
  }, { merge: true });
}

/** Last N days, oldest → newest. Missing dates simply have no row (no fake zeros). */
export async function getRecentActivity(uid: string, count = 7): Promise<DailyActivity[]> {
  const since = shiftDate(todayLocalISO(), -(count - 1));
  const entries = await getDocs(
    query(
      collection(db, 'activityLogs', uid, 'entries'),
      where('date', '>=', since),
      orderBy('date', 'asc'),
      limit(count),
    ),
  );
  return entries.docs.map((snapshot) => {
    const data = snapshot.data() as DailyActivity;
    return { id: snapshot.id, ...data };
  }) as DailyActivity[];
}