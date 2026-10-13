import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const FIRESTORE_PROJECT = process.env.FIREBASE_PROJECT_ID;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents`;

async function verifyFirebaseToken(idToken: string): Promise<string> {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${FIRESTORE_PROJECT}`,
    audience: FIRESTORE_PROJECT,
  });
  if (!payload.sub) throw new Error('No subject in token');
  return payload.sub as string;
}

async function getCachedFood(docId: string, idToken: string): Promise<any | null> {
  const url = `${FIRESTORE_BASE}/cachedFoods/${docId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore read error: ${res.status}`);
  const doc = await res.json();
  if (!doc.fields) return null;
  const f = doc.fields;
  return {
    id: f.id?.stringValue,
    name: f.name?.stringValue,
    source: f.source?.stringValue,
    serving: f.serving?.stringValue,
    cal: Number(f.cal?.integerValue ?? f.cal?.doubleValue ?? 0),
    protein: Number(f.protein?.doubleValue ?? f.protein?.integerValue ?? 0),
    carbs: Number(f.carbs?.doubleValue ?? f.carbs?.integerValue ?? 0),
    fat: Number(f.fat?.doubleValue ?? f.fat?.integerValue ?? 0),
  };
}

async function setCachedFood(docId: string, food: any, idToken: string): Promise<void> {
  const url = `${FIRESTORE_BASE}/cachedFoods/${docId}`;
  const body = {
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
  };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error('[firestore write] failed', await res.text());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth' });

    const idToken = authHeader.split(' ')[1];
    try {
      await verifyFirebaseToken(idToken);
    } catch (e) {
      console.error('[auth] failed:', e);
      return res.status(401).json({ error: 'Invalid auth' });
    }

    const { query } = req.body ?? {};
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({ error: 'Query required' });
    }
    const trimmed = query.trim();

    const cacheId = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 100);

    const cached = await getCachedFood(cacheId, idToken);
    if (cached) return res.status(200).json({ source: 'cache', food: cached });

    const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(trimmed)}&pageSize=1&api_key=${process.env.USDA_API_KEY}`;
    const usdaRes = await fetch(usdaUrl);
    if (!usdaRes.ok) return res.status(502).json({ error: 'USDA API error' });

    const data = await usdaRes.json();
    const food = data?.foods?.[0];
    if (!food?.foodNutrients) return res.status(404).json({ error: 'No nutrition data found' });

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

    await setCachedFood(cacheId, result, idToken);
    return res.status(200).json({ source: 'usda', food: result });
  } catch (error: any) {
    console.error('[handler] error:', error.message);
    return res.status(500).json({ error: 'Internal error', message: error.message });
  }
}