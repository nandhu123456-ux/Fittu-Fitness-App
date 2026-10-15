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

export interface VoiceParseResult {
  food: FoodResult | null;
  transcript: string;
}

/**
 * Sends recorded audio to the Worker's Groq Whisper parser and returns both
 * the recognised transcript and a FoodResult (the first parsed item).
 * `audioBase64` is the raw base64 payload (no data: prefix), `mimeType` e.g.
 * 'audio/m4a' or 'audio/webm'. Returns `{ food: null, transcript }` on any
 * failure where a transcript was still recovered; `{ food: null, transcript: '' }`
 * when nothing could be understood.
 */
export async function parseVoice(audioBase64: string, mimeType: string): Promise<VoiceParseResult> {
  try {
    const user = auth.currentUser;
    if (!user) return { food: null, transcript: '' };

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
    const transcript = typeof data.transcript === 'string' ? data.transcript.trim() : '';

    if (!res.ok || !Array.isArray(data.items) || data.items.length === 0) {
      return { food: null, transcript };
    }

    const item = data.items[0];
    if (!item || !item.name) return { food: null, transcript };

    return {
      food: {
        id: `voice_${Date.now()}`,
        name: String(item.name),
        source: 'usda',
        serving: String(item.quantity ?? '1 serving'),
        cal: Number(item.cal ?? 0),
        protein: Number(item.protein ?? 0),
        carbs: Number(item.carbs ?? 0),
        fat: Number(item.fat ?? 0),
      },
      transcript,
    };
  } catch (e) {
    console.error('[voiceLog] error', e);
    return { food: null, transcript: '' };
  }
}