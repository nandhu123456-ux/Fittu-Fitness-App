import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';

import type { FoodResult } from './foodSearch';
import type { MealType } from './foodLogs';
import { db } from './firebase';
import { refreshStreak } from './streakService';

export interface FoodLogEntry {
  id: string;
  date: string;
  mealType: MealType;
  foodId: string;
  name: string;
  source: FoodResult['source'];
  servings: number;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  portionGrams?: number;
}

const today = (): string => new Date().toISOString().slice(0, 10);
const rounded = (value: number): number => Math.round(value * 10) / 10;

export async function addFoodLog(uid: string, input: { mealType: MealType; food: FoodResult; servings: number; portionGrams?: number }): Promise<void> {
  const { food, servings } = input;
  await addDoc(collection(db, 'foodLogs', uid, 'entries'), {
    date: today(), mealType: input.mealType, foodId: food.id, name: food.name, source: food.source, servings,
    cal: rounded(food.cal * servings), protein: rounded(food.protein * servings), carbs: rounded(food.carbs * servings), fat: rounded(food.fat * servings),
    ...(input.portionGrams ? { portionGrams: input.portionGrams } : {}), createdAt: serverTimestamp(),
  });
  // Non-critical: recompute the streak after the write. Fire-and-forget — a
  // streak failure must never break (or delay) the food log write.
  refreshStreak(uid).catch(() => {});
  // Non-critical: record this food in the user's recents for fast re-logging.
  import('./recentFoods')
    .then(({ recordRecentFood }) => recordRecentFood(uid, food))
    .catch(() => {});
}

export async function getTodayEntries(uid: string): Promise<FoodLogEntry[]> {
  try {
    const snapshots = await getDocs(query(collection(db, 'foodLogs', uid, 'entries'), where('date', '==', today())));
    return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() } as FoodLogEntry));
  } catch {
    return [];
  }
}

export async function getEntriesForDate(uid: string, date: string): Promise<FoodLogEntry[]> {
  try {
    const snapshots = await getDocs(query(collection(db, 'foodLogs', uid, 'entries'), where('date', '==', date)));
    return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() } as FoodLogEntry));
  } catch {
    return [];
  }
}
