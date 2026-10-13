import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const FIRESTORE_PROJECT = process.env.FIREBASE_PROJECT_ID;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents`;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

async function verifyFirebaseToken(idToken: string): Promise<string> {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${FIRESTORE_PROJECT}`,
    audience: FIRESTORE_PROJECT,
  });
  if (!payload.sub) throw new Error('No subject in token');
  return payload.sub as string;
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

    const { imageBase64, mimeType } = req.body ?? {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'imageBase64 required' });
    }
    if (!mimeType || typeof mimeType !== 'string') {
      return res.status(400).json({ error: 'mimeType required (e.g. image/jpeg)' });
    }
    if (imageBase64.length > 5_000_000) {
      return res.status(413).json({ error: 'Image too large (max ~3.5MB)' });
    }

    const prompt = `You are a nutrition analyst. Identify the food in this photo and estimate its nutrition.

Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "name": "dish name (e.g. 'Chicken Biryani')",
  "serving": "estimated portion (e.g. '1 plate ~400g')",
  "cal": 520,
  "protein": 28,
  "carbs": 55,
  "fat": 18,
  "confidence": "high" | "medium" | "low"
}

Rules:
- If you cannot identify any food, return: {"name": null, "confidence": "low"}
- Assume a typical single serving if portion is unclear
- Round calories to whole numbers
- Round macros to 1 decimal place
- Be honest with confidence: "low" for unclear photos, "high" for obvious dishes`;

    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[gemini] error', geminiRes.status, errText);
      return res.status(502).json({ error: 'Gemini API error', status: geminiRes.status });
    }

    const geminiData = await geminiRes.json();
    const textResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return res.status(502).json({ error: 'Gemini returned no content' });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(textResponse);
    } catch {
      console.error('[gemini] non-JSON response:', textResponse);
      return res.status(502).json({ error: 'Gemini returned invalid JSON' });
    }

    if (!parsed.name) {
      return res.status(422).json({ error: 'Could not identify food in photo', food: parsed });
    }

    return res.status(200).json({ food: parsed });
  } catch (error: any) {
    console.error('[handler] error:', error.message);
    return res.status(500).json({ error: 'Internal error', message: error.message });
  }
}