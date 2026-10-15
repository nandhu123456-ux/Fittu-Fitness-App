import { auth } from './firebase';
import type { FoodResult } from './foodSearch';
import { estimateNutritionFromName } from './estimateNutrition';

const PARSE_VOICE_URL = 'https://be-fit-api.nanda-dev.workers.dev/api/parse-voice';

export interface VoiceParseResult {
  transcript: string;
  items: Array<{
    name: string;
    quantity: string;
    cal: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

/**
 * Stage 1 — Transcribe audio via the Worker's Groq Whisper endpoint.
 * Returns the transcript (and any items the backend pre-parsed, which the
 * caller may ignore to keep the flow explicit and user-controlled).
 *
 * Returns an empty result on failure rather than throwing, so the caller can
 * show a meaningful error and let the user retry.
 */
export async function parseVoice(
  audioBase64: string,
  mimeType: string
): Promise<VoiceParseResult> {
  try {
    const user = auth.currentUser;
    if (!user) return { transcript: '', items: [] };

    const idToken = await user.getIdToken();
    const res = await fetch(PARSE_VOICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ audioBase64, mimeType }),
    });

    if (!res.ok) return { transcript: '', items: [] };

    const data = await res.json();
    return {
      transcript: String(data?.transcript ?? ''),
      items: Array.isArray(data?.items) ? data.items : [],
    };
  } catch (e) {
    console.warn('[voiceLog] parseVoice failed', e);
    return { transcript: '', items: [] };
  }
}

/**
 * Stage 2 — Analyse a confirmed, user-edited transcript.
 *
 * This is the ONLY remote call made after the user presses "Analyse meal".
 * It reuses the existing /api/estimate-nutrition endpoint via
 * estimateNutritionFromName, so no new endpoint, request shape, or response
 * property is introduced.
 *
 * Returns null when the text is empty, the user is not authenticated, or the
 * remote call fails for any reason.
 */
export async function analyzeFoodText(text: string): Promise<FoodResult | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return estimateNutritionFromName(trimmed);
}