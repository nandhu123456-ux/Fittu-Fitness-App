import {
  Env,
  verifyFirebaseToken,
  jsonResponse,
  errorResponse,
  extractAuthHeader,
} from './shared';

async function getCachedFood(env: Env, docId: string, idToken: string): Promise<any | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/cachedFoods/${docId}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const doc: any = await res.json();
  if (!doc.fields) return null;
  const f = doc.fields;
  return {
    id: f.id?.stringValue,
    name: f.name?.stringValue,
    source: f.source?.stringValue,
    serving: f.serving?.stringValue,
    cal: Number(f.cal?.integerValue ?? f.cal?.doubleValue ?? 0),
    protein: Number(f.protein?.doubleValue ?? 0),
    carbs: Number(f.carbs?.doubleValue ?? 0),
    fat: Number(f.fat?.doubleValue ?? 0),
  };
}

async function setCachedFood(env: Env, docId: string, food: any, idToken: string): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/cachedFoods/${docId}`;
  await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      fields: {
        id: { stringValue: food.id },
        name: { stringValue: food.name },
        source: { stringValue: food.source },
        serving: { stringValue: food.serving },
        cal: { integerValue: String(food.cal) },
        protein: { doubleValue: food.protein },
        carbs: { doubleValue: food.carbs },
        fat: { doubleValue: food.fat },
        cachedAt: { stringValue: new Date().toISOString() },
      },
    }),
  });
}

export async function handleLookupNutrition(request: Request, env: Env): Promise<Response> {
  try {
    const idToken = extractAuthHeader(request);
    if (!idToken) return errorResponse('Missing auth', 401);

    try {
      await verifyFirebaseToken(idToken, env);
    } catch {
      return errorResponse('Invalid auth', 401);
    }

    const body: any = await request.json();
    const { query } = body ?? {};

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return errorResponse('Query required', 400);
    }

    const trimmed = query.trim();
    const cacheId = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 100);

    const cached = await getCachedFood(env, cacheId, idToken);
    if (cached) return jsonResponse({ source: 'cache', food: cached });

    const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(trimmed)}&pageSize=1&api_key=${env.USDA_API_KEY}`;
    const usdaRes = await fetch(usdaUrl);
    if (!usdaRes.ok) return errorResponse('USDA API error', 502);

    const data: any = await usdaRes.json();
    const food = data?.foods?.[0];
    if (!food?.foodNutrients) return errorResponse('No nutrition data found', 404);

    const get = (id: number) =>
      food.foodNutrients.find((n: any) => n.nutrientId === id)?.value ?? 0;

    const result = {
      id: `usda_${food.fdcId}`,
      name: food.description ?? trimmed,
      source: 'usda',
      serving: '100g',
      cal: Math.round(get(1008)),
      protein: Math.round(get(1003) * 10) / 10,
      carbs: Math.round(get(1005) * 10) / 10,
      fat: Math.round(get(1004) * 10) / 10,
    };

    await setCachedFood(env, cacheId, result, idToken);
    return jsonResponse({ source: 'usda', food: result });
  } catch (error: any) {
    console.error('[handler] error:', error.message);
    return errorResponse('Internal error', 500);
  }
}