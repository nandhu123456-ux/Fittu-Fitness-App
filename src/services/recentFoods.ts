import { collection, doc, getDocs, increment, limit, orderBy, query, setDoc, Timestamp } from 'firebase/firestore';

import { db } from './firebase';
import type { FoodResult } from './foodSearch';

export interface RecentFood extends FoodResult {
  lastLoggedAt: Timestamp;
  logCount: number;
}

const MAX_RECENTS = 20;

/** Read the user's most recently logged foods, ranked by recency. */
export async function getRecentFoods(uid: string): Promise<RecentFood[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'recentFoods', uid, 'foods'),
        orderBy('lastLoggedAt', 'desc'),
        limit(MAX_RECENTS)
      )
    );
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: String(data.name ?? ''),
        source: 'custom' as const,
        serving: String(data.serving ?? '1 serving'),
        cal: Number(data.cal ?? 0),
        protein: Number(data.protein ?? 0),
        carbs: Number(data.carbs ?? 0),
        fat: Number(data.fat ?? 0),
        lastLoggedAt: data.lastLoggedAt as Timestamp,
        logCount: Number(data.logCount ?? 1),
      };
    });
  } catch (e) {
    console.warn('[recentFoods] read failed', e);
    return [];
  }
}

/** Upsert a food into the recents list. Called after every successful log. */
export async function recordRecentFood(uid: string, food: FoodResult): Promise<void> {
  try {
    const ref = doc(db, 'recentFoods', uid, 'foods', food.id);
    // merge + increment keeps an accurate logCount without a read transaction.
    await setDoc(
      ref,
      {
        name: food.name,
        serving: food.serving,
        cal: food.cal,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        lastLoggedAt: Timestamp.now(),
        logCount: increment(1),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('[recentFoods] write failed', e);
  }
}
