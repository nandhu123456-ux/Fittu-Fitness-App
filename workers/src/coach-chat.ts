import {
  Env,
  verifyFirebaseToken,
  fetchWithRetry,
  jsonResponse,
  errorResponse,
  extractAuthHeader,
  fetchFirestoreDoc,
} from './shared';

export async function handleCoachChat(request: Request, env: Env): Promise<Response> {
  try {
    const idToken = extractAuthHeader(request);
    if (!idToken) return errorResponse('Missing auth', 401);

    let uid: string;
    try {
      uid = await verifyFirebaseToken(idToken, env);
    } catch {
      return errorResponse('Invalid auth', 401);
    }

    const body: any = await request.json();
    const { message, history } = body ?? {};

    if (!message || typeof message !== 'string' || message.trim().length < 1) {
      return errorResponse('Message required', 400);
    }

    const userDoc = await fetchFirestoreDoc(env, `users/${uid}`, idToken);
    const targets = userDoc?.targets?.mapValue?.fields;
    const goal = userDoc?.goal?.mapValue?.fields;

    const targetCal = targets?.calories?.integerValue ?? '—';
    const targetProtein = targets?.protein?.integerValue ?? '—';
    const goalType = goal?.type?.stringValue ?? 'maintain';
    const userName = userDoc?.displayName?.stringValue ?? 'there';
    const streakDays = userDoc?.streakDays?.integerValue ?? 0;
    const lastWeight = userDoc?.profile?.mapValue?.fields?.weightKg?.integerValue ?? null;
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 11 ? 'morning' : hour < 16 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

    const today = new Date().toISOString().slice(0, 10);
    const logsUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/foodLogs/${uid}/entries?pageSize=50`;
    const logsRes = await fetch(logsUrl, {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    let todayTotals = { cal: 0, protein: 0, carbs: 0, fat: 0 };
    let mealSummary = 'No meals logged today';

    if (logsRes.ok) {
      const logsData: any = await logsRes.json();
      const docs = logsData.documents ?? [];
      const todayEntries = docs.filter((d: any) => d.fields?.date?.stringValue === today);

      if (todayEntries.length > 0) {
        for (const entry of todayEntries) {
          todayTotals.cal += Number(entry.fields?.cal?.integerValue ?? 0);
          todayTotals.protein += Number(entry.fields?.protein?.doubleValue ?? 0);
          todayTotals.carbs += Number(entry.fields?.carbs?.doubleValue ?? 0);
          todayTotals.fat += Number(entry.fields?.fat?.doubleValue ?? 0);
        }
        mealSummary = todayEntries
          .map(
            (e: any) =>
              `${e.fields?.mealType?.stringValue ?? 'meal'}: ${e.fields?.name?.stringValue ?? 'food'} (${e.fields?.cal?.integerValue ?? 0} kcal)`
          )
          .join('; ');
      }
    }

    const systemPrompt = `You are a supportive, motivating nutrition coach for ${userName}, who is using a weight loss app.

User context:
- Goal: ${goalType} weight
- Daily calorie target: ${targetCal} kcal
- Daily protein target: ${targetProtein}g
- Today's intake: ${Math.round(todayTotals.cal)} kcal, ${Math.round(todayTotals.protein)}g protein, ${Math.round(todayTotals.carbs)}g carbs, ${Math.round(todayTotals.fat)}g fat
- Today's meals: ${mealSummary}
- Current streak: ${streakDays} days
- Last logged weight: ${lastWeight ?? 'unknown'} kg
- Time of day: ${timeOfDay}

Response style:
- Be warm, concise, specific. Max 3 sentences.
- If the user's message is emotional (frustrated, giving up, celebrating), ALWAYS acknowledge that emotion FIRST, then respond.
- Once every 3-4 replies, include ONE short motivational line — either a well-known quote OR your own encouraging line — that fits their situation:
  * If they're on a streak → praise consistency
  * If they broke a streak → "the best time to restart is right now"
  * If they overate → no shame, just "one meal doesn't define a week"
  * If they're consistent → "this is what progress looks like"
  * If weight is trending down → celebrate the trend, not the number
- Never quote the same motivational line twice in the same conversation.
- Never shame. Frame slips as data, not failure.
- If asked medical questions, redirect to a professional.
- Use their numbers only when relevant. Don't spam stats.`;

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        if (msg.role && msg.content) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(msg.content) }],
          });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    const geminiRes = await fetchWithRetry(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
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
    if (!textResponse) {
      console.error('[gemini] empty text. finishReason:', geminiData?.candidates?.[0]?.finishReason);
      console.error('[gemini] parts:', JSON.stringify(geminiData?.candidates?.[0]?.content?.parts));
      return errorResponse('Gemini returned no content', 502);
    }

    return jsonResponse({ reply: textResponse });
  } catch (error: any) {
    console.error('[handler] error:', error.message);
    return errorResponse('Internal error', 500);
  }
}