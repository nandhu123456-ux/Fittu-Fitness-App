import { collection, getDocs, query, where } from 'firebase/firestore';

import { db } from './firebase';

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface TodayTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  perMeal: Partial<Record<MealType, boolean>>;
}

const today = (): string => new Date().toISOString().slice(0, 10);

export async function getTodaysTotals(uid: string): Promise<TodayTotals> {
  const empty: TodayTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, perMeal: {} };
  try {
    const entries = await getDocs(query(collection(db, 'foodLogs', uid, 'entries'), where('date', '==', today())));
    return entries.docs.reduce<TodayTotals>((totals, entry) => {
      const data = entry.data();
      const mealType = data.mealType as MealType;
      return {
        calories: totals.calories + Number(data.totalCal ?? data.calories ?? data.cal ?? 0),
        protein: totals.protein + Number(data.totalP ?? data.protein ?? 0),
        carbs: totals.carbs + Number(data.totalC ?? data.carbs ?? 0),
        fat: totals.fat + Number(data.totalF ?? data.fat ?? 0),
        perMeal: mealType ? { ...totals.perMeal, [mealType]: true } : totals.perMeal,
      };
    }, empty);
  } catch {
    return empty;
  }
}
