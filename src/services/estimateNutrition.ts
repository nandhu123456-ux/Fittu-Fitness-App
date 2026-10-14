import { auth } from './firebase';
import type { FoodResult } from './foodSearch';

const ESTIMATE_URL = 'https://be-fit-api.nanda-dev.workers.dev/api/estimate-nutrition';

/**
 * Asks Gemini to estimate nutrition from just a food name (+ optional quantity).
 * Graceful fallback for Indian dishes that aren't in USDA/OFF/local data.
 * Returns null on any failure.
 */
export async function estimateNutritionFromName(name: string, quantity?: string): Promise<FoodResult | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    const idToken = await user.getIdToken();
    const res = await fetch(ESTIMATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ name, quantity }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.name || data.name === 'unknown') return null;
    return {
      id: `ai_${Date.now()}`,
      name: String(data.name),
      source: 'custom',
      serving: String(data.serving ?? '1 serving'),
      cal: Number(data.cal ?? 0),
      protein: Number(data.protein ?? 0),
      carbs: Number(data.carbs ?? 0),
      fat: Number(data.fat ?? 0),
    };
  } catch (e) {
    console.warn('[estimateNutrition] error', e);
    return null;
  }
}
