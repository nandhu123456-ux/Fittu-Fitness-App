import { auth } from './firebase';
import type { FoodResult } from './foodSearch';

const VOICE_URL = 'https://be-fit-api.nanda-dev.workers.dev/api/parse-voice';

interface VoiceItem {
  name?: string;
  quantity?: string;
  cal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface VoiceResponse {
  transcript?: string;
  items?: VoiceItem[];
}

/**
 * Sends recorded audio to the Worker's Groq Whisper parser and returns a
 * FoodResult (the first parsed item). `audioBase64` is the raw base64 payload
 * (no data: prefix), `mimeType` e.g. 'audio/m4a' or 'audio/webm'. Returns null
 * on any failure (auth, network, unparseable audio) — callers treat null as
 * "couldn't understand".
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

    const data: VoiceResponse = await res.json();
    // Non-200 or no usable items → treat as "couldn't understand".
    if (!res.ok || !Array.isArray(data.items) || data.items.length === 0) return null;

    const item = data.items[0];
    if (!item || !item.name) return null;

    return {
      id: `voice_${Date.now()}`,
      name: String(item.name),
      source: 'usda',
      serving: String(item.quantity ?? '1 serving'),
      cal: Number(item.cal ?? 0),
      protein: Number(item.protein ?? 0),
      carbs: Number(item.carbs ?? 0),
      fat: Number(item.fat ?? 0),
    };
  } catch (e) {
    console.error('[voiceLog] error', e);
    return null;
  }
}