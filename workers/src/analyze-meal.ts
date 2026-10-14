import {
  Env,
  verifyFirebaseToken,
  callGeminiWithFallback,
  jsonResponse,
  errorResponse,
  extractAuthHeader,
} from './shared';

const PROMPT = `You are a nutrition analyst. Identify ALL food items visible in this photo.
- Return each dish/item on the plate as a SEPARATE item. If a plate contains multiple dishes, list them separately.
- If you cannot identify anything, return {items: []}.
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

    const { res: geminiRes, model: usedModel } = await callGeminiWithFallback(env, {
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
            items: {
              type: 'array',
              items: {
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
            },
          },
          required: ['items'],
        },
        thinkingConfig: { thinkingLevel: 'minimal' },
      },
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
    if (!textResponse) {
      console.error('[gemini] empty text. finishReason:', geminiData?.candidates?.[0]?.finishReason);
      console.error('[gemini] parts:', JSON.stringify(geminiData?.candidates?.[0]?.content?.parts));
      return errorResponse('Gemini returned no content', 502);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(textResponse);
    } catch {
      console.error('[gemini] non-JSON:', textResponse.slice(0, 200));
      return errorResponse('Gemini returned invalid JSON', 502);
    }

    const items = Array.isArray(parsed.items) ? parsed.items : [];
    return jsonResponse({ items });
  } catch (error: any) {
    console.error('[handler] error:', error.message);
    return errorResponse('Internal error', 500);
  }
}