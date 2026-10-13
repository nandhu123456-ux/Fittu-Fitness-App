import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const FIRESTORE_PROJECT = process.env.FIREBASE_PROJECT_ID;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents`;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_KEY}`;
async function verifyFirebaseToken(idToken: string): Promise<string> {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${FIRESTORE_PROJECT}`,
    audience: FIRESTORE_PROJECT,
  });
  if (!payload.sub) throw new Error('No subject in token');
  return payload.sub as string;
}

async function fetchFirestoreDoc(path: string, idToken: string): Promise<any | null> {
  const url = `${FIRESTORE_BASE}/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error('[firestore] read failed', path, res.status);
    return null;
  }
  const doc = await res.json();
  return doc.fields ?? null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth' });

    const idToken = authHeader.split(' ')[1];
    let uid: string;
    try {
      uid = await verifyFirebaseToken(idToken);
    } catch (e) {
      console.error('[auth] failed:', e);
      return res.status(401).json({ error: 'Invalid auth' });
    }

    const { message, history } = req.body ?? {};
    if (!message || typeof message !== 'string' || message.trim().length < 1) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Fetch user profile
    const userDoc = await fetchFirestoreDoc(`users/${uid}`, idToken);
    const targets = userDoc?.targets?.mapValue?.fields;
    const goal = userDoc?.goal?.mapValue?.fields;
    const profile = userDoc?.profile?.mapValue?.fields;

    const targetCal = targets?.calories?.integerValue ?? '—';
    const targetProtein = targets?.protein?.integerValue ?? '—';
    const goalType = goal?.type?.stringValue ?? 'maintain';
    const userName = userDoc?.displayName?.stringValue ?? 'there';

    // Fetch today's food logs
    const today = new Date().toISOString().slice(0, 10);
    const logsRes = await fetch(
      `${FIRESTORE_BASE}/foodLogs/${uid}/entries?pageSize=50`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
    let todayTotals = { cal: 0, protein: 0, carbs: 0, fat: 0 };
    let mealSummary = 'No meals logged today';

    if (logsRes.ok) {
      const logsData = await logsRes.json();
      const docs = logsData.documents ?? [];
      const todayEntries = docs.filter((d: any) => {
        const dateField = d.fields?.date?.stringValue;
        return dateField === today;
      });
      if (todayEntries.length > 0) {
        for (const entry of todayEntries) {
          todayTotals.cal += Number(entry.fields?.cal?.integerValue ?? 0);
          todayTotals.protein += Number(entry.fields?.protein?.doubleValue ?? 0);
          todayTotals.carbs += Number(entry.fields?.carbs?.doubleValue ?? 0);
          todayTotals.fat += Number(entry.fields?.fat?.doubleValue ?? 0);
        }
        mealSummary = todayEntries
          .map((e: any) => `${e.fields?.mealType?.stringValue ?? 'meal'}: ${e.fields?.name?.stringValue ?? 'food'} (${e.fields?.cal?.integerValue ?? 0} kcal)`)
          .join('; ');
      }
    }

    const systemPrompt = `You are a supportive, practical nutrition coach for ${userName}, who is using a weight loss app.

User context:
- Goal: ${goalType} weight
- Daily calorie target: ${targetCal} kcal
- Daily protein target: ${targetProtein}g
- Today's intake: ${Math.round(todayTotals.cal)} kcal, ${Math.round(todayTotals.protein)}g protein, ${Math.round(todayTotals.carbs)}g carbs, ${Math.round(todayTotals.fat)}g fat
- Today's meals: ${mealSummary}

Instructions:
- Be warm, concise, and specific. Max 3 sentences per reply.
- Use the context above to give personalized advice when relevant.
- Never shame the user. Frame slip-ups as learning.
- If asked about food logging, keep it practical (portion sizes, meal timing).
- If asked for medical advice, redirect to a professional.
- Don't repeat the user's numbers back unless they ask.`;

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        if (msg.role && msg.content) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(msg.content) }],
          });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[gemini] error', geminiRes.status, errText);
      return res.status(502).json({ error: 'Gemini API error' });
    }

    const geminiData = await geminiRes.json();
    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(502).json({ error: 'Gemini returned no content' });
    }

    return res.status(200).json({ reply: reply.trim() });
  } catch (error: any) {
    console.error('[handler] error:', error.message);
    return res.status(500).json({ error: 'Internal error', message: error.message });
  }
}