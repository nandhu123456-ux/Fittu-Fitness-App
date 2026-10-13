import { auth } from './firebase';
import type { FoodResult } from './foodSearch';

const VERCEL_URL = 'https://be-fit-nine.vercel.app/api/lookup-nutrition';

interface VercelPayload {
  food?: {
    id: string;
    name: string;
    serving: string;
    cal: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
}

export async function lookupViaVercel(query: string): Promise<FoodResult | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    const idToken = await user.getIdToken();
    const res = await fetch(VERCEL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as VercelPayload;
    if (!data.food) return null;
    return {
      id: data.food.id,
      name: data.food.name,
      source: 'usda',
      serving: data.food.serving,
      cal: data.food.cal,
      protein: data.food.protein,
      carbs: data.food.carbs,
      fat: data.food.fat,
    };
  } catch (e) {
    console.error('[vercelNutrition] error', e);
    return null;
  }
}
