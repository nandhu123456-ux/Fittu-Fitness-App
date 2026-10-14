import {
  Env,
  verifyFirebaseToken,
  callGeminiWithFallback,
  jsonResponse,
  errorResponse,
  extractAuthHeader,
} from './shared';

const PROMPT = `You are a nutrition coach helping a user order at a restaurant. Read this menu photo and cross-reference it against the user's remaining daily budget (provided below).

Return ONLY valid JSON in this exact shape:
{
  "menu_type": "brief description like 'North Indian restaurant' or 'South Indian tiffin'",
  "items": [
    {
      "name": "dish name as written on menu",
      "category": "best" | "moderate" | "skip",
      "reason": "short reason (max 12 words)",
      "cal": 520,
      "protein": 28,
      "carbs": 45,
      "fat": 18,
      "estimated_portion": "1 plate (~400g)"
    }
  ]
}

Classification rules:
- "best" = fits user's remaining budget per item (<= 30% of remaining kcal) AND protein >= 15g OR fiber/veg-forward
- "moderate" = fits but uses > 30% of remaining kcal, or is calorie-dense
- "skip" = would blow the budget (> 50% of remaining kcal) OR is deep-fried/very sugary
- Limit to the 8-15 most relevant dishes visible on the menu. Do NOT list every item.
- If the photo is unreadable or not a menu, return: {"menu_type": "unreadable", "items": []}`;

export async function handleMenuScan(request: Request, env: Env): Promise<Response> {
  try {
    const idToken = extractAuthHeader(request);
    if (!idToken) return errorResponse('Missing auth', 401);
    try {
      await verifyFirebaseToken(idToken, env);
    } catch {
      return errorResponse('Invalid auth', 401);
    }

    const body: any = await request.json();
    const { imageBase64, mimeType, remainingCal, targetProtein } = body ?? {};
    if (!imageBase64 || typeof imageBase64 !== 'string') return errorResponse('imageBase64 required', 400);
    if (!mimeType || typeof mimeType !== 'string') return errorResponse('mimeType required', 400);
    if (imageBase64.length > 5_000_000) return errorResponse('Image too large', 413);

    const contextPrompt = `${PROMPT}\n\nUser context: ${remainingCal ?? 'unknown'} kcal remaining, target ${targetProtein ?? 'unknown'}g protein.`;

    const { res: geminiRes, model: usedModel } = await callGeminiWithFallback(env, {
      contents: [{
        parts: [
          { text: contextPrompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 3000,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              menu_type: { type: 'string' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    category: { type: 'string', enum: ['best', 'moderate', 'skip'] },
                    reason: { type: 'string' },
                    cal: { type: 'number' },
                    protein: { type: 'number' },
                    carbs: { type: 'number' },
                    fat: { type: 'number' },
                    estimated_portion: { type: 'string' },
                  },
                  required: ['name', 'category', 'reason', 'cal', 'protein', 'carbs', 'fat', 'estimated_portion'],
                },
              },
            },
            required: ['menu_type', 'items'],
          },
          thinkingConfig: { thinkingLevel: 'minimal' },
        },
    });
    console.log('[gemini] using model:', usedModel);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[menu-scan] gemini error', geminiRes.status, errText);
      return errorResponse('Gemini API error', 502);
    }

    const geminiData: any = await geminiRes.json();
    const parts = geminiData?.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .filter((p: any) => typeof p?.text === 'string' && p.text.length > 0 && !p.thought)
      .map((p: any) => p.text)
      .join('')
      .trim();

    if (!text) return errorResponse('Gemini returned no content', 502);

    let parsed: any;
    try { parsed = JSON.parse(text); } catch {
      console.error('[menu-scan] non-JSON:', text.slice(0, 200));
      return errorResponse('Gemini returned invalid JSON', 502);
    }

    return jsonResponse({
      menu_type: String(parsed.menu_type ?? ''),
      items: Array.isArray(parsed.items) ? parsed.items : [],
    });
  } catch (error: any) {
    console.error('[menu-scan] error:', error.message);
    return errorResponse('Internal error', 500);
  }
}
