import {
  Env,
  verifyFirebaseToken,
  callGeminiWithFallback,
  jsonResponse,
  errorResponse,
  extractAuthHeader,
} from './shared';

const PROMPT = `You are a nutrition database. The user describes a food (and optionally a quantity). Estimate its nutrition for a typical Indian portion.

Rules:
- Use realistic Indian portion sizes if the user doesn't specify a quantity.
- If a quantity is given ("2 roti", "one bowl of dal"), scale the estimate accordingly and put the portion in "serving".
- Round calories to whole numbers, macros to 1 decimal place.
- If the input is not a food, return name "unknown" with zeros.`;

export async function handleEstimateNutrition(request: Request, env: Env): Promise<Response> {
  try {
    const idToken = extractAuthHeader(request);
    if (!idToken) return errorResponse('Missing auth', 401);
    try {
      await verifyFirebaseToken(idToken, env);
    } catch {
      return errorResponse('Invalid auth', 401);
    }

    const body: any = await request.json();
    const { name, quantity } = body ?? {};
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return errorResponse('name required', 400);
    }

    const userText = quantity ? `${name} — ${quantity}` : name;

    const { res: geminiRes, model: usedModel } = await callGeminiWithFallback(env, {
      contents: [{ parts: [{ text: `${PROMPT}\n\nFood: ${userText}` }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            serving: { type: 'string' },
            cal: { type: 'number' },
            protein: { type: 'number' },
            carbs: { type: 'number' },
            fat: { type: 'number' },
          },
          required: ['name', 'serving', 'cal', 'protein', 'carbs', 'fat'],
        },
        thinkingConfig: { thinkingLevel: 'minimal' },
      },
    });
    console.log('[gemini] using model:', usedModel);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[estimate] gemini error', geminiRes.status, errText);
      return errorResponse('Gemini API error', 502);
    }

    const geminiData: any = await geminiRes.json();
    const parts = geminiData?.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .filter((p: any) => typeof p?.text === 'string' && p.text.length > 0 && !p.thought)
      .map((p: any) => p.text)
      .join('')
      .trim();

    if (!text) {
      console.error('[estimate] empty text. finishReason:', geminiData?.candidates?.[0]?.finishReason);
      return errorResponse('Gemini returned no content', 502);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error('[estimate] non-JSON:', text.slice(0, 200));
      return errorResponse('Gemini returned invalid JSON', 502);
    }

    return jsonResponse({
      name: String(parsed.name ?? name),
      serving: String(parsed.serving ?? '1 serving'),
      cal: Number(parsed.cal ?? 0),
      protein: Number(parsed.protein ?? 0),
      carbs: Number(parsed.carbs ?? 0),
      fat: Number(parsed.fat ?? 0),
    });
  } catch (error: any) {
    console.error('[estimate] error:', error.message);
    return errorResponse('Internal error', 500);
  }
}
