import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface Env {
  FIREBASE_PROJECT_ID: string;
  GEMINI_API_KEY: string;
  USDA_API_KEY: string;
}

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export async function verifyFirebaseToken(idToken: string, env: Env): Promise<string> {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
    audience: env.FIREBASE_PROJECT_ID,
  });
  if (!payload.sub) throw new Error('No subject in token');
  return payload.sub;
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status !== 503 && res.status !== 429) return res;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
    await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
  }
  if (lastError) throw lastError;
  throw new Error('Max retries exceeded');
}

const MODEL_CHAIN = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest',
];

/**
 * Calls Gemini, falling back across a model chain when a model is overloaded
 * (503) or rate-limited (429). Each model is attempted up to 2 times with a
 * short backoff before moving to the next. Non-transient errors (400/401/etc.)
 * return immediately so we don't mask real problems.
 */
export async function callGeminiWithFallback(
  env: Env,
  body: object
): Promise<{ res: Response; model: string }> {
  let lastError = 'no model attempted';

  for (const model of MODEL_CHAIN) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    // Up to 2 attempts per model: 1s then 2s backoff between them.
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * attempt));
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) return { res, model };

        // Only fall through on transient 503/429; otherwise surface the error.
        if (res.status !== 503 && res.status !== 429) return { res, model };

        lastError = `${model}: ${res.status}`;
        const errBody = await res.clone().text();
        console.warn(`[gemini-fallback] ${model} returned ${res.status}: ${errBody.slice(0, 200)}`);
      } catch (e) {
        lastError = `${model}: ${e instanceof Error ? e.message : String(e)}`;
        console.warn(`[gemini-fallback] ${model} threw (attempt ${attempt + 1})`, lastError);
      }
    }
  }

  // All models exhausted — synthetic 503.
  return {
    res: new Response(
      JSON.stringify({ error: 'All Gemini models overloaded', detail: lastError }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    ),
    model: 'none',
  };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

export async function fetchFirestoreDoc(
  env: Env,
  path: string,
  idToken: string
): Promise<any | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const doc = await res.json();
  return doc.fields ?? null;
}

export function extractAuthHeader(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}