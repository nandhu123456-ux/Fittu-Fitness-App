import { collection, doc, getDocs, limit, orderBy, query, setDoc, Timestamp, where, increment } from 'firebase/firestore';
import { db } from './firebase';
import { shiftDate, todayLocalISO } from '../utils/streak';

export interface DailyActivity {
  id?: string;
  date: string;
  steps: number;
  activeKcal: number;
  extraKcal?: number;
  totalKcal: number;
  netCalories?: number;
  distanceKm: number;
  sleepMin: number;
  source: 'health_connect' | 'manual';
  updatedAt: Timestamp;
}

export interface ActivitySummary {
  steps: number;
  activeKcal: number;
  distanceKm: number;
}

// 1. ONLY updates Health Connect data (Steps, Active Kcal, Distance)
export async function addActivityEntry(uid: string, summary: ActivitySummary): Promise<void> {
  try {
    const date = todayLocalISO();
    const docRef = doc(db, 'activityLogs', uid, 'entries', date);
    
    // Notice: We do NOT write extraKcal or totalKcal here. 
    // This guarantees the HC sync can NEVER overwrite your manual extra calories.
    await setDoc(docRef, {
      date,
      steps: Math.round(summary.steps || 0),
      activeKcal: Math.round(summary.activeKcal || 0),
      distanceKm: Math.round(((summary.distanceKm || 0) + Number.EPSILON) * 10) / 10,
      source: 'health_connect',
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('[Firestore] Failed to sync activity:', error);
  }
}

// 2. ONLY updates the manual Extra Calories
export async function updateManualActiveCalories(uid: string, extraKcal: number): Promise<void> {
  try {
    const today = todayLocalISO();
    const docRef = doc(db, 'activityLogs', uid, 'entries', today);
    await setDoc(docRef, {
      extraKcal: Math.round(extraKcal),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('[Firestore] ❌ Failed to save manual burn:', error);
  }
}

// 3. Handles the math for Total Kcal and Net Calories
export async function updateTotalAndNetKcal(uid: string, totalKcal: number, netCalories: number): Promise<void> {
  try {
    const today = todayLocalISO();
    const docRef = doc(db, 'activityLogs', uid, 'entries', today);
    await setDoc(docRef, {
      totalKcal: Math.round(totalKcal),
      netCalories: Math.round(netCalories),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('[Firestore] ❌ Failed to save total/net calories:', error);
  }
}

export async function logManualSleep(uid: string, sleepMinutes: number): Promise<void> {
  try {
    const today = todayLocalISO();
    const docRef = doc(db, 'activityLogs', uid, 'entries', today);
    await setDoc(docRef, {
      date: today,
      sleepMin: increment(Math.round(sleepMinutes || 0)),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('[Firestore] ❌ Failed to log sleep:', error);
  }
}

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