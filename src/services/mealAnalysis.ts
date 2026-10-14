import { auth } from './firebase';
import type { FoodResult } from './foodSearch';

const ANALYZE_URL = 'https://be-fit-api.nanda-dev.workers.dev/api/analyze-meal';

interface AnalyzedItem {
  name: string;
  serving: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface AnalyzePayload {
  items?: AnalyzedItem[];
}

/**
 * Analyzes a meal photo and returns a list of detected food items.
 * Returns an empty array if nothing could be identified.
 */
export async function analyzeMealPhoto(base64: string, mimeType: string): Promise<FoodResult[]> {
  if (base64.length > 3_000_000) {
    throw new Error('Photo too large. Please try a different image or crop it first.');
  }
  try {
    const user = auth.currentUser;
    if (!user || !base64) return [];
    const idToken = await user.getIdToken();
    const res = await fetch(ANALYZE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as AnalyzePayload;
    if (!data.items || !Array.isArray(data.items)) return [];
    const stamp = Date.now();
    return data.items
      .filter((item) => item && item.name)
      .map((item, index) => ({
        id: `photo_${stamp}_${index}`,
        name: item.name,
        source: 'usda' as const,
        serving: item.serving,
        cal: item.cal,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      }));
  } catch (e) {
    console.error('[mealAnalysis] error', e);
    return [];
  }
}
