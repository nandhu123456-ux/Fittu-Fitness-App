import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';

import { db } from './firebase';
import type { FoodResult } from './foodSearch';

export interface CustomFoodDraft {
  name: string;
  serving: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Persists a user's custom food to `customFoods/{uid}/foods`. The generated doc
 * id becomes the FoodResult id so the entry round-trips through search + logging.
 */
export async function addCustomFood(uid: string, draft: CustomFoodDraft): Promise<FoodResult> {
  const ref = await addDoc(collection(db, 'customFoods', uid, 'foods'), {
    name: draft.name.trim(),
    serving: draft.serving.trim(),
    cal: draft.cal,
    protein: draft.protein,
    carbs: draft.carbs,
    fat: draft.fat,
    source: 'custom',
    createdAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    name: draft.name.trim(),
    source: 'custom',
    serving: draft.serving.trim() || '1 serving',
    cal: draft.cal,
    protein: draft.protein,
    carbs: draft.carbs,
    fat: draft.fat,
  };
}

/**
 * Loads the user's saved custom foods, newest first. Swallows errors and returns
 * an empty list so a custom-foods read never breaks the search chain.
 */
export async function getCustomFoods(uid: string): Promise<FoodResult[]> {
  try {
    const snapshots = await getDocs(query(collection(db, 'customFoods', uid, 'foods'), orderBy('createdAt', 'desc')));
    return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data(), source: 'custom' } as FoodResult));
  } catch {
    return [];
  }
}
