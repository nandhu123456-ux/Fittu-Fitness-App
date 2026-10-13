import { auth } from './firebase';
import type { FoodResult } from './foodSearch';

const VERCEL_URL = 'https://be-fit-api.nanda-dev.workers.dev/api/lookup-nutrition';

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

    const data = await res.json();
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