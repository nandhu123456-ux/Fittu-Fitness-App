import {
  Env,
  verifyFirebaseToken,
  fetchWithRetry,
  jsonResponse,
  errorResponse,
  extractAuthHeader,
} from './shared';

const PROMPT = `You are a nutrition analyst. Identify the food in this photo and estimate its nutrition.

Rules:
- If you cannot identify any food, return null for name and confidence "low".
- Assume a typical single serving if portion is unclear.
- Round calories to whole numbers.
- Round macros to 1 decimal place.
- Be honest with confidence: "low" for unclear photos, "high" for obvious dishes.`;

export async function handleAnalyzeMeal(request: Request, env: Env): Promise<Response> {
  try {
    const idToken = extractAuthHeader(request);
    if (!idToken) return errorResponse('Missing auth', 401);

    try {
      await verifyFirebaseToken(idToken, env);
    } catch {
      return errorResponse('Invalid auth', 401);
    }

    const body: any = await request.json();
    const { imageBase64, mimeType } = body ?? {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return errorResponse('imageBase64 required', 400);
    }
    if (!mimeType || typeof mimeType !== 'string') {
      return errorResponse('mimeType required', 400);
    }
    if (imageBase64.length > 5_000_000) {
      return errorResponse('Image too large (max ~3.5MB)', 413);
    }

const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    const geminiRes = await fetchWithRetry(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', nullable: true },
              serving: { type: 'string' },
              cal: { type: 'number' },
              protein: { type: 'number' },
              carbs: { type: 'number' },
              fat: { type: 'number' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            },
            required: ['name', 'serving', 'cal', 'protein', 'carbs', 'fat', 'confidence'],
          },
          thinkingConfig: { thinkingLevel: 'minimal' },
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[gemini] error', geminiRes.status, errText);
      return errorResponse('Gemini API error', 502);
    }

    const geminiData: any = await geminiRes.json();
const parts = geminiData?.candidates?.[0]?.content?.parts ?? [];
const textResponse = parts
  .filter((p: any) => typeof p?.text === 'string' && p.text.length > 0 && !p.thought)
  .map((p: any) => p.text)
  .join('')
  .trim();
    if (!textResponse) return errorResponse('Gemini returned no content', 502);

    let parsed: any;
    try {
      parsed = JSON.parse(textResponse);
    } catch {
      console.error('[gemini] non-JSON:', textResponse.slice(0, 200));
      return errorResponse('Gemini returned invalid JSON', 502);
    }

    if (!parsed.name) {
      return jsonResponse({ error: 'Could not identify food in photo', food: parsed }, 422);
    }

    return jsonResponse({ food: parsed });
  } catch (error: any) {
    console.error('[handler] error:', error.message);
    return errorResponse('Internal error', 500);
  }
}