import {
  Env,
  verifyFirebaseToken,
  callGroq,
  jsonResponse,
  errorResponse,
  extractAuthHeader,
} from './shared';

const TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

const MIME_EXT_MAP: Record<string, string> = {
  'audio/m4a': 'm4a',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
};

const PARSE_PROMPT = `You are a nutrition analyst. The user said: "{transcript}"

Extract every food item mentioned with estimated nutrition. Split multi-item descriptions into separate entries.

Return ONLY valid JSON:
{
  "items": [
    { "name": "Roti", "quantity": "2 pieces", "cal": 210, "protein": 6, "carbs": 40, "fat": 2 }
  ]
}

Rules:
- Use typical Indian portion sizes
- Round calories to whole numbers, macros to 1 decimal
- If no food is mentioned, return {"items": []}`;

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

    // ---- Step 1: Transcribe via Groq Whisper ----
    const binary = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    const ext = MIME_EXT_MAP[mimeType] ?? 'm4a';

    const formData = new FormData();
    const blob = new Blob([binary], { type: mimeType });
    formData.append('file', blob, `audio.${ext}`);
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');
    formData.append('language', 'en');
    formData.append('prompt', 'Food logging. Indian dishes like roti, dal, idli, dosa, biryani.');

    const transcribeRes = await fetch(TRANSCRIBE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
      body: formData,
    });

    if (!transcribeRes.ok) {
      const err = await transcribeRes.text();
      console.error('[whisper] error', transcribeRes.status, err);
      return errorResponse('Transcription failed', 502);
    }

    const { text: transcript } = await transcribeRes.json();
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return jsonResponse({ transcript: '', items: [] });
    }

    // ---- Step 2: Parse transcript to food items via Groq text model ----
    const parsePrompt = PARSE_PROMPT.replace('{transcript}', transcript);

    const parseRes = await callGroq(env, {
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: parsePrompt }],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    if (!parseRes.ok) {
      console.error('[parse-voice] groq text error', parseRes.status);
      return errorResponse('Parse failed', 502);
    }

    const parseData: any = await parseRes.json();
    const parseText = parseData?.choices?.[0]?.message?.content ?? '';

    let parsed: any;
    try {
      parsed = JSON.parse(parseText);
    } catch {
      console.error('[parse-voice] non-JSON:', parseText.slice(0, 200));
      return errorResponse('Invalid JSON from parser', 502);
    }

    return jsonResponse({
      transcript: transcript.trim(),
      items: Array.isArray(parsed.items) ? parsed.items : [],
    });
  } catch (error: any) {
    console.error('[handler] error:', error.message);
    return errorResponse('Internal error', 500);
  }
}