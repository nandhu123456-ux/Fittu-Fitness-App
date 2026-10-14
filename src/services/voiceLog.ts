import { auth } from './firebase';
import type { FoodResult } from './foodSearch';

const VOICE_URL = 'https://be-fit-api.nanda-dev.workers.dev/api/parse-voice';

/**
 * Sends recorded audio to the Worker's Gemini parser and returns a FoodResult.
 * `audioBase64` is the raw base64 payload (no data: prefix), `mimeType` e.g.
 * 'audio/m4a' or 'audio/webm'. Returns null on any failure (auth, network,
 * unparseable audio) — callers treat null as "couldn't understand".
 */
export async function parseVoice(audioBase64: string, mimeType: string): Promise<FoodResult | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const idToken = await user.getIdToken();

    const res = await fetch(VOICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ audioBase64, mimeType }),
    });

    const data = await res.json();
    // 422 = understood but couldn't identify; both are "no usable food".
    if (!res.ok || !data.food || !data.food.name) return null;

    return {
      id: `voice_${Date.now()}`,
      name: String(data.food.name),
      source: 'usda',
      serving: String(data.food.serving ?? '1 serving'),
      cal: Number(data.food.cal ?? 0),
      protein: Number(data.food.protein ?? 0),
      carbs: Number(data.food.carbs ?? 0),
      fat: Number(data.food.fat ?? 0),
    };
  } catch (e) {
    console.error('[voiceLog] error', e);
    return null;
  }
}
