import {
  Env,
  verifyFirebaseToken,
  callGeminiWithFallback,
  jsonResponse,
  errorResponse,
  extractAuthHeader,
} from './shared';

const PROMPT = `You are a nutrition parser. The user spoke a food description out loud. Extract the food name and estimate its nutrition.

Rules:
- Interpret natural spoken phrases like "two rotis and a bowl of dal" or "one chicken biryani".
- If multiple foods are spoken, pick the single most prominent food and note the quantity in the serving.
- If you cannot understand the audio, return null for name and confidence "low".
- Round calories to whole numbers.
- Round macros to 1 decimal place.`;

export async function handleParseVoice(request: Request, env: Env): Promise<Response> {
  try {
    const idToken = extractAuthHeader(request);
    if (!idToken) return errorResponse('Missing auth', 401);

    try {
      await verifyFirebaseToken(idToken, env);
    } catch {
      return errorResponse('Invalid auth', 401);
    }

    const body: any = await request.json();
    const { audioBase64, mimeType } = body ?? {};

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return errorResponse('audioBase64 required', 400);
    }
    if (!mimeType || typeof mimeType !== 'string') {
      return errorResponse('mimeType required', 400);
    }
    if (audioBase64.length > 8_000_000) {
      return errorResponse('Audio too large', 413);
    }

    const { res: geminiRes, model: usedModel } = await callGeminiWithFallback(env, {
      contents: [
        {
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: mimeType, data: audioBase64 } },
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
      },
    });
    console.log('[gemini] using model:', usedModel);

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

    if (!parsed.name) {
      return jsonResponse({ error: 'Could not understand the audio', food: parsed }, 422);
    }

    return jsonResponse({ food: parsed });
  } catch (error: any) {
    console.error('[handler] error:', error.message);
    return errorResponse('Internal error', 500);
  }
}
