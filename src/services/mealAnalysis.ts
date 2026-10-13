import { auth } from './firebase';
import type { FoodResult } from './foodSearch';

const ANALYZE_URL = 'https://be-fit-api.nanda-dev.workers.dev/api/analyze-meal';

interface AnalyzePayload {
  food?: {
    name: string;
    serving: string;
    cal: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
}

export async function analyzeMealPhoto(base64: string, mimeType: string): Promise<FoodResult | null> {
  if (base64.length > 3_000_000) {
    throw new Error('Photo too large. Please try a different image or crop it first.');
  }
  try {
    const user = auth.currentUser;
    if (!user || !base64) return null;
    const idToken = await user.getIdToken();
    const res = await fetch(ANALYZE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AnalyzePayload;
    if (!data.food) return null;
    return {
      id: `photo_${Date.now()}`,
      name: data.food.name,
      source: 'usda',
      serving: data.food.serving,
      cal: data.food.cal,
      protein: data.food.protein,
      carbs: data.food.carbs,
      fat: data.food.fat,
    };
  } catch (e) {
    console.error('[mealAnalysis] error', e);
    return null;
  }
}
